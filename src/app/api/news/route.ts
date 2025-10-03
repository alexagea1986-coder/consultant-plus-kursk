import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Updated mapping for user's profiles to consultant.ru checkboxes
const profileToScopes: { [key: string]: string } = {
  accounting_hr: 'accountant',
  lawyer: 'jurist',
  budget_accounting: 'jurist,budget,procurements,hr,medicine,nta',
  procurements: 'procurements',
  hr: 'hr',
  labor_safety: 'hr',
  nta: 'nta',
  universal: 'accountant,jurist,procurements,hr,medicine,nta',
  universal_budget: 'accountant,jurist,budget,procurements,hr,medicine,nta'
}

async function fetchNewsForScopes(scopes: string): Promise<any[]> {
  const now = Date.now()
  const cacheKey = `all_${scopes}` // Prefix for all news or filtered
  
  // Check cache
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await page.goto('https://www.consultant.ru/legalnews/', { waitUntil: 'networkidle2' })

    // Simulate checkbox clicks for scopes (direct link to source checkboxes)
    // Checkboxes selectors based on site structure: labels or inputs with scope names
    const scopeMap: Record<string, string> = {
      accountant: 'label[for="scope-accountant"], input[name*="accountant"]', // Adjust based on actual selectors
      jurist: 'label[for="scope-jurist"], input[name*="jurist"]',
      budget: 'label[for="scope-budget"], input[name*="budget"]',
      procurements: 'label[for="scope-procurements"], input[name*="procurements"]',
      hr: 'label[for="scope-hr"], input[name*="hr"]',
      medicine: 'label[for="scope-medicine"], input[name*="medicine"]',
      nta: 'label[for="scope-nta"], input[name*="nta"]'
    }

    // For "all news" (initial load): ensure no filters or click all/uncheck all if needed
    if (!scopes || scopes === 'all') {
      // Click "All news" or clear filters - site base loads all by default
      // If site auto-selects, uncheck all first then skip
      await page.evaluate(() => {
        // Simulate "Все новости" - clear scopes if any
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
      })
    } else {
      // Clear all first
      await page.evaluate(() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false)
      })
      // Click selected scopes
      const selected = scopes.split(',')
      for (const scope of selected) {
        const selector = scopeMap[scope] || `input[value="${scope}"]`
        await page.click(selector, { delay: 100 })
        await page.waitForTimeout(500) // Wait for each click
      }
    }

    // Wait for JS filter to apply
    await page.waitForTimeout(3000) // 3 sec for client-side update

    // Scrape visible news (only displayed items)
    const news = await page.evaluate(() => {
      const items: any[] = []
      // Select visible news elements (adjust selectors based on site DOM)
      document.querySelectorAll('.ln-item.visible, .news-item:not(.hidden), article[role="article"]').forEach((el: Element) => {
        if (items.length >= 5) return
        
        const linkEl = el.querySelector('a[href*="/legalnews/"]') as HTMLAnchorElement
        if (!linkEl || !linkEl.href.match(/\d+\/$/)) return
        
        const fullLink = linkEl.href
        const titleEl = el.querySelector('.ln-item__title, h3, .news-title') as HTMLElement
        const title = titleEl?.textContent?.trim().replace(/\s+/g, ' ') || ''
        
        const dateEl = el.querySelector('.ln-item__date, .news-date, time') as HTMLElement
        const date = dateEl?.textContent?.trim() || new Date().toLocaleDateString('ru-RU')
        
        const descEl = el.querySelector('.ln-item__description, .news-description, p') as HTMLElement
        const description = descEl?.textContent?.trim() || ''
        
        if (title.length > 10) {
          items.push({ title, date, description, link: fullLink })
        }
      })
      return items
    })

    const result = news.slice(0, 5)
    
    // Update cache
    newsCache[cacheKey] = { data: result, timestamp: now }
    
    return result
  } catch (err) {
    console.error(`Error with Puppeteer for scopes ${scopes}:`, err)
    return []
  } finally {
    await browser.close()
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedProfile = searchParams.get('profile')
    const requestedScopes = searchParams.get('scopes') || 'all' // Default to all news

    let news
    if (requestedScopes !== 'all' && requestedScopes) {
      news = await fetchNewsForScopes(requestedScopes)
    } else if (requestedProfile && profileToScopes[requestedProfile]) {
      news = await fetchNewsForScopes(profileToScopes[requestedProfile])
    } else {
      // Initial load: all news
      news = await fetchNewsForScopes('all')
    }

    return NextResponse.json({ news })
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any[]; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Mapping for profiles (for future use)
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

async function fetchNews(scopes?: string): Promise<any[]> {
  const now = Date.now()
  const cacheKey = scopes || 'all'
  
  // Check cache
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  try {
    // Fetch HTML from consultant.ru (all news by default, as site loads all scopes enabled)
    const response = await axios.get('https://www.consultant.ru/legalnews/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    })
    const html = response.data
    const $ = cheerio.load(html)

    const items: any[] = []
    // Parse news items from HTML structure (based on site: .ln-item or similar links)
    $('a[href*="/legalnews/"').each((i, el) => {
      if (items.length >= 5) return false // Limit to 5

      const linkEl = $(el)
      const href = linkEl.attr('href')
      if (!href || !href.match(/\d+\/$/)) return true

      const fullLink = href.startsWith('http') ? href : 'https://www.consultant.ru' + href
      const title = linkEl.text().trim().replace(/\s+/g, ' ')
      if (title.length < 10) return true

      // Find date and description in parent or next elements
      const parent = linkEl.closest('.ln-item, article, .news-item')
      let date = parent.find('.ln-item__date, .date, time').text().trim() || new Date().toLocaleDateString('ru-RU')
      let description = parent.find('.ln-item__description, .description, p').first().text().trim().replace(/\s+/g, ' ') || ''

      // Avoid duplicates
      if (!items.some(item => item.title === title)) {
        items.push({ title, date, description, link: fullLink })
      }
    })

    const result = items.slice(0, 5)
    
    // Update cache (ignore scopes for now, as site doesn't filter server-side)
    newsCache[cacheKey] = { data: result, timestamp: now }
    
    return result
  } catch (err) {
    console.error('News fetch error:', err)
    return [] // Empty on error
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedProfile = searchParams.get('profile')
    const requestedScopes = searchParams.get('scopes')

    // For now, load all news (scopes/profile ignored until dynamic filtering fixed)
    const news = await fetchNews(requestedScopes || (requestedProfile ? profileToScopes[requestedProfile] : undefined))

    return NextResponse.json({ news })
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ news: [], error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
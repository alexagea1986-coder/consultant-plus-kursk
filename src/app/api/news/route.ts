import { NextResponse } from 'next/server'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Profile to scopes mapping
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

// Label map for russian checkbox labels
const labelMap: { [key: string]: string } = {
  accountant: 'Бухгалтер',
  jurist: 'Юрист',
  budget: 'Бухгалтер (бюджет)',
  procurements: 'Закупки',
  hr: 'Кадры',
  medicine: 'Здравоохранение',
  nta: 'НТА'
}

async function fetchNewsForScopes(scopes: string): Promise<any[]> {
  const now = Date.now()
  const cacheKey = `playwright_${scopes.replace(/,/g, '_')}`
  
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu'
      ]
    })
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    })
    
    const page = await context.newPage()
    
    await page.goto('https://www.consultant.ru/legalnews/', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for page to load fully, including dynamic content
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Wait for checkboxes container to appear
    await page.waitForSelector('.filters, .scopes, input[type="checkbox"]', { timeout: 10000 })

    const requestedScopesArray = scopes.split(',').map(s => s.trim())

    // Robust checkbox selection: use multiple strategies
    // Strategy 1: By label text (getByText then find input)
    // Strategy 2: By data-value or name attributes
    // Strategy 3: By partial text matching

    // First, check all target profiles using multiple locators
    for (const scope of requestedScopesArray) {
      const label = labelMap[scope]
      if (!label) continue

      let checkboxLocator = null

      // Try getByLabel first
      try {
        checkboxLocator = page.getByLabel(label).locator('input[type="checkbox"]')
        await checkboxLocator.check({ force: true, timeout: 5000 })
        console.log(`Checked ${label} via getByLabel`)
      } catch (e1) {
        // Fallback 1: Get by text content of label
        try {
          const labelElement = page.getByText(label, { exact: true }).first()
          checkboxLocator = labelElement.locator('input[type="checkbox"]').first()
          await checkboxLocator.check({ force: true, timeout: 3000 })
          console.log(`Checked ${label} via text label`)
        } catch (e2) {
          // Fallback 2: Attribute-based selectors
          const attrSelectors = [
            `input[type="checkbox"][value*="${scope}"]`,
            `input[type="checkbox"][name*="${scope}"]`,
            `input[type="checkbox"][data-scope*="${scope}"]`,
            `input[type="checkbox"][id*="${scope}"]`
          ]
          
          let found = false
          for (const sel of attrSelectors) {
            try {
              checkboxLocator = page.locator(sel).first()
              if (await checkboxLocator.count() > 0) {
                await checkboxLocator.check({ force: true })
                console.log(`Checked ${label} via attribute selector: ${sel}`)
                found = true
                break
              }
            } catch {}
          }
          
          if (!found) {
            console.warn(`Could not find checkbox for ${label}`)
          }
        }
      }

      // Wait after checking each
      await page.waitForTimeout(800)
    }

    // Ensure at least one is checked before unchecking others
    const checkedCount = await page.locator('input[type="checkbox"]:checked').count()
    console.log(`Checked count before unchecking: ${checkedCount}`)

    // Now uncheck non-targets ONLY if we have more than 1 checked
    if (checkedCount > 1) {
      const allScopes = Object.keys(labelMap)
      const nonTargetScopes = allScopes.filter(s => !requestedScopesArray.includes(s))
      
      for (const scope of nonTargetScopes) {
        const label = labelMap[scope]
        if (!label) continue

        try {
          let checkboxLocator = null

          // Same multi-strategy for uncheck
          try {
            checkboxLocator = page.getByLabel(label).locator('input[type="checkbox"]')
            await checkboxLocator.uncheck({ force: true, timeout: 3000 })
            console.log(`Unchecked ${label} via getByLabel`)
          } catch (e) {
            try {
              const labelElement = page.getByText(label, { exact: true }).first()
              checkboxLocator = labelElement.locator('input[type="checkbox"]').first()
              await checkboxLocator.uncheck({ force: true })
              console.log(`Unchecked ${label} via text label`)
            } catch (e2) {
              const attrSelectors = [
                `input[type="checkbox"][value*="${scope}"]`,
                `input[type="checkbox"][name*="${scope}"]`,
                `input[type="checkbox"][data-scope*="${scope}"]`,
                `input[type="checkbox"][id*="${scope}"]`
              ]
              
              for (const sel of attrSelectors) {
                try {
                  checkboxLocator = page.locator(sel).first()
                  if (await checkboxLocator.isChecked()) {
                    await checkboxLocator.uncheck({ force: true })
                    console.log(`Unchecked ${label} via attribute: ${sel}`)
                    break
                  }
                } catch {}
              }
            }
          }

          await page.waitForTimeout(500)
        } catch (err) {
          console.log(`Could not uncheck ${label}:`, err.message)
        }
      }
    } else {
      console.log('Skipping uncheck: only 1 or 0 checkboxes checked')
    }

    // Wait for the filtering to take effect - observe DOM changes
    await page.waitForTimeout(4000)

    // Optional: Wait for news container to update (look for changes in visible news)
    try {
      await page.waitForFunction(() => {
        const newsVisible = document.querySelectorAll('a[href*="/legalnews/"]:not([style*="display: none"])').length > 0
        return newsVisible
      }, { timeout: 10000 })
    } catch (e) {
      console.log('News container update timeout, proceeding anyway')
    }

    // Enhanced scraping: get all visible news links
    const news = await page.evaluate(() => {
      const newsItems: any[] = []
      
      // Multiple selectors for news containers
      const containerSelectors = ['.news-list', '.ln-container', '.results', 'main', '.content']
      let container = null
      
      for (const sel of containerSelectors) {
        const el = document.querySelector(sel)
        if (el && el.children.length > 0) {
          container = el
          break
        }
      }
      
      if (!container) {
        container = document.body
      }

      // Find visible news links within container
      const links = container.querySelectorAll('a[href*="/legalnews/"]:not([style*="display: none"]):not(.hidden)')
      
      links.forEach((link, index) => {
        if (newsItems.length >= 8) return // Get extra to ensure 5 good ones
        
        const titleElement = link.querySelector('h1, h2, h3, .title') || link
        const title = titleElement.textContent?.trim() || link.textContent?.trim() || ''
        
        if (title.length < 15) return // Minimum title length

        const parentItem = link.closest('article, .item, li, .news-card, div[role="article"]') || link.parentElement
        let date = new Date().toLocaleDateString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        })

        // Try to extract date more accurately
        const dateSelectors = ['.date', 'time', '.datetime', '[data-date]']
        for (const dateSel of dateSelectors) {
          const dateEl = parentItem?.querySelector(dateSel) || link.querySelector(dateSel)
          if (dateEl) {
            const dateText = dateEl.textContent?.trim()
            if (dateText && (dateText.match(/^(Сегодня|Вчера|\d{1,2}\.?\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)?\s*\d{4})/i) || dateText.length < 20)) {
              date = dateText
              break
            }
          }
        }

        // Description from next elements
        let description = ''
        const descSelectors = ['.description', '.summary', '.excerpt', 'p', '.text']
        for (const descSel of descSelectors) {
          let descEl = parentItem?.querySelector(descSel)
          if (!descEl) descEl = link.nextElementSibling?.querySelector(descSel)
          if (descEl && descEl.textContent?.trim().length > 10) {
            description = descEl.textContent.trim().replace(/\s+/g, ' ')
            break
          }
        }

        const href = link.getAttribute('href') || ''
        if (!href.includes('/legalnews/')) return

        const fullLink = href.startsWith('http') ? href : `https://www.consultant.ru${href}`

        // Deduplicate by title
        if (title && !newsItems.some(item => item.title.includes(title.substring(0, 50)))) { // Partial match for dedup
          newsItems.push({
            title: title.replace(/\s+/g, ' ').trim(),
            date,
            description: description.substring(0, 200), // Limit length
            link: fullLink
          })
        }
      })

      return newsItems.filter(item => item.title.length > 20).slice(0, 5) // Final filter
    })

    await browser.close()

    if (news.length === 0) {
      console.warn(`Playwright got 0 news for ${scopes}, using keyword fallback`)
      return await fetchNewsWithKeywords(scopes)
    }

    newsCache[cacheKey] = { data: news, timestamp: now }
    return news

  } catch (err: any) {
    console.error(`Playwright failed for ${scopes}:`, err.message)
    return await fetchNewsWithKeywords(scopes)
  }
}

// Enhanced keywords for HR based on recent news patterns - expanded significantly
const keywords: { [key: string]: string[] } = {
  accountant: ['бухгалтерский', 'учет', 'налог', 'nds', 'ндфл', 'усн', 'отчетность', 'бухгалтерия', 'финансовый', 'аудит', 'бухгалтер', 'расчет', 'амортизация', 'баланс'],
  jurist: ['право', 'закон', 'суд', 'арбитраж', 'гражданский', 'уголовный', 'административный', 'юридический', 'контракт', 'договор', 'иск', 'поправка', 'решение', 'прокурор', 'адвокат'],
  budget: ['бюджетный', 'государственный', 'казначейство', 'субсидия', 'трансферт', 'финансирование', 'ассигнование', 'дефицит', 'доходы', 'расходы', 'бюджет'],
  procurements: ['закупки', 'тендер', 'аукцион', '44-ФЗ', '223-ФЗ', 'поставка', 'конкурс', 'торги', 'поставщик', 'исполнение контракта', 'закупка'],
  hr: ['кадровый', 'трудовой', 'зарплата', 'отпуск', 'увольнение', 'прием', 'трудовой договор', 'охрана труда', 'кадры', 'персонал', 'мотивация', 'оценка', 'аттестация', 'кадровик', 'кадровика', 'тк рф', 'трудовой кодекс', 'найм', 'трудоустройство', 'квоты', 'инвалид', 'изменения для кадровика', 'трудовые отношения', 'трудовые спора', 'дисциплинарный', 'коллективный договор', 'трудовая инспекция', 'профсоюз', 'стажировка', 'компенсация', 'премия', 'график работы', 'сверхурочные', 'командировка', 'больничный', 'трудоустройство', 'трудовые отношения', 'кадровые изменения', 'персонал', 'сотрудник', 'работодатель', 'мигрантов', 'патент', 'иностранцев', 'несовершеннолетние', 'высококвалифицированный', 'премии', 'материальной ответственности', 'командировках', 'отпуска', 'усыновившем', 'трудовое законодательство', 'кадровая', 'работники', 'сотрудники', 'труд', 'кадровая политика', 'трудовые права', 'работа', 'занятость', 'трудовые споры', 'трудовой стаж', 'трудовая книжка', 'электронная трудовая книжка', 'трудовой договор', 'увольнение по сокращению', 'трудовая дискриминация', 'защита трудовых прав', 'трудовые инспекции', 'профсоюзы', 'коллективные переговоры'],
  medicine: ['медицинский', 'здравоохранение', 'лекарство', 'больница', 'врач', 'пациент', 'фармацевтический', 'диагностика', 'профилактика', 'реабилитация', 'медпомощь', 'лицензирование'],
  nta: ['нормативный', 'технический', 'стандарт', 'ГОСТ', 'техрегламент', 'сертификация', 'аккредитация', 'контроль', 'соответствие', 'норматив', 'акты', 'технические требования']
}

// Improved keyword fallback - more robust parsing and lower threshold for HR
async function fetchNewsWithKeywords(scopes: string): Promise<any[]> {
  const cacheKey = `keywords_${scopes.replace(/,/g, '_')}`
  const now = Date.now()
  
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  const requestedScopesArray = scopes.split(',')
  const allKeywords = requestedScopesArray.flatMap(scope => keywords[scope] || []).filter(Boolean)

  if (allKeywords.length === 0) return []

  try {
    const url = 'https://www.consultant.ru/legalnews/'
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!res.ok) return []

    const html = await res.text()
    const cheerio = await import('cheerio')
    const { load } = cheerio
    const $ = load(html)
    
    const allNews: any[] = []
    
    // Target all potential news items more aggressively
    const potentialNews = $('.news-item, article, .news-card, li, div[href*="/legalnews/"], a[href*="/legalnews/"]').toArray()
    
    potentialNews.forEach(item => {
      if (allNews.length >= 30) return
      
      const $item = $(item)
      let $link = $item.find('a[href*="/legalnews/"]').first()
      if ($link.length === 0) $link = $item.is('a') ? $item : null
      if (!$link || !$link.attr('href')) return
      
      const href = $link.attr('href') || ''
      if (!href.match(/\d+\/$/)) return
      
      const fullLink = href.startsWith('http') ? href : `https://www.consultant.ru${href}`
      
      // Extract title from link text or parent
      let titleText = $link.text().trim().replace(/\s+/g, ' ')
      const $titleParent = $link.parent().length ? $link.parent().text().trim().replace(/\s+/g, ' ') : ''
      if ($titleParent.length > titleText.length && $titleParent !== titleText) {
        titleText = $titleParent.substring(0, 100) // Limit to reasonable length
      }
      
      // Clean title: remove dates from beginning if present
      const datePattern = /^(Сегодня|Вчера|\d{1,2}\.\d{2}\.\d{4}|\d{1,2}\s+(январ|феврал|март|апрел|ма[йя]|июн[ья]|июл[ья]|август|сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])\s+\d{4})/i
      const dateMatch = titleText.match(datePattern)
      if (dateMatch) {
        const date = dateMatch[0]
        titleText = titleText.replace(date, '').trim()
      }
      
      let date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      
      // Try multiple date sources
      const allDateSelectors = ['.date', 'time', '.datetime', '[data-date]', '.news-date', '.published']
      const $container = $link.closest('article, .item, li, div')
      let dateEl = $container.find(allDateSelectors.join(', ')).first()
      if (dateEl.length === 0) dateEl = $link.siblings(allDateSelectors.join(', ')).first()
      if (dateEl.length === 0) dateEl = $link.closest('li, div').prevAll().find(allDateSelectors.join(', ')).first()
      
      if (dateEl && dateEl.length > 0) {
        let dateText = dateEl.text().trim()
        const match = dateText.match(datePattern)
        if (match) date = match[0]
      }
      
      // Description extraction - look in siblings, parent children, next elements
      let description = ''
      const allDescSelectors = ['p', '.description', '.summary', '.excerpt', '.lead', '.text', '.content']
      let descEl = $link.siblings(allDescSelectors.join(', ')).not(':has(a)').first()
      if (descEl.length === 0) {
        descEl = $container.children(allDescSelectors.join(', ')).not($link.closest(allDescSelectors.join(', '))).first()
      }
      if (descEl.length === 0) {
        descEl = $link.nextAll('p, div').first().find('p').first()
      }
      if (descEl.length > 0 && descEl.text().trim().length > 15) {
        description = descEl.text().trim().replace(/\s+/g, ' ').substring(0, 250)
      }
      
      // Partial word matching for keywords (stemming-like)
      const fullText = (titleText + ' ' + description).toLowerCase()
      const score = allKeywords.reduce((sum, kw) => {
        // Check exact, and also if keyword is substring (partial match)
        const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()
        if (new RegExp(`\\b${escapedKw}\\b`).test(fullText) || fullText.includes(kw.toLowerCase())) {
          return sum + 1
        }
        return sum
      }, 0)
      
      // Even lower threshold: at least 1 match, title > 10 chars
      if (titleText.length > 10 && score >= 1 && titleText.length > 5 && !allNews.some(existing => 
        existing.title.toLowerCase().includes(titleText.toLowerCase().substring(0, 20)) || 
        titleText.toLowerCase().includes(existing.title.toLowerCase().substring(0, 20))
      )) {
        allNews.push({ 
          title: titleText, 
          date, 
          description, 
          link: fullLink,
          relevanceScore: score
        })
      }
    })

    // Sort by relevance, then by date recency (if possible)
    allNews.sort((a, b) => {
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0)
      if (scoreDiff !== 0) return scoreDiff
      
      // Simple date sort: today > yesterday > others
      const dateOrder = { 'Сегодня': 3, 'Вчера': 2, '03.10.2025': 1 }
      const aOrder = dateOrder[a.date] || 0
      const bOrder = dateOrder[b.date] || 0
      return bOrder - aOrder
    })

    const result = allNews.slice(0, 5)
    
    console.log(`Enhanced keyword fallback found ${result.length} news for ${scopes}. Sample keywords:`, allKeywords.slice(0, 3), 'Sample titles:', result.map(n => n.title.substring(0, 50)))
    
    newsCache[cacheKey] = { data: result, timestamp: now }
    return result
  } catch (err) {
    console.error('Enhanced keyword fallback error:', err)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profile = searchParams.get('profile')
    const scopesParam = searchParams.get('scopes')
    
    let scopes = scopesParam
    if (!scopes && profile && profileToScopes[profile]) {
      scopes = profileToScopes[profile]
    }
    
    if (!scopes) {
      // Default to universal
      scopes = 'accountant,jurist,procurements,hr,medicine,nta'
    }
    
    const news = await fetchNewsForScopes(scopes)
    return NextResponse.json({ news, scopes })
    
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Failed to load news' }, { status: 500 })
  }
}
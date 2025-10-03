import { NextResponse } from 'next/server'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Profile to scopes mapping (updated according to requirements)
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
  const cacheKey = scopes
  
  // Check cache
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  try {
    const url = `https://www.consultant.ru/legalnews/`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!res.ok) {
      console.warn(`Failed to fetch news for scopes: ${scopes}`)
      return []
    }

    const html = await res.text()
    const cheerio = await import('cheerio')
    const { load } = cheerio
    const $ = load(html)
    
    const requestedScopes = scopes.split(',')
    const news: any[] = []
    
    // Find news items with scope filtering
    $('[data-scopes]').each((i, el) => {
      if (news.length >= 5) return false
      
      const itemScopes = $(el).attr('data-scopes')?.split(',') || []
      
      // Check if this news item matches any of the requested scopes
      const hasMatchingScope = requestedScopes.some(scope => itemScopes.includes(scope))
      if (!hasMatchingScope) return
      
      const $link = $(el).find('a[href*="/legalnews/"]').first()
      const href = $link.attr('href')
      
      if (href && href.includes('/legalnews/') && href.match(/\d+\/$/)) {
        const fullLink = href.startsWith('http') ? href : `https://www.consultant.ru${href}`
        const titleEl = $(el).find('.ln-item__title, .news-title')
        const title = titleEl.text().trim().replace(/\s+/g, ' ')
        
        const dateEl = $(el).find('.ln-item__date, .news-date')
        let date = dateEl.text().trim() || new Date().toLocaleDateString('ru-RU')
        
        const descEl = $(el).find('.ln-item__description, .news-description')
        const description = descEl.text().trim()
        
        if (title.length > 10 && !news.some(item => item.title === title)) {
          news.push({ title, date, description, link: fullLink })
        }
      }
    })
    
    // If no scoped items found, fallback to parsing all news items
    if (news.length === 0) {
      $('a[href*="/legalnews/"]').each((i, el) => {
        if (news.length >= 5) return false
        
        const href = $(el).attr('href')
        if (href && href.includes('/legalnews/') && href.match(/\d+\/$/)) {
          const fullLink = href.startsWith('http') ? href : `https://www.consultant.ru${href}`
          const text = $(el).text().trim().replace(/\s+/g, ' ')
          
          let date = new Date().toLocaleDateString('ru-RU')
          let title = text
          const dateMatch = text.match(/^(Сегодня|Вчера|\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/i)
          if (dateMatch) {
            date = dateMatch[0].replace(/\n/g, ' ').trim()
            title = text.replace(dateMatch[0], '').replace(/\n+/g, ' ').trim()
          }
          
          let description = ''
          const nextEl = $(el).next()
          if (nextEl.length) {
            description = nextEl.text().trim()
          }
          
          if (title.length > 10 && !news.some(item => item.title === title)) {
            news.push({ title, date, description, link: fullLink })
          }
        }
      })
    }

    const result = news.slice(0, 5)
    
    // Update cache
    newsCache[cacheKey] = { data: result, timestamp: now }
    
    return result
  } catch (err) {
    console.error(`Error fetching news for scopes ${scopes}:`, err)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedProfile = searchParams.get('profile')
    const requestedScopes = searchParams.get('scopes')
    
    // If specific scopes requested directly
    if (requestedScopes) {
      const news = await fetchNewsForScopes(requestedScopes)
      return NextResponse.json({ news })
    }
    
    // If specific profile requested, fetch only that one
    if (requestedProfile && profileToScopes[requestedProfile]) {
      const news = await fetchNewsForScopes(profileToScopes[requestedProfile])
      return NextResponse.json({ profiles: { [requestedProfile]: news }, news })
    }
    
    // Otherwise, fetch all profiles in parallel
    const profileEntries = Object.entries(profileToScopes)
    const results = await Promise.all(
      profileEntries.map(([profile, scopes]) => 
        fetchNewsForScopes(scopes).then(news => ({ profile, news }))
      )
    )
    
    const allProfiles: Record<string, any[]> = {}
    results.forEach(({ profile, news }) => {
      allProfiles[profile] = news
    })

    return NextResponse.json({ profiles: allProfiles })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
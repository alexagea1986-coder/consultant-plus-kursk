import { NextResponse } from 'next/server'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Profile to scopes mapping
const profileToScopes: { [key: string]: string } = {
  universal: 'accountant,jurist,procurements,hr,medicine,nta', // All except budget
  accounting_hr: 'accountant',
  lawyer: 'jurist',
  budget_accounting: 'budget',
  procurements: 'procurements',
  hr: 'hr',
  labor_safety: 'medicine',
  nta: 'nta',
  universal_budget: 'accountant,jurist,budget,procurements,hr,medicine,nta' // All
}

async function fetchNewsForProfile(profile: string, scopes: string): Promise<any[]> {
  const now = Date.now()
  const cacheKey = profile
  
  // Check cache
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  try {
    const url = `https://www.consultant.ru/legalnews/?scopes=${scopes}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!res.ok) {
      console.warn(`Failed to fetch news for ${profile}`)
      return []
    }

    const html = await res.text()
    const cheerio = await import('cheerio')
    const { load } = cheerio
    const $ = load(html)
    
    const news: any[] = []
    
    // Parse news items
    $('a[href*="/legalnews/"]').each((i, el) => {
      if (news.length >= 5) return false // Stop after 5 items
      
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
        
        let description = $(el).next().text().trim() || ''
        if (description.length < 20) description = ''
        
        if (title.length > 10 && !news.some(item => item.title === title)) {
          news.push({ title, date, description, link: fullLink })
        }
      }
    })

    const result = news.slice(0, 5)
    
    // Update cache
    newsCache[cacheKey] = { data: result, timestamp: now }
    
    return result
  } catch (err) {
    console.error(`Error fetching news for ${profile}:`, err)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedProfile = searchParams.get('profile')
    
    // If specific profile requested, fetch only that one
    if (requestedProfile && profileToScopes[requestedProfile]) {
      const news = await fetchNewsForProfile(requestedProfile, profileToScopes[requestedProfile])
      return NextResponse.json({ profiles: { [requestedProfile]: news } })
    }
    
    // Otherwise, fetch all profiles in parallel
    const profileEntries = Object.entries(profileToScopes)
    const results = await Promise.all(
      profileEntries.map(([profile, scopes]) => 
        fetchNewsForProfile(profile, scopes).then(news => ({ profile, news }))
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
import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any[]; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

const parser = new Parser({
  customFields: {
    item: []
  }
})

async function fetchNews(): Promise<any[]> {
  const now = Date.now()
  const cacheKey = 'rss'
  
  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
    return newsCache[cacheKey].data
  }

  try {
    const feed = await parser.parseURL('http://www.consultant.ru/rss/hotdocs.xml')
    const items: any[] = feed.items.slice(0, 5).map(item => ({
      title: item.title || '',
      date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
      description: item.contentSnippet || item.description || '',
      link: item.link || ''
    }))

    newsCache[cacheKey] = { data: items, timestamp: now }
    return items
  } catch (err) {
    console.error('RSS fetch error:', err)
    return []
  }
}

export async function GET(request: Request) {
  try {
    // Ignore scopes/profile for RSS (general legal news)
    const news = await fetchNews()
    return NextResponse.json({ news })
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ news: [], error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
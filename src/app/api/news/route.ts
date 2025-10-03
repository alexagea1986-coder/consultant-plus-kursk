import Parser from 'rss-parser'
import { NextResponse } from 'next/server'

const parser = new Parser()

let newsCache = {}
const CACHE_DURATION = 10 * 60 * 1000

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scopes = searchParams.get('scopes') || 'all'
    const now = Date.now()
    const cacheKey = `rss_${scopes}`

    if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache[cacheKey].data })
    }

    const feed = await parser.parseURL('http://www.consultant.ru/rss/hotdocs.xml')
    const news = feed.items.slice(0, 5).map(item => ({
      title: item.title || '',
      date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
      description: item.contentSnippet || item.content || '',
      link: item.link || ''
    }))

    newsCache[cacheKey] = { data: news, timestamp: now }
    return NextResponse.json({ news })
  } catch (err) {
    console.error('RSS Error:', err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
import Parser from 'rss-parser'
import { NextResponse } from 'next/server'

const parser = new Parser()

let newsCache = {}
const CACHE_DURATION = 10 * 60 * 1000

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scopesParam = searchParams.get('scopes') || 'all'
    const now = Date.now()
    const cacheKey = `rss_${scopesParam}`

    if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache[cacheKey].data })
    }

    const feed = await parser.parseURL('http://www.consultant.ru/rss/hotdocs.xml')

    let news = feed.items.slice(0, 15).map(item => ({  // Take more to filter
      title: item.title || '',
      date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
      description: item.contentSnippet || item.content || '',
      link: item.link || ''
    }))

    if (scopesParam !== 'all') {
      const scopes = scopesParam.split(',')
      const keywordsByProfile = {
        accountant: ['налог', 'бухгалт', 'учет', 'финанс', 'бюджет', 'бухучет', 'налоговый'],
        jurist: ['право', 'гражданск', 'уголовн', 'правосудие', 'суд', 'семья', 'прокуратур', 'адвокатур', 'международн'],
        budget: ['бюджет', 'финанс', 'госуправлен', 'государств'],
        procurements: ['закупк', 'тендер', 'аукцион', 'контракт'],
        hr: ['труд', 'кадр', 'пособи', 'льгот', 'тк рф', 'трудовой'],
        medicine: ['медицин', 'здравоохран', 'лекарств', 'омс', 'минздрав'],
        nta: ['норматив', 'техническ', 'стандарт', 'природоохран', 'строительств', 'транспорт']
      }

      const allKeywords = new Set()
      scopes.forEach(scope => {
        const profileKey = keywordsByProfile[scope]
        if (profileKey) profileKey.forEach(kw => allKeywords.add(kw.toLowerCase()))
      })

      if (allKeywords.size > 0) {
        news = news.filter(item => {
          const lowerTitle = (item.title || '').toLowerCase()
          const lowerDesc = (item.description || '').toLowerCase()
          return Array.from(allKeywords).some(kw => lowerTitle.includes(kw) || lowerDesc.includes(kw))
        }).slice(0, 5)
      }
    } else {
      news = news.slice(0, 5)
    }

    newsCache[cacheKey] = { data: news, timestamp: now }
    return NextResponse.json({ news })
  } catch (err) {
    console.error('RSS Error:', err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
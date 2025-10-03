import Parser from 'rss-parser'
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio';

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

    let news = []

    if (scopesParam === 'all') {
      const feed = await parser.parseURL('https://www.consultant.ru/rss/hotdocs.xml')
      news = feed.items.slice(0, 5).map(item => ({
        title: item.title || '',
        date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
        description: item.contentSnippet || item.content || '',
        link: item.link || ''
      }))
    } else {
      const scope = scopesParam  // Assume single scope
      const themeMapping: { [key: string]: string } = {
        'hr': '41',  // Труд
        'accountant': '3204',  // Налоги
        'medicine': '3203',  // Медицина
        'procurements': '3196',  // Закупки
        'nta': '11',  // Природоохранное право (example, add more as needed)
        // Fallback keywords for un-mapped profiles
      }

      const tId = themeMapping[scope]
      if (tId) {
        const url = `https://www.consultant.ru/law/hotdocs/t${tId}/`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        })
        const html = await res.text()
        const $ = cheerio.load(html)

        // Parse hotdocs items - adjust selectors based on structure
        // Assumes structure like .hotdocs-item or li with date, a.title, desc
        const items = $('.hotdocs-item, .news-item, li:has(a), [class*="hotdoc"]').slice(0, 5)
        items.each((i, el) => {
          const $el = $(el)
          // Extract date (pattern match)
          const fullText = $el.text().trim()
          const dateMatch = fullText.match(/(\d{1,2}\s+[а-яё]+\s+\d{4})/)
          const date = dateMatch ? dateMatch[1] : ''
          if (!date) return

          // Title from first a
          const $a = $el.find('a').first()
          const title = $a.text().trim()
          if (!title) return

          let link = $a.attr('href')
          if (link && !link.startsWith('http')) {
            link = `https://www.consultant.ru${link}`
          }

          // Description: text after title, before next date
          let desc = fullText.replace(date, '').replace(title, '').replace(/\s+/g, ' ').trim()
          // Clean common suffixes
          desc = desc.replace(/\s*\(см\. аннотацию\)/, '').trim()

          news.push({ title, date, description: desc, link: link || '' })
        })

        // Fallback to keywords if no items scraped
        if (news.length === 0) {
          const feed = await parser.parseURL('https://www.consultant.ru/rss/hotdocs.xml')
          let allNews = feed.items.slice(0, 15).map(item => ({
            title: item.title || '',
            date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
            description: item.contentSnippet || item.content || '',
            link: item.link || ''
          }))

          const keywordsByProfile = {
            accountant: ['налог', 'бухгалт', 'учет', 'финанс', 'бюджет', 'бухучет', 'налоговый'],
            jurist: ['право', 'гражданск', 'уголовн', 'правосудие', 'суд', 'семья', 'прокуратур', 'адвокатур', 'международн'],
            budget: ['бюджет', 'финанс', 'госуправлен', 'государств'],
            procurements: ['закупк', 'тендер', 'аукцион', 'контракт'],
            hr: ['труд', 'кадр', 'пособи', 'льгот', 'тк рф', 'трудовой'],
            medicine: ['медицин', 'здравоохран', 'лекарств', 'омс', 'минздрав'],
            nta: ['норматив', 'техническ', 'стандарт', 'природоохран', 'строительств', 'транспорт']
          }

          const profileKeywords = keywordsByProfile[scope] || []
          const allKeywords = new Set(profileKeywords.map(kw => kw.toLowerCase()))

          if (allKeywords.size > 0) {
            allNews = allNews.filter(item => {
              const lowerTitle = (item.title || '').toLowerCase()
              const lowerDesc = (item.description || '').toLowerCase()
              return Array.from(allKeywords).some(kw => lowerTitle.includes(kw) || lowerDesc.includes(kw))
            }).slice(0, 5)
          } else {
            allNews = allNews.slice(0, 5)
          }

          news = allNews
        }
      } else {
        // Keyword fallback for unmapped
        const feed = await parser.parseURL('https://www.consultant.ru/rss/hotdocs.xml')
        let allNews = feed.items.slice(0, 15).map(item => ({
          title: item.title || '',
          date: new Date(item.pubDate || now).toLocaleDateString('ru-RU'),
          description: item.contentSnippet || item.content || '',
          link: item.link || ''
        }))

        const keywordsByProfile = {
          accountant: ['налог', 'бухгалт', 'учет', 'финанс', 'бюджет', 'бухучет', 'налоговый'],
          jurist: ['право', 'гражданск', 'уголовн', 'правосудие', 'суд', 'семья', 'прокуратур', 'адвокатур', 'международн'],
          budget: ['бюджет', 'финанс', 'госуправлен', 'государств'],
          procurements: ['закупк', 'тендер', 'аукцион', 'контракт'],
          hr: ['труд', 'кадр', 'пособи', 'льгот', 'тк рф', 'трудовой'],
          medicine: ['медицин', 'здравоохран', 'лекарств', 'омс', 'минздрав'],
          nta: ['норматив', 'техническ', 'стандарт', 'природоохран', 'строительств', 'транспорт']
        }

        const profileKeywords = keywordsByProfile[scope] || []
        const allKeywords = new Set(profileKeywords.map(kw => kw.toLowerCase()))

        if (allKeywords.size > 0) {
          allNews = allNews.filter(item => {
            const lowerTitle = (item.title || '').toLowerCase()
            const lowerDesc = (item.description || '').toLowerCase()
            return Array.from(allKeywords).some(kw => lowerTitle.includes(kw) || lowerDesc.includes(kw))
          }).slice(0, 5)
        } else {
          allNews = allNews.slice(0, 5)
        }

        news = allNews
      }
    }

    newsCache[cacheKey] = { data: news, timestamp: now }
    return NextResponse.json({ news })
  } catch (err) {
    console.error('News Error:', err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
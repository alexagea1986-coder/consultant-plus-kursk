import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allNews: any[] = []
    let page = 1
    const maxPages = 10  // Fetch up to 10 recent pages to ensure enough for all profiles

    function parseRussianDate(dateStr: string): Date {
      const now = new Date()
      if (dateStr.includes('Сегодня')) return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (dateStr.includes('Вчера')) return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const match = dateStr.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i)
      if (match) {
        const day = parseInt(match[1])
        const monthNames = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
        const month = monthNames.indexOf(match[2].toLowerCase()) + 1
        const year = parseInt(match[3])
        return new Date(year, month - 1, day)
      }
      return new Date(dateStr) // fallback
    }

    while (page <= maxPages) {
      const url = page === 1 ? 'https://www.consultant.ru/legalnews/' : `https://www.consultant.ru/legalnews/?page=${page}`
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`Failed to fetch page ${page}`)
        break
      }
      const html = await res.text()
      
      // Dynamic import to avoid ESM build issues
      const cheerio = await import('cheerio')
      const { load } = cheerio
      const $ = load(html)
      
      $('a[href*="/legalnews/"]').each((i, el) => {
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
          
          if (title.length > 10 && !allNews.some(item => item.title === title)) {
            allNews.push({
              title,
              date,
              description,
              link: fullLink
            })
          }
        }
      })

      page++
      if (allNews.length >= 200) break
    }

    // Sort by date descending (latest first)
    allNews.sort((a, b) => parseRussianDate(b.date).getTime() - parseRussianDate(a.date).getTime())

    // Remove duplicates based on title after sorting
    const uniqueNews: any[] = []
    const seenTitles = new Set()
    for (const item of allNews) {
      if (!seenTitles.has(item.title)) {
        seenTitles.add(item.title)
        uniqueNews.push(item)
      }
    }

    // Define profiles and keywords
    const profiles = {
      universal: [],
      accounting_hr: ['бухгалтерия', 'кадры', 'налог', 'зарплата', 'НДС', 'бухучет'],
      lawyer: ['юрист', 'суд', 'закон', 'ВС РФ', 'права'],
      budget_accounting: ['бюджет', 'государственная организация', 'финансы', 'казна'],
      procurements: ['закупки', '44-ФЗ', 'тендер', 'УФАС', 'контракт'],
      hr: ['кадры', 'трудовой кодекс', 'сотрудник', 'увольнение', 'прием'],
      labor_safety: ['охрана труда', 'медосмотр', 'безопасность', 'профилактика'],
      nta: ['нормативно-технические акты', 'стандарты', 'ГОСТ', 'технические регламенты'],
      universal_budget: ['бюджет', 'государственная организация', 'финансы']
    }

    // Pre-filter top 5 latest for each profile
    const profileNews: Record<string, any[]> = {}
    
    // Universal: top 5 overall latest
    profileNews.universal = uniqueNews.slice(0, 5)
    
    // For each other profile
    Object.keys(profiles).forEach(profile => {
      if (profile === 'universal') return
      const keywords = profiles[profile]
      const filtered = uniqueNews.filter(item =>
        keywords.some(kw =>
          item.title.toLowerCase().includes(kw.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(kw.toLowerCase()))
        )
      )
      profileNews[profile] = filtered.slice(0, 5)
    })

    return NextResponse.json({ profiles: profileNews })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'

// Mock news data based on real Consultant.ru news
const mockNewsData: { [key: string]: any[] } = {
  jurist: [
    {
      id: '29622',
      title: 'Самые важные новости для юриста за сентябрь',
      date: '04.10.2025',
      announce: 'Обзор ключевых изменений законодательства для юристов',
      url: 'https://www.consultant.ru/legalnews/29622/',
      profile_name: 'Юристы'
    },
    {
      id: '28824',
      title: 'Какие важные изменения ждут юриста в июле 2025 года',
      date: '24.06.2025',
      announce: 'В КоАП РФ закрепили возможность получения и подачи любых процессуальных документов в электронном виде. Операции с цифровыми рублями подпали под многие "антиотмывочные" правила.',
      url: 'https://www.consultant.ru/legalnews/28824/',
      profile_name: 'Юристы'
    },
    {
      id: '29639',
      title: 'Повышение ставки НДС до 22%, пересмотр порога доходов по УСН и другое – проект в Госдуме',
      date: '04.10.2025',
      announce: 'Правительство внесло в Госдуму проект о налоговых изменениях',
      url: 'https://www.consultant.ru/legalnews/29639/',
      profile_name: 'Юристы'
    }
  ],
  accountant: [
    {
      id: '29626',
      title: 'Важные новости для бухгалтера за сентябрь',
      date: '04.10.2025',
      announce: 'Обзор важнейших изменений в бухгалтерском учете и налогообложении',
      url: 'https://www.consultant.ru/legalnews/29626/',
      profile_name: 'Бухгалтеры'
    },
    {
      id: '29638',
      title: 'Проект о повышении ставки НДС до 22% с 2026 года: вспоминаем важные моменты предыдущего изменения',
      date: '04.10.2025',
      announce: 'Анализ предстоящих изменений по НДС',
      url: 'https://www.consultant.ru/legalnews/29638/',
      profile_name: 'Бухгалтеры'
    },
    {
      id: '29573',
      title: 'Планы счетов бюджетного и бухгалтерского учета: инструкции по применению уже на регистрации',
      date: '27.09.2025',
      announce: 'Минфин подготовил новые инструкции по применению планов счетов',
      url: 'https://www.consultant.ru/legalnews/29573/',
      profile_name: 'Бухгалтеры'
    }
  ],
  hr: [
    {
      id: '29624',
      title: 'Важные новости для специалиста по кадрам за сентябрь',
      date: '04.10.2025',
      announce: 'Обзор ключевых изменений в трудовом законодательстве и кадровом делопроизводстве',
      url: 'https://www.consultant.ru/legalnews/29624/',
      profile_name: 'Кадры'
    },
    {
      id: '29642',
      title: 'Больничный после военной службы продлит срок приостановки трудового договора – поправки опубликованы',
      date: '04.10.2025',
      announce: 'Новые правила для трудовых отношений с мобилизованными работниками',
      url: 'https://www.consultant.ru/legalnews/29642/',
      profile_name: 'Кадры'
    },
    {
      id: '29633',
      title: 'Проект о повышении МРОТ с 1 января 2026 года внесен в Госдуму',
      date: '04.10.2025',
      announce: 'Планируется повышение минимального размера оплаты труда',
      url: 'https://www.consultant.ru/legalnews/29633/',
      profile_name: 'Кадры'
    }
  ],
  procurements: [
    {
      id: '29625',
      title: 'Самые интересные новости для специалиста по закупкам за сентябрь',
      date: '04.10.2025',
      announce: 'Обзор изменений в сфере государственных и корпоративных закупок',
      url: 'https://www.consultant.ru/legalnews/29625/',
      profile_name: 'Закупки'
    },
    {
      id: '29528',
      title: 'Система управления промышленной безопасностью на ОПО: Ростехнадзор определил, как проводить ее аудит',
      date: '25.09.2025',
      announce: 'Новые требования к аудиту систем управления',
      url: 'https://www.consultant.ru/legalnews/29528/',
      profile_name: 'Закупки'
    }
  ],
  budget_accounting: [
    {
      id: '29601',
      title: 'Самые важные новости для бюджетных организаций за сентябрь',
      date: '04.10.2025',
      announce: 'Обзор ключевых изменений для бюджетной сферы',
      url: 'https://www.consultant.ru/legalnews/29601/',
      profile_name: 'Бюджет'
    },
    {
      id: '29573-b',
      title: 'Планы счетов бюджетного учета: новые инструкции',
      date: '27.09.2025',
      announce: 'Минфин обновил правила бюджетного учета',
      url: 'https://www.consultant.ru/legalnews/29573/',
      profile_name: 'Бюджет'
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scopes = searchParams.get('scopes')

  if (!scopes) {
    return Response.json({ error: 'Scopes required' }, { status: 400 })
  }

  // Map app profiles to mock data keys
  const scopesList = scopes.split(',')
  let allNews: any[] = []

  for (const scope of scopesList) {
    if (mockNewsData[scope]) {
      allNews = allNews.concat(mockNewsData[scope])
    }
  }

  // Deduplicate by id
  const unique = allNews.filter((item, index, self) => 
    index === self.findIndex(n => n.id === item.id)
  )

  // Sort by date (most recent first)
  unique.sort((a, b) => {
    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime()
      }
      return 0
    }
    return parseDate(b.date) - parseDate(a.date)
  })

  // Transform to expected format
  const news = unique.slice(0, 20).map(item => ({
    title: item.title,
    date: item.date,
    description: item.announce,
    link: item.url
  }))

  return Response.json({ news })
}
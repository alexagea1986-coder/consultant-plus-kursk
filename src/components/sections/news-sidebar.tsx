"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"

interface NewsItem {
  title: string
  date: string
  description: string
  link: string
}

interface NewsSidebarProps {
  anonymousLoggedIn: boolean
  selectedProfile: string
}

export default function NewsSidebar({ anonymousLoggedIn, selectedProfile }: NewsSidebarProps) {
  const [profileNews, setProfileNews] = useState<Record<string, NewsItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])

  const profileKeywords = {
    universal: [], // show all
    accounting_hr: ['бухгалтерия', 'кадры', 'налог', 'зарплата', 'НДС', 'бухучет'],
    lawyer: ['юрист', 'суд', 'закон', 'ВС РФ', 'права'],
    budget_accounting: ['бюджет', 'государственная организация', 'финансы', 'казна'],
    procurements: ['закупки', '44-ФЗ', 'тендер', 'УФАС', 'контракт'],
    hr: ['кадры', 'трудовой кодекс', 'сотрудник', 'увольнение', 'прием'],
    labor_safety: ['охрана труда', 'медосмотр', 'безопасность', 'профилактика'],
    nta: ['нормативно-технические акты', 'стандарты', 'ГОСТ', 'технические регламенты'],
    universal_budget: ['бюджет', 'государственная организация', 'финансы']
  }

  useEffect(() => {
    if (!anonymousLoggedIn) return

    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/news')
        if (!response.ok) throw new Error('Failed to fetch news')
        
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        
        setProfileNews(data.profiles || {})
      } catch (err: any) {
        setError(err.message || "Не удалось загрузить новости")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [anonymousLoggedIn])

  useEffect(() => {
    const newsForProfile = profileNews[selectedProfile] || []
    setFilteredNews(newsForProfile)
  }, [selectedProfile, profileNews])

  if (!anonymousLoggedIn) {
    return <div className="bg-[#F5F5F5] rounded-md p-2 h-full"></div>
  }

  if (loading) {
    return (
      <div className="bg-[#F5F5F5] rounded-md p-1 space-y-1 h-full flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gray-300 rounded mr-2 animate-pulse"></div>
            <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-1 bg-white rounded border animate-pulse">
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#F5F5F5] rounded-md p-1 space-y-1 h-full flex flex-col justify-center">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-[#F5F5F5] rounded-md p-1 space-y-1 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-[#0066CC] mr-2" />
          <h2 className="text-[18px] font-semibold text-[#333333]">Новости</h2>
        </div>
      </div>

      <div className="space-y-1 flex-1">
        {filteredNews.slice(0, 5).map((item, index) => (
          <a
            key={index}
            href={item.link}
            className="block p-1 bg-white rounded border border-[#DDDDDD] hover:bg-[#F5F5F5] transition-colors no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center mb-1">
              <Calendar className="w-4 h-4 text-[#666666] mr-2" />
              <span className="text-[12px] text-[#666666]">{item.date}</span>
            </div>
            <h3 className="text-[14px] font-semibold text-[#0066CC] hover:underline line-clamp-2">{item.title}</h3>
            <p className="text-[12px] text-[#666666] mt-1 line-clamp-1">{item.description}</p>
          </a>
        ))}
        {filteredNews.length === 0 && (
          <p className="text-[#666666] text-center py-1">Новости не найдены для выбранного профиля</p>
        )}
      </div>

      <div className="pt-1 border-t border-[#DDDDDD]">
        <a href="https://www.consultant.ru/legalnews/" className="text-[14px] text-[#0066CC] hover:underline block">
          Все новости →
        </a>
      </div>
    </div>
  )
}
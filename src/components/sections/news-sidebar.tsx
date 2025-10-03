"use client"

import { useState, useEffect } from "react"

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
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!anonymousLoggedIn) return

    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch only the selected profile
        const response = await fetch(`/api/news?profile=${selectedProfile}`)
        if (!response.ok) throw new Error('Failed to fetch news')
        
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Extract news for selected profile
        const profileNews = data.profiles?.[selectedProfile] || []
        setNews(profileNews)
      } catch (err: any) {
        setError(err.message || "Не удалось загрузить новости")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [anonymousLoggedIn, selectedProfile])

  if (!anonymousLoggedIn) {
    return <div className="bg-white rounded-md p-2 h-full flex flex-col border border-[#DAA520]"></div>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-md p-1 space-y-1 h-full flex flex-col border border-[#DAA520]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gray-300 rounded mr-2 animate-pulse"></div>
            <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-1 bg-white rounded animate-pulse">
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
      <div className="bg-white rounded-md p-1 space-y-1 h-full flex flex-col justify-center border border-[#DAA520]">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-md p-1 space-y-1 h-full flex flex-col border border-[#DAA520]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] font-semibold text-[#333333]">Новости</h2>
      </div>

      <div className="space-y-1 flex-1">
        {news.slice(0, 5).map((item, index) => (
          <a
            key={index}
            href={item.link}
            className="block p-2 bg-white rounded hover:bg-[#F8F9FA] transition-colors no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="mb-2">
              <span className="text-xs text-[#666666] leading-tight">{item.date}</span>
            </div>
            <h3 className="text-sm font-normal text-[#0066CC] leading-relaxed line-clamp-2 mb-2 hover:underline">{item.title}</h3>
            <p className="text-xs text-[#666666] leading-tight line-clamp-2">{item.description}</p>
          </a>
        ))}
        {news.length === 0 && (
          <p className="text-[#666666] text-center py-1">Новости не найдены для выбранного профиля</p>
        )}
      </div>

      <div className="pt-1 border-t border-[#DAA520]">
        <a href="https://www.consultant.ru/legalnews/" className="text-[14px] text-[#0066CC] hover:underline block">
          Все новости →
        </a>
      </div>
    </div>
  )
}
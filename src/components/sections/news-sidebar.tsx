"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"

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

// News profiles mapping
const newsProfiles = [
  { id: 'accountant', label: 'Бухгалтер', scope: 'accountant' },
  { id: 'jurist', label: 'Юрист', scope: 'jurist' },
  { id: 'budget', label: 'Бухгалтер (бюджет)', scope: 'budget' },
  { id: 'procurements', label: 'Закупки', scope: 'procurements' },
  { id: 'hr', label: 'Кадры', scope: 'hr' },
  { id: 'medicine', label: 'Здравоохранение', scope: 'medicine' },
  { id: 'nta', label: 'НТА', scope: 'nta' }
]

// Default profiles for each user profile
const profileDefaults: { [key: string]: string[] } = {
  accounting_hr: ['accountant'],
  lawyer: ['jurist'],
  budget_accounting: ['jurist', 'budget', 'procurements', 'hr', 'medicine', 'nta'],
  procurements: ['procurements'],
  hr: ['hr'],
  labor_safety: ['hr'],
  nta: ['nta'],
  universal: ['accountant', 'jurist', 'procurements', 'hr', 'medicine', 'nta'],
  universal_budget: ['accountant', 'jurist', 'budget', 'procurements', 'hr', 'medicine', 'nta']
}

export default function NewsSidebar({ anonymousLoggedIn, selectedProfile }: NewsSidebarProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNewsProfiles, setSelectedNewsProfiles] = useState<string[]>([])

  // Initialize selected news profiles based on user profile
  useEffect(() => {
    const defaults = profileDefaults[selectedProfile] || profileDefaults.universal
    setSelectedNewsProfiles(defaults)
  }, [selectedProfile])

  useEffect(() => {
    if (!anonymousLoggedIn || selectedNewsProfiles.length === 0) return

    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch news with selected scopes
        const scopes = selectedNewsProfiles.join(',')
        const response = await fetch(`/api/news?scopes=${scopes}`)
        if (!response.ok) throw new Error('Failed to fetch news')
        
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        
        setNews(data.news || [])
      } catch (err: any) {
        setError(err.message || "Не удалось загрузить новости")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [anonymousLoggedIn, selectedNewsProfiles])

  const toggleNewsProfile = (profileId: string) => {
    setSelectedNewsProfiles(prev => {
      if (prev.includes(profileId)) {
        // Don't allow deselecting all profiles
        if (prev.length === 1) return prev
        return prev.filter(id => id !== profileId)
      } else {
        return [...prev, profileId]
      }
    })
  }

  if (!anonymousLoggedIn) {
    return <div className="bg-white rounded-md p-2 h-full flex flex-col border border-[#DAA520]"></div>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-md p-1 space-y-1 h-full flex flex-col border border-[#DAA520]">
        <div className="flex items-center justify-between mb-1">
          <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-1 bg-white rounded animate-pulse">
              <div className="h-3 bg-gray-300 rounded w-20 mb-1"></div>
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-6 px-2 text-[10px] border-[#DAA520] hover:bg-[#F8F9FA]"
            >
              Фильтр <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-[#333333] mb-2">Профили новостей</div>
              {newsProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={profile.id}
                    checked={selectedNewsProfiles.includes(profile.scope)}
                    onCheckedChange={() => toggleNewsProfile(profile.scope)}
                    className="h-3 w-3"
                  />
                  <label
                    htmlFor={profile.id}
                    className="text-[10px] text-[#333333] cursor-pointer select-none"
                  >
                    {profile.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto">
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
            <h3 className="text-sm font-normal text-[#0066CC] leading-relaxed mb-2 hover:underline">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-[#666666] leading-tight">
                {item.description}
              </p>
            )}
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
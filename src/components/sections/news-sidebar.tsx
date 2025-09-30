"use client"

import { useState, useEffect } from "react"
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useMemo } from "react";

interface NewsItem {
  title: string
  date: string
  description: string
  link: string
}

interface NewsSidebarProps {
  anonymousLoggedIn: boolean
  selectedProfile: string
  onProfileChange?: (profile: string) => void
}

export default function NewsSidebar({ anonymousLoggedIn, selectedProfile, onProfileChange }: NewsSidebarProps) {
  const profiles = [
    { value: 'universal', label: 'Универсальный' },
    { value: 'accounting_hr', label: 'Бухгалтерия и кадры' },
    { value: 'lawyer', label: 'Юрист' },
    { value: 'budget_accounting', label: 'Бухгалтерия и кадры бюджетной организации' },
    { value: 'procurements', label: 'Специалист по закупкам' },
    { value: 'hr', label: 'Кадры' },
    { value: 'labor_safety', label: 'Специалист по охране труда' },
    { value: 'nta', label: 'Специалист по нормативно-техническим актам' },
    { value: 'universal_budget', label: 'Универсальный для бюджетной организации' }
  ];

  const selectedLabel = useMemo(() => {
    const profile = profiles.find(p => p.value === selectedProfile);
    return profile ? profile.label : 'Универсальный';
  }, [selectedProfile]);

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
    return <div className="bg-[#F5F5F5] rounded-md p-2 h-full border border-[#FFD700]"></div>
  }

  if (loading) {
    return (
      <div className="bg-[#F5F5F5] rounded-md p-1 space-y-1 h-full flex flex-col border border-[#FFD700]">
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
      <div className="bg-[#F5F5F5] rounded-md p-1 space-y-1 h-full flex flex-col justify-center border border-[#FFD700]">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[#DDDDDD] px-4 py-3 flex-shrink-0">
        <div className="flex items-center">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/images/logoCircle-2.svg"
            alt="КонсультантПлюс"
            width={40}
            height={40}
            className="mr-3"
          />
          <div>
            <span className="text-xl font-bold text-[#0066CC] whitespace-pre-line block">Инфо-Комплекс Плюс</span>
            <div className="flex items-center mt-1">
              <span className="text-[12px] font-bold text-[#0066CC] mr-2 !whitespace-pre-line">Профиль:</span>
              <Select value={selectedProfile} onValueChange={onProfileChange || (() => {})}>
                <SelectTrigger 
                  className="text-[12px] text-[#666666] bg-white h-7 inline-flex items-center justify-between px-2"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-[12px]">
                  {profiles.map((profile) => (
                    <SelectItem key={profile.value} value={profile.value} className="text-[12px] flex items-center">
                      <span className="flex-1">{profile.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F5F5] rounded-md p-1 space-y-1 border border-[#FFD700] overflow-y-auto">
        {loading ? (
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
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[18px] font-semibold text-[#333333]">Новости</h2>
            </div>

            <div className="space-y-1">
              {filteredNews.slice(0, 5).map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  className="block p-2 bg-white rounded border border-[#DDDDDD] hover:bg-[#F5F5F5] transition-colors no-underline"
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
              {filteredNews.length === 0 && (
                <p className="text-[#666666] text-center py-1">Новости не найдены для выбранного профиля</p>
              )}
            </div>

            <div className="pt-1 border-t border-[#DDDDDD]">
              <a href="https://www.consultant.ru/legalnews/" className="text-[14px] text-[#0066CC] hover:underline block">
                Все новости →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
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

// Profile to scopes mapping (duplicated from API for frontend defaults)
const profileToScopes: { [key: string]: string } = {
  accounting_hr: 'accountant',
  lawyer: 'jurist',
  budget_accounting: 'jurist,budget,procurements,hr,medicine,nta',
  procurements: 'procurements',
  hr: 'hr',
  labor_safety: 'hr',
  nta: 'nta',
  universal: 'accountant,jurist,procurements,hr,medicine,nta',
  universal_budget: 'accountant,jurist,budget,procurements,hr,medicine,nta'
}

export default function NewsSidebar({ anonymousLoggedIn, selectedProfile }: NewsSidebarProps) {
  const [filterScopes, setFilterScopes] = useState<string[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)

  // Initial load: all news
  useEffect(() => {
    const loadAllNews = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/news')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setNews(data.news || [])
        
        // Set default scopes based on selectedProfile
        const defaultScopes = profileToScopes[selectedProfile] ? profileToScopes[selectedProfile].split(',') : []
        setFilterScopes(defaultScopes)
      } catch (err) {
        setError('Ошибка загрузки новостей')
      } finally {
        setLoading(false)
      }
    }
    loadAllNews()
  }, [selectedProfile])

  // On filter change: refetch with selected scopes
  useEffect(() => {
    const loadFilteredNews = async () => {
      setLoading(true)
      setError(null)
      try {
        if (filterScopes.length === 0) {
          // If no filters, load all
          const res = await fetch('/api/news')
          if (!res.ok) throw new Error('Failed to fetch')
          const data = await res.json()
          setNews(data.news || [])
        } else {
          const scopesStr = filterScopes.join(',')
          const res = await fetch(`/api/news?scopes=${scopesStr}`)
          if (!res.ok) throw new Error('Failed to fetch')
          const data = await res.json()
          setNews(data.news || [])
        }
      } catch (err) {
        setError('Ошибка загрузки новостей')
      } finally {
        setLoading(false)
      }
    }

    loadFilteredNews()
  }, [filterScopes])

  const toggleNewsProfile = (profileId: string) => {
    setFilterScopes(prev => {
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

  return (
    <div className="bg-white rounded-md p-1 space-y-1 h-full flex flex-col border border-[#DAA520]">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Новости</h3>
        <div className="relative">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="text-xs text-gray-600 hover:text-primary flex items-center gap-1"
          >
            Фильтр профилей ▼
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg p-2 w-48 z-10 text-xs">
              {newsProfiles.map(profile => (
                <label key={profile.id} className="flex items-center gap-1 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={filterScopes.includes(profile.id)}
                    onChange={(e) => {
                      const newScopes = e.target.checked
                        ? [...filterScopes, profile.id]
                        : filterScopes.filter(s => s !== profile.id)
                      setFilterScopes(newScopes)
                    }}
                    className="w-3 h-3"
                  />
                  <span>{profile.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`space-y-3 ${loading ? 'animate-pulse' : ''}`}>
        {news.map((item, i) => (
          <div key={i} className="text-xs leading-relaxed">
            <div className="text-gray-500 mb-1">{item.date}</div>
            <a href={item.link} target="_blank" rel="noopener" className="text-primary hover:underline font-medium">
              {item.title}
            </a>
            {item.description && (
              <p className="mt-1 text-gray-700">{item.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-[#DAA520]">
        <a href="https://www.consultant.ru/legalnews/" className="text-[14px] text-[#0066CC] hover:underline block">
          Все новости →
        </a>
      </div>
    </div>
  )
}
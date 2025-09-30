"use client"

import { useState } from "react"
import { Search, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchChatInterfaceProps {
  selectedProfile: string
}

export default function SearchChatInterface({ selectedProfile }: SearchChatInterfaceProps) {
  const [query, setQuery] = useState("")

  return (
    <div className="bg-[#FFD700] rounded-b-md p-4 mb-6">
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333333] w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Задайте вопрос по ${selectedProfile.toLowerCase()}...`}
            className="pl-10 pr-4 bg-white border-none rounded text-[#333333] placeholder-[#666666] focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
          />
        </div>
        <Button 
          className="bg-[#0066CC] hover:bg-[#4A90E2] text-white px-6 py-2 rounded whitespace-nowrap"
          disabled={!query.trim()}
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Поиск
        </Button>
      </div>
      <p className="text-xs text-[#666666] mt-2 text-center">
        Используйте AI-поиск для быстрых ответов на профессиональные вопросы
      </p>
    </div>
  )
}
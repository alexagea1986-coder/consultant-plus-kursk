"use client"

import { useState, useRef } from "react"
import { Search, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchChatInterfaceProps {
  selectedProfile: string
}

export default function SearchChatInterface({ selectedProfile }: SearchChatInterfaceProps) {
  const [query, setQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="bg-[#FFD700] rounded-b-md py-4 px-0 mb-6 -mx-3 sm:-mx-6">
      <div className="flex items-start gap-3">
        <div className="flex-1 relative min-h-[40px]">
          <Search className="absolute left-3 top-3 text-[#333333] w-4 h-4 flex-shrink-0 z-10" />
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={handleInput}
            placeholder={`Задайте вопрос по ${selectedProfile.toLowerCase()}...`}
            className="w-full min-h-[40px] pl-10 pt-3 pb-3 pr-3 bg-white border-4 border-[#FFD700] rounded text-[#333333] placeholder-[#666666] resize-none overflow-hidden break-all focus:ring-2 focus:ring-[#0066CC] focus:border-transparent leading-relaxed"
          />
        </div>
        <Button 
          className="bg-[#0066CC] hover:bg-[#4A90E2] text-white px-6 py-2 rounded self-start mt-2"
          disabled={!query.trim()}
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Поиск
        </Button>
      </div>
      <p className="text-xs text-[#666666] mt-2 text-center px-4">
        Используйте AI-поиск для быстрых ответов на профессиональные вопросы
      </p>
    </div>
  )
}
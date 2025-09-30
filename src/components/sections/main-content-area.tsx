"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, MessageCircle, Send, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MainContentAreaProps {
  anonymousLoggedIn: boolean;
  onAnonymousLogin?: () => void;
  selectedProfile: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MainContentArea({ anonymousLoggedIn, onAnonymousLogin, selectedProfile }: MainContentAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!anonymousLoggedIn) {
    return (
      <div className="text-center py-8 bg-white rounded-md border border-[#DDDDDD] p-6 min-h-full flex flex-col justify-center">
        <h2 className="text-[20px] font-semibold text-[#333333] mb-4">КонсультантПлюс: Студент</h2>
        <p className="text-[14px] text-[#666666] mb-6">Для доступа к ресурсам нажмите "Войти без авторизации"</p>
        <Button onClick={onAnonymousLogin} className="bg-[#FFD700] text-[#333333] px-6 py-2 rounded">
          Войти без авторизации
        </Button>
      </div>);

  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll to bottom when messages change and not loading
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading, scrollToBottom]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Save messages to localStorage after updates
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/gigachat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          selectedProfile 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.content 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Извините, произошла ошибка при получении ответа.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120; // Max height in px, approx 5-6 lines
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Gigachat section */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#DDDDDD] shadow-sm px-6 pt-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[18px] font-semibold text-[#333333] flex items-center">
            <Search className="w-5 h-5 mr-2 scale-x-[-1] stroke-[#FFD700]" strokeWidth={2} />
            Быстрый ai поиск
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear} 
            className="text-[#666666] hover:text-[#333333] flex items-center gap-1 h-6 px-2 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[12px]">Очистить</span>
          </Button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-[#F5F5F5] rounded-lg border border-[#DDDDDD]">
          {messages.length === 0 ? (
            <p className="text-[14px] text-[#666666] text-center italic">Задайте вопрос по выбранному профилю</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded ${msg.role === 'user' ? 'bg-[#0066CC] text-white' : 'bg-white text-[#333333] border border-[#DDDDDD]'} ${msg.role === 'user' ? '' : 'whitespace-pre-wrap'} text-[14px]`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }}
                      className="whitespace-pre-wrap"
                    />
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-2 rounded border border-[#DDDDDD] text-[#333333]">Генерация ответа...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div 
          className="bg-[#FFD700] p-1 rounded w-full max-w-full overflow-hidden" 
          onClick={() => textareaRef.current?.focus()}
        >
          <div className="flex w-full max-w-full min-w-0 border-2 border-[#B8860B] rounded-lg overflow-hidden bg-white focus-within:border-2 focus-within:border-[#B8860B] focus-within:outline-none focus-within:ring-0 focus-within:shadow-none flex-nowrap">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите ваш вопрос..."
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 max-w-full w-full text-[14px] border-0 rounded-none px-4 py-2 text-[#333333] placeholder:text-[#666666] focus:border-0 focus:ring-0 focus:outline-none focus:shadow-none focus-visible:ring-0 focus-visible:shadow-none resize-none min-h-[40px] break-words overflow-wrap-break-word field-sizing-fixed"
              disabled={isLoading}
              style={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading} 
              className="flex-shrink-0 bg-white text-[#000000] hover:bg-gray-100 border-0 rounded-none font-bold px-8 py-2 min-w-[100px] focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:shadow-none"
            >
              Найти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
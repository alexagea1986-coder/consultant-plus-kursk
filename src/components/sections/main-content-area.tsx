"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const inputRef = useRef<HTMLInputElement>(null);

  if (!anonymousLoggedIn) {
    return (
      <div className="text-center py-8 bg-white rounded-md border border-[#DDDDDD] p-6">
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

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

  return (
    <div className="space-y-4">
      {/* Gigachat section */}
      <div className="bg-white rounded-lg border border-[#DDDDDD] shadow-sm px-6 pt-2 pb-4">
        <h2 className="text-[18px] font-semibold text-[#333333] mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-[#0066CC]" />Быстрый поиск Ai
        </h2>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-[#F5F5F5] rounded-lg border border-[#DDDDDD] h-[200px]">
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
        </div>
        
        {/* Input */}
        <div 
          className="flex gap-2 border border-[#DDDDDD] rounded p-3 cursor-text" 
          onClick={() => inputRef.current?.focus()}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите ваш вопрос..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 text-[14px] bg-transparent border-none focus:border-none focus:ring-0 px-0"
            disabled={isLoading} 
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading} 
            className="bg-[#0066CC] text-white hover:bg-[#4A90E2] px-4 py-2 rounded border border-[#0066CC] min-w-[40px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Additional Services Links Section */}
      <div className="bg-white rounded-lg border border-[#DDDDDD] shadow-sm px-6 pt-2 pb-2">
        <h3 className="text-[18px] font-semibold text-[#333333] mb-2">Дополнительные сервисы</h3>
        <div className="space-y-1">
          <a 
            href="https://cpcd.consultant.ru/production/?selectTab=policies" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Конструктор учётной политики
          </a>
          <a 
            href="https://spspsmart.consultant.ru/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Спец.поиск судебной практики
          </a>
          <a 
            href="https://calc.consultant.ru/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Калькуляторы
          </a>
          <a 
            href="https://aoas.consultant.ru/cgi/online.cgi?req=card" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Архив определений арбитражных судов
          </a>
          <a 
            href="https://arms.consultant.ru/cgi/online.cgi?req=card" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Архив решений мировых судей
          </a>
          <a 
            href="https://afas.consultant.ru/cgi/online.cgi?req=card" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Архив решений ФАС и УФАС
          </a>
          <a 
            href="https://admo.consultant.ru/cgi/online.cgi?req=card" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
          >
            Архив документов муниципальных образований РФ
          </a>
        </div>
      </div>
    </div>
  );
}
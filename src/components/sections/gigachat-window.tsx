"use client";

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GigaChatWindowProps {
  selectedProfile: string;
}

export default function GigaChatWindow({ selectedProfile }: GigaChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gigachat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputValue, 
          profile: selectedProfile 
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Извините, произошла ошибка при обращении к GigaChat.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FFD700] rounded-md border border-[#DDDDDD] p-6 space-y-4 h-[500px] flex flex-col !text-[#333333]">
      <h2 className="text-[20px] font-semibold mb-4">GigaChat: Помощник для {selectedProfile.toLowerCase()}</h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 bg-white rounded-md p-3">
        {messages.length === 0 ? (
          <p className="text-[#666666] italic">Задайте вопрос по профилю "{selectedProfile}" (юридические, бухгалтерские, кадровые вопросы...)</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded ${msg.role === 'user' ? 'bg-[#0066CC] text-white' : 'bg-[#F5F5F5] text-[#333333]'}`}>
                <p className="text-[14px]">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F5F5F5] p-3 rounded text-[#333333]">Генерация ответа...</div>
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Введите ваш вопрос..."
          className="flex-1 text-[14px]"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="bg-white text-[#0066CC] hover:bg-[#F5F5F5] border border-[#0066CC]">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
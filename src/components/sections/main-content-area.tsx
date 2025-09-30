"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, MessageCircle, Send, Trash2, Search } from "lucide-react";
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

const profiles = [
  { value: "accounting", label: "Бухгалтерия и кадры" },
  { value: "lawyer", label: "Юрист" },
  { value: "budget-accounting", label: "Бухгалтерия и кадры бюджетной организации" },
  { value: "procurement", label: "Специалист по закупкам" },
  { value: "hr", label: "Кадры" },
  { value: "labor-safety", label: "Специалист по охране труда" },
  { value: "standards", label: "Специалист по нормативно-техническим актам" },
  { value: "universal", label: "Универсальный" },
  { value: "budget-universal", label: "Универсальный для бюджетной организации" },
];

const defaultLinks = [
  { title: "Быстрый поиск", description: "Поиск по ключевым словам в базах данных" },
  { title: "Каталог документов", description: "Полный список нормативных актов и документов" },
  { title: "Справочные материалы", description: "Толкования и комментарии к законодательству" },
  { title: "Судебная практика", description: "Анализ судебных решений и прецедентов" },
  { title: "Консультации", description: "Ответы на часто задаваемые вопросы" },
  { title: "Образцы документов", description: "Шаблоны и формы для скачивания", icon: "pdf" },
];

const profileSections: Record<string, { title: string; links?: Array<{title: string; description: string; icon?: string}> }> = {};

const popularDocuments = [
  { title: "Федеральный закон № 123-ФЗ", date: "Сегодня" },
  { title: "Постановление Правительства № 456", date: "Вчера" },
  { title: "Приказ Минфина № 789", date: "2 дня назад" },
  { title: "Судебное решение по делу № 101", date: "3 дня назад" },
  { title: "Методические рекомендации", date: "Неделя назад" },
];

const services = [
  { name: "Поиск по базам данных", highlight: true },
  { name: "Анализ документов", highlight: false },
  { name: "Консультации экспертов", highlight: false },
  { name: "Обучение и семинары", highlight: false },
  { name: "Техническая поддержка", highlight: true },
];

export default function MainContentArea({ anonymousLoggedIn, onAnonymousLogin, selectedProfile }: MainContentAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentProfile, setCurrentProfile] = useState(selectedProfile);

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

    try {
      const response = await fetch('/api/gigachat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          selectedProfile: currentProfile 
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">КонсультантПлюс</h2>
        <p className="text-gray-600 mb-6">Искусственный интеллект поможет сформулировать запрос для поиска по базам. Выберите профиль, чтобы получить ответы, соответствующие вашей профессиональной деятельности.</p>
        
        <div className={`relative bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg p-1 shadow-lg ${anonymousLoggedIn ? 'ring-2 ring-yellow-400' : ''}`}>
          <div className="bg-white rounded-md p-3 flex items-center space-x-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Введите ваш вопрос..."
              className="flex-1 px-4 py-2 border-2 border-b-2 border-l-2 border-r-0 border-t-2 border-[#B8860B] focus:border-2 focus:border-[#B8860B] focus:outline-none rounded-l-md bg-yellow-50 text-gray-900 placeholder-gray-500"
            />
            <div className="h-full w-0.5 bg-[#B8860B] flex-shrink-0" />
            <button
              onClick={handleSend}
              disabled={!anonymousLoggedIn}
              className={`px-6 py-2 border-2 border-l-0 border-r-2 border-b-2 border-t-2 border-[#B8860B] rounded-r-md font-medium transition-all duration-200 ${
                anonymousLoggedIn
                  ? 'bg-white hover:bg-gray-50 text-gray-900 cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300'
              }`}
            >
              Найти
            </button>
          </div>
        </div>

        {/* Profile Selector */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Выберите профиль:</label>
          <select
            value={currentProfile}
            onChange={(e) => setCurrentProfile(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {profiles.map((profile) => (
              <option key={profile.value} value={profile.value}>
                {profile.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages Area */}
        <div className="h-64 bg-gray-50 rounded-md border border-gray-200 p-4 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>ИИ генерирует ответ...</span>
            </div>
          )}
          {messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p>{msg.content}</p>
                    {msg.source && (
                      <p className="text-xs mt-1 opacity-75">
                        Источник: {msg.source}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links - Adapt based on profile */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {profileSections[currentProfile]?.title || 'Полезные разделы'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileSections[currentProfile]?.links?.map((link, index) => (
              <a
                key={index}
                href="#"
                className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                  {link.title}
                </h4>
                <p className="text-sm text-gray-600">{link.description}</p>
                {link.icon && (
                  <div className="mt-2 flex items-center text-blue-500">
                    {link.icon === 'pdf' ? '📄' : '📋'}
                    <span className="ml-2 text-xs">Скачать</span>
                  </div>
                )}
              </a>
            )) || defaultLinks.map((link, index) => (
              <a
                key={index}
                href="#"
                className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                  {link.title}
                </h4>
                <p className="text-sm text-gray-600">{link.description}</p>
                {link.icon && (
                  <div className="mt-2 flex items-center text-blue-500">
                    {link.icon === 'pdf' ? '📄' : '📋'}
                    <span className="ml-2 text-xs">Скачать</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Content Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Популярные документы</h3>
          <ul className="space-y-3">
            {popularDocuments.map((doc, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{doc.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.date === 'Сегодня' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {doc.date}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consultant Services */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Услуги КонсультантПлюс</h3>
          <div className="space-y-3">
            {services.map((service, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  service.highlight ? 'bg-yellow-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-700">{service.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
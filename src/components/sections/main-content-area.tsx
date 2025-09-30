"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, MessageCircle, Send, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const hasChat = messages.length > 0 || isLoading;

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
    setInput('');
    setIsLoading(false);
    localStorage.removeItem('chatHistory');
  };

  const parseFollowUpQuestions = (content: string): { mainContent: string; followUps: string[] } => {
    const lines = content.split('\n');
    
    let questionStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      if (lowerLine.includes('уточняющие вопросы') || lowerLine.includes('смежные вопросы') || lowerLine.includes('возможные уточняющие вопросы')) {
        questionStartIndex = i;
        break;
      }
    }

    let mainContentLines: string[];
    let startIndexForQuestions: number;

    if (questionStartIndex === -1) {
      return { mainContent: content, followUps: [] };
    } else if (questionStartIndex === 0) {
      mainContentLines = [lines[0]];  // Include header in main content
      startIndexForQuestions = 1;
    } else {
      mainContentLines = lines.slice(0, questionStartIndex);
      startIndexForQuestions = questionStartIndex + 1;
    }

    const followUps: string[] = [];
    for (let i = startIndexForQuestions; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Stop conditions
      if (line.toLowerCase().includes('см. также') || line.toLowerCase().includes('see also') || 
          line.includes('end') || line.startsWith('---') || line.startsWith('=')) {
        // Optionally add this line to mainContent if it's "См. также"
        if (line.toLowerCase().includes('см. также') || line.toLowerCase().includes('see also')) {
          mainContentLines.push(lines[i]);
        }
        break;
      }
      
      // Add if it's likely a question
      if (line.endsWith('?') && line.length > 10) {
        const cleanQuestion = line.replace(/^\s*[-•*+\d\.\)\[]+\s*/g, '').trim();
        if (cleanQuestion.endsWith('?') && cleanQuestion.length > 5) {
          followUps.push(cleanQuestion);
        }
      } else if (followUps.length > 0) {
        // Stop if a non-question after questions started
        break;
      }
    }

    const mainContent = mainContentLines.join('\n').trim();

    return { mainContent, followUps };
  };

  const sendMessage = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setFollowUpQuestions([]);
    setInput('');
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/gigachat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, selectedProfile }),
      });

      if (!response.ok) throw new Error('API request failed');

      const { content } = await response.json();

      const { mainContent, followUps: newFollowUps } = parseFollowUpQuestions(content);

      setMessages([...newMessages, { role: 'assistant', content: mainContent }]);
      setFollowUpQuestions(newFollowUps);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте позже.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
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
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#DDDDDD] shadow-lg px-3 sm:px-4 sm:px-6 pt-2 sm:pt-3">
      <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-gray-100">
        <h2 className="text-lg sm:text-[18px] font-bold text-[#333333] flex items-center tracking-tight">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2.5 scale-x-[-1] stroke-[#FFD700]" strokeWidth={2.5} />
          Быстрый нейропоиск
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClear} 
          disabled={isLoading}
          className="text-[#666666] hover:text-[#333333] hover:bg-gray-50 flex items-center gap-1.5 h-9 px-3 rounded-md text-sm shadow-sm transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-xs sm:text-[12px]">Очистить</span>
        </Button>
      </div>
      
      <div className="flex-1 mb-3 sm:mb-4 overflow-hidden">
        {hasChat && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-full">
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-md px-3 sm:px-4 py-3 bg-gray-100 text-gray-600 rounded-xl shadow-sm animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full animate-spin"></div>
                    <span className="text-sm">Ищу информацию...</span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] sm:max-w-md px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-purple-100' 
                    : 'bg-white text-[#333333] border border-gray-200'
                }`}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        strong: ({ children }) => <strong style={{fontWeight: "bold", color: "#333333"}}>{children}</strong>,
                        p: ({ children }) => <p style={{marginBottom: "0.75rem", color: "#333333", lineHeight: "1.5"}}>{children}</p>,
                        ul: ({ children }) => <ul style={{listStyleType: "disc", marginLeft: "1rem", marginBottom: "0.75rem", color: "#333333"}}>{children}</ul>,
                        ol: ({ children }) => <ol style={{listStyleType: "decimal", marginLeft: "1rem", marginBottom: "0.75rem", color: "#333333"}}>{children}</ol>,
                        li: ({ children }) => <li style={{marginBottom: "0.25rem", color: "#333333", lineHeight: "1.4"}}>{children}</li>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-[#333333] font-medium">{message.content}</span>
                  )}
                </div>
              </div>
            ))}

            {followUpQuestions.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-md p-4 space-y-2.5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <p className="text-xs sm:text-sm font-semibold text-[#666666] mb-2 tracking-wide">Смежные вопросы:</p>
                  <div className="space-y-2">
                    {followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          sendMessage(question);
                        }}
                        className="w-full text-left px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:shadow-md text-sm transition-all text-[#333333] min-h-[48px] flex items-center shadow-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div 
        className="bg-[#FFD700] p-1.5 rounded-xl w-full max-w-full overflow-hidden shadow-md sm:shadow-lg" 
        onClick={() => textareaRef.current?.focus()}
      >
        <div className="flex w-full max-w-full min-w-0 border-2 border-[#B8860B] rounded-xl overflow-hidden bg-white focus-within:border-[#B8860B]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#FFD700]/20 focus-within:shadow-md transition-all flex-nowrap">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите ваш вопрос..."
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 max-w-full w-full text-base sm:text-[15px] border-0 rounded-none px-4 py-4 text-[#333333] placeholder:text-[#666666]/80 focus:border-0 focus:ring-0 focus:outline-none focus:shadow-none focus-visible:ring-0 focus-visible:shadow-none resize-none min-h-[48px] break-words overflow-wrap-break-word"
            disabled={isLoading}
            style={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!input.trim() || isLoading} 
            className="flex-shrink-0 bg-white text-[#000000] hover:bg-gray-50 border-0 rounded-none font-semibold px-5 sm:px-6 py-4 min-w-[80px] text-sm sm:text-base focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:shadow-none transition-all shadow-sm hover:shadow-md"
          >
            Найти
          </Button>
        </div>
      </div>
    </div>
  );
}
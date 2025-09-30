import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

interface SearchChatInterfaceProps {
  anonymousLoggedIn: boolean;
  onAnonymousLogin?: () => void;
  selectedProfile: string;
}

export default function SearchChatInterface({
  anonymousLoggedIn,
  onAnonymousLogin,
  selectedProfile,
}: SearchChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userId = uuidv4();
    const userMessage: Message = { id: userId, role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = uuidv4();
    const assistantMessage: Message = { id: assistantId, role: 'assistant', content: '', loading: true };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      if (!anonymousLoggedIn && onAnonymousLogin) {
        onAnonymousLogin();
      }

      const response = await fetch("/api/gigachat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          profile: selectedProfile,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API request failed");
      }

      const data = await response.json();
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: data.response, loading: false }
            : msg
        )
      );
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
      setMessages(prev => prev.filter(msg => msg.id !== assistantId));
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  if (!anonymousLoggedIn) {
    return (
      <div className="bg-yellow-400 p-8 text-center rounded-lg">
        <p className="text-gray-800 mb-4">Please log in anonymously to use the AI chat.</p>
        <Button onClick={onAnonymousLogin} className="bg-blue-600 text-white">
          Anonymous Login
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex flex-col bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-yellow-400 px-4 py-3 flex justify-between items-center border-b border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">AI Consultant Assistant ({selectedProfile})</h3>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-gray-700 hover:bg-yellow-300"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p>Ask a question about legal, business, or professional topics...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      code: ({ children }) => (
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm">{children}</code>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-t border-gray-300">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-white"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="bg-yellow-400 hover:bg-yellow-500">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
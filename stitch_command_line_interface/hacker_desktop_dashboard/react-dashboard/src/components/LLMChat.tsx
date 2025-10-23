import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function LLMChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with:\n\n• Code generation and refactoring\n• Debugging and error analysis\n• Explaining code concepts\n• Suggesting optimizations\n\nWhat would you like to work on today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual LLM API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${userMessage.content}"\n\nThis is a placeholder response. In a production environment, this would connect to an LLM API (like OpenAI, Claude, or a local model) to provide intelligent responses.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-panel/60 border-l border-hairline">
      {/* Header */}
      <div className="bg-panel/80 border-b border-hairline px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan" />
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">AI Assistant</h3>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 hover:bg-hairline rounded transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan/20 border border-cyan/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-cyan text-ink'
                  : 'bg-hairline/50 text-white/90 border border-hairline'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan border border-cyan flex items-center justify-center">
                <User className="w-4 h-4 text-ink" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan/20 border border-cyan/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan animate-pulse" />
            </div>
            <div className="bg-hairline/50 border border-hairline rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-hairline p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            className="flex-1 bg-panel border border-hairline text-white/90 px-3 py-2 rounded text-sm resize-none focus:border-cyan outline-none scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-cyan hover:bg-cyan/90 disabled:bg-hairline disabled:cursor-not-allowed text-ink rounded transition-all flex items-center gap-2 font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2">
          Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

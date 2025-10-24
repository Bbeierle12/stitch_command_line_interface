import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { useConsole } from '../contexts/ConsoleContext';
import { llmService } from '../services/llmService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ChatMode = 'ask' | 'agent';

type ModelOption = {
  id: string;
  name: string;
  provider: string;
  context: string;
};

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', context: '8K' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', context: '128K' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', context: '16K' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', context: '200K' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', context: '200K' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', context: '200K' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', context: '32K' },
  { id: 'local-llama', name: 'Llama 2 (Local)', provider: 'Self-Hosted', context: '4K' },
];

export function LLMChat() {
  const { addLog } = useConsole();
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI coding assistant. I can help you with:\n\n• Code generation and refactoring\n• Debugging and error analysis\n• Explaining code concepts\n• Suggesting optimizations\n\nWhat would you like to work on today?',
        timestamp: new Date(),
      }
    ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('ask');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [conversationId] = useState<string>(`chat-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);
 
    try {
      addLog('INFO', `Sending message to LLM (${currentModel?.name})...`, 'AI');
      
      // Call real LLM service
      const response = await llmService.chat(userMessage.content, conversationId);
      
      const modePrefix = mode === 'agent' ? '🤖 **Agent Mode Active**\n\n' : '';
    
    const assistantMessage: Message = {
   id: (Date.now() + 1).toString(),
  role: 'assistant',
content: `${modePrefix}${response.explanation}`,
      timestamp: new Date(),
      };
      
  setMessages(prev => [...prev, assistantMessage]);
      
      addLog('SUCCESS', `LLM response received (${response.tokensUsed} tokens used)`, 'AI');
      
      // If there are suggested actions, log them
   if (response.suggestedActions && response.suggestedActions.length > 0) {
  response.suggestedActions.forEach(action => {
   addLog('INFO', `Suggested: ${action.label}`, 'AI');
      });
      }
    } catch (error) {
    addLog('ERROR', `LLM request failed: ${error}`, 'AI');
      
      // Fallback to mock response
  const assistantMessage: Message = {
     id: (Date.now() + 1).toString(),
        role: 'assistant',
  content: `⚠️ **API Error** - Using fallback response.\n\nI received your message: "${userMessage.content}"\n\nThe backend LLM service is currently unavailable. This could be due to:\n• Missing API keys (OPENAI_API_KEY or ANTHROPIC_API_KEY)\n• Backend server not running\n• Network connectivity issues\n\nPlease check the console logs for more details.`,
timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
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
    
    // Clear backend conversation history
    llmService.clearHistory(conversationId);
    addLog('INFO', 'Chat history cleared', 'AI');
  };

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="h-full flex flex-col bg-panel/60 border-l border-hairline">
      {/* Header / Navbar */}
      <div className="bg-panel/80 border-b border-hairline">
        {/* Top Row: Title and Actions */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan" />
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">AI Assistant</h3>
          </div>

          {/* Mode Toggle in Navbar */}
          <div className="flex items-center gap-2">
            <div className="flex bg-panel border border-hairline rounded overflow-hidden">
              <button
                onClick={() => setMode('ask')}
                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  mode === 'ask'
                    ? 'bg-cyan text-ink'
                    : 'text-white/70 hover:text-white hover:bg-hairline'
                }`}
                title="Ask questions and get assistance"
              >
                💬 Ask
              </button>
              <button
                onClick={() => setMode('agent')}
                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  mode === 'agent'
                    ? 'bg-cyan text-ink'
                    : 'text-white/70 hover:text-white hover:bg-hairline'
                }`}
                title="Autonomous agent mode - can execute actions"
              >
                🤖 Agent
              </button>
            </div>

            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-hairline rounded transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Model Selector */}
        <div className="px-4 pb-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-panel border border-hairline rounded text-sm text-white/90 hover:border-cyan transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bot className="w-4 h-4 text-cyan flex-shrink-0" />
                <span className="font-medium">{selectedModelInfo?.name}</span>
                <span className="text-xs text-white/50">• {selectedModelInfo?.context} context</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/60 flex-shrink-0 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Model Dropdown */}
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-hairline rounded shadow-depth max-h-72 overflow-y-auto z-50 scrollbar-thin">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors ${
                      selectedModel === model.id
                        ? 'bg-cyan/10 text-cyan'
                        : 'text-white/80 hover:bg-hairline'
                    }`}
                  >
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{model.name}</span>
                        {selectedModel === model.id && (
                          <span className="text-xs px-1.5 py-0.5 bg-cyan/20 rounded">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {model.provider} • {model.context} context
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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

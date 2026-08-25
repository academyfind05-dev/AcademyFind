"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Sparkles, AlertTriangle, Search, GraduationCap, Briefcase, RotateCcw } from 'lucide-react';

const SUGGESTIONS = [
  { icon: GraduationCap, text: 'Top JEE coachings in Delhi under 1 Lakh?' },
  { icon: Search, text: 'NEET coaching with highest rating in Kota' },
  { icon: Briefcase, text: 'Any teaching jobs open right now?' },
];

const STORAGE_KEY = 'academyfind-ai-chat';

// Internal links use Next.js <Link> for instant client-side navigation,
// external/unknown links open in a new tab.
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (!href) return <>{children}</>;
  const isInternal = href.startsWith('/');
  if (isInternal) {
    return (
      <Link
        href={href}
        className="text-amber-600 font-medium underline decoration-amber-300 underline-offset-2 hover:text-amber-700 hover:decoration-amber-500 transition-colors break-all"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-600 font-medium underline decoration-amber-300 underline-offset-2 hover:text-amber-700 hover:decoration-amber-500 transition-colors break-all"
    >
      {children}
    </a>
  );
}

function MessageMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: MarkdownLink,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="space-y-1.5 my-2 list-none">{children}</ul>,
        li: ({ children }) => (
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function AISearchPage() {
  const { messages, status, sendMessage, error, setMessages } = useChat();
  const [input, setInput] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Set initial messages manually to fix TS errors with AI SDK v4
  useEffect(() => {
    if (messages.length === 0 && !hydrated) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          parts: [{ type: 'text', text: "Hi! I'm **AcademyFind AI**. I'm here to help you find the best coaching institutes, sports academies, tutors, or jobs. What are you looking for today?" }]
        } as any
      ]);
    }
  }, [messages.length, hydrated, setMessages]);

  const isLoading = status === 'submitted' || status === 'streaming' || isSending;

  // Clear isSending once status updates
  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') {
      setIsSending(false);
    }
  }, [status]);

  // 1️⃣ Hydrate chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, [setMessages]);

  // 2️⃣ Persist chat history whenever messages change (after hydration, to avoid wiping with empty array)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages, hydrated]);

  // 3️⃣ Track whether user is near the bottom — only auto-scroll if they are
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const submitText = (text: string) => {
    if (!text.trim() || isLoading) return;
    isNearBottomRef.current = true; // force scroll when user sends a new message
    setIsSending(true);
    sendMessage({ text });
    setInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitText(input);
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex flex-col items-center py-10 px-4">
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.45); }
          50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .msg-in { animation: fadeSlideIn 0.35s ease-out both; }
        .avatar-glow { animation: pulseGlow 1.8s infinite; }
        .typing-dot { animation: dotBounce 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl shadow-amber-100 overflow-hidden border border-amber-200 flex flex-col h-[85vh]">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white flex items-center justify-between gap-3 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AcademyFind AI Assistant</h1>
              <p className="text-amber-100 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                Live search · Powered by AI SDK 5.0
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              title="Start a new chat"
              className="relative flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 px-3 py-2 rounded-full transition-colors"
            >
              <RotateCcw size={13} /> New chat
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-5 bg-amber-50/30"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 text-center">
              <div className="p-4 bg-amber-100 rounded-2xl">
                <Bot size={40} className="text-amber-500" />
              </div>
              <div>
                <p className="text-slate-600 font-medium mb-1">Ask me anything about institutes, fees, or jobs</p>
                <p className="text-sm">Try one of these to get started 👇</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => submitText(s.text)}
                    className="flex items-center gap-3 text-left text-sm text-slate-600 bg-white border border-amber-200 rounded-xl px-4 py-3 hover:border-amber-400 hover:bg-amber-50 transition-all"
                  >
                    <s.icon size={16} className="text-amber-500 shrink-0" />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m: any) => (
              <div
                key={m.id}
                className={`msg-in flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                  }`}
                >
                  {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm'
                      : 'bg-white border border-amber-100 text-slate-700 shadow-sm rounded-tl-sm'
                  }`}
                >
                  {m.parts?.map((part: any, index: number) => {
                    if (part.type !== 'text') return null;
                    return m.role === 'user' ? (
                      <span key={index} className="whitespace-pre-wrap">{part.text}</span>
                    ) : (
                      <MessageMarkdown key={index} text={part.text?.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim()} />
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {status === 'error' && (
            <div className="msg-in flex gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle size={20} className="shrink-0" />
              <div className="text-sm">
                <strong>Oops! API Error:</strong><br />
                {error?.message || 'Failed to connect to the AI model. Check your terminal logs or API key.'}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="msg-in flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full avatar-glow bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-amber-100">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about institutes, fees, locations..."
              className="w-full pl-6 pr-14 py-4 bg-amber-50 rounded-full outline-none focus:ring-2 focus:ring-amber-400 border border-transparent focus:border-amber-300 transition-all text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer shadow-sm"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
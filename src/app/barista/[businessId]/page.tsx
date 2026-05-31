'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Coffee, Loader2, AlertCircle, ArrowUp, Menu, X } from 'lucide-react';

interface MenuItem {
  name: string;
  price: string;
  description?: string;
  category?: string;
}

interface BusinessInfo {
  name: string;
  industry: string;
  contextData: string;
  menuItems: MenuItem[];
  hasMenu: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  order?: { items: string; total: string } | null;
}

export default function BaristaPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = React.use(params);

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate sessionId on mount
  useEffect(() => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    setSessionId(id);
  }, []);

  // Fetch business info on mount
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/barista/${businessId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setBusiness(data);

        // Build welcome message with menu hint
        const menuHint = data.hasMenu ? ' You can ask me about our menu items and prices!' : '';
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Welcome to ${data.name}! I'm your digital assistant. How can I help you today?${menuHint}`,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [businessId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sending]);

  const sendMessage = async (overrideMessage?: string) => {
    const trimmed = overrideMessage || input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/barista/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });

      const data = await res.json();
      if (res.ok) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || "I'm having trouble right now. Please try again!",
          timestamp: new Date(),
          order: data.order || null,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, something went wrong. Please try again!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Connection error. Please check your internet and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  // ============ NOT FOUND STATE ============
  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Business Not Found</h2>
          <p className="text-sm text-muted-foreground mb-1">
            This QR code doesn&apos;t link to an active business.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Please check the QR code and try again, or ask the staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  // ============ CHAT INTERFACE ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] flex flex-col">
      {/* ===== TOP BAR ===== */}
      <header className="flex-shrink-0 glass-card border-b border-nerva-border/50 safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Business Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          {/* Business Name & Status */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate text-foreground">
              {business.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Online</span>
              <span className="text-xs text-muted-foreground/50 ml-1">{business.industry}</span>
            </div>
          </div>
          {/* Menu toggle button */}
          {business.hasMenu && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-xl transition-colors ${showMenu ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {/* Nerva branding */}
          <div className="text-[10px] text-muted-foreground/40 flex-shrink-0">
            Powered by Nerva AI
          </div>
        </div>
      </header>

      {/* ===== MENU PANEL (collapsible) ===== */}
      {showMenu && business.hasMenu && (
        <div className="flex-shrink-0 border-b border-nerva-border/30 bg-[#020509]/90 backdrop-blur-xl">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-amber-400">Menu</h3>
              <button onClick={() => setShowMenu(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto">
              {business.menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sendMessage(`I'd like to order: ${item.name}`);
                    setShowMenu(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground/60 mt-0.5">{item.description}</div>
                    )}
                  </div>
                  {item.price && (
                    <span className="text-xs font-semibold text-amber-400 ml-2 flex-shrink-0">{item.price}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CHAT MESSAGES ===== */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Welcome hint cards */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {business.hasMenu
              ? ['Show me the menu', 'What are your prices?', 'I\'d like to place an order']
              : ['Hello!', 'Tell me about your business', 'How can you help me?']
            .map((hint) => (
              <button
                key={hint}
                onClick={() => {
                  setInput(hint);
                  inputRef.current?.focus();
                }}
                className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:border-nerva-cyan/30 hover:text-nerva-cyan transition-all active:scale-95"
              >
                {hint}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bot avatar for assistant messages */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Coffee className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-nerva-cyan to-nerva-blue text-nerva-dark font-medium rounded-br-md'
                  : 'bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-foreground/90 rounded-bl-md'
              }`}
            >
              {msg.content}
              {/* Order confirmation badge */}
              {msg.order && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs font-semibold text-amber-400 mb-0.5">Order Placed</div>
                  <div className="text-xs text-muted-foreground">Items: {msg.order.items}</div>
                  <div className="text-xs font-semibold text-foreground">Total: {msg.order.total}</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Coffee className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full bg-nerva-cyan animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-nerva-cyan animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-nerva-cyan animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== INPUT BAR ===== */}
      <footer className="flex-shrink-0 border-t border-nerva-border/30 bg-[#020509]/80 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={sending}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-nerva-cyan/40 focus:ring-1 focus:ring-nerva-cyan/20 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !sending
                  ? 'bg-gradient-to-br from-nerva-cyan to-nerva-blue text-nerva-dark shadow-lg shadow-nerva-cyan/20 active:scale-90'
                  : 'bg-white/5 text-muted-foreground/30'
              }`}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}

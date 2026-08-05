"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Send, X, RefreshCw, Cpu, User } from "lucide-react";

const API = "https://raaviiplatform.com";

interface Message { role: "user" | "assistant"; content: string }

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400"
          style={{ animation: `widgetBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function AIChatWidget() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "سلام! 👋 من دستیار هوش مصنوعی راوی هستم.\nبر اساس تست‌هات بهت کمک می‌کنم. چطور می‌تونم کمکت کنم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const tok = localStorage.getItem("token") || "";
      // اگه لاگین باشه از ai-chat/user استفاده کن وگرنه از /api/ai
      let reply = "";
      if (tok) {
        const res = await fetch(`${API}/api/ai-chat/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ messages: newMsgs }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || data.message || "";
        }
      }
      if (!reply) {
        const res2 = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
          body: JSON.stringify({
            model: "gpt-4o", max_tokens: 600, stream: false,
            messages: [
              { role: "system", content: "تو دستیار روانشناسی راوی هستی. پاسخ‌های مفید و کوتاه فارسی بده." },
              ...newMsgs
            ]
          }),
        });
        const d2 = await res2.json();
        reply = d2.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";
      }
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ خطا در ارتباط. لطفاً دوباره تلاش کنید."
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!state.isLoggedIn) return null;

  return (
    <>
      <style>{`
        @keyframes widgetPing {
          0%   { transform:scale(1);   opacity:0.7; }
          70%  { transform:scale(1.7); opacity:0.1; }
          100% { transform:scale(2);   opacity:0; }
        }
        @keyframes widgetPing2 {
          0%   { transform:scale(1);   opacity:0.5; }
          70%  { transform:scale(1.4); opacity:0.08; }
          100% { transform:scale(1.6); opacity:0; }
        }
        @keyframes widgetBounce {
          0%,60%,100% { transform:translateY(0) }
          30% { transform:translateY(-5px) }
        }
        @keyframes widgetSlide {
          from { opacity:0; transform:translateY(12px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .widget-btn { transition: transform 0.2s ease; }
        .widget-btn:hover { transform: scale(1.1); }
        .widget-msg { animation: widgetSlide 0.25s ease-out both; }
      `}</style>

      {/* ── دکمه فلوتینگ ── */}
      <div className="hidden lg:block fixed bottom-24 left-4 z-50">
        <span className="absolute inset-0 rounded-full"
          style={{ background:"rgba(255,107,0,0.45)", animation:"widgetPing 2.2s ease-out infinite" }} />
        <span className="absolute inset-0 rounded-full"
          style={{ background:"rgba(255,107,0,0.25)", animation:"widgetPing2 2.2s ease-out 0.7s infinite" }} />
        <button onClick={() => setOpen(o => !o)}
          className="widget-btn relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#FF6B00,#f97316)",
            boxShadow: "0 6px 24px rgba(255,107,0,0.5)",
          }}>
          {open ? (
            <X size={22} className="text-white" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 18V5"/>
              <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
              <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
              <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
              <path d="M18 18a4 4 0 0 0 2-7.464"/>
              <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
              <path d="M6 18a4 4 0 0 1-2-7.464"/>
              <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── پنجره چت ── */}
      {open && (
        <div className="hidden lg:flex fixed bottom-44 left-4 z-50 w-80 flex-col rounded-2xl overflow-hidden"
          style={{
            height: "460px",
            background: "linear-gradient(135deg,#0a0f1e,#060912)",
            border: "1px solid rgba(255,107,0,0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            animation: "widgetSlide 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          }} dir="rtl">

          {/* هدر */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{
              background: "rgba(255,107,0,0.1)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 18V5"/>
                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
                <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
                <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
                <path d="M18 18a4 4 0 0 0 2-7.464"/>
                <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
                <path d="M6 18a4 4 0 0 1-2-7.464"/>
                <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-xs">دستیار هوش مصنوعی راوی</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-green-400 text-[10px] font-bold">آنلاین</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* پیام‌ها */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`widget-msg flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={isUser ? {
                      background: "linear-gradient(135deg,#FF6B00,#f97316)",
                    } : {
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    }}>
                    {isUser
                      ? <User size={11} className="text-white" />
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
                          <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
                        </svg>}
                  </div>
                  <div className="max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-6 whitespace-pre-wrap"
                    style={isUser ? {
                      background: "linear-gradient(135deg,#FF6B00,#f97316)",
                      color: "white",
                      borderRadius: "16px 4px 16px 16px",
                    } : {
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      borderRadius: "4px 16px 16px 16px",
                    }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="widget-msg flex items-end gap-2">
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
                    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
                  </svg>
                </div>
                <div className="px-3 py-2 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px 16px 16px 16px",
                  }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ورودی */}
          <div className="flex-shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex gap-2 items-center p-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <input ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="پیامت رو بنویس..."
                className="flex-1 bg-transparent text-white text-xs outline-none placeholder-slate-600"
              />
              <button onClick={send}
                disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg,#FF6B00,#f97316)"
                    : "rgba(255,255,255,0.06)",
                }}>
                {loading
                  ? <RefreshCw size={12} className="text-white animate-spin" />
                  : <Send size={12} className={input.trim() ? "text-white" : "text-slate-600"} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";
import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Message { role: "user" | "assistant"; content: string }
type Mode = "dashboard" | "user";

interface Props { targetUserId?: string; targetUserName?: string }

export default function AdminAIChat({ targetUserId, targetUserName }: Props) {
  const mode: Mode = targetUserId ? "user" : "dashboard";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: mode === "user"
      ? `سلام! می‌تونم پروفایل کاربر ${targetUserName || targetUserId} رو برات تحلیل کنم. چه اطلاعاتی می‌خوای؟`
      : "سلام! به داشبورد ادمین دسترسی دارم. می‌تونم CRM، آمار کاربران، رفتار کاربران و هشدارها رو تحلیل کنم.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll داخل chat container انجام میشه نه کل صفحه
  }, [messages]);

  const quickQueries = mode === "dashboard"
    ? ["CRM رو تحلیل کن", "کاربران فعال این هفته", "هشدارهای باز", "روند رشد سایت"]
    : ["تست‌هاش رو تحلیل کن", "ریسک‌های روانشناختی", "پیشنهاد برای این کاربر", "رفتار اخیرش"];

  async function send(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg: Message = { role: "user", content };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = mode === "user"
        ? `${API}/api/ai-chat/admin/user/${targetUserId}`
        : `${API}/api/ai-chat/admin`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "خطا در دریافت پاسخ." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-purple-600 text-white shadow-xl flex items-center justify-center text-2xl hover:bg-purple-700 transition-all"
        title="دستیار هوشمند ادمین"
      >
        🤖
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-96 h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-purple-200" dir="rtl">
          <div className="flex items-center justify-between px-4 py-3 bg-purple-600 rounded-t-2xl">
            <span className="text-white font-bold text-sm">
              {mode === "user" ? `تحلیل: ${targetUserName || "کاربر"}` : "دستیار داشبورد ادمین 🤖"}
            </span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">✕</button>
          </div>

          {/* دکمه‌های سریع */}
          <div className="flex flex-wrap gap-1 px-3 pt-2">
            {quickQueries.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full border border-purple-200 hover:bg-purple-100 transition">
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-purple-600 text-white"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-purple-100 text-purple-600 px-3 py-2 rounded-xl text-sm animate-pulse">در حال تحلیل...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="سوال از داشبورد بپرسید..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none dark:text-white"
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="bg-purple-600 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50">
              ارسال
            </button>
          </div>
        </div>
      )}
    </>
  );
}

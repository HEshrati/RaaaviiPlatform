"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, Send, ChevronDown } from "lucide-react";

const API = "https://raaviiplatform.com";

const CATEGORIES = ["مشکل فنی","سوال درباره تست‌ها","سوال درباره مچینگ","مشاوره روانشناسی","مسائل مالی","سایر"];

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sending, setSending] = useState(false);
  const [openId, setOpenId] = useState<string|null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    const r = await fetch(`${API}/api/support/my-tickets`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setTickets(await r.json());
  }

  async function submit() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    await fetch(`${API}/api/support/create`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subject, body, category }),
    });
    setSubject(""); setBody(""); setShowNew(false);
    setSending(false); loadTickets();
  }

  const STATUS_CFG: Record<string, any> = {
    open:       { label:"باز",          color:"#eab308", icon:Clock },
    in_progress:{ label:"در حال بررسی", color:"#3b82f6", icon:Clock },
    resolved:   { label:"حل شده",       color:"#22c55e", icon:CheckCircle2 },
    closed:     { label:"بسته",          color:"#64748b", icon:XCircle },
  };

  return (
    <div className="min-h-screen p-4 lg:p-6" dir="rtl"
      style={{ background:"linear-gradient(135deg,#060912,#0a0f1e)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.25)" }}>
              <MessageSquare size={18} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">پشتیبانی</h1>
              <p className="text-slate-500 text-xs">{tickets.length} تیکت</p>
            </div>
          </div>
          <button onClick={() => setShowNew(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white"
            style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
            <Plus size={13}/> تیکت جدید
          </button>
        </div>

        {showNew && (
          <div className="mb-5 p-5 rounded-2xl" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,107,0,0.2)" }}>
            <h2 className="text-white font-black text-sm mb-4">ثبت تیکت جدید</h2>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">دسته‌بندی</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">موضوع</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="موضوع مشکل یا سوال..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">توضیحات</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
                  placeholder="مشکل خود را با جزئیات بنویسید..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2">
                <button onClick={submit} disabled={sending || !subject || !body}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
                  style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", opacity: (!subject||!body) ? 0.5 : 1 }}>
                  <Send size={14}/> {sending ? "در حال ارسال..." : "ارسال تیکت"}
                </button>
                <button onClick={() => setShowNew(false)}
                  className="px-4 rounded-xl text-sm font-bold text-slate-400"
                  style={{ background:"rgba(255,255,255,0.05)" }}>
                  لغو
                </button>
              </div>
            </div>
          </div>
        )}

        {tickets.length === 0 && !showNew ? (
          <div className="text-center py-16">
            <MessageSquare size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">تیکت پشتیبانی ندارید</p>
            <button onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
              <Plus size={14}/> ثبت اولین تیکت
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => {
              const sc = STATUS_CFG[t.status] || STATUS_CFG.open;
              const Icon = sc.icon;
              return (
                <div key={t.id} className="rounded-2xl overflow-hidden"
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <button onClick={() => setOpenId(openId === t.id ? null : t.id)}
                    className="w-full p-4 flex items-center justify-between text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: sc.color }} />
                      <div>
                        <p className="text-white font-bold text-sm">{t.subject}</p>
                        <p className="text-slate-500 text-[10px]">
                          {t.category} · {t.created_at ? new Date(t.created_at).toLocaleDateString("fa-IR") : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:`${sc.color}18`, color:sc.color }}>
                        {sc.label}
                      </span>
                      <ChevronDown size={14} className="text-slate-600"
                        style={{ transform: openId === t.id ? "rotate(180deg)" : "none", transition:"transform 0.2s" }} />
                    </div>
                  </button>
                  {openId === t.id && (
                    <div className="px-4 pb-4 border-t border-white/6">
                      <p className="text-slate-300 text-sm leading-7 mt-3">{t.body}</p>
                      {t.admin_reply && (
                        <div className="mt-3 p-3 rounded-xl"
                          style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
                          <p className="text-green-400 text-xs font-bold mb-1">پاسخ پشتیبانی:</p>
                          <p className="text-slate-300 text-sm">{t.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

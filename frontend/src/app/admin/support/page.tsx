"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Send, RefreshCw, Clock, CheckCircle2, Filter } from "lucide-react";

const API = "https://raaviiplatform.com";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string|null>(null);
  const [replies, setReplies] = useState<Record<string,string>>({});
  const [filter, setFilter] = useState("open");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/api/support/admin/all?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) setTickets(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function reply(ticketId: string) {
    await fetch(`${API}/api/support/admin/reply/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reply: replies[ticketId], status: "resolved" }),
    });
    setReplies(r => ({...r, [ticketId]:""}));
    load();
  }

  const STATUS_CFG: Record<string,any> = {
    open:        { label:"باز",          color:"#eab308" },
    in_progress: { label:"در حال بررسی", color:"#3b82f6" },
    resolved:    { label:"حل شده",       color:"#22c55e" },
    closed:      { label:"بسته",         color:"#64748b" },
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.25)" }}>
            <MessageSquare size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-white font-black text-lg">تیکت‌های پشتیبانی</h1>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white">
          <RefreshCw size={16} className={loading ? "animate-spin":""} />
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {["open","in_progress","resolved","closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filter===s ? `${STATUS_CFG[s].color}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter===s ? STATUS_CFG[s].color+"40" : "rgba(255,255,255,0.07)"}`,
              color: filter===s ? STATUS_CFG[s].color : "#64748b",
            }}>
            {STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.map((t:any) => {
          const sc = STATUS_CFG[t.status] || STATUS_CFG.open;
          return (
            <div key={t.id} className="rounded-2xl overflow-hidden"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <button onClick={() => setOpenId(openId===t.id ? null : t.id)}
                className="w-full p-4 flex items-center justify-between text-right">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background:"rgba(255,107,0,0.12)" }}>
                    <span className="text-orange-400 text-xs font-black">
                      {t.user?.name?.charAt(0) || "؟"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.subject}</p>
                    <p className="text-slate-500 text-[10px]">
                      {t.user?.name} · {t.category} · {t.created_at ? new Date(t.created_at).toLocaleDateString("fa-IR") : ""}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background:`${sc.color}18`, color:sc.color }}>{sc.label}</span>
              </button>
              {openId === t.id && (
                <div className="px-4 pb-4 border-t border-white/6">
                  <p className="text-slate-300 text-sm leading-7 mt-3 mb-4">{t.body}</p>
                  {t.admin_reply && (
                    <div className="p-3 rounded-xl mb-3"
                      style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
                      <p className="text-green-400 text-xs font-bold mb-1">پاسخ قبلی:</p>
                      <p className="text-slate-300 text-sm">{t.admin_reply}</p>
                    </div>
                  )}
                  {t.status !== "resolved" && t.status !== "closed" && (
                    <div className="flex gap-2">
                      <input value={replies[t.id]||""} onChange={e => setReplies(r=>({...r,[t.id]:e.target.value}))}
                        placeholder="پاسخ به کاربر..."
                        className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                      <button onClick={() => reply(t.id)}
                        disabled={!replies[t.id]?.trim()}
                        className="px-4 py-2 rounded-xl text-sm font-black text-white flex items-center gap-1.5"
                        style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)" }}>
                        <Send size={13}/> ارسال
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!loading && tickets.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            تیکتی در این وضعیت وجود ندارد
          </div>
        )}
      </div>
    </div>
  );
}

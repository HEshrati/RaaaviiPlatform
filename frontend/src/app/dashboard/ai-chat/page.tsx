"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import {
  Send, RefreshCw, Cpu, User, Plus, Trash2,
  MessageSquare, Edit3, Sparkles, Menu, X, Copy, ChevronRight
} from "lucide-react";

const API = "https://raaviiplatform.com";

interface Message { id?: string; role: "user"|"assistant"; content: string }
interface Session { id: string; title: string; updated_at: string; last_message?: string }

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0,1,2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full"
          style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)",
            animation:`typingBounce 1.4s ease-in-out ${i*0.16}s infinite` }} />
      ))}
    </div>
  );
}

function Bubble({ msg, onCopy }: { msg: Message; onCopy?: (c:string)=>void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 group ${isUser?"flex-row-reverse":"flex-row"}`}>
      <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={isUser
          ? { background:"linear-gradient(135deg,#FF6B00,#f97316)" }
          : { background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
        {isUser ? <User size={13} className="text-white"/> : <Cpu size={13} className="text-white"/>}
      </div>
      <div className={`max-w-[80%] lg:max-w-[72%] px-3.5 py-2.5 text-sm leading-7 ${
        isUser ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-tr-md"
      }`}
        style={isUser
          ? { background:"linear-gradient(135deg,#FF6B00,#f97316)", color:"white" }
          : { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0" }}>
        {!isUser ? (
          <div style={{direction:"rtl"}}>
            {msg.content.split('\n').map((line,i) => {
              if(line.startsWith('## ')) return <h3 key={i} style={{fontWeight:900,fontSize:'0.88rem',marginTop:'0.5rem',color:'#f8fafc'}}>{line.replace('## ','')}</h3>;
              if(line.startsWith('- ')||line.startsWith('• ')) return <div key={i} style={{paddingRight:'0.75rem',marginBottom:'0.15rem',fontSize:'0.82rem'}}>{'• '}{line.replace(/^[-•] /,'')}</div>;
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              const rendered = parts.map((p,j)=>p.startsWith('**')&&p.endsWith('**')?<strong key={j} style={{color:'#f8fafc'}}>{p.slice(2,-2)}</strong>:<span key={j}>{p}</span>);
              if(!line.trim()) return <div key={i} style={{height:'0.35rem'}}/>;
              return <div key={i} style={{marginBottom:'0.1rem',fontSize:'0.83rem'}}>{rendered}</div>;
            })}
          </div>
        ) : <span className="text-sm">{msg.content}</span>}
      </div>
      {!isUser && (
        <button onClick={() => onCopy?.(msg.content)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all self-start mt-1"
          style={{ background:"rgba(255,255,255,0.06)" }}>
          <Copy size={11} className="text-slate-500" />
        </button>
      )}
    </div>
  );
}

export default function AiChatPage() {
  const { state } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [token, setToken] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setToken(localStorage.getItem("token") || ""); }, []);
  useEffect(() => { if (token) loadSessions(); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  async function loadSessions() {
    const r = await fetch(`${API}/api/ai-chat/sessions`, { headers:{ Authorization:`Bearer ${token}` } });
    if (r.ok) setSessions(await r.json());
  }

  async function newChat() {
    const r = await fetch(`${API}/api/ai-chat/sessions`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ title:"چت جدید" }),
    });
    if (r.ok) {
      const s = await r.json();
      setSessions(prev => [s, ...prev]);
      setActiveSession(s.id);
      setMessages([{ role:"assistant", content:`سلام ${state.user?.name?.split(" ")[0]||"دوست"} 👋\n\nچطور می‌تونم کمکت کنم؟` }]);
      setSidebarOpen(false);
    }
  }

  async function loadSession(id: string) {
    setActiveSession(id);
    setSidebarOpen(false);
    const r = await fetch(`${API}/api/ai-chat/sessions/${id}/messages`, { headers:{ Authorization:`Bearer ${token}` } });
    if (r.ok) {
      const d = await r.json();
      setMessages(d.messages?.length ? d.messages : [{ role:"assistant", content:"چی می‌خوای بپرسی؟" }]);
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`${API}/api/ai-chat/sessions/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession === id) { setActiveSession(null); setMessages([]); }
  }

  async function renameSession(id: string) {
    if (!editTitle.trim()) return;
    await fetch(`${API}/api/ai-chat/sessions/${id}`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ title: editTitle }),
    });
    setSessions(prev => prev.map(s => s.id===id ? {...s, title:editTitle} : s));
    setEditingId(null);
  }

  async function saveMessage(sessionId: string, role: string, content: string) {
    await fetch(`${API}/api/ai-chat/sessions/${sessionId}/messages`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ role, content }),
    }).catch(() => {});
  }

  async function send(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;

    let sessionId = activeSession;
    if (!sessionId) {
      const r = await fetch(`${API}/api/ai-chat/sessions`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ title: content.slice(0, 30) }),
      });
      if (r.ok) {
        const s = await r.json();
        sessionId = s.id;
        setActiveSession(s.id);
        setSessions(prev => [s, ...prev]);
      }
    }

    setInput("");
    const userMsg: Message = { role:"user", content };
    const history = [...messages.filter(m => m.content !== "چی می‌خوای بپرسی؟"), userMsg];
    setMessages(history);
    setLoading(true);
    if (sessionId) await saveMessage(sessionId, "user", content);

    try {
      const apiMessages = history
        .filter(m => !m.content.includes("چطور می‌تونم کمکت کنم"))
        .map(m => ({ role:m.role, content:m.content }));

      // پیام خالی برای streaming
      setMessages(prev => [...prev, { role:"assistant", content:"" }]);
      let fullReply = "";
      let streamOk = false;

      // شبیه‌سازی streaming با typewriter effect
      const currentToken = localStorage.getItem("token") || token;
      const r2 = await fetch(`${API}/api/ai-chat/user`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${currentToken}` },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await r2.json();
      fullReply = data.reply || data.message || "پاسخی دریافت نشد.";

      // typewriter effect — نشون دادن کلمه به کلمه
      const words = fullReply.split(" ");
      let displayed = "";
      for (let i = 0; i < words.length; i++) {
        displayed += (i === 0 ? "" : " ") + words[i];
        const snap = displayed;
        setMessages(prev => [...prev.slice(0,-1), { role:"assistant", content:snap }]);
        // هر ۳ کلمه یه pause کوتاه
        if (i % 3 === 2) await new Promise(r => setTimeout(r, 30));
      }
      streamOk = true;

      if (sessionId) {
        await saveMessage(sessionId, "assistant", fullReply);
        setSessions(prev => prev.map(s =>
          s.id===sessionId ? {...s, last_message:fullReply.slice(0,50), updated_at:new Date().toISOString()} : s
        ));
      }
    } catch {
      setMessages(prev => [...prev.slice(0,-1), { role:"assistant", content:"⚠️ خطا در ارتباط با سرور." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const SUGGESTIONS = [
    { text:"نتایج تست‌هام رو تحلیل کن", icon:"🧠" },
    { text:"چطور اضطرابم رو مدیریت کنم؟", icon:"❤️" },
    { text:"سبک دلبستگی من چیه؟", icon:"⭐" },
    { text:"برای روابط بهتر چی پیشنهاد داری؟", icon:"💫" },
  ];

  return (
    <>
      <style>{`
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="flex h-[calc(100vh-68px)] lg:h-screen overflow-hidden" dir="rtl"
        style={{ background:"linear-gradient(135deg,#060912,#0a0f1e)", marginBottom:"-1rem", marginLeft:"-1rem", marginRight:"-1rem", marginTop:"-1rem" }}>

        {/* ── Sidebar overlay موبایل ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed lg:relative top-0 right-0 h-full z-50 flex flex-col flex-shrink-0
          w-[280px] lg:w-64 transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
          style={{ background:"rgba(6,9,18,0.98)", borderLeft:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(20px)" }}>

          <div className="flex items-center justify-between p-4 border-b border-white/7">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-orange-400" />
              <span className="text-white font-black text-sm">مکالمات</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white"
              style={{ background:"rgba(255,255,255,0.06)" }}>
              <X size={15} />
            </button>
          </div>

          <div className="p-3">
            <button onClick={newChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
              <Plus size={15} /> چت جدید
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-center py-8 text-slate-600 text-xs">هنوز چتی ندارید</p>
            ) : sessions.map(s => (
              <div key={s.id} onClick={() => loadSession(s.id)}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: activeSession===s.id ? "rgba(255,107,0,0.12)" : "transparent",
                  border: `1px solid ${activeSession===s.id ? "rgba(255,107,0,0.25)" : "transparent"}`,
                }}>
                <MessageSquare size={12} style={{ color:activeSession===s.id?"#FF6B00":"#475569", flexShrink:0 }} />
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <input value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => renameSession(s.id)}
                      onKeyDown={e => e.key==="Enter" && renameSession(s.id)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      className="w-full bg-transparent text-slate-700 text-xs outline-none border-b border-orange-400" />
                  ) : (
                    <p className="text-xs font-bold truncate" style={{ color:activeSession===s.id?"#fff":"#94a3b8" }}>
                      {s.title}
                    </p>
                  )}
                  {s.last_message && <p className="text-[10px] text-slate-600 truncate">{s.last_message}</p>}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white">
                    <Edit3 size={10} />
                  </button>
                  <button onClick={e => deleteSession(s.id, e)}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <header className="flex items-center gap-3 px-3 py-2.5 flex-shrink-0"
            style={{ background:"rgba(6,9,18,0.9)", borderBottom:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)" }}>
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <Cpu size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">دستیار راوی</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-green-400 text-[10px]">آنلاین</p>
                </div>
              </div>
            </div>
            <button onClick={newChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"#94a3b8" }}>
              <Plus size={13} />
              <span className="hidden sm:inline">جدید</span>
            </button>
          </header>

          {/* Quick prompts — فقط وقتی session فعاله */}
          {activeSession && (
            <div className="flex gap-2 px-3 pt-2.5 pb-1 overflow-x-auto flex-shrink-0 scrollbar-none">
              {[
                { icon:"🧠", label:"تحلیل تست", text:"نتایج تست‌هام رو تحلیل کن" },
                { icon:"❤️", label:"اضطراب",    text:"چطور اضطرابم رو مدیریت کنم؟" },
                { icon:"💑", label:"رابطه",      text:"برای بهبود روابطم چی پیشنهاد داری؟" },
                { icon:"🛡️", label:"دلبستگی",   text:"سبک دلبستگی من چه تأثیری روی روابطم داره؟" },
              ].map(p => (
                <button key={p.label} onClick={() => send(p.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0"
                  style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", color:"#a78bfa" }}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {!activeSession ? (
              <div className="flex flex-col items-center justify-center h-full pb-16 text-center px-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow:"0 16px 40px rgba(99,102,241,0.35)" }}>
                  <Sparkles size={32} className="text-white" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">دستیار هوشمند راوی</h2>
                <p className="text-slate-500 text-xs max-w-xs leading-relaxed mb-5">
                  یه چت جدید شروع کن یا از سوالات پیشنهادی استفاده کن
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                  {SUGGESTIONS.map(s => (
                    <button key={s.text} onClick={async () => { await newChat(); setTimeout(() => send(s.text), 300); }}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-right text-xs font-bold transition-all"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#94a3b8" }}>
                      <span className="text-base flex-shrink-0">{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} style={{ animation:"msgIn 0.3s ease both" }}>
                    <Bubble msg={msg} onCopy={c => navigator.clipboard.writeText(c)} />
                  </div>
                ))}
                {loading && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      <Cpu size={13} className="text-white" />
                    </div>
                    <div className="px-3 py-2 rounded-2xl"
                      style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)" }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input — بهینه موبایل */}
          <div className="flex-shrink-0 px-3 pb-3 pt-2"
            style={{ background:"rgba(6,9,18,0.8)", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-end gap-2 p-2 rounded-2xl"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <textarea ref={inputRef} value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={e => {
                  if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="پیامت رو بنویس..."
                rows={1}
                className="flex-1 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none bg-transparent px-2 py-1.5 leading-6"
                style={{ minHeight:"36px", maxHeight:"120px" }} />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg,#FF6B00,#f97316)"
                    : "rgba(255,255,255,0.07)",
                }}>
                {loading
                  ? <RefreshCw size={16} className="text-white animate-spin" />
                  : <Send size={16} className={input.trim() ? "text-white" : "text-slate-600"} />}
              </button>
            </div>
            <p className="text-center text-slate-700 text-[10px] mt-1.5 hidden sm:block">
              Shift+Enter برای خط جدید
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

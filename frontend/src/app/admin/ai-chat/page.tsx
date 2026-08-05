"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";
import {
  Send, Cpu, RefreshCw, Trash2, Copy, CheckCheck,
  TrendingUp, Users, AlertTriangle, BarChart2, Database,
  Zap, Plus, MessageSquare, Edit3, Menu, X, Sparkles
} from "lucide-react";

const API = "https://raaviiplatform.com";

interface Message { role:"user"|"assistant"; content:string; ts:number }
interface Session { id:string; title:string; updated_at:string; last_message?:string }

const QUICK_PROMPTS = [
  { icon:TrendingUp, label:"نرخ ریزش",    text:"نرخ ریزش کاربران رو بررسی کن و راهکارهای کاهش آن رو پیشنهاد بده." },
  { icon:Users,       label:"رشد کاربران", text:"بهترین روش‌های جذب کاربر جدید برای پلتفرم راوی چیست؟" },
  { icon:AlertTriangle, label:"CRM تحلیل",  text:"داده‌های CRM رو تحلیل کن. کاربران در چه مرحله‌ای بیشتر ریزش دارن؟" },
  { icon:BarChart2,   label:"رویداد بهینه",text:"کدام نوع رویداد بیشترین نرخ موفقیت رو داره؟" },
  { icon:Zap,         label:"مچینگ هوشمند",text:"الگوریتم مچینگ فعلی چه نقاط ضعفی داره؟" },
  { icon:Database,    label:"تست‌ها",       text:"کدام تست‌ها بیشترین نرخ تکمیل رو دارن؟" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0,1,2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-orange-400"
          style={{ animation:`tBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function AdminAIChatPage() {
  const { state } = useApp();
  const router = useRouter();
  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [dashboardContext, setDashboardContext] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = typeof window!=="undefined" ? localStorage.getItem("token")||"" : "";
  const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };

  useEffect(() => {
    if (!state.isLoading && (!state.isLoggedIn || !isAdmin)) router.push("/dashboard");
  }, [state.isLoading, state.isLoggedIn, isAdmin]);

  useEffect(() => { loadSessions(); loadDashContext(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function loadSessions() {
    const r = await fetch(`${API}/api/ai-chat/sessions?type=admin`, { headers });
    if (r.ok) setSessions(await r.json());
  }

  async function loadDashContext() {
    try {
      const [stats, crm] = await Promise.allSettled([
        fetch(`${API}/api/admin/stats`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/crm/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
      ]);
      const s = (stats as any).value;
      const c = (crm as any).value;
      setDashboardContext(
        `آمار پلتفرم: کاربران=${s?.totalUsers||0}, رویدادها=${s?.totalEvents||0}, رزروها=${s?.totalBookings||0}. ` +
        `CRM: ${c ? JSON.stringify(c).slice(0,200) : 'در دسترس نیست'}`
      );
    } catch {}
  }

  async function newChat() {
    const r = await fetch(`${API}/api/ai-chat/sessions`, {
      method:"POST", headers,
      body: JSON.stringify({ title:"چت ادمین" }),
    });
    if (r.ok) {
      const s = await r.json();
      setSessions(prev => [s, ...prev]);
      setActiveSession(s.id);
      setMessages([{ role:"assistant", content:"سلام ادمین! 🧠\n\nمن دستیار هوشمند راوی هستم. داده‌های واقعی داشبورد رو برام بررسی می‌کنم.\n\n• تحلیل CRM\n• نرخ ریزش\n• عملکرد رویدادها\n• پیشنهادات استراتژیک", ts:Date.now() }]);
      setSidebarOpen(false);
    }
  }

  async function loadSession(id: string) {
    setActiveSession(id); setSidebarOpen(false);
    const r = await fetch(`${API}/api/ai-chat/sessions/${id}/messages`, { headers });
    if (r.ok) {
      const d = await r.json();
      setMessages(d.messages?.length
        ? d.messages.map((m: any) => ({ ...m, ts: new Date(m.created_at).getTime() }))
        : [{ role:"assistant", content:"این مکالمه خالیه. چی می‌خوای بپرسی؟", ts:Date.now() }]
      );
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`${API}/api/ai-chat/sessions/${id}`, { method:"DELETE", headers });
    setSessions(prev => prev.filter(s => s.id!==id));
    if (activeSession===id) { setActiveSession(null); setMessages([]); }
  }

  async function renameSession(id: string) {
    if (!editTitle.trim()) return;
    await fetch(`${API}/api/ai-chat/sessions/${id}`, {
      method:"PATCH", headers,
      body: JSON.stringify({ title:editTitle }),
    });
    setSessions(prev => prev.map(s => s.id===id ? {...s, title:editTitle} : s));
    setEditingId(null);
  }

  async function saveMessage(sessionId: string, role: string, content: string) {
    await fetch(`${API}/api/ai-chat/sessions/${sessionId}/messages`, {
      method:"POST", headers,
      body: JSON.stringify({ role, content }),
    }).catch(()=>{});
  }

  async function send(text?: string) {
    const content = (text||input).trim();
    if (!content||loading) return;

    let sessionId = activeSession;
    if (!sessionId) {
      const r = await fetch(`${API}/api/ai-chat/sessions`, {
        method:"POST", headers, body:JSON.stringify({ title:"چت ادمین" }),
      });
      if (r.ok) {
        const s = await r.json();
        sessionId = s.id;
        setActiveSession(s.id);
        setSessions(prev => [s, ...prev]);
      }
    }

    setInput("");
    const newMsg: Message = { role:"user", content, ts:Date.now() };
    const history = [...messages.filter(m => !m.content.includes("دستیار هوشمند راوی")), newMsg];
    setMessages(history);
    setLoading(true);

    if (sessionId) await saveMessage(sessionId, "user", content);

    try {
      const contextPrompt = dashboardContext
        ? `[داده‌های داشبورد: ${dashboardContext}]\n\n`
        : "";
      const apiMessages = [
        { role:"user", content: contextPrompt + content }
      ];

      const r = await fetch(`${API}/api/ai-chat/admin`, {
        method:"POST", headers,
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await r.json();
      const reply = data.reply || "پاسخی دریافت نشد.";
      const aMsg: Message = { role:"assistant", content:reply, ts:Date.now() };
      setMessages(prev => [...prev, aMsg]);

      if (sessionId) {
        await saveMessage(sessionId, "assistant", reply);
        setSessions(prev => prev.map(s =>
          s.id===sessionId ? {...s, last_message:reply.slice(0,50), updated_at:new Date().toISOString()} : s
        ));
      }
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"⚠️ خطا در ارتباط با سرور.", ts:Date.now() }]);
    } finally { setLoading(false); }
  }

  function copyMsg(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <style>{`
        @keyframes tBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="flex h-screen overflow-hidden" dir="rtl"
        style={{ background:"linear-gradient(135deg,#060912,#0a0f1e)" }}>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ━━━ Sidebar ━━━ */}
        <aside className={`fixed lg:relative top-0 right-0 h-full z-50 w-72 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen?"translate-x-0":"translate-x-full lg:translate-x-0"}`}
          style={{ background:"rgba(6,9,18,0.97)", borderLeft:"1px solid rgba(255,107,0,0.12)" }}>

          <div className="flex items-center justify-between p-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-orange-400" />
              <span className="text-white font-black text-sm">چت‌های ادمین</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500">
              <X size={16} />
            </button>
          </div>

          <div className="p-3">
            <button onClick={newChat}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
              <Plus size={15} /> چت جدید
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {sessions.length===0 ? (
              <p className="text-center text-slate-600 text-xs py-8">هنوز چتی ندارید</p>
            ) : sessions.map(s => (
              <div key={s.id} onClick={() => loadSession(s.id)}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: activeSession===s.id ? "rgba(255,107,0,0.1)" : "transparent",
                  border: `1px solid ${activeSession===s.id ? "rgba(255,107,0,0.2)" : "transparent"}`,
                }}>
                <MessageSquare size={13} style={{ color:activeSession===s.id?"#FF6B00":"#475569", flexShrink:0 }} />
                <div className="flex-1 min-w-0">
                  {editingId===s.id ? (
                    <input value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                      onBlur={() => renameSession(s.id)}
                      onKeyDown={e => e.key==="Enter" && renameSession(s.id)}
                      onClick={e => e.stopPropagation()} autoFocus
                      className="w-full bg-transparent text-white text-xs outline-none border-b border-orange-400" />
                  ) : (
                    <p className="text-xs font-bold truncate"
                      style={{ color:activeSession===s.id?"#fff":"#94a3b8" }}>{s.title}</p>
                  )}
                  {s.last_message && (
                    <p className="text-[10px] text-slate-600 truncate">{s.last_message}</p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                  <button onClick={e=>{e.stopPropagation();setEditingId(s.id);setEditTitle(s.title);}}
                    className="p-1 rounded text-slate-500 hover:text-white"><Edit3 size={11}/></button>
                  <button onClick={e=>deleteSession(s.id,e)}
                    className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ━━━ Main ━━━ */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background:"rgba(6,9,18,0.85)", borderBottom:"1px solid rgba(255,107,0,0.15)", backdropFilter:"blur(20px)" }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8">
              <Menu size={18} />
            </button>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"0 4px 16px rgba(255,107,0,0.3)" }}>
              <Cpu size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">دستیار هوشمند ادمین</p>
              <p className="text-orange-400 text-[10px] font-bold">
                {dashboardContext ? "✅ داشبورد لود شد" : "⏳ در حال لود داده‌ها..."}
              </p>
            </div>
            <button onClick={newChat} className="mr-auto hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <Plus size={12}/> جدید
            </button>
          </header>

          {/* Quick Prompts */}
          {activeSession && (
            <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto flex-shrink-0">
              {QUICK_PROMPTS.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.label} onClick={() => send(p.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
                    style={{ background:"rgba(255,107,0,0.08)", border:"1px solid rgba(255,107,0,0.15)", color:"#fb923c" }}>
                    <Icon size={11}/> {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {!activeSession ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                  style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"0 16px 48px rgba(255,107,0,0.3)" }}>
                  <Sparkles size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">دستیار ادمین راوی</h2>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
                  با داده‌های واقعی داشبورد کار می‌کنم
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_PROMPTS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.label}
                        onClick={() => { newChat(); setTimeout(() => send(p.text), 400); }}
                        className="flex items-center gap-2 p-3 rounded-xl text-right text-xs font-bold transition-all"
                        style={{ background:"rgba(255,107,0,0.07)", border:"1px solid rgba(255,107,0,0.15)", color:"#fb923c" }}>
                        <Icon size={14} className="flex-shrink-0"/> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => {
                  const isUser = m.role==="user";
                  return (
                    <div key={i} className={`flex ${isUser?"justify-start flex-row-reverse":"justify-start"} gap-2.5`}
                      style={{ animation:"fadeIn 0.3s ease-out both" }}>
                      <div className="w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center"
                        style={isUser
                          ? { background:"linear-gradient(135deg,#FF6B00,#f97316)" }
                          : { background:"linear-gradient(135deg,#1e293b,#334155)" }}>
                        {isUser ? <span className="text-white text-xs font-black">A</span>
                          : <Cpu size={14} className="text-orange-400" />}
                      </div>
                      <div className="max-w-[75%] group relative">
                        <div className={`px-4 py-3 text-sm leading-7 whitespace-pre-wrap ${
                          isUser?"rounded-2xl rounded-tl-md":"rounded-2xl rounded-tr-md"
                        }`}
                          style={isUser
                            ? { background:"linear-gradient(135deg,#FF6B00,#f97316)", color:"white" }
                            : { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#e2e8f0" }}>
                          {m.content}
                        </div>
                        {!isUser && (
                          <button onClick={() => copyMsg(m.content, i)}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                            style={{ background:"rgba(255,255,255,0.1)" }}>
                            {copied===i ? <CheckCheck size={12} className="text-green-400"/> : <Copy size={12} className="text-slate-400"/>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center"
                      style={{ background:"linear-gradient(135deg,#1e293b,#334155)" }}>
                      <Cpu size={14} className="text-orange-400"/>
                    </div>
                    <div className="px-4 py-2 rounded-2xl"
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                      <TypingDots/>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 pb-5 pt-2"
            style={{ background:"rgba(6,9,18,0.8)", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-end gap-2.5 p-2.5 rounded-2xl"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <textarea ref={textareaRef} value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height="auto";
                  e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";
                }}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
                placeholder="سوال از داشبورد بپرسید..."
                rows={1}
                className="flex-1 text-sm text-white placeholder-slate-600 outline-none resize-none bg-transparent px-2 py-1.5 leading-6"
                style={{ minHeight:"36px", maxHeight:"120px" }}/>
              <button onClick={() => send()} disabled={!input.trim()||loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: input.trim()&&!loading ? "linear-gradient(135deg,#FF6B00,#f97316)" : "rgba(255,255,255,0.08)" }}>
                {loading
                  ? <RefreshCw size={16} className="text-white animate-spin"/>
                  : <Send size={16} className={input.trim()?"text-white":"text-slate-600"}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

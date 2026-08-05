"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu, Users, BarChart2, AlertTriangle, CheckCircle2,
  Sparkles, RefreshCw, ChevronDown, ChevronUp, TrendingUp,
  Shield, Zap, Star, Target, Clock, Eye, Play
} from "lucide-react";

const SITE = "https://raaviiplatform.com";
const CARD = {background:"linear-gradient(145deg,#1B2A4A,#132038)",border:"1px solid rgba(255,255,255,0.07)"};

function RingChart({value,color,size=80}:{value:number;color:string;size:number}) {
  const r=(size-8)/2; const circ=2*Math.PI*r;
  const dash=circ*(1-value/100);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dashoffset 1s ease"}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="white" fontSize={13} fontWeight="900">
        {value}٪
      </text>
    </svg>
  );
}

export default function AdminMatchingPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({logs:[],stats:{}});
  const [events, setEvents] = useState<any[]>([]);
  const [selEvent, setSelEvent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string|null>(null);
  const [tab, setTab] = useState<"crm"|"users"|"run">("crm");
  const [users, setUsers] = useState<any[]>([]);
  const [runResult, setRunResult] = useState<any>(null);

  const token = typeof window!=="undefined"?localStorage.getItem("token")||"":"";
  const headers = {Authorization:`Bearer ${token}`,"Content-Type":"application/json"};

  useEffect(() => {
    Promise.all([
      fetch(`${SITE}/api/matching/crm`,{headers}).then(r=>r.ok?r.json():{logs:[],stats:{}}),
      fetch(`${SITE}/api/events?limit=20`,{headers}).then(r=>r.ok?r.json():{}),
      fetch(`${SITE}/api/users?limit=50`,{headers}).then(r=>r.ok?r.json():[]).catch(()=>[]),
    ]).then(([d,ev,us]:any[])=>{
      setData(d); setEvents((ev as any)?.events||(ev as any)?.data||[]); setUsers(Array.isArray(us)?us:(us?.data||[]));
    }).finally(()=>setLoading(false));
  },[]);

  async function loadCRM(eventId?:string) {
    setLoading(true);
    const url = `${SITE}/api/matching/crm${eventId?`?eventId=${eventId}`:""}`;
    const d = await fetch(url,{headers}).then(r=>r.ok?r.json():{}).catch(()=>({}));
    setData(d); setLoading(false);
  }

  async function runMatching() {
    if(!selEvent){alert("یک ایونت انتخاب کن");return;}
    const r = await fetch(`${SITE}/api/matching/create-groups/${selEvent}`,{
      method:"POST",headers,body:JSON.stringify({groupSize:5,eventType:"mixed"})
    }).then(r=>r.json());
    setRunResult(r);
    await loadCRM(selEvent);
  }

  async function getAI() {
    if(!selEvent){alert("یک ایونت انتخاب کن");return;}
    setLoadingAI(true);
    const r = await fetch(`${SITE}/api/matching/ai-analyze/${selEvent}`,{
      method:"POST",headers
    }).then(r=>r.ok?r.json():{}).catch(()=>({}));
    setAiAnalysis((r as any).analysis||"خطا در دریافت تحلیل");
    setLoadingAI(false);
  }

  const stats = data.stats || {};
  const logs = data.logs || [];
  const avgScore = parseFloat(stats.avg_score||"0");
  const successRate = stats.total_matches>0
    ? Math.round((stats.high_compat/stats.total_matches)*100) : 0;

  return (
    <div className="min-h-screen pb-16 text-white" dir="rtl"
      style={{background:"linear-gradient(135deg,#0d1117 0%,#1a2436 100%)"}}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
            <Cpu size={18} className="text-orange-400"/>
          </div>
          <div>
            <h1 className="font-black text-xl">الگوریتم مچینگ — CRM</h1>
            <p className="text-slate-400 text-xs">سیستم هوشمند گروه‌بندی راوی v3.0</p>
          </div>
        </div>
        {/* tabs */}
        <div className="flex gap-2 mt-4">
          {[["crm","لاگ مچینگ"],["users","کاربران"],["run","اجرای مچینگ"]].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k as any)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background:tab===k?"rgba(255,107,0,0.2)":"rgba(255,255,255,0.05)",
                border:`1px solid ${tab===k?"rgba(255,107,0,0.4)":"rgba(255,255,255,0.1)"}`,
                color:tab===k?"#FF6B00":"rgba(255,255,255,0.7)"
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-6xl mx-auto">
        {/* فیلتر ایونت */}
        <div className="flex gap-3 mb-5">
          <select value={selEvent} onChange={e=>{setSelEvent(e.target.value);loadCRM(e.target.value||undefined);}}
            className="flex-1 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
            <option value="">همه ایونت‌ها</option>
            {events.map(ev=>(
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <button onClick={()=>loadCRM(selEvent||undefined)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white"
            style={{background:"rgba(255,255,255,0.05)"}}>
            <RefreshCw size={14} className={loading?"animate-spin":""}/>
          </button>
        </div>

        {/* ── TAB: CRM ── */}
        {tab==="crm" && (
          <>
            {/* آمار */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                {label:"کل مچینگ",value:stats.total_matches||0,icon:<Users size={14}/>,color:"#FF6B00"},
                {label:"میانگین سازگاری",value:`${avgScore}٪`,icon:<Target size={14}/>,color:"#22c55e"},
                {label:"مچینگ موفق",value:stats.high_compat||0,icon:<CheckCircle2 size={14}/>,color:"#3b82f6"},
                {label:"با هشدار",value:stats.with_issues||0,icon:<AlertTriangle size={14}/>,color:"#ef4444"},
              ].map((s,i)=>(
                <div key={i} className="rounded-2xl p-4" style={CARD}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{color:s.color}}>{s.icon}</span>
                    <span className="text-slate-500 text-xs">{s.label}</span>
                  </div>
                  <p className="font-black text-xl" style={{color:s.color}}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* نمودار درصد موفقیت */}
            <div className="rounded-2xl p-5 mb-5 flex items-center gap-6" style={CARD}>
              <RingChart value={successRate} color="#22c55e" size={90}/>
              <div>
                <p className="font-black text-lg text-slate-800">نرخ موفقیت مچینگ</p>
                <p className="text-white/50 text-sm">مچینگ‌هایی با سازگاری بالای ۷۰٪</p>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400"/>
                    <span className="text-xs text-white/60">موفق: {stats.high_compat||0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"/>
                    <span className="text-xs text-white/60">متوسط: {(stats.total_matches||0)-(stats.high_compat||0)-(stats.low_compat||0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"/>
                    <span className="text-xs text-white/60">ضعیف: {stats.low_compat||0}</span>
                  </div>
                </div>
              </div>
              <div className="mr-auto">
                <button onClick={getAI} disabled={loadingAI||!selEvent}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40"
                  style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
                  {loadingAI?<RefreshCw size={13} className="animate-spin"/>:<Sparkles size={13}/>}
                  تحلیل AI
                </button>
              </div>
            </div>

            {/* تحلیل AI */}
            {aiAnalysis && (
              <div className="rounded-2xl p-4 mb-5 border border-orange-500/20"
                style={{background:"rgba(255,107,0,0.06)"}}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-orange-400"/>
                  <span className="text-orange-400 font-black text-sm">تحلیل هوش مصنوعی</span>
                </div>
                <p className="text-white/80 text-sm leading-7">{aiAnalysis}</p>
              </div>
            )}

            {/* لاگ مچینگ‌ها */}
            <h3 className="font-black text-sm text-white/70 mb-3 flex items-center gap-2">
              <Clock size={13}/> لاگ مچینگ‌ها ({logs.length})
            </h3>
            <div className="space-y-2">
              {logs.slice(0,50).map((log:any)=>{
                const score = log.compatibility_score || 0;
                const hasIssues = log.issues?.length > 0;
                const isOpen = expandedLog === log.id;
                return (
                  <div key={log.id} className="rounded-2xl overflow-hidden" style={CARD}>
                    <button
                      onClick={()=>setExpandedLog(isOpen?null:log.id)}
                      className="w-full flex items-center gap-3 p-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        score>=70?"bg-green-400":score>=50?"bg-yellow-400":"bg-red-400"
                      }`}/>
                      <div className="flex-1 text-right">
                        <p className="text-white text-xs font-bold">{log.name||"کاربر"}</p>
                        <p className="text-white/40 text-[10px]">{log.event_title||"—"}</p>
                      </div>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{
                        background:score>=70?"rgba(34,197,94,0.15)":score>=50?"rgba(234,179,8,0.15)":"rgba(239,68,68,0.15)",
                        color:score>=70?"#22c55e":score>=50?"#eab308":"#ef4444"
                      }}>{score}٪</span>
                      {hasIssues && <AlertTriangle size={12} className="text-yellow-400"/>}
                      {isOpen?<ChevronUp size={12} className="text-white/30"/>:<ChevronDown size={12} className="text-white/30"/>}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {/* breakdown */}
                          {log.breakdown && Object.entries(log.breakdown).map(([k,v]:any)=>(
                            <div key={k}>
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-white/50">{k}</span>
                                <span className="text-white/80 font-bold">{Math.round(v)}٪</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{width:`${v}%`,background:v>=70?"#22c55e":v>=50?"#eab308":"#ef4444"}}/>
                              </div>
                            </div>
                          ))}
                        </div>
                        {hasIssues && (
                          <div className="mt-3 p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                            {log.issues.map((issue:string,i:number)=>(
                              <p key={i} className="text-yellow-300 text-[10px]">⚠️ {issue}</p>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-[10px] text-white/30">
                          {new Date(log.created_at).toLocaleString("fa-IR")}
                          {" · "} الگوریتم v{log.algorithm_version}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-center py-12 text-white/30 text-sm">
                  هنوز مچینگی اجرا نشده
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: USERS ── */}
        {tab==="users" && (
          <div className="space-y-3">
            <h3 className="font-black text-sm text-white/70 mb-3">
              پروفایل مچینگ کاربران
            </h3>
            {users.slice(0,20).map((u:any)=>(
              <div key={u.id} className="rounded-2xl p-4" style={CARD}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-black text-sm">
                      {(u.name||u.phone||"?").slice(0,2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{u.name||"—"}</p>
                    <p className="text-white/40 text-xs">{u.phone_number}</p>
                  </div>
                  <div className="mr-auto text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{background:"rgba(255,107,0,0.15)",color:"#FF6B00"}}>
                      امتیاز: {u.smart_score||0}
                    </span>
                  </div>
                </div>
                <UserMatchCard userId={u.id} token={token}/>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: RUN ── */}
        {tab==="run" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={CARD}>
              <h3 className="font-black text-white mb-4 flex items-center gap-2">
                <Play size={16} className="text-orange-400"/> اجرای مچینگ جدید
              </h3>
              <select value={selEvent} onChange={e=>setSelEvent(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none mb-4"
                style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
                <option value="">انتخاب ایونت...</option>
                {events.map(ev=>(
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <button onClick={runMatching}
                className="w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2"
                style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
                <Zap size={16}/> اجرای مچینگ هوشمند
              </button>
            </div>
            {runResult && (
              <div className="rounded-2xl p-5 border border-green-500/20"
                style={{background:"rgba(34,197,94,0.06)"}}>
                <p className="text-green-400 font-black mb-2">✅ مچینگ انجام شد</p>
                <p className="text-white/70 text-sm">
                  {runResult.totalGroups||0} گروه · {runResult.totalMatched||0} کاربر
                </p>
                {(runResult.groups||[]).map((g:any,i:number)=>(
                  <div key={i} className="mt-2 p-3 rounded-xl bg-white/5">
                    <p className="text-white text-xs font-bold">{g.groupName}</p>
                    <p className="text-white/50 text-[10px]">
                      سازگاری: {g.avgCompatibilityScore}٪ · {g.memberIds?.length} نفر
                    </p>
                    {g.matchReasons?.map((r:string,ri:number)=>(
                      <p key={ri} className="text-white/40 text-[10px]">• {r}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMatchCard({userId,token}:{userId:string;token:string}) {
  const [hist, setHist] = useState<any[]|null>(null);
  const [open, setOpen] = useState(false);
  const headers = {Authorization:`Bearer ${token}`};
  async function load() {
    if(hist!==null)return;
    const d = await fetch(`https://raaviiplatform.com/api/matching/user-history/${userId}`,{headers})
      .then(r=>r.ok?r.json():[]).catch(()=>[]);
    setHist(d);
  }
  return (
    <div>
      <button onClick={()=>{setOpen(!open);load();}}
        className="text-xs text-orange-400 flex items-center gap-1">
        <Eye size={11}/> {open?"بستن":"مشاهده سابقه مچینگ"}
      </button>
      {open && hist && (
        <div className="mt-2 space-y-1.5">
          {hist.length===0 && <p className="text-white/30 text-[10px]">سابقه‌ای ندارد</p>}
          {hist.slice(0,5).map((h:any,i:number)=>(
            <div key={i} className="p-2 rounded-lg bg-white/5 text-[10px] text-white/60">
              <span className="font-bold text-white/80">{h.event_title||"—"}</span>
              {" · "}{h.compatibility_score}٪ سازگاری
              {h.matched_name && <span className="text-white/40"> · با {h.matched_name}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

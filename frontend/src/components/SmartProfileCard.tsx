"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Star, TrendingUp, Award, Sparkles, CheckCircle2,
  Lock, ChevronLeft, Heart, Zap, RefreshCw, User,
} from "lucide-react";

const API = "https://raaviiplatform.com";
const CORE = ["raavi_matching_basis_v1","neo_ffi","ecr_r","erq","iri","gottman"];

const TEST_META: Record<string,{name:string;icon:string;color:string}> = {
  raavi_matching_basis_v1:{name:"MBTI",icon:"🧠",color:"#FF6B00"},
  neo_ffi:{name:"NEO",icon:"⭐",color:"#a855f7"},
  ecr_r:{name:"دلبستگی",icon:"💔",color:"#ef4444"},
  erq:{name:"هیجان",icon:"⚖️",color:"#22c55e"},
  iri:{name:"همدلی",icon:"🤝",color:"#0ea5e9"},
  gottman:{name:"گاتمان",icon:"💑",color:"#f97316"},
  hexaco:{name:"HEXACO",icon:"💎",color:"#6366f1"},
  love_languages:{name:"محبت",icon:"❤️",color:"#ec4899"},
  phq9:{name:"PHQ-9",icon:"🌿",color:"#22c55e"},
  gad7:{name:"GAD-7",icon:"😰",color:"#eab308"},
};

function Ring({pct,color,size=60}:{pct:number;color:string;size:number}) {
  const [a,setA]=useState(false);
  useEffect(()=>{setTimeout(()=>setA(true),400);},[]);
  const r=(size-6)/2; const c2=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{direction:"ltr"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={c2} strokeLinecap="round"
        strokeDashoffset={a?c2*(1-pct/100):c2}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900">{pct}٪</text>
    </svg>
  );
}

export default function SmartProfileCard() {
  const [user,setUser]=useState<any>(null);
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  const [serverProfile,setServerProfile]=useState<any>(null);

  const loadData = () => {
    const tok=localStorage.getItem("token")||"";
    if(!tok){setLoading(false);return;}
    Promise.all([
      fetch(`${API}/api/auth/profile`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.ok?r.json():null),
      fetch(`${API}/api/test-results/my`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.ok?r.json():{}),
      fetch(`${API}/api/intelligence/my-profile`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([u,tr,sp])=>{
      setUser(u);
      if(sp) setServerProfile(sp);
      const list=(tr as any)?.results||(tr as any)?.data||[];
      const seen=new Set<string>();
      const fromServer=list.filter((r:any)=>{const k=r.test_name;if(seen.has(k))return false;seen.add(k);return true;});
      setResults(fromServer);
    }).finally(()=>setLoading(false));
  };

  useEffect(()=>{
    loadData();
    // real-time sync بعد از هر تست
    try {
      const ch=new BroadcastChannel("raavi_test_done");
      ch.onmessage=(e:any)=>{
        // فوری test جدید رو اضافه کن
        if(e.data?.testId) {
          setResults(prev => {
            const exists=prev.some(r=>r.test_name===e.data.testId);
            if(exists) return prev;
            return [...prev,{test_name:e.data.testId,main_result:e.data.result,scores:e.data.scores,completed_at:new Date().toISOString()}];
          });
        }
        // بعد از نیم ثانیه refresh کامل
        setTimeout(()=>loadData(), 600);
      };
      return ()=>ch.close();
    } catch {}
  },[]);

  if(loading) return (
    <div className="flex items-center gap-2 py-4">
      <RefreshCw size={14} className="animate-spin text-orange-400"/>
      <span className="text-slate-400 text-sm">بارگذاری...</span>
    </div>
  );

  const coreResults=CORE.map(id=>({id,result:results.find(r=>r.test_name===id)}));
  const coreDone=coreResults.filter(t=>t.result).length;
  const totalTests=results.length;
  // completeness از server — اگه نبود local حساب کن
  const serverCompleteness=serverProfile?.profileCompleteness||0;
  const localCompleteness=Math.min(100,Math.round((coreDone/CORE.length)*70+Math.min(totalTests,15)/15*30));
  const completeness=serverCompleteness>0?serverCompleteness:localCompleteness;
  const mbti=results.find(r=>r.test_name==="raavi_matching_basis_v1"||r.test_name==="mbti");
  const mbtiRaw=mbti?.main_result||serverProfile?.mbti||"";
  const mbtiType=mbtiRaw?mbtiRaw.replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,4)||null:null;

  return (
    <div className="space-y-4">
      {/* ── Hero Card ─────────────────────────────────── */}
      <div className="relative rounded-[26px] overflow-hidden"
        style={{background:"linear-gradient(135deg,#171927 0%,#1c2036 55%,#242b55 100%)",
          border:"1px solid rgba(255,255,255,.06)",boxShadow:"0 16px 38px rgba(15,23,42,0.24)"}}>
        {/* BG decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
            style={{background:"rgba(255,107,0,0.12)",filter:"blur(40px)"}}/>
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full"
            style={{background:"rgba(139,92,246,0.15)",filter:"blur(30px)"}}/>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{background:"rgba(255,255,255,0.03)"}}/>
        </div>

        <div className="relative z-10 p-4 sm:p-5">
          {/* اطلاعات کاربر */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{background:"linear-gradient(135deg,rgba(255,107,0,0.3),rgba(249,115,22,0.2))",
                  border:"2px solid rgba(255,107,0,0.4)"}}>
                {user?.name?user.name[0]:"👤"}
              </div>
              {completeness>=80&&(
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs shadow-md">⭐</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-lg truncate">
                {user?.name||"کاربر راوی"}
              </h2>
              <p className="text-white/50 text-xs mt-0.5">
                {user?.city||"راوی"}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {mbtiType&&(
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                    style={{background:"rgba(255,107,0,0.25)",color:"#fdba74"}}>
                    {mbtiType}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)"}}>
                  {totalTests} تست
                </span>
              </div>
            </div>
            <Link href="/dashboard/complete-profile" title="تکمیل پروفایل" style={{display:"block",flexShrink:0}}>
              <Ring pct={completeness} color="#FF6B00" size={64}/>
            </Link>
          </div>

          {/* progress تست‌های اصلی */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-[10px] font-bold">تست‌های اصلی</span>
              <span className="text-white/90 text-[10px] font-black">{coreDone}/{CORE.length}</span>
            </div>
            <div className="flex gap-1.5">
              {CORE.map(id=>{
                const done=!!results.find(r=>r.test_name===id);
                const m=TEST_META[id];
                return (
                  <div key={id} title={m.name} className="flex-1 h-2 rounded-full"
                    style={{background:done?`linear-gradient(90deg,${m.color}80,${m.color})`:"rgba(255,255,255,0.1)",
                      transition:"background 0.5s ease"}}/>
                );
              })}
            </div>
          </div>

          {/* آمار سریع */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:"امتیاز",value:`${completeness}٪`,icon:"🎯",color:"#fdba74"},
              {label:"تست اصلی",value:`${coreDone}/${CORE.length}`,icon:"⭐",color:"#a5b4fc"},
              {label:"تست کل",value:`${totalTests}`,icon:"📊",color:"#86efac"},
            ].map(({label,value,icon,color})=>(
              <div key={label} className="rounded-2xl p-3 text-center"
                style={{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(10px)"}}>
                <span className="text-lg">{icon}</span>
                <p className="font-black text-sm mt-1" style={{color}}>{value}</p>
                <p className="text-white/40 text-[9px]">{label}</p>
              </div>
            ))}
          </div>

          {completeness < 100 && (
            <Link href="/dashboard/complete-profile"
              className="flex items-center justify-between mt-3 px-3 py-2 rounded-2xl"
              style={{background:"rgba(230,123,46,0.12)",border:"1px solid rgba(230,123,46,0.25)"}}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{background:"rgba(230,123,46,0.25)",color:"#f97316",fontSize:11}}>✎</div>
                <span className="text-[11px] font-bold" style={{color:"#fdba74"}}>تکمیل پروفایل</span>
              </div>
              <ChevronLeft size={13} style={{color:"#f97316"}}/>
            </Link>
          )}
        </div>
      </div>

      {/* ── تست‌های اصلی ─────────────────────────────── */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Award size={14} className="text-orange-500"/> تست‌های اصلی
          </h3>
          <Link href="/dashboard/tests"
            className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
            همه <ChevronLeft size={10}/>
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {CORE.map(id=>{
            const m=TEST_META[id]; const r=results.find(x=>x.test_name===id);
            return (
              <Link key={id} href={`/dashboard/tests/${id}`}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl"
                style={{background:r?`${m.color}08`:"rgba(0,0,0,0.02)",
                  border:`1.5px solid ${r?m.color+"30":"rgba(0,0,0,0.06)"}`}}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-[8px] font-black text-slate-600 text-center leading-tight">{m.name}</span>
                {r?<CheckCircle2 size={10} style={{color:m.color}}/>
                  :<Lock size={9} className="text-slate-300"/>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── تست‌های تکمیلی ───────────────────────────── */}
      {results.filter(r=>!CORE.includes(r.test_name)&&r.test_name!=="raavi_matching_basis_v1").length>0&&(
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-orange-500"/> تست‌های تکمیلی
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.filter(r=>!CORE.includes(r.test_name)&&r.test_name!=="raavi_matching_basis_v1").map(r=>{
              const m=TEST_META[r.test_name]||{name:r.test_name,icon:"📋",color:"#64748b"};
              return (
                <Link key={r.id} href={`/dashboard/tests/${r.test_name}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{background:`${m.color}08`,border:`1px solid ${m.color}20`}}>
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px] font-black" style={{color:m.color}}>{m.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── سازگاری ──────────────────────────────────── */}
      <Link href="/dashboard/compatibility"
        className="flex items-center gap-3 p-4 rounded-3xl text-white"
        style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",
          boxShadow:"0 4px 20px rgba(255,107,0,0.3)"}}>
        <Heart size={18} className="flex-shrink-0"/>
        <div className="flex-1">
          <p className="font-black text-sm">پروفایل سازگاری</p>
          <p className="text-white/70 text-[10px]">نمودار کامل ابعاد روانشناختی</p>
        </div>
        <ChevronLeft size={16}/>
      </Link>
    </div>
  );
}

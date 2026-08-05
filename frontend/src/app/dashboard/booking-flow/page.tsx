"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function Icon3D({ type }: { type: "psychologist" | "hamzist" }) {
  if (type === "psychologist") return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_p" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#4C1D95"/>
        </radialGradient>
        <radialGradient id="face_p" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A"/>
          <stop offset="100%" stopColor="#F59E0B"/>
        </radialGradient>
        <filter id="shadow_p" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4C1D95" floodOpacity="0.5"/>
        </filter>
        <linearGradient id="coat_p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#E0E7FF"/>
        </linearGradient>
        <linearGradient id="shine_p" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* پس‌زمینه */}
      <rect width="72" height="72" rx="20" fill="url(#bg_p)" filter="url(#shadow_p)"/>
      <rect width="72" height="72" rx="20" fill="url(#shine_p)"/>
      {/* روپوش پزشکی */}
      <path d="M18 72 Q18 52 24 46 L34 42 L38 50 L42 42 L52 46 Q58 52 58 72" fill="url(#coat_p)" opacity="0.95"/>
      <path d="M34 42 L36 46 L38 42" stroke="#C7D2FE" strokeWidth="1.5" fill="none"/>
      {/* صلیب */}
      <rect x="33" y="47" width="2.5" height="8" rx="1" fill="#6366F1"/>
      <rect x="30.5" y="49.5" width="7.5" height="2.5" rx="1" fill="#6366F1"/>
      {/* سر */}
      <ellipse cx="36" cy="28" rx="10" ry="11" fill="url(#face_p)"/>
      <ellipse cx="36" cy="27" rx="10" ry="11" fill="url(#face_p)"/>
      {/* موها */}
      <path d="M26 25 Q26 14 36 13 Q46 14 46 25 Q44 18 36 17 Q28 18 26 25Z" fill="#1C1917"/>
      {/* چشم‌ها */}
      <ellipse cx="31.5" cy="28" rx="1.5" ry="2" fill="#1C1917"/>
      <ellipse cx="40.5" cy="28" rx="1.5" ry="2" fill="#1C1917"/>
      <circle cx="32" cy="27.5" r="0.6" fill="white"/>
      <circle cx="41" cy="27.5" r="0.6" fill="white"/>
      {/* لبخند */}
      <path d="M32 33 Q36 36 40 33" stroke="#92400E" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* گوشی پزشکی */}
      <path d="M24 34 Q20 34 20 38 Q20 42 24 42" stroke="#9CA3AF" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="24" cy="42" r="2" fill="#6B7280"/>
      <path d="M24 34 Q24 30 28 30" stroke="#9CA3AF" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="28" cy="30" r="2.5" fill="#374151"/>
    </svg>
  );
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_h" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#059669"/>
          <stop offset="100%" stopColor="#065F46"/>
        </radialGradient>
        <radialGradient id="face_h1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A"/>
          <stop offset="100%" stopColor="#F59E0B"/>
        </radialGradient>
        <radialGradient id="face_h2" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FBBF24"/>
          <stop offset="100%" stopColor="#D97706"/>
        </radialGradient>
        <filter id="shadow_h" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#065F46" floodOpacity="0.5"/>
        </filter>
        <linearGradient id="shine_h" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="hand_h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {/* پس‌زمینه */}
      <rect width="72" height="72" rx="20" fill="url(#bg_h)" filter="url(#shadow_h)"/>
      <rect width="72" height="72" rx="20" fill="url(#shine_h)"/>
      {/* نفر چپ */}
      <ellipse cx="24" cy="23" rx="7.5" ry="8" fill="url(#face_h2)"/>
      <path d="M16.5 22 Q17 15 24 14 Q31 15 31.5 22 Q29 16.5 24 16 Q19 16.5 16.5 22Z" fill="#1C1917"/>
      <ellipse cx="21.5" cy="24" rx="1.2" ry="1.5" fill="#1C1917"/>
      <ellipse cx="26.5" cy="24" rx="1.2" ry="1.5" fill="#1C1917"/>
      <path d="M22 28 Q24 30 27 28" stroke="#92400E" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M12 72 Q13 52 17 46 L22 43 L24 50 L26 43 L31 46 Q35 52 36 72" fill="#10B981" opacity="0.9"/>
      {/* نفر راست */}
      <ellipse cx="48" cy="23" rx="7.5" ry="8" fill="url(#face_h1)"/>
      <path d="M40.5 21 Q42 13 48 13 Q54 13 55.5 21 Q53 15 48 15 Q43 15 40.5 21Z" fill="#78350F"/>
      <ellipse cx="45.5" cy="24" rx="1.2" ry="1.5" fill="#1C1917"/>
      <ellipse cx="50.5" cy="24" rx="1.2" ry="1.5" fill="#1C1917"/>
      <path d="M46 28 Q48 30 51 28" stroke="#92400E" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M37 72 Q38 52 41 46 L46 43 L48 50 L50 43 L55 46 Q59 52 60 72" fill="#34D399" opacity="0.9"/>
      {/* دست‌های متصل */}
      <path d="M30 50 Q36 46 42 50" stroke="url(#hand_h)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="30" cy="50" r="3.5" fill="#6EE7B7"/>
      <circle cx="42" cy="50" r="3.5" fill="#FCD34D"/>
      {/* قلب */}
      <path d="M34 38 C34 36 36 34 36 34 C36 34 38 36 38 38 C38 40 36 42 36 42 C36 42 34 40 34 38Z" fill="#FCA5A5"/>
      <path d="M33 37 C33 35 36 34 36 34 C36 34 39 35 39 37 C39 39.5 36 42 36 42 C36 42 33 39.5 33 37Z" fill="#F87171"/>
    </svg>
  );
}

export default function BookingFlowPage() {
  const { state } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function start(serviceType: "psychologist" | "hamzist") {
    setLoading(true); setErr("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API}/api/consultation-flow/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceType }),
      });
      if (!res.ok) throw new Error("خطا در شروع");
      const data = await res.json();
      router.push(`/dashboard/booking-flow/topic?sid=${data.session.id}&type=${serviceType}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)"}}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",
                boxShadow:"0 8px 32px rgba(255,107,0,0.4),0 2px 8px rgba(255,107,0,0.2)",
                transform:"perspective(200px) rotateX(5deg)"}}>
              <span className="text-3xl">🧠</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full"
              style={{background:"rgba(255,107,0,0.2)",filter:"blur(6px)"}}/>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">مشاوره راوی</h1>
          <p className="text-slate-400 text-sm leading-relaxed">با چه نوع خدمتی می‌خواهید شروع کنید؟</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[
            {type:"psychologist" as const, title:"روانشناس", desc:"مشاوره فردی با روانشناس متخصص بر اساس نیاز شما",
             grad:"135deg,#3730a3,#1e1b4b", border:"#6366f1", glow:"rgba(99,102,241,0.4)"},
            {type:"hamzist" as const, title:"همزیست", desc:"همراهی و پشتیبانی روزانه برای بهتر زیستن",
             grad:"135deg,#065f46,#022c22", border:"#10b981", glow:"rgba(16,185,129,0.4)"},
          ].map(({type,title,desc,grad,border,glow})=>(
            <button key={type} onClick={()=>start(type)} disabled={loading}
              className="group text-right transition-all duration-300 active:scale-95"
              style={{background:`linear-gradient(${grad})`,borderRadius:"24px",
                border:`1.5px solid ${border}40`,padding:"0",overflow:"hidden",
                boxShadow:`0 8px 32px ${glow},0 2px 8px rgba(0,0,0,0.3)`,
                transform:"perspective(800px) rotateX(2deg)"}}>
              {/* بخش بالایی با آیکون */}
              <div className="relative flex justify-center items-center pt-8 pb-4"
                style={{background:`linear-gradient(180deg,${border}20,transparent)`}}>
                {/* حلقه گلو */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="w-28 h-28 rounded-full"
                    style={{background:`radial-gradient(circle,${border},transparent)`,filter:"blur(20px)"}}/>
                </div>
                {/* سایه زیر آیکون */}
                <div className="relative">
                  <div style={{filter:`drop-shadow(0 12px 20px ${glow}) drop-shadow(0 4px 8px ${glow})`}}>
                    <Icon3D type={type}/>
                  </div>
                  {/* سایه روی زمین */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full"
                    style={{background:glow,filter:"blur(8px)"}}/>
                </div>
              </div>
              {/* بخش پایینی */}
              <div className="px-5 pb-6 pt-2">
                <div className="font-black text-white text-xl mb-1.5 flex items-center gap-2">
                  {title}
                  <div className="w-1.5 h-1.5 rounded-full" style={{background:border,
                    boxShadow:`0 0 6px ${border}`}}/>
                </div>
                <div className="text-slate-400 text-xs leading-relaxed">{desc}</div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold"
                  style={{color:border}}>
                  شروع کن
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              {/* خط براق بالا */}
              <div className="absolute top-0 left-4 right-4 h-px"
                style={{background:`linear-gradient(90deg,transparent,${border}60,transparent)`}}/>
            </button>
          ))}
        </div>
        {err && <p className="text-red-400 text-center mt-4 text-sm">{err}</p>}
        {loading && (
          <div className="flex justify-center mt-6 gap-2">
            {[0,1,2].map(i=>(
              <div key={i} className="w-2 h-2 rounded-full bg-orange-400"
                style={{animation:`bounce 1s infinite ${i*0.15}s`}}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

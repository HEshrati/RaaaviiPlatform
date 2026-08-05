"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { TESTS_CATALOG, CORE_MATCHING_TESTS } from "@/lib/tests-catalog";
import { CheckCircle2, Lock, Clock, Cpu, Sparkles, ArrowLeft, Star, Zap, Brain, Heart, Filter, Link as LinkIcon, Handshake, Leaf, Microscope, HeartPulse } from "lucide-react";

const API = "https://raaviiplatform.com";

const PHASE_CONFIG = {
  1: { label: "پایه",       color: "#FF6B00", glow: "rgba(255,107,0,0.3)",  desc: "شخصیت و رابطه" },
  2: { label: "سلامت روان", color: "#3b82f6", glow: "rgba(59,130,246,0.3)", desc: "غربالگری" },
  3: { label: "بالینی",     color: "#8b5cf6", glow: "rgba(139,92,246,0.3)", desc: "تخصصی" },
};

const CAT_META: Record<string, { icon: any; color: string }> = {
  "شخصیت":          { icon: Brain,      color: "#FF6B00" },
  "رابطه":          { icon: Heart,       color: "#ec4899" },
  "مهارت اجتماعی": { icon: Handshake,   color: "#22c55e" },
  "هیجانی":        { icon: HeartPulse,  color: "#ef4444" },
  "سلامت روان":    { icon: Leaf,        color: "#10b981" },
  "بالینی":        { icon: Microscope,  color: "#8b5cf6" },
};

export default function TestsCatalogPage() {
  const { state } = useApp();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<number | "all">("all");
  const [mounted, setMounted] = useState(false);

  // refresh هر ۳۰ ثانیه
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token")||"";
      if(!token) return;
      fetch(`https://raaviiplatform.com/api/test-results/my`,{
        headers:{Authorization:`Bearer ${token}`}
      }).then(r=>r.ok?r.json():{}).then(d=>{
        const list=(d as any)?.results||(d as any)?.data||[];
        const names=new Set(list.map((x:any)=>x.test_name));
        // setDoneTests?.(names);
      }).catch(()=>{});
    }, 30000);
    return ()=>clearInterval(interval);
  },[]);
  useEffect(() => { setMounted(true); }, []);

  const loadCompleted = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/api/test-results/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        const rawIds = (Array.isArray(data) ? data : data.results || [])
            .map((x: any) => x.test_id || x.test_name);
        // map: mbti ↔ raavi_matching_basis_v1
        const ids = new Set<string>(rawIds.flatMap((id:string) => {
          if(id==="mbti") return [id,"raavi_matching_basis_v1"];
          if(id==="raavi_matching_basis_v1") return [id,"mbti"];
          return [id];
        }));
        setCompleted(ids);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompleted();
    // real-time: بعد از هر تست فوری سبز میشه
    try {
      const ch = new BroadcastChannel("raavi_test_done");
      ch.onmessage = (e:any) => {
        // اضافه کردن تست جدید بدون fetch مجدد
        if(e.data?.testId) {
          setCompleted(prev => new Set([...prev, e.data.testId]));
        }
        // و یه fetch برای مطمئن شدن
        setTimeout(() => loadCompleted(), 500);
      };
      return () => ch.close();
    } catch {}
  }, [loadCompleted]);

  const coreTests = TESTS_CATALOG.filter(t => CORE_MATCHING_TESTS.includes(t.id));
  const coreCompleted = coreTests.filter(t => completed.has(t.id)).length;
  const corePct = Math.round((coreCompleted / coreTests.length) * 100);
  const allCoreComplete = coreCompleted === coreTests.length;
  const nextCore = coreTests.find(t => !completed.has(t.id));

  const filtered = activePhase === "all"
    ? TESTS_CATALOG
    : TESTS_CATALOG.filter(t => t.phase === activePhase);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes corePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,107,0,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(255,107,0,0); }
        }
        .test-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
        .test-card:hover { transform: translateY(-3px); }
        .phase-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="min-h-screen p-4 lg:p-6" dir="rtl"
        style={{ background: "linear-gradient(135deg,#060912 0%,#0a0f1e 100%)" }}>
        <div className="max-w-4xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-8 text-center"
            style={{ animation: mounted ? "fadeUp 0.5s ease-out both" : "none" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4"
              style={{
                background: "rgba(255,107,0,0.1)",
                border: "1px solid rgba(255,107,0,0.25)",
                color: "#FF6B00",
              }}>
              <Sparkles size={12} /> ۲۴ تست روان‌سنجی معتبر
            </div>
            <h1 className="text-3xl font-black text-white mb-2">تست‌های راوی</h1>
            <p className="text-slate-500 text-sm">خودت رو بشناس، روابطت رو بهتر کن</p>
          </div>

          {/* ── Core Progress ── */}
          <div className="mb-6 p-5 rounded-2xl"
            style={{
              animation: mounted ? "fadeUp 0.5s ease-out 0.1s both" : "none",
              background: allCoreComplete
                ? "rgba(34,197,94,0.07)"
                : "rgba(255,107,0,0.07)",
              border: `1px solid ${allCoreComplete ? "rgba(34,197,94,0.2)" : "rgba(255,107,0,0.2)"}`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: allCoreComplete ? "rgba(34,197,94,0.15)" : "rgba(255,107,0,0.15)",
                    animation: !allCoreComplete ? "corePulse 2s ease-in-out infinite" : "none",
                  }}>
                  {allCoreComplete
                    ? <CheckCircle2 size={16} className="text-green-400" />
                    : <Star size={16} className="text-orange-400" />}
                </div>
                <div>
                  <p className="text-white font-black text-sm">۵ تست هسته‌ای مچینگ</p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: allCoreComplete ? "#86efac" : "#94a3b8" }}>
                    {allCoreComplete
                      ? "✅ تکمیل شده — به روانشناس دسترسی داری"
                      : `${coreCompleted} از ${coreTests.length} تکمیل شده`}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-black"
                style={{ color: allCoreComplete ? "#22c55e" : "#FF6B00" }}>
                {corePct}٪
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden mb-3"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${corePct}%`,
                  background: allCoreComplete
                    ? "linear-gradient(90deg,#22c55e,#16a34a)"
                    : "linear-gradient(90deg,#FF6B00,#f97316)",
                }} />
            </div>

            {/* تست‌های هسته‌ای */}
            <div className="flex flex-wrap gap-2">
              {coreTests.map(t => {
                const done = completed.has(t.id);
                return (
                  <Link key={t.id} href={`/dashboard/tests/${t.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                    style={{
                      background: done ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                      color: done ? "#86efac" : "#64748b",
                    }}>
                    {done ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {t.shortName}
                  </Link>
                );
              })}
            </div>

            {!allCoreComplete && nextCore && (
              <Link href={`/dashboard/tests/${nextCore.id}`}
                className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)" }}>
                <Zap size={14} />
                شروع: {nextCore.shortName}
                <ArrowLeft size={14} />
              </Link>
            )}
          </div>

          {/* ── Phase Filter ── */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1"
            style={{ animation: mounted ? "fadeUp 0.5s ease-out 0.2s both" : "none" }}>
            {([["all","همه","#FF6B00"],[1,"فاز ۱","#FF6B00"],[2,"فاز ۲","#3b82f6"],[3,"فاز ۳","#8b5cf6"]] as const).map(([phase, label, color]) => {
              const active = activePhase === phase;
              return (
                <button key={String(phase)}
                  onClick={() => setActivePhase(phase as any)}
                  className="phase-btn px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap flex-shrink-0"
                  style={{
                    background: active ? `${color}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? color + "50" : "rgba(255,255,255,0.07)"}`,
                    color: active ? color : "#64748b",
                    boxShadow: active ? `0 4px 16px ${color}25` : "none",
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Grid تست‌ها ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl"
                  style={{
                    background: "linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%)",
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.5s ease-in-out ${i*0.1}s infinite`,
                  }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((test, idx) => {
                const done = completed.has(test.id);
                const isCore = CORE_MATCHING_TESTS.includes(test.id);
                const isLocked = test.phase === 3 && !allCoreComplete;
                const ph = PHASE_CONFIG[test.phase as 1|2|3];
                const cat = CAT_META[test.category] || { icon: "📋", color: "#64748b" };

                return (
                  <Link key={test.id}
                    href={isLocked ? "#" : `/dashboard/tests/${test.id}`}
                    onClick={isLocked ? e => e.preventDefault() : undefined}
                    className="test-card block p-4 rounded-2xl relative overflow-hidden group"
                    style={{
                      animation: mounted ? `fadeUp 0.4s ease-out ${idx * 0.04}s both` : "none",
                      background: done
                        ? "rgba(34,197,94,0.05)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        done ? "rgba(34,197,94,0.2)"
                        : isCore ? "rgba(255,107,0,0.15)"
                        : "rgba(255,255,255,0.06)"
                      }`,
                      opacity: isLocked ? 0.5 : 1,
                      cursor: isLocked ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isLocked) {
                        (e.currentTarget as HTMLElement).style.borderColor = ph.color + "50";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${ph.glow}`;
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = done
                        ? "rgba(34,197,94,0.2)"
                        : isCore ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}>

                    {/* درخشش hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${ph.color}08, transparent 70%)` }} />

                    {/* top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"32px",height:"32px",borderRadius:"8px",background:`linear-gradient(145deg, ${cat.color}30, ${cat.color}15)`,boxShadow:`2px 2px 8px rgba(0,0,0,0.2), inset 1px 1px 2px rgba(255,255,255,0.35)`,transform:"rotateX(6deg) rotateY(-6deg)"}}><cat.icon size={16} style={{color:cat.color}}/></span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                          style={{
                            background: `${ph.color}15`,
                            color: ph.color,
                            border: `1px solid ${ph.color}30`,
                          }}>
                          {test.shortName}
                        </span>
                      </div>
                      {done
                        ? <div className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(34,197,94,0.15)" }}>
                            <CheckCircle2 size={14} className="text-green-400" />
                          </div>
                        : isLocked
                          ? <Lock size={14} className="text-slate-700 mt-0.5" />
                          : isCore
                            ? <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,107,0,0.15)" }}>
                                <Star size={12} className="text-orange-400" />
                              </div>
                            : <div className="w-5 h-5 rounded-full border-2"
                                style={{ borderColor: "rgba(255,255,255,0.12)" }} />}
                    </div>

                    {/* نام */}
                    <h3 className="text-sm font-black leading-relaxed mb-2 line-clamp-2"
                      style={{ color: done ? "#86efac" : "#f1f5f9" }}>
                      {test.name}
                    </h3>

                    {/* meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock size={9} /> {test.estimatedMinutes} دقیقه
                        </span>
                        <span>{test.questions.length} سؤال</span>
                      </div>
                      {done && (
                        <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5">
                          <CheckCircle2 size={9} /> انجام شده
                        </span>
                      )}
                    </div>

                    {/* بار فاز */}
                    <div className="absolute bottom-0 left-0 h-0.5 w-full"
                      style={{ background: `linear-gradient(90deg, ${ph.color}40, transparent)` }} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* نتیجه خالی */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Cpu size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">تستی در این فاز وجود ندارد</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

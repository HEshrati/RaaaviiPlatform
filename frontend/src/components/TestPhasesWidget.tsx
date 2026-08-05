"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, ChevronLeft, Sparkles, Cpu, Zap } from "lucide-react";

const SITE = "https://raaviiplatform.com";
const PHASE_COLORS = ["#FF6B00","#6366f1","#10b981"];
const TEST_NAMES: Record<string,string> = {
  raavi_matching_basis_v1:"تیپ شخصیتی MBTI", neo_ffi:"پنج عامل بزرگ",
  ecr_r:"سبک دلبستگی", erq:"تنظیم هیجان", iri:"همدلی",
  gottman:"الگوی رابطه", love_languages:"زبان محبت",
  conflict_style:"سبک تعارض", phq9:"سلامت روان", gad7:"اضطراب",
  hexaco:"شخصیت HEXACO", dass21:"DASS-21", bai:"اضطراب بک",
  isi:"بی‌خوابی", asrs:"ADHD", sexual_compat:"سازگاری جنسی",
};

export default function TestPhasesWidget() {
  const [phases, setPhases] = useState<any[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [open, setOpen] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${SITE}/api/intelligence/my-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setPhases(d.phases || []); setCompleteness(d.profileCompleteness || 0); }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-24 rounded-2xl bg-slate-100 animate-pulse"/>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-orange-500"/>
            <span className="font-black text-slate-900 text-sm">مسیر شخصیت‌شناسی</span>
          </div>
          <span className="text-xs font-black" style={{color:"#FF6B00"}}>{completeness}٪ کامل</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{width:`${completeness}%`,background:"linear-gradient(90deg,#FF6B00,#f97316)"}}/>
        </div>
      </div>

      {/* phases */}
      {phases.map((ph: any) => (
        <div key={ph.phase}>
          <button
            onClick={() => setOpen(open === ph.phase ? 0 : ph.phase)}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-all"
            disabled={!ph.unlocked}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: !ph.unlocked ? "rgba(0,0,0,0.06)" :
                  ph.done === ph.total ? "#22c55e" :
                  `${PHASE_COLORS[ph.phase-1]}15`,
              }}>
              {!ph.unlocked
                ? <Lock size={10} className="text-slate-400"/>
                : ph.done === ph.total
                ? <CheckCircle2 size={12} className="text-white"/>
                : <span className="text-[9px] font-black" style={{color:PHASE_COLORS[ph.phase-1]}}>{ph.done}/{ph.total}</span>
              }
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-black" style={{
                color: !ph.unlocked ? "#94a3b8" : "#0f172a"
              }}>
                فاز {ph.phase}: {ph.label}
              </p>
              {!ph.unlocked && (
                <p className="text-[9px] text-slate-400">
                  تکمیل فاز قبل برای باز شدن
                </p>
              )}
            </div>
            {ph.unlocked && ph.done < ph.total && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{background:PHASE_COLORS[ph.phase-1]}}>
                {ph.total - ph.done} باقی
              </span>
            )}
          </button>

          {open === ph.phase && ph.unlocked && (
            <div className="px-3 pb-3 space-y-1.5">
              {ph.tests.map((t: any) => (
                <Link key={t.id} href={`/dashboard/tests/${t.id}`}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-all">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{background: t.done ? "#22c55e" : "rgba(0,0,0,0.06)"}}>
                    {t.done ? <CheckCircle2 size={10} className="text-white"/> : null}
                  </div>
                  <span className="text-xs text-slate-700 flex-1">
                    {TEST_NAMES[t.id] || t.id}
                  </span>
                  {t.result && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{background:`${PHASE_COLORS[ph.phase-1]}10`,color:PHASE_COLORS[ph.phase-1]}}>
                      {t.result}
                    </span>
                  )}
                  {!t.done && <ChevronLeft size={10} className="text-slate-300"/>}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

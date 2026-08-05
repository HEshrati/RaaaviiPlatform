"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { Cpu, TrendingUp, Users, BarChart2, RefreshCw,
  CheckCircle2, Clock, AlertCircle, Zap, Trophy, Activity } from "lucide-react";

const SITE = "https://raaviiplatform.com";

import { ALL_TESTS, TESTS_BY_ID } from "@/lib/tests-catalog";

// رنگ‌های چرخشی برای تست‌هایی که color ندارن
const PALETTE = ["#FF6B00","#3b82f6","#ec4899","#8b5cf6","#06b6d4","#f59e0b",
  "#10b981","#ef4444","#f97316","#dc2626","#7c3aed","#d97706","#a855f7","#0ea5e9"];

// فاز بر اساس نوع تست
function getPhase(id: string): number {
  if (["neo_ffi","ecr_r","iri","erq","raavi_matching_basis_v1","mbti","hexaco"].includes(id)) return 1;
  if (["gottman","love_languages","conflict_style","sexual_compat"].includes(id)) return 2;
  return 3; // بالینی
}

// ساخت TEST_META داینامیک از catalog
const TEST_META: Record<string, { name:string; color:string; phase:number; desc:string }> = 
  Object.fromEntries(
    ALL_TESTS.map((t, i) => [
      t.id,
      {
        name: t.name || t.id,
        color: PALETTE[i % PALETTE.length],
        phase: getPhase(t.id),
        desc: t.description?.slice(0, 40) || t.id,
      }
    ])
  );

// اضافه کردن raavi_matching_basis_v1 اگه در catalog نیست
if (!TEST_META["raavi_matching_basis_v1"]) {
  TEST_META["raavi_matching_basis_v1"] = { name:"MBTI راوی", color:"#FF6B00", phase:1, desc:"تست ورودی اصلی" };
}

function RingChart({ pct, color, size=80 }: { pct:number; color:string; size?:number }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 300); }, []);
  const r = (size-10)/2; const circ = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{direction:"ltr"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={anim ? circ*(1-pct/100) : circ}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dashoffset 1s ease"}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="#0f172a" fontSize={13} fontWeight="900">{pct}٪</text>
    </svg>
  );
}

function MiniBar({ value, max, color }: { value:number; max:number; color:string }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 400); }, []);
  const pct = max > 0 ? Math.round((value/max)*100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{width: anim ? `${pct}%` : "0%", background:color}}/>
    </div>
  );
}

export default function TestAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<number|null>(null);
  const [selectedTest, setSelectedTest] = useState<string|null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token")||"" : "";
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${SITE}/api/admin/tests/analytics`, { headers });
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <RefreshCw size={24} className="text-orange-400 animate-spin"/>
    </div>
  );

  const { totalUsers=0, perTest=[], summary={}, resultDistribution={}, topUsers=[] } = data || {};
  const maxTotal = Math.max(...perTest.map((t:any) => t.total), 1);

  const filteredTests = perTest.filter((t:any) =>
    phase ? (TEST_META[t.test_name]?.phase === phase) : true
  );

  const selectedData = selectedTest
    ? perTest.find((t:any) => t.test_name === selectedTest)
    : null;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{background:"rgba(255,107,0,0.1)", border:"1px solid rgba(255,107,0,0.2)"}}>
            <Cpu size={18} className="text-orange-500"/>
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-lg">آنالیز تست‌های روانشناسی</h1>
            <p className="text-slate-500 text-xs">داده‌های واقعی — آپدیت لحظه‌ای</p>
          </div>
        </div>
        <button onClick={load} className="text-slate-400 hover:text-slate-700 transition-colors">
          <RefreshCw size={16} className={loading?"animate-spin":""}/>
        </button>
      </div>

      {/* خلاصه کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label:"کل کاربران", value:totalUsers, icon:Users, color:"#3b82f6" },
          { label:"کل پاسخ‌ها", value:summary.totalAnswers||0, icon:BarChart2, color:"#FF6B00" },
          { label:"تست‌های فعال", value:perTest.length, icon:Activity, color:"#22c55e" },
          { label:"میانگین تست/کاربر", value:summary.avgTestsPerUser||0, icon:TrendingUp, color:"#a855f7" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{background:`${s.color}12`}}>
                  <Icon size={14} style={{color:s.color}}/>
                </div>
                <span className="text-2xl font-black text-slate-900">
                  {Number(s.value).toLocaleString("fa-IR")}
                </span>
              </div>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* فیلتر فاز */}
      <div className="flex gap-2 mb-5">
        {[null,1,2,3].map(p => (
          <button key={p??'all'} onClick={() => setPhase(p)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: phase===p ? "rgba(255,107,0,0.1)" : "white",
              border: `1.5px solid ${phase===p ? "rgba(255,107,0,0.4)" : "rgba(0,0,0,0.08)"}`,
              color: phase===p ? "#FF6B00" : "#64748b",
            }}>
            {p===null?"همه":p===1?"فاز ۱ — پایه":p===2?"فاز ۲ — سلامت":"فاز ۳ — بالینی"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* لیست تست‌ها */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-900 font-black text-sm">نرخ تکمیل تست‌ها</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredTests.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">داده‌ای موجود نیست</div>
            ) : filteredTests.map((t:any) => {
              const meta = TEST_META[t.test_name] || {name:t.test_name, color:"#64748b", phase:1, desc:""};
              const isSelected = selectedTest === t.test_name;
              const dist = resultDistribution[t.test_name] || [];
              return (
                <div key={t.test_name}
                  onClick={() => setSelectedTest(isSelected ? null : t.test_name)}
                  className="px-5 py-4 cursor-pointer transition-all hover:bg-slate-50"
                  style={{background: isSelected ? `${meta.color}06` : "white"}}>
                  <div className="flex items-center gap-4">
                    {/* Ring */}
                    <RingChart pct={t.completion_rate} color={meta.color} size={72}/>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-900 text-sm">{meta.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{background:`${meta.color}12`, color:meta.color}}>
                          فاز {meta.phase}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mb-2">{meta.desc}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={10}/>
                          {Number(t.unique_users).toLocaleString("fa-IR")} کاربر
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart2 size={10}/>
                          {Number(t.total).toLocaleString("fa-IR")} پاسخ
                        </span>
                        {t.last_7_days > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <TrendingUp size={10}/>
                            +{t.last_7_days} این هفته
                          </span>
                        )}
                      </div>
                      <MiniBar value={t.total} max={maxTotal} color={meta.color}/>
                    </div>
                    {/* امتیاز هوشمند */}
                    <div className="text-left flex-shrink-0">
                      <div className="text-2xl font-black" style={{color:meta.color}}>
                        {t.completion_rate}٪
                      </div>
                      <div className="text-[10px] text-slate-400">نرخ تکمیل</div>
                    </div>
                  </div>

                  {/* توزیع نتایج — فقط وقتی انتخاب شده */}
                  {isSelected && dist.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-3">
                        توزیع نتایج ({dist.length} نوع)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {dist.slice(0,8).map((d:any) => {
                          const total = dist.reduce((s:number,x:any)=>s+x.count,0);
                          const pct = Math.round((d.count/total)*100);
                          return (
                            <div key={d.result} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[10px] font-bold text-slate-700 truncate">
                                    {d.result}
                                  </span>
                                  <span className="text-[10px] font-black flex-shrink-0 mr-1"
                                    style={{color:meta.color}}>{pct}٪</span>
                                </div>
                                <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500"
                                    style={{width:`${pct}%`, background:meta.color}}/>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 flex-shrink-0 w-6 text-center">
                                {d.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ستون راست */}
        <div className="space-y-4">
          {/* تست‌های نداده */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-500"/> تست‌های انجام‌نشده
            </h3>
            {Object.keys(TEST_META).filter(id =>
              !perTest.some((t:any) => t.test_name === id)
            ).map(id => {
              const meta = TEST_META[id];
              return (
                <div key={id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:meta.color}}/>
                  <span className="text-slate-600 text-xs">{meta.name}</span>
                  <span className="mr-auto text-[10px] text-slate-300">۰٪</span>
                </div>
              );
            })}
            {Object.keys(TEST_META).filter(id =>
              !perTest.some((t:any) => t.test_name === id)
            ).length === 0 && (
              <div className="flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle2 size={13}/> همه تست‌ها انجام شده‌اند
              </div>
            )}
          </div>

          {/* فعال‌ترین کاربران */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-orange-500"/> فعال‌ترین کاربران
            </h3>
            {topUsers.slice(0,5).map((u:any, i:number) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{background:["#FF6B00","#3b82f6","#22c55e","#a855f7","#f59e0b"][i]||"#64748b"}}>
                  {i+1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-bold text-xs truncate">{u.name||"ناشناس"}</p>
                  <p className="text-slate-400 text-[10px]">{u.unique_tests} نوع تست</p>
                </div>
                <span className="text-xs font-black text-slate-700">{u.total_tests}</span>
              </div>
            ))}
            {topUsers.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-4">داده‌ای موجود نیست</p>
            )}
          </div>

          {/* نکات هوشمند */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
              <Zap size={14} className="text-orange-500"/> تحلیل هوشمند
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-6">
              {perTest.length === 0 && (
                <p className="text-slate-400">هنوز داده‌ای ثبت نشده</p>
              )}
              {perTest[0] && (
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  🏆 پرطرفدارترین: <strong>{TEST_META[perTest[0].test_name]?.name||perTest[0].test_name}</strong>
                  {" "}با {perTest[0].total} پاسخ
                </div>
              )}
              {perTest.some((t:any) => t.completion_rate < 20) && (
                <div className="p-2 rounded-xl bg-orange-50 text-orange-700">
                  ⚠️ {perTest.filter((t:any)=>t.completion_rate<20).length} تست با نرخ تکمیل پایین — نیاز به توجه
                </div>
              )}
              {perTest.some((t:any) => t.last_7_days > 0) && (
                <div className="p-2 rounded-xl bg-green-50 text-green-700">
                  📈 {perTest.reduce((s:number,t:any)=>s+(t.last_7_days||0),0)} پاسخ در ۷ روز اخیر
                </div>
              )}
              {totalUsers > 0 && perTest.length > 0 && (
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  📊 به طور میانگین هر کاربر {summary.avgTestsPerUser} تست کامل کرده
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

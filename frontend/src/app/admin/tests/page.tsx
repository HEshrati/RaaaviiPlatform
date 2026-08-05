"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { isAdminPhone } from "@/lib/api";
import { TESTS_BY_ID } from "@/lib/tests-catalog";
import Link from "next/link";
import {
  Cpu, Search, RefreshCw, CheckCircle2, Lock, Users,
  BarChart2, Edit3, Eye, Trash2, ChevronRight, X,
  Save, AlertTriangle, TrendingUp, Plus
} from "lucide-react";

const API = "https://raaviiplatform.com";

const CORE = ["neo_ffi","ecr_r","erq","iri","gottman"];

export default function AdminTestsPage() {
  const { state } = useApp();
  const router = useRouter();
  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  const [stats, setStats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [editingQs, setEditingQs] = useState<any[]|null>(null);
  const [qSaving, setQSaving] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const token = typeof window!=="undefined" ? localStorage.getItem("token")||"" : "";
  const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };

  useEffect(() => {
    if (!state.isLoading && (!state.isLoggedIn || !isAdmin)) router.push("/dashboard");
    else loadStats();
  }, [state.isLoading]);

  async function loadStats() {
    const r = await fetch(`${API}/api/admin/tests/stats/overview`, { headers });
    if (r.ok) setStats(await r.json());
  }

  async function loadTest(testId: string) {
    const r = await fetch(`${API}/api/admin/tests/${testId}`, { headers });
    if (r.ok) {
      const d = await r.json();
      setSelected({ testId, ...d });
      setNotes(d.config?.admin_notes || "");
      setIsLocked(d.config?.is_locked || false);
      setIsActive(d.config?.is_active ?? true);
      setResults(d.results || []);
    }
  }

  async function saveConfig() {
    if (!selected) return;
    setSaving(true);
    const def = TESTS_BY_ID[selected.testId];
    await fetch(`${API}/api/admin/tests/${selected.testId}`, {
      method:"POST", headers,
      body: JSON.stringify({
        name: def?.name || selected.testId,
        description: def?.description,
        admin_notes: notes,
        is_locked: isLocked,
        is_active: isActive,
      }),
    });
    setSaving(false);
    setEditMode(false);
    loadStats();
  }

  // ترکیب tests-catalog با stats
  const allTests = Object.values(TESTS_BY_ID).map((t: any) => {
    const stat = stats.find(s => s.test_name === t.id);
    return { ...t, stat };
  });

  const filtered = allTests.filter(t =>
    !search || t.name?.includes(search) || t.id?.includes(search)
  );

  const def = selected ? TESTS_BY_ID[selected.testId] : null;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"0 4px 16px rgba(255,107,0,0.3)" }}>
              <Cpu size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-slate-900 font-black text-xl">مدیریت تست‌ها</h1>
              <p className="text-slate-500 text-xs">{allTests.length} تست در سیستم</p>
            </div>
          </div>
          <button onClick={loadStats} className="text-slate-400 hover:text-slate-700">
            <RefreshCw size={16}/>
          </button>
        </div>

        {/* آمار کلی */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:"کل تست‌ها", value:allTests.length, icon:Cpu, color:"#FF6B00" },
            { label:"تست‌های اصلی", value:CORE.length, icon:CheckCircle2, color:"#22c55e" },
            { label:"کل پاسخ‌ها", value:stats.reduce((a,s)=>a+Number(s.total_taken||0),0), icon:TrendingUp, color:"#3b82f6" },
            { label:"کاربران فعال", value:stats.reduce((a,s)=>a+Number(s.unique_users||0),0), icon:Users, color:"#a855f7" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background:`${s.color}12` }}>
                    <Icon size={15} style={{ color:s.color }}/>
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

        <div className="flex gap-4">
          {/* لیست تست‌ها */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="جستجوی تست..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl text-xs text-slate-700 outline-none"
                    style={{ background:"#f8fafc", border:"1px solid rgba(0,0,0,0.08)" }}/>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[65vh]">
                {filtered.map(t => {
                  const isCore = CORE.includes(t.id);
                  const active = selected?.testId === t.id;
                  return (
                    <button key={t.id} onClick={() => loadTest(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-right border-b border-slate-50 transition-all"
                      style={{
                        background: active ? "rgba(255,107,0,0.06)" : "white",
                        borderRight: active ? "3px solid #FF6B00" : "3px solid transparent",
                      }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isCore?"rgba(255,107,0,0.1)":"rgba(0,0,0,0.04)" }}>
                        <Cpu size={13} style={{ color:isCore?"#FF6B00":"#64748b" }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-bold text-xs truncate">{t.name || t.id}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isCore && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                              style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00" }}>
                              اصلی
                            </span>
                          )}
                          {t.stat && (
                            <span className="text-[9px] text-slate-400">
                              {Number(t.stat.total_taken).toLocaleString("fa-IR")} بار
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-300 flex-shrink-0"/>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* جزئیات تست */}
          <div className="flex-1">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center h-80">
                <div className="text-center">
                  <Cpu size={40} className="text-slate-200 mx-auto mb-3"/>
                  <p className="text-slate-400 text-sm">یک تست را انتخاب کنید</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header تست */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-slate-900 font-black text-lg">
                          {def?.name || selected.testId}
                        </h2>
                        {CORE.includes(selected.testId) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                            style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00" }}>
                            تست اصلی
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-mono">{selected.testId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowQuestions(!showQuestions)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background:"rgba(59,130,246,0.08)", color:"#3b82f6", border:"1px solid rgba(59,130,246,0.2)" }}>
                        <Eye size={12}/> {showQuestions?"بستن":"سوالات"}
                      </button>
                      {def && (
                        <button onClick={() => setEditingQs(JSON.parse(JSON.stringify(def.questions||[])))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background:"rgba(34,197,94,0.08)", color:"#16a34a", border:"1px solid rgba(34,197,94,0.2)" }}>
                          <Edit3 size={12}/> ویرایش سوالات
                        </button>
                      )}
                      <button onClick={() => setEditMode(!editMode)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background:"rgba(255,107,0,0.08)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.2)" }}>
                        <Edit3 size={12}/> {editMode?"انصراف":"ویرایش"}
                      </button>
                    </div>
                  </div>

                  {/* آمار */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label:"سوالات", value:def?.questions?.length||0, color:"#FF6B00" },
                      { label:"زمان (دقیقه)", value:def?.estimatedMinutes||0, color:"#3b82f6" },
                      { label:"کل پاسخ", value:Number(selected.stats?.total||0).toLocaleString("fa-IR"), color:"#22c55e" },
                      { label:"کاربران", value:Number(selected.stats?.unique_users||0).toLocaleString("fa-IR"), color:"#a855f7" },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl text-center"
                        style={{ background:`${s.color}08`, border:`1px solid ${s.color}20` }}>
                        <p className="font-black text-lg" style={{ color:s.color }}>{s.value}</p>
                        <p className="text-slate-500 text-[10px]">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {def?.description && (
                    <p className="text-slate-600 text-xs leading-6 bg-slate-50 p-3 rounded-xl">
                      {def.description}
                    </p>
                  )}
                </div>

                {/* ویرایش تنظیمات */}
                {editMode && (
                  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
                    <h3 className="text-slate-900 font-black text-sm mb-4 flex items-center gap-2">
                      <Edit3 size={14} className="text-orange-500"/> تنظیمات ادمین
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <div>
                          <p className="text-slate-700 font-bold text-sm">وضعیت فعال</p>
                          <p className="text-slate-400 text-xs">آیا کاربران می‌توانند این تست را ببینند؟</p>
                        </div>
                        <button onClick={()=>setIsActive(!isActive)}
                          className="w-12 h-6 rounded-full transition-all relative"
                          style={{ background:isActive?"#FF6B00":"#e2e8f0" }}>
                          <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                            style={{ left:isActive?"26px":"2px" }}/>
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <div>
                          <p className="text-slate-700 font-bold text-sm">قفل تست</p>
                          <p className="text-slate-400 text-xs">تست قبل از ایونت قفل باشد؟</p>
                        </div>
                        <button onClick={()=>setIsLocked(!isLocked)}
                          className="w-12 h-6 rounded-full transition-all relative"
                          style={{ background:isLocked?"#ef4444":"#e2e8f0" }}>
                          <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                            style={{ left:isLocked?"26px":"2px" }}/>
                        </button>
                      </div>
                      <div>
                        <label className="text-slate-700 font-bold text-sm mb-1 block">یادداشت ادمین</label>
                        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                          placeholder="یادداشت داخلی..."
                          className="w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none resize-none"
                          style={{ background:"#f8fafc", border:"1px solid rgba(0,0,0,0.08)" }}/>
                      </div>
                      <button onClick={saveConfig} disabled={saving}
                        className="w-full py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
                        style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
                        {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}
                        {saving?"در حال ذخیره...":"ذخیره تنظیمات"}
                      </button>
                    </div>
                  </div>
                )}

                {/* سوالات */}
                {showQuestions && def && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
                        <BarChart2 size={14} className="text-orange-500"/>
                        سوالات ({def.questions?.length})
                      </h3>
                      <span className="text-xs text-slate-400">
                        گزینه‌ها: {def.options?.length}
                      </span>
                    </div>
                    {/* گزینه‌ها */}
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
                      {def.options?.map((opt: any) => (
                        <span key={opt.value} className="text-xs px-2.5 py-1 rounded-lg font-bold"
                          style={{ background:"rgba(255,107,0,0.08)", color:"#FF6B00" }}>
                          {opt.label} ({opt.value})
                        </span>
                      ))}
                    </div>
                    {/* سوالات */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {def.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all"
                          style={{ border:"1px solid rgba(0,0,0,0.05)" }}>
                          <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                            style={{ background:"rgba(255,107,0,0.08)", color:"#FF6B00" }}>
                            {i+1}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-800 text-xs leading-6">{q.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {q.subscale && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-500">
                                  {q.subscale}
                                </span>
                              )}
                              {q.reverse && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-50 text-red-400">
                                  معکوس
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* آخرین پاسخ‌ها */}
                {results.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
                      <Users size={14} className="text-orange-500"/>
                      آخرین پاسخ‌ها ({results.length})
                    </h3>
                    <div className="space-y-2">
                      {results.slice(0,10).map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs">
                              {r.name?.[0]||"؟"}
                            </div>
                            <div>
                              <p className="text-slate-700 font-bold text-xs">{r.name||"ناشناس"}</p>
                              <p className="text-slate-400 text-[10px]">{r.phone_number}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-slate-700 font-black text-xs">{r.main_result}</p>
                            <p className="text-slate-400 text-[10px]">
                              {new Date(r.created_at).toLocaleDateString("fa-IR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ویرایش سوالات */}
      {editingQs && def && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)"}}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-slate-900 font-black text-base">ویرایش سوالات</h3>
                <p className="text-slate-500 text-xs">{def.name} — {editingQs.length} سوال</p>
              </div>
              <button onClick={()=>setEditingQs(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20}/>
              </button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
              {editingQs.map((q:any, qi:number) => (
                <div key={q.id||qi} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center flex-shrink-0">{qi+1}</span>
                    <textarea value={q.text||""}
                      onChange={e=>{const qs=[...editingQs];qs[qi]={...qs[qi],text:e.target.value};setEditingQs(qs);}}
                      rows={2}
                      className="flex-1 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none border border-slate-200 bg-white resize-none"/>
                    <button onClick={()=>setEditingQs(editingQs.filter((_:any,i:number)=>i!==qi))}
                      className="text-slate-300 hover:text-red-400 p-1"><X size={13}/></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mr-9">
                    {q.subscale && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">{q.subscale}</span>}
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={!!q.reverse}
                        onChange={e=>{const qs=[...editingQs];qs[qi]={...qs[qi],reverse:e.target.checked};setEditingQs(qs);}}/>
                      معکوس
                    </label>
                  </div>
                </div>
              ))}
              <button onClick={()=>setEditingQs([...editingQs,{id:Date.now(),text:"",subscale:"",reverse:false}])}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all text-sm font-bold flex items-center justify-center gap-2">
                <Plus size={14}/> سوال جدید
              </button>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={async()=>{
                  if(!selected) return;
                  setQSaving(true);
                  await fetch(`${API}/api/admin/tests/${selected.testId}`,{
                    method:"POST", headers,
                    body:JSON.stringify({
                      name:def.name,
                      custom_questions: editingQs,
                      admin_notes: notes,
                      is_active: isActive,
                      is_locked: isLocked,
                    })
                  });
                  setQSaving(false); setEditingQs(null);
                  alert("سوالات ذخیره شدند. برای اعمال تغییرات، باید کد frontend بازنشر شود.");
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
                style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
                {qSaving?<RefreshCw size={13} className="animate-spin"/>:<Save size={13}/>}
                {qSaving?"ذخیره...":"ذخیره سوالات"}
              </button>
              <button onClick={()=>setEditingQs(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600"
                style={{background:"rgba(0,0,0,0.05)"}}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

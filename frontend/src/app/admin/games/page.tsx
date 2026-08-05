"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { Gamepad2, Plus, Edit3, Trash2, Save, X, RefreshCw,
  ChevronDown, ChevronUp, GripVertical, Check, AlertCircle } from "lucide-react";

const SITE = "https://raaviiplatform.com";

const GAME_TYPES = [
  { id:"quiz",      label:"پرسش و پاسخ",    icon:"❓" },
  { id:"trivia",    label:"دانستنی‌ها",      icon:"🧠" },
  { id:"challenge", label:"چالش گروهی",     icon:"🎯" },
  { id:"icebreak",  label:"یخ‌شکن",         icon:"🧊" },
];

function QuestionEditor({ questions, onChange }: { questions: any[]; onChange: (q:any[])=>void }) {
  function addQ() {
    onChange([...questions, { id: Date.now(), question:"", options:["","","",""], correct:0 }]);
  }
  function removeQ(i: number) { onChange(questions.filter((_,idx)=>idx!==i)); }
  function updateQ(i: number, field: string, val: any) {
    const q = [...questions]; q[i] = { ...q[i], [field]: val }; onChange(q);
  }
  function updateOpt(qi: number, oi: number, val: string) {
    const q = [...questions];
    const opts = [...(q[qi].options||[])];
    opts[oi] = val; q[qi] = { ...q[qi], options: opts }; onChange(q);
  }
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id||qi} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
          <div className="flex items-start gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center flex-shrink-0">
              {qi+1}
            </div>
            <input value={q.question||""} onChange={e=>updateQ(qi,"question",e.target.value)}
              placeholder="متن سوال..."
              className="flex-1 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none border border-slate-200 bg-white"/>
            <button onClick={()=>removeQ(qi)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
              <X size={14}/>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mr-9">
            {(q.options||["","","",""]).map((opt:string, oi:number) => (
              <div key={oi} className="flex items-center gap-1.5">
                <button onClick={()=>updateQ(qi,"correct",oi)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: q.correct===oi?"#FF6B00":"#e2e8f0",
                    background: q.correct===oi?"#FF6B00":"white"
                  }}>
                  {q.correct===oi && <div className="w-2 h-2 rounded-full bg-white"/>}
                </button>
                <input value={opt} onChange={e=>updateOpt(qi,oi,e.target.value)}
                  placeholder={`گزینه ${oi+1}`}
                  className="flex-1 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none border border-slate-200 bg-white"/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addQ}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all text-sm font-bold flex items-center justify-center gap-2">
        <Plus size={15}/> افزودن سوال جدید
      </button>
    </div>
  );
}

export default function AdminGamesPage() {
  const [games, setGames]       = useState<any[]>([]);
  const [events, setEvents]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<any|null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);

  const token = typeof window!=="undefined" ? localStorage.getItem("token")||"" : "";
  const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [g, e] = await Promise.all([
      fetch(`${SITE}/api/admin/games`, { headers }).then(r=>r.ok?r.json():[]),
      fetch(`${SITE}/api/admin/games/events-list`, { headers }).then(r=>r.ok?r.json():[]),
    ]);
    setGames(g); setEvents(e); setLoading(false);
  }

  function startNew() {
    setEditing({
      game_type:"quiz", title:"", description:"",
      event_id:"", is_active:true, questions:[
        { id:1, question:"", options:["","","",""], correct:0 }
      ]
    });
    setIsNew(true);
  }

  async function saveGame() {
    if (!editing?.title) return;
    setSaving(true);
    if (isNew) {
      await fetch(`${SITE}/api/admin/games`, {
        method:"POST", headers, body:JSON.stringify(editing)
      });
    } else {
      await fetch(`${SITE}/api/admin/games/${editing.id}`, {
        method:"PUT", headers, body:JSON.stringify(editing)
      });
    }
    setSaving(false); setEditing(null); setIsNew(false); load();
  }

  async function deleteGame(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`${SITE}/api/admin/games/${id}`, { method:"DELETE", headers });
    load();
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{background:"rgba(255,107,0,0.1)",border:"1px solid rgba(255,107,0,0.2)"}}>
            <Gamepad2 size={18} className="text-orange-500"/>
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xl">مدیریت بازی‌های ایونت</h1>
            <p className="text-slate-500 text-xs">{games.length} بازی در سیستم</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="text-slate-400 hover:text-slate-700 p-2">
            <RefreshCw size={15} className={loading?"animate-spin":""}/>
          </button>
          <button onClick={startNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white"
            style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
            <Plus size={14}/> بازی جدید
          </button>
        </div>
      </div>

      {/* فرم ایجاد/ویرایش */}
      {editing && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-slate-900 font-black text-base">
              {isNew ? "بازی جدید" : "ویرایش بازی"}
            </h3>
            <button onClick={()=>{setEditing(null);setIsNew(false);}}
              className="text-slate-400 hover:text-slate-700">
              <X size={18}/>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* عنوان */}
            <div>
              <label className="text-slate-600 text-xs font-bold mb-1 block">عنوان بازی *</label>
              <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}
                placeholder="مثال: پرسش و پاسخ دورهمی هم‌فرکانس"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none"
                style={{background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.08)"}}/>
            </div>
            {/* نوع */}
            <div>
              <label className="text-slate-600 text-xs font-bold mb-1 block">نوع بازی</label>
              <select value={editing.game_type}
                onChange={e=>setEditing({...editing,game_type:e.target.value})}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none"
                style={{background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.08)"}}>
                {GAME_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            {/* ایونت */}
            <div>
              <label className="text-slate-600 text-xs font-bold mb-1 block">ایونت *</label>
              <select value={editing.event_id||""}
                onChange={e=>setEditing({...editing,event_id:e.target.value||null})}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none"
                style={{background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.08)"}}>
                <option value="">— انتخاب رویداد —</option>
                {events.map((ev:any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({new Date(ev.start_date).toLocaleDateString("fa-IR")})
                  </option>
                ))}
              </select>
            </div>
            {/* وضعیت */}
            <div className="flex items-center gap-3 pt-5">
              <button onClick={()=>setEditing({...editing,is_active:!editing.is_active})}
                className="w-11 h-6 rounded-full relative transition-all"
                style={{background:editing.is_active?"#FF6B00":"#e2e8f0"}}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all"
                  style={{left:editing.is_active?"24px":"2px"}}/>
              </button>
              <span className="text-slate-700 text-sm font-bold">
                {editing.is_active?"فعال":"غیرفعال"}
              </span>
            </div>
          </div>
          {/* توضیحات */}
          <div className="mb-5">
            <label className="text-slate-600 text-xs font-bold mb-1 block">توضیحات</label>
            <textarea value={editing.description||""}
              onChange={e=>setEditing({...editing,description:e.target.value})}
              rows={2} placeholder="توضیح کوتاه..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none resize-none"
              style={{background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.08)"}}/>
          </div>
          {/* سوالات */}
          <div className="mb-5">
            <label className="text-slate-600 text-xs font-bold mb-3 block">
              سوالات بازی ({editing.questions?.length||0} سوال)
            </label>
            <QuestionEditor
              questions={editing.questions||[]}
              onChange={q=>setEditing({...editing,questions:q})}/>
          </div>
          {/* دکمه‌ها */}
          <div className="flex gap-3">
            <button onClick={saveGame} disabled={saving||!editing.title}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
              style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
              {saving?<RefreshCw size={13} className="animate-spin"/>:<Save size={13}/>}
              {saving?"ذخیره...":"ذخیره بازی"}
            </button>
            <button onClick={()=>{setEditing(null);setIsNew(false);}}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600"
              style={{background:"rgba(0,0,0,0.05)"}}>
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* لیست بازی‌ها */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw size={24} className="text-orange-400 animate-spin"/></div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Gamepad2 size={40} className="text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm">هنوز بازی‌ای ثبت نشده</p>
          <button onClick={startNew} className="mt-4 text-orange-500 text-sm font-bold">
            + بازی اول را بساز
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((g:any) => {
            const gtype = GAME_TYPES.find(t=>t.id===g.game_type)||GAME_TYPES[0];
            const open = expanded === g.id;
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={()=>setExpanded(open?null:g.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{background:"rgba(255,107,0,0.06)"}}>
                    {gtype.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-slate-900 text-sm">{g.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        g.is_active?"bg-green-50 text-green-600":"bg-slate-100 text-slate-400"
                      }`}>
                        {g.is_active?"فعال":"غیرفعال"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{gtype.label}</span>
                      {g.event_title && <span>• {g.event_title}</span>}
                      <span>• {g.questions?.length||0} سوال</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e=>{e.stopPropagation();setEditing(g);setIsNew(false);}}
                      className="p-2 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-all">
                      <Edit3 size={13}/>
                    </button>
                    <button onClick={e=>{e.stopPropagation();deleteGame(g.id);}}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-400 transition-all">
                      <Trash2 size={13}/>
                    </button>
                    {open?<ChevronUp size={14} className="text-slate-400"/>:<ChevronDown size={14} className="text-slate-400"/>}
                  </div>
                </div>
                {open && (g.questions||[]).length > 0 && (
                  <div className="border-t border-slate-100 p-4">
                    <p className="text-slate-600 font-bold text-xs mb-3">
                      سوالات ({g.questions.length})
                    </p>
                    <div className="space-y-2">
                      {g.questions.map((q:any,i:number)=>(
                        <div key={i} className="p-3 rounded-xl bg-slate-50">
                          <p className="text-slate-800 text-xs font-bold mb-2">{i+1}. {q.question}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {(q.options||[]).map((opt:string,oi:number)=>(
                              <div key={oi} className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{background:q.correct===oi?"#FF6B00":"rgba(0,0,0,0.06)"}}>
                                  {q.correct===oi && <Check size={9} className="text-white"/>}
                                </div>
                                <span className="text-[10px] text-slate-600">{opt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

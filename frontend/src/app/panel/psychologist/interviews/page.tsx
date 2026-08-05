"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Save, Send, Loader2, Brain, Heart, ShieldAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const RISK_COLORS: Record<string,string> = { low:"#10b981", moderate:"#f59e0b", high:"#ef4444", urgent:"#dc2626" };
const RISK_LABELS: Record<string,string> = { low:"کم", moderate:"متوسط", high:"بالا", urgent:"اورژانسی" };

const HAMRAVAN_ITEMS = [
  { key:"hr_mood", label:"ارزیابی خلق و خو" },
  { key:"hr_anxiety", label:"بررسی اضطراب و نگرانی" },
  { key:"hr_depression", label:"علائم افسردگی" },
  { key:"hr_trauma", label:"سابقه تروما یا PTSD" },
  { key:"hr_self_harm", label:"افکار خودآسیب‌رسان" },
  { key:"hr_psychosis", label:"بررسی علائم سایکوز" },
  { key:"hr_ocd", label:"وسواس فکری-عملی" },
  { key:"hr_sleep", label:"اختلال خواب" },
  { key:"hr_substance", label:"مصرف مواد یا الکل" },
  { key:"hr_insight", label:"بینش نسبت به مشکل" },
  { key:"hr_motivation", label:"انگیزه برای درمان" },
  { key:"hr_coping", label:"مهارت‌های مقابله‌ای" },
];

const HAMZIST_ITEMS = [
  { key:"hz_medical", label:"بیماری‌های جسمی مزمن" },
  { key:"hz_medication", label:"مصرف داروهای خاص" },
  { key:"hz_sleep_quality", label:"کیفیت خواب و استراحت" },
  { key:"hz_nutrition", label:"تغذیه و وزن" },
  { key:"hz_exercise", label:"فعالیت بدنی" },
  { key:"hz_family", label:"روابط خانوادگی" },
  { key:"hz_social", label:"شبکه حمایت اجتماعی" },
  { key:"hz_work", label:"وضعیت شغلی/تحصیلی" },
  { key:"hz_financial", label:"استرس مالی" },
  { key:"hz_housing", label:"شرایط محیط زندگی" },
  { key:"hz_life_events", label:"رویدادهای استرس‌زای اخیر" },
  { key:"hz_spirituality", label:"باورهای معنوی/مذهبی" },
];

const MSE_FIELDS = [
  { key:"appearance", label:"ظاهر و آراستگی", options:["مرتب","بی‌نظم","نامناسب"] },
  { key:"behavior", label:"رفتار", options:["همکاری کامل","مقاومت جزئی","بدون همکاری"] },
  { key:"mood", label:"خلق", options:["پایدار","نگران","غمگین","تحریک‌پذیر","شاد/مانیک"] },
  { key:"affect", label:"عاطفه", options:["طبیعی","محدود","کدر","ناهماهنگ"] },
  { key:"thought_process", label:"فرایند فکر", options:["منطقی","پراکنده","پروازی","کُند"] },
  { key:"perception", label:"ادراک", options:["طبیعی","توهم شنوایی","توهم بینایی","دیگر"] },
  { key:"orientation", label:"جهت‌یابی", options:["کامل","جزئی","مختل"] },
  { key:"memory", label:"حافظه", options:["طبیعی","مختل کوتاه‌مدت","مختل بلندمدت"] },
  { key:"insight", label:"بینش", options:["کامل","جزئی","ندارد"] },
  { key:"judgment", label:"قضاوت", options:["سالم","مختل جزئی","مختل"] },
];

function NotApprovedBanner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <ShieldAlert size={28} style={{ color: "#f59e0b" }} />
      </div>
      <h2 className="text-white font-black text-lg mb-2">دسترسی محدود</h2>
      <p className="text-slate-400 text-sm leading-7 max-w-xs">
        پروفایل شما هنوز توسط تیم راوی تأیید نشده است.<br />
        پس از تأیید، امکان ثبت مصاحبه بالینی فعال می‌شود.
      </p>
      <a href="/panel/psychologist/status"
        className="mt-6 px-6 py-3 rounded-2xl text-sm font-bold"
        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
        مشاهده وضعیت پروفایل
      </a>
    </div>
  );
}

function Section({ title, open, toggle, children, color="#6366f1", icon: Icon }: any) {
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${color}20` }}>
      <button onClick={toggle} className="w-full flex items-center justify-between p-4 transition-all"
        style={{ background: open ? `${color}08` : "rgba(255,255,255,0.03)" }}>
        <span className="text-white font-bold text-sm flex items-center gap-2">
          {Icon && <Icon size={15} style={{ color }} />}{title}
        </span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-4" style={{ background: "rgba(255,255,255,0.02)" }}>{children}</div>}
    </div>
  );
}

function ChecklistSection({ items, checked, onToggle, color }: {
  items: {key:string; label:string}[]; checked: Record<string,boolean>; onToggle:(k:string)=>void; color:string;
}) {
  const done = items.filter(i => checked[i.key]).length;
  return (
    <div>
      <div className="flex justify-between text-xs mb-3">
        <span className="text-slate-500">پیشرفت</span>
        <span style={{ color }}>{done}/{items.length}</span>
      </div>
      <div className="h-1.5 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round((done/items.length)*100)}%`, background: `linear-gradient(90deg,${color},${color}88)` }} />
      </div>
      <div className="space-y-2">
        {items.map(({ key, label }) => (
          <button key={key} onClick={() => onToggle(key)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all"
            style={{
              background: checked[key] ? `${color}10` : "rgba(255,255,255,0.03)",
              border: `1px solid ${checked[key] ? color+"30" : "rgba(255,255,255,0.06)"}`,
            }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: checked[key] ? color : "rgba(255,255,255,0.06)", border: `1.5px solid ${checked[key] ? color : "rgba(255,255,255,0.15)"}` }}>
              {checked[key] && <CheckCircle2 size={12} color="white" />}
            </div>
            <span className="text-sm transition-all" style={{ color: checked[key] ? "#e2e8f0" : "#64748b" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Radio({ options, value, onChange, color="#6366f1" }: any) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((o: string) => (
        <button key={o} onClick={() => onChange(o)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: value === o ? `${color}25` : "rgba(255,255,255,0.04)",
            border: `1px solid ${value === o ? color : "rgba(255,255,255,0.08)"}`,
            color: value === o ? "#c7d2fe" : "#64748b",
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Textarea({ label, value, onChange, rows=3 }: any) {
  return (
    <div className="mt-3">
      {label && <p className="text-slate-500 text-xs mb-1">{label}</p>}
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-sm text-white resize-none outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
    </div>
  );
}

export default function InterviewPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState<Record<string,boolean>>({ hamravan: true });
  const [form, setForm] = useState<Record<string,any>>({});
  const [mse, setMse] = useState<Record<string,string>>({});
  const [hamravanChecked, setHamravanChecked] = useState<Record<string,boolean>>({});
  const [hamzistChecked, setHamzistChecked] = useState<Record<string,boolean>>({});
  const [risk, setRisk] = useState("low");
  const [riskNotes, setRiskNotes] = useState("");
  const [clinicalNote, setClinicalNote] = useState("");
  const [satisfaction, setSatisfaction] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  // باگ رفع‌شده: قبلاً شناسه مصاحبهٔ ایجادشده هیچ‌جا نگهداری نمی‌شد، بنابراین با هر بار
  // کلیک روی «ذخیره پیش‌نویس» یک رکورد کاملاً جدید در session_interviews ساخته می‌شد
  // و چند مصاحبهٔ نیمه‌کاره تکراری برای یک جلسه ایجاد می‌کرد. حالا شناسه بعد از اولین
  // ذخیره نگه داشته می‌شود و ذخیره‌های بعدی همان رکورد را به‌روزرسانی می‌کنند.
  const [interviewId, setInterviewId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    // چک وضعیت تأیید
    fetch(`${API}/api/psychologist-verify/my-profile`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const status = d?.verificationStatus || d?.verification_status || "";
        setIsApproved(["approved", "active"].includes(status));
      })
      .catch(() => setIsApproved(false));
    // بارگذاری رزروها
    fetch(`${API}/api/psychologist-verify/my-bookings`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setBookings(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));
  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const toggleHR = (k: string) => setHamravanChecked(p => ({ ...p, [k]: !p[k] }));
  const toggleHZ = (k: string) => setHamzistChecked(p => ({ ...p, [k]: !p[k] }));

  const RISK_QUESTION_KEYS = ["suicidal_ideation","suicidal_intent","suicidal_plan","previous_attempt","harm_others","access_means"];

  async function save(submit = false) {
    if (!selected) { setMsg("⚠ ابتدا یک رزرو انتخاب کنید"); return; }
    // باگ رفع‌شده: برچسب «این بخش اجباری است» روی ارزیابی ریسک صرفاً تزئینی بود و هیچ‌جا
    // واقعاً چک نمی‌شد؛ روانشناس می‌توانست بدون پاسخ به هیچ‌کدام از سؤالات ریسک، فرم را
    // نهایی کند و سیستم به‌صورت خاموش سطح ریسک را «کم» فرض می‌کرد. چون این دقیقاً همان
    // بخشی است که برای شناسایی افکار خودآسیب‌رسانی طراحی شده، این را در ارسال نهایی اجباری کردیم.
    if (submit) {
      const unanswered = RISK_QUESTION_KEYS.filter(k => !form[`risk_${k}`]);
      if (unanswered.length) {
        setMsg("⚠ پیش از ارسال نهایی، لطفاً به همه سؤالات بخش «ارزیابی ریسک» پاسخ دهید");
        setOpen(p => ({ ...p, risk: true }));
        return;
      }
    }
    setSaving(true); setMsg("");
    const token = localStorage.getItem("token") || "";
    try {
      let id = interviewId;
      if (!id) {
        const createRes = await fetch(`${API}/api/psychologist-verify/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            patientUserId: selected.user_id || selected.userId,
            bookingId: selected.id,
            sessionMode: selected.session_type,
            sessionDatetime: selected.start_datetime,
          }),
        });
        if (!createRes.ok) throw new Error((await createRes.json().catch(() => ({}))).message || "خطا در ایجاد فرم مصاحبه");
        const created = await createRes.json();
        id = created.interview_id;
        if (!id) throw new Error("خطا در ایجاد فرم مصاحبه");
        setInterviewId(id);
      }

      const sectionCalls = [
        { sectionKey: "hamravan", items: HAMRAVAN_ITEMS.map(i => ({ key: i.key, value: hamravanChecked[i.key] || false, note: "" })) },
        { sectionKey: "hamzist", items: HAMZIST_ITEMS.map(i => ({ key: i.key, value: hamzistChecked[i.key] || false, note: "" })) },
        { sectionKey: "mse", items: MSE_FIELDS.map(f => ({ key: f.key, value: mse[f.key] || "", note: mse[`${f.key}_note`] || "" })) },
        { sectionKey: "risk", items: [
          { key: "risk_level", value: risk, note: riskNotes },
          { key: "satisfaction", value: satisfaction, note: "" },
          ...Object.entries(form).filter(([k]) => k.startsWith("risk_")).map(([k,v]) => ({ key: k, value: v, note: "" })),
        ]},
      ];
      for (const body of sectionCalls) {
        const r = await fetch(`${API}/api/psychologist-verify/interviews/${id}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "خطا در ذخیره بخش فرم");
      }

      if (submit) {
        const r = await fetch(`${API}/api/psychologist-verify/interviews/${id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ clinicalNote }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "خطا در ارسال نهایی فرم");
        setMsg("✅ فرم مصاحبه ارسال و ذخیره شد");
      } else {
        setMsg("✅ پیش‌نویس ذخیره شد");
      }
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
    finally { setSaving(false); }
  }

  // لودینگ
  if (isApproved === null) {
    return (
      <div dir="rtl" className="flex justify-center py-20">
        <Loader2 size={24} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  // تأیید نشده
  if (!isApproved) {
    return <div dir="rtl"><NotApprovedBanner /></div>;
  }

  return (
    <div dir="rtl">
      <h1 className="text-white text-xl font-black mb-1">مصاحبه بالینی</h1>
      <p className="text-slate-500 text-sm mb-5">فرم را حین یا حداکثر ۱ ساعت پس از جلسه تکمیل کنید</p>

      <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-slate-400 text-xs mb-2 font-bold">انتخاب جلسه</p>
        {loadingBookings ? <p className="text-slate-500 text-sm">در حال بارگذاری...</p> : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {bookings.length === 0 && <p className="text-slate-500 text-sm">رزروی موجود نیست</p>}
            {bookings.map((b: any) => (
              <button key={b.id} onClick={() => { setSelected(b); setInterviewId(null); setMsg(""); }}
                className="w-full text-right p-3 rounded-xl transition-all"
                style={{
                  background: selected?.id === b.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selected?.id === b.id ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <p className="text-white text-sm font-bold">{b.user_display_name || "مراجع"}</p>
                <p className="text-slate-500 text-xs">{b.start_datetime ? new Date(b.start_datetime).toLocaleString("fa-IR") : "-"}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <>
        <Section title="چک‌لیست هم‌روان (روانشناختی)" open={open.hamravan} toggle={() => toggle("hamravan")} color="#10b981" icon={Brain}>
          <ChecklistSection items={HAMRAVAN_ITEMS} checked={hamravanChecked} onToggle={toggleHR} color="#10b981" />
          <Textarea label="یادداشت هم‌روان" value={form.hamravan_note || ""} onChange={(v:string) => setF("hamravan_note", v)} rows={2} />
        </Section>

        <Section title="چک‌لیست هم‌زیست (زیستی-اجتماعی)" open={open.hamzist} toggle={() => toggle("hamzist")} color="#3b82f6" icon={Heart}>
          <ChecklistSection items={HAMZIST_ITEMS} checked={hamzistChecked} onToggle={toggleHZ} color="#3b82f6" />
          <Textarea label="یادداشت هم‌زیست" value={form.hamzist_note || ""} onChange={(v:string) => setF("hamzist_note", v)} rows={2} />
        </Section>

        <Section title="معاینه وضعیت روانی (MSE)" open={open.mse} toggle={() => toggle("mse")} color="#8b5cf6">
          {MSE_FIELDS.map(({ key, label, options }) => (
            <div key={key} className="mb-4">
              <p className="text-slate-300 text-sm font-bold">{label}</p>
              <Radio options={options} value={mse[key]} onChange={(v: string) => setMse(p => ({ ...p, [key]: v }))} />
              <input placeholder="یادداشت..." value={mse[`${key}_note`] || ""}
                onChange={e => setMse(p => ({ ...p, [`${key}_note`]: e.target.value }))}
                className="w-full mt-2 px-3 py-1.5 rounded-xl text-xs text-white outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
          ))}
        </Section>

        <Section title="ارزیابی ریسک ⚠" open={open.risk} toggle={() => toggle("risk")} color="#ef4444">
          <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-red-400 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> این بخش اجباری است</p>
          </div>
          {[["افکار خودکشی","suicidal_ideation"],["قصد خودکشی","suicidal_intent"],
            ["برنامه برای خودکشی","suicidal_plan"],["سابقه اقدام","previous_attempt"],
            ["افکار آسیب به دیگران","harm_others"],["دسترسی به ابزار آسیب","access_means"]].map(([label, key]) => (
            <div key={key} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="text-slate-300 text-sm">{label}</span>
              <div className="flex gap-2">
                {["بله","خیر"].map(v => (
                  <button key={v} onClick={() => setF(`risk_${key}`, v)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: form[`risk_${key}`] === v ? (v==="بله" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.15)") : "rgba(255,255,255,0.04)",
                      color: form[`risk_${key}`] === v ? (v==="بله" ? "#ef4444" : "#10b981") : "#475569",
                      border: `1px solid ${form[`risk_${key}`] === v ? (v==="بله" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.3)") : "transparent"}`,
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {["low","moderate","high","urgent"].map(r => (
              <button key={r} onClick={() => setRisk(r)}
                className="py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: risk===r ? `${RISK_COLORS[r]}22` : "rgba(255,255,255,0.04)", border: `1px solid ${risk===r ? RISK_COLORS[r] : "rgba(255,255,255,0.08)"}`, color: risk===r ? RISK_COLORS[r] : "#64748b" }}>
                {RISK_LABELS[r]}
              </button>
            ))}
          </div>
          {(risk==="high"||risk==="urgent") && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">این مورد به ادمین گزارش داده می‌شود</p>
            </div>
          )}
          <Textarea label="توضیحات ریسک" value={riskNotes} onChange={setRiskNotes} rows={2} />
        </Section>

        <Section title="رضایت مراجع از جلسه" open={open.satisfaction} toggle={() => toggle("satisfaction")} color="#f59e0b">
          <p className="text-slate-400 text-xs mb-3">آیا مراجع از این جلسه/روانشناس رضایت داشت؟</p>
          <div className="flex gap-3">
            {[["satisfied","راضی","#10b981"],["neutral","خنثی","#f59e0b"],["unsatisfied","ناراضی","#ef4444"]].map(([v,l,c]) => (
              <button key={v} onClick={() => setSatisfaction(v)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: satisfaction===v ? `${c}18` : "rgba(255,255,255,0.04)", border: `1px solid ${satisfaction===v ? c : "rgba(255,255,255,0.08)"}`, color: satisfaction===v ? c : "#64748b" }}>
                {l}
              </button>
            ))}
          </div>
          {satisfaction === "unsatisfied" && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> این روانشناس دیگر به این مراجع پیشنهاد نخواهد شد
              </p>
            </div>
          )}
          <Textarea label="دلیل نارضایتی (اختیاری)" value={form.dissatisfaction_reason||""} onChange={(v:string)=>setF("dissatisfaction_reason",v)} rows={2} />
        </Section>

        <Section title="نظر بالینی روانشناس" open={open.clinical} toggle={() => toggle("clinical")} color="#10b981">
          <Textarea label="برداشت کلی، فرضیه اولیه، برنامه درمانی پیشنهادی" value={clinicalNote} onChange={setClinicalNote} rows={6} />
        </Section>

        {msg && (
          <div className="p-3 rounded-xl mb-3"
            style={{ background: msg.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.startsWith("✅") ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            <p className="text-sm" style={{ color: msg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{msg}</p>
          </div>
        )}

        <div className="flex gap-3 mt-2 pb-8">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1" }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} ذخیره پیش‌نویس
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} ارسال نهایی
          </button>
        </div>
      </>}
    </div>
  );
}




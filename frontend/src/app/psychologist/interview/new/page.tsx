'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// باگ بحرانی رفع‌شده: این صفحه به سه endpoint کاملاً اشتباه درخواست می‌زد:
//   /api/psychologist/interview        → باید /api/psychologist-verify/interviews (plural) باشد
//   /api/psychologist/interview/:id/section  → باید /api/psychologist-verify/interviews/:id/sections (plural) باشد
//   /api/psychologist/interview/:id/submit   → باید /api/psychologist-verify/interviews/:id/submit باشد
// هیچ کنترلری با پیشوند /api/psychologist وجود ندارد؛ تمام endpoint های روانشناس
// زیر /api/psychologist-verify هستند. نتیجه: این صفحه همیشه 404 می‌گرفت.
//
// علاوه بر این، بعد از ثبت موفق، کاربر به /psychologist/dashboard ریدایرکت می‌شد
// که در پروژه وجود ندارد؛ صفحه صحیح /panel/psychologist/interviews است.
const API = process.env.NEXT_PUBLIC_API_URL || 'https://raaviiplatform.com';

const SECTIONS = [
  {
    key: 'presenting_problem', title: '۱. مشکل اصلی', items: [
      { key: 'main_issue', label: 'مشکل اصلی', type: 'textarea' },
      { key: 'severity', label: 'شدت مشکل (۱-۱۰)', type: 'number' },
      { key: 'duration', label: 'مدت درگیری', type: 'text' },
      { key: 'triggers', label: 'عوامل تشدیدکننده', type: 'textarea' },
    ]
  },
  {
    key: 'history', title: '۲. سابقه', items: [
      { key: 'onset', label: 'شروع اولیه', type: 'text' },
      { key: 'previous_treatment', label: 'درمان‌های قبلی', type: 'textarea' },
      { key: 'current_medications', label: 'داروهای فعلی', type: 'text' },
    ]
  },
  {
    key: 'mse', title: '۳. معاینه وضعیت ذهنی (MSE)', items: [
      { key: 'appearance', label: 'ظاهر و آراستگی', type: 'select', options: ['طبیعی','نامرتب','غیرمعمول'] },
      { key: 'mood', label: 'خلق', type: 'select', options: ['نگران','غمگین','خنثی','تحریک‌پذیر','پایدار','شاد'] },
      { key: 'affect', label: 'عاطفه', type: 'select', options: ['مناسب','محدود','مسطح','لابل'] },
      { key: 'thought_process', label: 'فرایند تفکر', type: 'select', options: ['منطقی','پراکنده','کند','فشرده'] },
      { key: 'insight', label: 'بینش', type: 'select', options: ['کامل','جزئی','ضعیف','وجود ندارد'] },
      { key: 'judgment', label: 'قضاوت', type: 'select', options: ['سالم','خفیف آسیب','آسیب جدی'] },
    ]
  },
  {
    key: 'risk_assessment', title: '۴. ارزیابی ریسک ⚠️', items: [
      { key: 'suicidal_ideation', label: 'افکار خودکشی', type: 'select', options: ['none','passive','active','with_plan'] },
      { key: 'suicide_plan', label: 'برنامه خودکشی', type: 'select', options: ['none','vague','specific'] },
      { key: 'self_harm', label: 'خودآسیب‌رسانی', type: 'select', options: ['none','history','current'] },
      { key: 'harm_to_others', label: 'آسیب به دیگران', type: 'select', options: ['none','ideation','threat'] },
      { key: 'protective_factors', label: 'عوامل محافظتی', type: 'textarea' },
    ]
  },
];

function InterviewForm() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get('bookingId');
  const patientId = params.get('patientId');

  const [step, setStep] = useState(0);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  const [clinicalNote, setClinicalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);

  const token = () => localStorage.getItem('token');

  const createInterview = async () => {
    if (interviewId) return interviewId;
    const r = await fetch(`${API}/api/psychologist-verify/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ patientUserId: patientId, bookingId, sessionMode: 'online' }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    setInterviewId(d.interview_id);
    return d.interview_id;
  };

  const saveSection = async (sectionIdx: number) => {
    setLoading(true); setMsg('');
    try {
      const iid = await createInterview();
      const sec = SECTIONS[sectionIdx];
      const items = Object.entries(answers[sec.key] || {}).map(([key, value]) => ({ key, value }));
      if (items.length === 0) { setStep(s => s + 1); setLoading(false); return; }
      const r = await fetch(`${API}/api/psychologist-verify/interviews/${iid}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ sectionKey: sec.key, items }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'خطا در ذخیره بخش'); }
      setStep(s => s + 1);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const submitInterview = async () => {
    if (!clinicalNote.trim()) return setMsg('یادداشت بالینی الزامی است');
    setLoading(true); setMsg('');
    try {
      const iid = interviewId || await createInterview();
      const r = await fetch(`${API}/api/psychologist-verify/interviews/${iid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clinicalNote }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setResult(d); setDone(true);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const setAnswer = (section: string, key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [key]: value } }));
  };

  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' };

  if (done && result) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#0d1b2e,#1B2A4A)' }}>
      <div className="max-w-md w-full rounded-2xl p-8 text-center" style={cardStyle}>
        <div className="text-6xl mb-4">{result.risk_level === 'high' ? '⚠️' : '✅'}</div>
        <h2 className="text-white font-bold text-xl mb-2">{result.message}</h2>
        <div className="mt-4 p-4 rounded-xl" style={{
          background: result.risk_level === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'
        }}>
          <p className="text-sm" style={{ color: result.risk_level === 'high' ? '#f87171' : '#4ade80' }}>
            سطح ریسک: {result.risk_level === 'high' ? 'بالا ⚠️' : result.risk_level === 'moderate' ? 'متوسط' : 'پایین'}
          </p>
          {result.risk_flags?.length > 0 && (
            <p className="text-red-400 text-xs mt-1">Flag ها: {result.risk_flags.join(', ')}</p>
          )}
          <p className="text-white/50 text-xs mt-1">پیچیدگی: {result.complexity}</p>
        </div>
        <button onClick={() => router.push('/panel/psychologist/interviews')}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(135deg,#0d1b2e,#1B2A4A,#243555)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">فرم مصاحبه بالینی</h1>
          <p className="text-white/50 text-sm">مرحله {step + 1} از {SECTIONS.length + 1}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[...SECTIONS, { key: 'note', title: 'یادداشت' }].map((s, i) => (
            <div key={s.key} className="flex-1 h-1 rounded-full"
              style={{ background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl text-red-400 text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}>{msg}</div>
        )}

        {/* Section Forms */}
        {step < SECTIONS.length && (() => {
          const sec = SECTIONS[step];
          return (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-white font-bold text-lg mb-5 pb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {sec.key === 'risk_assessment' ? '⚠️ ' : ''}{sec.title}
              </h2>
              <div className="space-y-4">
                {sec.items.map(item => (
                  <div key={item.key}>
                    <label className="text-white/70 text-sm mb-1 block">{item.label}</label>
                    {item.type === 'textarea' ? (
                      <textarea rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                        style={inputStyle}
                        value={answers[sec.key]?.[item.key] || ''}
                        onChange={e => setAnswer(sec.key, item.key, e.target.value)} />
                    ) : item.type === 'select' ? (
                      <select className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}
                        value={answers[sec.key]?.[item.key] || ''}
                        onChange={e => setAnswer(sec.key, item.key, e.target.value)}>
                        <option value="">انتخاب کنید</option>
                        {(item as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={item.type} className="w-full px-3 py-2 rounded-xl text-sm"
                        style={inputStyle}
                        value={answers[sec.key]?.[item.key] || ''}
                        onChange={e => setAnswer(sec.key, item.key, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="px-4 py-2 rounded-xl text-white/60 text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    ← قبلی
                  </button>
                )}
                <button onClick={() => saveSection(step)} disabled={loading}
                  className="flex-1 py-2 rounded-xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                  {loading ? '...' : 'ذخیره و ادامه ←'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Clinical Note Step */}
        {step === SECTIONS.length && (
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-white font-bold text-lg mb-5 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              📝 یادداشت بالینی روانشناس
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-1 block">یادداشت کلینیکال (برداشت کلی، فرضیه، برنامه) *</label>
                <textarea rows={8} className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={inputStyle}
                  placeholder="برداشت کلی از جلسه، فرضیه‌های اولیه، برنامه درمانی پیشنهادی، نکات مهم..."
                  value={clinicalNote}
                  onChange={e => setClinicalNote(e.target.value)} />
              </div>
              <div className="p-3 rounded-xl text-xs text-amber-400"
                style={{ background: 'rgba(251,191,36,0.1)' }}>
                ⚠️ این اطلاعات توسط سیستم AI بررسی می‌شود. در صورت شناسایی ریسک بالا، به ادمین اطلاع داده می‌شود.
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 rounded-xl text-white/60 text-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                ← قبلی
              </button>
              <button onClick={submitInterview} disabled={loading}
                className="flex-1 py-2 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                {loading ? 'در حال ثبت...' : '✅ ثبت نهایی فرم'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><InterviewForm /></Suspense>;
}




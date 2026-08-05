"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const API = "https://raaviiplatform.com";

const FEEDBACK_QUESTIONS = [
  { id: "conversation_quality", label: "کیفیت گفتگو چقدر بود؟" },
  { id: "felt_safe",            label: "چقدر احساس امنیت کردی؟" },
  { id: "group_satisfaction",   label: "از گروه چقدر راضی بودی؟" },
  { id: "session_useful",       label: "این جلسه چقدر برایت مفید بود؟" },
  { id: "felt_heard",           label: "آیا فرصت بیان خودت را داشتی؟" },
  { id: "would_return",         label: "آیا در رویداد مشابه شرکت می‌کنی؟" },
];

const WHO5_QUESTIONS = [
  "روحیه‌ام خوب بوده و سرحال بوده‌ام.",
  "آرام و راحت بوده‌ام.",
  "احساس کرده‌ام فعال و پرانرژی هستم.",
  "با خواب خوب از خواب برخاسته‌ام.",
  "زندگی روزانه‌ام پر از چیزهای جالب بوده.",
];

const WHO5_LABELS = ["هرگز", "گاهی", "کمتر از نیمی", "بیشتر از نیمی", "اکثراً", "همیشه"];

function FeedbackPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = params.get("event_id") || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const [step, setStep] = useState<"feedback" | "who5" | "done">("feedback");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [who5, setWho5] = useState<number[]>(new Array(5).fill(-1));
  const [submitting, setSubmitting] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function submitFeedback() {
    if (FEEDBACK_QUESTIONS.some(q => !ratings[q.id])) return;
    setSubmitting(true);
    await fetch(`${API}/api/feedback/post-event`, {
      method: "POST", headers,
      body: JSON.stringify({ event_id: eventId, ratings, comment }),
    });
    setSubmitting(false);
    setStep("who5");
  }

  async function submitWho5() {
    if (who5.some(s => s < 0)) return;
    setSubmitting(true);
    await fetch(`${API}/api/feedback/who5`, {
      method: "POST", headers,
      body: JSON.stringify({ event_id: eventId, phase: "post", scores: who5 }),
    });
    setSubmitting(false);
    setStep("done");
  }

  if (step === "done") return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6"/>
        <h2 className="text-2xl font-black text-slate-800 mb-2">ممنون از بازخورد شما!</h2>
        <p className="text-slate-500 mb-6">نظرات شما به بهتر شدن راوی کمک می‌کند.</p>
        <button onClick={() => router.push("/dashboard")}
          className="w-full py-4 rounded-2xl font-black text-white"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );

  if (step === "who5") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-20" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="text-xs text-blue-500 font-bold bg-blue-50 px-3 py-1 rounded-full">اختیاری — WHO-5</span>
          <h2 className="text-xl font-black text-slate-800 mt-3 leading-8">در دو هفته گذشته چطور بودی؟</h2>
          <p className="text-slate-400 text-sm mt-1">این سوالات برای سنجش علمی اثر رویداد است.</p>
        </div>
        <div className="space-y-6">
          {WHO5_QUESTIONS.map((q, qi) => (
            <div key={qi} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 mb-4 leading-7">{q}</p>
              <div className="grid grid-cols-3 gap-2">
                {WHO5_LABELS.map((label, li) => (
                  <button key={li}
                    onClick={() => { const n = [...who5]; n[qi] = li; setWho5(n); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      who5[qi] === li ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-blue-50"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setStep("done")} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-500">رد کردن</button>
          <button onClick={submitWho5} disabled={who5.some(s => s < 0) || submitting}
            className="flex-1 py-4 rounded-2xl font-black text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>ثبت</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-black text-slate-800 leading-8">نظرت درباره این رویداد چیه؟</h2>
          <p className="text-slate-400 text-sm mt-1">پاسخ به این سوالات الزامی است.</p>
        </div>
        <div className="space-y-5">
          {FEEDBACK_QUESTIONS.map(q => (
            <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 mb-4">{q.label}</p>
              <div className="flex gap-2 justify-between">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setRatings(r => ({ ...r, [q.id]: v }))}
                    className={`flex-1 py-3 rounded-xl font-black transition-all ${
                      ratings[q.id] === v ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-400 hover:bg-orange-50"
                    }`}>{v}</button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-300 mt-1 px-1">
                <span>خیلی کم</span><span>خیلی زیاد</span>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="font-bold text-slate-700 mb-3">نظر اضافی (اختیاری)</p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="هر چیزی که می‌خواهی بگویی..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-orange-500 resize-none"/>
          </div>
        </div>
        <button onClick={submitFeedback} disabled={FEEDBACK_QUESTIONS.some(q => !ratings[q.id]) || submitting}
          className="w-full mt-6 py-4 rounded-2xl font-black text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>ثبت و ادامه</button>
      </div>
    </div>
  );
}

export default function PostEventFeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>}>
      <FeedbackPageInner />
    </Suspense>
  );
}

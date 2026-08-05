"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Star } from "lucide-react";

const QUESTIONS = [
  { key: "psychological_safety",  label: "در این گروه احساس امنیت و راحتی داشتم." },
  { key: "felt_heard",            label: "احساس کردم دیگران به صحبت‌های من توجه کردند." },
  { key: "felt_accepted",         label: "در این گروه احساس قضاوت‌شدن نداشتم." },
  { key: "conversation_quality",  label: "گفتگوهای گروه برایم رضایت‌بخش بود." },
  { key: "interaction_meaning",   label: "تعاملات این رویداد برایم معنادار بود." },
  { key: "participation_comfort", label: "توانستم به اندازه‌ای که می‌خواستم مشارکت کنم." },
  { key: "felt_connected",        label: "احساس کردم با بعضی افراد گروه ارتباط واقعی برقرار شد." },
  { key: "group_satisfaction",    label: "ترکیب افراد گروه برای من مناسب بود." },
  { key: "continued_interest",    label: "دوست دارم با برخی افراد این گروه دوباره ارتباط داشته باشم." },
];

function PostEventPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id") || "";
  const groupId = searchParams.get("group_id") || "";

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const progress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);

  function setAnswer(key: string, value: number) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < QUESTIONS.length) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/rgci/post-event", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, group_id: groupId || null, responses: answers }),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">ممنون از بازخوردت!</h2>
          <p className="text-slate-500 mb-6">نظر شما به بهبود تجربه راوی کمک می‌کند</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold"
          >
            برگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white" dir="rtl">
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-orange-100 px-4 py-3 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>ارزیابی تجربه رویداد</span>
            <span>{progress}٪</span>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800">تجربه رویداد چطور بود؟</h1>
          <p className="text-slate-500 text-sm mt-1">به هر گویه از ۱ تا ۵ امتیاز بده</p>
        </div>

        {QUESTIONS.map((q) => (
          <div key={q.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-slate-700 font-medium mb-4 leading-7">{q.label}</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setAnswer(q.key, v)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${
                    answers[q.key] === v
                      ? "bg-orange-500 text-white scale-110"
                      : "bg-slate-100 text-slate-600 hover:bg-orange-100"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < QUESTIONS.length || submitting}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg disabled:opacity-40 mt-4"
        >
          {submitting ? "در حال ثبت..." : "ثبت ارزیابی"}
        </button>
      </div>
    </div>
  );
}

export default function PostEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>}>
      <PostEventPageInner />
    </Suspense>
  );
}

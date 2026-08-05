"use client";

import { useEffect, useState } from "react";
import { Brain, ChevronLeft, Star, MapPin, Globe, Heart, CheckCircle2, Zap, X, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

// باگ رفع‌شده: قبلاً دامنه به‌صورت هاردکد (https://raaviiplatform.com) در همه fetch ها
// نوشته شده بود که هم با بقیه صفحات پروژه ناهمخوان بود و هم روی محیط‌های
// dev/staging یا هر دامنه دیگری کار نمی‌کرد. حالا مثل بقیه صفحات از NEXT_PUBLIC_API_URL
// با fallback به دامنه اصلی استفاده می‌شود.
const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const NEEDS_QUESTIONS = [
  {
    id: "main_concern", step: 1,
    question: "در حال حاضر مهم‌ترین دغدغه شما چیست؟",
    type: "single_select",
    options: [
      { value: "anxiety", label: "اضطراب و نگرانی" },
      { value: "depression", label: "افسردگی یا بی‌انگیزگی" },
      { value: "relationship", label: "رابطه عاطفی" },
      { value: "family", label: "خانواده" },
      { value: "marriage", label: "ازدواج یا پیش از ازدواج" },
      { value: "loneliness", label: "تنهایی" },
      { value: "self_esteem", label: "اعتمادبه‌نفس" },
      { value: "procrastination", label: "اهمال‌کاری" },
      { value: "decision", label: "تصمیم‌گیری" },
      { value: "anger", label: "خشم" },
      { value: "grief", label: "سوگ یا فقدان" },
      { value: "work_study", label: "مشکلات شغلی/تحصیلی" },
      { value: "crisis", label: "بحران فعلی" },
      { value: "unknown", label: "نمی‌دانم، فقط احساس خوبی ندارم" },
      { value: "other", label: "سایر موارد" },
    ],
  },
  {
    id: "onset", step: 2,
    question: "این دغدغه از چه زمانی شروع شده؟",
    type: "single_select",
    options: [
      { value: "lt_week", label: "کمتر از یک هفته" },
      { value: "weeks", label: "چند هفته" },
      { value: "months", label: "چند ماه" },
      { value: "gt_6m", label: "بیش از شش ماه" },
      { value: "long_time", label: "مدت طولانی است" },
      { value: "unsure", label: "مطمئن نیستم" },
    ],
  },
  {
    id: "severity", step: 3,
    question: "شدت این مسئله را از ۱ تا ۱۰ چقدر ارزیابی می‌کنید؟",
    type: "scale_1_10",
  },
  {
    id: "impact", step: 4,
    question: "این مسئله چقدر روی زندگی روزمره شما اثر گذاشته؟",
    type: "single_select",
    options: [
      { value: "low", label: "کم" },
      { value: "medium", label: "متوسط" },
      { value: "high", label: "زیاد" },
      { value: "very_high", label: "خیلی زیاد" },
    ],
  },
  {
    id: "help_type", step: 5,
    question: "بیشتر دنبال چه نوع کمکی هستید؟",
    type: "single_select",
    options: [
      { value: "be_heard", label: "فقط می‌خواهم حرف بزنم و شنیده شوم" },
      { value: "understand", label: "می‌خواهم مسئله‌ام را بهتر بفهمم" },
      { value: "practical", label: "دنبال راهکار عملی هستم" },
      { value: "decision_help", label: "می‌خواهم برای یک تصمیم مهم کمک بگیرم" },
      { value: "couples", label: "نیاز به مشاوره رابطه یا ازدواج دارم" },
      { value: "specialized", label: "نیاز به درمان تخصصی‌تر دارم" },
      { value: "unsure", label: "مطمئن نیستم" },
    ],
  },
  {
    id: "gender_preference", step: 6,
    question: "ترجیح شما درباره روانشناس چیست؟",
    type: "single_select",
    options: [
      { value: "female", label: "خانم" },
      { value: "male", label: "آقا" },
      { value: "any", label: "فرقی ندارد" },
    ],
  },
  {
    id: "style_preference", step: 7,
    question: "ترجیح شما درباره سبک جلسه چیست؟",
    type: "single_select",
    options: [
      { value: "supportive", label: "حمایتی و همدلانه" },
      { value: "structured", label: "ساختاریافته و راهکارمحور" },
      { value: "analytical", label: "عمیق و تحلیلی" },
      { value: "educational", label: "آموزشی و مهارت‌محور" },
      { value: "mixed", label: "ترکیبی" },
      { value: "unsure", label: "نمی‌دانم" },
    ],
  },
  {
    id: "session_type", step: 8,
    question: "نوع برگزاری مورد نظر شما چیست؟",
    type: "single_select",
    options: [
      { value: "online", label: "آنلاین" },
      { value: "in_person", label: "حضوری" },
      { value: "both", label: "هر دو" },
    ],
  },
  {
    id: "immediate_risk", step: 9,
    question: "آیا در حال حاضر احساس خطر فوری برای خود یا دیگران دارید؟",
    type: "single_select",
    critical: true,
    options: [
      { value: "no", label: "خیر" },
      { value: "yes", label: "بله" },
      { value: "prefer_not", label: "ترجیح می‌دهم توضیح ندهم" },
    ],
  },
];

type Phase = "assessment" | "crisis" | "list";

export default function HamRavanListPage() {
  const router = useRouter();
  const { user } = useApp();
  const isProfessional = ["psychologist", "facilitator", "admin"].includes(user?.role || "");
  const [phase, setPhase] = useState<Phase>(isProfessional ? "list" : "assessment");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState("");
  const [filterCity, setFilterCity] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);

  const q = NEEDS_QUESTIONS[currentStep];
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // بایپس پرسش‌نامه نیازسنجی برای حساب‌های حرفه‌ای: مستقیم وارد لیست روانشناسان/جلسات می‌شوند
  useEffect(() => {
    if (isProfessional) loadPsychologists(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── نیازسنجی: انتخاب گزینه ─────────────────────────────────
  function handleSelect(value: any) {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    // بحران فوری
    if (q.id === "immediate_risk" && value === "yes") {
      submitAssessment(newAnswers, true);
      return;
    }

    if (currentStep < NEEDS_QUESTIONS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      submitAssessment(newAnswers, false);
    }
  }

  function handleScale(val: number) {
    handleSelect(val);
  }

  async function submitAssessment(ans: Record<string, any>, isCrisis: boolean) {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/hamravan/needs-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: ans }),
      });
      const data = await res.json();
      setSessionId(data.sessionId || null);
      if (isCrisis || data.isCrisis) {
        setPhase("crisis");
      } else {
        await loadPsychologists(data.sessionId);
        setPhase("list");
      }
    } catch {
      await loadPsychologists(null);
      setPhase("list");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadPsychologists(sid: string | null) {
    setLoading(true);
    try {
      const profile: any = await fetch(`${API}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : {});
      if (profile?.city) setUserCity(profile.city);

      const url = sid
        ? `${API}/api/hamravan/psychologists?sessionId=${sid}`
        : `${API}/api/hamravan/psychologists`;
      const data = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { psychologists: [] });

      setPsychologists(data.psychologists || data || []);
    } catch {
      setPsychologists([]);
    } finally {
      setLoading(false);
    }
  }

  // ── فیلتر ──────────────────────────────────────────────────
  const filtered = psychologists.filter(p => {
    if (filterCity && userCity && p.city !== userCity && !p.online_available) return false;
    if (filterOnline && !p.online_available) return false;
    return true;
  });

  // ═══════════════════════════════════════════════════════════
  // فاز ۱: نیازسنجی
  // ═══════════════════════════════════════════════════════════
  if (phase === "assessment") {
    const progress = ((currentStep) / NEEDS_QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1e35] to-[#1B2A4A] flex flex-col" dir="rtl">
        {/* هدر */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-orange-400" />
            <span className="text-white font-black">هم‌روان</span>
          </div>
          <span className="mr-auto text-white/50 text-xs">{currentStep + 1} از {NEEDS_QUESTIONS.length}</span>
        </div>

        {/* نوار پیشرفت */}
        <div className="px-4 mb-6">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 px-4 pb-10">
          {/* سوال */}
          <div className="mb-8">
            {q.critical && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-500/20 text-red-300 text-xs">
                <AlertCircle size={14} />
                این سوال برای ایمنی شما مهم است
              </div>
            )}
            <h2 className="text-xl font-black text-white leading-8">{q.question}</h2>
          </div>

          {/* مقیاس ۱ تا ۱۰ */}
          {q.type === "scale_1_10" && (
            <div className="space-y-4">
              <div className="flex justify-between text-white/50 text-xs px-1">
                <span>خیلی کم</span>
                <span>خیلی زیاد</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => handleScale(n)}
                    className="aspect-square rounded-2xl font-black text-lg transition-all active:scale-95"
                    style={{
                      background: n <= 3 ? "rgba(34,197,94,0.2)" : n <= 6 ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)",
                      color: n <= 3 ? "#4ade80" : n <= 6 ? "#facc15" : "#f87171",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* گزینه‌های انتخابی */}
          {q.type === "single_select" && (
            <div className="space-y-2.5">
              {q.options!.map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value)}
                  className="w-full text-right px-5 py-4 rounded-2xl font-bold text-sm transition-all active:scale-98"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* دکمه قبلی */}
          {currentStep > 0 && !submitting && (
            <button onClick={() => setCurrentStep(s => s - 1)}
              className="mt-6 text-white/40 text-sm flex items-center gap-1">
              <ArrowLeft size={14} /> سوال قبلی
            </button>
          )}

          {submitting && (
            <div className="mt-8 text-center">
              <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/60 text-sm">در حال تحلیل پاسخ‌ها...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // فاز بحران
  // ═══════════════════════════════════════════════════════════
  if (phase === "crisis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-[#1B2A4A] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white/10 backdrop-blur rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-3">می‌فهمیم که الان سخت است</h2>
          <p className="text-white/70 text-sm leading-7 mb-6">
            راوی جای اورژانس نیست، اما می‌توانیم شما را سریع‌تر به روانشناسی با تجربه مدیریت بحران وصل کنیم.
          </p>
          <div className="bg-red-500/20 rounded-2xl p-4 mb-6 text-right">
            <p className="text-red-300 text-sm font-bold mb-1">اگر خطر فوری وجود دارد:</p>
            <p className="text-white/80 text-sm">با اورژانس اجتماعی یا <span className="font-black text-white">۱۲۳</span> تماس بگیرید</p>
          </div>
          <button onClick={async () => {
            await loadPsychologists(sessionId);
            setPhase("list");
          }} className="w-full py-4 rounded-2xl font-black text-white mb-3"
            style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
            مشاهده روانشناسان متخصص بحران
          </button>
          <button onClick={() => router.back()} className="text-white/40 text-sm">بازگشت</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // فاز ۲: لیست روانشناسان
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-28 bg-slate-50" dir="rtl">
      {/* هدر */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPhase("assessment")} className="p-2 rounded-xl hover:bg-slate-100">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-orange-500" />
            <h1 className="text-base font-black">هم‌روان</h1>
          </div>
          <span className="mr-auto text-xs text-slate-400">{filtered.length} روانشناس</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* بنر نتیجه */}
        <div className="mt-5 mb-4 rounded-3xl p-5 bg-gradient-to-r from-[#1B2A4A] to-[#0d1e35] text-white">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-orange-400" />
            <h2 className="font-black">روانشناسان پیشنهادی برای شما</h2>
          </div>
          <p className="text-white/60 text-xs">بر اساس پاسخ‌های شما، مناسب‌ترین گزینه‌ها انتخاب شدند</p>
          <button onClick={() => { setPhase("assessment"); setCurrentStep(0); setAnswers({}); }}
            className="mt-3 text-xs text-orange-400 underline">
            ویرایش پاسخ‌ها
          </button>
        </div>

        {/* فیلترها */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterCity(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filterCity ? "#3b82f6" : "white",
              color: filterCity ? "white" : "#475569",
              border: filterCity ? "none" : "1px solid #e2e8f0",
            }}>
            <MapPin size={12} />
            {userCity ? `شهر من (${userCity})` : "فیلتر شهر"}
            {filterCity && <X size={11} className="mr-1" />}
          </button>

          <button onClick={() => setFilterOnline(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filterOnline ? "#FF6B00" : "white",
              color: filterOnline ? "white" : "#475569",
              border: filterOnline ? "none" : "1px solid #e2e8f0",
            }}>
            <Globe size={12} />
            فقط آنلاین
            {filterOnline && <X size={11} className="mr-1" />}
          </button>

          {(filterCity || filterOnline) && (
            <button onClick={() => { setFilterCity(false); setFilterOnline(false); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100">
              حذف فیلترها
            </button>
          )}
        </div>

        {/* لیست */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">در حال بارگذاری روانشناسان...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-500 font-bold text-sm mb-2">روانشناسی پیدا نشد</p>
            <button onClick={() => { setFilterCity(false); setFilterOnline(false); }}
              className="text-xs text-orange-500 font-bold">حذف فیلترها</button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {filtered.map((p: any) => (
              <Link key={p.psychologist_profile_id || p.user_id}
                href={`/dashboard/my-therapist/ham-ravan/${p.psychologist_profile_id || p.user_id}?sessionId=${sessionId || ""}`}
                className="rounded-3xl bg-white p-5 shadow-sm hover:shadow-xl transition-all border border-slate-100 block">

                {/* match_tags */}
                {p.match_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.match_tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                        ✦ {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                        {(p.full_name || "؟").slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-black truncate">{p.full_name}</h3>
                      <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={11} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-slate-500">{p.rating || "4.5"}</span>
                      {p.available_slots_count > 0 && (
                        <span className="text-[10px] text-green-600 font-bold">• {p.available_slots_count} زمان خالی</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* match_reason */}
                {p.match_reason && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 leading-5">
                    <Zap size={10} className="inline text-orange-500 ml-1" />
                    {p.match_reason}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {p.online_available && <span className="flex items-center gap-1"><Globe size={11} /> آنلاین</span>}
                    {p.city && (
                      <span className="flex items-center gap-1"
                        style={{ color: p.city === userCity ? "#16a34a" : undefined }}>
                        <MapPin size={11} /> {p.city}
                        {p.city === userCity && " ✓"}
                      </span>
                    )}
                    {p.next_available && (
                      <span className="text-green-600">
                        نزدیک‌ترین وقت: {new Date(p.next_available).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    {(p.session_price || 0).toLocaleString()} تومان
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



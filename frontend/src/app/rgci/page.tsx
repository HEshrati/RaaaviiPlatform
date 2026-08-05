"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, CheckCircle, Brain } from "lucide-react";

const QUESTIONS: Record<string, { title: string; questions: string[] }> = {
  dim_psychological_need: {
    title: "نیاز روانشناختی",
    questions: [
      "در حال حاضر بیش از هر چیز به تجربه ارتباطی معنادار با دیگران نیاز دارم.",
      "یکی از نیازهای اصلی من از شرکت در رویداد، احساس تعلق بیشتر است.",
      "برای من مهم است در جمعی قرار بگیرم که بتوانم شنیده و فهمیده شوم.",
      "این روزها به یک فضای امن و کم‌فشار برای ارتباط با دیگران نیاز دارم.",
      "هدف من از حضور در جمع، کمتر احساس‌کردن تنهایی است.",
    ],
  },
  dim_relational_goal: {
    title: "هدف ارتباطی",
    questions: [
      "هدف اصلی من از شرکت در این رویداد، آشنایی با افراد جدید است.",
      "برای من مهم است در این جمع گفتگویی عمیق‌تر از مکالمات روزمره تجربه کنم.",
      "بیشتر به دنبال یک تجربه اجتماعی سبک و کم‌فشار هستم.",
      "می‌خواهم در جمعی قرار بگیرم که امکان شکل‌گیری ارتباط ادامه‌دار وجود داشته باشد.",
      "هدف من از حضور، تجربه همراهی و کمتر احساس‌کردن تنهایی است.",
    ],
  },
  dim_emotional_readiness: {
    title: "آمادگی هیجانی",
    questions: [
      "در حال حاضر از نظر روانی آمادگی شرکت در یک جمع کوچک را دارم.",
      "اگر در این رویداد با افراد جدید صحبت کنم، احتمالاً احساس راحتی نسبی خواهم داشت.",
      "این روزها از نظر هیجانی آن‌قدر خسته نیستم که ارتباط با دیگران برایم دشوار باشد.",
      "در یک جمع جدید معمولاً می‌توانم بعد از مدتی احساس راحتی بیشتری پیدا کنم.",
      "فکر می‌کنم بتوانم در یک گفتگوی گروهی بدون فشار زیاد مشارکت کنم.",
    ],
  },
  dim_interaction_style: {
    title: "سبک تعامل",
    questions: [
      "معمولاً در جمع‌ها از گفتگوهای گروهی لذت می‌برم.",
      "در تعاملات اجتماعی بیشتر شنونده هستم تا گوینده.",
      "ترجیح می‌دهم گفتگوها ساختار مشخصی داشته باشند.",
      "از تعاملات صمیمی و غیررسمی بیشتر از گفتگوهای رسمی لذت می‌برم.",
      "معمولاً در جمع‌ها راحت‌تر با شوخی و فضای سبک ارتباط می‌گیرم.",
    ],
  },
  dim_depth_disclosure: {
    title: "عمق رابطه",
    questions: [
      "در جمع‌های کوچک معمولاً دوست دارم گفتگوها کمی عمیق‌تر شوند.",
      "ترجیح می‌دهم در تعاملات اجتماعی فقط درباره موضوعات سطحی صحبت نکنیم.",
      "در یک جمع جدید راحت هستم اگر گفتگو کمی شخصی‌تر شود.",
      "معمولاً دوست دارم درباره تجربه‌های واقعی زندگی با دیگران صحبت کنم.",
      "از گفتگوهای تأملی و عمیق بیشتر از مکالمات کوتاه و سطحی لذت می‌برم.",
    ],
  },
  dim_shared_experience: {
    title: "تجربه مشترک",
    questions: [
      "موضوع این رویداد به تجربه‌هایی در زندگی من نزدیک است.",
      "برخی از دغدغه‌های فعلی من مربوط به روابط انسانی است.",
      "در حال حاضر درباره مسیر زندگی یا آینده خود زیاد فکر می‌کنم.",
      "مایلم در جمعی باشم که افراد درباره تجربه‌های واقعی زندگی صحبت کنند.",
      "احساس می‌کنم گفتگو درباره تجربه‌های زندگی می‌تواند برایم مفید باشد.",
    ],
  },
  dim_participation: {
    title: "ظرفیت مشارکت",
    questions: [
      "در جمع‌های کوچک معمولاً تمایل دارم در گفتگو مشارکت کنم.",
      "از فعالیت‌های تعاملی در یک جمع لذت می‌برم.",
      "اگر فضای جمع مناسب باشد، معمولاً در گفتگوها مشارکت می‌کنم.",
      "دوست دارم در یک فعالیت گروهی نقش فعالی داشته باشم.",
      "در جمع‌های اجتماعی انرژی نسبتاً خوبی برای مشارکت دارم.",
    ],
  },
  dim_psychological_safety: {
    title: "ایمنی روانی",
    questions: [
      "برای من مهم است در جمعی باشم که افراد با احترام به یکدیگر گوش دهند.",
      "در گفتگوهای گروهی رعایت مرزهای شخصی برایم اهمیت زیادی دارد.",
      "ترجیح می‌دهم در فضایی باشم که قضاوت کمتری وجود داشته باشد.",
      "احساس امنیت روانی در یک جمع برای من بسیار مهم است.",
      "در گفتگوها حساس هستم که افراد یکدیگر را قطع نکنند.",
    ],
  },
  dim_homogeneity_pref: {
    title: "ترجیح همگنی",
    questions: [
      "ترجیح می‌دهم در جمعی باشم که افراد تجربه‌های نسبتاً مشابهی با من دارند.",
      "از گفتگو با افرادی که دیدگاه‌های متفاوت دارند لذت می‌برم.",
      "برای من مهم است افراد گروه از نظر دغدغه‌های زندگی به من نزدیک باشند.",
      "تنوع دیدگاه‌ها در یک جمع می‌تواند برایم جذاب باشد.",
      "اگر افراد گروه خیلی با من متفاوت باشند، ارتباط گرفتن برایم سخت‌تر می‌شود.",
    ],
  },
};

const DIMS = Object.keys(QUESTIONS);
const LABELS = ["کاملاً مخالفم", "مخالفم", "نظری ندارم", "موافقم", "کاملاً موافقم"];

function RgciPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");

  const [dimIndex, setDimIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentDim = DIMS[dimIndex];
  const currentDimData = QUESTIONS[currentDim];
  const totalQuestions = DIMS.length * 5;
  const answeredCount = Object.values(answers).reduce((a, b) => a + b.length, 0);
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  function handleAnswer(value: number) {
    const current = answers[currentDim] || [];
    const updated = [...current];
    updated[qIndex] = value;
    setAnswers({ ...answers, [currentDim]: updated });

    // رفتن به سوال بعدی
    if (qIndex < 4) {
      setQIndex(qIndex + 1);
    } else if (dimIndex < DIMS.length - 1) {
      setDimIndex(dimIndex + 1);
      setQIndex(0);
    } else {
      handleSubmit({ ...answers, [currentDim]: updated });
    }
  }

  async function handleSubmit(finalAnswers: Record<string, number[]>) {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/rgci/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, responses: finalAnswers }),
      });
      const data = await res.json();
      setResult(data);
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else if (dimIndex > 0) { setDimIndex(dimIndex - 1); setQIndex(4); }
  }

  if (done && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">پرسشنامه تکمیل شد!</h2>
          <p className="text-slate-500 mb-6">نمره سازگاری شما محاسبه شد</p>
          <div className="bg-orange-50 rounded-2xl p-6 mb-6">
            <div className="text-4xl font-black text-orange-500 mb-1">
              {result.rgci_total_score ? Number(result.rgci_total_score).toFixed(1) : "—"}
            </div>
            <div className="text-sm text-slate-500">نمره RGCI از ۵</div>
            {result.dominant_psychological_need && (
              <div className="mt-3 text-sm font-bold text-slate-700">
                نیاز غالب: {result.dominant_psychological_need}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push(eventId ? `/events/${eventId}` : "/dashboard")}
            className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-lg"
          >
            ادامه
          </button>
        </div>
      </div>
    );
  }

  const currentAnswer = (answers[currentDim] || [])[qIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white" dir="rtl">
      {/* هدر */}
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-orange-100 px-4 py-3 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-orange-50">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>پرسشنامه سازگاری RGCI</span>
              <span>{progress}٪</span>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* بُعد فعلی */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-xs text-slate-400">بُعد {dimIndex + 1} از {DIMS.length}</div>
            <div className="font-bold text-slate-700">{currentDimData.title}</div>
          </div>
        </div>

        {/* سوال */}
        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 mb-6">
          <div className="text-xs text-slate-400 mb-3">سوال {qIndex + 1} از ۵</div>
          <p className="text-slate-800 font-medium leading-8 text-lg">
            {currentDimData.questions[qIndex]}
          </p>
        </div>

        {/* گزینه‌ها */}
        <div className="space-y-3">
          {LABELS.map((label, i) => {
            const value = i + 1;
            const selected = currentAnswer === value;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(value)}
                className={`w-full py-4 px-6 rounded-2xl border-2 text-right font-medium transition-all ${
                  selected
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-sm opacity-60">{value}</span>
                </div>
              </button>
            );
          })}
        </div>

        {submitting && (
          <div className="text-center mt-8 text-slate-500">در حال محاسبه نمره...</div>
        )}
      </div>
    </div>
  );
}

export default function RgciPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Brain className="w-8 h-8 text-orange-500 animate-pulse"/></div>}>
      <RgciPageInner />
    </Suspense>
  );
}

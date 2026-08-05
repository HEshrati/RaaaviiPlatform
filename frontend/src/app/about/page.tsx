"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useInView, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowLeft,
  Users,
  Brain,
  Shield,
  Sparkles,
  Heart,
  ChevronDown,
  Star,
  Quote,
} from "lucide-react";
import MobileNavbar from "@/components/MobileNavbar";

const PLATFORM_STATS = [
  { value: "۱۰,۰۰۰", suffix: "+", label: "کاربر فعال" },
  { value: "۵۰۰", suffix: "+", label: "رویداد برگزار شده" },
  { value: "۹۲", suffix: "٪", label: "رضایت کاربران" },
  { value: "۱۵", suffix: "+", label: "شهر ایران" },
];

const values = [
  {
    icon: Brain,
    title: "علم روان‌شناسی",
    desc: "تمام الگوریتم‌های ما بر پایه تحقیقات روان‌شناسی معتبر جهانی طراحی شده‌اند",
    color: "#FF6B00",
  },
  {
    icon: Shield,
    title: "امنیت و حریم خصوصی",
    desc: "داده‌های شما با بالاترین استانداردهای امنیتی محافظت می‌شوند",
    color: "#8b5cf6",
  },
  {
    icon: Heart,
    title: "روابط معنادار",
    desc: "هدف ما اتصال آدم‌هاست، نه فقط آشنایی سطحی",
    color: "#ec4899",
  },
  {
    icon: Users,
    title: "جامعه‌سازی",
    desc: "ساخت جوامع کوچک و صمیمی از افراد هم‌فکر در سراسر ایران",
    color: "#22c55e",
  },
];

const steps = [
  {
    num: "۰۱",
    title: "تست شخصیت",
    desc: "با تست‌های علمی، شخصیت واقعی خودت رو کشف کن",
    icon: "🧠",
  },
  {
    num: "۰۲",
    title: "پروفایل هوشمند",
    desc: "هوش مصنوعی ما بهترین تطابق رو برات پیدا می‌کنه",
    icon: "✨",
  },
  {
    num: "۰۳",
    title: "رویداد مناسب",
    desc: "در رویدادهایی شرکت کن که واقعاً برات طراحی شدن",
    icon: "🎯",
  },
  {
    num: "۰۴",
    title: "ارتباط عمیق",
    desc: "با افرادی آشنا شو که واقعاً با روحیه‌ات هماهنگ‌ان",
    icon: "🤝",
  },
];

const testimonials = [
  {
    text: "راوی کمکم کرد آدم‌هایی پیدا کنم که واقعاً باهاشون حرف مشترک داشتم. نه تعارف، نه ظاهر.",
    name: "نیلوفر ر.",
    city: "تهران",
    mbti: "INFJ",
  },
  {
    text: "بعد از اولین همنشینی فهمیدم چقدر وقت تو آشنایی‌های اشتباه تلف کرده بودم.",
    name: "امیر ک.",
    city: "اصفهان",
    mbti: "ENTP",
  },
  {
    text: "تیپ شخصیتیم رو بهتر شناختم. حالا می‌دونم دنبال چه نوع ارتباطی هستم.",
    name: "مهسا ب.",
    city: "شیراز",
    mbti: "ISFP",
  },
];

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface UserStat {
  value: string;
  suffix: string;
  label: string;
}

export default function AboutPage() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStat[]>([
    { value: "۰", suffix: " از ۵", label: "تست اصلی انجام شده" },
    { value: "۰", suffix: "٪", label: "تکمیل پروفایل" },
    { value: "۰", suffix: "٪", label: "پیشرفت شخصیت‌شناسی" },
    { value: "۰", suffix: "", label: "رویداد شرکت شده" },
  ]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileScores, setProfileScores] = useState({ personality: 0, emotional: 0, communication: 0, matchCount: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const u = scrollY.on("change", (v) => setScrolled(v > 40));
    return u;
  }, [scrollY]);

  useEffect(() => {
    const t = setInterval(
      () => setActiveTestimonial((p) => (p + 1) % testimonials.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ||
          document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1] ||
          ""
        : "";
    if (!token) return;
    setIsLoggedIn(true);

    const CORE = [
      "neo_ffi",
      "ecr_r",
      "erq",
      "iri",
      "gottman",
      "pid5",
      "raavi_matching_basis_v1",
      "mbti",
      "big5",
      "hexaco",
    ];

    const fetchTests = fetch("https://raaviiplatform.com/api/test-results/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        const results = (d as any)?.results || (d as any)?.data || [];
        const done = results.map((r: any) => r.test_name);
        return CORE.filter((t: string) => done.includes(t)).length;
      })
      .catch(() => 0);

    const fetchProfile = fetch("https://raaviiplatform.com/api/profiles/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        return Number(
          (d as any)?.completionPercentage ||
            (d as any)?.profile_completion_percentage ||
            0,
        );
      })
      .catch(() => 0);

    const fetchEvents = fetch("https://raaviiplatform.com/api/bookings/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        const bookings = (d as any)?.bookings || (d as any)?.data || [];
        return Array.isArray(bookings) ? bookings.length : 0;
      })
      .catch(() => 0);

    const fetchScores = fetch("https://raaviiplatform.com/api/profiles/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d: any) => ({
          completionPercentage: d?.completionPercentage || 0,
        }))
        .catch(() => ({ completionPercentage: 0 }));

      Promise.all([fetchTests, fetchProfile, fetchEvents, fetchScores]).then(
      ([tests, profile, events, scores]) => {
        const toFarsi = (n: number) =>
          n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
        const t = tests as number;
        const cp = (scores as any)?.completionPercentage || 0;
        setProfileScores({
          personality: Math.min(100, Math.round(t * 18 + cp * 0.3)),
          emotional:   Math.min(100, Math.round(cp * 0.5 + t * 12)),
          communication: Math.min(100, Math.round(cp * 0.6 + t * 10)),
          matchCount: 0,
        });
          setUserStats([
          {
            value: toFarsi(tests),
            suffix: " از ۵",
            label: "تست اصلی انجام شده",
          },
          { value: toFarsi(profile), suffix: "٪", label: "تکمیل پروفایل" },
          {
            value: toFarsi(Math.min(tests * 20, 100)),
            suffix: "٪",
            label: "پیشرفت شخصیت‌شناسی",
          },
          { value: toFarsi(events), suffix: "", label: "رویداد شرکت شده" },
        ]);
      },
    );
  }, []);

  function handleTestClick() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login?redirect=/dashboard/tests/raavi_matching_basis_v1");
      return;
    }
    fetch("https://raaviiplatform.com/api/test-results/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        const done = ((d as any)?.results || (d as any)?.data || []).map(
          (r: any) => r.test_name,
        );
        const hasMandatory = done.some(
          (t: string) => t.includes("matching_basis") || t === "mbti",
        );
        router.push(
          hasMandatory
            ? "/dashboard/tests/neo_ffi"
            : "/dashboard/tests/raavi_matching_basis_v1",
        );
      })
      .catch(() => router.push("/dashboard/tests/raavi_matching_basis_v1"));
  }

  const statsToShow = isLoggedIn ? userStats : PLATFORM_STATS;

  return (
    <div
      dir="rtl"
      className="bg-[#080808] text-[#f0ede8] overflow-x-hidden min-h-screen"
      style={{ fontFamily: "'Vazirmatn', sans-serif" }}
    >
      <MobileNavbar />

      {/* noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-5 pt-20 pb-20 md:pt-24 md:pb-28 text-center overflow-hidden">
        <motion.div
          className="absolute top-[15%] left-[5%] md:left-[10%] w-[280px] h-[280px] md:w-[500px] md:h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] md:right-[8%] w-[220px] h-[220px] md:w-[400px] md:h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-[13px] font-bold text-[#FF6B00]"
            style={{
              background: "rgba(255,107,0,0.1)",
              border: "1px solid rgba(255,107,0,0.2)",
            }}
          >
            <Sparkles size={12} /> داستان ما
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[38px] sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.2] mb-6 tracking-tight"
          >
            آشنایی نباید{" "}
            <span className="relative inline-block">
              <span
                style={{
                  background: "linear-gradient(135deg,#FF6B00,#f97316,#fbbf24)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                تصادفی
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
                style={{
                  background: "linear-gradient(90deg,#FF6B00,#f97316)",
                  transformOrigin: "right",
                }}
              />
            </span>{" "}
            باشد
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-sm sm:text-base md:text-lg text-[rgba(240,237,232,0.55)] leading-[2] max-w-xl mx-auto mb-10 px-2"
          >
            راوی متولد شد از این باور که هر آدمی جایش کنار آدم‌هایی است که
            واقعاً با روحش هماهنگ‌اند. ما با علم روان‌شناسی و هوش مصنوعی این
            مسیر رو هموار می‌کنیم.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4 sm:px-0"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleTestClick}
              className="w-full sm:w-auto text-white font-black text-sm sm:text-base px-8 py-4 rounded-full border-none cursor-pointer"
              style={{
                background: "linear-gradient(135deg,#FF6B00,#f97316)",
                boxShadow: "0 16px 40px rgba(255,107,0,0.35)",
              }}
            >
              تست رایگان شخصیت
            </motion.button>
            <Link
              href="/events"
              className="w-full sm:w-auto text-[#f0ede8] font-bold text-sm sm:text-base px-8 py-4 rounded-full no-underline flex items-center justify-center"
              style={{
                border: "1px solid rgba(240,237,232,0.15)",
                background: "rgba(240,237,232,0.04)",
                backdropFilter: "blur(8px)",
              }}
            >
              مشاهده رویدادها
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <ChevronDown size={20} color="rgba(240,237,232,0.25)" />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-14 md:py-20 px-5 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,107,0,0.03) 50%, transparent)",
          }}
        />
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {statsToShow.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08}>
              <div
                  className={`text-center py-8 px-3 md:px-5 border-white/[0.06] ${
                    i % 2 !== 0 ? "border-s" : ""
                  } ${i >= 2 ? "border-t" : ""} md:border-t-0 ${
                    i > 0 ? "md:border-s" : "md:border-s-0"
                  }`}
                >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.08,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="text-3xl sm:text-4xl md:text-5xl font-black leading-none mb-2"
                  style={{
                    background: "linear-gradient(135deg,#FF6B00,#f97316)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                  <span className="text-[0.55em]">{s.suffix}</span>
                </motion.div>
                <div className="text-[11px] md:text-xs text-[rgba(240,237,232,0.4)] font-semibold">
                  {s.label}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="py-14 md:py-24 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
          <FadeUp>
            <div>
              <span className="text-[11px] font-black text-[#FF6B00] tracking-[4px] uppercase">
                چرا راوی؟
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-snug mt-4 mb-5 tracking-tight">
                وقتی الگوریتم با
                <br />
                <span className="text-[#FF6B00]">احساس</span> ترکیب می‌شود
              </h2>
              <p className="text-sm md:text-[15px] text-[rgba(240,237,232,0.55)] leading-[2.1] mb-4">
                در دنیایی که شبکه‌های اجتماعی پر از آشنایی‌های سطحی‌اند، ما
                معتقدیم آشنایی واقعی نیاز به عمق دارد.
              </p>
              <p className="text-sm md:text-[15px] text-[rgba(240,237,232,0.55)] leading-[2.1] mb-8">
                راوی با ترکیب تست‌های شخصیت‌شناسی علمی و هوش مصنوعی، افرادی را
                پیدا می‌کند که نه فقط سلیقه‌شان بلکه ارزش‌ها و روحیه‌شان با شما
                همخوانی دارد.
              </p>
              <button
                onClick={handleTestClick}
                className="inline-flex items-center gap-2 text-[#FF6B00] bg-transparent border-none cursor-pointer font-bold text-sm"
              >
                شروع کن <ArrowLeft size={16} />
              </button>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-6 md:p-10 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,107,0,0.06), rgba(139,92,246,0.06))",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,107,0,0.15), transparent)",
                }}
              />
              {[
                { label: "تطابق شخصیتی", val: isLoggedIn ? Math.max(profileScores.personality, 10) : 94, color: "#FF6B00" },
                { label: "هوش هیجانی", val: isLoggedIn ? Math.max(profileScores.emotional, 10) : 87, color: "#8b5cf6" },
                { label: "سبک ارتباطی", val: isLoggedIn ? Math.max(profileScores.communication, 10) : 91, color: "#22c55e" },
              ].map((item, i) => (
                <div key={item.label} className="mb-6">
                  <div className="flex justify-between mb-2 text-xs sm:text-sm font-semibold">
                    <span className="text-[rgba(240,237,232,0.6)]">
                      {item.label}
                    </span>
                    <span className="font-black" style={{ color: item.color }}>
                      {item.val}٪
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.15 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              ))}
              <motion.button
                onClick={() => router.push("/events?recommended=1")}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                animate={{
                  boxShadow: [
                    "0 0 0 rgba(255,107,0,0)",
                    "0 0 20px rgba(255,107,0,0.2)",
                    "0 0 0 rgba(255,107,0,0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mt-4 p-4 rounded-2xl flex items-center gap-3 w-full border-none cursor-pointer text-right"
                style={{
                  background: "rgba(255,107,0,0.1)",
                  border: "1px solid rgba(255,107,0,0.2)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#FF6B00,#f97316)",
                    boxShadow: "0 6px 20px rgba(255,107,0,0.4)",
                  }}
                >
                  <Sparkles size={16} color="white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-black text-[#f0ede8]">
                    رویدادهای پیشنهادی برای تو
                  </div>
                  <div className="text-[10px] sm:text-xs text-[rgba(240,237,232,0.45)] mt-0.5">
                    بر اساس پروفایل شخصیتی‌ات
                  </div>
                </div>
                <ArrowLeft size={14} color="rgba(255,107,0,0.7)" className="flex-shrink-0" />
              </motion.button>
            </motion.div>
          </FadeUp>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="py-14 md:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.015)" }}
      >
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-[11px] font-black text-[#FF6B00] tracking-[4px] uppercase">
                چطور کار می‌کنه؟
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-4 tracking-tight">
                چهار قدم تا ارتباط واقعی
              </h2>
            </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 relative">
            <div
              className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px hidden md:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,107,0,0.3), rgba(255,107,0,0.3), transparent)",
              }}
            />
            {steps.map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl text-center relative z-10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(8,8,8,0.8)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="text-2xl md:text-4xl mb-2 md:mb-3">
                    {s.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black mb-1.5 text-[#f0ede8]">
                    {s.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[rgba(240,237,232,0.45)] leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-14 md:py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-[11px] font-black text-[#FF6B00] tracking-[4px] uppercase">
                ارزش‌های ما
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-4 tracking-tight">
                چیزهایی که برامون مهمه
              </h2>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
            {values.map((v, i) => (
              <FadeUp key={v.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="p-5 md:p-8 rounded-2xl md:rounded-3xl flex gap-4 items-start relative overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${v.color}10, transparent)`,
                    }}
                  />
                  <div
                    className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${v.color}15`,
                      border: `1px solid ${v.color}25`,
                    }}
                  >
                    <v.icon size={20} color={v.color} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black mb-1.5 text-[#f0ede8]">
                      {v.title}
                    </h3>
                    <p className="text-[11px] md:text-[13px] text-[rgba(240,237,232,0.5)] leading-[1.9]">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        className="py-14 md:py-24 px-5 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.015)" }}
      >
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="text-center mb-10 md:mb-14">
              <span className="text-[11px] font-black text-[#FF6B00] tracking-[4px] uppercase">
                تجربه کاربران
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-4 tracking-tight">
                آدم‌های واقعی، ارتباط‌های واقعی
              </h2>
            </div>
          </FadeUp>
          <div className="relative min-h-[260px] sm:min-h-[210px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.45 }}
                className="rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Quote size={22} color="rgba(255,107,0,0.3)" className="mb-4" />
                <p className="text-sm sm:text-base md:text-[17px] leading-[2] text-[rgba(240,237,232,0.8)] mb-6">
                  {testimonials[activeTestimonial].text}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-[#f0ede8] flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(255,107,0,0.3),rgba(139,92,246,0.3))",
                    }}
                  >
                    {testimonials[activeTestimonial].name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#f0ede8]">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-xs text-[rgba(240,237,232,0.4)] mt-0.5">
                      {testimonials[activeTestimonial].city} ·{" "}
                      {testimonials[activeTestimonial].mbti}
                    </div>
                  </div>
                  <div className="ms-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} color="#FF6B00" fill="#FF6B00" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-2 justify-center mt-5">
            {testimonials.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                animate={{
                  width: i === activeTestimonial ? 28 : 8,
                  background:
                    i === activeTestimonial
                      ? "#FF6B00"
                      : "rgba(255,255,255,0.2)",
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full border-none cursor-pointer p-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-14 md:py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-[11px] font-black text-[#FF6B00] tracking-[4px] uppercase">
                تیم راوی
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-4 tracking-tight">
                کسانی که راوی رو می‌سازن
              </h2>
              <p className="text-sm text-[rgba(240,237,232,0.45)] leading-relaxed max-w-xs mx-auto mt-3">
                تیمی از روان‌شناسان، توسعه‌دهندگان و متخصصان هوش مصنوعی
              </p>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto">
            {[
              {
                initials: "ح.ع",
                name: "حانیه عشرتی",
                role: "برنامه نویس و توسعه دهنده",
                color: "#FF6B00",
              },
              {
                initials: "ح.پ",
                name: "حنانه پورجانی",
                role: "امور مالی",
                color: "#8b5cf6",
              },
              {
                initials: "ا.پ",
                name: "امیرحسین پورجانی",
                role: "مدیر",
                color: "#22c55e",
              },
            ].map((m, i) => (
              <FadeUp key={m.name} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="p-5 md:p-7 rounded-2xl md:rounded-3xl text-center relative overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${m.color}12, transparent)`,
                    }}
                  />
                  <div
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-black"
                    style={{
                      background: `linear-gradient(135deg,${m.color}25,${m.color}10)`,
                      border: `1.5px solid ${m.color}30`,
                      color: m.color,
                    }}
                  >
                    {m.initials}
                  </div>
                  <div className="text-sm font-black text-[#f0ede8] mb-1">
                    {m.name}
                  </div>
                  <div className="text-[10px] md:text-xs text-[rgba(240,237,232,0.35)]">
                    {m.role}
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20 px-5 pb-24 md:pb-36">
        <FadeUp>
          <div
            className="max-w-3xl mx-auto text-center rounded-3xl md:rounded-[40px] p-8 sm:p-12 md:p-16 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(139,92,246,0.06))",
              border: "1px solid rgba(255,107,0,0.15)",
            }}
          >
            <motion.div
              className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,107,0,0.12), transparent)",
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-4xl md:text-5xl mb-5 inline-block"
              >
                🧭
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 tracking-tight leading-snug">
                آماده‌ای آدم‌های واقعی‌ات
                <br />
                رو پیدا کنی؟
              </h2>
              <p className="text-sm text-[rgba(240,237,232,0.55)] leading-relaxed max-w-xs mx-auto mb-8">
                تست شخصیت رایگان راوی رو شروع کن. فقط ۵ دقیقه وقت می‌بره.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTestClick}
                className="inline-flex items-center gap-3 text-white font-black text-sm sm:text-base md:text-lg px-8 md:px-10 py-4 md:py-5 rounded-full border-none cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,#FF6B00,#f97316)",
                  boxShadow: "0 20px 48px rgba(255,107,0,0.4)",
                }}
              >
                شروع تست رایگان <Sparkles size={18} />
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer
        className="bg-[#040404] pt-12 md:pt-16 pb-10 px-5 md:px-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-16 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#FF6B00,#f97316)",
                  }}
                >
                  <Zap size={16} color="white" fill="white" />
                </div>
                <span className="text-lg font-black text-[#f0ede8]">راوی</span>
              </div>
              <p className="text-xs text-[rgba(240,237,232,0.3)] leading-loose max-w-[240px]">
                پلتفرم هوشمند آشنایی و رویداد‌سازی بر اساس تست‌های روان‌شناسی و
                هوش مصنوعی
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[rgba(240,237,232,0.6)] mb-4">
                لینک‌ها
              </h4>
              {[
                ["خانه", "/"],
                ["رویدادها", "/events"],
                ["تست شخصیت", "/dashboard/tests"],
                ["درباره ما", "/about"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-xs text-[rgba(240,237,232,0.3)] hover:text-[#FF6B00] no-underline mb-3 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[rgba(240,237,232,0.6)] mb-4">
                تماس
              </h4>
              <p className="text-xs text-[rgba(240,237,232,0.3)] leading-loose">
                info@raavi.ir
                <br />
                تهران، ایران
              </p>
            </div>
          </div>
          <div
            className="pt-6 text-center text-[10px] text-[rgba(240,237,232,0.2)]"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            © ۱۴۰۴ راوی — تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}

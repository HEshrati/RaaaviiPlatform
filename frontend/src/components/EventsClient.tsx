"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Gamepad2,
  MessageCircle,
  Lightbulb,
  Briefcase,
  Handshake,
  Compass,
  GraduationCap,
  BookOpen,
  HeartPulse,
  Cpu,
  MapPin,
  CalendarDays,
  ChevronLeft,
  Zap,
  Lock,
} from "lucide-react";
import { getEventImage } from "@/lib/eventImage";

const ENTERTAINMENT_CATS = [
  {
    key: "hamneshin",
    label: "همنشین",
    icon: Users,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.35)",
  },
  {
    key: "hambazi",
    label: "هم‌بازی",
    icon: Gamepad2,
    color: "#10b981",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    key: "hamsohbat",
    label: "هم‌صحبت",
    icon: MessageCircle,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
  },
  {
    key: "hamfekr",
    label: "هم‌فکر",
    icon: Lightbulb,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    key: "hamkar",
    label: "همکار",
    icon: Briefcase,
    color: "#ec4899",
    glow: "rgba(236,72,153,0.35)",
  },
  {
    key: "hamteymi",
    label: "هم‌تیمی",
    icon: Handshake,
    color: "#14b8a6",
    glow: "rgba(20,184,166,0.35)",
  },
  {
    key: "hampa",
    label: "هم‌پا",
    icon: Compass,
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.35)",
  },
  {
    key: "hamamooz",
    label: "هم‌آموز",
    icon: GraduationCap,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.35)",
  },
  {
    key: "hamghesse",
    label: "هم‌قصه",
    icon: BookOpen,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
  },
];

// ✅ هم‌زیسته → /dashboard/my-therapist/ham-ziste
// ✅ هم‌روان → قفل تا ۵ تست، بعد → /dashboard/my-therapist
const PSYCHOLOGY_CATS = [
  {
    key: "hamziste",
    label: "هم‌زیسته",
    icon: HeartPulse,
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.35)",
    href: "/dashboard/my-therapist/ham-ziste",
  },
  {
    key: "hamrovan",
    label: "هم‌روان",
    icon: Cpu,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.35)",
    href: "/dashboard/my-therapist/ham-ravan",
  },
];

const CORE_TESTS = [
  "raavi_matching_basis_v1",
  "neo_ffi",
  "ecr_r",
  "erq",
  "iri",
];
const SITE = "https://raaviiplatform.com";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.82 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 22 },
  },
};

function CategoryCard({
  cat,
  index,
  locked,
  href,
}: {
  cat: (typeof ENTERTAINMENT_CATS)[0];
  index: number;
  locked?: boolean;
  href?: string;
}) {
  const Icon = cat.icon;
  const targetHref = href || `/events/category/${cat.key}`;

  const cardContent = (
    <motion.div
      variants={cardVariants}
      className="flex flex-col items-center gap-2.5"
    >
      <div className="group flex flex-col items-center gap-2.5 relative">
        <motion.div
          whileHover={!locked ? { y: -7, scale: 1.12, rotate: -3 } : {}}
          whileTap={!locked ? { scale: 0.88, rotate: 0 } : {}}
          transition={{ type: "spring", stiffness: 340, damping: 18 }}
          className="relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
          style={{
            background: locked
              ? `linear-gradient(145deg, #94a3b8, #64748b)`
              : `linear-gradient(145deg, ${cat.color}ee, ${cat.color}bb)`,
            boxShadow: locked
              ? `6px 8px 20px rgba(100,116,139,0.25), -3px -3px 8px rgba(255,255,255,0.85)`
              : `6px 8px 20px ${cat.glow}, -3px -3px 8px rgba(255,255,255,0.85), inset 2px 2px 5px rgba(255,255,255,0.45), inset -2px -2px 5px rgba(0,0,0,0.12)`,
          }}
        >
          {locked ? (
            <Lock size={28} className="text-white/70 relative z-10" />
          ) : (
            <Icon
              size={30}
              className="text-white relative z-10 drop-shadow-[0_3px_5px_rgba(0,0,0,0.28)]"
            />
          )}
        </motion.div>
        <span
          className={`text-[12px] font-black transition-colors tracking-tight ${locked ? "text-slate-400" : "text-slate-600 group-hover:text-slate-900"}`}
        >
          {cat.label}
        </span>
      </div>
    </motion.div>
  );

  if (locked) {
    return <div className="cursor-not-allowed opacity-75">{cardContent}</div>;
  }

  return (
    <Link href={targetHref} className="group">
      {cardContent}
    </Link>
  );
}

function EventCard({ ev, index }: { ev: any; index: number }) {
  const cat = (ev.category || ev.event_type || "").toLowerCase();
  const colorMap: Record<string, string> = {
    hamneshin: "#6366f1",
    hambazi: "#10b981",
    hamsohbat: "#f59e0b",
    hamfekr: "#8b5cf6",
    hamkar: "#ec4899",
    hamteymi: "#14b8a6",
    hampa: "#f43f5e",
    hamamooz: "#3b82f6",
    hamghesse: "#ef4444",
    hamziste: "#f43f5e",
    hamrovan: "#3b82f6",
  };
  const color = colorMap[cat] || "#FF6B00";
  const price = ev.price
    ? Number(ev.price).toLocaleString("fa-IR") + " ت"
    : "رایگان";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.11)" }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Link
        href={`/events/${ev.id}`}
        className="block bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm group"
      >
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />
        <div className="relative w-full h-40 overflow-hidden bg-slate-100">
          <img
            src={getEventImage(ev, index)}
            alt={ev.title || "رویداد"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 100%)",
            }}
          />
          <span
            className="absolute bottom-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: color, color: "white" }}
          >
            {cat || "رویداد"}
          </span>
          <div
            className="absolute top-2 left-2 px-2.5 py-1.5 rounded-xl text-[11px] font-black text-white"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            }}
          >
            {price}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-black text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
            {ev.title || "رویداد پیش‌رو"}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {ev.start_date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={10} />
                {new Date(ev.start_date).toLocaleDateString("fa-IR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {ev.city && (
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {ev.city}
              </span>
            )}
            <ChevronLeft size={13} className="mr-auto text-slate-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const TABS = [
  { key: "entertainment", label: "سرگرمی" },
  { key: "psychology", label: "روانشناسی" },
  { key: "nearEvents", label: "رویدادهای نزدیک" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function EventsClient({ events = [] }: { events?: any[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("entertainment");
  const [coreTestsDone, setCoreTestsDone] = useState(0);
  const [nearEvents, setNearEvents] = useState<any[]>([]);
  const [nearLoading, setNearLoading] = useState(false);
  const [userCity, setUserCity] = useState<string>("");
  const [userNeighborhood, setUserNeighborhood] = useState<string>("");
  const router = useRouter();

  const fetchTestResults = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${SITE}/api/test-results/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : ({} as any)))
      .then((d) => {
        const results = d?.results || d?.data || [];
        const done = new Set(results.map((r: any) => r.test_name));
        const count = CORE_TESTS.filter((id) => done.has(id)).length;
        setCoreTestsDone(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTestResults();
  }, [fetchTestResults]);

  useEffect(() => {
    try {
      const ch = new BroadcastChannel("raavi_test_done");
      ch.onmessage = () => {
        setTimeout(() => fetchTestResults(), 2000);
      };
      return () => ch.close();
    } catch {}
  }, [fetchTestResults]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchTestResults();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchTestResults]);

  useEffect(() => {
    const handler = () => fetchTestResults();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [fetchTestResults]);

  useEffect(() => {
    if (activeTab !== "nearEvents") return;
    const token = localStorage.getItem("token");
    if (!token) { setNearEvents(events); return; }
    setNearLoading(true);
    Promise.all([
      fetch(`${SITE}/api/events?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${SITE}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([evData, profile]) => {
        setNearEvents(evData?.events || events);
        setUserCity(profile?.city || profile?.data?.city || "");
        setUserNeighborhood(profile?.neighborhood || profile?.data?.neighborhood || "");
      })
      .catch(() => setNearEvents(events))
      .finally(() => setNearLoading(false));
  }, [activeTab, events]);

  const isHamrovanLocked = coreTestsDone < 5;

  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 pt-8 pb-28 min-h-screen"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black mb-3"
          style={{
            background: "rgba(255,107,0,0.1)",
            color: "#FF6B00",
            border: "1px solid rgba(255,107,0,0.2)",
          }}
        >
          <Zap size={10} /> پلتفرم رویداد راوی
        </motion.div>
        <h1 className="text-2xl font-black text-slate-800 mb-1">
          لیست رویدادهای راوی
        </h1>
        <p className="text-slate-400 text-sm">
          دسته‌بندی مورد نظر خود را انتخاب کنید
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="flex gap-1.5 mb-8 bg-slate-100/80 p-1.5 rounded-2xl"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative flex-1 px-3 py-2.5 rounded-xl text-[12px] font-black transition-colors duration-200"
            style={{ color: activeTab === tab.key ? "#0f172a" : "#94a3b8" }}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl bg-white"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "entertainment" && (
          <motion.div
            key="ent"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-3xl border border-slate-100 p-6"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-orange-400 to-orange-200 mb-6 mr-auto" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6 justify-items-center">
              {ENTERTAINMENT_CATS.map((cat, i) => (
                <CategoryCard key={cat.key} cat={cat} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "psychology" && (
          <motion.div
            key="psy"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div
              className="bg-white rounded-3xl border border-slate-100 p-8"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-pink-300 mb-8" />
              <div className="grid grid-cols-2 gap-10 justify-items-center w-full max-w-[280px] mx-auto">
                {PSYCHOLOGY_CATS.map((cat, i) => (
                  <CategoryCard
                    key={cat.key}
                    cat={cat}
                    index={i}
                    locked={("locked" in cat && Boolean(cat.locked)) && isHamrovanLocked}
                    href={cat.href}
                  />
                ))}
              </div>
            </div>

            {/* کارت قفل هم‌روان */}
            {isHamrovanLocked && (
              <motion.div
                variants={cardVariants}
                className="bg-white rounded-2xl border border-orange-100 p-5"
                style={{ boxShadow: "0 4px 16px rgba(255,107,0,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,107,0,0.1)" }}
                  >
                    <Lock size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      هم‌روان قفل است
                    </h3>
                    <p className="text-slate-500 text-xs">
                      برای دسترسی به روانشناس راوی، ابتدا ۵ تست اصلی را تکمیل
                      کنید
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-center mb-2">
                  {CORE_TESTS.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-2 rounded-full transition-all duration-500"
                      style={{
                        background:
                          i < coreTestsDone
                            ? "linear-gradient(90deg,#FF6B00,#f97316)"
                            : "rgba(0,0,0,0.08)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  {coreTestsDone} از ۵ تست اصلی تکمیل شده
                </p>
                {coreTestsDone < 5 && (
                  <Link
                    href="/dashboard/tests"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
                    style={{
                      background: "linear-gradient(135deg,#FF6B00,#f97316)",
                    }}
                  >
                    <Cpu size={14} /> تکمیل تست‌ها
                  </Link>
                )}
              </motion.div>
            )}

            {/* کارت باز شدن هم‌روان */}
            {!isHamrovanLocked && (
              <motion.div
                variants={cardVariants}
                className="bg-white rounded-2xl border border-green-100 p-5"
                style={{ boxShadow: "0 4px 16px rgba(34,197,94,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
                    <HeartPulse size={18} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      هم‌روان باز شد! 🎉
                    </h3>
                    <p className="text-slate-500 text-xs">
                      پروفایل روانشناختی شما آماده است — الان میتونی با روانشناس
                      صحبت کنی
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/my-therapist/ham-ravan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
                  style={{
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                  }}
                >
                  <HeartPulse size={14} /> ورود به هم‌روان
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === "nearEvents" && (
          <motion.div
            key="near"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3"
          >
            {/* نشانگر فیلتر شهر */}
            {userCity && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <MapPin size={12} className="text-orange-500" />
                <p className="text-xs text-slate-500 font-bold">
                  رویدادهای نزدیک به{" "}
                  <span className="text-orange-500">
                    {userNeighborhood ? `${userNeighborhood}، ` : ""}{userCity}
                  </span>
                </p>
              </div>
            )}
            {nearLoading ? (
              <motion.div variants={cardVariants} className="text-center py-20">
                <p className="text-4xl mb-3 animate-pulse">📍</p>
                <p className="text-slate-400 font-bold text-sm">در حال جستجو...</p>
              </motion.div>
            ) : nearEvents.length > 0 ? (
              nearEvents.map((ev, i) => (
                <EventCard key={ev.id || i} ev={ev} index={i} />
              ))
            ) : (
              <motion.div
                variants={cardVariants}
                className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200"
              >
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-slate-400 font-bold text-sm">
                  رویدادی یافت نشد
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

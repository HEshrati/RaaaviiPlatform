"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Award, Bell, Brain, Calendar, CheckCircle2, ChevronDown,
  ChevronLeft, Clock, Compass, FlaskConical, Heart, Home,
  Lock, MapPin, Shield, Sparkles, Star, Target,
  UserRound, Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  ApiEvent, Booking, fetchEventById, fetchEventLocation, fetchMyBookings,
  isAdminPhone,
} from "@/lib/api";
import { getTestProfileScore } from "@/lib/test-result-scoring";
import BaleConnect from "@/components/BaleConnect";
import SuspendedBanner from "@/components/SuspendedBanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CORE_TESTS = ["raavi_matching_basis_v1", "neo_ffi", "ecr_r", "erq", "iri", "gottman"];

type BookingWithEvent = Booking & {
  eventData?: ApiEvent;
  locationInfo?: { location: string | null; revealed: boolean; minutesRemaining: number };
};

type TestResult = {
  id?: string;
  test_name: string;
  main_result?: string;
  scores?: Record<string, unknown> | string;
  completed_at?: string;
};

type SmartProfile = {
  profileCompleteness?: number;
  totalTestsDone?: number;
  smartScore?: number;
  mentalHealthScore?: number;
  relationshipReadiness?: number;
  mbti?: string;
  attachmentStyle?: string;
  is_suspended?: boolean;
  no_show_count?: number;
  neo?: { E?: number; A?: number; C?: number; N?: number; O?: number } | null;
};

const TEST_META: Record<string, { name: string; short: string; color: string; icon: typeof Brain }> = {
  raavi_matching_basis_v1: { name: "تیپ شخصیتی MBTI", short: "MBTI", color: "#3b82f6", icon: Brain },
  mbti: { name: "تیپ شخصیتی MBTI", short: "MBTI", color: "#3b82f6", icon: Brain },
  neo_ffi: { name: "پنج عامل شخصیت NEO", short: "NEO", color: "#f59e0b", icon: Star },
  ecr_r: { name: "سبک دلبستگی ECR-R", short: "ECR-R", color: "#a855f7", icon: Heart },
  erq: { name: "تنظیم هیجان ERQ", short: "ERQ", color: "#f97316", icon: Activity },
  iri: { name: "شاخص همدلی IRI", short: "IRI", color: "#ec4899", icon: Heart },
  gottman: { name: "سازگاری رابطه گاتمن", short: "Gottman", color: "#22c55e", icon: Target },
  hexaco: { name: "شخصیت HEXACO", short: "HEXACO", color: "#6366f1", icon: UserRound },
  love_languages: { name: "زبان‌های عشق", short: "Love", color: "#ec4899", icon: Heart },
  conflict_style: { name: "سبک حل تعارض", short: "Conflict", color: "#eab308", icon: Zap },
  phq9: { name: "سلامت روان PHQ-9", short: "PHQ-9", color: "#ef4444", icon: Activity },
  gad7: { name: "غربالگری اضطراب GAD-7", short: "GAD-7", color: "#f59e0b", icon: Activity },
  dass21: { name: "سلامت روان DASS-21", short: "DASS-21", color: "#ef4444", icon: Activity },
  big5: { name: "پنج عامل شخصیت", short: "BIG-5", color: "#8b5cf6", icon: Star },
};

const fa = (value: number | string) => String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const clamp = (value: unknown, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .45, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-white/[.075] bg-[#151925] shadow-[0_16px_45px_rgba(0,0,0,.16)] ${className}`}>
      {children}
    </div>
  );
}

function Ring({ value, color, size = 72, label }: { value: number; color: string; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = clamp(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="7" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - safe / 100) }} transition={{ duration: 1.1, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-sm font-black leading-none">{fa(Math.round(safe))}٪</span>
        {label && <span className="mt-1 text-[8px] text-white/35">{label}</span>}
      </div>
    </div>
  );
}

function MiniBars({ color, values }: { color: string; values: number[] }) {
  return (
    <div className="mt-4 flex h-6 items-end gap-1" dir="ltr">
      {values.map((value, index) => (
        <motion.span key={index} initial={{ height: 3 }} animate={{ height: `${value}%` }}
          transition={{ duration: .65, delay: index * .05 }} className="flex-1 rounded-[3px]"
          style={{ background: color, opacity: .35 + index * .055 }} />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bars }: {
  icon: typeof Calendar; label: string; value: string; color: string; bars: number[];
}) {
  return (
    <Panel className="group min-w-0 p-4 transition-transform hover:-translate-y-1 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block text-xl font-black text-white sm:text-2xl">{value}</strong>
          <span className="mt-1 block truncate text-[10px] font-bold text-slate-500 sm:text-xs">{label}</span>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color, background: `${color}18` }}>
          <Icon size={19} />
        </span>
      </div>
      <MiniBars color={color} values={bars} />
    </Panel>
  );
}

function RadarChart({ neo }: { neo?: SmartProfile["neo"] }) {
  const data = neo ? [clamp((neo.E || 0) / 30 * 100), clamp((neo.A || 0) / 30 * 100), clamp((neo.C || 0) / 30 * 100), clamp(100 - (neo.N || 0) / 30 * 100), clamp((neo.O || 0) / 30 * 100)] : [0, 0, 0, 0, 0];
  const labels = ["اجتماعی", "توافق", "وظیفه‌شناسی", "ثبات هیجانی", "گشودگی"];
  const center = 130, radius = 78;
  const point = (index: number, scale = 1) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale];
  };
  const polygon = (scale: number) => labels.map((_, index) => point(index, scale).join(",")).join(" ");
  const result = data.map((value, index) => point(index, value / 100).join(",")).join(" ");

  return (
    <div className="relative flex min-h-[245px] items-center justify-center">
      <svg viewBox="0 0 260 260" className="h-[230px] w-full max-w-[330px] overflow-visible" role="img" aria-label="نمودار پنج عامل شخصیت">
        {[.25, .5, .75, 1].map(level => <polygon key={level} points={polygon(level)} fill="none" stroke="rgba(255,255,255,.075)" />)}
        {labels.map((_, index) => {
          const [x, y] = point(index, 1);
          return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,.06)" />;
        })}
        {neo && <motion.polygon points={result} fill="rgba(249,115,22,.22)" stroke="#f97316" strokeWidth="2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8 }} />}
        {neo && data.map((value, index) => {
          const [x, y] = point(index, value / 100);
          return <circle key={index} cx={x} cy={y} r="3.5" fill="#fb923c" />;
        })}
        {labels.map((label, index) => {
          const [x, y] = point(index, 1.2);
          return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#7f899d" fontSize="10" fontWeight="700">{label}</text>;
        })}
      </svg>
      {!neo && <Link href="/dashboard/tests/neo_ffi" className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Brain size={24} className="mb-2 text-orange-400" />
        <span className="text-xs font-black text-white">نقشه شخصیت هنوز آماده نیست</span>
        <span className="mt-1 text-[10px] text-slate-500">تست NEO را تکمیل کنید</span>
      </Link>}
    </div>
  );
}

function ResultRow({ result, index }: { result: TestResult; index: number }) {
  const meta = TEST_META[result.test_name] || { name: result.test_name, short: "TEST", color: "#64748b", icon: FlaskConical };
  const Icon = meta.icon;
  const isPreference = ["mbti", "raavi_matching_basis_v1"].includes(result.test_name);
  const score = isPreference ? null : clamp(getTestProfileScore(result.test_name, result.scores, result.main_result || ""));
  return (
    <details className="group rounded-2xl border border-white/[.055] bg-white/[.018] open:bg-white/[.035]" open={index === 0}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3.5 sm:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ color: meta.color, background: `${meta.color}16` }}><Icon size={17} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-200 sm:text-sm">{meta.name}</p>
          <p className="mt-1 truncate text-[9px] text-slate-500">{result.main_result || "تکمیل شده"}</p>
        </div>
        {score !== null && <span className="rounded-lg px-2 py-1 text-[9px] font-black" style={{ color: meta.color, background: `${meta.color}13` }}>{fa(Math.round(score))}٪</span>}
        <ChevronDown size={14} className="text-slate-600 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4">
        {score !== null ? <>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]" dir="ltr"><motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className="h-full rounded-full" style={{ background: meta.color }} /></div>
          <p className="text-[9px] leading-5 text-slate-500">این درصد، امتیاز پروفایل محاسبه‌شده از پاسخ‌های همین تست است و با نتیجه ذخیره‌شده همگام می‌ماند.</p>
        </> : <p className="text-[10px] leading-5 text-slate-500">تیپ شخصیتی یک ترجیح است و به‌صورت امتیاز خوب یا بد نمایش داده نمی‌شود.</p>}
      </div>
    </details>
  );
}

export default function DashboardPage() {
  const { state } = useApp();
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [profile, setProfile] = useState<SmartProfile>({});
  const [rgciScore, setRgciScore] = useState<number | null>(null);
  const [rgciNeed, setRgciNeed] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  useEffect(() => {
    if (!state.isLoggedIn) { setLoading(false); return; }
    const token = localStorage.getItem("token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    let alive = true;

    const loadDashboard = async () => {
      try {
        const [bookingData, profileResponse, resultResponse, rgciResponse] = await Promise.all([
          fetchMyBookings().catch(() => []),
          fetch(`${API_URL}/api/intelligence/my-profile`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/api/test-results/my`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/api/rgci/my-score`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (!alive) return;
        const active = bookingData.filter((booking: Booking) => booking.status !== "cancelled");
        const enriched = await Promise.all(active.map(async (booking: Booking) => {
          const eventId = booking.eventId || booking.event_id || "";
          if (!eventId) return booking as BookingWithEvent;
          const [eventData, locationInfo] = await Promise.all([
            fetchEventById(eventId).catch(() => undefined),
            fetchEventLocation(eventId).catch(() => undefined),
          ]);
          return { ...booking, eventData, locationInfo } as BookingWithEvent;
        }));
        if (!alive) return;
        const testRows = resultResponse?.results || resultResponse?.data || [];
        const seen = new Set<string>();
        setResults(testRows.filter((row: TestResult) => row?.test_name && !seen.has(row.test_name) && Boolean(seen.add(row.test_name))));
        setProfile(profileResponse || {});
        setIsSuspended(Boolean(profileResponse?.is_suspended));
        setBookings(enriched);
        if (rgciResponse?.rgci_total_score !== undefined && rgciResponse?.rgci_total_score !== null) setRgciScore(Number(rgciResponse.rgci_total_score));
        setRgciNeed(rgciResponse?.dominant_psychological_need || "");
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadDashboard();
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("raavi_test_done");
      channel.onmessage = () => loadDashboard();
    } catch {}
    return () => { alive = false; channel?.close(); };
  }, [state.isLoggedIn]);

  const upcomingBookings = useMemo(() => bookings.filter(booking => {
    const date = booking.eventData?.start_date || (booking as BookingWithEvent & { start_date?: string }).start_date;
    return date && new Date(date).getTime() > Date.now();
  }), [bookings]);
  const attendedBookings = bookings.filter(booking => {
    const attendance = booking as BookingWithEvent & { attended?: boolean; attendance_marked_at?: string };
    return attendance.attended === true && Boolean(attendance.attendance_marked_at);
  });
  const completeness = clamp(profile.profileCompleteness || 0);
  const testCount = profile.totalTestsDone ?? results.length;
  const mbti = profile.mbti || results.find(row => ["mbti", "raavi_matching_basis_v1"].includes(row.test_name))?.main_result || "";
  const firstName = state.user?.name || "دوست راوی";

  if (!state.isLoggedIn) return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center" dir="rtl">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10"><Home size={34} className="text-orange-400" /></div>
      <div><h1 className="text-xl font-black text-white">به راوی خوش آمدید</h1><p className="mt-2 text-sm text-slate-500">برای مشاهده داشبورد وارد شوید</p></div>
      <Link href="/login" className="rounded-xl bg-orange-500 px-7 py-3 text-sm font-black text-white">ورود / ثبت‌نام</Link>
    </div>
  );

  const insightItems = [
    { label: "آمادگی رابطه", value: clamp(profile.relationshipReadiness), color: "#f97316", icon: Heart },
    { label: "سلامت روان", value: clamp(profile.mentalHealthScore), color: "#ec4899", icon: Activity },
    { label: "شناخت هوشمند", value: clamp(profile.smartScore), color: "#3b82f6", icon: Brain },
    { label: "تکمیل پروفایل", value: completeness, color: "#a855f7", icon: Target },
  ];

  return (
    <div className="mx-auto max-w-[1080px] space-y-3.5 pb-24 sm:space-y-4 lg:pb-10" dir="rtl">
      {isSuspended && <SuspendedBanner className="relative" />}

      <FadeUp>
        <section className="relative overflow-hidden rounded-[26px] border border-white/[.08] bg-[linear-gradient(112deg,#1c2235_0%,#202844_58%,#362a31_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-7">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-500/[.08] blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-32 w-64 bg-blue-500/[.06] blur-3xl" />
          <div className="relative mb-6 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-black text-white"><Sparkles size={14} className="text-orange-400" /> داشبورد من</p>
            <Link href="/dashboard/notifications" aria-label="اعلان‌ها" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 transition hover:text-orange-400"><Bell size={16} /></Link>
          </div>
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-orange-500/80 bg-[#25202a] text-4xl font-black text-white shadow-[0_0_35px_rgba(249,115,22,.22)]">{firstName.charAt(0)}</div>
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#242333] bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-xl font-black text-white sm:text-2xl">{firstName}</h1>
                {isAdmin && <span className="rounded-full bg-orange-500/15 px-2 py-1 text-[9px] font-black text-orange-300">ادمین</span>}
              </div>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 sm:justify-start">
                {state.user?.city && <><MapPin size={12} /> {state.user.city}</>}
                <span className="text-slate-700">•</span><span>عضو جامعه راوی</span>
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-xl border border-white/[.07] bg-white/[.04] px-3 py-2 text-[10px] text-slate-400">شخصیت <b className="mr-1 text-white" dir="ltr">{mbti || "—"}</b></span>
                <span className="rounded-xl border border-white/[.07] bg-white/[.04] px-3 py-2 text-[10px] text-slate-400">تست‌ها <b className="mr-1 text-white">{fa(testCount)}</b></span>
                <span className="rounded-xl border border-white/[.07] bg-white/[.04] px-3 py-2 text-[10px] text-slate-400">سازگاری <b className="mr-1 text-white">{rgciScore === null ? "—" : fa(rgciScore.toFixed(1))}</b></span>
              </div>
            </div>
            <Link href="/dashboard/complete-profile" className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[.065] bg-black/10 p-2.5 pr-4">
              <div className="text-right"><p className="text-[10px] font-bold text-slate-500">تکمیل پروفایل</p><p className="mt-1 text-xs font-black text-white">{completeness >= 100 ? "کامل شده" : "ادامه تکمیل"}</p></div>
              <Ring value={completeness} color="#fb923c" size={68} />
            </Link>
          </div>
        </section>
      </FadeUp>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FlaskConical} value={fa(testCount)} label="تست انجام‌شده" color="#f97316" bars={[55, 72, 48, 64, 42, 58, 36, 49]} />
        <StatCard icon={Target} value={rgciScore === null ? "—" : fa(rgciScore.toFixed(1))} label="شاخص سازگاری" color="#3b82f6" bars={[45, 64, 58, 72, 52, 66, 48, 61]} />
        <StatCard icon={Calendar} value={fa(upcomingBookings.length)} label="همنشینی پیش‌رو" color="#22c55e" bars={[40, 58, 72, 54, 68, 46, 57, 39]} />
        <StatCard icon={Award} value={fa(attendedBookings.length)} label="حضور تأییدشده" color="#a855f7" bars={[62, 48, 68, 43, 57, 39, 51, 34]} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.45fr_.95fr]">
        <FadeUp delay={.08}>
          <Panel className="h-full p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-black text-white"><span className="h-4 w-1 rounded-full bg-orange-500" /> نقشه شخصیت</h2>
            <RadarChart neo={profile.neo} />
          </Panel>
        </FadeUp>
        <FadeUp delay={.11}>
          <Panel className="h-full p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-black text-white"><span className="h-4 w-1 rounded-full bg-blue-500" /> شاخص‌های من</h2>
            <div className="grid grid-cols-2 gap-x-2 gap-y-5 pt-7">
              {insightItems.map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <Ring value={value} color={color} size={70} />
                  <span className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400"><Icon size={10} style={{ color }} />{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </FadeUp>
      </div>

      <FadeUp delay={.12}>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-white"><span className="h-4 w-1 rounded-full bg-orange-500" /> تست‌های اصلی</h2>
            <Link href="/dashboard/tests" className="flex items-center gap-1 text-[10px] font-black text-orange-400">مشاهده همه <ChevronLeft size={12} /></Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CORE_TESTS.map(id => {
              const meta = TEST_META[id]; const done = results.some(row => row.test_name === id || (id === "raavi_matching_basis_v1" && row.test_name === "mbti")); const Icon = meta.icon;
              return <Link key={id} href={`/dashboard/tests/${id}`} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition hover:-translate-y-1"
                style={{ background: `${meta.color}0b`, borderColor: done ? `${meta.color}3a` : "rgba(255,255,255,.055)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: meta.color, background: `${meta.color}18` }}><Icon size={19} /></span>
                <span className="w-full truncate text-[9px] font-black text-slate-400">{meta.short}</span>
                {done ? <CheckCircle2 size={11} style={{ color: meta.color }} /> : <Lock size={10} className="text-slate-700" />}
              </Link>;
            })}
          </div>
        </Panel>
      </FadeUp>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/compatibility" className="group flex min-h-[86px] items-center gap-4 overflow-hidden rounded-[22px] bg-[linear-gradient(110deg,#ff9a43,#f85b0b)] px-5 text-white shadow-[0_16px_35px_rgba(249,115,22,.18)]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Heart size={23} fill="white" /></span>
          <div className="flex-1"><p className="text-sm font-black">پروفایل سازگاری</p><p className="mt-1 text-[10px] text-white/70">میزان سازگاری خود را ببینید</p></div>
          <ChevronLeft className="transition-transform group-hover:-translate-x-1" size={20} />
        </Link>
        <Link href="/dashboard/tests" className="group flex min-h-[86px] items-center gap-4 rounded-[22px] border border-white/[.075] bg-[#191d2b] px-5 text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><Sparkles size={22} /></span>
          <div className="flex-1"><p className="text-sm font-black">مشاهده و انجام همه تست‌ها</p><p className="mt-1 text-[10px] text-slate-500">مسیر رشد خود را کامل کنید</p></div>
          <ChevronLeft className="text-orange-400 transition-transform group-hover:-translate-x-1" size={20} />
        </Link>
      </div>

      {!isSuspended && <FadeUp delay={.14}><BaleConnect /></FadeUp>}

      <FadeUp delay={.16}>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-white"><span className="h-4 w-1 rounded-full bg-purple-500" /> نتایج روان‌سنجی</h2>
            <span className="rounded-lg bg-white/[.04] px-2 py-1 text-[9px] text-slate-500">{fa(results.length)} مورد</span>
          </div>
          {loading ? <div className="flex justify-center py-10"><span className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>
            : results.length ? <div className="space-y-2">{results.map((result, index) => <ResultRow key={`${result.id || result.test_name}-${index}`} result={result} index={index} />)}</div>
            : <div className="py-10 text-center"><FlaskConical size={30} className="mx-auto text-slate-700" /><p className="mt-3 text-xs font-black text-slate-400">هنوز نتیجه‌ای ثبت نشده است</p><Link href="/dashboard/tests" className="mt-3 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-[10px] font-black text-white">شروع اولین تست</Link></div>}
        </Panel>
      </FadeUp>

      <FadeUp delay={.18}>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-black text-white"><Calendar size={15} className="text-orange-400" /> همنشینی‌های پیش‌رو</h2><Link href="/events" className="text-[10px] font-bold text-orange-400">مشاهده رویدادها</Link></div>
          {loading ? <div className="h-20 animate-pulse rounded-2xl bg-white/[.025]" /> : upcomingBookings.length === 0 ?
            <div className="flex flex-col items-center py-8 text-center"><Calendar size={28} className="text-slate-700" /><p className="mt-3 text-xs font-black text-slate-400">همنشینی پیش‌رویی ندارید</p><Link href="/events" className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-[10px] font-black text-white">پیدا کردن همنشینی</Link></div>
            : <div className="grid gap-2 md:grid-cols-2">{upcomingBookings.map(booking => {
              const date = booking.eventData?.start_date || (booking as BookingWithEvent & { start_date?: string }).start_date;
              const title = booking.eventData?.title || booking.eventTitle || "همنشینی راوی";
              return <Link key={booking.id} href={`/events/${booking.eventId || booking.event_id}`} className="rounded-2xl border border-white/[.055] bg-white/[.02] p-4 transition hover:bg-white/[.04]">
                <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"><Calendar size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-200">{title}</p>{date && <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500"><Clock size={10} />{new Date(date).toLocaleString("fa-IR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-500">{booking.locationInfo?.revealed && booking.locationInfo.location ? <><MapPin size={10} className="text-emerald-400" />{booking.locationInfo.location}</> : <><Lock size={10} />آدرس از ۱۰ ساعت قبل نمایش داده می‌شود</>}</p></div><ChevronLeft size={14} className="text-slate-600" /></div>
              </Link>;
            })}</div>}
        </Panel>
      </FadeUp>

      {isAdmin && <FadeUp delay={.2}><Panel className="p-4"><div className="flex flex-wrap items-center gap-2"><span className="ml-2 flex items-center gap-2 text-xs font-black text-orange-400"><Shield size={15} /> مدیریت</span>{[
        { href: "/admin/dashboard", label: "پنل ادمین", icon: Shield }, { href: "/admin/users", label: "کاربران", icon: UserRound }, { href: "/admin/events", label: "رویدادها", icon: Calendar }, { href: "/admin/matching", label: "مچینگ", icon: Compass },
      ].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-2 rounded-xl bg-white/[.035] px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-white"><Icon size={13} />{label}</Link>)}</div></Panel></FadeUp>}

      {rgciNeed && <p className="text-center text-[9px] text-slate-700">نیاز روان‌شناختی غالب ثبت‌شده: {rgciNeed}</p>}
    </div>
  );
}

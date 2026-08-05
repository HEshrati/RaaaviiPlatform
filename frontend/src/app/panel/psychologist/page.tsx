"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Calendar, CheckCircle2, Clock, TrendingUp,
  HeartPulse, AlertTriangle, Star, ArrowLeft, RefreshCw,
  Video, MapPin, FileText, Shield
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const toPersian = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function StatCard({ icon: Icon, value, label, color, sub }: any) {
  return (
    <div className="p-4 rounded-2xl relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-2xl font-black text-white">{value != null ? toPersian(value) : "—"}</span>
      </div>
      <p className="text-slate-500 text-xs font-bold">{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>{toPersian(value)}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)` }} />
      </div>
    </div>
  );
}

function WeekChart({ data }: { data: number[] }) {
  const days = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all duration-500"
            style={{ height: `${Math.max(4, (v / max) * 56)}px`, background: v > 0 ? "linear-gradient(180deg,#10b981,#10b98166)" : "rgba(255,255,255,0.05)" }} />
          <span className="text-[9px] text-slate-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function PsychologistHome() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      fetch(`${API}/api/psychologist-verify/dashboard`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/psychologist-verify/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([s, p]) => {
      if (s.status === "fulfilled" && s.value) {
        const raw = s.value;
        const inner = raw.stats || {};
        const completedN = Number(inner.completed) || 0;
        const confirmedN = Number(inner.confirmed) || 0;
        setStats({
          ...raw,
          upcoming_sessions: (raw.upcomingSlots || []).length,
          total_patients: inner.total_patients ?? 0,
          completed_sessions: completedN,
          pending_notes: inner.pending ?? 0,
          completion_rate: (completedN + confirmedN) > 0 ? Math.round((completedN / (completedN + confirmedN)) * 100) : 0,
        });
      } else setError("دریافت آمار ناموفق بود");
      if (p.status === "fulfilled") setProfile(p.value);
    }).finally(() => setLoading(false));
  }

  useEffect(load, []);

  const weekData = stats?.weekly_sessions || stats?.weeklySessions || [0,0,0,0,0,0,0];
  const verStatus = profile?.verificationStatus || profile?.status;
  const isApproved = verStatus === "approved" || verStatus === "active";

  return (
    <div dir="rtl">
      {/* هدر */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">داشبورد روانشناس</h1>
          <p className="text-slate-500 text-sm mt-0.5">خلاصه وضعیت جلسات و مراجعین</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={15} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* وضعیت تایید */}
      {!loading && profile && (
        <div className="p-3 rounded-2xl mb-5 flex items-center gap-3"
          style={{ background: isApproved ? "rgba(16,185,129,0.08)" : "rgba(249,115,22,0.08)", border: `1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "rgba(249,115,22,0.25)"}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(249,115,22,0.15)" }}>
            <Shield size={14} style={{ color: isApproved ? "#10b981" : "#f59e0b" }} />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold">
              {isApproved ? "پروفایل تایید شده" : "در انتظار تایید"}
            </p>
            <p className="text-slate-500 text-[10px]">
              {isApproved ? `کد نظام: ${profile?.licenseNumber || "—"}` : "پروفایل شما در صف بررسی است"}
            </p>
          </div>
          {!isApproved && (
            <Link href="/panel/psychologist/profile"
              className="text-orange-400 text-[11px] font-bold">تکمیل پروفایل</Link>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl mb-4 flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={14} className="text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Calendar} value={stats?.upcoming_sessions ?? stats?.upcomingSessions ?? 0}
          label="جلسات پیش رو" color="#10b981" sub="هفت روز آینده" />
        <StatCard icon={Users} value={stats?.total_patients ?? stats?.totalPatients ?? 0}
          label="مراجعین فعال" color="#3b82f6" />
        <StatCard icon={CheckCircle2} value={stats?.completed_sessions ?? stats?.completedSessions ?? 0}
          label="جلسات تکمیل‌شده" color="#f59e0b" />
        <StatCard icon={Clock} value={stats?.pending_notes ?? stats?.pendingNotes ?? 0}
          label="یادداشت‌های ناتمام" color="#ef4444" sub="نیاز به تکمیل" />
      </div>

      {/* نمودار هفتگی + آمار تخصص */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-white text-sm font-bold">جلسات این هفته</span>
          </div>
          <WeekChart data={Array.isArray(weekData) && weekData.length === 7 ? weekData : [0,0,0,0,0,0,0]} />
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-yellow-400" />
            <span className="text-white text-sm font-bold">آمار عملکرد</span>
          </div>
          <MiniBar label="نرخ تکمیل جلسات" value={stats?.completion_rate ?? 0} max={100} color="#10b981" />
          <MiniBar label="رضایت مراجعین (از ۵)" value={Math.round((stats?.satisfaction_score ?? stats?.satisfactionScore ?? 0) * 20)} max={100} color="#f59e0b" />
          <MiniBar label="پاسخ‌دهی به رزروها" value={stats?.response_rate ?? stats?.responseRate ?? 0} max={100} color="#3b82f6" />
        </div>
      </div>

      {/* دسترسی سریع */}
      <p className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-widest">دسترسی سریع</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/panel/psychologist/availability", label: "ثبت برنامه زمانی", icon: Calendar, color: "#10b981" },
          { href: "/panel/psychologist/bookings",     label: "مراجعین و رزروها",  icon: Users,    color: "#3b82f6" },
          { href: "/panel/psychologist/interviews",   label: "مصاحبه بالینی",     icon: HeartPulse, color: "#8b5cf6" },
          { href: "/panel/psychologist/profile",      label: "پروفایل تخصصی",     icon: FileText, color: "#f59e0b" },
          { href: "/panel/psychologist/status",       label: "وضعیت تایید",        icon: Shield,   color: "#6366f1" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="p-4 rounded-2xl flex items-center justify-between group transition-all"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}
            onMouseEnter={e => (e.currentTarget.style.background = `${color}15`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${color}08`)}>
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <Icon size={15} style={{ color }} />{label}
            </span>
            <ArrowLeft size={14} style={{ color }} />
          </Link>
        ))}
      </div>
    </div>
  );
}




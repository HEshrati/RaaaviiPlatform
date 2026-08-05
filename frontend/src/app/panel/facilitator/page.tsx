"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users, CheckCircle2, Clock, FileText, AlertCircle, ArrowLeft, RefreshCw, TrendingUp, Star } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const toPersian = (n: any) => String(n ?? 0).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function StatCard({ icon: Icon, value, label, color }: any) {
  return (
    <div className="p-4 rounded-2xl relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-2xl font-black text-white">{toPersian(value)}</span>
      </div>
      <p className="text-slate-500 text-xs font-bold">{label}</p>
    </div>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${done ? "#10b981" : "rgba(255,255,255,0.1)"}` }}>
        {done && <CheckCircle2 size={12} className="text-emerald-400" />}
      </div>
      <span className="text-sm" style={{ color: done ? "#cbd5e1" : "#64748b" }}>{label}</span>
      {!done && <span className="mr-auto text-[10px] text-orange-400 font-bold">ناقص</span>}
    </div>
  );
}

export default function FacilitatorHome() {
  const [status, setStatus] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      fetch(`${API}/api/facilitator/status`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/facilitator/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([s, p]) => {
      if (s.status === "fulfilled") setStatus(s.value);
      if (p.status === "fulfilled") setProfile(p.value);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const checklist = profile?.checklist_done || {};
  const CHECKLIST_ITEMS = [
    { key: "personal_info",   label: "تکمیل اطلاعات شخصی" },
    { key: "resume",          label: "ارسال رزومه کاری" },
    { key: "interview",       label: "مصاحبه اولیه با تیم راوی" },
    { key: "training",        label: "شرکت در دوره آموزشی راوی" },
    { key: "agreement",       label: "امضای تعهدنامه همکاری" },
    { key: "schedule",        label: "تنظیم محدوده و زمان کاری" },
  ];
  const doneCount = CHECKLIST_ITEMS.filter(i => checklist[i.key]).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">داشبورد تسهیلگر</h1>
          <p className="text-slate-500 text-sm mt-0.5">مدیریت رویدادها و پروفایل تسهیلگری</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={15} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* هشدار مرامنامه */}
      {!loading && status?.manifestoAccepted === false && (
        <div className="p-4 rounded-2xl mb-5 flex items-center justify-between"
          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-400" />
            <span className="text-orange-300 text-sm font-bold">مرامنامه راوی را تأیید نکرده‌اید</span>
          </div>
          <Link href="/panel/facilitator/manifesto"
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "rgba(249,115,22,0.2)", color: "#fb923c" }}>
            مشاهده و تأیید
          </Link>
        </div>
      )}

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Calendar} value={status?.total_events ?? 0} label="کل رویدادها" color="#f59e0b" />
        <StatCard icon={Users} value={status?.total_participants ?? 0} label="شرکت‌کنندگان" color="#3b82f6" />
        <StatCard icon={CheckCircle2} value={status?.completed_events ?? 0} label="رویداد برگزارشده" color="#10b981" />
        <StatCard icon={Star} value={status?.rating ?? "—"} label="امتیاز میانگین" color="#8b5cf6" />
      </div>

      {/* پیشرفت چک‌لیست */}
      <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-bold">چک‌لیست همکاری</span>
          <span className="text-sm font-black" style={{ color: pct === 100 ? "#10b981" : "#f59e0b" }}>{pct}٪</span>
        </div>
        <div className="h-2 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct === 100 ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
        </div>
        {CHECKLIST_ITEMS.map(i => (
          <ChecklistItem key={i.key} label={i.label} done={!!checklist[i.key]} />
        ))}
      </div>

      {/* دسترسی سریع */}
      <p className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-widest">دسترسی سریع</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { href: "/panel/facilitator/events",    label: "مدیریت رویدادها",  icon: Calendar,  color: "#f59e0b" },
          { href: "/panel/facilitator/profile",   label: "پروفایل تسهیلگری", icon: FileText,  color: "#3b82f6" },
          { href: "/panel/facilitator/manifesto", label: "مرامنامه راوی",     icon: CheckCircle2, color: "#10b981" },
          { href: "/panel/facilitator/status",    label: "وضعیت پرونده",      icon: TrendingUp, color: "#8b5cf6" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="p-4 rounded-2xl flex items-center justify-between transition-all"
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




"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Edit, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_MAP: Record<string, { icon: any; color: string; title: string; desc: string }> = {
  not_started:        { icon: AlertCircle,  color: "#64748b", title: "شروع نشده",              desc: "پروفایل روانشناسی خود را تکمیل کنید." },
  mobile_verified:    { icon: AlertCircle,  color: "#f59e0b", title: "موبایل تایید شده",       desc: "اطلاعات حرفه‌ای و تخصص خود را تکمیل کنید." },
  profile_incomplete: { icon: AlertCircle,  color: "#f59e0b", title: "پروفایل ناقص",           desc: "اطلاعات حرفه‌ای، تخصص و مدارک را تکمیل کنید." },
  profile_submitted:  { icon: Clock,        color: "#3b82f6", title: "در حال بررسی سیستم",    desc: "اطلاعات ارسال شد و سیستم در حال اعتبارسنجی است." },
  pending_review:     { icon: Clock,        color: "#3b82f6", title: "در انتظار بررسی",        desc: "پرونده شما در صف بررسی تیم راوی است. ۲۴ تا ۷۲ ساعت طول می‌کشد." },
  pending_admin:      { icon: Clock,        color: "#6366f1", title: "در انتظار بررسی ادمین",  desc: "پرونده شما توسط تیم راوی بررسی می‌شود." },
  needs_admin_review: { icon: AlertCircle,  color: "#a855f7", title: "نیاز به بررسی دستی",    desc: "سیستم نتوانست هویت را کامل تطبیق دهد. تیم راوی دستی بررسی می‌کند." },
  needs_revision:     { icon: Edit,         color: "#f97316", title: "نیاز به اصلاح",          desc: "پروفایل نیاز به اصلاح دارد. دلیل را در پایین مشاهده کنید." },
  approved:           { icon: CheckCircle2, color: "#10b981", title: "تأیید شده",              desc: "پروفایل شما تأیید شده است." },
  active:             { icon: CheckCircle2, color: "#22c55e", title: "فعال",                   desc: "حساب فعال است. می‌توانید برنامه زمانی خود را تنظیم کنید." },
  rejected:           { icon: XCircle,      color: "#ef4444", title: "رد شده",                 desc: "درخواست رد شد. دلیل را در پایین مشاهده کنید." },
  suspended:          { icon: XCircle,      color: "#dc2626", title: "تعلیق شده",              desc: "حساب شما موقتاً تعلیق شده است. با پشتیبانی تماس بگیرید." },
};

export default function PsychologistStatusPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // باگ رفع‌شده: این صفحه قبلاً از endpoint اشتباه /my-profile می‌خواند
  // که اطلاعات خام entity را برمی‌گرداند (نه وضعیت ساختاریافته با پیام‌ها و trust_score).
  // endpoint صحیح /status است که توسط getVerificationStatus() ساخته شده
  // و دقیقاً همان فرمت مورد نیاز این صفحه را (status, message, trust_score, can_access_dashboard) برمی‌گرداند.
  function load() {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/api/psychologist-verify/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setStatus(d?.status || "not_started");
        setReason(d?.rejection_reason || d?.needs_revision_reason || "");
        setTrustScore(d?.trust_score ?? null);
      })
      .catch(() => setStatus("not_started"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>;

  const cfg = STATUS_MAP[status!] || STATUS_MAP["not_started"];
  const Icon = cfg.icon;

  return (
    <div dir="rtl" className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">وضعیت پرونده</h1>
          <p className="text-slate-500 text-sm mt-0.5">پیگیری تأیید پروفایل روانشناسی</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={15} className="text-slate-400" />
        </button>
      </div>

      <div className="p-6 rounded-3xl flex flex-col items-center text-center"
        style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: `${cfg.color}18` }}>
          <Icon size={28} style={{ color: cfg.color }} />
        </div>
        <h2 className="text-white font-black text-lg mb-2">{cfg.title}</h2>
        <p className="text-slate-400 text-sm leading-7 max-w-xs">{cfg.desc}</p>
        {trustScore !== null && (
          <div className="mt-3 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.05)", color: trustScore >= 75 ? "#4ade80" : trustScore >= 60 ? "#facc15" : "#f87171" }}>
            امتیاز اعتماد سیستم: {trustScore} / 100
          </div>
        )}
        {reason && (
          <p className="mt-3 text-red-400 text-xs bg-red-950/30 px-3 py-2 rounded-xl text-right leading-6">{reason}</p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {[
          { key: "mobile_verified",    label: "تایید موبایل",        href: null },
          { key: "profile_incomplete", label: "تکمیل پروفایل",       href: "/panel/psychologist/profile" },
          { key: "pending_review",     label: "بررسی توسط راوی",    href: null },
          { key: "approved",           label: "تأیید نهایی",          href: null },
          { key: "active",             label: "شروع دریافت جلسه",    href: "/panel/psychologist/availability" },
        ].map((step, i) => {
          const order = ["not_started","mobile_verified","profile_incomplete","profile_submitted","pending_review","pending_admin","needs_admin_review","approved","active"];
          const curIdx  = order.indexOf(status!);
          const stepIdx = order.indexOf(step.key);
          const isDone    = curIdx > stepIdx;
          const isCurrent = curIdx === stepIdx;
          return (
            <div key={step.key} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: isCurrent ? "rgba(255,255,255,0.05)" : "transparent",
                       border: `1px solid ${isCurrent ? "rgba(255,255,255,0.1)" : "transparent"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: isDone ? "rgba(34,197,94,0.2)" : isCurrent ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                         color: isDone ? "#22c55e" : isCurrent ? cfg.color : "#475569" }}>
                {isDone ? "✓" : i + 1}
              </div>
              {step.href && isCurrent ? (
                <Link href={step.href} className="text-sm font-bold" style={{ color: cfg.color }}>{step.label} ←</Link>
              ) : (
                <span className="text-sm font-bold"
                  style={{ color: isDone ? "#22c55e" : isCurrent ? "white" : "#475569" }}>
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




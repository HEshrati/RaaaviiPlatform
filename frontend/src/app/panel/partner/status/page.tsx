"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_MAP: Record<string,{icon:any; color:string; title:string; desc:string}> = {
  not_started:        { icon: AlertCircle,  color:"#64748b", title:"شروع نشده",         desc:"اطلاعات فضا را از طریق بخش «تأیید همکاری» ثبت کنید." },
  profile_incomplete: { icon: AlertCircle,  color:"#f59e0b", title:"پروفایل ناقص",      desc:"اطلاعات فضا را تکمیل کنید و شرایط همکاری را بپذیرید." },
  pending_review:     { icon: Clock,        color:"#3b82f6", title:"در انتظار بررسی",    desc:"تیم راوی درخواست شما را بررسی می‌کند. معمولاً ۲۴ تا ۷۲ ساعت طول می‌کشد." },
  approved:           { icon: CheckCircle2, color:"#10b981", title:"تأیید شده",          desc:"همکاری شما تأیید شده است. فضای شما می‌تواند پذیرای رویدادهای راوی باشد." },
  active:             { icon: CheckCircle2, color:"#22c55e", title:"فعال",               desc:"فضای شما فعال است و رویدادها می‌توانند در آن ثبت شوند." },
  rejected:           { icon: XCircle,      color:"#ef4444", title:"رد شده",             desc:"درخواست همکاری رد شد. برای اطلاع از دلیل با پشتیبانی راوی تماس بگیرید." },
};

export default function PartnerStatusPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/api/venue/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setStatus(d?.status || "not_started"))
      .catch(() => setStatus("not_started"))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>;

  const cfg = STATUS_MAP[status!] || STATUS_MAP["not_started"];
  const Icon = cfg.icon;

  return (
    <div dir="rtl" className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">وضعیت همکاری</h1>
          <p className="text-slate-500 text-sm mt-0.5">پیگیری وضعیت پرونده فضای شما</p>
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
      </div>

      {/* مراحل */}
      <div className="mt-6 space-y-3">
        {[
          { key:"profile_incomplete", label:"ثبت اطلاعات فضا",    href:"/panel/partner/verification" },
          { key:"pending_review",     label:"بررسی توسط راوی",    href:null },
          { key:"approved",           label:"تأیید نهایی",         href:null },
          { key:"active",             label:"شروع فعالیت",         href:"/panel/partner/bookings" },
        ].map((step, i) => {
          const statusOrder = ["not_started","profile_incomplete","pending_review","approved","active"];
          const currentIdx = statusOrder.indexOf(status!);
          const stepIdx    = statusOrder.indexOf(step.key);
          const isDone = currentIdx > stepIdx;
          const isCurrent = currentIdx === stepIdx;
          return (
            <div key={step.key} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: isCurrent ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${isCurrent ? "rgba(255,255,255,0.1)" : "transparent"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: isDone ? "rgba(34,197,94,0.2)" : isCurrent ? `${cfg.color}20` : "rgba(255,255,255,0.04)", color: isDone ? "#22c55e" : isCurrent ? cfg.color : "#475569" }}>
                {isDone ? "✓" : i+1}
              </div>
              <span className="text-sm font-bold" style={{ color: isDone ? "#22c55e" : isCurrent ? "white" : "#475569" }}>{step.label}</span>
              {isCurrent && step.href && (
                <Link href={step.href} className="mr-auto px-3 py-1 rounded-xl text-xs font-bold"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}>شروع</Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




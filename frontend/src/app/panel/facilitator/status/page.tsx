"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, RefreshCw, Edit3 } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_MAP: Record<string,{icon:any; color:string; title:string; desc:string}> = {
  not_started:        { icon: AlertCircle,  color:"#64748b", title:"شروع نشده",       desc:"پروفایل تسهیلگری خود را از طریق بخش «پروفایل» ثبت کنید." },
  profile_incomplete: { icon: AlertCircle,  color:"#f59e0b", title:"پروفایل ناقص",    desc:"اطلاعات پروفایل را تکمیل و مرامنامه را بپذیرید." },
  pending_review:     { icon: Clock,        color:"#3b82f6", title:"در انتظار بررسی",  desc:"تیم راوی پرونده شما را بررسی می‌کند. معمولاً ۲۴ تا ۷۲ ساعت طول می‌کشد." },
  needs_revision:      { icon: Edit3,        color:"#f97316", title:"نیاز به اصلاح",   desc:"پروفایل نیاز به اصلاح دارد. دلیل را در پایین مشاهده کنید." },
  approved:           { icon: CheckCircle2, color:"#10b981", title:"تأیید شده",        desc:"پرونده تسهیلگری شما تأیید شده است. می‌توانید رویداد ثبت کنید." },
  active:             { icon: CheckCircle2, color:"#22c55e", title:"فعال",             desc:"شما یک تسهیلگر فعال راوی هستید." },
  rejected:           { icon: XCircle,      color:"#ef4444", title:"رد شده",           desc:"درخواست همکاری رد شد. دلیل را در پایین مشاهده کنید." },
};

export default function FacilitatorStatusPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/api/facilitator/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-amber-400 animate-spin" /></div>;

  const status = data?.status || "not_started";
  const cfg = STATUS_MAP[status] || STATUS_MAP["not_started"];
  const Icon = cfg.icon;

  return (
    <div dir="rtl" className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">وضعیت پرونده</h1>
          <p className="text-slate-500 text-sm mt-0.5">پیگیری وضعیت تأیید تسهیلگری</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={15} className="text-slate-400" />
        </button>
      </div>

      <div className="p-6 rounded-3xl flex flex-col items-center text-center mb-6"
        style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: `${cfg.color}18` }}>
          <Icon size={28} style={{ color: cfg.color }} />
        </div>
        <h2 className="text-white font-black text-lg mb-2">{cfg.title}</h2>
        <p className="text-slate-400 text-sm leading-7 max-w-xs">{cfg.desc}</p>
        {(status === "rejected" || status === "needs_revision") && (data?.rejection_reason || data?.needs_revision_reason) && (
          <p className="mt-3 text-red-400 text-xs bg-red-950/30 px-3 py-2 rounded-xl text-right leading-6 max-w-xs">
            {data?.rejection_reason || data?.needs_revision_reason}
          </p>
        )}
        {data?.manifestoAccepted === false && status !== "not_started" && (
          <div className="mt-4 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>
            مرامنامه هنوز تأیید نشده
          </div>
        )}
      </div>

      <div className="space-y-3">
        {[
          { key:"profile_incomplete", label:"تکمیل پروفایل",    href:"/panel/facilitator/profile" },
          { key:"manifesto",          label:"پذیرش مرامنامه",   href:"/panel/facilitator/manifesto" },
          { key:"pending_review",     label:"بررسی توسط راوی",  href:null },
          { key:"approved",           label:"تأیید نهایی",       href:null },
        ].map((step, i) => {
          const order = ["not_started","profile_incomplete","pending_review","approved","active"];
          const sIdx  = order.indexOf(step.key === "manifesto" ? "profile_incomplete" : step.key);
          const cIdx  = order.indexOf(status);
          const isDone = cIdx > sIdx || (step.key === "manifesto" && data?.manifestoAccepted);
          const isCurrent = !isDone && cIdx === sIdx;
          return (
            <div key={step.key} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: isCurrent ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${isCurrent ? "rgba(255,255,255,0.1)" : "transparent"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: isDone ? "rgba(245,158,11,0.2)" : isCurrent ? `${cfg.color}20` : "rgba(255,255,255,0.04)", color: isDone ? "#f59e0b" : isCurrent ? cfg.color : "#475569" }}>
                {isDone ? "✓" : i+1}
              </div>
              <span className="text-sm font-bold" style={{ color: isDone ? "#f59e0b" : isCurrent ? "white" : "#475569" }}>{step.label}</span>
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




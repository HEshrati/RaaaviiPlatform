"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Coffee, MapPin, Users, TrendingUp, ArrowLeft, RefreshCw, Clock, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const toPersian = (n: any) => String(n ?? 0).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function StatCard({ icon: Icon, value, label, color, sub }: any) {
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
      {sub && <p className="text-[10px] mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}

export default function PartnerHome() {
  const [events, setEvents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      fetch(`${API}/api/venue/my-events`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/venue/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/venue/status`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([e, p, s]) => {
      if (e.status === "fulfilled") setEvents(Array.isArray(e.value) ? e.value : e.value?.data || []);
      if (p.status === "fulfilled") setProfile(p.value);
      if (s.status === "fulfilled") setStats(s.value);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const eventDate = (event: any) => event.date || event.start_date;
  const upcoming = events.filter((event: any) => eventDate(event) && new Date(eventDate(event)) >= new Date());
  const past = events.filter((event: any) => eventDate(event) && new Date(eventDate(event)) < new Date());
  const verStatus = profile?.status || stats?.status;
  const isActive = verStatus === "approved" || verStatus === "active";

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">داشبورد همکاران</h1>
          <p className="text-slate-500 text-sm mt-0.5">مدیریت فضا و رویدادهای رزروشده</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw size={15} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* وضعیت تایید */}
      {!loading && profile && (
        <div className="p-3 rounded-2xl mb-5 flex items-center gap-3"
          style={{ background: isActive ? "rgba(34,197,94,0.08)" : "rgba(249,115,22,0.08)", border: `1px solid ${isActive ? "rgba(34,197,94,0.25)" : "rgba(249,115,22,0.25)"}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: isActive ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.15)" }}>
            <Coffee size={14} style={{ color: isActive ? "#22c55e" : "#f59e0b" }} />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold">{profile?.venue_name || profile?.name || "فضای همکار"}</p>
            <p className="text-slate-500 text-[10px] flex items-center gap-1">
              <MapPin size={10} />{profile?.address || profile?.city || "آدرس ثبت نشده"}
            </p>
          </div>
          <span className="px-2 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: isActive ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.15)", color: isActive ? "#22c55e" : "#f59e0b" }}>
            {isActive ? "فعال" : "در انتظار تایید"}
          </span>
        </div>
      )}

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Calendar} value={events.length} label="کل رویدادها" color="#22c55e" />
        <StatCard icon={Clock} value={upcoming.length} label="رویداد پیش رو" color="#3b82f6" sub="قابل رزرو" />
        <StatCard icon={CheckCircle2} value={past.length} label="برگزارشده" color="#f59e0b" />
        <StatCard icon={Users} value={stats?.total_participants ?? 0} label="کل شرکت‌کنندگان" color="#8b5cf6" />
      </div>

      {/* نمودار ساده اشغال */}
      {events.length > 0 && (
        <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-white text-sm font-bold">آخرین رویدادها</span>
          </div>
          <div className="space-y-2">
            {events.slice(0, 5).map((e: any) => {
              const date = eventDate(e);
              const isPast = date && new Date(date) < new Date();
              return (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-white text-sm font-bold">{e.title || e.name || "رویداد"}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <Calendar size={10} />
                      {date ? new Date(date).toLocaleDateString("fa-IR") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.capacity && (
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Users size={10} />{toPersian(e.current_participants ?? e.current_bookings ?? 0)}/{toPersian(e.capacity)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: isPast ? "rgba(100,116,139,0.15)" : "rgba(34,197,94,0.15)", color: isPast ? "#64748b" : "#22c55e" }}>
                      {isPast ? "برگزارشده" : "پیش رو"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* دسترسی سریع */}
      <p className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-widest">دسترسی سریع</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { href: "/panel/partner/profile",      label: "اطلاعات و پروفایل فضا",  icon: Coffee,    color: "#22c55e" },
          { href: "/panel/partner/bookings",      label: "رویدادهای رزروشده",      icon: Calendar,  color: "#3b82f6" },
          { href: "/panel/partner/verification",  label: "مدارک و تصاویر محیط",    icon: CheckCircle2, color: "#f59e0b" },
          { href: "/panel/partner/status",        label: "وضعیت همکاری",           icon: TrendingUp, color: "#8b5cf6" },
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



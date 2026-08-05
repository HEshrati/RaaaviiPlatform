"use client";
import { useEffect, useState } from "react";
import { Calendar, Users, MapPin, Loader2, AlertCircle, ExternalLink } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const toPersian = (n: any) => String(n ?? 0).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export default function PartnerBookingsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("not_started");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      fetch(`${API}/api/venue/status`, { headers: h }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/api/venue/my-events`, { headers: h }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([s, e]) => {
      if (s.status === "fulfilled") setStatus(s.value?.status || "not_started");
      if (e.status === "fulfilled") {
        const val = e.value;
        setEvents(Array.isArray(val) ? val : val?.data || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const isApproved = ["approved", "active"].includes(status);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>;

  return (
    <div dir="rtl">
      <h1 className="text-white text-xl font-black mb-1">رویدادهای رزروشده</h1>
      <p className="text-slate-500 text-sm mb-6">رویدادهایی که در فضای شما برگزار می‌شوند یا خواهند شد</p>

      {!isApproved && (
        <div className="p-4 rounded-2xl mb-6 flex items-start gap-3"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <AlertCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-bold text-sm">دسترسی محدود</p>
            <p className="text-slate-400 text-xs mt-1">تا زمان تأیید همکاری، رویدادی در فضای شما ثبت نمی‌شود.</p>
            <a href="/panel/partner/verification"
              className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
              پیگیری تأیید همکاری <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {isApproved && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 text-2xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>🏠</div>
          <p className="text-white font-bold mb-2">هنوز رویدادی ثبت نشده</p>
          <p className="text-slate-500 text-sm max-w-sm">
            رویدادها توسط تیم راوی بر اساس ظرفیت و امکانات فضای شما رزرو می‌شوند. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {events.map((e: any) => (
          <div key={e.id} className="p-4 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p className="text-white font-bold text-sm">{e.title || e.name || "رویداد"}</p>
              <div className="flex flex-wrap gap-3 text-slate-500 text-xs mt-1">
                {e.date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(e.date).toLocaleString("fa-IR")}</span>}
                {e.location && <span className="flex items-center gap-1"><MapPin size={11} />{e.location}</span>}
                {e.capacity && (
                  <span className="flex items-center gap-1">
                    <Users size={11} />{toPersian(e.current_participants || e.current_bookings || 0)}/{toPersian(e.capacity)} نفر
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
              {e.status || "تأیید شده"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

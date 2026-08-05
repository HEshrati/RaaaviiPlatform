"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Video, MapPin, CheckCircle2,
  XCircle, AlertCircle, Users, Heart, ChevronLeft
} from "lucide-react";

const API = "https://raaviiplatform.com";

const STATUS: Record<string, { label:string; color:string; icon:any }> = {
  confirmed:  { label:"تأیید شده",     color:"#22c55e", icon:CheckCircle2 },
  pending:    { label:"در انتظار",      color:"#f59e0b", icon:AlertCircle },
  cancelled:  { label:"لغو شده",       color:"#ef4444", icon:XCircle },
  completed:  { label:"برگزار شده",    color:"#6366f1", icon:CheckCircle2 },
  attended:   { label:"شرکت کرده",     color:"#22c55e", icon:CheckCircle2 },
  no_show:    { label:"غایب",           color:"#ef4444", icon:XCircle },
};

function BookingCard({ b }: { b: any }) {
  const effectiveStatus = b.attendance_marked_at
    ? (b.attended ? 'attended' : 'no_show')
    : b.status;
  const st = STATUS[effectiveStatus] || STATUS.pending;
  const StIcon = st.icon;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-black text-slate-900 text-sm flex-1 leading-relaxed">
          {b.event?.title || b.title || "رزرو"}
        </h4>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 mr-2"
          style={{ background:`${st.color}15`, color:st.color }}>
          <StIcon size={11} />
          {st.label}
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-slate-500">
        {(b.event?.start_date || b.start_date) && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} />
            {new Date(b.event?.start_date || b.start_date).toLocaleDateString("fa-IR")}
          </div>
        )}
        {(b.event?.city || b.city) && (
          <div className="flex items-center gap-1.5">
            {b.event?.is_online ? <Video size={11}/> : <MapPin size={11}/>}
            {b.event?.is_online ? "آنلاین" : b.event?.city || b.city}
          </div>
        )}
        {b.cancellation_reason && (
          <div className="flex items-start gap-1.5 text-red-400">
            <XCircle size={11} className="mt-0.5 flex-shrink-0"/>
            <span>دلیل لغو: {b.cancellation_reason}</span>
          </div>
        )}
      </div>
      {b.event?.id && (
        <Link href={`/events/${b.event.id}`}
          className="mt-3 text-xs font-bold text-orange-500 flex items-center gap-1 hover:gap-2 transition-all">
          مشاهده رویداد <ChevronLeft size={12}/>
        </Link>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  const [tab, setTab] = useState<"fun"|"therapy">("fun");
  const [funBookings, setFunBookings] = useState<any[]>([]);
  const [therapyBookings, setTherapyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const headers = { Authorization:`Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/bookings/my`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/my-therapist/sessions`, { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([events, therapy]) => {
      setFunBookings(Array.isArray(events) ? events : events?.bookings || []);
      setTherapyBookings(Array.isArray(therapy) ? therapy : therapy?.sessions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id:"fun",     label:"سرگرمی و دورهمی",    icon:Users,  count:funBookings.length },
    { id:"therapy", label:"دوست روانشناس من",    icon:Heart,  count:therapyBookings.length },
  ];

  const list = tab==="fun" ? funBookings : therapyBookings;

  return (
    <div className="min-h-screen pb-24" dir="rtl"
      style={{ background:"linear-gradient(135deg,#f8fafc,#f0f4ff)" }}>
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"0 4px 16px rgba(255,107,0,0.3)" }}>
            <Calendar size={20} className="text-slate-800"/>
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xl">رزروهای من</h1>
            <p className="text-slate-500 text-xs">تاریخچه رزروها و جلسات</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className="flex items-center gap-2 p-4 rounded-2xl transition-all text-right"
                style={{
                  background: active ? "white" : "rgba(255,255,255,0.6)",
                  border: `2px solid ${active ? "#FF6B00" : "rgba(0,0,0,0.06)"}`,
                  boxShadow: active ? "0 4px 16px rgba(255,107,0,0.15)" : "none",
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? "rgba(255,107,0,0.12)" : "rgba(0,0,0,0.05)" }}>
                  <Icon size={17} style={{ color: active ? "#FF6B00":"#64748b" }}/>
                </div>
                <div className="flex-1">
                  <p className="font-black text-xs" style={{ color:active?"#FF6B00":"#475569" }}>
                    {t.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{t.count} رزرو</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin"/>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
              style={{ background:"rgba(255,107,0,0.08)" }}>
              {tab==="fun" ? <Users size={28} className="text-orange-300"/> : <Heart size={28} className="text-orange-300"/>}
            </div>
            <p className="text-slate-700 font-bold mb-1">رزروی ندارید</p>
            <p className="text-slate-500 text-sm mb-4">
              {tab==="fun" ? "رویدادهای سرگرمی را مشاهده کنید" : "با یک روانشناس جلسه رزرو کنید"}
            </p>
            <Link href={tab==="fun" ? "/events" : "/dashboard/my-therapist"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
              {tab==="fun" ? "مشاهده رویدادها" : "مشاهده روانشناسان"}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((b: any, i: number) => (
              <BookingCard key={b.id || i} b={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

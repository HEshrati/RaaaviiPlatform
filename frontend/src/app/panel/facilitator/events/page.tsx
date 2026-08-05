"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, Calendar, CheckCircle2, Clock, Edit3, Eye, Loader2,
  MapPin, Plus, RefreshCw, UserCheck, Users, XCircle,
} from "lucide-react";
import { ApiEvent, fetchEventAttendees, fetchFacilitatorEvents, UserPublicProfile } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const fa = (value: number | string) => String(value ?? 0).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending_review: { label: "در انتظار بررسی ادمین", color: "#fbbf24", bg: "rgba(245,158,11,.12)", icon: Clock },
  approved: { label: "تأیید و منتشر شده", color: "#34d399", bg: "rgba(16,185,129,.12)", icon: CheckCircle2 },
  needs_revision: { label: "نیازمند اصلاح", color: "#fb923c", bg: "rgba(249,115,22,.12)", icon: RefreshCw },
  rejected: { label: "رد شده", color: "#f87171", bg: "rgba(239,68,68,.12)", icon: XCircle },
};

function Attendees({ event, onClose }: { event: ApiEvent; onClose: () => void }) {
  const [users, setUsers] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchEventAttendees(event.id).then(data => setUsers(data.users || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, [event.id]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-3xl border border-white/10 bg-[#171b29] p-5" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-black text-white">شرکت‌کنندگان</h3><p className="mt-1 text-[10px] text-slate-500">{event.title}</p></div><button onClick={onClose} className="text-slate-500"><XCircle size={20} /></button></div>
        {loading ? <Loader2 className="mx-auto my-10 animate-spin text-orange-400" /> : users.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">هنوز رزروی ثبت نشده است.</p> :
          <div className="space-y-2">{users.map(user => <div key={user.id} className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">{(user.name || "ک").charAt(0)}</span><div><p className="text-xs font-bold text-white">{user.name || "کاربر"}</p><p className="mt-1 text-[9px] text-slate-500">{user.mobileNumber || ""}</p></div></div>)}</div>}
      </div>
    </div>
  );
}

export default function FacilitatorEventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [status, setStatus] = useState("not_started");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ApiEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API}/api/facilitator/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.ok ? await response.json() : { status: "not_started" };
      const currentStatus = data?.status || "not_started";
      setStatus(currentStatus);
      if (["approved", "active"].includes(currentStatus)) {
        const eventData = await fetchFacilitatorEvents();
        setEvents(eventData.events || []);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      setError(err.message || "دریافت رویدادها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const isApproved = ["approved", "active"].includes(status);

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-orange-400" /></div>;

  return (
    <div dir="rtl" className="mx-auto max-w-4xl">
      {selected && <Attendees event={selected} onClose={() => setSelected(null)} />}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-black text-white">مدیریت رویدادها</h1><p className="mt-1 text-xs text-slate-500">ثبت پیشنهاد، پیگیری تأیید و مدیریت رویدادهای منتشرشده</p></div>
        {isApproved && <Link href="/panel/facilitator/events/new" className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/15"><Plus size={15} /> پیشنهاد رویداد جدید</Link>}
      </div>

      {!isApproved && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[.07] p-4"><AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" /><div><p className="text-sm font-bold text-amber-300">دسترسی محدود</p><p className="mt-1 text-xs leading-6 text-slate-400">برای پیشنهاد و مدیریت رویداد، ابتدا پروفایل تسهیلگری شما باید توسط ادمین تأیید شود.</p><Link href="/panel/facilitator/profile" className="mt-2 inline-flex text-xs font-bold text-orange-400">تکمیل پروفایل ←</Link></div></div>}
      {error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4 text-xs text-red-300">{error}</div>}

      {isApproved && events.length === 0 ? (
        <div className="rounded-3xl border border-white/[.06] bg-white/[.025] py-16 text-center">
          <Calendar size={34} className="mx-auto text-slate-700" />
          <p className="mt-4 text-sm font-black text-white">هنوز رویدادی پیشنهاد نکرده‌اید</p>
          <p className="mt-2 text-xs text-slate-500">درخواست شما پس از بررسی ادمین منتشر می‌شود.</p>
          <Link href="/panel/facilitator/events/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white"><Plus size={14} /> ثبت اولین رویداد</Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map(event => {
            const cfg = STATUS[event.approval_status || "approved"] || STATUS.approved;
            const StatusIcon = cfg.icon;
            const start = event.start_date || event.startDate;
            const reserved = event.current_bookings || event.reservedCount || 0;
            const canEdit = ["approved", "pending_review", "needs_revision"].includes(event.approval_status || "approved");
            return (
              <article key={event.id} className="rounded-3xl border border-white/[.07] bg-white/[.035] p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="truncate text-sm font-black text-white">{event.title}</h2>{start && <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><Calendar size={11} />{new Date(start).toLocaleString("fa-IR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}</div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black" style={{ color: cfg.color, background: cfg.bg }}><StatusIcon size={10} />{cfg.label}</span>
                </div>
                <div className="flex flex-wrap gap-3 border-y border-white/[.055] py-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={11} />{event.city || "—"}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{fa(reserved)} از {fa(event.capacity)}</span>
                  <span>{Number(event.price || 0) ? `${fa(Number(event.price).toLocaleString("en-US"))} ریال` : "رایگان"}</span>
                </div>
                {event.review_note && <p className="mt-3 rounded-xl bg-amber-400/[.06] p-2.5 text-[10px] leading-5 text-amber-200">یادداشت ادمین: {event.review_note}</p>}
                <div className="mt-3 flex gap-2">
                  {event.approval_status === "approved" && <button onClick={() => setSelected(event)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[.05] py-2 text-[10px] font-bold text-slate-300"><Users size={12} /> شرکت‌کنندگان</button>}
                  {event.approval_status === "approved" && <Link href={`/panel/facilitator/events/${event.id}/attendance`} className="flex h-8 items-center justify-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 text-[10px] font-bold text-emerald-300"><UserCheck size={12} /> حضور</Link>}
                  {event.approval_status === "approved" && <Link href={`/events/${event.id}`} className="flex h-8 w-9 items-center justify-center rounded-xl bg-white/[.05] text-slate-400"><Eye size={13} /></Link>}
                  {canEdit && <Link href={`/panel/facilitator/events/${event.id}/edit`} className="flex h-8 items-center justify-center gap-1 rounded-xl bg-orange-500/10 px-3 text-[10px] font-bold text-orange-400"><Edit3 size={12} /> ویرایش</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

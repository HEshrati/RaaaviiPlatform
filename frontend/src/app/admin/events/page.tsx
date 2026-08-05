"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  fetchMyAdminEvents,
  fetchAdminEventRequests,
  reviewFacilitatorEvent,
  fetchEventAttendees,
  ApiEvent,
  UserPublicProfile,
  isAdminPhone,
} from "@/lib/api";
import { Calendar, Users, Eye, Edit, X, User, Phone, MapPin, CheckCircle2, RotateCcw, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

function AttendeeModal({
  event,
  onClose,
}: {
  event: ApiEvent;
  onClose: () => void;
}) {
  const [attendees, setAttendees] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventAttendees(event.id)
      .then((res) => setAttendees(res.users))
      .catch(() => setAttendees([]))
      .finally(() => setLoading(false));
  }, [event.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col border border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h3 className="font-black text-white">رزرو‌کنندگان</h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">هنوز کسی رزرو نکرده است.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendees.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <User size={18} className="text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {user.name || "کاربر"}
                    </p>
                    {user.mobileNumber && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-slate-500" />
                        <span className="text-xs text-slate-500 font-mono">
                          {user.mobileNumber}
                        </span>
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-slate-500" />
                        <span className="text-xs text-slate-500">{user.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CITIES = [
  "همه شهرها", "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج",
  "قم", "اهواز", "کرمانشاه", "ارومیه", "رشت", "زاهدان",
];

export default function AdminEventsPage() {
  const { state } = useApp();
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [requests, setRequests] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [cityFilter, setCityFilter] = useState("همه شهرها");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!isAdminPhone(state.user?.mobileNumber)) {
      router.replace("/dashboard");
      return;
    }

    Promise.all([fetchMyAdminEvents(), fetchAdminEventRequests()])
      .then(([all, pending]) => {
        setEvents(all.events || []);
        setRequests(pending.events || []);
      })
      .catch(() => { setEvents([]); setRequests([]); })
      .finally(() => setLoading(false));
  }, [state.user]);

  const filteredEvents = events.filter((ev) => {
    if (ev.approval_status === "pending_review") return false;
    const matchCity = cityFilter === "همه شهرها" || (ev as any).city === cityFilter;
    const matchSearch = !searchQ.trim() || ev.title.includes(searchQ.trim());
    return matchCity && matchSearch;
  });

  async function handleReview(event: ApiEvent, action: "approve" | "reject" | "request-revision") {
    const note = action === "approve"
      ? (window.prompt("یادداشت تأیید (اختیاری):", "") || "")
      : window.prompt(action === "reject" ? "دلیل رد رویداد:" : "مواردی که باید اصلاح شود:");
    if (action !== "approve" && !note?.trim()) return;
    setReviewing(event.id + action);
    setNotice("");
    try {
      const updated = await reviewFacilitatorEvent(event.id, action, note || undefined);
      setRequests(previous => previous.filter(item => item.id !== event.id));
      setEvents(previous => [updated, ...previous.filter(item => item.id !== event.id)]);
      setNotice(action === "approve" ? "رویداد تأیید و منتشر شد." : action === "reject" ? "رویداد رد شد." : "درخواست اصلاح برای تسهیلگر ارسال شد.");
    } catch (err: any) {
      setNotice(err.message || "بررسی رویداد ناموفق بود");
    } finally {
      setReviewing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5">
      {selectedEvent && (
        <AttendeeModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* هدر */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">رویدادهای همنشینی</h1>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-orange-400 transition shadow-lg shadow-orange-500/30"
        >
          + همنشینی جدید
        </Link>
      </div>

      {notice && <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[.07] px-4 py-3 text-xs text-orange-200">{notice}</div>}

      {/* درخواست‌های تسهیلگران */}
      <section className="rounded-3xl border border-amber-400/15 bg-amber-400/[.035] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white">درخواست‌های تسهیلگران</h2>
            <p className="mt-1 text-[10px] text-slate-500">این رویدادها تا زمان تأیید در سایت منتشر نمی‌شوند.</p>
          </div>
          <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-black text-amber-300">{requests.length} درخواست</span>
        </div>
        {requests.length === 0 ? <p className="py-5 text-center text-xs text-slate-500">درخواست بررسی‌نشده‌ای وجود ندارد.</p> :
          <div className="space-y-3">{requests.map(event => {
            const start = event.start_date || event.startDate;
            return <article key={event.id} className="rounded-2xl border border-white/[.07] bg-slate-900/45 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white">{event.title}</h3>
                  <p className="mt-1 text-[10px] text-slate-500">تسهیلگر: {event.creator_name || "—"} {event.creator_phone ? `• ${event.creator_phone}` : ""}</p>
                  {start && <p className="mt-2 text-[10px] text-slate-400">{new Date(start).toLocaleString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} • {event.city || "بدون شهر"}</p>}
                </div>
                <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-black text-amber-300">در انتظار بررسی</span>
              </div>
              {event.description && <p className="mt-3 line-clamp-3 text-[10px] leading-5 text-slate-400">{event.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[.055] pt-3">
                <button disabled={Boolean(reviewing)} onClick={() => handleReview(event, "approve")} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-[10px] font-black text-emerald-300 disabled:opacity-50">{reviewing === event.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} تأیید و انتشار</button>
                <button disabled={Boolean(reviewing)} onClick={() => handleReview(event, "request-revision")} className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-[10px] font-black text-amber-300 disabled:opacity-50"><RotateCcw size={12} /> درخواست اصلاح</button>
                <button disabled={Boolean(reviewing)} onClick={() => handleReview(event, "reject")} className="flex items-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-[10px] font-black text-red-300 disabled:opacity-50"><XCircle size={12} /> رد</button>
              </div>
            </article>;
          })}</div>}
      </section>

      {/* فیلتر شهر + جستجو */}
      <div className="app-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1.5 block">فیلتر شهر</label>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.slice(0, 6).map((c) => (
              <button key={c} onClick={() => setCityFilter(c)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                  cityFilter === c
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}>
                {c}
              </button>
            ))}
            <select
              value={CITIES.indexOf(cityFilter) >= 6 ? cityFilter : ""}
              onChange={(e) => { if (e.target.value) setCityFilter(e.target.value); }}
              className="text-xs px-2 py-1.5 rounded-xl bg-slate-700 text-slate-300 border-0 outline-none"
            >
              <option value="">سایر شهرها</option>
              {CITIES.slice(6).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="sm:w-52">
          <label className="text-xs text-slate-400 mb-1.5 block">جستجو</label>
          <input
            type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            placeholder="عنوان همنشینی..."
            className="w-full bg-slate-700 text-white text-sm rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-500"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="app-card rounded-3xl p-8 text-center">
          <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-white mb-2">همنشینی‌ای یافت نشد</h3>
          <p className="text-slate-400 text-sm mb-5">اولین همنشینی خود را ایجاد کنید.</p>
          <Link
            href="/admin/events/new"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-400 transition"
          >
            ایجاد همنشینی
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const reserved = ev.current_bookings || ev.reservedCount || 0;
            const fillPercent = Math.round((reserved / ev.capacity) * 100);
            const startDate = ev.startDate || ev.start_date;

            return (
              <div key={ev.id} className="app-card rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-sm line-clamp-2 mb-1">
                      {ev.title}
                    </h4>
                    {startDate && (
                      <p className="text-xs text-slate-400">
                        📅{" "}
                        {new Date(startDate).toLocaleDateString("fa-IR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      ev.is_active
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {ev.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </div>

                {/* نوار ظرفیت */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">
                      {reserved} از {ev.capacity} نفر
                    </span>
                    <span className="text-orange-400 font-bold">{fillPercent}٪</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                {/* دکمه‌ها */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedEvent(ev)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
                  >
                    <Users size={14} />
                    رزرو‌کنندگان ({reserved})
                  </button>
                  <Link
                    href={`/events/${ev.id}`}
                    className="w-10 h-9 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center transition"
                  >
                    <Eye size={15} className="text-slate-300" />
                  </Link>
                  <Link
                    href={`/admin/events/${ev.id}/edit`}
                    className="w-10 h-9 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl flex items-center justify-center transition"
                  >
                    <Edit size={15} className="text-orange-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

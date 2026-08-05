"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle, Merge } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EventMergePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/events`, { headers: { Authorization: `Bearer ${token || ""}` } })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("دریافت رویدادها ناموفق بود")))
      .then((data) => {
        const list = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
        setEvents(list.filter((event: any) => !event.merged_into && event.is_active !== false));
      })
      .catch((error) => setResult({ success: false, message: error.message || "خطا در دریافت رویدادها" }))
      .finally(() => setLoading(false));
  }, []);

  const source = useMemo(() => events.find((event) => event.id === sourceId), [events, sourceId]);
  const target = useMemo(() => events.find((event) => event.id === targetId), [events, targetId]);
  const canMerge = Boolean(source && target && Number(source.current_bookings || 0) + Number(target.current_bookings || 0) <= Number(target.capacity || 0));

  async function handleMerge() {
    if (!sourceId || !targetId || sourceId === targetId) {
      setResult({ success: false, message: "دو رویداد متفاوت انتخاب کنید" });
      return;
    }
    setMerging(true);
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/events/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` },
        body: JSON.stringify({ sourceEventId: sourceId, targetEventId: targetId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join("، ") : data.message || "خطا در ادغام رویدادها");
      setResult({ success: true, message: `✅ ${data.movedUsers || 0} نفر منتقل شدند` });
      setEvents((items) => items.filter((event) => event.id !== sourceId));
      setSourceId("");
      setTargetId("");
    } catch (error: any) {
      setResult({ success: false, message: error?.message || "خطای شبکه؛ دوباره تلاش کنید" });
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="p-4 space-y-5" dir="rtl">
      <div className="flex items-center gap-3">
        <Merge size={22} className="text-orange-400" />
        <h1 className="text-xl font-black text-white">ادغام رویدادها</h1>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-300 text-sm font-bold mb-1">ادغام خودکار</p>
        <p className="text-slate-400 text-xs">سیستم هر ۳۰ دقیقه رویدادهای ۱۲ ساعت آینده را بررسی می‌کند. این صفحه برای ادغام دستی و کنترل‌شده است.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold text-sm mb-3">رویداد مبدأ (که ادغام می‌شود)</h3>
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="w-full bg-slate-700 text-white rounded-xl p-3 text-sm outline-none border border-white/10">
              <option value="">انتخاب کنید...</option>
              {events.filter((event) => event.id !== targetId).map((event) => (
                <option key={event.id} value={event.id}>{event.title} — {event.current_bookings}/{event.capacity} نفر — {event.city}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center"><div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"><ArrowRight size={18} className="text-orange-400 rotate-90" /></div></div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold text-sm mb-3">رویداد مقصد (که کاربران را دریافت می‌کند)</h3>
            <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="w-full bg-slate-700 text-white rounded-xl p-3 text-sm outline-none border border-white/10">
              <option value="">انتخاب کنید...</option>
              {events.filter((event) => event.id !== sourceId).map((event) => (
                <option key={event.id} value={event.id}>{event.title} — {event.current_bookings}/{event.capacity} نفر — {event.city}</option>
              ))}
            </select>
          </div>

          {source && target && (
            <div className={`rounded-2xl p-4 border ${canMerge ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <p className="text-sm font-bold mb-2 text-white">پیش‌نمایش:</p>
              <p className="text-xs text-slate-400">از: <span className="text-white">{source.title}</span> ({source.current_bookings} نفر)</p>
              <p className="text-xs text-slate-400">به: <span className="text-white">{target.title}</span> ({target.current_bookings} نفر)</p>
              <p className={`text-xs mt-1 ${canMerge ? "text-green-400" : "text-red-400"}`}>
                {Number(source.current_bookings || 0) + Number(target.current_bookings || 0)}/{target.capacity} نفر {!canMerge && "— ⚠️ ظرفیت کافی نیست"}
              </p>
            </div>
          )}

          {result && (
            <div className={`rounded-2xl p-4 flex items-center gap-3 ${result.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
              {result.success ? <CheckCircle size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
              <p className={`text-sm ${result.success ? "text-green-300" : "text-red-300"}`}>{result.message}</p>
            </div>
          )}

          <button onClick={handleMerge} disabled={!canMerge || merging} className="w-full py-3 rounded-2xl font-black text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {merging ? "در حال ادغام..." : "ادغام رویدادها"}
          </button>
        </>
      )}
    </div>
  );
}

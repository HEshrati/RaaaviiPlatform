"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Loader2, Users, XCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "درخواست ناموفق بود");
  return data;
}

export default function FacilitatorAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await request(`/api/attendance/event/${id}`));
    } catch (err: any) {
      setMessage(err.message || "دریافت حضور و غیاب ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function mark(userId: string, attended: boolean) {
    setMarking(userId);
    setMessage("");
    try {
      await request(`/api/attendance/event/${id}/mark`, {
        method: "POST",
        body: JSON.stringify({ userId, attended }),
      });
      await load();
      setMessage(attended ? "حضور با موفقیت ثبت شد." : "غیبت با موفقیت ثبت شد.");
    } catch (err: any) {
      setMessage(err.message || "ثبت حضور ناموفق بود");
    } finally {
      setMarking(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-orange-400" /></div>;

  return (
    <div dir="rtl" className="mx-auto max-w-3xl">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowRight size={14} /> بازگشت به رویدادها</button>
      <div className="mb-5 rounded-3xl border border-white/[.07] bg-white/[.035] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-lg font-black text-white">{data?.event?.title || "حضور و غیاب"}</h1><p className="mt-2 text-xs text-slate-500">{data?.event?.city || ""} {data?.event?.start_date ? `• ${new Date(data.event.start_date).toLocaleString("fa-IR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}</p></div>
          {!data?.event?.eventStarted && <span className="rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-black text-amber-300">رویداد هنوز شروع نشده</span>}
        </div>
      </div>

      {data?.summary && <div className="mb-5 grid grid-cols-3 gap-3">{[
        ["حاضر", data.summary.attended, "#34d399"], ["غایب", data.summary.notAttended, "#f87171"], ["ثبت‌نشده", data.summary.notMarked, "#fbbf24"],
      ].map(([label, value, color]) => <div key={String(label)} className="rounded-2xl border border-white/[.06] bg-white/[.03] p-3 text-center"><strong className="block text-xl font-black" style={{ color: String(color) }}>{String(value)}</strong><span className="mt-1 block text-[10px] text-slate-500">{label}</span></div>)}</div>}

      {message && <div className="mb-4 rounded-2xl border border-orange-400/20 bg-orange-400/[.07] p-3 text-center text-xs text-orange-200">{message}</div>}

      <div className="space-y-2">
        {(data?.attendees || []).map((attendee: any) => (
          <div key={attendee.userId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.065] bg-white/[.03] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-black text-orange-300">{(attendee.name || "ک").charAt(0)}</span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-black text-white">{attendee.name || "کاربر"}</p>{attendee.warningCount > 0 && <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] text-amber-300"><AlertTriangle size={8} />{attendee.warningCount} هشدار</span>}</div><p className="mt-1 text-[9px] text-slate-500">{attendee.phone || ""}</p></div>
            {data?.event?.eventStarted && <div className="flex gap-2">
              <button disabled={marking === attendee.userId} onClick={() => mark(attendee.userId, true)} className={`flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black ${attendee.attended ? "bg-emerald-500 text-white" : "bg-white/[.05] text-slate-400"}`}><CheckCircle2 size={13} /> حاضر</button>
              <button disabled={marking === attendee.userId} onClick={() => mark(attendee.userId, false)} className={`flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black ${attendee.attendanceMarkedAt && !attendee.attended ? "bg-red-500 text-white" : "bg-white/[.05] text-slate-400"}`}><XCircle size={13} /> غایب</button>
            </div>}
          </div>
        ))}
        {!data?.attendees?.length && <div className="rounded-3xl border border-white/[.06] bg-white/[.025] py-14 text-center"><Users size={30} className="mx-auto text-slate-700" /><p className="mt-3 text-xs text-slate-500">هنوز رزروی ثبت نشده است.</p></div>}
      </div>
    </div>
  );
}

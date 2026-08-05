"use client";

import { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  MapPin,
  Trophy,
  RefreshCw,
  BarChart2,
  Users,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CARD = {
  background: "linear-gradient(145deg, #1B2A4A 0%, #132038 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
};

function Stars({ r }: { r: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={
            i <= Math.round(r)
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-600"
          }
        />
      ))}
      <span className="text-xs text-slate-400 mr-1">
        {Number(r).toFixed(1)}
      </span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const cfg =
    rank === 1
      ? {
          bg: "rgba(234,179,8,0.2)",
          color: "#facc15",
          border: "rgba(234,179,8,0.4)",
        }
      : rank === 2
        ? {
            bg: "rgba(148,163,184,0.2)",
            color: "#94a3b8",
            border: "rgba(148,163,184,0.3)",
          }
        : {
            bg: "rgba(180,83,9,0.15)",
            color: "#92400e",
            border: "rgba(180,83,9,0.3)",
          };
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {rank}
    </div>
  );
}

export default function PopularProgramsPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"events" | "types" | "cities">("events");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const token =
      localStorage.getItem("token") || "";
    fetch(`${API}/api/intelligence/popular-programs?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!data?.summary)
    return (
      <div className="p-6 text-center">
        <Trophy size={40} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">داده‌ای یافت نشد</p>
        <button
          onClick={load}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-orange-400"
          style={{
            background: "rgba(255,107,0,0.1)",
            border: "1px solid rgba(255,107,0,0.2)",
          }}
        >
          تلاش مجدد
        </button>
      </div>
    );

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto" dir="rtl">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(234,179,8,0.15)",
              border: "1px solid rgba(234,179,8,0.25)",
            }}
          >
            <Trophy size={18} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">
              محبوب‌ترین برنامه‌ها
            </h1>
            <p className="text-slate-500 text-xs">بر اساس امتیاز و نرخ حضور</p>
          </div>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "ایونت‌های ارزیابی‌شده",
            value: data.summary.totalEventsRated,
            icon: BarChart2,
            color: "#3b82f6",
          },
          {
            label: "میانگین امتیاز",
            value: `${Number(data.summary.overallAvgRating || 0).toFixed(1)} ⭐`,
            icon: Star,
            color: "#f59e0b",
          },
          {
            label: "محبوب‌ترین نوع",
            value: data.summary.mostPopularType || "—",
            icon: TrendingUp,
            color: "#22c55e",
          },
          {
            label: "محبوب‌ترین شهر",
            value: data.summary.mostPopularCity || "—",
            icon: MapPin,
            color: "#FF6B00",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={CARD}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `${s.color}18` }}
            >
              <s.icon size={15} style={{ color: s.color }} />
            </div>
            <p className="text-white font-black text-sm">{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* تب‌ها */}
      <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
        {[
          { k: "events", l: "برنامه‌ها" },
          { k: "types", l: "انواع" },
          { k: "cities", l: "شهرها" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.k ? "bg-orange-500 text-white" : "text-slate-400"}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* محتوای تب‌ها */}
      <div className="space-y-3">
        {/* برنامه‌ها */}
        {tab === "events" &&
          (data.topEvents || []).map((e: any, i: number) => (
            <div
              key={e.eventId || i}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={CARD}
            >
              <RankBadge rank={i + 1} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm line-clamp-1 mb-1">
                  {e.title}
                </p>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <Stars r={e.avgRating || 0} />
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={10} />
                    {e.city || "—"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Users size={10} />
                    {e.attendanceRate || 0}% حضور
                  </span>
                </div>
                {/* نوار محبوبیت */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${e.popularityScore || 0}%`,
                        background: "linear-gradient(90deg,#FF6B00,#f59e0b)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-10 text-left">
                    {e.popularityScore || 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}

        {/* انواع رویداد */}
        {tab === "types" &&
          (data.topEventTypes || []).map((t: any, i: number) => (
            <div
              key={t.type || i}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={CARD}
            >
              <RankBadge rank={i + 1} />
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">
                  {t.label || t.type}
                </p>
                <div className="flex items-center gap-3">
                  <Stars r={t.avgRating || 0} />
                  <span className="text-xs text-slate-400">
                    {t.count} ایونت
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-black text-lg">{t.count}</p>
                <p className="text-slate-600 text-[10px]">ایونت</p>
              </div>
            </div>
          ))}

        {/* شهرها */}
        {tab === "cities" &&
          (data.topCities || []).map((c: any, i: number) => (
            <div
              key={c.city || i}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={CARD}
            >
              <RankBadge rank={i + 1} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={13} className="text-orange-400" />
                  <p className="text-white font-bold text-sm">{c.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars r={c.avgRating || 0} />
                  <span className="text-xs text-slate-400">
                    {c.count} ایونت
                  </span>
                </div>
              </div>
              {/* نوار نسبی */}
              <div className="w-20">
                <div
                  className="h-1.5 rounded-full overflow-hidden mb-1"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width: `${Math.min(((c.count || 0) / (data.topCities?.[0]?.count || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-left">
                  {c.count} رویداد
                </p>
              </div>
            </div>
          ))}

        {/* خالی بودن */}
        {((tab === "events" && !data.topEvents?.length) ||
          (tab === "types" && !data.topEventTypes?.length) ||
          (tab === "cities" && !data.topCities?.length)) && (
          <div className="text-center py-10 text-slate-500">
            <Trophy size={36} className="mx-auto mb-3 opacity-20" />
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}

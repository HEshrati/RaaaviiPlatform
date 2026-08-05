"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, MapPin, Users, Sparkles, ArrowLeft, RefreshCw,
  CalendarDays, Tag, Filter, X, CheckCircle2,
} from "lucide-react";
import { getEventImage } from "@/lib/dynamic-images";

const SITE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
  : "https://raaviiplatform.com";

const CAT_COLORS: Record<string, string> = {
  hamneshin:"#FF6B00", hamsohbat:"#8b5cf6", hambazi:"#3b82f6", hampa:"#22c55e",
  hamamooz:"#ec4899", hamkar:"#f59e0b", hamfekr:"#06b6d4", hamteymi:"#10b981",
  hamghesse:"#f97316", hamziste:"#14b8a6", hamravan:"#1e40af", default:"#64748b",
};
const CAT_EMOJI: Record<string, string> = {
  hamneshin:"☕", hambazi:"🎲", hamsohbat:"💬", hampa:"🥾", hamamooz:"📚",
  hamkar:"🤝", hamfekr:"💡", hamteymi:"⚽", hamghesse:"📖", hamziste:"🌱",
  hamravan:"🧠", dustravan:"🩺",
};
const CAT_LABEL: Record<string, string> = {
  hamneshin:"همنشینی", hambazi:"هم‌بازی", hamsohbat:"هم‌صحبت", hampa:"هم‌پا",
  hamamooz:"هم‌آموز", hamkar:"هم‌کار", hamfekr:"هم‌فکر", hamteymi:"هم‌تیمی",
  hamghesse:"هم‌قصه", hamziste:"هم‌زیست", hamravan:"هم‌روان", dustravan:"دوست‌روان",
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function getToken() {
  return getCookie("token") ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
}

interface EventItem {
  id: string;
  title: string;
  category?: string;
  event_type?: string;
  city?: string;
  start_date?: string;
  price?: string | number;
  capacity?: number;
  image_url?: string;
  matchScore?: number;
  score?: number;
  reason?: string;
}

export default function RecommendedEventsPage() {
  const [allEvents, setAllEvents]       = useState<EventItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [userCity, setUserCity]         = useState("");
  const [hasTests, setHasTests]         = useState(false);
  const [recTypes, setRecTypes]         = useState<string[]>([]);
  const [filterCity, setFilterCity]     = useState(true);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [showFilter, setShowFilter]     = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      fetch(`${SITE}/api/events?limit=40&status=active`)
        .then(r => r.ok ? r.json() : ({} as any))
        .then(d => setAllEvents(d?.events || []))
        .catch(() => setError("خطا در دریافت رویدادها"))
        .finally(() => setLoading(false));
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${SITE}/api/intelligence/my-recommendations`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${SITE}/api/profiles/me`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${SITE}/api/test-results/my`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(async ([recData, profileData, testData]) => {
      const city: string = (profileData as any)?.city || "";
      setUserCity(city);
      const testsDone = (((testData as any)?.results?.length) || 0) > 0;
      setHasTests(testsDone);
      const evTypes: string[] = (profileData as any)?.recommended_event_types || [];
      setRecTypes(evTypes);

      let events: EventItem[] = [];
      if ((recData as any)?.events?.length) {
        events = (recData as any).events;
      } else {
        const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";
        const d = await fetch(`${SITE}/api/events?limit=60&status=active${cityParam}`)
          .then(r => r.ok ? r.json() : {}).catch(() => ({}));
        events = (d as any)?.events || [];
      }
      setAllEvents(events);
    }).catch(() => setError("خطا در دریافت رویدادها"))
      .finally(() => setLoading(false));
  }, []);

  const availableCats = useMemo(() => {
    const cats = new Set<string>();
    allEvents.forEach(ev => {
      const c = (ev.category || ev.event_type || "").toLowerCase();
      if (c) cats.add(c);
    });
    return Array.from(cats);
  }, [allEvents]);

  const filtered = useMemo(() => {
    let list = [...allEvents];
    if (filterCity && userCity) {
      list = list.filter(ev =>
        !ev.city ||                          // بدون شهر → نشون بده
        ev.city === "آنلاین" ||              // آنلاین → همیشه نشون بده
        ev.city.includes(userCity)           // شهر کاربر
      );
    }
    if (selectedCats.length > 0) {
      list = list.filter(ev => {
        const c = (ev.category || ev.event_type || "").toLowerCase();
        return selectedCats.includes(c);
      });
    }
    return list;
  }, [allEvents, filterCity, userCity, selectedCats]);

  const activeFilterCount = (filterCity && userCity ? 1 : 0) + selectedCats.length;

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }
  function clearFilters() { setFilterCity(false); setSelectedCats([]); }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24" dir="rtl">

      <div className="bg-white border-b border-slate-100 px-4 py-5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"4px 4px 12px rgba(255,107,0,0.3)" }}>
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 font-black text-xl">رویدادهای پیشنهادی</h1>
                <p className="text-slate-500 text-xs">
                  {hasTests
                    ? "بر اساس تست‌های شخصیت و موقعیت شما"
                    : userCity
                    ? `رویدادهای ${userCity}`
                    : "همه رویدادهای فعال"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilter(v => !v)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: showFilter ? "linear-gradient(135deg,#FF6B00,#f97316)" : "rgba(255,107,0,0.08)",
                color: showFilter ? "#fff" : "#FF6B00",
              }}
            >
              <Filter size={14} />
              فیلتر
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {userCity && (
              <button onClick={() => setFilterCity(v => !v)}
                className="text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-all"
                style={{
                  background: filterCity ? "rgba(59,130,246,0.12)" : "rgba(100,116,139,0.08)",
                  color: filterCity ? "#3b82f6" : "#94a3b8",
                  border: filterCity ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                }}>
                <MapPin size={9} />{userCity}
                {filterCity ? <CheckCircle2 size={9} /> : <X size={9} />}
              </button>
            )}
            {hasTests && (
              <span className="text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1"
                style={{ background:"rgba(255,107,0,0.08)", color:"#FF6B00" }}>
                <Tag size={9} />بر اساس تست شخصیت
              </span>
            )}
            {selectedCats.map(c => (
              <button key={c} onClick={() => toggleCat(c)}
                className="text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1"
                style={{ background:"rgba(139,92,246,0.12)", color:"#8b5cf6", border:"1px solid rgba(139,92,246,0.25)" }}>
                {CAT_EMOJI[c] || "✨"} {CAT_LABEL[c] || c}<X size={9} />
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="text-[11px] px-2 py-1.5 rounded-full font-bold text-slate-400 flex items-center gap-0.5">
                <X size={10} /> پاک‌کردن
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b border-slate-100"
          >
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
              {userCity && (
                <div>
                  <p className="text-xs font-black text-slate-500 mb-2 flex items-center gap-1">
                    <MapPin size={11} /> فیلتر شهر
                  </p>
                  <button onClick={() => setFilterCity(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all"
                    style={{
                      background: filterCity ? "rgba(59,130,246,0.1)" : "rgba(100,116,139,0.06)",
                      color: filterCity ? "#3b82f6" : "#64748b",
                      border: filterCity ? "1.5px solid rgba(59,130,246,0.3)" : "1.5px solid rgba(100,116,139,0.15)",
                    }}>
                    <MapPin size={14} />
                    فقط رویدادهای {userCity}
                    {filterCity && <CheckCircle2 size={14} className="mr-auto" />}
                  </button>
                </div>
              )}
              <div>
                <p className="text-xs font-black text-slate-500 mb-2 flex items-center gap-1">
                  <Tag size={11} /> نوع رویداد
                  {recTypes.length > 0 && (
                    <span className="text-[10px] text-orange-500 font-bold mr-1">
                      (پیشنهادی بر اساس تست شما)
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCats.map(cat => {
                    const isRec = recTypes.includes(cat);
                    const isSelected = selectedCats.includes(cat);
                    return (
                      <button key={cat} onClick={() => toggleCat(cat)}
                        className="text-[12px] px-3 py-2 rounded-2xl font-bold flex items-center gap-1.5 transition-all"
                        style={{
                          background: isSelected ? `${CAT_COLORS[cat] || "#64748b"}20`
                            : isRec ? "rgba(255,107,0,0.06)" : "rgba(100,116,139,0.06)",
                          color: isSelected ? CAT_COLORS[cat] || "#64748b"
                            : isRec ? "#FF6B00" : "#64748b",
                          border: isSelected ? `1.5px solid ${CAT_COLORS[cat] || "#64748b"}50`
                            : isRec ? "1.5px solid rgba(255,107,0,0.2)"
                            : "1.5px solid rgba(100,116,139,0.12)",
                        }}>
                        {CAT_EMOJI[cat] || "✨"}{CAT_LABEL[cat] || cat}
                        {isRec && !isSelected && (
                          <span className="text-[9px] bg-orange-500 text-white px-1 rounded-md">پیشنهاد</span>
                        )}
                        {isSelected && <CheckCircle2 size={11} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {!loading && !error && allEvents.length > 0 && (
          <p className="text-xs text-slate-400 font-bold">
            {filtered.length} رویداد{activeFilterCount > 0 ? " (فیلترشده)" : ""}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={28} className="text-orange-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-slate-400 text-sm">رویدادی با این فیلترها پیدا نشد</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="px-4 py-2 rounded-2xl text-sm font-bold text-orange-500 border border-orange-200">
                حذف فیلترها
              </button>
            )}
          </div>
        ) : (
          filtered.map((ev, idx) => {
            const cat = (ev.category || ev.event_type || "default").toLowerCase();
            const color = CAT_COLORS[cat] || CAT_COLORS.default;
            const price = ev.price ? Number(ev.price).toLocaleString("fa-IR") + " تومان" : "رایگان";
            const matchScore = ev.matchScore || ev.score || 0;
            const isTop = idx < 3 && matchScore > 50;
            return (
              <motion.div key={ev.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4) }}
                whileHover={{ y: -5, boxShadow: "0 16px 32px rgba(0,0,0,0.1)" }}
              >
                <Link href={`/events/${ev.id}`}
                  className="block bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer relative">
                  {isTop && (
                    <div className="absolute top-3 right-3 z-20 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> پیشنهاد ویژه
                    </div>
                  )}
                  <div className="relative h-48 overflow-hidden">
                    <img src={ev.image_url || getEventImage(cat, ev.id)} alt={ev.title}
                      className="w-full h-full object-cover transition-transform duration-700"
                      onError={e => { (e.target as HTMLImageElement).src = getEventImage(cat, ev.id); }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="px-4 py-2 rounded-2xl font-black text-sm text-white"
                        style={{ background:`linear-gradient(135deg,${color},${color}bb)` }}>
                        {price}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                        <span>{CAT_EMOJI[cat] || "✨"}</span>
                        {CAT_LABEL[cat] || ev.category || "رویداد"}
                      </div>
                    </div>
                    {matchScore > 0 && (
                      <div className="absolute bottom-12 left-4 z-10">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-500/90 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                          <Sparkles size={8} /> تطابق {Math.round(matchScore)}٪
                        </span>
                      </div>
                    )}
                    {ev.reason && (
                      <div className="absolute bottom-12 right-4 z-10">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm">
                          {ev.reason}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 left-4 text-white z-10">
                      <h3 className="font-black text-base leading-snug drop-shadow-lg line-clamp-2">{ev.title}</h3>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      {ev.start_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {new Date(ev.start_date).toLocaleDateString("fa-IR",{month:"short",day:"numeric"})}
                        </span>
                      )}
                      {ev.city && <span className="flex items-center gap-1"><MapPin size={11}/>{ev.city}</span>}
                      {ev.capacity && <span className="flex items-center gap-1"><Users size={11}/>{ev.capacity} نفر</span>}
                    </div>
                    <ArrowLeft size={16} className="text-slate-300" />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}

        {!hasTests && !loading && (
          <div className="bg-gradient-to-l from-orange-50 to-white rounded-3xl p-6 border border-orange-100 text-center mt-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)", boxShadow:"6px 6px 14px rgba(255,107,0,0.3)" }}>
              <Cpu size={24} className="text-white" />
            </div>
            <p className="text-orange-800 font-bold text-sm mb-4">با انجام تست‌ها، پیشنهادها هوشمندانه‌تر می‌شوند</p>
            <Link href="/dashboard/tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white"
              style={{ background:"linear-gradient(135deg,#FF6B00,#f97316)" }}>
              شروع تست‌ها <ArrowLeft size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { getEventImage } from "@/lib/eventImage";
import { ArrowRight, Clock, MapPin, Users, Zap, HeartPulse, Cpu, Lock, Users as UsersIcon, Gamepad2, MessageCircle, Lightbulb, Briefcase, Handshake, Compass, GraduationCap, BookOpen } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SITE = "https://raaviiplatform.com";
const CORE_TESTS = ["raavi_matching_basis_v1", "neo_ffi", "ecr_r", "erq", "iri"];

const CATS: Record<string, { title: string; banner: string; color: string; icon: any; locked?: boolean }> = {
  hamneshin: { title: "همنشین", banner: "دورهمی امن و گرم با آدم‌های هم‌فرکانس", color: "#6366f1", icon: UsersIcon },
  hamsohbat: { title: "هم‌صحبت", banner: "گفتگوهای عمیق و صمیمی با افراد هم‌فکر", color: "#f59e0b", icon: MessageCircle },
  hambazi:   { title: "هم‌بازی", banner: "یک شب هیجانی با بردگیم و بازی‌های گروهی", color: "#10B981", icon: Gamepad2 },
  hampa:     { title: "هم‌پا", banner: "پیاده‌روی و گردش در طبیعت", color: "#f43f5e", icon: Compass },
  hamamooz:  { title: "هم‌آموز", banner: "یادگیری مهارت‌های جدید در کنار دیگران", color: "#3b82f6", icon: GraduationCap },
  hamkar:    { title: "همکار", banner: "همکاری در پروژه‌ها و کارهای مشترک", color: "#ec4899", icon: Briefcase },
  hamfekr:   { title: "هم‌فکر", banner: "تبادل ایده و رویا با ذهن‌های خلاق", color: "#8b5cf6", icon: Lightbulb },
  hamteymi:  { title: "هم‌تیمی", banner: "فعالیت‌های ورزشی و تیمی مشترک", color: "#14b8a6", icon: Handshake },
  hamghesse: { title: "هم‌قصه", banner: "خواندن و نوشتن و تجربه‌ی داستان", color: "#ef4444", icon: BookOpen },
  hamziste:  { title: "هم‌زیسته", banner: "رویدادهای روانشناسی برای بهبود کیفیت زندگی", color: "#f43f5e", icon: HeartPulse },
  hamrovan:  { title: "هم‌روان", banner: "جلسات مشاوره با روانشناس راوی", color: "#3b82f6", icon: Cpu, locked: true },
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const cid = params.id;
  const cat = CATS[cid];
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coreTestsDone, setCoreTestsDone] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch(`${SITE}/api/test-results/my`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : ({} as any))
        .then(d => {
          const results = d?.results || d?.data || [];
          const done = new Set(results.map((r: any) => r.test_name));
          setCoreTestsDone(CORE_TESTS.filter(id => done.has(id)).length);
        }).catch(() => {});
    }
  }, []);

  // هدایت هم‌روان به my-therapist اگر قفل باز شده
  useEffect(() => {
    if (cid === "hamrovan" && coreTestsDone >= 5) {
      router.replace("/dashboard/my-therapist");
    }
  }, [cid, coreTestsDone, router]);

  if (!cat) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="text-center">
        <p className="text-slate-800 text-xl font-black mb-4">دسته‌بندی یافت نشد</p>
        <button onClick={() => router.push("/events")} className="px-5 py-2.5 rounded-xl text-white font-bold" style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>بازگشت</button>
      </div>
    </div>
  );

  // صفحه قفل هم‌روان
  if (cid === "hamrovan" && coreTestsDone < 5) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-100"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
        >
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(255,107,0,0.1)" }}>
            <Lock size={36} className="text-orange-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">هم‌روان قفل است</h2>
          <p className="text-slate-500 text-sm leading-7 mb-5">
            برای دسترسی به روانشناس راوی، ابتدا باید ۵ تست اصلی شخصیتی را تکمیل کنید تا پروفایل روانشناختی شما ساخته شود.
          </p>

          {/* نوار پیشرفت */}
          <div className="flex gap-2 items-center mb-2">
            {CORE_TESTS.map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-2 rounded-full transition-all duration-500"
                  style={{ background: i < coreTestsDone ? "linear-gradient(90deg,#FF6B00,#f97316)" : "rgba(0,0,0,0.08)" }} />
                <span className="text-[8px] font-bold"
                  style={{ color: i < coreTestsDone ? "#f97316" : "#cbd5e1" }}>
                  {["MBTI","NEO","ECR","ERQ","IRI"][i]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-5">{coreTestsDone} از ۵ تست اصلی تکمیل شده</p>

          <button
            onClick={() => router.push("/dashboard/tests")}
            className="w-full py-3.5 rounded-xl text-sm font-black text-white mb-3"
            style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 12px rgba(255,107,0,0.3)" }}>
            تکمیل تست‌ها
          </button>
          <button
            onClick={() => router.push("/events")}
            className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
            بازگشت به رویدادها
          </button>
        </motion.div>
      </div>
    );
  }

  const Icon = cat.icon;

  useEffect(() => {
    if (!cid || cid === "hamrovan") return;
    const ctrl = new AbortController();
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const city = state.city || (typeof window !== "undefined" ? localStorage.getItem("city") : null) || "";
    const sp = new URLSearchParams({ limit: "20", category: cid });
    if (city) sp.set("city", city);
    fetch(API + "/api/events?" + sp, { signal: ctrl.signal, headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data?.events?.length > 0) {
          setEvents(data.events.map((e: any) => ({
            id: e.id, title: e.title,
            date: new Date(e.start_date || e.startDate).toLocaleDateString("fa-IR"),
            time: new Date(e.start_date || e.startDate).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
            location: e.location || "", capacity: e.capacity,
            reserved: e.reservedCount ?? e.current_bookings ?? 0,
            price: e.price, tags: e.tags || [],
            category: e.category,
            image_url: e.image_url,
          })));
        }
      }).catch(() => {}).finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [cid, state.city]);

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B2A4A, #132038)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full" style={{background:cat.color,filter:"blur(60px)"}}/>
          <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full" style={{background:cat.color,filter:"blur(40px)"}}/>
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-6">
          <button onClick={() => router.push("/events")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors text-sm">
            <ArrowRight size={16} /> بازگشت به همنشینی‌ها
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{background:`linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`, boxShadow:`0 8px 24px ${cat.color}40`}}>
              <Icon size={28} className="text-white drop-shadow-lg"/>
            </div>
            <div>
              <span className="text-xs font-bold text-white/60 uppercase">دسته‌بندی</span>
              <h1 className="text-2xl font-black text-white">{cat.title}</h1>
              <p className="text-white/70 text-sm mt-0.5">{cat.banner}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-white font-black text-lg">{events.length}</p>
              <p className="text-white/60 text-xs">رویداد فعال</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-white font-black text-lg">{events.reduce((s, e) => s + Math.max(0, e.capacity - e.reserved), 0)}</p>
              <p className="text-white/60 text-xs">جای خالی</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-white font-black text-lg">{events.length > 0 ? Math.min(...events.filter(e => e.price > 0).map(e => e.price)).toLocaleString("fa-IR") : "—"}</p>
              <p className="text-white/60 text-xs">کمترین قیمت</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        <h2 className="text-base font-black text-slate-900 mb-4">همنشینی‌های {cat.title}</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex gap-2">{[300,150,0].map((d,i)=>(<div key={i} className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay:"-"+d+"ms"}}/>))}</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-slate-600 font-bold text-lg mb-1">رویدادی موجود نیست</p>
            <p className="text-slate-400 text-sm">به‌زودی رویدادهای جدید اضافه می‌شوند</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map((ev, idx) => {
              const full = ev.capacity <= (ev.reserved ?? 0);
              const rem = ev.capacity - (ev.reserved ?? 0);
              const pct = Math.round((ev.reserved / ev.capacity) * 100);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => router.push("/events/" + ev.id)}
                >
                  <div className="relative h-44" style={{ background: "#0d1e35" }}>
                    <img src={getEventImage(ev, idx)} alt={ev.title}
                      className="w-full h-full object-cover opacity-60 transition-transform duration-500" loading="lazy"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {full && (
                      <div className="absolute top-3 right-3 bg-white/90 text-slate-700 text-[11px] font-black px-3 py-1 rounded-full">تکمیل ظرفیت</div>
                    )}
                    {!full && rem <= 4 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 text-slate-900 text-[11px] font-black px-3 py-1 rounded-full">
                        <Zap size={10} /> فقط {rem} جا!
                      </div>
                    )}
                    {ev.tags?.length > 0 && (
                      <div className="absolute top-3 left-3 flex gap-1">
                        {ev.tags.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color + "cc" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 left-3 text-white">
                      <h3 className="font-black text-sm leading-snug line-clamp-2 mb-1.5">{ev.title}</h3>
                      <div className="flex items-center gap-3 text-white/75">
                        <div className="flex items-center gap-1"><Clock size={10} /><span className="text-[10px]">{ev.date} · {ev.time}</span></div>
                        {ev.location && <div className="flex items-center gap-1 text-white/60"><MapPin size={10} /><span className="text-[10px] line-clamp-1">{ev.location}</span></div>}
                      </div>
                    </div>
                    <div className="absolute left-3 bottom-3">
                      {full ? (
                        <div className="bg-slate-800/60 text-white/50 text-[10px] font-bold px-4 py-2.5 rounded-xl">تکمیل ظرفیت</div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5"
                          style={{ background: "linear-gradient(135deg, " + cat.color + ", " + cat.color + "cc)" }}>
                          رزرو <ArrowRight size={12} className="rotate-180" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1"><Users size={13} className="text-slate-400" /><span className="text-xs text-slate-500">{ev.reserved}/{ev.capacity} نفر</span></div>
                    <span className="text-sm font-black text-orange-500">{ev.price > 0 ? Math.round(ev.price).toLocaleString("fa-IR") + " تومان" : "رایگان"}</span>
                  </div>
                  <div className="mx-4 mb-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.8, delay: 0.2 + idx * 0.08 }}
                      className="h-full rounded-full" style={{ background: "linear-gradient(90deg, " + cat.color + "88, " + cat.color + ")" }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

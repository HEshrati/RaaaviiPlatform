"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserStats,
  UserProfile,
  UserStats,
} from "@/lib/api";
import {
  User, Star, Calendar, Edit3, Save, X, Camera,
  CheckCircle, MapPin, BookOpen, Award, TrendingUp,
  Upload, Image as ImageIcon, Cpu, Sparkles, BarChart2,
} from "lucide-react";
import TestResultsProfile from "@/components/TestResultsProfile";
import SmartProfileCard from "@/components/SmartProfileCard";

const IRANIAN_CITIES = [
  "تهران","اصفهان","شیراز","تبریز","مشهد","اهواز","کرمانشاه","ارومیه",
  "رشت","کرج","زاهدان","همدان","کرمان","یزد","اردبیل","بندرعباس","قم",
];

const INITIAL_PROFILE: UserProfile = {
  avatarUrl: "", bio: "", interests: [], city: "", age: null, gender: "", education: "",
};

const INITIAL_STATS: UserStats = {
  successfulMatches: 0, completedEvents: 0, upcomingEvents: 0, totalBookings: 0,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingOrb({ top, left, right, bottom, size, color, duration = 8 }: any) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        top, left, right, bottom,
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(2px)",
      }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5], y: [0, -10, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function ProfilePage() {
  const { state } = useApp();
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [savedProfile, setSavedProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [interestsInput, setInterestsInput] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.isLoggedIn) return;
    Promise.all([fetchUserProfile(), fetchUserStats()])
      .then(([p, s]) => {
        setProfile(p);
        setSavedProfile(p);
        setStats(s);
        setInterestsInput((p.interests || []).join("، "));
      })
      .catch(() => {});
  }, [state.isLoggedIn]);

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setStatus("");
    try {
      const interests = interestsInput
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const nextProfile = { ...profile, interests };
      await updateUserProfile(nextProfile);
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setStatus("پروفایل با موفقیت ذخیره شد");
      setIsEditing(false);
      setTimeout(() => setStatus(""), 3000);
    } catch {
      setStatus("خطا در ذخیره‌سازی. دوباره تلاش کنید.");
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEditing() {
    setProfile(savedProfile);
    setInterestsInput((savedProfile.interests || []).join("، "));
    setStatus("");
    setIsEditing(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      return;
    }
    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setAvatarPreview(ev.target.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profiles/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
        body: formData,
      });
      const data = await res.json();
      if (data?.avatarUrl) updateField("avatarUrl", data.avatarUrl);
    } catch {
      setStatus("خطا در آپلود تصویر");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const displayName = state.user?.name || "کاربر راوی";
  const avatarSrc = avatarPreview || profile.avatarUrl;
  const initials = displayName.charAt(0).toUpperCase();

  if (!state.isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir="rtl" style={{ background: "#f8fafc" }}>
        <p className="text-slate-400">لطفاً ابتدا وارد شوید</p>
      </div>
    );
  }

  const completionItems = [!!state.user?.name, !!profile.city, !!profile.age, !!profile.gender, !!(profile.interests?.length), !!profile.avatarUrl, !!profile.bio];
  const completionPct = Math.round(completionItems.filter(Boolean).length / completionItems.length * 100);

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* پس‌زمینه گرادیانت محو */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingOrb top="-5%" right="-10%" size="300px" color="rgba(255,107,0,0.10)" duration={10} />
        <FloatingOrb top="35%" left="-12%" size="260px" color="rgba(139,92,246,0.08)" duration={12} />
        <FloatingOrb bottom="0%" right="-8%" size="240px" color="rgba(59,130,246,0.06)" duration={9} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.012) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
      </div>

      <div className="max-w-[620px] mx-auto pb-28 space-y-4 sm:space-y-5 px-0 sm:px-2 relative z-10" dir="rtl">
        {/* ── کارت هدر پروفایل؛ هم‌راستا با زبان بصری داشبورد ── */}
        <FadeUp>
          <section className="rounded-[28px] overflow-hidden relative p-5 sm:p-6 text-white"
            style={{ background: "linear-gradient(115deg,#ff9b47 0%,#ff781c 48%,#f45b0c 100%)", boxShadow: "0 18px 42px rgba(244,91,12,0.28)" }}>
            <motion.div className="absolute -top-14 -left-10 w-52 h-52 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle,rgba(255,255,255,.24),transparent 68%)" }}
              animate={{ scale: [1, 1.16, 1], opacity: [.55, .9, .55] }} transition={{ duration: 7, repeat: Infinity }} />
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to top,rgba(255,255,255,.12),transparent)" }} />

            <div className="relative flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-white/80">پروفایل کاربری</span>
              <button type="button" onClick={() => isEditing ? cancelEditing() : setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black transition hover:bg-white/25"
                style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.2)" }}>
                {isEditing ? <X size={13} /> : <Edit3 size={13} />}{isEditing ? "انصراف" : "ویرایش"}
              </button>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,.2)", border: "4px solid rgba(255,255,255,.3)", boxShadow: "0 12px 28px rgba(123,49,5,.22)" }}>
                  {avatarSrc ? <img src={avatarSrc} alt="آواتار" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-white">{initials}</span>}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-orange-400" />
                {isEditing && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -left-1 w-8 h-8 rounded-xl flex items-center justify-center bg-white text-orange-600 shadow-lg">
                    {isUploadingAvatar ? <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-3">{displayName}</h1>
              <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-white/75 min-h-4">
                {profile.city ? <span className="flex items-center gap-1"><MapPin size={11} />{profile.city}</span> : <span>شهر ثبت نشده</span>}
                {profile.age && <><span className="w-1 h-1 rounded-full bg-white/40" /><span>{profile.age} سال</span></>}
              </div>
              {profile.bio && <p className="max-w-md text-[11px] text-white/70 mt-2 leading-5 line-clamp-2">{profile.bio}</p>}
            </div>

            <div className="relative grid grid-cols-4 gap-2 mt-5">
              {[
                { value: stats.totalBookings, label: "رزرو", icon: Calendar },
                { value: stats.completedEvents, label: "شرکت", icon: CheckCircle },
                { value: stats.upcomingEvents, label: "پیش‌رو", icon: TrendingUp },
                { value: stats.successfulMatches, label: "مچ", icon: Star },
              ].map(({ value, label, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: .08 + i * .05 }} className="rounded-2xl py-3 px-1 text-center min-w-0"
                  style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.16)" }}>
                  <Icon size={13} className="mx-auto text-white/75 mb-1" />
                  <p className="font-black text-base">{value || 0}</p>
                  <p className="text-[9px] text-white/65 truncate">{label}</p>
                </motion.div>
              ))}
            </div>

            <div className="relative mt-3 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,.14)" }}>
              <div className="flex justify-between text-[10px] font-black mb-1.5"><span>تکمیل پروفایل</span><span>{completionPct}٪</span></div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/20">
                <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 1 }}
                  className="h-full rounded-full bg-white" />
              </div>
            </div>
          </section>
        </FadeUp>

        {/* ── فرم ویرایش ── */}
        <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubmit}
              className="rounded-3xl p-6 space-y-4 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
            >
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-orange-500" />
                ویرایش پروفایل
              </h3>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <MapPin size={13} className="text-orange-500" /> شهر
                </span>
                <select
                  value={profile.city ?? ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition appearance-none cursor-pointer"
                >
                  <option value="">انتخاب کنید</option>
                  {IRANIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">سن</span>
                <input
                  type="number"
                  min={18} max={80}
                  value={profile.age ?? ""}
                  onChange={(e) => updateField("age", e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition"
                  placeholder="۲۵"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">جنسیت</span>
                <select
                  value={profile.gender ?? ""}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition appearance-none cursor-pointer"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="male">مرد</option>
                  <option value="female">زن</option>
                  <option value="prefer-not-to-say">ترجیح می‌دهم نگویم</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <Award size={13} className="text-purple-500" />
                  علایق (با کاما جدا کنید)
                </span>
                <input
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition"
                  placeholder="کتاب، موسیقی، کوهنوردی، سینما"
                />
                <p className="text-[10px] text-slate-400">این اطلاعات برای پیشنهاد هوشمند استفاده می‌شود</p>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">درباره من</span>
                <textarea
                  value={profile.bio ?? ""}
                  onChange={(e) => updateField("bio", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition resize-none"
                  placeholder="چند جمله کوتاه درباره خودت بنویس..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">تحصیلات</span>
                <select
                  value={profile.education ?? ""}
                  onChange={(e) => updateField("education", e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-orange-400 transition appearance-none cursor-pointer"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="دیپلم">دیپلم</option>
                  <option value="کاردانی">کاردانی</option>
                  <option value="کارشناسی">کارشناسی</option>
                  <option value="کارشناسی ارشد">کارشناسی ارشد</option>
                  <option value="دکترا">دکترا</option>
                </select>
              </label>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-5 py-3 font-bold transition-all shadow-lg shadow-orange-500/20 text-sm"
                >
                  <Save size={16} />
                  {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </motion.button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 font-bold transition text-sm"
                >
                  انصراف
                </button>
              </div>

              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
                      status.includes("موفق")
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                    {status.includes("موفق") ? <CheckCircle size={15} /> : <X size={15} />}
                    {status}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── پروفایل هوشمند ── */}
        <FadeUp delay={0.08}>
          <SmartProfileCard />
        </FadeUp>

        {/* تست شخصیت */}
        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-[24px] p-4 sm:p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(110deg,#ff9b47,#ff6b0b)",
              border: "1px solid rgba(255,255,255,.2)",
              boxShadow: "0 10px 25px rgba(255,107,0,.2)",
            }}
          >
            <motion.div
              className="absolute -top-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)" }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 7, repeat: Infinity }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <motion.div whileHover={{ rotateX: -10, rotateY: 10 }} className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,.18)" }}>
                <Cpu size={18} className="text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-white">تست شخصیت</h3>
                <p className="text-xs text-white/65 mt-0.5">تیپ ارتباطی‌ات را شناسایی کن</p>
              </div>
              <a
                href="/dashboard/personality-test"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.2)", color: "white" }}
              >
                <Sparkles size={12} />
                شروع
              </a>
            </div>
          </motion.div>
        </FadeUp>

        {/* نتایج تست‌ها */}
        <FadeUp delay={0.12}>
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(145deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))", boxShadow: "3px 3px 8px rgba(0,0,0,0.06), inset 1px 1px 3px rgba(255,255,255,0.6)", transform: "rotateX(6deg) rotateY(-6deg)" }}>
                <BarChart2 size={16} className="text-blue-500" />
              </span>
              <h3 className="text-slate-900 font-black text-sm">نتایج تست‌های روان‌سنجی</h3>
            </div>
            <TestResultsProfile />
          </div>
        </FadeUp>
      </div>
    </div>
  );
}

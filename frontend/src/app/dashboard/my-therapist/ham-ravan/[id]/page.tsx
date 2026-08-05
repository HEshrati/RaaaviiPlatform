"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, Star, MapPin, Globe, CheckCircle2,
  Calendar, Clock, Award, Zap, Loader2, Shield, User, AlertCircle
} from "lucide-react";

// باگ رفع‌شده: دامنه هاردکد‌شده با الگوی استفاده‌شده در بقیه صفحات پروژه یکسان شد
const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

export default function TherapistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [psychologist, setPsychologist] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [booking, setBooking] = useState(false);
  const [dominantNeed, setDominantNeed] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "wallet">("zarinpal");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    async function load() {
      try {
        // بارگذاری لیست روانشناسان برای پیدا کردن این روانشناس
        const url = sessionId
          ? `${API}/api/hamravan/psychologists?sessionId=${sessionId}`
          : `${API}/api/hamravan/psychologists`;

        const data = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : { psychologists: [] });

        const list: any[] = data.psychologists || data || [];
        const found = list.find((p: any) =>
          p.psychologist_profile_id === id || p.user_id === id
        );
        if (found) {
          setPsychologist(found);
          setDominantNeed(found.dominant_need || "");
        }

        // بارگذاری slot های واقعی
        const slotsData = await fetch(
          `${API}/api/hamravan/slots?city=${found?.city || ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.ok ? r.json() : []);

        // فقط slot های این روانشناس
        const mySlots = (Array.isArray(slotsData) ? slotsData : []).filter(
          (s: any) => s.psychologist_id === (found?.psychologist_profile_id || id)
        );
        setSlots(mySlots);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, sessionId]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWalletBalance(d?.balance ?? null))
      .catch(() => setWalletBalance(null));
  }, [token]);

  async function handleBook() {
    if (!selectedSlot || !psychologist) return;
    setBooking(true);
    try {
      const res = await fetch(`${API}/api/hamravan/book-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slotId: selectedSlot.slot_id,
          dominantNeed: dominantNeed || psychologist.dominant_need,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      if (res.ok && data.success) {
        router.push("/dashboard/my-therapist/ham-ravan/booked");
      } else {
        alert(data.message || "خطا در رزرو جلسه");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-orange-500" />
    </div>
  );

  if (!psychologist) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <p className="text-slate-500 mb-4">روانشناس پیدا نشد</p>
        <button onClick={() => router.back()} className="text-orange-500 font-bold">برگشت</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 bg-slate-50" dir="rtl">
      {/* هدر */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-slate-100">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-700">پروفایل همروان</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* match_reason */}
        {psychologist.match_reason && (
          <div className="rounded-2xl p-4 bg-orange-50 border border-orange-100 flex gap-3">
            <Zap size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800 leading-6">{psychologist.match_reason}</p>
          </div>
        )}

        {/* کارت اصلی */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#1B2A4A] to-[#0d1e35] p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
              {psychologist.avatar_url ? (
                <img src={psychologist.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                  {(psychologist.full_name || "؟").slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-white text-xl">{psychologist.full_name}</h2>
                <CheckCircle2 size={16} className="text-blue-400" />
              </div>
              <p className="text-white/60 text-sm mt-0.5">{psychologist.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white/80 text-sm">{psychologist.rating || "4.5"}</span>
                {psychologist.total_sessions > 0 && (
                  <span className="text-white/50 text-xs">· {psychologist.total_sessions} جلسه</span>
                )}
              </div>
              {/* match_tags */}
              {psychologist.match_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {psychologist.match_tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300">
                      ✦ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {psychologist.online_available && (
              <span className="flex items-center gap-1 text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
                <Globe size={11} /> آنلاین
              </span>
            )}
            {psychologist.city && (
              <span className="flex items-center gap-1 text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
                <MapPin size={11} /> {psychologist.city}
              </span>
            )}
            {psychologist.available_slots_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                <Calendar size={11} /> {psychologist.available_slots_count} زمان خالی
              </span>
            )}
          </div>
        </div>

        {/* بیو */}
        {psychologist.bio && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-black mb-2 flex items-center gap-2">
              <User size={16} className="text-orange-500" /> درباره من
            </h3>
            <p className="text-sm text-slate-600 leading-7">{psychologist.bio}</p>
          </div>
        )}

        {/* تخصص‌ها */}
        {(psychologist.specialties || psychologist.specialty) && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-black mb-3 flex items-center gap-2">
              <Award size={16} className="text-orange-500" /> حوزه‌های تخصصی
            </h3>
            <div className="flex flex-wrap gap-2">
              {(psychologist.specialties
                ? (Array.isArray(psychologist.specialties) ? psychologist.specialties : [psychologist.specialties])
                : [psychologist.specialty]
              ).map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* رویکرد */}
        {psychologist.approach && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-black mb-2 flex items-center gap-2">
              <Zap size={16} className="text-orange-500" /> رویکرد درمانی
            </h3>
            <p className="text-sm text-slate-600">{psychologist.approach}</p>
          </div>
        )}

        {/* زمان‌های واقعی */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-black mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-orange-500" /> زمان‌های در دسترس
          </h3>
          {slots.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <Calendar size={24} className="mx-auto mb-2 opacity-30" />
              در حال حاضر زمان خالی ثبت نشده
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {slots.map((slot: any) => {
                const dt = new Date(slot.start_datetime);
                const isSelected = selectedSlot?.slot_id === slot.slot_id;
                return (
                  <button key={slot.slot_id} onClick={() => setSelectedSlot(slot)}
                    className="w-full rounded-xl p-3 text-right transition-all flex items-center justify-between"
                    style={isSelected
                      ? { background: "linear-gradient(135deg,#FF6B00,#FF9A3C)", color: "white" }
                      : { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }
                    }>
                    <div className="flex items-center gap-3">
                      <Clock size={14} />
                      <div>
                        <div className="font-bold text-sm">
                          {dt.toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" })}
                        </div>
                        <div className="text-xs opacity-70">
                          {dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={isSelected
                        ? { background: "rgba(255,255,255,0.2)" }
                        : { background: slot.session_type === "online" ? "#dcfce7" : "#eff6ff", color: slot.session_type === "online" ? "#16a34a" : "#2563eb" }
                      }>
                      {slot.session_type === "online" ? "آنلاین" : "حضوری"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* قیمت و رزرو */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">هزینه جلسه</span>
            <span className="font-black text-xl text-slate-800">
              {(psychologist.session_price || 0).toLocaleString()} تومان
            </span>
          </div>
          {!selectedSlot && slots.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
              <AlertCircle size={13} /> ابتدا یک زمان انتخاب کنید
            </div>
          )}
          {(psychologist.session_price || 0) > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-bold text-slate-500">روش پرداخت</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("zarinpal")}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    paymentMethod === "zarinpal" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  درگاه زرین‌پال
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  disabled={walletBalance !== null && walletBalance < (psychologist.session_price || 0)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-40 ${
                    paymentMethod === "wallet" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  کیف پول {walletBalance !== null ? `(${Number(walletBalance).toLocaleString("fa-IR")} ت)` : ""}
                </button>
              </div>
              {paymentMethod === "wallet" && walletBalance !== null && walletBalance < (psychologist.session_price || 0) && (
                <p className="text-[11px] text-red-500 font-bold">موجودی کیف پول کافی نیست</p>
              )}
            </div>
          )}
          <button onClick={handleBook}
            disabled={!selectedSlot || booking || slots.length === 0}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)", color: "white" }}>
            {booking ? "در حال رزرو..." : selectedSlot ? "رزرو جلسه همروان" : slots.length === 0 ? "زمان خالی موجود نیست" : "ابتدا زمان انتخاب کن"}
          </button>
        </div>

      </div>
    </div>
  );
}




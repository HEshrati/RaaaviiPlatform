"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Users, Calendar, Tag, ChevronLeft, Lock, UserPlus, CreditCard, CheckCircle2, Loader2, AlertCircle, Sparkles, ArrowLeft
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { reserveEvent } from "@/lib/api";

const MOCK_EVENTS_MAP: Record<string, any> = {
  "ev-1": { id: "ev-1", category: "hambazi", categoryLabel: "هم‌بازی", title: "دورهمی همبازی (بردگیم‌های گروهی)", description: "یک شب هیجانی و گرم با دوستان جدید در دنیای بردگیم‌های استراتژیک.", date: "۱۴۰۳/۱۱/۲۳", time: "۱۵:۰۰", weekday: "پنج‌شنبه", location: "کافه بازی جام جم، تهران", capacity: 12, reserved: 12, price: 150000, tags: ["بردگیم", "گروهی"], isFull: true, whatToExpect: ["آشنایی با آدم‌های جدید", "بازی Catan", "پذیرایی شب‌نشینی"], host: { name: "گروه همنشین‌های تهران", events: 47 } },
  "ev-2": { id: "ev-2", category: "hambazi", categoryLabel: "هم‌بازی", title: "هم‌بازی ۲۴ بهمن (مافیا)", description: "بازی مافیا در یک محیط صمیمی و پرانرژی.", date: "۱۴۰۳/۱۱/۲۴", time: "۱۷:۰۰", weekday: "جمعه", location: "کافه لیلا، ونک، تهران", capacity: 14, reserved: 10, price: 80000, tags: ["مافیا"], isFull: false, whatToExpect: ["آموزش قوانین مافیا", "۳ دور بازی"], host: { name: "کلوب بازی‌های فکری", events: 23 } },
  "ev-3": { id: "ev-3", category: "hambazi", categoryLabel: "هم‌بازی", title: "دورهمی هم‌بازی (اتاق فرار)", description: "چالش اتاق فرار به صورت تیمی.", date: "۱۴۰۳/۱۱/۲۴", time: "۱۷:۱۵", weekday: "جمعه", location: "اتاق فرار ایران، جردن", capacity: 10, reserved: 7, price: 200000, tags: ["اتاق فرار"], isFull: false, whatToExpect: ["جلسه آشنایی", "۱ ساعت اتاق فرار"], host: { name: "آتش اسکیپ", events: 91 } },
  "ev-4": { id: "ev-4", category: "hamneshin", categoryLabel: "همنشین", title: "قرار صبحانه (میز منتخب)", description: "صبحانه‌ی دنج در کافه‌ای زیبا.", date: "۱۴۰۳/۱۱/۲۴", time: "۱۰:۰۰", weekday: "جمعه", location: "کافه آهنگ صبح، سعادت‌آباد", capacity: 6, reserved: 6, price: 120000, tags: ["صبحانه"], isFull: true, whatToExpect: ["صبحانه اروپایی کامل"], host: { name: "جمعه‌های همنشین", events: 34 } },
};

const CAT_COLORS: Record<string, {grad: string; accent: string; shadow: string}> = {
  hamneshin: {grad:"135deg,#FF6B00,#f97316",accent:"#FF6B00",shadow:"rgba(255,107,0,"},
  hambazi: {grad:"135deg,#3b82f6,#60a5fa",accent:"#3b82f6",shadow:"rgba(59,130,246,"},
  default: {grad:"135deg,#475569,#64748b",accent:"#64748b",shadow:"rgba(100,116,139,"},
};

function Icon3D({icon: Icon, color, shadowBase, size = 20}: {icon: React.ElementType; color: string; shadowBase: string; size?: number}) {
  return (
    <div style={{perspective:"800px", display:"inline-flex"}}>
      <div style={{
        background: `linear-gradient(145deg, ${color}, ${color}bb)`,
        transform: "rotateX(8deg) rotateY(-8deg)",
        padding: "10px",
        borderRadius: "16px",
        boxShadow: `6px 6px 12px ${shadowBase}0.3), -3px -3px 8px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,0.5)`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease"
      }}
      className="group-hover:shadow-lg group-hover:scale-110 transition-all"
      >
        <Icon size={size} className="text-white drop-shadow-md"/>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedOption, setSelectedOption] = useState<"solo" | "plusOne" | null>(null);
  const [plusOnePhone, setPlusOnePhone] = useState("");
  const [plusOneLoading, setPlusOneLoading] = useState(false);
  const [plusOneUserId, setPlusOneUserId] = useState("");
  const [plusOneVerified, setPlusOneVerified] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "wallet">("zarinpal");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (MOCK_EVENTS_MAP[params.id]) { setEvent(MOCK_EVENTS_MAP[params.id]); setLoading(false); return; }
    const ctrl = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${params.id}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        setEvent({ ...data, isFull: data.capacity - (data.reservedCount ?? data.current_bookings ?? 0) <= 0, categoryLabel: data.category || "همنشینی", whatToExpect: [], host: { name: "برگزارکننده", events: 0 } });
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [params.id]);

  useEffect(() => {
    if (!state.isLoggedIn) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWalletBalance(d?.balance ?? null))
      .catch(() => setWalletBalance(null));
  }, [state.isLoggedIn]);

  const handleReserve = async () => {
    if (!state.isLoggedIn) { router.push("/login"); return; }
    if (selectedOption === 'plusOne' && !plusOneVerified) { setError("لطفاً شماره همراه را وارد و تایید کنید."); return; }
    setBookingLoading(true); setError("");
    try {
      const res = await reserveEvent(event.id, 1, plusOneUserId || undefined, paymentMethod);
      if (res.paymentUrl || res.payment_url) { window.location.href = res.paymentUrl || res.payment_url; return; }
      else if (res.id) { router.push("/dashboard"); return; }
      else { setError(res.message || "خطا در ثبت رزرو."); }
    } catch (err: any) { setError(err?.message || "خطا در اتصال به سرور"); }
    finally { setBookingLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" dir="rtl"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
  if (!event) return <div className="min-h-screen flex flex-col items-center justify-center p-6" dir="rtl"><h1 className="text-2xl font-bold mb-4">یافت نشد</h1><Link href="/events" className="bg-orange-500 text-white px-4 py-2 rounded-lg">بازگشت</Link></div>;

  const remaining = event.capacity - (event.reserved ?? event.reservedCount ?? 0);
  const progress = Math.min(100, Math.round(((event.reserved ?? event.reservedCount ?? 0) / event.capacity) * 100));
  const catStyle = CAT_COLORS[event.category] || CAT_COLORS.default;
  const priceStr = event.price ? `${Number(event.price/10).toLocaleString("fa-IR")} تومان` : "رایگان";

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 pb-40 pt-8 px-4 flex justify-center" dir="rtl">

      <div className="w-full max-w-2xl space-y-6">
        
        {/* دکمه بازگشت */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors group w-fit">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">بازگشت به رویدادها</span>
        </button>

        {/* کارت اصلی محتوا */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-white/80 overflow-hidden transition-shadow duration-500 hover:shadow-orange-100/50">
          
          {/* بخش عصر هدر - هم‌عرض با محتوا */}
          <div className="relative aspect-video overflow-hidden group">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <Sparkles size={60} className="text-slate-400 opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
              <Sparkles size={14} className="text-orange-500" />
              <span className="text-xs font-black text-slate-800">{event.categoryLabel}</span>
            </div>

            <div className="absolute bottom-6 right-6 left-6 text-white z-10">
              <h1 className="font-black text-3xl leading-snug drop-shadow-lg">{event.title}</h1>
            </div>
          </div>

          {/* بدنه محتوا */}
          <div className="p-6 md:p-8 space-y-8">

            {/* اطلاعات رویداد با آیکون‌های برجسته */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {icon: Calendar, label:"زمان", value:`${event.weekday}، ${event.date}`, sub:`ساعت ${event.time}`},
                {icon: MapPin, label:"مکان", value: event.city || event.location?.split('،').pop()?.trim() || 'تهران', sub:event.location ? 'محل برگزاری' : ''},
                {icon: Users, label:"ظرفیت", value: event.isFull ? "تکمیل شده" : `${remaining} از ${event.capacity} نفر`, sub:''},
                {icon: Tag, label:"هزینه", value: priceStr, sub:''},
              ].map(({icon, label, value, sub}, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md hover:scale-[1.02]">
                  <div className="flex-shrink-0">
                    <Icon3D icon={icon} color={catStyle.accent} shadowBase={catStyle.shadow} size={18}/>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">{label}</p>
                    <p className="text-sm font-black text-slate-900">{value}</p>
                    {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* نکته لوکیشن */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
              <Lock size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700 leading-6">آدرس دقیق محل برگزاری، ۱۰ ساعت قبل از شروع فقط در داشبورد نمایش داده می‌شود.</p>
            </div>

            {/* نوار ظرفیت */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 font-bold">پیشرفت ظرفیت</span>
                <span className={`font-black ${progress >= 80 ? "text-red-500" : "text-slate-600"}`}>{progress}٪</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${progress}%`}} transition={{duration:1, delay:0.6}}
                  className={`h-full rounded-full ${progress >= 90 ? "bg-red-500" : "bg-orange-500"}`}/>
              </div>
              {!event.isFull && remaining <= 4 && <p className="text-xs text-red-500 font-black mt-2 animate-pulse">فقط {remaining} جای خالی باقی مانده!</p>}
            </div>

            {/* توضیحات */}
            <div>
              <h2 className="font-black text-slate-900 text-lg mb-3">درباره این رویداد</h2>
              <p className="text-sm text-slate-600 leading-8">{event.description}</p>
            </div>

            {/* تگ‌ها */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag: string) => (
                  <span key={tag} className="text-xs font-black px-4 py-2 rounded-full border" style={{background:`${catStyle.accent}10`, color:catStyle.accent, borderColor:`${catStyle.accent}30`}}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* بخش انتخاب رزرو (کارت‌های سولو و پلاس وان) */}
            {state.isLoggedIn && !event.isFull && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-lg font-black text-slate-800">انتخاب نوع شرکت</h3>
                
                {/* گزینه ۱: فقط خودم */}
                <div
                  onClick={() => { setSelectedOption("solo"); setPlusOneUserId(""); setPlusOneVerified(false); }}
                  className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedOption === "solo"
                      ? "border-slate-800 bg-slate-50 shadow-lg scale-[1.01]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${selectedOption === 'solo' ? 'bg-slate-800 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.2)]' : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'}`}>
                      <Users size={22} className={`transition-colors ${selectedOption === 'solo' ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">فقط خودم</p>
                      <p className="text-xs text-slate-500 mt-1">شرکت برای یک نفر</p>
                    </div>
                  </div>
                  <div className="text-left ml-4">
                    <p className="font-black text-slate-900">{priceStr}</p>
                  </div>
                  {selectedOption === "solo" && (
                    <div className="absolute top-3 left-3">
                      <CheckCircle2 size={22} className="text-slate-800" />
                    </div>
                  )}
                </div>

                {/* گزینه ۲: همراه من (+1) */}
                <div
                  onClick={() => setSelectedOption("plusOne")}
                  className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                    selectedOption === "plusOne"
                      ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-100 scale-[1.01]"
                      : "border-orange-200 bg-gradient-to-l from-orange-50/50 to-white hover:border-orange-300 hover:shadow-md"
                  }`}
                >
                  <div className="relative flex items-center gap-4 z-10">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${selectedOption === 'plusOne' ? 'bg-orange-500 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2),0_4px_12px_rgba(249,115,22,0.4)]' : 'bg-orange-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'}`}>
                      <UserPlus size={22} className={`transition-colors ${selectedOption === 'plusOne' ? 'text-white' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900">همراه من (+۱)</p>
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">ویژه</span>
                      </div>
                      <p className="text-xs text-orange-600 mt-1">رزرو برای خودم و یک مهمان</p>
                    </div>
                  </div>
                  <div className="relative text-left ml-4 z-10">
                    <p className="font-black text-orange-600">Plus One</p>
                  </div>
                  {selectedOption === "plusOne" && (
                    <div className="absolute top-3 left-3">
                      <CheckCircle2 size={22} className="text-orange-500" />
                    </div>
                  )}
                </div>

                {/* فرم وارد کردن شماره همراه در صورت انتخاب Plus One */}
                <AnimatePresence>
                  {selectedOption === "plusOne" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-inner">
                        <p className="text-xs text-slate-500 leading-7">شماره موبایل همراه خود را وارد کنید — کافیه تست اصلی را داده باشید.</p>
                        <div className="flex gap-2">
                          <input 
                            type="tel" 
                            value={plusOnePhone||""} 
                            onChange={e=>setPlusOnePhone(e.target.value.replace(/[^0-9]/g,""))} 
                            placeholder="09xxxxxxxxx" 
                            maxLength={11}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 transition" 
                            style={{direction:"ltr",textAlign:"left"}}
                          />
                          <button 
                            onClick={async()=>{
                              if(!plusOnePhone||plusOnePhone.length<11){alert("شماره معتبر وارد کنید");return;}
                              setPlusOneLoading(true);
                              try{
                                const tok=localStorage.getItem("token")||"";
                                const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000"}/api/bookings/plus-one-check`,{method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${tok}`}, body:JSON.stringify({phone:plusOnePhone})});
                                const d=await r.json();
                                if(d.userId){setPlusOneUserId(d.userId);setPlusOneVerified(true);} else alert(d.message||"کاربر پیدا نشد");
                              }catch{alert("خطا در بررسی شماره");} finally{setPlusOneLoading(false);}
                            }} 
                            disabled={plusOneLoading}
                            className="px-5 py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 transition hover:scale-105 bg-gradient-to-l from-orange-500 to-orange-600"
                          >
                            {plusOneLoading?<Loader2 size={16} className="animate-spin"/>:"تأیید"}
                          </button>
                        </div>
                        {plusOneVerified&&plusOneUserId&&(
                          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200">
                            <CheckCircle2 size={16} className="text-green-500"/>
                            <p className="text-xs font-black text-green-700">همراه تأیید شد</p>
                            <button onClick={()=>{setPlusOneUserId("");setPlusOneVerified(false);setPlusOnePhone("");}} className="mr-auto text-xs text-slate-400 hover:text-red-400 transition">حذف</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* انتخاب روش پرداخت */}
                {event.price > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-500">روش پرداخت</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("zarinpal")}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                          paymentMethod === "zarinpal"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        درگاه زرین‌پال
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wallet")}
                        disabled={walletBalance !== null && walletBalance < (event.price * (selectedOption === "plusOne" ? 2 : 1))}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-40 ${
                          paymentMethod === "wallet"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        کیف پول {walletBalance !== null ? `(${Number(walletBalance).toLocaleString("fa-IR")} ت)` : ""}
                      </button>
                    </div>
                    {paymentMethod === "wallet" && walletBalance !== null && walletBalance < (event.price * (selectedOption === "plusOne" ? 2 : 1)) && (
                      <p className="text-[11px] text-red-500 font-bold">موجودی کیف پول کافی نیست</p>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>


      {/* دکمه ثابت پایین */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold">هزینه شرکت</p>
            <p className="text-lg font-black text-slate-900">{priceStr}</p>
          </div>

          {event.isFull ? (
            <div className="flex-1 bg-slate-200 text-slate-500 text-sm font-black py-4 rounded-2xl text-center">تکمیل ظرفیت</div>
          ) : !state.isLoggedIn ? (
            <button onClick={()=>router.push("/login")} className="flex-1 text-white text-sm font-black py-4 rounded-2xl text-center bg-gradient-to-l from-orange-500 to-orange-600 shadow-lg shadow-orange-200/50 active:scale-95 transition-transform">
              ورود برای رزرو
            </button>
          ) : !selectedOption ? (
            <div className="flex-1 bg-slate-100 text-slate-400 text-sm font-bold py-4 rounded-2xl text-center animate-pulse">
              ابتدا نوع شرکت را انتخاب کنید
            </div>
          ) : bookingLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-black py-4 rounded-2xl text-center bg-gradient-to-l from-orange-500 to-orange-600 shadow-lg">
              <Loader2 size={18} className="animate-spin"/> در حال انتقال به درگاه...
            </div>
          ) : (
            <button
              onClick={handleReserve}
              className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-black py-4 rounded-2xl text-center bg-gradient-to-l from-orange-500 to-orange-600 shadow-lg shadow-orange-200/50 active:scale-95 transition-transform hover:shadow-xl"
            >
              <CreditCard size={18}/>
              {selectedOption === 'plusOne' ? "پرداخت و ثبت‌نام (+۱)" : "پرداخت و ثبت‌نام"}
            </button>
          )}
        </div>
        {error && <div className="max-w-2xl mx-auto mt-2 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg"><AlertCircle size={12}/>{error}</div>}
      </div>
    </motion.div>
  );
}

"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle2, LayoutDashboard, MessageCircle, AlertCircle, RefreshCw } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const refId = params.get("refId") || "";
  const bookingId = params.get("bookingId") || "";
  const paymentType = params.get("type") || "booking";
  const [bookingStatus, setBookingStatus] = useState<"loading"|"confirmed"|"pending"|"failed">("loading");

  // چک وضعیت booking
  useEffect(() => {
    if (!bookingId) {
      setBookingStatus(paymentType === "wallet_charge" || paymentType === "psychologist_booking" ? "confirmed" : "failed");
      return;
    }
    const token = typeof window !== "undefined"
      ? document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1] || localStorage.getItem("token")
      : null;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com"}/api/bookings/${bookingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("status unavailable")))
      .then(d => {
        if (["confirmed", "matched", "completed"].includes(d?.status)) setBookingStatus("confirmed");
        else if (["pending", "payment_review"].includes(d?.status)) setBookingStatus("pending");
        else setBookingStatus("failed");
      })
      .catch(() => setBookingStatus("failed"));
  }, [bookingId, paymentType]);

  // نمایش loading
  if (bookingStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0f172a,#1B2A4A)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">در حال تأیید رزرو...</p>
        </div>
      </div>
    );
  }

  // پرداخت ناقص
  if (bookingStatus === "pending" || bookingStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg,#0f172a,#1B2A4A)" }}>
        <div className="max-w-sm w-full rounded-3xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(234,179,8,0.4)", backdropFilter: "blur(20px)" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(234,179,8,0.15)", border: "2px solid rgba(234,179,8,0.4)" }}>
            <AlertCircle size={40} className="text-yellow-400" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">تأیید رزرو کامل نشده است ⚠️</h1>
          <p className="text-slate-300 text-sm mb-2">وضعیت رزرو قطعی نیست؛ تا زمان تأیید، آن را موفق در نظر نمی‌گیریم.</p>
          <p className="text-slate-400 text-xs mb-6">لطفاً چند دقیقه صبر کن و دوباره چک کن. اگه مشکل ادامه داشت با پشتیبانی تماس بگیر.</p>
          {refId && (
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <p className="text-xs text-slate-400 mb-1">کد پیگیری پرداخت</p>
              <p className="font-black text-yellow-400 text-xl">{refId}</p>
            </div>
          )}
          <div className="space-y-3">
            <button onClick={() => { setBookingStatus("loading"); setTimeout(() => window.location.reload(), 500); }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm text-white"
              style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)" }}>
              <RefreshCw size={16} /> بررسی مجدد
            </button>
            <a href="https://t.me/ravi_support" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm text-white"
              style={{ background: "linear-gradient(135deg,#0088cc,#006699)" }}>
              <MessageCircle size={18} /> تماس با پشتیبانی
            </a>
          </div>
        </div>
      </div>
    );
  }

  // پرداخت موفق
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#0f172a,#1B2A4A)" }}>
      <div className="max-w-sm w-full rounded-3xl p-8 text-center"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,0,0.3)", backdropFilter: "blur(20px)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">پرداخت موفق ✅</h1>
        <p className="text-slate-400 text-sm mb-5">
          {paymentType === "wallet_charge" ? "کیف پول شما با موفقیت شارژ شد" :
            paymentType === "psychologist_booking" ? "رزرو جلسه شما تأیید شد" : "رزرو رویداد شما تأیید شد"}
        </p>
        {refId && (
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
            <p className="text-xs text-slate-400 mb-1">کد پیگیری</p>
            <p className="font-black text-orange-400 text-xl">{refId}</p>
          </div>
        )}
        <div className="space-y-3 mb-5">
          <a href="https://t.me/raaviibot" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg,#0088cc,#006699)" }}>
            <MessageCircle size={18} /> ربات تلگرام راوی
          </a>
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)" }}>
            <LayoutDashboard size={18} /> ورود به داشبورد
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#0f172a" }} />}>
      <SuccessContent />
    </Suspense>
  );
}

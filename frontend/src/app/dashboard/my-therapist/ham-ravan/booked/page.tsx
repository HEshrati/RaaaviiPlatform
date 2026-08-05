"use client";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function BookedPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center mx-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">جلسه رزرو شد!</h2>
        <p className="text-slate-500 leading-7 mb-6">
          همروان شما ظرف ۲۴ ساعت با شما تماس می‌گیرد و زمان دقیق جلسه را هماهنگ می‌کند.
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="w-full py-3 rounded-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
          برگشت به داشبورد
        </button>
      </div>
    </div>
  );
}




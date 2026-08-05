"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  const params = useSearchParams();
  const router = useRouter();
  const message = params.get("message") || "پرداخت ناموفق بود";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:"#f8fafc"}}>
      <div className="max-w-sm w-full bg-white rounded-3xl p-8 shadow-xl text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{background:"rgba(239,68,68,0.1)"}}>
          <XCircle size={40} className="text-red-500"/>
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">پرداخت ناموفق ❌</h1>
        <p className="text-slate-500 text-sm mb-6">{decodeURIComponent(message)}</p>
        <div className="flex gap-3">
          <button onClick={()=>router.back()}
            className="flex-1 py-3 rounded-2xl font-black text-sm border border-slate-200 text-slate-700">
            بازگشت
          </button>
          <button onClick={()=>router.push("/dashboard")}
            className="flex-1 py-3 rounded-2xl font-black text-white text-sm"
            style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
            داشبورد
          </button>
        </div>
      </div>
    </div>
  );
}

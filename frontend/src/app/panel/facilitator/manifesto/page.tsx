"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

export default function ManifestoPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // باگ رفع‌شده: این صفحه هیچ‌وقت وضعیت فعلی مرامنامه را از سرور نمی‌خواند؛
  // نتیجه اینکه اگر کاربر قبلاً مرامنامه را پذیرفته بود و دوباره وارد این صفحه می‌شد،
  // باز هم دکمه‌ی «تأیید و پذیرش» را می‌دید نه پیام موفقیت.
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/api/facilitator/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDone(!!d?.manifestoAccepted))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function accept() {
    setLoading(true); setError("");
    const token = localStorage.getItem("token") || "";
    try {
      const r = await fetch(`${API}/api/facilitator/accept-manifesto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "تأیید مرامنامه با خطا مواجه شد");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-white text-xl font-black mb-1">مرامنامه راوی</h1>
      <p className="text-slate-500 text-sm mb-6">تعهد به حفظ فضای امن روانی (Psychological Safety) در رویدادها</p>

      <div className="p-5 rounded-2xl text-slate-300 text-sm leading-7 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        به‌عنوان تسهیلگر راوی متعهد می‌شوم که در طول برگزاری رویدادها، فضایی امن، بدون قضاوت و احترام‌آمیز برای
        تمام شرکت‌کنندگان فراهم کنم، از افشای اطلاعات خصوصی شرکت‌کنندگان خودداری کنم، و در صورت بروز هرگونه
        شرایط بحرانی یا ناایمن، موضوع را فوراً به تیم راوی گزارش دهم.
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {checking ? (
        <Loader2 size={18} className="text-amber-400 animate-spin" />
      ) : done ? (
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck size={18} /> مرامنامه با موفقیت تأیید شد
        </div>
      ) : (
        <button onClick={accept} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          تأیید و پذیرش مرامنامه
        </button>
      )}
    </div>
  );
}

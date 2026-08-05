"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// آیکون بله
function BaleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#2aabee" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BaleConnect() {
  const { state } = useApp();
  const [status, setStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [loading, setLoading] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const phone = state.user?.mobileNumber || "";

  useEffect(() => {
    if (!phone) { setChecking(false); return; }
    checkStatus();
  }, [phone]);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch(`${API}/api/bale/status?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.connected ? "connected" : "disconnected");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    } finally {
      setChecking(false);
    }
  }

  async function generateLink() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bale/generate-link?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.deepLink) {
        setDeepLink(data.deepLink);
        // باز کردن لینک
        window.open(data.deepLink, "_blank");
      }
    } catch {}
    finally { setLoading(false); }
  }

  if (!state.isLoggedIn || !phone) return null;
  if (checking) return null;

  // اگه متصله — نشانگر سبز کوچک
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{ background: "rgba(42,171,238,0.08)", border: "1px solid rgba(42,171,238,0.2)" }}>
        <BaleIcon size={16} />
        <span className="text-xs font-bold text-sky-400">بله متصل است</span>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-auto" />
      </div>
    );
  }

  // اگه متصل نیست — دکمه اتصال
  return (
    <div className="rounded-2xl p-4"
      style={{
        background: "linear-gradient(145deg, #0f1e38 0%, #0a1628 100%)",
        border: "1px solid rgba(42,171,238,0.2)",
      }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.2)" }}>
          <BaleIcon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm">اتصال به بات بله</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-5">
            کد ورود، یادآوری رویداد و فاکتور پرداخت رو از طریق بله دریافت کن
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={generateLink}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2aabee, #229ed9)" }}>
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <BaleIcon size={14} />
              )}
              {loading ? "در حال ساخت لینک..." : "اتصال به بله"}
            </button>

            {deepLink && (
              <a href={deepLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-400 transition-all"
                style={{ background: "rgba(42,171,238,0.1)", border: "1px solid rgba(42,171,238,0.2)" }}>
                باز کردن مجدد ↗
              </a>
            )}
          </div>

          {deepLink && (
            <div className="mt-3 p-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-slate-500 mb-1">مراحل اتصال:</p>
              <div className="space-y-1">
                {[
                  "لینک بالا رو در بله باز کن",
                  "دکمه Start رو بزن",
                  "کد OTP رو در بله دریافت می‌کنی",
                ].map((step, i) => (
                  <p key={i} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                      style={{ background: "rgba(42,171,238,0.2)", color: "#2aabee" }}>
                      {i + 1}
                    </span>
                    {step}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

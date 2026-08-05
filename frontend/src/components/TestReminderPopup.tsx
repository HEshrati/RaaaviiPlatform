"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cpu, X, ChevronLeft } from "lucide-react";

const API = "https://raaviiplatform.com";

const CORE_TESTS: Record<string, string> = {
  raavi_matching_basis_v1: "پایه راوی",
  neo_ffi: "NEO پنج عامل",
  ecr_r: "سبک دلبستگی",
  erq: "تنظیم هیجان",
  iri: "همدلی",
};

// صفحاتی که پاپ‌آپ نشون داده میشه
const SHOW_ON_PATHS = [
  "/events", "/articles", "/dashboard", "/content"
];

// صفحاتی که پاپ‌آپ نشون داده نمیشه
const SKIP_PATHS = [
  "/dashboard/tests", "/login", "/register", "/tg-app"
];

export default function TestReminderPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const totalCore = Object.keys(CORE_TESTS).length;

  useEffect(() => {
    // فقط توی صفحات مشخص نشون بده
    const shouldShow = SHOW_ON_PATHS.some(p => pathname.startsWith(p));
    const shouldSkip = SKIP_PATHS.some(p => pathname.startsWith(p));
    if (!shouldShow || shouldSkip) return;

    // هر صفحه فقط یه بار در session نشون بده
    const key = `raavi_test_popup_${pathname.split("/")[1]}`;
    if (sessionStorage.getItem(key)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // با تاخیر ۳ ثانیه نشون بده تا صفحه لود بشه
    const timer = setTimeout(() => {
      fetch(`${API}/api/test-results/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : ({} as any))
        .then(d => {
          const results = (d?.results || d?.data || []);
          const doneIds = results.map((r: any) => r.test_id || r.test_name);
          const missingTests = Object.keys(CORE_TESTS).filter(id => !doneIds.includes(id));
          const done = totalCore - missingTests.length;
          setDoneCount(done);
          if (missingTests.length > 0) {
            setMissing(missingTests.map(id => CORE_TESTS[id]));
            setShow(true);
            sessionStorage.setItem(key, "1");
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!show || missing.length === 0) return null;

  const progress = Math.round((doneCount / totalCore) * 100);

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-96 z-[999]"
      style={{ animation: "slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}
      dir="rtl"
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(120%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1B2A4A,#0f1e35)",
          border: "1px solid rgba(255,107,0,0.35)",
          backdropFilter: "blur(20px)",
        }}>

        {/* نوار بالا */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)" }}>
              <Cpu size={14} className="text-white" />
            </div>
            <span className="text-white font-black text-sm">تست‌های اصلی ناقص داری!</span>
          </div>
          <button onClick={() => setShow(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        {/* محتوا */}
        <div className="px-4 py-3">
          {/* پروگرس بار */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>پیشرفت تست‌های اصلی</span>
            <span className="font-black text-orange-400">{doneCount} از {totalCore}</span>
          </div>
          <div className="h-1.5 rounded-full mb-3 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#FF6B00,#f97316)",
              }} />
          </div>

          {/* تست‌های باقی‌مانده */}
          <p className="text-slate-300 text-xs mb-3 leading-5">
            <span className="text-orange-400 font-black">{missing.slice(0, 3).join("، ")}</span>
            {missing.length > 3 && <span className="text-slate-500"> و {missing.length - 3} مورد دیگر</span>}
            {" "}هنوز تکمیل نشده.
          </p>

          {/* دکمه‌ها */}
          <div className="flex gap-2">
            <a href="/dashboard/tests"
              onClick={() => setShow(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-white transition-all"
              style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)" }}>
              <Cpu size={13} />
              شروع تست
              <ChevronLeft size={12} />
            </a>
            <button onClick={() => setShow(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              بعداً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

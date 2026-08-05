"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";
import { safeRedirectPath } from "@/lib/safe-redirect";
import {
  Shield, HeartPulse, Users, Coffee, LayoutDashboard, Loader2
} from "lucide-react";

const ALL_ROLES = [
  {
    key: "admin",
    label: "پنل ادمین",
    desc: "مدیریت کامل پلتفرم",
    icon: Shield,
    color: "#FF6B00",
    bg: "rgba(255,107,0,0.12)",
    border: "rgba(255,107,0,0.35)",
    target: "/admin/dashboard",
    allowedRoles: ["admin", "super_admin"],
    adminOnly: true,
  },
  {
    key: "psychologist",
    label: "پنل روانشناس",
    desc: "مدیریت بیماران و جلسات",
    icon: HeartPulse,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.35)",
    target: "/panel/psychologist",
    allowedRoles: ["psychologist"],
    adminOnly: false,
  },
  {
    key: "facilitator",
    label: "پنل تسهیلگر",
    desc: "مدیریت رویدادها و رزروها",
    icon: Users,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    target: "/panel/facilitator",
    allowedRoles: ["facilitator"],
    adminOnly: false,
  },
  {
    key: "partner",
    label: "پنل همکاران",
    desc: "مدیریت کافه / مکان",
    icon: Coffee,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
    target: "/panel/partner",
    allowedRoles: ["venue", "cafe", "partner"],
    adminOnly: false,
  },
  {
    key: "user",
    label: "داشبورد کاربری",
    desc: "فضای شخصی راوی",
    icon: LayoutDashboard,
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.35)",
    target: "/dashboard",
    allowedRoles: [],   // همه می‌تونن
    adminOnly: false,
  },
];

function RoleSelectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { state } = useApp();
  const [visible, setVisible] = useState<typeof ALL_ROLES>([]);
  const redirectAfter = params.get("redirect") || "";

  useEffect(() => {
    if (!state.isLoggedIn || state.isLoading) return;

    const role = state.user?.role || "user";
    const phone = state.user?.mobileNumber || "";
    const isAdmin = role === "admin" || role === "super_admin" || isAdminPhone(phone);

    const filtered = ALL_ROLES.filter((r) => {
      if (r.key === "admin") return isAdmin;
      if (r.key === "user") return true;
      if (isAdmin) return true;            // ادمین همه رو می‌بینه
      return r.allowedRoles.includes(role);
    });

    // اگه فقط یه گزینه هست (داشبورد عادی) → مستقیم برو
    setVisible(filtered);
  }, [state.isLoggedIn, state.isLoading]);

  const handleSelect = (item: typeof ALL_ROLES[0]) => {
    sessionStorage.setItem("active_panel", item.key);
    localStorage.setItem("active_panel", item.key);

    // برای نقش «کاربر عادی» (غیر از روانشناس/تسهیلگر که پنل اختصاصی خودشون رو دارن)،
    // از بار دوم ورود به بعد به‌جای داشبورد، مستقیم به صفحه‌ی ایونت‌ها هدایت میشه
    let target = item.target;
    if (item.key === "user" && (state.user?.loginCount || 0) > 1) {
      target = "/events";
    }

    router.replace(safeRedirectPath(redirectAfter, target));
  };

  if (!visible.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
        <Loader2 className="animate-spin text-orange-400" size={32} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#080d1a,#0f172a)" }}
      dir="rtl"
    >
      {/* لوگو */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src="/logo.webp" alt="راوی" className="w-14 h-14 rounded-2xl shadow-lg" />
        <span className="text-2xl font-black" style={{ color: "#FF9A3C" }}>راوی</span>
      </div>

      <h1 className="text-white text-xl font-black mb-2">با چه سِمَتی وارد می‌شوید؟</h1>
      <p className="text-slate-500 text-sm mb-8">یکی از نقش‌های زیر را انتخاب کنید</p>

      <div className={`grid gap-4 w-full max-w-lg ${visible.length <= 2 ? "grid-cols-1" : "grid-cols-2"}`}>
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item)}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl text-center transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{
                background: item.bg,
                border: `1.5px solid ${item.border}`,
                boxShadow: `0 4px 24px ${item.bg}`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg,${item.color}33,${item.color}11)`,
                  boxShadow: `2px 2px 12px ${item.color}33, inset 1px 1px 3px rgba(255,255,255,0.15)`,
                }}
              >
                <Icon size={26} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-white font-black text-base">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RoleSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
        <Loader2 className="animate-spin text-orange-400" size={32} />
      </div>
    }>
      <RoleSelectInner />
    </Suspense>
  );
}

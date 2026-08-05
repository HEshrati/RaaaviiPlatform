"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";

const PANEL_ROLE_MAP: Record<"psychologist"|"facilitator"|"partner", string[]> = {
  psychologist: ["psychologist"],
  facilitator:  ["facilitator"],
  partner:      ["venue", "cafe", "partner"],
};

export default function PanelGuard({ children, requiredRole }: {
  children: React.ReactNode;
  requiredRole: "psychologist"|"facilitator"|"partner";
}) {
  const { state } = useApp();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isLoggedIn) {
      router.replace(`/login?redirect=/panel/${requiredRole}`);
      return;
    }

    const role  = state.user?.role || "";
    const phone = state.user?.mobileNumber || "";
    const isAdmin = role === "admin" || role === "super_admin" || isAdminPhone(phone);

    if (isAdmin) {
      sessionStorage.setItem("active_panel", requiredRole);
      localStorage.setItem("active_panel", requiredRole);
      setAllowed(true);
      setChecking(false);
      return;
    }

    const allowedRoles = PANEL_ROLE_MAP[requiredRole];
    if (!allowedRoles.includes(role)) {
      router.replace("/role-select");
      return;
    }

    // sessionStorage را بررسی کن، اگه خالی بود از localStorage بگیر (بعد از refresh)
    let activePanel = sessionStorage.getItem("active_panel");
    if (!activePanel) {
      activePanel = localStorage.getItem("active_panel");
      if (activePanel) sessionStorage.setItem("active_panel", activePanel);
    }

    // اگه هنوز خالیه یعنی اولین ورود — اگه role مطابقت داره مستقیم بذار وارد بشه
    if (!activePanel) {
      // role کاربر با پنل درخواستی مطابقت داره → اجازه بده
      sessionStorage.setItem("active_panel", requiredRole);
      localStorage.setItem("active_panel", requiredRole);
      setAllowed(true);
      setChecking(false);
      return;
    }

    if (activePanel !== requiredRole) {
      router.replace("/role-select");
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [state.isLoggedIn, state.isLoading, state.user?.role, requiredRole, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }} dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(145deg,#6366f1,#8b5cf6)" }}>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white text-sm font-bold">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}

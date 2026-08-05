"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard, User, Wallet, LogOut, Shield,
  AlertTriangle, Compass, Gamepad2, Bell, ChevronLeft, Home, Heart, HeartPulse, Calendar, MessageSquare,
  Cpu, Settings, HelpCircle,
  Users, Coffee, BookOpen, Clock, CheckCircle2, Sparkles
} from "lucide-react";
import { isAdminPhone } from "@/lib/api";
import { useState, useEffect } from "react";
import TelegramLinkButton from "@/components/TelegramLinkButton";
import DashboardBackground from "@/components/DashboardBackground";

type UserRole = "user" | "psychologist" | "facilitator" | "venue" | "admin" | "super_admin";

const USER_NAV = [
  { href: "/dashboard",               label: "داشبورد",      icon: LayoutDashboard },
  { href: "/dashboard/profile",       label: "پروفایل",      icon: User },
  { href: "/dashboard/explore",       label: "کشف همنشینی",  icon: Compass },
  { href: "/dashboard/compatibility", label: "سازگاری",      icon: Heart },
  { href: "/dashboard/ai-chat",       label: "دستیار AI",    icon: MessageSquare },
  { href: "/dashboard/tests",         label: "تست‌ها",        icon: Cpu },
  { href: "/dashboard/game",          label: "بازی‌ها",       icon: Gamepad2 },
  { href: "/dashboard/sessions",      label: "جلسات من",     icon: Calendar },
  { href: "/dashboard/settings",      label: "تنظیمات",      icon: Settings },
  { href: "/dashboard/support",       label: "پشتیبانی",     icon: HelpCircle },
  { href: "/dashboard/wallet",        label: "کیف پول",      icon: Wallet },
  { href: "/dashboard/notifications", label: "اعلان‌ها",     icon: Bell },
];

const PSYCHOLOGIST_NAV = [
  { href: "/panel/psychologist",          label: "داشبورد",       icon: LayoutDashboard },
  { href: "/panel/psychologist/bookings", label: "مراجعین",       icon: Users },
  { href: "/panel/psychologist/interviews", label: "مصاحبه‌ها",   icon: Calendar },
  { href: "/panel/psychologist/profile",  label: "پروفایل من",    icon: User },
  { href: "/panel/psychologist/availability", label: "زمان‌های خالی", icon: Clock },
  { href: "/dashboard/notifications",         label: "اعلان‌ها",      icon: Bell },
  { href: "/dashboard/wallet",                label: "کیف پول",       icon: Wallet },
  { href: "/dashboard/settings",              label: "تنظیمات",       icon: Settings },
  { href: "/dashboard/support",               label: "پشتیبانی",      icon: HelpCircle },
];

const FACILITATOR_NAV = [
  { href: "/panel/facilitator",               label: "داشبورد",      icon: LayoutDashboard },
  { href: "/panel/facilitator/profile",       label: "پروفایل من",   icon: User },
  { href: "/panel/facilitator/events",        label: "رویدادها",     icon: Calendar },
  { href: "/panel/facilitator/manifesto",     label: "مرامنامه",      icon: CheckCircle2 },
  { href: "/dashboard/notifications",         label: "اعلان‌ها",     icon: Bell },
  { href: "/dashboard/wallet",                label: "کیف پول",      icon: Wallet },
  { href: "/dashboard/settings",              label: "تنظیمات",      icon: Settings },
  { href: "/dashboard/support",               label: "پشتیبانی",     icon: HelpCircle },
];

const VENUE_NAV = [
  { href: "/panel/partner",            label: "داشبورد",      icon: LayoutDashboard },
  { href: "/panel/partner/profile",    label: "پروفایل کافه", icon: Coffee },
  { href: "/panel/partner/bookings",   label: "رویدادها و رزروها", icon: Calendar },
  { href: "/dashboard/notifications",  label: "اعلان‌ها",     icon: Bell },
  { href: "/dashboard/wallet",         label: "کیف پول",      icon: Wallet },
  { href: "/dashboard/settings",       label: "تنظیمات",      icon: Settings },
  { href: "/dashboard/support",        label: "پشتیبانی",     icon: HelpCircle },
];

const BOTTOM_BY_ROLE: Record<UserRole, { href: string; label: string; icon: any }[]> = {
  user: [
    { href: "/dashboard",               label: "داشبورد", icon: LayoutDashboard },
    { href: "/dashboard/compatibility", label: "سازگاری", icon: Heart },
    { href: "/dashboard/tests",         label: "تست‌ها",  icon: Cpu },
    { href: "/dashboard/profile",       label: "پروفایل", icon: User },
  ],
  psychologist: [
    { href: "/panel/psychologist",          label: "داشبورد", icon: LayoutDashboard },
    { href: "/panel/psychologist/bookings", label: "مراجعین", icon: Users },
    { href: "/panel/psychologist/availability", label: "برنامه", icon: Calendar },
    { href: "/panel/psychologist/profile",  label: "پروفایل", icon: User },
  ],
  facilitator: [
    { href: "/panel/facilitator",              label: "داشبورد", icon: LayoutDashboard },
    { href: "/panel/facilitator/events",       label: "رویدادها",icon: Calendar },
    { href: "/panel/facilitator/manifesto",    label: "مرامنامه", icon: BookOpen },
    { href: "/panel/facilitator/profile",      label: "پروفایل", icon: User },
  ],
  venue: [
    { href: "/panel/partner",            label: "داشبورد", icon: LayoutDashboard },
    { href: "/panel/partner/bookings",   label: "رویدادها",icon: Calendar },
    { href: "/dashboard/wallet",         label: "کیف پول", icon: Wallet },
    { href: "/panel/partner/profile",    label: "کافه",    icon: Coffee },
  ],
  admin: [
    { href: "/admin/dashboard", label: "ادمین",    icon: Shield },
    { href: "/dashboard",       label: "داشبورد",  icon: LayoutDashboard },
    { href: "/admin/users",     label: "کاربران",  icon: Users },
    { href: "/admin/events",    label: "رویدادها", icon: Calendar },
  ],
  super_admin: [
    { href: "/admin/dashboard", label: "ادمین",    icon: Shield },
    { href: "/dashboard",       label: "داشبورد",  icon: LayoutDashboard },
    { href: "/admin/users",     label: "کاربران",  icon: Users },
    { href: "/admin/events",    label: "رویدادها", icon: Calendar },
  ],
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; borderColor: string; gradient: string; darkBg: string }> = {
  user:         { label: "کاربر",      color: "#FF9A3C", bg: "rgba(255,107,0,0.07)", borderColor: "rgba(255,107,0,0.15)", gradient: "linear-gradient(135deg,#1a3a5c,#0f2340)", darkBg: "linear-gradient(180deg,#0f172a,#0a0f1e)" },
  psychologist: { label: "روانشناس",  color: "#10b981", bg: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)", gradient: "linear-gradient(135deg,#0a2a1c,#051510)", darkBg: "linear-gradient(180deg,#071a12,#040d0a)" },
  facilitator:  { label: "تسهیلگر",   color: "#f97316", bg: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.25)", gradient: "linear-gradient(135deg,#2a1504,#150a02)", darkBg: "linear-gradient(180deg,#1a0d04,#0d0702)" },
  venue:        { label: "کافه",       color: "#06b6d4", bg: "rgba(6,182,212,0.1)",  borderColor: "rgba(6,182,212,0.25)",  gradient: "linear-gradient(135deg,#062030,#030f18)", darkBg: "linear-gradient(180deg,#041419,#020b0e)" },
  admin:        { label: "ادمین",      color: "#FF6B00", bg: "rgba(255,107,0,0.1)",  borderColor: "rgba(255,107,0,0.25)",  gradient: "linear-gradient(135deg,#1a3a5c,#0f2340)", darkBg: "linear-gradient(180deg,#0f172a,#0a0f1e)" },
  super_admin:  { label: "سوپر ادمین", color: "#FF6B00", bg: "rgba(255,107,0,0.1)",  borderColor: "rgba(255,107,0,0.25)",  gradient: "linear-gradient(135deg,#1a3a5c,#0f2340)", darkBg: "linear-gradient(180deg,#0f172a,#0a0f1e)" },
};

function useEffectiveRole(user: any, isAdmin: boolean, isPsyApproved: boolean): UserRole {
  if (isAdmin) return "admin";
  const role = user?.role as string;
  if (role === "super_admin") return "super_admin";
  if (role === "psychologist" && isPsyApproved) return "psychologist";
  if (role === "facilitator") return "facilitator";
  if (["venue", "cafe", "partner"].includes(role)) return "venue";
  return "user";
}

type PanelReturnLink = { href: string; label: string; mobileLabel: string; icon: any };

function getRolePanelReturnLink(role: string | undefined, isAdmin: boolean): PanelReturnLink | null {
  if (isAdmin || role === "admin" || role === "super_admin") {
    return { href: "/admin/dashboard", label: "بازگشت به پنل ادمین", mobileLabel: "پنل من", icon: Shield };
  }
  if (role === "psychologist") {
    return { href: "/panel/psychologist", label: "بازگشت به پنل روانشناس", mobileLabel: "پنل من", icon: HeartPulse };
  }
  if (role === "facilitator") {
    return { href: "/panel/facilitator", label: "بازگشت به پنل تسهیلگر", mobileLabel: "پنل من", icon: Users };
  }
  if (["venue", "cafe", "partner"].includes(role || "")) {
    return { href: "/panel/partner", label: "بازگشت به پنل همکاران", mobileLabel: "پنل من", icon: Coffee };
  }
  return null;
}

function getNavItems(role: UserRole) {
  switch (role) {
    case "psychologist": return PSYCHOLOGIST_NAV;
    case "facilitator":  return FACILITATOR_NAV;
    case "venue":        return VENUE_NAV;
    default:             return USER_NAV;
  }
}

function getPanelTitle(role: UserRole): string {
  switch (role) {
    case "psychologist": return "پنل روانشناس";
    case "facilitator":  return "پنل تسهیلگر";
    case "venue":        return "پنل کافه";
    case "admin":
    case "super_admin":  return "پنل ادمین";
    default:             return "";
  }
}

function MobileNav({ pathname, role, panelReturn }: { pathname: string; role: UserRole; panelReturn: PanelReturnLink | null }) {
  const bottomItems = BOTTOM_BY_ROLE[role] || BOTTOM_BY_ROLE.user;
  const visibleBottomItems = panelReturn
    ? [{ ...panelReturn, label: panelReturn.mobileLabel }, ...bottomItems.slice(0, 3)]
    : bottomItems;
  const cfg = ROLE_CONFIG[role];

  return (
    <>
      <nav className="mobile-safe-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: "rgba(18,21,33,0.97)", backdropFilter: "blur(22px)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center h-[68px] px-2">
          {visibleBottomItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(href);
            return (
              <a key={href} href={href} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all" style={{ color: active ? cfg.color : "#475569" }}>
                <div style={{ padding: "6px", borderRadius: "10px", background: active ? `${cfg.color}26` : "transparent", transition: "all 0.2s" }}>
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold leading-none">{label}</span>
              </a>
            );
          })}
          <Link href="/" className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full" style={{ color: pathname === "/" ? cfg.color : "#475569" }}>
            <div style={{ padding: "6px", borderRadius: "10px", background: pathname === "/" ? `${cfg.color}26` : "transparent" }}>
              <Home size={19} strokeWidth={pathname === "/" ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold leading-none">خانه</span>
          </Link>
          <Link href="/dashboard/notifications" className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full" style={{ color: pathname === "/dashboard/notifications" ? cfg.color : "#475569" }}>
            <div style={{ padding: "6px", borderRadius: "10px", background: pathname === "/dashboard/notifications" ? `${cfg.color}26` : "transparent" }}>
              <Bell size={19} strokeWidth={pathname === "/dashboard/notifications" ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold leading-none">اعلان‌ها</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function RoleSidebar({ userName, initial, mobileNumber, isAdmin, role, onLogout, pathname, panelReturn }: any) {
  const cfg = ROLE_CONFIG[role as UserRole] || ROLE_CONFIG.user;
  const navItems = getNavItems(role);
  const panelTitle = getPanelTitle(role);
  const rootHref = role === "psychologist" ? "/panel/psychologist" : role === "facilitator" ? "/panel/facilitator" : role === "venue" ? "/panel/partner" : "/dashboard";

  return (
    <aside className="hidden lg:flex flex-col w-[258px] flex-shrink-0 sticky top-0 h-screen z-40"
      style={{ background: "#171a29", borderLeft: "1px solid rgba(255,255,255,.065)", pointerEvents: "auto", isolation: "isolate" }}>
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[.055]">
        <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-black text-white shadow-[0_7px_22px_rgba(249,115,22,.26)]">ر</span>
          <div>
            <span className="text-lg font-black text-white">راوی</span>
            {panelTitle && <div className="text-[9px] font-bold mt-0.5 text-slate-500">{panelTitle}</div>}
          </div>
        </Link>
        <Sparkles size={14} style={{ color: cfg.color }} />
      </div>
      <div className="px-3.5 py-4 border-b border-white/[.045]">
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/[.06] bg-white/[.035]">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(145deg,${cfg.color},#e85d04)`, boxShadow: `0 0 16px ${cfg.color}25` }}>
            <span className="text-base font-black text-white">{initial}</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[3px] border-[#202332] bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-white text-sm truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{mobileNumber}</p>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}14` }}>
            {cfg.label}
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3.5 py-3 space-y-0.5 overflow-y-auto [scrollbar-width:thin]" style={{ pointerEvents: "auto" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== rootHref && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 relative overflow-hidden ${active ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-200 hover:bg-white/[.035]"}`}
              style={active ? { background: `linear-gradient(135deg,${cfg.color},#f2650b)`, boxShadow: `0 5px 20px ${cfg.color}35` } : {}}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-white/15" : "bg-transparent"}`}><Icon size={16} /></div>
              <span>{label}</span>
              {active && <ChevronLeft size={14} className="mr-auto" />}
            </Link>
          );
        })}
        {(role === "admin" || role === "super_admin") && (
          <>
            <div className="border-t border-white/8 my-2" />
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0"><Shield size={15} /></div>
              پنل ادمین
            </Link>
          </>
        )}
      </nav>
      <div className="px-3.5 pb-5 pt-3 border-t border-white/[.05] space-y-1">
        {role === "user" && <div className="mb-3"><TelegramLinkButton /></div>}
        {panelReturn && (() => {
          const Icon = panelReturn.icon;
          return (
            <Link href={panelReturn.href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.borderColor}` }}>
              <Icon size={16} /> {panelReturn.label}
            </Link>
          );
        })()}
        <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Home size={16} /> صفحه اصلی
        </Link>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={16} /> خروج از حساب
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mbtiBlocking, setMbtiBlocking] = useState(false);
  const [isPsyApproved, setIsPsyApproved] = useState(false);

  const userName = state.user?.name || "کاربر راوی";
  const initial = userName.charAt(0);
  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  useEffect(() => {
    if (state.user?.role !== "psychologist" || isAdmin) return;
    const token = localStorage.getItem("token") || "";
    fetch("https://raaviiplatform.com/api/psychologist/my-profile", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(d => setIsPsyApproved(d?.verificationStatus === "approved")).catch(() => setIsPsyApproved(false));
  }, [state.user?.role, isAdmin]);

  const isUserDashboard = searchParams.get("user") === "1";
  const isProfessionalUserDashboard = isUserDashboard &&
    (isAdmin || ["psychologist", "facilitator", "partner", "venue", "cafe"].includes(state.user?.role || ""));
  const effectiveRole = isUserDashboard
    ? "user"
    : useEffectiveRole(state.user, isAdmin, isPsyApproved);
  const panelReturn = isUserDashboard
    ? getRolePanelReturnLink(state.user?.role, isAdmin)
    : null;
  const isDashboardHome = pathname === "/dashboard";

  // ── redirect به پنل اختصاصی هنگام ورود به /dashboard ─────────
  useEffect(() => {
    if (!state.isLoggedIn) return;
    if (pathname !== "/dashboard" || isUserDashboard) return;
    if (effectiveRole === "psychologist") router.replace("/panel/psychologist");
    else if (effectiveRole === "facilitator") router.replace("/panel/facilitator");
    else if (effectiveRole === "venue") router.replace("/panel/partner");
  }, [effectiveRole, isUserDashboard, pathname, state.isLoggedIn]);

  // ── MBTI guard فقط برای کاربر عادی ──────────────────────────
  useEffect(() => {
    if (!state.isLoggedIn || effectiveRole !== "user" || isProfessionalUserDashboard) { setMbtiBlocking(false); return; }
    const tok = localStorage.getItem("token") || "";
    if (!tok) { setMbtiBlocking(false); return; }
    const MBTI_PAGE = "/dashboard/tests/raavi_matching_basis_v1";
    if (pathname === MBTI_PAGE || pathname.startsWith(MBTI_PAGE) || sessionStorage.getItem("raavi_mbti_done") === "1") { setMbtiBlocking(false); return; }
    fetch("https://raaviiplatform.com/api/test-results/my", { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        const doneTests = ((d as any)?.results || (d as any)?.data || []).map((r: any) => r.test_name);
        const hasMBTI = doneTests.some((t: string) => t.includes("matching_basis") || t === "mbti");
        if (!hasMBTI) { router.replace(MBTI_PAGE); return; }
        document.cookie = "mbti_done=1; path=/; max-age=31536000; SameSite=Lax";
        if (state.user && !state.user.isTestTaken) {
          const u = { ...state.user, isTestTaken: true };
          dispatch?.({ type: "SET_USER", payload: u });
          localStorage.setItem("user", JSON.stringify(u));
        }
        setMbtiBlocking(false);
      }).catch(() => setMbtiBlocking(false));
  }, [state.isLoggedIn, pathname, effectiveRole, isProfessionalUserDashboard]);

  async function handleLogout() {
    try {
      const token = localStorage.getItem("token");
      if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    } catch {}
    localStorage.removeItem("token"); localStorage.removeItem("user"); localStorage.removeItem("city");
    sessionStorage.clear(); // active_panel هم پاک می‌شه
    document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "test_taken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    dispatch?.({ type: "LOGOUT" } as any);
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen pb-[68px] lg:pb-0 relative" dir="rtl" style={{ background: "transparent" }}>
      {!isDashboardHome && <DashboardBackground />}
      {mbtiBlocking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "#0f172a" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg,#FF6B00,#f97316)" }}><Cpu size={32} className="text-white" /></div>
            <p className="text-white font-black">در حال بارگذاری...</p>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl" style={{ background: "linear-gradient(145deg,#1B2A4A,#0f172a)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle size={22} className="text-red-400" />
              </div>
              <div><h3 className="font-black text-white text-base">خروج از حساب</h3><p className="text-slate-400 text-xs mt-0.5">آیا مطمئن هستید؟</p></div>
            </div>
            <p className="text-slate-300 text-sm mb-6">با خروج، تمام اطلاعات جلسه پاک می‌شود و باید مجدداً وارد شوید.</p>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-all">بله، خروج</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-2xl font-black text-sm text-slate-300 transition-all" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
      <RoleSidebar userName={userName} initial={initial} mobileNumber={state.user?.mobileNumber} isAdmin={isAdmin} role={effectiveRole} onLogout={() => setShowLogoutConfirm(true)} pathname={pathname} panelReturn={panelReturn} />
      <main className="flex-1 min-w-0 min-h-screen overflow-y-auto relative z-10" style={{ pointerEvents: "auto", background: isDashboardHome ? "#090e1b" : "#ffffff" }}>
        <div className={isDashboardHome ? "p-3 sm:p-5 lg:p-7" : "p-4 lg:p-6"}>{children}</div>
      </main>
    </div>
  );
}

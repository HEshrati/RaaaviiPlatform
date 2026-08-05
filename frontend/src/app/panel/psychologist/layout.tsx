"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard, User, Calendar, Users, ClipboardList, LogOut, Home, ShieldCheck, Coffee, HeartPulse, 
TrendingUp, } from "lucide-react";
import PanelGuard from "@/components/panel/PanelGuard";

// باگ رفع‌شده: صفحه‌ی /panel/psychologist/status اصلاً نه در منوی دسکتاپ و نه در
// نوبار موبایل لینک نداشت (بر خلاف پنل تسهیلگر/همکار که حداقل در موبایل داشتند)،
// یعنی این صفحه کاملاً از هر دو نسخه غیرقابل‌دسترس بود.
const MENU = [
  { href: "/panel/psychologist",              label: "داشبورد",              icon: LayoutDashboard },
  { href: "/panel/psychologist/profile",       label: "پروفایل تخصصی",        icon: User },
  { href: "/panel/psychologist/availability",  label: "برنامه زمانی",          icon: Calendar },
  { href: "/panel/psychologist/bookings",      label: "مراجعین من",            icon: Users },
  { href: "/panel/psychologist/interviews",    label: "چک‌لیست مصاحبه بالینی", icon: ClipboardList },
  { href: "/panel/psychologist/status",        label: "وضعیت تایید",          icon: TrendingUp },
];

export default function PsychologistPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, dispatch } = useApp();

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    dispatch?.({ type: "LOGOUT" } as any);
    router.replace("/login");
  }

  return (
    <PanelGuard requiredRole="psychologist">
      <div className="flex min-h-screen" dir="rtl" style={{ background: "#0f172a" }}>
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-0 h-screen"
          style={{ background: "linear-gradient(180deg,#0f172a,#0a0f1e)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#10b98122" }}>
              <HeartPulse size={20} style={{ color: "#10b981" }} />
            </div>
            <div>
              <p className="text-white font-black text-sm">پنل روانشناس</p>
              <p className="text-[11px] text-slate-500">{state.user?.name || ""}</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {MENU.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/panel/psychologist" && pathname.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                  style={active ? { background: "linear-gradient(135deg,#10b981,#059669)" } : {}}>
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 pb-5 pt-3 border-t border-white/8 space-y-1">
            <Link href="/dashboard?user=1" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">
              <Home size={16} /> بازگشت به داشبورد عادی
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10">
              <LogOut size={16} /> خروج از حساب
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "#0f172a" }}>
          <div className="p-4 lg:p-6">{children}</div>
        </main>

      {/* موبایل navbar پایین */}
      <nav className="lg:hidden fixed bottom-0 right-0 left-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: "rgba(10,15,30,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        <Link key="/panel/psychologist" href="/panel/psychologist"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: pathname === "/panel/psychologist" ? `#10b98118` : "transparent" }}>
          <LayoutDashboard size={14} style={{ color: pathname === "/panel/psychologist" ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: pathname === "/panel/psychologist" ? "#10b981" : "#475569" }}>داشبورد</span>
        </Link>
        <Link key="/panel/psychologist/profile" href="/panel/psychologist/profile"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/psychologist/profile" || pathname.startsWith("/panel/psychologist/profile/")) ? `#10b98118` : "transparent" }}>
          <User size={14} style={{ color: (pathname === "/panel/psychologist/profile" || pathname.startsWith("/panel/psychologist/profile/")) ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/psychologist/profile" || pathname.startsWith("/panel/psychologist/profile/")) ? "#10b981" : "#475569" }}>پروفایل</span>
        </Link>
        <Link key="/panel/psychologist/availability" href="/panel/psychologist/availability"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/psychologist/availability" || pathname.startsWith("/panel/psychologist/availability/")) ? `#10b98118` : "transparent" }}>
          <Calendar size={14} style={{ color: (pathname === "/panel/psychologist/availability" || pathname.startsWith("/panel/psychologist/availability/")) ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/psychologist/availability" || pathname.startsWith("/panel/psychologist/availability/")) ? "#10b981" : "#475569" }}>برنامه</span>
        </Link>
        <Link key="/panel/psychologist/bookings" href="/panel/psychologist/bookings"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/psychologist/bookings" || pathname.startsWith("/panel/psychologist/bookings/")) ? `#10b98118` : "transparent" }}>
          <Users size={14} style={{ color: (pathname === "/panel/psychologist/bookings" || pathname.startsWith("/panel/psychologist/bookings/")) ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/psychologist/bookings" || pathname.startsWith("/panel/psychologist/bookings/")) ? "#10b981" : "#475569" }}>مراجعین</span>
        </Link>
        <Link key="/panel/psychologist/interviews" href="/panel/psychologist/interviews"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/psychologist/interviews" || pathname.startsWith("/panel/psychologist/interviews/")) ? `#10b98118` : "transparent" }}>
          <ClipboardList size={14} style={{ color: (pathname === "/panel/psychologist/interviews" || pathname.startsWith("/panel/psychologist/interviews/")) ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/psychologist/interviews" || pathname.startsWith("/panel/psychologist/interviews/")) ? "#10b981" : "#475569" }}>مصاحبه</span>
        </Link>
        <Link key="/panel/psychologist/status" href="/panel/psychologist/status"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/psychologist/status" || pathname.startsWith("/panel/psychologist/status/")) ? `#10b98118` : "transparent" }}>
          <TrendingUp size={14} style={{ color: (pathname === "/panel/psychologist/status" || pathname.startsWith("/panel/psychologist/status/")) ? "#10b981" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/psychologist/status" || pathname.startsWith("/panel/psychologist/status/")) ? "#10b981" : "#475569" }}>وضعیت</span>
        </Link>
      </nav>
      <div className="lg:hidden h-16" />
      </div>
    </PanelGuard>
  );
}



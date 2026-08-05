"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard, User, Calendar, Users, ClipboardList, LogOut, Home, ShieldCheck, Coffee, TrendingUp, 
} from "lucide-react";
import PanelGuard from "@/components/panel/PanelGuard";

// باگ رفع‌شده: صفحه‌ی /panel/facilitator/status در پروژه وجود داشت و در نوبار موبایل
// لینک آن بود، اما در منوی دسکتاپ اصلاً لینکی به آن نبود؛ یعنی در نسخه دسکتاپ
// این صفحه عملاً از دسترس خارج (dead-end) بود.
const MENU = [
  { href: "/panel/facilitator",            label: "داشبورد",          icon: LayoutDashboard },
  { href: "/panel/facilitator/profile",     label: "پروفایل تسهیلگری", icon: User },
  { href: "/panel/facilitator/manifesto",   label: "مرامنامه راوی",    icon: ShieldCheck },
  { href: "/panel/facilitator/events",      label: "مدیریت رویداد",    icon: Calendar },
  { href: "/panel/facilitator/status",      label: "وضعیت و آمار",     icon: TrendingUp },
];

export default function FacilitatorPanelLayout({ children }: { children: React.ReactNode }) {
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
    <PanelGuard requiredRole="facilitator">
      <div className="flex min-h-screen" dir="rtl" style={{ background: "#0f172a" }}>
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-0 h-screen"
          style={{ background: "linear-gradient(180deg,#0f172a,#0a0f1e)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b22" }}>
              <Users size={20} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <p className="text-white font-black text-sm">پنل تسهیلگر</p>
              <p className="text-[11px] text-slate-500">{state.user?.name || ""}</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {MENU.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/panel/facilitator" && pathname.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                  style={active ? { background: "linear-gradient(135deg,#f59e0b,#d97706)" } : {}}>
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

        <Link key="/panel/facilitator" href="/panel/facilitator"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: pathname === "/panel/facilitator" ? `#f59e0b18` : "transparent" }}>
          <LayoutDashboard size={14} style={{ color: pathname === "/panel/facilitator" ? "#f59e0b" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: pathname === "/panel/facilitator" ? "#f59e0b" : "#475569" }}>داشبورد</span>
        </Link>
        <Link key="/panel/facilitator/profile" href="/panel/facilitator/profile"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/facilitator/profile" || pathname.startsWith("/panel/facilitator/profile/")) ? `#f59e0b18` : "transparent" }}>
          <User size={14} style={{ color: (pathname === "/panel/facilitator/profile" || pathname.startsWith("/panel/facilitator/profile/")) ? "#f59e0b" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/facilitator/profile" || pathname.startsWith("/panel/facilitator/profile/")) ? "#f59e0b" : "#475569" }}>پروفایل</span>
        </Link>
        <Link key="/panel/facilitator/manifesto" href="/panel/facilitator/manifesto"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/facilitator/manifesto" || pathname.startsWith("/panel/facilitator/manifesto/")) ? `#f59e0b18` : "transparent" }}>
          <ShieldCheck size={14} style={{ color: (pathname === "/panel/facilitator/manifesto" || pathname.startsWith("/panel/facilitator/manifesto/")) ? "#f59e0b" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/facilitator/manifesto" || pathname.startsWith("/panel/facilitator/manifesto/")) ? "#f59e0b" : "#475569" }}>مرامنامه</span>
        </Link>
        <Link key="/panel/facilitator/events" href="/panel/facilitator/events"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/facilitator/events" || pathname.startsWith("/panel/facilitator/events/")) ? `#f59e0b18` : "transparent" }}>
          <Calendar size={14} style={{ color: (pathname === "/panel/facilitator/events" || pathname.startsWith("/panel/facilitator/events/")) ? "#f59e0b" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/facilitator/events" || pathname.startsWith("/panel/facilitator/events/")) ? "#f59e0b" : "#475569" }}>رویدادها</span>
        </Link>
        <Link key="/panel/facilitator/status" href="/panel/facilitator/status"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/facilitator/status" || pathname.startsWith("/panel/facilitator/status/")) ? `#f59e0b18` : "transparent" }}>
          <TrendingUp size={14} style={{ color: (pathname === "/panel/facilitator/status" || pathname.startsWith("/panel/facilitator/status/")) ? "#f59e0b" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/facilitator/status" || pathname.startsWith("/panel/facilitator/status/")) ? "#f59e0b" : "#475569" }}>وضعیت</span>
        </Link>
      </nav>
      <div className="lg:hidden h-16" />
      </div>
    </PanelGuard>
  );
}



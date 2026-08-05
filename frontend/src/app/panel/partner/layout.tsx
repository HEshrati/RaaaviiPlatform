"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard, User, Calendar, Users, ClipboardList, LogOut, Home, ShieldCheck, Coffee, 
  TrendingUp,
} from "lucide-react";
import PanelGuard from "@/components/panel/PanelGuard";

// باگ رفع‌شده: مشابه پنل تسهیلگر، صفحه‌ی /panel/partner/status در دسکتاپ لینکی نداشت.
const MENU = [
  { href: "/panel/partner",                label: "داشبورد",            icon: LayoutDashboard },
  { href: "/panel/partner/profile",         label: "اطلاعات فضا",         icon: Coffee },
  { href: "/panel/partner/verification",    label: "تاییدیه میزبانی",     icon: ShieldCheck },
  { href: "/panel/partner/bookings",        label: "رویدادهای رزروشده",   icon: Calendar },
  { href: "/panel/partner/status",          label: "وضعیت و آمار",        icon: TrendingUp },
];

export default function PartnerPanelLayout({ children }: { children: React.ReactNode }) {
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
    <PanelGuard requiredRole="partner">
      <div className="flex min-h-screen" dir="rtl" style={{ background: "#0f172a" }}>
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-0 h-screen"
          style={{ background: "linear-gradient(180deg,#0f172a,#0a0f1e)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#22c55e22" }}>
              <Coffee size={20} style={{ color: "#22c55e" }} />
            </div>
            <div>
              <p className="text-white font-black text-sm">پنل همکاران</p>
              <p className="text-[11px] text-slate-500">{state.user?.name || ""}</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {MENU.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/panel/partner" && pathname.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                  style={active ? { background: "linear-gradient(135deg,#22c55e,#16a34a)" } : {}}>
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

        <Link key="/panel/partner" href="/panel/partner"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: pathname === "/panel/partner" ? `#22c55e18` : "transparent" }}>
          <LayoutDashboard size={14} style={{ color: pathname === "/panel/partner" ? "#22c55e" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: pathname === "/panel/partner" ? "#22c55e" : "#475569" }}>داشبورد</span>
        </Link>
        <Link key="/panel/partner/profile" href="/panel/partner/profile"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/partner/profile" || pathname.startsWith("/panel/partner/profile/")) ? `#22c55e18` : "transparent" }}>
          <Coffee size={14} style={{ color: (pathname === "/panel/partner/profile" || pathname.startsWith("/panel/partner/profile/")) ? "#22c55e" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/partner/profile" || pathname.startsWith("/panel/partner/profile/")) ? "#22c55e" : "#475569" }}>پروفایل</span>
        </Link>
        <Link key="/panel/partner/verification" href="/panel/partner/verification"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/partner/verification" || pathname.startsWith("/panel/partner/verification/")) ? `#22c55e18` : "transparent" }}>
          <ShieldCheck size={14} style={{ color: (pathname === "/panel/partner/verification" || pathname.startsWith("/panel/partner/verification/")) ? "#22c55e" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/partner/verification" || pathname.startsWith("/panel/partner/verification/")) ? "#22c55e" : "#475569" }}>تأیید</span>
        </Link>
        <Link key="/panel/partner/bookings" href="/panel/partner/bookings"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/partner/bookings" || pathname.startsWith("/panel/partner/bookings/")) ? `#22c55e18` : "transparent" }}>
          <Calendar size={14} style={{ color: (pathname === "/panel/partner/bookings" || pathname.startsWith("/panel/partner/bookings/")) ? "#22c55e" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/partner/bookings" || pathname.startsWith("/panel/partner/bookings/")) ? "#22c55e" : "#475569" }}>رویدادها</span>
        </Link>
        <Link key="/panel/partner/status" href="/panel/partner/status"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: (pathname === "/panel/partner/status" || pathname.startsWith("/panel/partner/status/")) ? `#22c55e18` : "transparent" }}>
          <TrendingUp size={14} style={{ color: (pathname === "/panel/partner/status" || pathname.startsWith("/panel/partner/status/")) ? "#22c55e" : "#475569" }} />
          <span className="text-[10px] font-bold" style={{ color: (pathname === "/panel/partner/status" || pathname.startsWith("/panel/partner/status/")) ? "#22c55e" : "#475569" }}>وضعیت</span>
        </Link>
      </nav>
      <div className="lg:hidden h-16" />
      </div>
    </PanelGuard>
  );
}



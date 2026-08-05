"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import AdminAIChat from "@/components/AdminAIChat";
import AdminPanelLink from "@/components/AdminPanelLink";
import {
  LayoutDashboard, Users, Calendar, BookOpen, Cpu, Gamepad2,
  MessageSquare, BarChart2, TrendingUp, FileText,
  LogOut, ShieldCheck, Home, Menu, X,
  UserCog, Activity, Coffee, Star, ChevronLeft, HeartPulse,
  MessageCircle, DollarSign, Sparkles, Eye
} from "lucide-react";

const NAV = [
  {
    group: "آمار و گزارش", emoji: "📊",
    items: [
      { href: "/admin/dashboard",         label: "داشبورد اصلی",      icon: LayoutDashboard, color: "#FF6B00" },
      { href: "/admin/smart-dashboard",   label: "داشبورد هوشمند",    icon: Cpu,           color: "#8B5CF6" },
      { href: "/admin/roi",               label: "بازگشت سرمایه",     icon: TrendingUp,      color: "#10B981" },
      { href: "/admin/intelligence",      label: "تحلیل هوشمند",      icon: Activity,        color: "#3B82F6" },
      { href: "/admin/seasonal-analysis", label: "آنالیز فصلی",       icon: BarChart2,       color: "#F59E0B" },
      { href: "/admin/popular-programs",  label: "برنامه‌های محبوب",  icon: Star,            color: "#EC4899" },
    ],
  },
  {
    group: "کاربران", emoji: "👥",
    items: [
      { href: "/admin/users",    label: "مدیریت کاربران", icon: Users,   color: "#06B6D4" },
      { href: "/admin/crm",      label: "CRM",             icon: UserCog, color: "#8B5CF6" },
      { href: "/admin/matching", label: "الگوریتم مچینگ", icon: Cpu,   color: "#F59E0B" },
    ],
  },
  {
    group: "رویدادها", emoji: "📅",
    items: [
      { href: "/admin/tests",    label: "تست‌ها",           icon: Cpu,     color: "#FF6B00" },
      { href: "/admin/games",    label: "بازی‌های ایونت",  icon: Gamepad2,  color: "#22c55e" },
      { href: "/admin/events",   label: "مدیریت رویدادها", icon: Calendar,  color: "#10B981" },
      { href: "/admin/bookings", label: "رزروها",           icon: BookOpen,  color: "#3B82F6" },
    ],
  },
  {
    group: "هوش مصنوعی", emoji: "🤖",
    items: [
      { href: "/admin/ai-chat", label: "چت هوش مصنوعی", icon: MessageSquare, color: "#8B5CF6" },
      { href: "/admin/content", label: "مدیریت محتوا",   icon: FileText,      color: "#F59E0B" },
    ],
  },
  {
    group: "تأیید حرفه‌ای‌ها", emoji: "✅",
    items: [
      { href: "/admin/professionals", label: "مدیریت و تأیید حرفه‌ای‌ها", icon: ShieldCheck, color: "#22C55E" },
    ],
  },
  {
    group: "مشاهده پنل‌ها", emoji: "👁️",
    items: [
      { href: "/panel/psychologist", label: "پنل روانشناس",  icon: HeartPulse,     color: "#6366f1" },
      { href: "/panel/facilitator",  label: "پنل تسهیلگر",   icon: Users,          color: "#f59e0b" },
      { href: "/panel/partner",      label: "پنل همکاران",   icon: Coffee,         color: "#22c55e" },
      { href: "/dashboard",          label: "داشبورد کاربری", icon: LayoutDashboard, color: "#64748b" },
    ],
  },
  {
    group: "سیستم", emoji: "⚙️",
    items: [
      { href: "/panel/psychologist", label: "پنل روانشناسان", icon: HeartPulse, color: "#10B981" },
      { href: "/panel/facilitator",  label: "پنل تسهیلگران",  icon: Users,      color: "#F97316" },
      { href: "/panel/partner",      label: "پنل همکاران",    icon: Coffee,     color: "#22C55E" },
      { href: "/admin/support",        label: "تیکت‌های پشتیبانی", icon: MessageCircle, color: "#06B6D4" },
      { href: "/admin/payments",       label: "پرداخت‌ها",          icon: DollarSign,    color: "#10B981" },
      { href: "/admin/test-analytics", label: "آنالیز تست‌ها",     icon: Cpu,         color: "#3B82F6" },
      { href: "/admin/cafe-telegram",  label: "کافه و تلگرام",     icon: Coffee,        color: "#F59E0B" },
    ],
  },
];

// ── Sidebar — کامپوننت مستقل بیرون از AdminLayout ─────────────
function AdminSidebar({ userName, onClose, onLogout }: {
  userName: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-72 flex-shrink-0"
      style={{
        background: "linear-gradient(180deg,#080d1a 0%,#050810 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{
          background: "linear-gradient(135deg,rgba(255,107,0,0.08),rgba(139,92,246,0.05))",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#FF6B00,#FF9A3C)", boxShadow:"0 0 20px rgba(255,107,0,0.4)" }}>
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <div className="font-black text-white text-sm">پنل ادمین</div>
            <div className="text-orange-500 text-[10px]">راوی پلتفرم</div>
          </div>
        </Link>
        <button onClick={onClose}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <X size={16} />
        </button>
      </div>

      {/* User badge */}
      <div className="px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background:"linear-gradient(135deg,rgba(255,107,0,0.08),rgba(255,107,0,0.03))", border:"1px solid rgba(255,107,0,0.15)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,rgba(255,107,0,0.3),rgba(255,107,0,0.1))" }}>
            <span className="text-lg">👤</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs font-bold truncate">{userName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-green-400 text-[10px]">ادمین فعال</span>
            </div>
          </div>
          <Sparkles size={12} className="text-orange-400 opacity-60 flex-shrink-0" />
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
        style={{ scrollbarWidth:"none", overscrollBehavior:"contain" }}>
        <style>{`nav::-webkit-scrollbar{display:none}`}</style>
        {NAV.map(group => (
          <div key={group.group}>
            {group.group === "مشاهده پنل‌ها" ? (
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-1 mt-3">
                  {group.emoji} {group.group}
                </p>
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <AdminPanelLink
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full"
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${item.color}22` }}>
                        <Icon size={13} style={{ color: item.color }} />
                      </div>
                      {item.label}
                    </AdminPanelLink>
                  );
                })}
              </div>
            ) : null}
            {group.group !== "مشاهده پنل‌ها" ? (
            <div>
              <div className="flex items-center gap-2 px-2 mb-2">
                <span className="text-xs">{group.emoji}</span>
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">{group.group}</p>
                <div className="flex-1 h-px" style={{ background:"linear-gradient(90deg,rgba(255,255,255,0.05),transparent)" }} />
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, color }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link key={href} href={href} onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold relative overflow-hidden transition-all"
                      style={{
                        color: active ? "#fff" : "#64748b",
                        background: active ? `linear-gradient(135deg,${color}22,${color}11)` : "transparent",
                        border: active ? `1px solid ${color}33` : "1px solid transparent",
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLElement).style.color = "#cbd5e1";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "#64748b";
                        }
                      }}>
                      {active && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                          style={{ background:color, boxShadow:`0 0 8px ${color}` }} />
                      )}
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? `${color}25` : "rgba(255,255,255,0.04)" }}>
                        <Icon size={13} style={{ color: active ? color : "#475569" }} />
                      </div>
                      <span className="flex-1 truncate">{label}</span>
                      {active && <ChevronLeft size={11} className="flex-shrink-0 opacity-60" style={{ color }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
            ) : null}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 space-y-1" style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <Link href="/dashboard?user=1"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 transition-all"
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Home size={13} />
          </div>
          بازگشت به سایت
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 transition-all"
          onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.08)"; e.currentTarget.style.color="#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748b"; }}>
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <LogOut size={13} />
          </div>
          خروج از سیستم
        </button>
      </div>
    </aside>
  );
}

// ── Main Layout ────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const isAdmin = isAdminPhone(state.user?.mobileNumber);
  const checked = useRef(false);

  useEffect(() => {
    if (state.isLoading || checked.current) return;
    checked.current = true;
    if (!state.isLoggedIn || !isAdmin) router.replace("/dashboard");
  }, [state.isLoading]);

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    dispatch?.({ type: "LOGOUT" } as any);
    router.replace("/login");
  }

  const userName = state.user?.name || "ادمین";

  return (
    <div className="flex min-h-screen" dir="rtl" style={{ background:"#f1f5f9" }}>

      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen z-40 flex-shrink-0">
        <AdminSidebar userName={userName} onClose={() => {}} onLogout={logout} />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80" style={{ backdropFilter:"blur(4px)" }} />
          <div className="relative h-full" onClick={e => e.stopPropagation()}>
            <AdminSidebar userName={userName} onClose={() => setOpen(false)} onLogout={logout} />
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background:"rgba(6,9,18,0.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-orange-400" />
          <span className="font-black text-white text-sm">پنل ادمین</span>
        </div>
        <button onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400"
          style={{ background:"rgba(255,255,255,0.06)" }}>
          <Menu size={18} />
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-y-auto">
        {children}
        <AdminAIChat />
      </main>
    </div>
  );
}

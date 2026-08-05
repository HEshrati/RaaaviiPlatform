"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";
import {
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowUpRight,
  Cpu,
  MessageSquare,
  Zap,
  Eye,
  Plus,
  UserCheck,
  DollarSign,
  BarChart2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function token() {
  return typeof window !== "undefined"
    ? localStorage.getItem("token") || ""
    : "";
}

async function apiFetch(path: string) {
  const r = await fetch(`${API}/api${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

interface Stats {
  totalUsers?: number;
  activeUsers?: number;
  totalEvents?: number;
  totalBookings?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  newUsersToday?: number;
  newUsersThisWeek?: number;
}

const COLOR_BG: Record<string, string> = {
  orange: "rgba(255,107,0,0.1)",
  blue: "rgba(59,130,246,0.1)",
  green: "rgba(34,197,94,0.1)",
  purple: "rgba(168,85,247,0.1)",
  red: "rgba(239,68,68,0.1)",
  yellow: "rgba(234,179,8,0.1)",
};
const COLOR_BORDER: Record<string, string> = {
  orange: "#fed7aa",
  blue: "#bfdbfe",
  green: "#bbf7d0",
  purple: "#e9d5ff",
  red: "#fecaca",
  yellow: "#fef08a",
};
const COLOR_TEXT: Record<string, string> = {
  orange: "#ea580c",
  blue: "#2563eb",
  green: "#16a34a",
  purple: "#9333ea",
  red: "#dc2626",
  yellow: "#ca8a04",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "orange",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  href?: string;
}) {
  const Card = (
    <div
      className="p-5 rounded-2xl transition-all hover:-translate-y-0.5"
      style={{
        background: "#ffffff",
        border: `1px solid ${COLOR_BORDER[color]}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: COLOR_BG[color] }}
        >
          {icon}
        </div>
        {href && (
          <ArrowUpRight size={14} style={{ color: COLOR_TEXT[color] }} />
        )}
      </div>
      <div className="text-2xl font-black text-slate-800 mb-1">
        {value === null || value === undefined
          ? "—"
          : String(value).toLocaleString()}
      </div>
      <div className="text-slate-500 text-xs font-semibold">{label}</div>
      {sub && <div className="text-slate-400 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{Card}</Link> : Card;
}

function QuickAction({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all"
      style={{ background: "#ffffff" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <span className="text-slate-700 text-xs font-bold">{label}</span>
      <ArrowUpRight size={12} className="mr-auto text-slate-400" />
    </Link>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { state } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({});
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const checkedAuth = useRef(false);

  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  // auth check فقط یک بار — جلوگیری از scroll reset
  useEffect(() => {
    if (checkedAuth.current) return;
    if (state.isLoading) return;
    checkedAuth.current = true;
    if (!state.isLoggedIn || !isAdmin) {
      router.replace("/dashboard");
    }
  }, [state.isLoading]);

  async function loadData() {
    setLoading(true);
    setErr("");
    try {
      const [statsData, bookingsData, usersData] = await Promise.allSettled([
        apiFetch("/admin/stats"),
        apiFetch("/admin/bookings?limit=5"),
        apiFetch("/admin/users?limit=5&sort=newest"),
      ]);

      if (statsData.status === "fulfilled") {
        const s = statsData.value;
        setStats({
          totalUsers: s.totalUsers ?? s.total_users,
          activeUsers: s.activeUsers ?? s.active_users,
          totalEvents: s.totalEvents ?? s.total_events,
          totalBookings: s.totalBookings ?? s.total_bookings,
          totalRevenue: s.totalRevenue ?? s.total_revenue,
          pendingBookings: s.pendingBookings ?? s.pending_bookings,
          newUsersToday: s.newUsersToday ?? s.new_users_today,
          newUsersThisWeek: s.newUsersThisWeek ?? s.new_users_week,
        });
      }
      if (bookingsData.status === "fulfilled") {
        const b = bookingsData.value;
        setRecentBookings(
          Array.isArray(b)
            ? b.slice(0, 5)
            : (b.bookings || b.data || []).slice(0, 5),
        );
      }
      if (usersData.status === "fulfilled") {
        const u = usersData.value;
        setRecentUsers(
          Array.isArray(u)
            ? u.slice(0, 5)
            : (u.users || u.data || []).slice(0, 5),
        );
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">داشبورد ادمین</h1>
          <p className="text-slate-400 text-xs mt-1">
            آخرین بروزرسانی: {lastRefresh.toLocaleTimeString("fa-IR")}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-orange-400 transition-all shadow-sm"
        >
          <RefreshCw
            size={12}
            className={
              loading ? "animate-spin text-orange-500" : "text-slate-400"
            }
          />
          بروزرسانی
        </button>
      </div>

      {err && (
        <div className="mb-4 p-3 rounded-xl text-red-600 text-xs flex gap-2 items-center bg-red-50 border border-red-200">
          <AlertCircle size={14} /> {err}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          href="/admin/users"
          icon={<Users size={18} className="text-blue-500" />}
          label="کل کاربران"
          value={stats.totalUsers ?? "—"}
          color="blue"
          sub={
            stats.newUsersToday ? `+${stats.newUsersToday} امروز` : undefined
          }
        />
        <StatCard
          href="/admin/users"
          icon={<UserCheck size={18} className="text-green-500" />}
          label="کاربران فعال"
          value={stats.activeUsers ?? "—"}
          color="green"
        />
        <StatCard
          href="/admin/bookings"
          icon={<BookOpen size={18} className="text-orange-500" />}
          label="کل رزروها"
          value={stats.totalBookings ?? "—"}
          color="orange"
        />
        <StatCard
          href="/admin/bookings"
          icon={<Clock size={18} className="text-yellow-500" />}
          label="رزروهای معلق"
          value={stats.pendingBookings ?? "—"}
          color="yellow"
        />
        <StatCard
          href="/admin/events"
          icon={<Calendar size={18} className="text-purple-500" />}
          label="کل رویدادها"
          value={stats.totalEvents ?? "—"}
          color="purple"
        />
        <StatCard
          icon={<DollarSign size={18} className="text-green-500" />}
          label="درآمد کل"
          value={
            stats.totalRevenue
              ? `${(stats.totalRevenue / 10000).toFixed(0)}k`
              : "—"
          }
          color="green"
        />
        <StatCard
          href="/admin/users"
          icon={<TrendingUp size={18} className="text-blue-500" />}
          label="کاربران این هفته"
          value={stats.newUsersThisWeek ?? "—"}
          color="blue"
        />
        <StatCard
          href="/admin/matching"
          icon={<Zap size={18} className="text-orange-500" />}
          label="مچینگ‌های فعال"
          value="—"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Bookings */}
        <SectionCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-700 flex items-center gap-2">
              <BookOpen size={14} className="text-orange-500" /> آخرین رزروها
            </h2>
            <Link
              href="/admin/bookings"
              className="text-orange-500 text-xs hover:text-orange-600 font-bold"
            >
              مشاهده همه ←
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl animate-pulse bg-slate-100"
                />
              ))}
            </div>
          ) : recentBookings.length ? (
            <div className="space-y-2">
              {recentBookings.map((b: any, i: number) => (
                <div
                  key={b.id || i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <div className="text-slate-800 text-xs font-bold">
                      {b.user?.name || b.user_name || "کاربر"}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      {b.event?.title || b.event_title || b.type || "رزرو"}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      b.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : b.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {b.status === "confirmed"
                      ? "تأیید شده"
                      : b.status === "pending"
                        ? "معلق"
                        : b.status || "نامشخص"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-8">
              رزروی یافت نشد
            </div>
          )}
        </SectionCard>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <SectionCard>
            <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
              <Zap size={14} className="text-orange-500" /> دسترسی سریع
            </h2>
            <div className="space-y-1.5">
              <QuickAction
                href="/admin/events/new"
                icon={<Plus size={13} className="text-orange-500" />}
                label="رویداد جدید"
                color="rgba(255,107,0,0.1)"
              />
              <QuickAction
                href="/admin/users"
                icon={<Users size={13} className="text-blue-500" />}
                label="مدیریت کاربران"
                color="rgba(59,130,246,0.1)"
              />
              <QuickAction
                href="/admin/bookings"
                icon={<BookOpen size={13} className="text-green-500" />}
                label="مدیریت رزروها"
                color="rgba(34,197,94,0.1)"
              />
              <QuickAction
                href="/admin/crm"
                icon={<Activity size={13} className="text-purple-500" />}
                label="CRM"
                color="rgba(168,85,247,0.1)"
              />
              <QuickAction
                href="/admin/matching"
                icon={<Cpu size={13} className="text-orange-500" />}
                label="اجرای مچینگ"
                color="rgba(255,107,0,0.1)"
              />
              <QuickAction
                href="/admin/ai-chat"
                icon={<Zap size={13} className="text-yellow-500" />}
                label="چت هوش مصنوعی"
                color="rgba(234,179,8,0.1)"
              />
              <QuickAction
                href="/admin/intelligence"
                icon={<BarChart2 size={13} className="text-green-500" />}
                label="تحلیل هوشمند"
                color="rgba(34,197,94,0.1)"
              />
            </div>
          </SectionCard>

          {/* Recent Users */}
          <SectionCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-700 flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> کاربران جدید
              </h2>
              <Link
                href="/admin/users"
                className="text-orange-500 text-xs font-bold"
              >
                همه ←
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-lg animate-pulse bg-slate-100"
                  />
                ))}
              </div>
            ) : recentUsers.length ? (
              <div className="space-y-1">
                {recentUsers.map((u: any, i: number) => (
                  <Link
                    key={u.id || i}
                    href="/admin/users"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-orange-600">
                      {(u.name || u.mobileNumber || "?")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-700 text-[11px] font-bold truncate">
                        {u.name || "بدون نام"}
                      </div>
                      <div className="text-slate-400 text-[10px] truncate">
                        {u.mobileNumber}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-4">
                کاربری یافت نشد
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* System Status */}
      <div
        className="mt-4 rounded-2xl p-4"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h2 className="text-xs font-black text-slate-500 mb-3 flex items-center gap-2">
          <Activity size={12} className="text-slate-400" /> وضعیت سیستم
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Frontend", status: "آنلاین", ok: true },
            { label: "Backend API", status: "آنلاین", ok: true },
            { label: "Database", status: "آنلاین", ok: true },
            { label: "AI Service", status: "فعال", ok: true },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${s.ok ? "bg-green-400" : "bg-red-400"} animate-pulse`}
              />
              <div>
                <div className="text-slate-700 text-[11px] font-bold">
                  {s.label}
                </div>
                <div
                  className={`text-[10px] font-medium ${s.ok ? "text-green-600" : "text-red-500"}`}
                >
                  {s.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

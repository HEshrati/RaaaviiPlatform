"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Eye,
  BarChart2,
  Filter,
  Download,
  Search,
  Bell,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  UserCheck,
  UserX,
  MessageSquare,
  Calendar,
  Hash,
  Layers,
  ChevronRight,
  Info,
  Sparkles,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Color maps ────────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: "#f43f5e",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};
const SEV_BG: Record<string, string> = {
  critical: "rgba(244,63,94,0.1)",
  high: "rgba(249,115,22,0.1)",
  medium: "rgba(234,179,8,0.1)",
  low: "rgba(34,197,94,0.1)",
  info: "rgba(59,130,246,0.1)",
};
const STATUS_LABEL: Record<string, string> = {
  open: "باز",
  reviewed: "بررسی‌شده",
  resolved: "حل‌شده",
  ignored: "نادیده",
};

// ── Pulse dot ─────────────────────────────────────────────────────────────────
function PulseDot({ color = "#f43f5e" }: { color?: string }) {
  return (
    <span className="relative inline-flex w-2.5 h-2.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex rounded-full w-2.5 h-2.5"
        style={{ background: color }}
      />
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "#f97316",
  delta,
  deltaLabel,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delta?: number;
  deltaLabel?: string;
  onClick?: () => void;
}) {
  const isUp = delta !== undefined && delta > 0;
  const isDown = delta !== undefined && delta < 0;

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl p-5 border text-right w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        background:
          "linear-gradient(145deg,rgba(15,23,42,0.9),rgba(10,15,30,0.95))",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Glow accent */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          {delta !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isUp ? "text-emerald-400 bg-emerald-400/10" : isDown ? "text-rose-400 bg-rose-400/10" : "text-slate-400 bg-slate-400/10"}`}
            >
              {isUp ? (
                <ArrowUpRight size={13} />
              ) : isDown ? (
                <ArrowDownRight size={13} />
              ) : (
                <Minus size={13} />
              )}
              {Math.abs(delta)}%
            </div>
          )}
        </div>
        <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
        <p className="text-white font-black text-2xl tracking-tight">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1.5">{sub}</p>}
        {deltaLabel && (
          <p className="text-slate-600 text-[10px] mt-1">{deltaLabel}</p>
        )}
      </div>
    </button>
  );
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color = "#f97316",
  height = 48,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120,
    h = height;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`,
    )
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({
  value,
  max = 100,
  color = "#f97316",
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}) {
  const pct = Math.min(1, value / max);
  const r = 36,
    cx = 44,
    cy = 44;
  const circ = 2 * Math.PI * r;
  const dashLen = circ * 0.75;
  const dash = dashLen * pct;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 88 88" className="w-24 h-24">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeDasharray={`${dashLen} ${circ}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="900"
        >
          {Math.round(value)}
          {max === 100 ? "%" : ""}
        </text>
        {label && (
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            fill="#64748b"
            fontSize="8"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Bar row ───────────────────────────────────────────────────────────────────
function BarRow({
  label,
  value,
  max,
  color = "#f97316",
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  const pct = Math.max(2, (value / (max || 1)) * 100);
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-slate-400 text-xs w-36 truncate text-right flex-shrink-0 group-hover:text-slate-200 transition-colors">
        {label}
      </span>
      <div className="flex-1 h-6 rounded-lg bg-slate-800/60 overflow-hidden">
        <div
          className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}60, ${color})`,
          }}
        ></div>
      </div>
      <span className="text-slate-300 text-xs font-black w-16 text-left flex-shrink-0">
        {Number(value).toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}

// ── Trend Bar Chart ───────────────────────────────────────────────────────────
function TrendBars({ data }: { data: any[] }) {
  if (!data?.length)
    return (
      <p className="text-slate-500 text-xs text-center py-6">داده‌ای نیست</p>
    );
  const maxTotal = Math.max(...data.map((d) => d.total || 0)) || 1;
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-36 px-1">
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * 130);
          const errH = Math.max(0, (d.errors / maxTotal) * 130);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5 group cursor-default"
              title={`${d.date}: ${d.total} رویداد / ${d.errors} خطا`}
            >
              <div
                className="relative w-full flex flex-col justify-end rounded-t-md overflow-hidden"
                style={{ height: 130 }}
              >
                <div
                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: totalH,
                    background: "rgba(99,102,241,0.35)",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                />
                {errH > 0 && (
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm"
                    style={{ height: errH, background: "rgba(244,63,94,0.6)" }}
                  />
                )}
              </div>
              <span className="text-[9px] text-slate-600 group-hover:text-slate-400 transition-colors truncate w-full text-center">
                {d.date}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-500/35 border border-indigo-500/25" />
          رویدادها
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-rose-500/60" />
          خطاها
        </div>
      </div>
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertRow({ alert, onUpdate }: { alert: any; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const c = SEV_COLOR[alert.severity] || "#94a3b8";

  const patch = async (status: string) => {
    setLoading(true);
    try {
      await api(`/api/crm/alerts/${alert.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        background: SEV_BG[alert.severity] || "rgba(148,163,184,0.05)",
        borderColor: `${c}25`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-right"
        onClick={() => setOpen(!open)}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: c }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${c}20`, color: c }}
            >
              {alert.severity?.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500">
              {STATUS_LABEL[alert.status]}
            </span>
            <span className="text-[10px] text-slate-600">
              {new Date(alert.created_at).toLocaleDateString("fa-IR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-white text-sm font-bold truncate">{alert.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-black tabular-nums px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: c }}
          >
            {alert.risk_score}%
          </span>
          {open ? (
            <ChevronUp size={15} className="text-slate-500" />
          ) : (
            <ChevronDown size={15} className="text-slate-500" />
          )}
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: `${c}15` }}
        >
          <div className="pt-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
              تحلیل هوش مصنوعی
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {alert.ai_analysis}
            </p>
          </div>
          {alert.recommendation && (
            <div
              className="rounded-xl p-3"
              style={{
                background: "rgba(34,197,94,0.07)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <p className="text-emerald-400 text-xs font-black mb-1">
                💡 پیشنهاد اقدام
              </p>
              <p className="text-slate-300 text-sm">{alert.recommendation}</p>
            </div>
          )}
          {alert.status === "open" && (
            <div className="flex gap-2 flex-wrap pt-1">
              <button
                onClick={() => patch("resolved")}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
              >
                <CheckCircle size={12} />
                حل شد
              </button>
              <button
                onClick={() => patch("reviewed")}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
              >
                <Eye size={12} />
                بررسی کردم
              </button>
              <button
                onClick={() => patch("ignored")}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20"
              >
                <XCircle size={12} />
                نادیده
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(145deg,#111827,#0a0f1e)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Churn user modal ──────────────────────────────────────────────────────────
function ChurnModal({ user, onClose }: { user: any; onClose: () => void }) {
  const daysSince = user.last_active
    ? Math.floor((Date.now() - new Date(user.last_active).getTime()) / 86400000)
    : null;
  const risk =
    daysSince !== null
      ? daysSince > 30
        ? "بحرانی"
        : daysSince > 14
          ? "بالا"
          : "متوسط"
      : "نامشخص";
  const riskColor =
    daysSince !== null
      ? daysSince > 30
        ? "#f43f5e"
        : daysSince > 14
          ? "#f97316"
          : "#eab308"
      : "#94a3b8";

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
              <UserX size={18} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-black">پروفایل ریزش کاربر</h3>
              <p className="text-slate-500 text-xs font-mono">{user.user_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "آخرین فعالیت",
              value: user.last_active
                ? new Date(user.last_active).toLocaleDateString("fa-IR")
                : "—",
              color: "#eab308",
            },
            {
              label: "روزهای غیب",
              value: daysSince !== null ? `${daysSince} روز` : "—",
              color: riskColor,
            },
            {
              label: "کل اقدام",
              value: Number(user.total_actions || 0).toLocaleString(),
              color: "#f97316",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{
                background: `${color}0f`,
                border: `1px solid ${color}20`,
              }}
            >
              <p className="text-slate-500 text-[10px] mb-1">{label}</p>
              <p className="font-black text-sm" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: `${riskColor}0a`,
            border: `1px solid ${riskColor}20`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PulseDot color={riskColor} />
            <p className="font-black text-sm" style={{ color: riskColor }}>
              سطح ریزش: {risk}
            </p>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-xs">
            {daysSince && daysSince > 7 && (
              <li className="flex items-center gap-2">
                <span style={{ color: riskColor }}>•</span> {daysSince} روز است
                که وارد سیستم نشده
              </li>
            )}
            <li className="flex items-center gap-2">
              <span style={{ color: riskColor }}>•</span>تعداد رزروهای تکمیل‌شده
              پایین است
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: riskColor }}>•</span>آخرین تعامل منجر به
              خرید نشده
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: riskColor }}>•</span>الگوی رفتاری مشابه
              کاربران ریزش‌کرده
            </li>
          </ul>
        </div>

        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <p className="text-emerald-400 font-black text-xs mb-2">
            💡 پیشنهاد اقدام
          </p>
          <p className="text-slate-300 text-sm">
            ارسال پیام شخصی‌سازی‌شده یا کد تخفیف ۲۰٪ می‌تواند نرخ بازگشت را تا
            ۳۵٪ افزایش دهد.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#f97316,#fb923c)" }}
        >
          بستن
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CrmDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [churnUsers, setChurn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "alerts" | "churn" | "endpoints" | "health"
  >("overview");
  const [days, setDays] = useState(7);
  const [alertFilter, setAlertFilter] = useState<"all" | "open" | "critical">(
    "open",
  );
  const [searchAlert, setSearchAlert] = useState("");
  const [aiModal, setAiModal] = useState<string | null>(null);
  const [churnModal, setChurnModal] = useState<any>(null);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, al, churn] = await Promise.all([
        api(`/api/crm/dashboard?days=${days}`),
        api(`/api/crm/alerts?limit=50`),
        api(`/api/crm/churn-risk`),
      ]);
      setData(dash);
      setAlerts(al);
      setChurn(churn || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const r = await api(`/api/crm/analyze`, {
        method: "POST",
        body: JSON.stringify({ hours: days * 24 }),
      });
      setAnalyzeResult(r.message);
      setAiModal(r.message);
      await loadAll();
    } catch (err: any) {
      setAnalyzeResult("خطا: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const s = data?.summary;
  const allAlerts: any[] = alerts?.data || [];
  const filteredAlerts = allAlerts
    .filter((a) =>
      alertFilter === "all"
        ? true
        : alertFilter === "open"
          ? a.status === "open"
          : a.severity === "critical",
    )
    .filter((a) => !searchAlert || a.title?.includes(searchAlert));

  const openCount = allAlerts.filter((a) => a.status === "open").length;
  const criticalCount = allAlerts.filter(
    (a) => a.severity === "critical" && a.status === "open",
  ).length;
  const successRate = Math.max(0, 100 - (s?.errorRate || 0));
  const trendData = (data?.dailyTrend || []).map((d: any) => d.total || 0);

  const TABS = [
    { key: "overview", label: "نمای کلی", icon: BarChart2 },
    {
      key: "alerts",
      label: `هشدارها`,
      icon: AlertTriangle,
      badge: openCount > 0 ? openCount : null,
      badgeColor: criticalCount > 0 ? "#f43f5e" : "#f97316",
    },
    {
      key: "churn",
      label: "ریزش کاربران",
      icon: UserX,
      badge: churnUsers.length > 0 ? churnUsers.length : null,
      badgeColor: "#eab308",
    },
    { key: "endpoints", label: "API Endpoints", icon: Zap },
    { key: "health", label: "سلامت سیستم", icon: Activity },
  ];

  return (
    <div
      className="min-h-screen overflow-y-auto pb-24"
      dir="rtl"
      style={{
        background:
          "linear-gradient(160deg,#060912 0%,#0a0f1e 50%,#060912 100%)",
      }}
    >
      {/* Modals */}
      {aiModal && (
        <Modal onClose={() => setAiModal(null)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                <Cpu size={18} className="text-purple-400" />
              </div>
              <h3 className="text-white font-black text-lg">
                تحلیل هوش مصنوعی
              </h3>
              <button
                onClick={() => setAiModal(null)}
                className="mr-auto text-slate-500 hover:text-white transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <p className="text-slate-300 text-sm leading-loose whitespace-pre-line">
                {aiModal}
              </p>
            </div>
            <button
              onClick={() => setAiModal(null)}
              className="mt-4 w-full py-3 rounded-2xl text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}
            >
              بستن
            </button>
          </div>
        </Modal>
      )}
      {churnModal && (
        <ChurnModal user={churnModal} onClose={() => setChurnModal(null)} />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 px-4 md:px-8 py-4 border-b"
        style={{
          background: "rgba(6,9,18,0.9)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                }}
              >
                <Cpu size={22} className="text-white" />
              </div>
              {criticalCount > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">
                داشبورد CRM
              </h1>
              <p className="text-slate-500 text-xs">
                تحلیل رفتار کاربران · هوش مصنوعی راوی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* بازه زمانی */}
            <div
              className="flex rounded-xl overflow-hidden border border-slate-700/50"
              style={{ background: "rgba(15,23,42,0.8)" }}
            >
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3.5 py-2 text-xs font-bold transition-all ${days === d ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {d}ر
                </button>
              ))}
            </div>

            {/* آنالیز AI */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
              }}
            >
              {analyzing ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {analyzing ? "در حال تحلیل..." : "تحلیل AI"}
            </button>

            <button
              onClick={loadAll}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              style={{ background: "rgba(15,23,42,0.8)" }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Critical banner */}
        {criticalCount > 0 && (
          <div
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl w-fit"
            style={{
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.25)",
            }}
          >
            <PulseDot color="#f43f5e" />
            <span className="text-rose-400 text-xs font-black">
              {criticalCount} هشدار بحرانی نیاز به اقدام فوری دارد
            </span>
            <button
              className="text-rose-400/60 hover:text-rose-400 transition-colors"
              onClick={() => {
                setActiveTab("alerts");
                setAlertFilter("critical");
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* AI result banner */}
        {analyzeResult && (
          <button
            onClick={() => setAiModal(analyzeResult)}
            className="w-full rounded-2xl p-4 border flex items-center gap-3 text-right transition-all hover:opacity-90"
            style={{
              background: analyzeResult.includes("خطا")
                ? "rgba(244,63,94,0.07)"
                : "rgba(139,92,246,0.07)",
              borderColor: analyzeResult.includes("خطا")
                ? "rgba(244,63,94,0.2)"
                : "rgba(139,92,246,0.2)",
            }}
          >
            <Cpu size={18} className="text-purple-400 flex-shrink-0" />
            <p className="text-slate-300 text-sm line-clamp-1 flex-1">
              {analyzeResult}
            </p>
            <span className="text-slate-500 text-xs flex-shrink-0">
              مشاهده کامل ↗
            </span>
          </button>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
              <RefreshCw size={24} className="text-indigo-400 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm">در حال بارگذاری داده‌ها...</p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                icon={Activity}
                label="کل رویدادها"
                value={(s?.totalEvents || 0).toLocaleString()}
                sub={`میانگین ${days > 0 ? Math.round((s?.totalEvents || 0) / days).toLocaleString() : 0}/روز`}
                color="#6366f1"
                delta={s?.eventGrowth}
                onClick={() =>
                  setAiModal(
                    `📊 کل رویدادها در ${days} روز گذشته: ${(s?.totalEvents || 0).toLocaleString()}\n\nمیانگین روزانه: ${Math.round((s?.totalEvents || 0) / days).toLocaleString()} رویداد\n\nافزایش این عدد نشان‌دهنده رشد فعالیت کاربران است.`,
                  )
                }
              />

              <KpiCard
                icon={AlertTriangle}
                label="نرخ خطا"
                value={`${s?.errorRate || 0}%`}
                sub={`${(s?.errorEvents || 0).toLocaleString()} خطا ثبت‌شده`}
                color={
                  s?.errorRate > 5
                    ? "#f43f5e"
                    : s?.errorRate > 2
                      ? "#f97316"
                      : "#22c55e"
                }
                delta={s?.errorGrowth ? -s.errorGrowth : undefined}
                onClick={() =>
                  setAiModal(
                    `❌ نرخ خطای API: ${s?.errorRate || 0}٪\n\nتعداد خطاها: ${(s?.errorEvents || 0).toLocaleString()}\n\nاستانداردها:\n• زیر ۲٪: ایده‌آل ✅\n• ۲-۵٪: نیاز به بررسی ⚠️\n• بالای ۵٪: بحرانی 🔴`,
                  )
                }
              />

              <KpiCard
                icon={Clock}
                label="میانگین زمان API"
                value={`${s?.avgResponseTime || 0}ms`}
                sub={
                  s?.avgResponseTime > 1000
                    ? "⚠️ کند - بررسی شود"
                    : "✅ در محدوده نرمال"
                }
                color={
                  s?.avgResponseTime > 2000
                    ? "#f43f5e"
                    : s?.avgResponseTime > 1000
                      ? "#f97316"
                      : "#22c55e"
                }
                onClick={() =>
                  setAiModal(
                    `⏱️ زمان پاسخ API: ${s?.avgResponseTime || 0}ms\n\nاستانداردها:\n• زیر ۳۰۰ms: عالی\n• ۳۰۰-۱۰۰۰ms: قابل قبول\n• ۱۰۰۰-۲۰۰۰ms: کند\n• بالای ۲۰۰۰ms: بحرانی`,
                  )
                }
              />

              <KpiCard
                icon={ShieldAlert}
                label="هشدار باز"
                value={openCount}
                sub={
                  criticalCount > 0
                    ? `${criticalCount} بحرانی 🔴`
                    : "بدون هشدار بحرانی"
                }
                color={
                  criticalCount > 0
                    ? "#f43f5e"
                    : openCount > 0
                      ? "#f97316"
                      : "#22c55e"
                }
                onClick={() => {
                  setActiveTab("alerts");
                  setAlertFilter("open");
                }}
              />
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="flex gap-1.5 flex-wrap">
              {TABS.map(({ key, label, icon: Icon, badge, badgeColor }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={
                    activeTab === key
                      ? {
                          background: "rgba(99,102,241,0.2)",
                          border: "1px solid rgba(99,102,241,0.4)",
                          color: "white",
                        }
                      : {
                          background: "rgba(15,23,42,0.6)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          color: "#64748b",
                        }
                  }
                >
                  <Icon size={14} />
                  {label}
                  {badge && (
                    <span
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                      style={{ background: badgeColor }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ══ Overview ══════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Trend chart */}
                  <div
                    className="lg:col-span-2 rounded-2xl p-6 border border-slate-700/30"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-400" />
                        <h3 className="text-white font-black">
                          روند {days} روز گذشته
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {(s?.totalEvents || 0).toLocaleString()} رویداد
                        </span>
                      </div>
                    </div>
                    <TrendBars data={data?.dailyTrend || []} />
                  </div>

                  {/* Health gauges */}
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30 flex flex-col"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Activity size={16} className="text-emerald-400" />
                      <h3 className="text-white font-black">سلامت سیستم</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <Gauge
                        value={successRate}
                        color={
                          successRate > 97
                            ? "#22c55e"
                            : successRate > 93
                              ? "#f97316"
                              : "#f43f5e"
                        }
                        label="موفقیت"
                      />
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {[
                          {
                            label: "جلسات یکتا",
                            value: (s?.uniqueSessions || 0).toLocaleString(),
                            color: "#6366f1",
                          },
                          {
                            label: "هشدار باز",
                            value: openCount,
                            color: openCount > 0 ? "#f97316" : "#22c55e",
                          },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className="rounded-xl p-3 text-center"
                            style={{
                              background: `${color}0d`,
                              border: `1px solid ${color}20`,
                            }}
                          >
                            <p className="text-[10px] text-slate-500 mb-1">
                              {label}
                            </p>
                            <p className="font-black" style={{ color }}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Top pages */}
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Globe size={16} className="text-blue-400" />
                      <h3 className="text-white font-black">صفحات پربازدید</h3>
                    </div>
                    <div className="space-y-3">
                      {(data?.topPages || []).length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-4">
                          داده‌ای ثبت نشده
                        </p>
                      ) : (
                        (() => {
                          const maxV = Math.max(
                            ...(data?.topPages || []).map(
                              (d: any) => Number(d.count) || 0,
                            ),
                          );
                          return (data?.topPages || [])
                            .slice(0, 6)
                            .map((d: any, i: number) => (
                              <BarRow
                                key={i}
                                label={d.path}
                                value={Number(d.count)}
                                max={maxV}
                                color="#3b82f6"
                              />
                            ));
                        })()
                      )}
                    </div>
                  </div>

                  {/* Event types */}
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Layers size={16} className="text-orange-400" />
                      <h3 className="text-white font-black">توزیع رویدادها</h3>
                    </div>
                    <div className="space-y-3">
                      {(data?.eventTypeBreakdown || []).length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-4">
                          داده‌ای ثبت نشده
                        </p>
                      ) : (
                        (() => {
                          const maxV = Math.max(
                            ...(data?.eventTypeBreakdown || []).map(
                              (d: any) => Number(d.count) || 0,
                            ),
                          );
                          const colors = [
                            "#f97316",
                            "#6366f1",
                            "#22c55e",
                            "#eab308",
                            "#ec4899",
                            "#14b8a6",
                          ];
                          return (data?.eventTypeBreakdown || [])
                            .slice(0, 6)
                            .map((d: any, i: number) => (
                              <BarRow
                                key={i}
                                label={d.type}
                                value={Number(d.count)}
                                max={maxV}
                                color={colors[i % colors.length]}
                              />
                            ));
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent AI alerts */}
                <div
                  className="rounded-2xl p-6 border border-slate-700/30"
                  style={{ background: "rgba(15,23,42,0.7)" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-purple-400" />
                      <h3 className="text-white font-black">
                        آخرین تحلیل‌های AI
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("alerts")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      همه هشدارها <ChevronRight size={12} />
                    </button>
                  </div>
                  {(data?.recentAlerts || []).length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm py-2">
                      <CheckCircle size={16} />
                      سیستم سالم — هیچ هشداری ثبت نشده
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(data?.recentAlerts || []).map((a: any) => (
                        <button
                          key={a.id}
                          onClick={() => setAiModal(a.ai_analysis || a.title)}
                          className="flex items-start gap-3 p-3 rounded-xl text-right transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{
                              background: SEV_COLOR[a.severity] || "#94a3b8",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 text-sm font-medium truncate">
                              {a.title}
                            </p>
                            <p className="text-slate-600 text-[10px] mt-0.5">
                              {new Date(a.created_at).toLocaleDateString(
                                "fa-IR",
                              )}
                            </p>
                          </div>
                          <ChevronRight
                            size={12}
                            className="text-slate-600 mt-1 flex-shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ Alerts ════════════════════════════════════════════════════ */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="flex rounded-xl overflow-hidden border border-slate-700/50"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    {[
                      { key: "open", label: `باز (${openCount})` },
                      { key: "critical", label: `بحرانی (${criticalCount})` },
                      { key: "all", label: `همه (${allAlerts.length})` },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setAlertFilter(key as any)}
                        className={`px-3 py-2 text-xs font-bold transition-all ${alertFilter === key ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2 border border-slate-700/50 min-w-48"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <Search
                      size={14}
                      className="text-slate-500 flex-shrink-0"
                    />
                    <input
                      value={searchAlert}
                      onChange={(e) => setSearchAlert(e.target.value)}
                      placeholder="جستجو در هشدارها..."
                      className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
                    />
                  </div>
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-4 gap-3">
                  {(["critical", "high", "medium", "low"] as const).map(
                    (sev) => {
                      const cnt = allAlerts.filter(
                        (a) => a.severity === sev,
                      ).length;
                      return (
                        <button
                          key={sev}
                          onClick={() => {
                            setAlertFilter("all");
                            setSearchAlert("");
                          }}
                          className="rounded-xl p-3 text-center border transition-all hover:scale-[1.02]"
                          style={{
                            background: SEV_BG[sev],
                            borderColor: `${SEV_COLOR[sev]}25`,
                          }}
                        >
                          <p className="text-white font-black text-xl">{cnt}</p>
                          <p
                            className="text-[10px] font-bold mt-0.5"
                            style={{ color: SEV_COLOR[sev] }}
                          >
                            {sev}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>

                {filteredAlerts.length === 0 ? (
                  <div
                    className="rounded-2xl p-12 border border-emerald-500/20 flex flex-col items-center gap-3"
                    style={{ background: "rgba(34,197,94,0.04)" }}
                  >
                    <CheckCircle size={40} className="text-emerald-400" />
                    <p className="text-emerald-300 font-black">
                      هیچ هشداری در این فیلتر وجود ندارد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlerts.map((a) => (
                      <AlertRow key={a.id} alert={a} onUpdate={loadAll} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ Churn ═════════════════════════════════════════════════════ */}
            {activeTab === "churn" && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "کل در خطر",
                      value: churnUsers.length,
                      color: "#f97316",
                      icon: Users,
                    },
                    {
                      label: "بحرانی (۳۰+روز)",
                      value: churnUsers.filter(
                        (u) =>
                          u.last_active &&
                          Date.now() - new Date(u.last_active).getTime() >
                            30 * 86400000,
                      ).length,
                      color: "#f43f5e",
                      icon: UserX,
                    },
                    {
                      label: "بالا (۱۴-۳۰روز)",
                      value: churnUsers.filter((u) => {
                        const d = u.last_active
                          ? (Date.now() - new Date(u.last_active).getTime()) /
                            86400000
                          : 0;
                        return d >= 14 && d < 30;
                      }).length,
                      color: "#eab308",
                      icon: AlertTriangle,
                    },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl p-4 border"
                      style={{
                        background: `${color}0a`,
                        borderColor: `${color}20`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={16} style={{ color }} />
                        <p className="text-slate-400 text-xs">{label}</p>
                      </div>
                      <p className="font-black text-2xl" style={{ color }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-2xl border border-slate-700/30 overflow-hidden"
                  style={{ background: "rgba(15,23,42,0.7)" }}
                >
                  <div className="p-4 border-b border-slate-700/30 flex items-center gap-2">
                    <UserX size={16} className="text-yellow-400" />
                    <h3 className="text-white font-black">
                      کاربران در خطر ریزش
                    </h3>
                    <span className="mr-auto text-xs text-slate-500">
                      فعال ۳۰ روز / غیرفعال ۱۴+ روز
                    </span>
                  </div>
                  {churnUsers.length === 0 ? (
                    <div className="p-10 flex flex-col items-center gap-2">
                      <UserCheck size={32} className="text-emerald-400" />
                      <p className="text-slate-400 text-sm">
                        هیچ کاربری در خطر ریزش نیست
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/30">
                            {[
                              "#",
                              "شناسه کاربر",
                              "آخرین فعالیت",
                              "روز غیب",
                              "اقدامات",
                              "سطح خطر",
                              "",
                            ].map((h, i) => (
                              <th
                                key={i}
                                className="text-right text-slate-500 font-black text-[10px] uppercase tracking-wider px-4 py-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {churnUsers.map((u, i) => {
                            const daysSince = u.last_active
                              ? Math.floor(
                                  (Date.now() -
                                    new Date(u.last_active).getTime()) /
                                    86400000,
                                )
                              : null;
                            const risk =
                              daysSince !== null
                                ? daysSince > 30
                                  ? "بحرانی"
                                  : daysSince > 14
                                    ? "بالا"
                                    : "متوسط"
                                : "نامشخص";
                            const riskC =
                              daysSince !== null
                                ? daysSince > 30
                                  ? "#f43f5e"
                                  : daysSince > 14
                                    ? "#f97316"
                                    : "#eab308"
                                : "#94a3b8";
                            return (
                              <tr
                                key={i}
                                className="border-b border-slate-700/20 hover:bg-slate-700/15 transition-colors"
                              >
                                <td className="px-4 py-3 text-slate-600 text-xs">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                  {u.user_id?.slice(0, 12)}...
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs">
                                  {u.last_active
                                    ? new Date(
                                        u.last_active,
                                      ).toLocaleDateString("fa-IR")
                                    : "—"}
                                </td>
                                <td
                                  className="px-4 py-3 text-xs font-bold"
                                  style={{ color: riskC }}
                                >
                                  {daysSince !== null ? `${daysSince}` : "—"}
                                </td>
                                <td className="px-4 py-3 text-orange-400 font-black text-xs">
                                  {Number(
                                    u.total_actions || 0,
                                  ).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                    style={{
                                      background: `${riskC}15`,
                                      color: riskC,
                                    }}
                                  >
                                    {risk}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setChurnModal(u)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                  >
                                    جزئیات <ChevronRight size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ Endpoints ═════════════════════════════════════════════════ */}
            {activeTab === "endpoints" && (
              <div className="space-y-5">
                <div
                  className="rounded-2xl border border-slate-700/30 overflow-hidden"
                  style={{ background: "rgba(15,23,42,0.7)" }}
                >
                  <div className="p-5 border-b border-slate-700/30 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <h3 className="text-white font-black">
                      فعال‌ترین API Endpoints
                    </h3>
                  </div>
                  {(data?.topEndpoints || []).length === 0 ? (
                    <p className="text-slate-500 text-sm p-6">
                      داده‌ای ثبت نشده
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/30">
                            {[
                              "Endpoint",
                              "تعداد درخواست",
                              "میانگین زمان",
                              "وضعیت",
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-right text-slate-500 font-black text-[10px] uppercase px-5 py-3"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.topEndpoints || []).map(
                            (e: any, i: number) => {
                              const ms = Math.round(Number(e.avg_ms) || 0);
                              const status =
                                ms > 2000 ? "بحرانی" : ms > 1000 ? "کند" : "OK";
                              const statusC =
                                ms > 2000
                                  ? "#f43f5e"
                                  : ms > 1000
                                    ? "#f97316"
                                    : "#22c55e";
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors"
                                >
                                  <td className="px-5 py-3 text-slate-300 font-mono text-xs max-w-xs truncate">
                                    {e.endpoint}
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="text-orange-400 font-black text-sm">
                                      {Number(e.count).toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span
                                      className="font-bold text-sm"
                                      style={{ color: statusC }}
                                    >
                                      {ms}ms
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span
                                      className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                      style={{
                                        background: `${statusC}15`,
                                        color: statusC,
                                      }}
                                    >
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "جلسات یکتا",
                      value: (s?.uniqueSessions || 0).toLocaleString(),
                      icon: Hash,
                      color: "#6366f1",
                      info: "تعداد کاربران مجزایی که از API استفاده کرده‌اند",
                    },
                    {
                      label: "میانگین پاسخ",
                      value: `${s?.avgResponseTime || 0}ms`,
                      icon: Clock,
                      color: "#f97316",
                      info: "میانگین زمان پاسخ همه endpoint‌ها",
                    },
                    {
                      label: "کل خطا",
                      value: (s?.errorEvents || 0).toLocaleString(),
                      icon: XCircle,
                      color: "#f43f5e",
                      info: "مجموع خطاهای ۴xx و ۵xx",
                    },
                    {
                      label: "نرخ موفقیت",
                      value: `${successRate.toFixed(1)}%`,
                      icon: CheckCircle,
                      color: successRate > 97 ? "#22c55e" : "#f97316",
                      info: "درصد درخواست‌های موفق",
                    },
                  ].map(({ label, value, icon: Icon, color, info }) => (
                    <button
                      key={label}
                      onClick={() =>
                        setAiModal(
                          `${label}\n\n${info}\n\nمقدار فعلی: ${value}`,
                        )
                      }
                      className="group rounded-2xl p-5 border text-right transition-all hover:scale-[1.02]"
                      style={{
                        background: "rgba(15,23,42,0.7)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: `${color}18` }}
                      >
                        <Icon size={18} style={{ color }} />
                      </div>
                      <p className="text-white font-black text-xl">{value}</p>
                      <p className="text-slate-500 text-xs mt-1">{label}</p>
                      <Info
                        size={12}
                        className="text-slate-700 group-hover:text-slate-500 transition-colors mt-2"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ Health ════════════════════════════════════════════════════ */}
            {activeTab === "health" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30 flex flex-col items-center gap-4"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <p className="text-white font-black self-start">
                      نرخ موفقیت
                    </p>
                    <Gauge
                      value={successRate}
                      color={successRate > 97 ? "#22c55e" : "#f97316"}
                      label="Success Rate"
                    />
                    <p className="text-slate-400 text-xs text-center">
                      {successRate > 97
                        ? "✅ وضعیت ایده‌آل"
                        : successRate > 93
                          ? "⚠️ نیاز به بررسی"
                          : "🔴 بحرانی"}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30 flex flex-col items-center gap-4"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <p className="text-white font-black self-start">نرخ خطا</p>
                    <Gauge
                      value={s?.errorRate || 0}
                      color={
                        (s?.errorRate || 0) > 5
                          ? "#f43f5e"
                          : (s?.errorRate || 0) > 2
                            ? "#f97316"
                            : "#22c55e"
                      }
                      label="Error Rate"
                    />
                    <p className="text-slate-400 text-xs text-center">
                      {(s?.errorRate || 0) < 2
                        ? "✅ طبیعی"
                        : (s?.errorRate || 0) < 5
                          ? "⚠️ بالا"
                          : "🔴 بحرانی"}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl p-6 border border-slate-700/30 flex flex-col items-center gap-4"
                    style={{ background: "rgba(15,23,42,0.7)" }}
                  >
                    <p className="text-white font-black self-start">سرعت API</p>
                    <Gauge
                      value={Math.min(
                        100,
                        Math.max(0, 100 - (s?.avgResponseTime || 0) / 30),
                      )}
                      color={
                        (s?.avgResponseTime || 0) < 500
                          ? "#22c55e"
                          : (s?.avgResponseTime || 0) < 1500
                            ? "#f97316"
                            : "#f43f5e"
                      }
                      label="Performance"
                    />
                    <p className="text-slate-400 text-xs text-center">
                      {s?.avgResponseTime || 0}ms ·{" "}
                      {(s?.avgResponseTime || 0) < 500
                        ? "✅ عالی"
                        : (s?.avgResponseTime || 0) < 1500
                          ? "⚠️ متوسط"
                          : "🔴 کند"}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6 border border-slate-700/30"
                  style={{ background: "rgba(15,23,42,0.7)" }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart2 size={16} className="text-indigo-400" />
                    <h3 className="text-white font-black">
                      چک‌لیست سلامت سیستم
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        label: "نرخ خطای API",
                        ok: (s?.errorRate || 0) < 5,
                        value: `${s?.errorRate || 0}٪`,
                        threshold: "زیر ۵٪",
                      },
                      {
                        label: "زمان پاسخ API",
                        ok: (s?.avgResponseTime || 0) < 2000,
                        value: `${s?.avgResponseTime || 0}ms`,
                        threshold: "زیر ۲۰۰۰ms",
                      },
                      {
                        label: "هشدار بحرانی باز",
                        ok: criticalCount === 0,
                        value: `${criticalCount} مورد`,
                        threshold: "صفر",
                      },
                      {
                        label: "هشدارهای باز",
                        ok: openCount < 10,
                        value: `${openCount} مورد`,
                        threshold: "زیر ۱۰",
                      },
                      {
                        label: "کاربران در خطر ریزش",
                        ok: churnUsers.length < 20,
                        value: `${churnUsers.length} نفر`,
                        threshold: "زیر ۲۰",
                      },
                      {
                        label: "نرخ موفقیت کلی",
                        ok: successRate > 95,
                        value: `${successRate.toFixed(1)}٪`,
                        threshold: "بالای ۹۵٪",
                      },
                    ].map(({ label, ok, value, threshold }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 py-2.5 border-b border-slate-700/20 last:border-0"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500/15" : "bg-rose-500/15"}`}
                        >
                          {ok ? (
                            <CheckCircle
                              size={14}
                              className="text-emerald-400"
                            />
                          ) : (
                            <XCircle size={14} className="text-rose-400" />
                          )}
                        </div>
                        <p className="text-slate-300 text-sm flex-1">{label}</p>
                        <span
                          className="text-xs font-black"
                          style={{ color: ok ? "#22c55e" : "#f43f5e" }}
                        >
                          {value}
                        </span>
                        <span className="text-slate-600 text-xs">
                          هدف: {threshold}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

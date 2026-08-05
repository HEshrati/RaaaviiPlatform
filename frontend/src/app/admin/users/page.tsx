"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  fetchAllUsers,
  isAdminPhone,
  AdminUser,
  updateAdminUserRole,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MapPin,
  Phone,
  UserX,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Cpu,
  X,
  Sparkles,
  Calendar,
  BarChart2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CITIES = [
  "همه شهرها",
  "تهران",
  "مشهد",
  "اصفهان",
  "شیراز",
  "تبریز",
  "کرج",
  "قم",
  "اهواز",
  "کرمانشاه",
  "ارومیه",
  "رشت",
  "زاهدان",
  "کرمان",
  "همدان",
  "یزد",
];
const CARD = {
  background: "linear-gradient(145deg, #1B2A4A, #132038)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const MBTI_DESC: Record<string, string> = {
  ENFJ: "گرم، جمع‌ساز و هدفمند؛ برای رویدادهای گفتگو محور و تیمی عالی است.",
  ENFP: "کنجکاو، پرانرژی و ایده‌پرداز؛ با تجربه‌های تازه و جمع‌های متنوع مچ می‌شود.",
  INFJ: "عمیق، معناگرا و همدل؛ جمع‌های کوچک و گفت‌وگوهای باکیفیت برایش مناسب‌تر است.",
  INFP: "اصیل، احساسی و خلاق؛ با آدم‌های امن و فضاهای آرام بهتر وصل می‌شود.",
  ENTJ: "تصمیم‌ساز و ساختارمند؛ در رویدادهای هدفمند یا حرفه‌ای خوب می‌درخشد.",
  ENTP: "چالش‌دوست و گفتگو محور؛ بازی، مناظره و تجربه‌های غیرکلیشه‌ای مناسبش است.",
  INTJ: "تحلیلی و مستقل؛ برنامه‌های کم‌حاشیه، دقیق و فکری برایش بهتر است.",
  INTP: "کاوشگر و منطقی؛ جمع‌های فکری و بازی‌های استراتژیک مچ خوبی هستند.",
  ESFJ: "حمایت‌گر و اجتماعی؛ با دورهمی‌های گرم و آشنا سریع ارتباط می‌گیرد.",
  ESFP: "تجربه‌گرا و پرشور؛ برنامه‌های سرگرم‌کننده و پرانرژی مناسبش است.",
  ISFJ: "وفادار و مراقب؛ جمع‌های امن، قابل پیش‌بینی و صمیمی برایش بهترند.",
  ISFP: "آرام، هنری و تجربه‌محور؛ فضاهای لطیف، کافه‌ای و کم‌فشار مناسبش است.",
  ESTJ: "اجرایی و منظم؛ رویدادهای برنامه‌دار و نتیجه‌محور برایش جذاب‌تر است.",
  ESTP: "عمل‌گرا و هیجان‌دوست؛ فعالیت، بازی و چالش زنده مناسبش است.",
  ISTJ: "دقیق و قابل اعتماد؛ برنامه‌های منظم، کوچک و با قوانین روشن برایش بهتر است.",
  ISTP: "مستقل و تجربه‌گر؛ فعالیت‌های عملی و کم‌تعارف برایش جذاب است.",
};

const SCORE_LABELS: Record<string, [string, string]> = {
  EI: ["درون‌گرا", "برون‌گرا"],
  SN: ["جزئی‌نگر", "تنوع‌طلب"],
  TF: ["منطقی", "احساسی"],
  JP: ["منعطف", "ساختارمند"],
  SOCIAL: ["ارتباط عمیق", "جمع‌ساز"],
  PACE: ["ریتم آرام", "ریتم سریع"],
};

interface AdminUserExtended extends AdminUser {
  is_suspended?: boolean;
  no_show_count?: number;
  smart_profile?: {
    is_suspended?: boolean;
    no_show_count?: number;
    communication_type?: string;
    total_events_attended?: number;
  };
}

interface TestResult {
  id: string;
  test_name: string;
  main_result: string;
  completed_at: string;
  scores?: Record<string, any>;
}

type ViewMode = "all" | "suspended";

// ── مودال نتیجه تست ────────────────────────────────────────────
function TestResultModal({
  user,
  onClose,
}: {
  user: AdminUserExtended;
  onClose: () => void;
}) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetch(`${API_URL}/api/test-results/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setResults(d.data || []))
      .catch(() => setError("نتیجه‌ای یافت نشد یا خطایی رخ داد."))
      .finally(() => setLoading(false));
  }, [user.id]);

  const TEST_LABELS: Record<string, string> = {
    raavi_matching_basis_v1: "مچینگ پایه",
    neo_ffi: "NEO پنج عامل",
    ecr_r: "سبک دلبستگی",
    erq: "تنظیم هیجان",
    iri: "همدلی",
    gottman: "الگوی گاتمان",
    phq9: "افسردگی PHQ-9",
    gad7: "اضطراب GAD-7",
    dass21: "DASS-21",
    bai: "اضطراب بک",
    isi: "بی‌خوابی",
    hexaco: "HEXACO",
    love_languages: "زبان عشق",
    conflict_style: "سبک تعارض",
  };

  // نمایش هوشمند scores هر تست
  function renderScores(result: TestResult) {
    const s = result.scores || {};
    const name = result.test_name;

    // تست مچینگ پایه — محورهای EI/SN/TF/JP
    if (name === "raavi_matching_basis_v1" || name === "mbti") {
      const axes = ["EI","SN","TF","JP","SOCIAL","PACE"];
      const labels: Record<string, [string,string]> = {
        EI:["درون‌گرا","برون‌گرا"], SN:["جزئی‌نگر","تنوع‌طلب"],
        TF:["منطقی","احساسی"], JP:["منعطف","ساختارمند"],
        SOCIAL:["ارتباط عمیق","جمع‌ساز"], PACE:["ریتم آرام","ریتم سریع"],
      };
      const hasAxes = axes.some(a => a in s);
      return (
        <div className="space-y-3">
          {(s.fullType || result.main_result) && (
            <div className="text-center py-3 rounded-2xl" style={{background:"rgba(255,107,0,0.1)",border:"1px solid rgba(255,107,0,0.2)"}}>
              <p className="text-3xl font-black text-white tracking-widest">{s.fullType || result.main_result}</p>
              <p className="text-xs text-orange-400 mt-1">{MBTI_DESC[s.fullType || result.main_result] || ""}</p>
            </div>
          )}
          {hasAxes && axes.map(axis => {
            if (!(axis in s)) return null;
            const val = Number(s[axis]) || 0;
            const pct = Math.round(((val + 4) / 8) * 100);
            const [neg, pos] = labels[axis] || [axis, axis];
            return (
              <div key={axis}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-slate-400">{val >= 0 ? pos : neg}</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full"
                    style={{background:val>=0?"rgba(255,107,0,0.15)":"rgba(99,102,241,0.15)",color:val>=0?"#FF9A3C":"#818cf8"}}>
                    {axis}: {val > 0 ? "+" : ""}{val}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                  <div className="h-full rounded-full" style={{width:`${pct}%`,background:val>=0?"linear-gradient(90deg,#FF6B00,#FF9A3C)":"linear-gradient(90deg,#6366f1,#818cf8)"}}/>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // NEO-FFI — پنج عامل
    if (name.includes("neo")) {
      const factors: Record<string, [string, string]> = {
        N:["روان‌رنجوری","#ef4444"], E:["برون‌گرایی","#f97316"],
        O:["گشودگی","#8b5cf6"], A:["توافق‌پذیری","#22c55e"], C:["وجدان‌کاری","#3b82f6"],
      };
      return (
        <div className="space-y-3">
          {Object.entries(factors).map(([k,[label,color]]) => {
            if (!(k+"_pct" in s) && !(k in s)) return null;
            const pct = Number(s[k+"_pct"] || s[k] || 0);
            return (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-slate-300">{label}</span>
                  <span className="text-[11px] font-black" style={{color}}>{pct}٪</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                  <div className="h-full rounded-full" style={{width:`${pct}%`,background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ECR-R — دلبستگی
    if (name === "ecr_r") {
      const anx = Number(s.ANX || s.anxiety || 0);
      const avo = Number(s.AVO || s.avoidance || 0);
      const max = 84;
      return (
        <div className="space-y-3">
          {[["اضطراب دلبستگی", anx, "#ef4444"], ["اجتناب دلبستگی", avo, "#6366f1"]].map(([label, val, color]) => (
            <div key={label as string}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-slate-300">{label as string}</span>
                <span className="text-[11px] font-black" style={{color: color as string}}>{val as number}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                <div className="h-full rounded-full" style={{width:`${Math.round((val as number)/max*100)}%`,background:color as string}}/>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 text-center pt-1">
            {anx > 42 ? "اضطراب دلبستگی بالا" : "اضطراب دلبستگی پایین"} •{" "}
            {avo > 42 ? "اجتناب دلبستگی بالا" : "اجتناب دلبستگی پایین"}
          </p>
        </div>
      );
    }

    // ERQ — تنظیم هیجان
    if (name === "erq") {
      const cr = Number(s.CR || s.cognitive_reappraisal || 0);
      const es = Number(s.ES || s.expressive_suppression || 0);
      return (
        <div className="space-y-3">
          {[["ارزیابی مجدد شناختی", cr, 42, "#22c55e"], ["سرکوب بیانی", es, 21, "#ef4444"]].map(([label, val, max, color]) => (
            <div key={label as string}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-slate-300">{label as string}</span>
                <span className="text-[11px] font-black" style={{color: color as string}}>{val as number}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                <div className="h-full rounded-full" style={{width:`${Math.round((val as number)/(max as number)*100)}%`,background:color as string}}/>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // PHQ-9 / GAD-7 / BAI / ISI — نمره کل + شدت
    if (["phq9","gad7","bai","isi","dass21"].includes(name)) {
      const total = Number(s.total || s.score || 0);
      const severity: Record<string, [number,string,string][]> = {
        phq9:   [[4,"بدون افسردگی","#22c55e"],[9,"خفیف","#eab308"],[14,"متوسط","#f97316"],[27,"شدید","#ef4444"]],
        gad7:   [[4,"بدون اضطراب","#22c55e"],[9,"خفیف","#eab308"],[14,"متوسط","#f97316"],[21,"شدید","#ef4444"]],
        bai:    [[7,"حداقل","#22c55e"],[15,"خفیف","#eab308"],[25,"متوسط","#f97316"],[63,"شدید","#ef4444"]],
        isi:    [[7,"بدون بی‌خوابی","#22c55e"],[14,"خفیف","#eab308"],[21,"متوسط","#f97316"],[28,"شدید","#ef4444"]],
        dass21: [[0,"بررسی ابعاد","#94a3b8"],[100,"","#94a3b8"]],
      };
      let level = "", color = "#94a3b8";
      const sev = severity[name] || [];
      for (const [max, lbl, clr] of sev) {
        if (total <= (max as number)) { level = lbl as string; color = clr as string; break; }
      }
      const maxScore = {phq9:27,gad7:21,bai:63,isi:28,dass21:120}[name] || 100;
      const subKeys = name === "dass21" ? ["D","A","S"] : [];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{background:"rgba(255,255,255,0.05)"}}>
            <span className="text-sm text-slate-300">نمره کل</span>
            <span className="text-2xl font-black" style={{color}}>{total}</span>
          </div>
          {level && <div className="text-center py-2 rounded-xl text-sm font-black" style={{background:`${color}22`,color}}>{level}</div>}
          <div className="h-3 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
            <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,Math.round(total/maxScore*100))}%`,background:color}}/>
          </div>
          {subKeys.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {subKeys.map(k => (
                <div key={k} className="text-center p-2 rounded-xl" style={{background:"rgba(255,255,255,0.04)"}}>
                  <p className="text-[10px] text-slate-400">{k==="D"?"افسردگی":k==="A"?"اضطراب":"استرس"}</p>
                  <p className="text-lg font-black text-white">{Number(s[k]||0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // IRI — همدلی
    if (name === "iri") {
      const dims: [string,string,string][] = [
        ["PT","دیدگاه‌گیری","#3b82f6"],["EC","نگرانی همدلانه","#22c55e"],
        ["FS","تخیل","#8b5cf6"],["PD","پریشانی شخصی","#ef4444"],
      ];
      return (
        <div className="space-y-3">
          {dims.map(([k,label,color]) => {
            const val = Number(s[k]||0);
            return (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-slate-300">{label}</span>
                  <span className="text-[11px] font-black" style={{color}}>{val}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                  <div className="h-full rounded-full" style={{width:`${Math.min(100,Math.round(val/36*100))}%`,background:color}}/>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // fallback — نمایش raw scores
    const entries = Object.entries(s).filter(([k]) => !["answers","fullType"].includes(k));
    if (entries.length === 0) return <p className="text-slate-400 text-sm text-center py-4">اطلاعات تکمیلی موجود نیست</p>;
    return (
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([k, v]) => (
          <div key={k} className="p-2 rounded-xl text-center" style={{background:"rgba(255,255,255,0.05)"}}>
            <p className="text-[10px] text-slate-400 mb-0.5">{k}</p>
            <p className="text-sm font-black text-white">{typeof v === "number" ? v : String(v)}</p>
          </div>
        ))}
      </div>
    );
  }

  const active = results[activeIdx];

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
      style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)"}}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{background:"linear-gradient(160deg,#0f172a 0%,#1B2A4A 100%)",border:"1px solid rgba(255,107,0,0.25)",maxHeight:"90vh",overflowY:"auto"}}
        onClick={e => e.stopPropagation()}>

        {/* هدر */}
        <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"rgba(255,255,255,0.08)"}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"rgba(255,107,0,0.15)"}}>
              <Cpu size={18} className="text-orange-400"/>
            </div>
            <div>
              <p className="font-black text-white text-sm">{user.name || "کاربر"}</p>
              <p className="text-[11px]" style={{color:"rgba(255,255,255,0.4)"}}>
                {loading ? "..." : `${results.length} تست انجام شده`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:bg-white/10"
            style={{background:"rgba(255,255,255,0.06)"}}>
            <X size={15} className="text-slate-400"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
              <p className="text-slate-400 text-sm">در حال بارگذاری...</p>
            </div>
          ) : error || results.length === 0 ? (
            <div className="text-center py-10">
              <Cpu size={40} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-400 font-bold">{error || "این کاربر هنوز تستی نداده است"}</p>
            </div>
          ) : (
            <>
              {/* تب تست‌ها */}
              <div className="flex gap-1.5 flex-wrap">
                {results.map((r, i) => (
                  <button key={r.id} onClick={() => setActiveIdx(i)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                    style={{
                      background: activeIdx === i ? "rgba(255,107,0,0.2)" : "rgba(255,255,255,0.05)",
                      color: activeIdx === i ? "#FF9A3C" : "rgba(255,255,255,0.45)",
                      border: activeIdx === i ? "1px solid rgba(255,107,0,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    {TEST_LABELS[r.test_name] || r.test_name}
                  </button>
                ))}
              </div>

              {/* نتیجه تست فعال */}
              {active && (
                <div className="space-y-3">
                  {/* تاریخ */}
                  {active.completed_at && (
                    <div className="flex items-center gap-2 px-1">
                      <Calendar size={12} className="text-orange-400"/>
                      <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>
                        تاریخ:{" "}
                        <span className="text-slate-300 font-bold">
                          {new Date(active.completed_at).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"})}
                        </span>
                      </p>
                    </div>
                  )}
                  {/* نمودار */}
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                    <p className="text-xs font-black text-white flex items-center gap-2">
                      <BarChart2 size={13} className="text-orange-400"/>
                      {TEST_LABELS[active.test_name] || active.test_name}
                      {active.main_result && (
                        <span className="mr-auto px-2 py-0.5 rounded-full text-[10px]"
                          style={{background:"rgba(255,107,0,0.15)",color:"#FF9A3C"}}>
                          {active.main_result}
                        </span>
                      )}
                    </p>
                    {renderScores(active)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── صفحه اصلی ──────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { state } = useApp();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserExtended[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("همه شهرها");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [unsuspending, setUnsuspending] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  // ── state مودال ──
  const [testModalUser, setTestModalUser] = useState<AdminUserExtended | null>(
    null,
  );

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    if (!state.isLoading && !isAdminPhone(state.user?.mobileNumber))
      router.replace("/dashboard");
  }, [state.isLoading, state.user]);

  useEffect(() => {
    loadData();
  }, [cityFilter, page, viewMode]);

  async function loadData() {
    setLoading(true);
    try {
      if (viewMode === "suspended") {
        const res = await fetch(`${API_URL}/api/intelligence/suspended-users`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setSuspendedUsers(data.users || []);
          setTotal(data.total || 0);
        }
      } else {
        const res = await fetchAllUsers({
          city: cityFilter === "همه شهرها" ? undefined : cityFilter,
          page,
          limit: 20,
        });
        setUsers(res.users || []);
        setTotal(res.total || 0);
      }
    } catch {
      if (viewMode === "all") {
        setUsers([
          {
            id: "1",
            name: "علی احمدی",
            mobileNumber: "09120000001",
            city: "تهران",
            createdAt: new Date().toISOString(),
            bookingCount: 3,
          },
          {
            id: "2",
            name: "مریم حسینی",
            mobileNumber: "09130000002",
            city: "مشهد",
            createdAt: new Date().toISOString(),
            bookingCount: 1,
          },
          {
            id: "3",
            name: "رضا کریمی",
            mobileNumber: "09140000003",
            city: "اصفهان",
            createdAt: new Date().toISOString(),
            bookingCount: 5,
          },
        ]);
        setTotal(3);
      }
    } finally {
      setLoading(false);
    }
  }

  async function unsuspendUser(userId: string) {
    setUnsuspending(userId);
    try {
      await fetch(`${API_URL}/api/intelligence/unsuspend/${userId}`, {
        method: "PATCH",
        headers,
      });
      setSuspendedUsers((prev) => prev.filter((u) => u.user_id !== userId));
      setTotal((t) => Math.max(0, t - 1));
    } catch {}
    setUnsuspending(null);
  }

  async function changeRole(userId: string, role: "user" | "admin") {
    setRoleUpdating(userId);
    try {
      const updated = await updateAdminUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
    } catch {}
    setRoleUpdating(null);
  }

  async function suspendUser(userId: string) {
    setSuspending(userId);
    try {
      await fetch(`${API_URL}/api/matching/suspend/${userId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "ادمین - تعلیق دستی" }),
      });
      await loadData();
    } catch {}
    setSuspending(null);
  }

  const filteredUsers = search.trim()
    ? users.filter(
        (u) => u.name?.includes(search) || u.mobileNumber?.includes(search),
      )
    : users;

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5 relative z-10" dir="rtl">
      {/* مودال نتیجه تست */}
      {testModalUser && (
        <TestResultModal
          user={testModalUser}
          onClose={() => setTestModalUser(null)}
        />
      )}

      {/* هدر */}
      <div className="rounded-3xl p-6" style={CARD}>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Users size={20} className="text-orange-400" /> مدیریت کاربران
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          مجموع {total} {viewMode === "suspended" ? "کاربر ساسپند" : "کاربر"}
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setViewMode("all");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === "all" ? "bg-orange-500 text-white" : "text-slate-400"}`}
            style={
              viewMode !== "all"
                ? {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
                : {}
            }
          >
            <Users size={14} /> همه کاربران
          </button>
          <button
            onClick={() => {
              setViewMode("suspended");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === "suspended" ? "bg-red-500 text-white" : "text-slate-400"}`}
            style={
              viewMode !== "suspended"
                ? {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
                : {}
            }
          >
            <UserX size={14} /> ساسپند شده
            {suspendedUsers.length > 0 && viewMode !== "suspended" && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {suspendedUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* فیلترها */}
      {viewMode === "all" && (
        <div className="rounded-2xl p-4 space-y-3" style={CARD}>
          <div className="relative">
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="جستجو نام یا شماره..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.slice(0, 8).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCityFilter(c);
                  setPage(1);
                }}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition-all ${cityFilter === c ? "bg-orange-500 text-white" : "text-slate-400"}`}
                style={
                  cityFilter === c
                    ? {}
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* لیست */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "suspended" ? (
        <div className="space-y-3">
          {suspendedUsers.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={CARD}>
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-white font-bold">
                هیچ کاربر ساسپندی وجود ندارد
              </p>
            </div>
          ) : (
            suspendedUsers.map((u: any) => (
              <div
                key={u.user_id || u.id}
                className="rounded-2xl p-4"
                style={{
                  background: "linear-gradient(145deg, #2A1B1B, #1A0F0F)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(239,68,68,0.15)" }}
                  >
                    <UserX size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm">
                      {u.user?.name || u.name || "کاربر ناشناس"}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      <ShieldAlert size={10} className="inline ml-1" />
                      {u.no_show_count || 2} بار غیبت
                      {u.suspended_at && (
                        <span className="mr-3">
                          {new Date(u.suspended_at).toLocaleDateString("fa-IR")}{" "}
                          تعلیق شد
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => unsuspendUser(u.user_id || u.id)}
                    disabled={unsuspending === (u.user_id || u.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#4ade80",
                    }}
                  >
                    {unsuspending === (u.user_id || u.id) ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    رفع تعلیق
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <div key={u.id} className="rounded-2xl p-4" style={CARD}>
              <div className="flex items-center gap-3">
                {/* آواتار */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: u.is_suspended
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,107,0,0.15)",
                  }}
                >
                  {u.is_suspended ? (
                    <UserX size={18} className="text-red-400" />
                  ) : (
                    <span className="font-black text-orange-400 text-base">
                      {(u.name || "؟").charAt(0)}
                    </span>
                  )}
                </div>

                {/* اطلاعات کاربر */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white text-sm">
                      {u.name || "بدون نام"}
                    </p>
                    {u.role === "admin" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ادمین
                      </span>
                    )}
                    {u.is_suspended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        ساسپند
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span
                      className="text-[11px] flex items-center gap-1"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      <Phone size={10} />
                      {u.mobileNumber || "—"}
                    </span>
                    {u.city && (
                      <span
                        className="text-[11px] flex items-center gap-1"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        <MapPin size={10} className="text-orange-400" />
                        {u.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* دکمه‌ها */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                  {u.bookingCount !== undefined && (
                    <span
                      className="text-xs px-2 py-1 rounded-xl font-bold"
                      style={{
                        background: "rgba(255,107,0,0.12)",
                        color: "#FF9A3C",
                      }}
                    >
                      {u.bookingCount} رزرو
                    </span>
                  )}

                  {/* دکمه نتیجه تست */}
                  <button
                    onClick={() => setTestModalUser(u)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-xl font-bold transition-all hover:opacity-90"
                    style={{
                      background: "rgba(139,92,246,0.2)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: "#c084fc",
                    }}
                  >
                    <Cpu size={10} /> نتیجه تست
                  </button>

                  <button
                    onClick={() =>
                      changeRole(u.id, u.role === "admin" ? "user" : "admin")
                    }
                    disabled={roleUpdating === u.id}
                    className="text-[10px] px-2 py-1 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{
                      background:
                        u.role === "admin"
                          ? "rgba(239,68,68,0.25)"
                          : "rgba(99,102,241,0.25)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {roleUpdating === u.id
                      ? "..."
                      : u.role === "admin"
                        ? "حذف ادمین"
                        : "ادمین کن"}
                  </button>

                  {u.createdAt && (
                    <p
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {new Date(u.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">کاربری یافت نشد</p>
            </div>
          )}
        </div>
      )}

      {/* صفحه‌بندی */}
      {viewMode === "all" && total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            قبلی
          </button>
          <span className="text-white text-sm font-bold">صفحه {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={users.length < 20}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}

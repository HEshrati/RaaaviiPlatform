"use client";
import { useEffect, useState } from "react";
import { Calendar, Video, MapPin, FileText, User, Brain, ChevronLeft, X, Loader2, Star, AlertTriangle, CheckCircle2, BarChart3, ClipboardList, ShieldAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const toPersian = (n: number | string) => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

const TEST_LABELS: Record<string, string> = {
  mbti: "MBTI تیپ شخصیتی", big5: "Big Five شخصیت", neo_ffi: "NEO-FFI", hexaco: "HEXACO",
  raavi_matching_basis_v1: "پرسشنامه پایه راوی", ecr_r: "سبک دلبستگی ECR-R",
  erq: "تنظیم هیجان ERQ", iri: "همدلی IRI", gottman: "سازگاری گاتمن", pid5: "اختلال شخصیت PID-5",
};

function ScoreBar({ label, value, max = 100, color }: any) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>{toPersian(value)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)` }} />
      </div>
    </div>
  );
}

function PatientProfile({ booking, onClose }: { booking: any; onClose: () => void }) {
  const [tests, setTests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview"|"tests"|"answers">("overview");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const h = { Authorization: `Bearer ${token}` };
    const uid = booking.user_id || booking.userId;
    Promise.allSettled([
      fetch(`${API}/api/psychologist-verify/patients/${uid}/tests`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/psychologist-verify/patients/${uid}/profile`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([t, p]) => {
      if (t.status === "fulfilled" && t.value) setTests(t.value?.results || t.value?.data || []);
      if (p.status === "fulfilled" && p.value) setProfile(p.value);
    }).finally(() => setLoading(false));
  }, [booking]);

  const name = booking.user_display_name || booking.userName || "مراجع";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full md:max-w-2xl max-h-[92vh] overflow-hidden rounded-t-3xl md:rounded-3xl flex flex-col"
        style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* هدر */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white" }}>
              {name[0]}
            </div>
            <div>
              <p className="text-white font-black text-base">{name}</p>
              <p className="text-slate-500 text-xs">{booking.start_datetime ? new Date(booking.start_datetime).toLocaleDateString("fa-IR") : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* تب‌ها */}
        <div className="flex border-b px-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {[["overview","اطلاعات کلی"],["tests","نتایج تست‌ها"],["answers","پرسشنامه پایه"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className="px-4 py-3 text-sm font-bold transition-all border-b-2"
              style={{ borderColor: activeTab === key ? "#10b981" : "transparent", color: activeTab === key ? "#10b981" : "#64748b" }}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>
          ) : activeTab === "overview" ? (
            <div className="space-y-4">
              {/* اطلاعات جلسه */}
              <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-500 text-xs font-bold mb-3">اطلاعات جلسه</p>
                {[
                  ["وضعیت", booking.booking_status || booking.status],
                  ["نوع جلسه", booking.session_type === "online" ? "آنلاین" : "حضوری"],
                  ["تاریخ", booking.start_datetime ? new Date(booking.start_datetime).toLocaleString("fa-IR") : "-"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-white font-bold">{v}</span>
                  </div>
                ))}
                {booking.user_need_summary && (
                  <div className="pt-2 border-t mt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-slate-500 text-xs mb-1">نیاز اصلی مراجع</p>
                    <p className="text-slate-300 text-sm leading-6">{booking.user_need_summary}</p>
                  </div>
                )}
              </div>

              {/* پروفایل */}
              {profile && (
                <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-slate-500 text-xs font-bold mb-3">پروفایل شخصی</p>
                  {[
                    ["سن", profile.age ? toPersian(profile.age) + " سال" : "-"],
                    ["جنسیت", profile.gender || "-"],
                    ["شهر", profile.city || "-"],
                    ["تحصیلات", profile.educationLevel || profile.education || "-"],
                    ["وضعیت تأهل", profile.maritalStatus || "-"],
                    ["تکمیل پروفایل", profile.completionPercentage ? toPersian(profile.completionPercentage) + "٪" : "-"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-white font-bold">{v}</span>
                    </div>
                  ))}
                  {profile.bio && (
                    <div className="pt-2 border-t mt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <p className="text-slate-500 text-xs mb-1">درباره مراجع</p>
                      <p className="text-slate-300 text-sm leading-6">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* خلاصه تست‌ها */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-500 text-xs font-bold mb-3">خلاصه تست‌ها ({toPersian(tests.length)} تست)</p>
                {tests.length === 0 ? (
                  <p className="text-slate-600 text-sm">هنوز تستی انجام نشده</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tests.map((t: any) => (
                      <span key={t.test_name} className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                        {TEST_LABELS[t.test_name] || t.test_name}: {t.main_result || "—"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

          ) : activeTab === "tests" ? (
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-12">
                  <Brain size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">مراجع هنوز تستی انجام نداده است</p>
                </div>
              ) : tests.map((t: any) => (
                <div key={t.test_name} className="p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold text-sm">{TEST_LABELS[t.test_name] || t.test_name}</p>
                    {t.main_result && (
                      <span className="px-3 py-1 rounded-full text-xs font-black"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                        {t.main_result}
                      </span>
                    )}
                  </div>
                  {t.scores && typeof t.scores === "object" && (
                    <div className="space-y-1">
                      {Object.entries(t.scores).slice(0, 6).map(([k, v]: any) => (
                        <ScoreBar key={k} label={k} value={Math.round(v)} color="#10b981" />
                      ))}
                    </div>
                  )}
                  {t.completed_at && (
                    <p className="text-slate-600 text-xs mt-2">{new Date(t.completed_at).toLocaleDateString("fa-IR")}</p>
                  )}
                </div>
              ))}
            </div>

          ) : (
            <div className="space-y-3">
              {tests.filter(t => t.test_name === "raavi_matching_basis_v1").length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">پرسشنامه پایه تکمیل نشده است</p>
                </div>
              ) : tests.filter(t => t.test_name === "raavi_matching_basis_v1").map((t: any) => (
                <div key={t.id}>
                  {t.answers && Object.entries(t.answers).map(([q, a]: any) => (
                    <div key={q} className="p-3 rounded-xl mb-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-slate-500 text-xs mb-1">{q}</p>
                      <p className="text-white text-sm">{String(a)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* دکمه رد روانشناس از دید مراجع */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-slate-600 text-xs text-center">اطلاعات فوق محرمانه و فقط برای استفاده بالینی است</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [isApproved, setIsApproved] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/api/psychologist-verify/my-profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const status = d?.verificationStatus || d?.verification_status || "";
        setIsApproved(["approved", "active"].includes(status));
      })
      .catch(() => {});
    fetch(`${API}/api/psychologist-verify/my-bookings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setBookings(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => (b.booking_status || b.status) === filter);

  return (
    <div dir="rtl">
      {selected && <PatientProfile booking={selected} onClose={() => setSelected(null)} />}

      {!isApproved && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-5"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <ShieldAlert size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <p className="text-amber-400 text-sm">پروفایل شما هنوز تأیید نشده — لیست مراجعین قابل مشاهده است اما جلسه جدید ثبت نمی‌شود.</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-black">مراجعین من</h1>
          <p className="text-slate-500 text-sm mt-0.5">{toPersian(bookings.length)} رزرو ثبت شده</p>
        </div>
      </div>

      {/* فیلتر */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[["all","همه"],["confirmed","تایید شده"],["pending","در انتظار"],["completed","تکمیل شده"],["cancelled","لغو شده"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: filter === key ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter === key ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: filter === key ? "#10b981" : "#64748b",
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User size={32} className="text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">رزروی در این دسته وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => {
            const statusMap: Record<string,[string,string]> = {
              confirmed: ["#10b981","تایید شده"], pending: ["#f59e0b","در انتظار"],
              completed: ["#3b82f6","تکمیل شده"], cancelled: ["#ef4444","لغو شده"],
            };
            const st = b.booking_status || b.status || "pending";
            const [sc, sl] = statusMap[st] || ["#64748b", st];
            return (
              <button key={b.id} onClick={() => setSelected(b)} className="w-full text-right p-4 rounded-2xl transition-all group"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white" }}>
                      {(b.user_display_name || b.userName || "م")[0]}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{b.user_display_name || b.userName || "مراجع"}</p>
                      <p className="text-slate-500 text-xs">{b.start_datetime ? new Date(b.start_datetime).toLocaleString("fa-IR") : "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${sc}18`, color: sc }}>{sl}</span>
                    <ChevronLeft size={14} className="text-slate-600 group-hover:text-emerald-400 transition-all" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs mr-[52px]">
                  {b.session_type === "online" ? <Video size={11} /> : <MapPin size={11} />}
                  <span>{b.session_type === "online" ? "آنلاین" : "حضوری"}</span>
                  {b.user_need_summary && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <FileText size={11} /> {b.user_need_summary}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}




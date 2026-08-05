"use client";
import { useEffect, useState } from "react";
import { Shield, CheckCircle2, Clock, XCircle, Edit3, Save, Loader2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  approved: { label: "تأیید شده", color: "#10b981", icon: CheckCircle2 },
  active: { label: "فعال", color: "#22c55e", icon: CheckCircle2 },
  pending: { label: "در انتظار بررسی", color: "#f59e0b", icon: Clock },
  pending_admin: { label: "در انتظار بررسی ادمین", color: "#f59e0b", icon: Clock },
  profile_submitted: { label: "در حال بررسی سیستم", color: "#3b82f6", icon: Clock },
  needs_admin_review: { label: "نیاز به بررسی دستی", color: "#a855f7", icon: AlertCircle },
  needs_revision: { label: "نیاز به اصلاح", color: "#f97316", icon: Edit3 },
  rejected: { label: "رد شده", color: "#ef4444", icon: XCircle },
};

const SPECIALTIES = [
  'اضطراب و استرس','افسردگی','روابط زوجین','کودک و نوجوان','تروما و PTSD',
  'اختلالات شخصیت','وسواس فکری-عملی','مشاوره شغلی','خانواده‌درمانی','سایر',
];

export default function PsychologistProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sessionPrice, setSessionPrice] = useState("");
  const [workingAreas, setWorkingAreas] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const h = { Authorization: `Bearer ${token}` };

  function load() {
    setLoading(true);
    fetch(`${API}/api/psychologist-verify/my-profile`, { headers: h })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        setProfile(p);
        if (p) {
          setBio(p.bio || "");
          setCity(p.city || "");
          setSpecialty(p.specialty || "");
          setSessionPrice(String(p.sessionPrice ?? p.session_price ?? ""));
          setWorkingAreas(p.workingAreas || p.working_areas || "");
        }
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/api/psychologist-verify/my-profile`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ bio, city, specialty, sessionPrice: sessionPrice ? Number(sessionPrice) : 0, workingAreas }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "ذخیره تغییرات ناموفق بود");
      setMsg({ type: "ok", text: "تغییرات با موفقیت ذخیره شد" });
      setEditing(false);
      load();
    } catch (e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-slate-400 text-sm">در حال بارگذاری...</p>;

  const status = profile?.verificationStatus || profile?.verification_status || "pending";
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const reasonText = status === "rejected" ? profile?.rejectionReason
    : status === "needs_revision" ? profile?.needsRevisionReason : null;
  // ویرایش پروفایل فقط زمانی مجاز است که پروفایل قبلاً تایید شده باشد یا نیاز به اصلاح داشته باشد؛
  // در حالت "در انتظار بررسی" بهتر است تغییر اطلاعات باعث سردرگمی در بررسی جاری ادمین نشود.
  const canEdit = ["approved", "active", "needs_revision"].includes(status);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-white text-xl font-black">پروفایل تخصصی</h1>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
            <Edit3 size={13} /> ویرایش اطلاعات
          </button>
        )}
      </div>
      <p className="text-slate-500 text-sm mb-6">اطلاعات احراز هویت و تخصص شما</p>

      <div className="p-4 rounded-2xl mb-4 flex items-center gap-3" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
        <StatusIcon size={20} style={{ color: cfg.color }} />
        <span className="font-bold text-sm" style={{ color: cfg.color }}>وضعیت تایید: {cfg.label}</span>
      </div>

      {reasonText && (
        <div className="p-3 rounded-xl mb-6 text-sm leading-6"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {reasonText}
        </div>
      )}

      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ["نام و نام خانوادگی", [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.nameFromIrimc],
            ["شماره نظام روانشناسی", profile?.licenseNumber],
            ["شهر فعالیت", profile?.city],
            ["حوزه‌های تخصص", Array.isArray(profile?.specialties) ? profile.specialties.join("، ") : (profile?.specialty || profile?.specialties)],
            ["قیمت هر جلسه (تومان)", profile?.sessionPrice ? Number(profile.sessionPrice).toLocaleString("fa-IR") : null],
            ["حوزه‌های کاری", profile?.workingAreas],
          ].map(([label, value]) => (
            <div key={label as string} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>
              <p className="text-white text-sm">{value || "—"}</p>
            </div>
          ))}
          {profile?.bio && (
            <div className="p-4 rounded-2xl md:col-span-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-slate-500 text-xs font-bold mb-1">بیوگرافی</p>
              <p className="text-white text-sm leading-7">{profile.bio}</p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2">حوزه تخصص</p>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none"
              style={{ colorScheme: "dark" }}>
              <option value="" style={{ color: "#000" }}>انتخاب کنید</option>
              {SPECIALTIES.map((s) => <option key={s} value={s} style={{ color: "#000" }}>{s}</option>)}
            </select>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2">شهر فعالیت</p>
            <input value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2">قیمت هر جلسه (تومان)</p>
            <input value={sessionPrice} onChange={(e) => setSessionPrice(e.target.value)} type="number" dir="ltr"
              className="w-full bg-transparent text-white text-sm outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2">حوزه‌های کاری</p>
            <input value={workingAreas} onChange={(e) => setWorkingAreas(e.target.value)}
              placeholder="مثلاً: مشاوره آنلاین، جلسات حضوری در کلینیک"
              className="w-full bg-transparent text-white text-sm outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
          <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2">بیوگرافی</p>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
              className="w-full bg-transparent text-white text-sm outline-none resize-none" />
          </div>

          {msg && (
            <div className="p-3 rounded-xl"
              style={{ background: msg.type === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
              <p className="text-sm" style={{ color: msg.type === "ok" ? "#10b981" : "#ef4444" }}>{msg.text}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              ذخیره تغییرات
            </button>
            <button onClick={() => { setEditing(false); setMsg(null); }}
              className="px-5 py-3 rounded-2xl text-sm font-bold text-slate-400"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              انصراف
            </button>
          </div>
        </div>
      )}

      {!canEdit && !editing && (
        <p className="text-slate-500 text-xs mt-4 flex items-center gap-1">
          <Shield size={12} /> {status === "rejected"
            ? "ویرایش پروفایل غیرفعال است. برای بازنگری با پشتیبانی راوی تماس بگیرید."
            : "ویرایش اطلاعات تخصصی پس از بررسی اولیه توسط تیم راوی امکان‌پذیر می‌شود."}
        </p>
      )}
    </div>
  );
}

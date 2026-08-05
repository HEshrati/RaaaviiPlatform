"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Upload, CheckCircle2, Clock, Loader2, AlertCircle, ImageIcon, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STEPS = [
  { key: "profile_incomplete", label: "تکمیل پروفایل", icon: "📋", done: false },
  { key: "pending_review",     label: "در انتظار بررسی", icon: "🔍", done: false },
  { key: "approved",           label: "تأیید همکاری", icon: "✅", done: false },
  { key: "active",             label: "فعال و پذیرای رویداد", icon: "🎉", done: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  not_started:        { label: "شروع نشده",         color: "#64748b", bg: "rgba(100,116,139,0.1)", desc: "اطلاعات فضا را ثبت کنید" },
  profile_incomplete: { label: "پروفایل ناقص",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  desc: "اطلاعات فضا را تکمیل کنید و شرایط را بپذیرید" },
  pending_review:     { label: "در صف بررسی",       color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  desc: "تیم راوی درخواست شما را بررسی می‌کند" },
  approved:           { label: "تأیید شده",          color: "#10b981", bg: "rgba(16,185,129,0.1)",  desc: "همکاری شما تأیید شده است" },
  active:             { label: "فعال",               color: "#22c55e", bg: "rgba(34,197,94,0.1)",   desc: "فضای شما آماده پذیرش رویداد است" },
  needs_revision:     { label: "نیاز به اصلاح",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  desc: "برای ارسال دوباره، موارد اعلام‌شده را اصلاح کنید" },
  rejected:           { label: "رد شده",             color: "#ef4444", bg: "rgba(239,68,68,0.1)",   desc: "درخواست رد شد — برای اطلاع از دلیل با پشتیبانی تماس بگیرید" },
};

export default function PartnerVerificationPage() {
  const [profile, setProfile]         = useState<any>(null);
  const [status, setStatus]           = useState<string>("not_started");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{type:"ok"|"err"; text:string} | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/venue/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/venue/status`,     { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([p, s]) => {
      const prof = p.status === "fulfilled" ? p.value : null;
      const st   = s.status === "fulfilled" ? s.value?.status || "not_started" : "not_started";
      setProfile(prof);
      setStatus(st);
      if (prof) {
        setTermsAccepted(!!prof.accepted_terms);
      }
    }).finally(() => setLoading(false));
  }, []);

  const stepIndex = ["profile_incomplete","pending_review","approved","active"].indexOf(status);

  async function handleAcceptTerms() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/api/venue/accept-terms`, { method: "POST", headers: h });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "خطا");
      setMsg({ type: "ok", text: d.message || "شرایط پذیرفته شد" });
      setStatus("pending_review");
      setTermsAccepted(true);
    } catch(e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>
  );

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["not_started"];

  return (
    <div dir="rtl" className="max-w-2xl">
      <h1 className="text-white text-xl font-black mb-1">تأیید و همکاری</h1>
      <p className="text-slate-500 text-sm mb-6">ارسال درخواست و پیگیری تأییدیهٔ فضای شما</p>

      {/* وضعیت فعلی */}
      <div className="p-4 rounded-2xl mb-6 flex items-center gap-3"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${cfg.color}20` }}>
          <ShieldCheck size={18} style={{ color: cfg.color }} />
        </div>
        <div>
          <p className="text-white font-bold text-sm">{cfg.label}</p>
          <p className="text-slate-400 text-xs">{cfg.desc}</p>
        </div>
        <span className="mr-auto px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: `${cfg.color}18`, color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* نردبان پیشرفت */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const isDone = i <= stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: isDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${isDone ? "#22c55e" : "rgba(255,255,255,0.1)"}`, boxShadow: isCurrent ? `0 0 12px #22c55e44` : "none" }}>
                  {step.icon}
                </div>
                <p className="text-[10px] mt-1 text-center max-w-[60px]" style={{ color: isDone ? "#22c55e" : "#475569" }}>{step.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-0.5 mb-4 flex-shrink-0" style={{ background: i < stepIndex ? "#22c55e" : "rgba(255,255,255,0.08)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* اطلاعات پایه فقط در صفحهٔ پروفایل ثبت می‌شود؛ این صفحه صرفاً برای
          مدارک، پذیرش شرایط و پیگیری بررسی ادمین است. */}
      {!profile && (
        <div className="p-5 rounded-2xl mb-5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.24)" }}>
          <p className="text-white font-bold text-sm">ابتدا اطلاعات فضا را ثبت کنید</p>
          <p className="text-slate-400 text-xs mt-1 mb-4">نام مسئول، نشانی، ظرفیت و امکانات فقط یک‌بار در پروفایل فضا ثبت می‌شوند.</p>
          <Link href="/panel/partner/profile" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#22c55e", color: "white" }}>
            تکمیل پروفایل فضا
          </Link>
        </div>
      )}

      {profile && (status === "profile_incomplete" || status === "rejected" || status === "needs_revision") && (
        <div className="p-4 rounded-2xl mb-5 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white text-sm font-bold">اطلاعات فضا ثبت شده است</p>
            <p className="text-slate-500 text-xs mt-1">{profile.venue_name} · {profile.city} · ظرفیت {profile.capacity || "—"} نفر</p>
          </div>
          <Link href="/panel/partner/profile" className="text-xs font-bold" style={{ color: "#4ade80" }}>ویرایش</Link>
        </div>
      )}

      {/* پذیرش شرایط */}
      {profile && (status === "profile_incomplete" || status === "rejected" || status === "needs_revision") && !termsAccepted && (
        <div className="p-5 rounded-2xl mb-5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-white font-bold text-sm mb-3">شرایط همکاری راوی</p>
          <p className="text-slate-400 text-sm leading-7 mb-4">
            به‌عنوان همکار راوی متعهد می‌شوم که فضای امن، تمیز و مناسب برای برگزاری رویدادهای
            روانشناختی و اجتماعی فراهم کنم، از حریم خصوصی شرکت‌کنندگان مراقبت کنم، و
            استانداردهای بهداشتی و ایمنی را رعایت نمایم.
          </p>
          <button onClick={handleAcceptTerms} disabled={saving}
            className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white" }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            پذیرش شرایط و ارسال برای بررسی
          </button>
        </div>
      )}

      {/* در انتظار بررسی */}
      {(status === "pending_review" || (status === "profile_incomplete" && termsAccepted)) && (
        <div className="p-5 rounded-2xl flex items-center gap-4"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Clock size={24} className="text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">در صف بررسی</p>
            <p className="text-slate-400 text-xs mt-1">تیم راوی معمولاً ظرف ۲۴ تا ۷۲ ساعت پاسخ می‌دهد</p>
          </div>
        </div>
      )}

      {/* تأیید شده */}
      {(status === "approved" || status === "active") && (
        <div className="p-5 rounded-2xl flex items-center gap-4"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">همکاری تأیید شده 🎉</p>
            <p className="text-slate-400 text-xs mt-1">فضای شما آماده پذیرش رویداد است</p>
          </div>
        </div>
      )}

      {/* رد شده — باگ رفع‌شده: پیش‌تر برای وضعیت "rejected" هیچ بلوکی رندر نمی‌شد
          و کاربر با صفحه‌ای خالی و بدون هیچ توضیحی مواجه می‌شد. */}
      {(status === "rejected" || status === "needs_revision") && (
        <div className="p-5 rounded-2xl flex items-start gap-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <XCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-bold text-sm">نیاز به اصلاح اطلاعات</p>
            <p className="text-slate-400 text-xs mt-1 leading-6">
              {profile?.rejection_reason || profile?.admin_note || "برای اطلاع از دلیل رد و بررسی مجدد، با پشتیبانی راوی تماس بگیرید."}
            </p>
          </div>
        </div>
      )}

      {/* آپلود تصاویر فضا — باگ رفع‌شده: بک‌اند endpoint آپلود تصاویر فضا را داشت
          (venues/:venueId/images) اما هیچ UI ای در پنل همکار برای آن وجود نداشت،
          با اینکه در داشبورد همکار به این صفحه به‌عنوان «مدارک و تصاویر محیط» لینک داده شده بود. */}
      {profile?.id && (status === "profile_incomplete" || status === "pending_review" || status === "approved" || status === "active" || status === "rejected" || status === "needs_revision") && (
        <VenueImagesUploader venueId={profile.id} token={token} images={profile.images} />
      )}

      {msg && (
        <div className="mt-4 p-3 rounded-xl"
          style={{ background: msg.type==="ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.type==="ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
          <p className="text-sm" style={{ color: msg.type==="ok" ? "#10b981" : "#ef4444" }}>{msg.text}</p>
        </div>
      )}
    </div>
  );
}

// ویژگی جدید: کامپوننت آپلود تصاویر فضا. بک‌اند این قابلیت را از قبل پیاده‌سازی کرده بود
// (POST /api/psychologist-verify/venues/:venueId/images) ولی هیچ رابط کاربری برای آن
// وجود نداشت.
function VenueImagesUploader({ venueId, token, images }: { venueId: string; token: string; images?: any }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [uploaded, setUploaded] = useState<string[]>(
    Array.isArray(images) ? images : (typeof images === "string" ? (JSON.parse(images || "[]")) : [])
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setErr("");
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 6).forEach((f) => fd.append("files", f));
      const r = await fetch(`${API}/api/psychologist-verify/venues/${venueId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "بارگذاری تصاویر ناموفق بود");
      setUploaded((prev) => [...prev, ...(d.urls || [])]);
    } catch (e: any) {
      setErr(e.message || "خطا در بارگذاری تصاویر");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-5 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-white font-bold text-sm mb-1 flex items-center gap-2"><ImageIcon size={15} className="text-emerald-400" /> تصاویر فضا</p>
      <p className="text-slate-500 text-xs mb-4">حداکثر ۶ تصویر (jpg، png یا webp، هرکدام تا ۵ مگابایت)</p>

      {uploaded.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {uploaded.map((u, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <img src={u.startsWith("http") ? u : `${API}${u}`} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {err && (
        <div className="mb-3 p-2.5 rounded-xl text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{err}</div>
      )}

      <label className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold cursor-pointer"
        style={{ background: "rgba(34,197,94,0.1)", border: "1px dashed rgba(34,197,94,0.4)", color: "#22c55e" }}>
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? "در حال بارگذاری..." : "افزودن تصویر"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)} />
      </label>
    </div>
  );
}


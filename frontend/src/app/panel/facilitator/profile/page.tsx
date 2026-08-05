"use client";
import { useEffect, useState } from "react";
import { Save, Loader2, MapPin, User, Link as LinkIcon, BookOpen } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_LABEL: Record<string, string> = {
  profile_incomplete: "پروفایل ناقص",
  pending_review: "در انتظار بررسی",
  needs_revision: "نیاز به اصلاح",
  approved: "تأیید شده",
  active: "فعال",
  rejected: "رد شده",
};

export default function FacilitatorProfilePage() {
  const [profile, setProfile]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{type:"ok"|"err";text:string}|null>(null);
  const [domains, setDomains]         = useState<string[]>([]);
  const [allDomains, setAllDomains]   = useState<string[]>([]);

  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [nationalId, setNationalId]   = useState("");
  const [city, setCity]               = useState("");
  const [bio, setBio]                 = useState("");
  const [experience, setExperience]   = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/facilitator/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/facilitator/domains`,    { headers: h }).then(r => r.ok ? r.json() : {}),
    ]).then(([p, d]) => {
      const prof = p.status === "fulfilled" ? p.value : null;
      const doms = d.status === "fulfilled" ? (d.value as any)?.domains || [] : [];
      setProfile(prof);
      setAllDomains(doms);
      if (prof) {
        setFirstName(prof.first_name || "");
        setLastName(prof.last_name || "");
        setCity(prof.city || "");
        setBio(prof.bio || "");
        setExperience(prof.event_experience || "");
        setPortfolioUrl(prof.portfolio_url || "");
        setDomains(Array.isArray(prof.domains) ? prof.domains : JSON.parse(prof.domains || "[]"));
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      if (!profile) {
        // ثبت اولیه
        // باگ رفع‌شده: کد ملی قبلاً به‌صورت مقدار ساختگی "0000000000" هاردکد شده بود
        // و اصلاً از کاربر گرفته نمی‌شد؛ در نتیجه چک‌لیست "تکمیل اطلاعات شخصی" همیشه
        // به‌اشتباه تیک می‌خورد بدون اینکه کد ملی واقعی تسهیلگر هرگز ثبت شده باشد.
        if (!nationalId || nationalId.trim().length < 8) {
          setMsg({ type: "err", text: "لطفاً کد ملی معتبر خود را وارد کنید" });
          setSaving(false);
          return;
        }
        const r = await fetch(`${API}/api/facilitator/register`, {
          method: "POST",
          headers: { ...h, "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, nationalId, city, bio, domains, eventExperience: experience, portfolioUrl }),
        });
        if (!r.ok) throw new Error((await r.json()).message || "خطا");
        setMsg({ type: "ok", text: "پروفایل با موفقیت ثبت شد" });
      } else {
        const r = await fetch(`${API}/api/facilitator/my-profile`, {
          method: "PATCH",
          headers: { ...h, "Content-Type": "application/json" },
          body: JSON.stringify({ bio, city, domains, event_experience: experience, portfolio_url: portfolioUrl }),
        });
        if (!r.ok) throw new Error((await r.json()).message || "خطا");
        setMsg({ type: "ok", text: "تغییرات ذخیره شد" });
      }
    } catch(e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-amber-400 animate-spin" /></div>;

  return (
    <div dir="rtl" className="max-w-2xl">
      <h1 className="text-white text-xl font-black mb-1">پروفایل تسهیلگری</h1>
      <p className="text-slate-500 text-sm mb-6">اطلاعات ثبت‌شده شما برای برگزاری رویداد</p>

      {profile && (
        <div className="p-4 rounded-2xl mb-6 flex items-center gap-4"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(245,158,11,0.15)" }}>🎪</div>
          <div>
            <p className="text-white font-black text-base">{profile.first_name} {profile.last_name}</p>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-1"><MapPin size={11}/>{profile.city || "شهر ثبت نشده"}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 inline-block"
              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>{STATUS_LABEL[profile.status] || profile.status || "—"}</span>
          </div>
        </div>
      )}

      {profile && ["rejected", "needs_revision"].includes(profile.status) && profile.admin_note && (
        <div className="p-3 rounded-xl mb-6 text-sm leading-6"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {profile.admin_note}
        </div>
      )}

      <div className="space-y-4">
        {!profile && (
          <div className="grid grid-cols-2 gap-3">
            {[["نام", firstName, setFirstName], ["نام خانوادگی", lastName, setLastName]].map(([l,v,s]:any) => (
              <div key={l} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-slate-400 text-xs mb-2">{l}</p>
                <input value={v} onChange={(e:any) => s(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none" />
              </div>
            ))}
            <div className="p-4 rounded-2xl col-span-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-slate-400 text-xs mb-2">کد ملی *</p>
              <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} dir="ltr" placeholder="۱۲۳۴۵۶۷۸۹۰"
                className="w-full bg-transparent text-white text-sm outline-none" />
            </div>
          </div>
        )}

        {[
          { label:"شهر فعالیت", val:city, set:setCity, icon:MapPin },
          { label:"لینک نمونه‌کار", val:portfolioUrl, set:setPortfolioUrl, icon:LinkIcon },
        ].map(({ label, val, set, icon: Icon }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5"><Icon size={12}/>{label}</p>
            <input value={val} onChange={e => set(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
        ))}

        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5"><BookOpen size={12}/>معرفی و سابقه برگزاری رویداد</p>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className="w-full bg-transparent text-white text-sm outline-none resize-none"
            placeholder="کمی درباره خودتان و سابقه‌تان در برگزاری رویداد بنویسید..." />
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-slate-400 text-xs mb-3">حوزه‌های تخصصی</p>
          <div className="flex flex-wrap gap-2">
            {allDomains.map((d: string) => (
              <button key={d} onClick={() => setDomains(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d])}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: domains.includes(d) ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${domains.includes(d) ? "#f59e0b" : "rgba(255,255,255,0.08)"}`, color: domains.includes(d) ? "#f59e0b" : "#64748b" }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className="mt-4 p-3 rounded-xl"
          style={{ background: msg.type==="ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.type==="ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
          <p className="text-sm" style={{ color: msg.type==="ok" ? "#10b981" : "#ef4444" }}>{msg.text}</p>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full mt-5 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        ذخیره تغییرات
      </button>
    </div>
  );
}



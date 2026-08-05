"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Loader2, MapPin, Users, Coffee, Wifi, UserRound, ShieldCheck } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";

const STATUS_LABEL: Record<string, string> = {
  profile_incomplete: "پروفایل ناقص",
  pending_review: "در انتظار بررسی",
  approved: "تأیید شده",
  active: "فعال",
  rejected: "رد شده",
};

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:"ok"|"err"; text:string}|null>(null);
  const [options, setOptions] = useState<any>({});

  const [venueName, setVenueName]     = useState("");
  const [managerName, setManagerName] = useState("");
  const [venueType, setVenueType]     = useState("");
  const [address, setAddress]         = useState("");
  const [city, setCity]               = useState("");
  const [capacity, setCapacity]       = useState("");
  const [amenities, setAmenities]     = useState<string[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/venue/my-profile`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/venue/options`,    { headers: h }).then(r => r.ok ? r.json() : {}),
    ]).then(([p, o]) => {
      const prof = p.status === "fulfilled" ? p.value : null;
      setProfile(prof);
      setOptions(o.status === "fulfilled" ? o.value : {});
      if (prof) {
        setVenueName(prof.venue_name || "");
        setManagerName(prof.manager_name || "");
        setVenueType(prof.venue_type || "");
        setAddress(prof.address || "");
        setCity(prof.city || "");
        setCapacity(String(prof.capacity || ""));
        setAmenities(Array.isArray(prof.amenities) ? prof.amenities : JSON.parse(prof.amenities||"[]"));
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      const isNewProfile = !profile;
      const r = await fetch(`${API}/api/venue/${isNewProfile ? "register" : "my-profile"}`, {
        method: isNewProfile ? "POST" : "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify(isNewProfile
          ? { managerName, venueName, venueType, address, city, capacity: Number(capacity), amenities }
          : { manager_name: managerName, venue_name: venueName, venue_type: venueType, address, city, capacity: Number(capacity), amenities }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "خطا");
      setProfile((current: any) => current || { venue_name: venueName, manager_name: managerName, venue_type: venueType, address, city, capacity: Number(capacity), amenities, status: "profile_incomplete" });
      setMsg({ type: "ok", text: "اطلاعات ذخیره شد. اکنون درخواست تأیید را ارسال کنید." });
    } catch(e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>;

  return (
    <div dir="rtl" className="max-w-2xl">
      <h1 className="text-white text-xl font-black mb-1">اطلاعات فضا</h1>
      <p className="text-slate-500 text-sm mb-6">تنها محل ثبت و ویرایش مشخصات مجموعه، کافه یا فضای شما</p>

      {/* کارت خلاصه */}
      {profile && (
        <div className="p-4 rounded-2xl mb-6 flex items-center gap-4"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(34,197,94,0.15)" }}>🏠</div>
          <div>
            <p className="text-white font-black text-base">{profile.venue_name || "بدون نام"}</p>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-1"><MapPin size={11} />{profile.address || "آدرس ثبت نشده"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-500 text-xs flex items-center gap-1"><Users size={11} />{profile.capacity || "—"} نفر</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>{STATUS_LABEL[profile.status] || profile.status || "—"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {[
          { label: "نام مدیر مسئول",  val: managerName, set: setManagerName, icon: UserRound },
          { label: "نام مجموعه / فضا", val: venueName, set: setVenueName, icon: Coffee },
          { label: "آدرس کامل",        val: address,   set: setAddress,   icon: MapPin },
          { label: "شهر",              val: city,      set: setCity,       icon: MapPin },
          { label: "ظرفیت (نفر)",      val: capacity,  set: setCapacity,   icon: Users, type: "number" },
        ].map(({ label, val, set, icon: Icon, type }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5"><Icon size={12} />{label}</p>
            <input value={val} onChange={e => set(e.target.value)} type={type||"text"}
              className="w-full bg-transparent text-white text-sm outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
        ))}

        {/* نوع فضا */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-slate-400 text-xs mb-3">نوع فضا</p>
          <div className="flex flex-wrap gap-2">
            {(options.venue_types || []).map((t: string) => (
              <button key={t} onClick={() => setVenueType(t)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: venueType===t ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${venueType===t ? "#22c55e" : "rgba(255,255,255,0.08)"}`, color: venueType===t ? "#22c55e" : "#64748b" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* امکانات */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-slate-400 text-xs mb-3 flex items-center gap-1.5"><Wifi size={12} />امکانات موجود</p>
          <div className="flex flex-wrap gap-2">
            {(options.amenities || []).map((a: string) => (
              <button key={a} onClick={() => setAmenities(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a])}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: amenities.includes(a) ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${amenities.includes(a) ? "#22c55e" : "rgba(255,255,255,0.08)"}`, color: amenities.includes(a) ? "#22c55e" : "#64748b" }}>
                {a}
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

      <button onClick={handleSave} disabled={saving || !managerName || !venueName || !venueType || !address || !city || !capacity}
        className="w-full mt-5 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {profile ? "ذخیره تغییرات" : "ثبت اطلاعات فضا"}
      </button>

      {profile && profile.status !== "approved" && profile.status !== "active" && (
        <Link href="/panel/partner/verification"
          className="w-full mt-3 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
          <ShieldCheck size={15} /> ادامه و ارسال درخواست تأیید
        </Link>
      )}
    </div>
  );
}



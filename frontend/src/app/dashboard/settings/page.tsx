"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Settings, Bell, Shield, LogOut, Trash2, Eye, EyeOff, Check, Phone, User, Lock } from "lucide-react";

const API = "https://raaviiplatform.com";

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [section, setSection] = useState("account");
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    setName(state.user?.name || "");
  }, [state.user]);

  async function saveName() {
    const token = localStorage.getItem("token") || "";
    setSaving(true);
    await fetch(`${API}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function logout() {
    localStorage.clear();
    document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    dispatch?.({ type: "LOGOUT" } as any);
    router.replace("/login");
  }

  const SECTIONS = [
    { id: "account", label: "اطلاعات حساب", icon: User },
    { id: "notifications", label: "اعلان‌ها", icon: Bell },
    { id: "privacy", label: "حریم خصوصی", icon: Shield },
    { id: "security", label: "امنیت", icon: Lock },
  ];

  return (
    <div className="min-h-screen p-4 lg:p-6" dir="rtl"
      style={{ background: "linear-gradient(135deg,#060912,#0a0f1e)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.25)" }}>
            <Settings size={18} className="text-orange-400" />
          </div>
          <h1 className="text-slate-900 font-black text-lg">تنظیمات</h1>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: section===s.id ? "rgba(255,107,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${section===s.id ? "rgba(255,107,0,0.4)" : "rgba(255,255,255,0.07)"}`,
                  color: section===s.id ? "#FF6B00" : "#64748b",
                }}>
                <Icon size={12} /> {s.label}
              </button>
            );
          })}
        </div>

        {section === "account" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-slate-900 font-black text-sm mb-4">اطلاعات شخصی</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">نام و نام خانوادگی</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                    style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">شماره موبایل</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#64748b" }}>
                      {showPhone ? state.user?.mobileNumber : "••••••" + state.user?.mobileNumber?.slice(-4)}
                    </div>
                    <button onClick={() => setShowPhone(v => !v)} className="text-slate-500 hover:text-slate-800 p-2">
                      {showPhone ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <button onClick={saveName} disabled={saving}
                  className="w-full py-2.5 rounded-xl text-sm font-black text-slate-900 flex items-center justify-center gap-2"
                  style={{ background: saved ? "rgba(34,197,94,0.8)" : "linear-gradient(135deg,#FF6B00,#f97316)" }}>
                  {saved ? <><Check size={14}/> ذخیره شد</> : saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </div>

            <button onClick={logout}
              className="w-full p-4 rounded-2xl flex items-center gap-3 transition-all"
              style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
              <LogOut size={18} className="text-red-400" />
              <span className="text-red-400 font-bold text-sm">خروج از حساب</span>
            </button>
          </div>
        )}

        {section === "notifications" && (
          <div className="p-5 rounded-2xl space-y-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-slate-900 font-black text-sm mb-2">تنظیمات اعلان</h2>
            {[
              { key:"email", label:"اعلان پیامک", desc:"دریافت پیامک برای رویدادها و جلسات" },
              { key:"sms",   label:"اعلان داخل اپ", desc:"اعلان‌های داخل پلتفرم راوی" },
              { key:"push",  label:"یادآوری جلسه", desc:"یادآوری قبل از شروع جلسه" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background:"rgba(255,255,255,0.04)" }}>
                <div>
                  <p className="text-slate-900 text-sm font-bold">{n.label}</p>
                  <p className="text-slate-500 text-xs">{n.desc}</p>
                </div>
                <button onClick={() => setNotifs(v => ({ ...v, [n.key]: !v[n.key as keyof typeof v] }))}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: notifs[n.key as keyof typeof notifs] ? "#FF6B00" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ right: notifs[n.key as keyof typeof notifs] ? "0.125rem" : "calc(100% - 1.375rem)" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {section === "privacy" && (
          <div className="space-y-3">
            {[
              { title:"نمایش نتایج تست", desc:"نتایج تست‌ها برای روانشناس نمایش داده می‌شود", enabled:true },
              { title:"آنالیز ناشناس", desc:"داده‌های ناشناس برای بهبود الگوریتم استفاده می‌شود", enabled:true },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl flex items-center justify-between"
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <p className="text-slate-900 text-sm font-bold">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: item.enabled ? "#22c55e" : "#64748b" }} />
              </div>
            ))}
            <div className="p-4 rounded-2xl text-xs text-slate-500 leading-6"
              style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
              🔒 تمام داده‌های شما رمزگذاری و محرمانه نگهداری می‌شوند. راوی هرگز اطلاعات شخصی شما را به اشتراک نمی‌گذارد.
            </div>
          </div>
        )}

        {section === "security" && (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-slate-900 font-black text-sm mb-3">امنیت حساب</h2>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span>احراز هویت دومرحله‌ای</span>
                  <span className="text-yellow-400 text-xs font-bold">به زودی</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span>آخرین ورود</span>
                  <span className="text-slate-500 text-xs">{new Date().toLocaleDateString("fa-IR")}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>دستگاه‌های فعال</span>
                  <span className="text-slate-500 text-xs">۱ دستگاه</span>
                </div>
              </div>
            </div>
            <button className="w-full p-4 rounded-2xl flex items-center gap-3 text-red-400"
              style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)" }}>
              <Trash2 size={16}/>
              <div className="text-right">
                <p className="font-bold text-sm">حذف حساب</p>
                <p className="text-xs text-red-400/60">تمام داده‌ها پاک می‌شوند</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

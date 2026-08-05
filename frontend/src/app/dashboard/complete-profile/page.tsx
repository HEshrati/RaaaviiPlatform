"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { fetchUserProfile, updateUserProfile } from "@/lib/api";

const IRANIAN_CITIES = [
  "تهران","اصفهان","شیراز","تبریز","مشهد","اهواز","کرمانشاه","ارومیه",
  "رشت","کرج","زاهدان","همدان","کرمان","یزد","اردبیل","بندرعباس","قم",
  "خرم‌آباد","سنندج","گرگان","بوشهر","ایلام","بیرجند","سمنان","زنجان",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function getToken() {
  return getCookie("token") || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
}

export default function CompleteProfilePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<"bio" | "city" | "done">("bio");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    if (!state.isLoggedIn) return;
    fetchUserProfile().then((p) => {
      if (p.bio) setBio(p.bio);
      if (p.city) setCity(p.city);
    }).catch(() => {});
  }, [state.isLoggedIn]);

  const filteredCities = IRANIAN_CITIES.filter((c) =>
    c.includes(citySearch) || citySearch === ""
  );

  async function saveBioCity() {
    setLoading(true); setError("");
    try {
      const updated = await updateUserProfile({ bio, city });
      // آپدیت state تا ProfileGuard دیگه redirect نکنه
      if (dispatch && state.user) {
        dispatch({ type: "SET_USER", payload: { ...state.user, ...updated, city } });
        dispatch({ type: "SET_CITY", payload: city });
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("profile_completed", "1");
        // آپدیت user در localStorage
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...u, city, bio }));
        localStorage.setItem("city", city);
      }
      document.cookie = "profile_completed=1; path=/; max-age=31536000; SameSite=Lax";
      setStep("done");
    } catch { setError("خطا در ذخیره‌سازی. دوباره تلاش کنید."); }
    finally { setLoading(false); }
  }



  const stepIdx = ["bio","city","done"].indexOf(step);
  const progress = Math.round((stepIdx / 3) * 100);

  if (step === "done") return (
    <div style={S.page} dir="rtl">
      <div style={S.doneWrap}>
        <div style={S.doneIcon}>&#10003;</div>
        <h1 style={{margin:0,fontSize:22}}>پروفایل تکمیل شد!</h1>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,margin:0}}>اطلاعاتت ذخیره شد.</p>
        <button style={S.btnPrimary} onClick={() => router.push("/events")}>بزن بریم به رویدادها 🚀</button>
      </div>
    </div>
  );

  return (
    <div style={S.page} dir="rtl">
      <div style={S.header}>
        <button style={S.closeBtn} onClick={() => router.push("/dashboard")}>&#10005;</button>
        <span style={{fontSize:15,fontWeight:600}}>تکمیل پروفایل</span>
        <div style={{width:32}} />
      </div>

      <div style={S.progressTrack}>
        <div style={{...S.progressFill, width: progress + "%"}} />
      </div>

      <div style={S.stepLabels}>
        {(["بیوگرافی","شهر","موبایل"] as const).map((label, i) => (
          <span key={i} style={{...S.stepLabel,
            color: stepIdx > i ? "#4CAF50" : stepIdx === i ? "#E67B2E" : "rgba(255,255,255,0.3)"
          }}>
            <span style={{...S.stepDot,
              background: stepIdx > i ? "#4CAF50" : stepIdx === i ? "#E67B2E" : "rgba(255,255,255,0.08)",
              color: stepIdx >= i ? "#fff" : "rgba(255,255,255,0.4)"
            }}>{stepIdx > i ? "✓" : i + 1}</span>
            {label}
          </span>
        ))}
      </div>

      <div style={S.body}>
        <div style={S.card}>

          {step === "bio" && (
            <div style={S.fieldBlock}>
              <label style={S.fieldLabel}>
                <span style={S.labelNum}>&#x06F1;</span>
                درباره خودت بنویس
              </label>
              <textarea
                style={S.textarea}
                placeholder="چند جمله کوتاه درباره خودت، علایق یا هدفت..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                autoFocus
              />
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"left"}}>{bio.length} / 300</div>
              <button style={{...S.btnPrimary,...(bio.trim().length<10?S.btnDisabled:{})}} onClick={() => bio.trim().length>=10 && setStep("city")} disabled={bio.trim().length<10}>
                ادامه
              </button>
            </div>
          )}

          {step === "city" && (
            <div style={S.fieldBlock}>
              <div style={{opacity:0.55,paddingBottom:16,borderBottom:"1px solid rgba(255,255,255,0.07)",marginBottom:4}}>
                <label style={S.fieldLabel}><span style={S.labelNum}>&#x06F1;</span> درباره خودت</label>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px",margin:"8px 0 0",lineHeight:1.6}}>
                  {bio.slice(0,70)}{bio.length>70?"...":""}
                </p>
              </div>
              <label style={S.fieldLabel}>
                <span style={S.labelNum}>&#x06F2;</span>
                شهرت رو انتخاب کن
              </label>
              <input style={S.input} placeholder="جستجوی شهر..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
              <div style={S.cityGrid}>
                {filteredCities.map((c) => (
                  <button key={c} style={{...S.cityChip,...(city===c?S.cityChipSel:{})}} onClick={() => setCity(c)}>{c}</button>
                ))}
              </div>
              {error && <p style={S.errorMsg}>{error}</p>}
              <button style={{...S.btnPrimary,...(!city||loading?S.btnDisabled:{})}} onClick={saveBioCity} disabled={!city||loading}>
                {loading ? "در حال ذخیره..." : "ذخیره و ادامه"}
              </button>
              <button style={S.btnSkip} onClick={() => setStep("done")}>رد کردن شهر</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const S: Record<string,React.CSSProperties> = {
  page: { minHeight:"100vh", background:"#0e1320", fontFamily:"'Vazirmatn','Vazir',sans-serif", color:"#f0f0f0", display:"flex", flexDirection:"column" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.07)" },
  closeBtn: { background:"rgba(255,255,255,0.08)", border:"none", color:"#aaa", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  progressTrack: { height:3, background:"rgba(255,255,255,0.08)" },
  progressFill: { height:"100%", background:"linear-gradient(90deg,#E67B2E,#f59c4e)", transition:"width 0.5s ease" },
  stepLabels: { display:"flex", justifyContent:"center", gap:"2rem", padding:"1rem 1.25rem 0" },
  stepLabel: { display:"flex", alignItems:"center", gap:6, fontSize:12, transition:"color 0.3s" },
  stepDot: { width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0, transition:"background 0.3s" },
  body: { flex:1, padding:"1.5rem 1.25rem", maxWidth:520, width:"100%", margin:"0 auto", boxSizing:"border-box" as any },
  card: { background:"#1a2236", borderRadius:16, padding:"1.5rem", border:"1px solid rgba(255,255,255,0.07)" },
  fieldBlock: { display:"flex", flexDirection:"column", gap:12 },
  fieldLabel: { display:"flex", alignItems:"center", gap:8, fontSize:15, fontWeight:600, color:"#f0f0f0" },
  labelNum: { width:24, height:24, borderRadius:"50%", background:"rgba(230,123,46,0.2)", color:"#E67B2E", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 },
  textarea: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#f0f0f0", fontFamily:"inherit", fontSize:14, lineHeight:1.7, padding:12, resize:"none" as any, width:"100%", boxSizing:"border-box" as any, outline:"none" },
  input: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#f0f0f0", fontFamily:"inherit", fontSize:14, padding:"10px 14px", width:"100%", boxSizing:"border-box" as any, outline:"none" },
  cityGrid: { display:"flex", flexWrap:"wrap" as any, gap:8, maxHeight:200, overflowY:"auto" as any, padding:"4px 0" },
  cityChip: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, color:"rgba(255,255,255,0.7)", fontFamily:"inherit", fontSize:13, padding:"5px 14px", cursor:"pointer", whiteSpace:"nowrap" as any },
  cityChipSel: { background:"rgba(230,123,46,0.2)", border:"1px solid #E67B2E", color:"#E67B2E", fontWeight:600 },
  btnPrimary: { background:"#E67B2E", border:"none", borderRadius:10, color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:600, padding:"12px 24px", width:"100%", marginTop:4 },
  btnDisabled: { opacity:0.4, cursor:"not-allowed" },
  btnSkip: { background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"inherit", fontSize:13, padding:9, width:"100%" },
  errorMsg: { color:"#ff6b6b", fontSize:13, margin:0, textAlign:"center" as any },
  doneWrap: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:"1rem", padding:"2rem", textAlign:"center" as any },
  doneIcon: { width:72, height:72, borderRadius:"50%", background:"rgba(76,175,80,0.2)", color:"#4CAF50", fontSize:32, display:"flex", alignItems:"center", justifyContent:"center" },
};

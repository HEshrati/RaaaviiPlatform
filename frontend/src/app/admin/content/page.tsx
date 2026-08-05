"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isAdminPhone } from "@/lib/api";
import {
  Sparkles, CheckCircle2, XCircle, Eye, Clock,
  Edit3, ArrowRight, RefreshCw, FileText, Plus,
  Tag, BookOpen, Sliders, Hash, AlignLeft, Image as ImageIcon
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
function token() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }

const TOPICS = [
  "ارتباط موثر","سبک‌های دلبستگی","هوش هیجانی","مرزهای سالم در رابطه",
  "گوش دادن فعال","زبان عشق","مقابله با تنهایی","اضطراب اجتماعی",
  "رشد پس از تروما","ذهن‌آگاهی در روابط","خودآگاهی هیجانی","نیازهای عاطفی",
  "افسردگی و درمان","بهبود عزت نفس","مهارت‌های ارتباطی",
];

const WORD_COUNT_PRESETS = [
  { label: "کوتاه", value: 400, desc: "۴۰۰ کلمه" },
  { label: "متوسط", value: 800, desc: "۸۰۰ کلمه" },
  { label: "بلند", value: 1500, desc: "۱۵۰۰ کلمه" },
  { label: "جامع", value: 2500, desc: "۲۵۰۰ کلمه" },
];

export default function AdminContentPage() {
  const { state } = useApp();
  const router = useRouter();
  const isAdmin = isAdminPhone(state.user?.mobileNumber);

  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(800);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!state.isLoading && (!state.isLoggedIn || !isAdmin)) router.replace("/dashboard");
  }, [state.isLoggedIn, state.isLoading, isAdmin]);

  useEffect(() => { loadDrafts(); }, []);

  async function loadDrafts() {
    const r = await fetch(`${API}/api/content/admin/drafts`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (r.ok) setDrafts(await r.json());
  }

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true); setGenResult(null); setGenError("");
    try {
      const keywords = keywordsInput.split(/[,،\n]+/)
        .map(k => k.trim()).filter(Boolean);
      const r = await fetch(`${API}/api/content/admin/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ topic, wordCount, keywords, image_url: imageUrl || undefined }),
      });
      const data = await r.json();
      if (r.ok) { setGenResult(data); loadDrafts(); }
      else setGenError(data.message || "خطا در تولید");
    } catch (e: any) {
      setGenError(e.message);
    } finally { setGenerating(false); }
  }

  async function approve(id: string) {
    await fetch(`${API}/api/content/admin/approve/${id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}` },
    });
    loadDrafts();
  }

  async function reject(id: string) {
    await fetch(`${API}/api/content/admin/reject/${id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}` },
    });
    loadDrafts();
  }

  const pendingDrafts = drafts.filter(d => d.status === "draft");
  const publishedDrafts = drafts.filter(d => d.status === "published").slice(0, 5);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
        <FileText className="text-orange-400" size={22} />
        مدیریت محتوای هوشمند
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Generator Panel ── */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-black text-white text-sm mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-orange-400" /> ساخت مقاله با AI
          </h2>

          {/* Topic */}
          <label className="text-slate-400 text-xs mb-1 block">موضوع مقاله *</label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="مثال: اضطراب اجتماعی و درمان"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none mb-1"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          {/* Topic presets */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className={`text-[10px] px-2 py-1 rounded-lg transition-all font-bold ${
                  topic === t
                    ? "bg-orange-500 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                style={topic === t ? {} : { background: "rgba(255,255,255,0.05)" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Word Count */}
          <label className="text-slate-400 text-xs mb-2 flex items-center gap-1 block">
            <AlignLeft size={11} /> تعداد کلمات: <strong className="text-orange-400">{wordCount.toLocaleString("fa-IR")}</strong>
          </label>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {WORD_COUNT_PRESETS.map(p => (
              <button key={p.value} onClick={() => setWordCount(p.value)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  wordCount === p.value ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
                style={wordCount === p.value ? {} : { background: "rgba(255,255,255,0.05)" }}>
                <div>{p.label}</div>
                <div className="text-[9px] opacity-70">{p.desc}</div>
              </button>
            ))}
          </div>
          {/* Custom slider */}
          <input type="range" min="200" max="3000" step="100"
            value={wordCount} onChange={e => setWordCount(Number(e.target.value))}
            className="w-full mb-4 accent-orange-500" />

          {/* Keywords */}
          <label className="text-slate-400 text-xs mb-1 flex items-center gap-1 block">
            <Hash size={11} /> کلمات کلیدی (اختیاری — با کاما جدا کن)
          </label>
          <textarea
            value={keywordsInput}
            onChange={e => setKeywordsInput(e.target.value)}
            placeholder="مثال: اضطراب، درمان شناختی، ترس اجتماعی"
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none resize-none mb-4"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />

          <label className="text-slate-400 text-xs mb-1 flex items-center gap-1 block">
            <ImageIcon size={11}/> آدرس تصویر مقاله (اختیاری)
          </label>
          <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none mb-4"
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}/>
          <button onClick={generate} disabled={!topic.trim() || generating}
            className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              generating || !topic.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
            style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", color: "white" }}>
            {generating
              ? <><RefreshCw size={14} className="animate-spin" /> در حال تولید ({wordCount} کلمه)...</>
              : <><Sparkles size={14} /> تولید مقاله با AI</>}
          </button>

          {/* Result */}
          {genResult && (
            <div className="mt-3 p-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-green-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> مقاله ساخته شد (پیش‌نویس)
              </p>
              <p className="text-slate-300 text-xs mt-1 font-bold">{genResult.title}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{genResult.summary?.slice(0,80)}...</p>
            </div>
          )}
          {genError && (
            <div className="mt-3 p-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-xs">{genError}</p>
            </div>
          )}
        </div>

        {/* ── Drafts Panel ── */}
        <div className="space-y-4">
          {/* Pending */}
          <div className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="font-black text-white text-sm mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-yellow-400" /> پیش‌نویس‌های منتظر
              </span>
              <span className="text-yellow-400 text-xs font-black">{pendingDrafts.length}</span>
            </h2>
            {pendingDrafts.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-4">پیش‌نویسی وجود ندارد</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pendingDrafts.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-white text-xs font-bold mb-1 line-clamp-1">{d.title}</p>
                    <p className="text-slate-500 text-[10px] mb-2 line-clamp-2">{d.summary}</p>
                    <div className="flex gap-2">
                      <button onClick={() => approve(d.id)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-green-400 flex items-center justify-center gap-1"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <CheckCircle2 size={10} /> تأیید
                      </button>
                      <button onClick={() => reject(d.id)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-red-400 flex items-center justify-center gap-1"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <XCircle size={10} /> رد
                      </button>
                      <a href={`/articles/${d.id}`} target="_blank"
                        className="py-1.5 px-2 rounded-lg text-[10px] font-black text-blue-400 flex items-center gap-1"
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <Eye size={10} /> پیش‌نمایش
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published */}
          <div className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="font-black text-white text-sm mb-3 flex items-center gap-2">
              <BookOpen size={14} className="text-green-400" /> آخرین منتشرشده‌ها
            </h2>
            {publishedDrafts.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-4">مقاله منتشرشده‌ای وجود ندارد</p>
            ) : (
              <div className="space-y-2">
                {publishedDrafts.map((d: any) => (
                  <a key={d.id} href={`/articles/${d.id}`} target="_blank"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold line-clamp-1 group-hover:text-orange-300 transition-colors">
                        {d.title}
                      </p>
                      <p className="text-slate-600 text-[10px]">منتشرشده</p>
                    </div>
                    <ArrowRight size={12} className="text-slate-700 mr-auto flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

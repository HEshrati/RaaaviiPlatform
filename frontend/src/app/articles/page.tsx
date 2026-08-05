"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Clock, Cpu, Heart, Sparkles, Leaf, Zap,
  Star, Shield, Sun, Search, ArrowLeft, Flame, Calendar,
  RefreshCw, Lightbulb, Lock, HeartPulse
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import { getArticleImage } from "@/lib/articleImage";

const CORE_TESTS = [
  "raavi_matching_basis_v1", "neo_ffi", "ecr_r", "erq", "iri"
];
const SITE = "https://raaviiplatform.com";

const CAT_STYLE: Record<string, { color:string; bg:string; icon:any }> = {
  "روانشناسی مثبت": { color:"#22c55e", bg:"#f0fdf4", icon:Sparkles },
  "مدیریت استرس":   { color:"#FF6B00", bg:"#fff7ed", icon:Shield },
  "روابط سالم":     { color:"#f97316", bg:"#fff7ed", icon:Heart },
  "خودشناسی":       { color:"#eab308", bg:"#fefce8", icon:Star },
  "بهداشت روان":    { color:"#a855f7", bg:"#faf5ff", icon:Cpu },
  "رشد فردی":       { color:"#ec4899", bg:"#fdf2f8", icon:Zap },
  "هوش هیجانی":     { color:"#0ea5e9", bg:"#f0f9ff", icon:Sun },
  "ذهن‌آگاهی":      { color:"#10b981", bg:"#ecfdf5", icon:Leaf },
  "درون‌گرایی":      { color:"#6366f1", bg:"#eef2ff", icon:Lightbulb },
  "سبک دلبستگی":    { color:"#f43f5e", bg:"#fff1f2", icon:HeartPulse },
};

function getCoreTestsDone(results: any[]): number {
  const done = new Set(results.map((r:any) => r.test_name));
  return CORE_TESTS.filter(id => done.has(id)).length;
}

function getRecPrecision(coreCount: number): "none"|"low"|"medium"|"high"|"full" {
  if (coreCount === 0) return "none";
  if (coreCount === 1) return "low";
  if (coreCount === 2) return "medium";
  if (coreCount <= 4) return "high";
  return "full";
}

function getRecommendedCats(testResults: any[]): string[] {
  const cats = new Set<string>();
  testResults.forEach((r: any) => {
    const s = r.scores || {};
    const id = (r.test_name || "").toLowerCase();
    if (id.includes("neo")) {
      if ((s.N||0) > 18) { cats.add("مدیریت استرس"); cats.add("بهداشت روان"); }
      if ((s.A||0) < 14) cats.add("روابط سالم");
      if ((s.O||0) > 20) cats.add("رشد فردی");
      if ((s.E||0) < 12) cats.add("خودشناسی");
    }
    if (id.includes("ecr")) {
      if ((s.ANX||0) > 38) { cats.add("مدیریت استرس"); cats.add("روانشناسی مثبت"); }
      if ((s.AVO||0) > 38) { cats.add("روابط سالم"); cats.add("خودشناسی"); }
      if ((s.ANX||0) <= 27 && (s.AVO||0) <= 27) cats.add("روانشناسی مثبت");
    }
    if (id.includes("erq")) {
      if ((s.ES||0) > 18) cats.add("هوش هیجانی");
      if ((s.CR||0) > 20) cats.add("ذهن‌آگاهی");
    }
    if (id.includes("iri")) {
      if ((s.EC||0) < 12) cats.add("هوش هیجانی");
      if ((s.PT||0) > 18) cats.add("روابط سالم");
    }
    if (id.includes("mbti") || id.includes("matching")) {
      const mbti = (r.main_result || "").toUpperCase();
      if (mbti.includes("N")) cats.add("رشد فردی");
      if (mbti.includes("F")) cats.add("روابط سالم");
      if (mbti.includes("I")) cats.add("خودشناسی");
      if (mbti.includes("P")) cats.add("ذهن‌آگاهی");
    }
  });
  if (cats.size === 0 && testResults.length > 0) {
    cats.add("رشد فردی"); cats.add("خودشناسی");
  }
  return [...cats];
}

function isToday(d: string) {
  const now = new Date(); const date = new Date(d);
  return date.getFullYear()===now.getFullYear() &&
    date.getMonth()===now.getMonth() && date.getDate()===now.getDate();
}
function isThisWeek(d: string) {
  return (new Date().getTime()-new Date(d).getTime()) < 7*24*3600*1000;
}

function ArticleCard({ article, index }: { article: any; index: number }) {
  const cat = CAT_STYLE[article.category] || { color:"#FF6B00", bg:"#fff7ed", icon:BookOpen };
  const Icon = cat.icon;
  const today = isToday(article.created_at||article.createdAt||"");
  const week = isThisWeek(article.created_at||article.createdAt||"");
  const dateStr = article.created_at || article.createdAt
    ? new Date(article.created_at||article.createdAt).toLocaleDateString("fa-IR",{month:"short",day:"numeric"})
    : "";

  return (
    <Link href={`/articles/${article.id||article.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background:"white",
        border:`1.5px solid ${today?cat.color+"50":"rgba(0,0,0,0.07)"}`,
        boxShadow: today?`0 4px 20px ${cat.color}18`:"0 2px 8px rgba(0,0,0,0.04)",
      }}>
      <div className="h-1" style={{background:`linear-gradient(90deg,${cat.color},${cat.color}70)`}}/>
      <div className="relative w-full h-40 overflow-hidden bg-slate-100">
        <img src={getArticleImage(article, index)} alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%)"}}/>
        {article.category && (
          <span className="absolute bottom-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full" style={{background:cat.color, color:"white"}}>
            <Icon size={9} className="inline ml-1"/>{article.category}
          </span>
        )}
        {today && (
          <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white flex items-center gap-0.5"
            style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
            <Flame size={8}/>جدید
          </span>
        )}
        {!today && week && (
          <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{background:"rgba(255,255,255,0.9)",color:"#f97316"}}>
            این هفته
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-black text-slate-900 text-sm leading-relaxed mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">{article.title}</h3>
        {article.summary && <p className="text-slate-500 text-xs leading-6 line-clamp-2 mb-3">{article.summary}</p>}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9}/>{article.read_time||5} دقیقه</span>
          {dateStr && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar size={8}/>{dateStr}</span>}
        </div>
      </div>
    </Link>
  );
}

type TabType = "all" | "new" | "recommended";

export default function ArticlesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, _setTab] = useState<TabType>(
    searchParams?.get("tab") === "recommended" ? "recommended" :
    searchParams?.get("tab") === "new" ? "new" : "all"
  );
  const [testResults, setTestResults] = useState<any[]>([]);
  const [hasTests, setHasTests] = useState(false);
  const [recCats, setRecCats] = useState<string[]>([]);
  const [coreCount, setCoreCount] = useState(0);
  const [precision, setPrecision] = useState<"none"|"low"|"medium"|"high"|"full">("none");

  const setTab = (t: TabType) => {
    _setTab(t);
    const url = t === "all" ? "/articles" : `/articles?tab=${t}`;
    router.replace(url, { scroll: false });
  };

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "recommended" || tabParam === "new" || tabParam === "all") {
      _setTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const ch = new BroadcastChannel("raavi_test_done");
      ch.onmessage = () => {
        const tok = localStorage.getItem("token")||"";
        fetch("https://raaviiplatform.com/api/intelligence/sync",{method:"POST",headers:{Authorization:`Bearer ${tok}`}}).catch(()=>{});
        fetch("https://raaviiplatform.com/api/test-results/my",{headers:{Authorization:`Bearer ${tok}`}})
          .then(r=>r.ok?r.json():{}).then(d=>{
            const results=(d as any)?.results||(d as any)?.data||[];
            const CAT_MAP:any={neo_ffi:["رشد فردی","روانشناسی مثبت"],ecr_r:["روابط سالم","خودشناسی"],erq:["هوش هیجانی","مدیریت استرس"],iri:["هوش هیجانی","روابط سالم"],gottman:["روابط سالم"],phq9:["بهداشت روان"],gad7:["بهداشت روان","مدیریت استرس"]};
            const cats:string[]=[];
            results.forEach((r:any)=>{const c=CAT_MAP[r.test_name]||[];cats.push(...c);});
            if(cats.length) setRecCats([...new Set(cats)] as string[]);
          }).catch(()=>{});
      };
      return () => ch.close();
    } catch {}
  }, []);

  useEffect(() => {
    fetch(`${SITE}/api/content/articles?limit=1000`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = Array.isArray(d)?d:(d?.articles||d?.data||[]);
        list.sort((a:any,b:any) => new Date(b.created_at||b.createdAt||0).getTime() - new Date(a.created_at||a.createdAt||0).getTime());
        setArticles(list);
      }).catch(()=>{}).finally(()=>setLoading(false));

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${SITE}/api/test-results/my`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():{}).then(d=>{
          const results = (d as any)?.results||(d as any)?.data||[];
          if (results.length > 0) {
            setTestResults(results); setHasTests(true);
            const cc = getCoreTestsDone(results); setCoreCount(cc);
            setPrecision(getRecPrecision(cc)); setRecCats(getRecommendedCats(results));
          }
        }).catch(()=>{});

      // پیشنهاد مقاله بر اساس RGCI
      fetch(`${SITE}/api/rgci/article-recommendations`, { headers:{Authorization:`Bearer ${token}`} })
        .then(r=>r.ok?r.json():null)
        .then(d=>{
          if(d?.articles?.length > 0) {
            const rgciCats = d.articles.map((a:any) => a.category).filter(Boolean);
            if(rgciCats.length > 0) setRecCats((prev:string[]) => [...new Set([...prev, ...rgciCats])]);
          }
        }).catch(()=>{});
    }
  }, []);

  const newArticles = useMemo(() => articles.filter(a => isThisWeek(a.created_at||a.createdAt||"")), [articles]);
  const recommendedArticles = useMemo(() => recCats.length > 0 ? articles.filter(a => recCats.includes(a.category)) : [], [articles, recCats]);

  const displayList = useMemo(() => {
    let list = tab==="all" ? articles : tab==="new" ? newArticles : recommendedArticles;
    if (search) list = list.filter(a => a.title?.includes(search) || a.summary?.includes(search));
    return list;
  }, [tab, articles, newArticles, recommendedArticles, search]);

  const today = new Date().toLocaleDateString("fa-IR",{weekday:"long",month:"long",day:"numeric"});
  const todayCount = articles.filter(a=>isToday(a.created_at||a.createdAt||"")).length;

  const tabs = [
    { id:"all" as TabType, label:"همه", icon:BookOpen, count:articles.length },
    { id:"new" as TabType, label:"مقالات جدید", icon:Flame, count:newArticles.length },
    { id:"recommended" as TabType, label:"پیشنهادات راوی", icon:Sparkles, count:recommendedArticles.length, needsTest:true },
  ];

  return (
    <div className="min-h-screen" style={{background:"#f8fafc"}} dir="rtl">
      <PublicNavbar/>
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-7">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(255,107,0,0.1)"}}>
                  <BookOpen size={18} className="text-orange-500"/>
                </div>
                <h1 className="text-2xl font-black text-slate-900">کتابخانه راوی</h1>
              </div>
              <p className="text-slate-500 text-sm">مقالات تخصصی روانشناسی و رشد فردی</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100">
              <Calendar size={13} className="text-orange-500"/>
              <span className="text-orange-700 text-xs font-bold">{today}</span>
              {todayCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>{todayCount} جدید امروز</span>}
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو در مقالات..." className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm text-slate-900 outline-none" style={{background:"#f8fafc",border:"1.5px solid rgba(0,0,0,0.08)"}}/>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tabs.map(t => {
            const Icon = t.icon; const active = tab === t.id; const locked = t.needsTest && !hasTests;
            return (
              <button key={t.id} onClick={() => !locked && setTab(t.id)}
                className={`rounded-2xl p-4 text-right transition-all ${locked?"cursor-default opacity-70":""}`}
                style={{background:active?"white":"rgba(255,255,255,0.6)",border:`2px solid ${active?"#FF6B00":"rgba(0,0,0,0.07)"}`,boxShadow:active?"0 4px 16px rgba(255,107,0,0.15)":"none"}}>
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:active?"rgba(255,107,0,0.12)":"rgba(0,0,0,0.05)"}}>
                    {locked?<Lock size={14} className="text-slate-400"/>:<Icon size={15} style={{color:active?"#FF6B00":"#64748b"}}/>}
                  </div>
                  {!locked && <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{background:active?"rgba(255,107,0,0.12)":"rgba(0,0,0,0.05)",color:active?"#FF6B00":"#64748b"}}>{t.count}</span>}
                </div>
                <p className="font-black text-xs" style={{color:active?"#FF6B00":"#475569"}}>{t.label}</p>
                {locked && <p className="text-[9px] text-slate-400 mt-0.5">ابتدا تست بده</p>}
              </button>
            );
          })}
        </div>

        {tab === "recommended" && precision === "none" ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{background:"rgba(255,107,0,0.08)"}}><Lock size={28} className="text-orange-300"/></div>
            <h3 className="text-slate-900 font-black text-base mb-2">برای مشاهده پیشنهادات تست بده</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto mb-2">الگوریتم پیشنهاد راوی برای کار نیاز به نتایج تست‌های اصلی داره.</p>
            <div className="flex justify-center gap-1.5 mb-5">{CORE_TESTS.map((_,i)=><div key={i} className="w-8 h-2 rounded-full bg-slate-100"/>)}</div>
            <Link href="/dashboard/tests" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}><Cpu size={14}/> شروع ۵ تست اصلی</Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><RefreshCw size={24} className="text-orange-400 animate-spin"/></div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">{search?"مقاله‌ای با این عنوان یافت نشد":"مقاله‌ای موجود نیست"}</div>
        ) : (
          <>
            {tab==="recommended" && precision !== "none" && (
              <div className="mb-5">
                <div className="p-4 rounded-2xl mb-4 bg-white border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700 font-black text-xs flex items-center gap-1.5"><Sparkles size={12} className="text-orange-500"/> دقت پیشنهادات</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:precision==="full"?"#f0fdf4":precision==="high"?"#fff7ed":"#fef9c3",color:precision==="full"?"#16a34a":precision==="high"?"#FF6B00":"#ca8a04"}}>{precision==="full"?"کامل ✅":precision==="high"?"خوب":precision==="medium"?"متوسط":"پایه"}</span>
                  </div>
                  <div className="flex gap-2 items-center mb-2">
                    {CORE_TESTS.map((id,i)=>{const done=i<coreCount;return(<div key={id} className="flex-1 flex flex-col items-center gap-1"><div className="w-full h-2 rounded-full transition-all duration-500" style={{background:done?"linear-gradient(90deg,#FF6B00,#f97316)":"rgba(0,0,0,0.08)"}}/><span className="text-[8px] font-bold" style={{color:done?"#f97316":"#cbd5e1"}}>{["MBTI","NEO","ECR","ERQ","IRI"][i]}</span></div>);})}
                  </div>
                  <p className="text-[10px] text-slate-400">{coreCount} از ۵ تست اصلی — {precision==="full"?"پیشنهادات کاملاً شخصی‌سازی‌شده ✅":precision==="high"?"پیشنهادات با دقت بالا":precision==="medium"?"پیشنهادات متوسط":"پیشنهادات پایه"}</p>
                  {coreCount<5&&<Link href="/dashboard/tests" className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-orange-500">تکمیل تست‌ها ←</Link>}
                </div>
                {recCats.length>0&&(<div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 mb-4"><Sparkles size={13} className="text-orange-500 mt-0.5 flex-shrink-0"/><p className="text-orange-700 text-xs leading-relaxed">بر اساس نتایج تست‌هات:{recCats.map((cat,i)=><span key={cat} className="font-black"> {cat}{i<recCats.length-1?",":""}</span>)}</p></div>)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {displayList.map((a,i)=><ArticleCard key={a.id||i} article={a} index={i}/>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

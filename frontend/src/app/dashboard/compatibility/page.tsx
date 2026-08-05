"use client";
import TestResultVisualization from "@/components/TestResultVisualization";
export const dynamic = "force-dynamic";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Brain, RefreshCw, Cpu, Heart, Sparkles, ChevronLeft, Award, Lock, CheckCircle2, TrendingUp, Star, HeartCrack, Scale, Handshake, HeartHandshake, Diamond, Zap, Leaf, Frown, BarChart2, CircleDot, Moon, Microscope, Sprout, CloudRain, Shield, Glasses, ClipboardList } from "lucide-react";
import { getTestProfileScore, normalizeTestScores } from "@/lib/test-result-scoring";

const API = "https://raaviiplatform.com";
const CORE = ["neo_ffi","ecr_r","erq","iri","gottman"];
const MANDATORY = "raavi_matching_basis_v1";

// زیر-بعدهای هر بُعد اصلی
const SUB_DIMS: Record<string, {label:string;desc:string}[]> = {
  "دلبستگی": [
    {label:"اضطراب",desc:"نگرانی از طرد شدن"},
    {label:"اجتناب",desc:"فاصله در روابط"},
    {label:"ایمنی",desc:"آرامش در نزدیکی"},
    {label:"اعتماد",desc:"تکیه به دیگران"},
    {label:"پیوند",desc:"عمق روابط"},
  ],
  "شخصیت": [
    {label:"برون‌گرایی",desc:"انرژی اجتماعی"},
    {label:"توافق",desc:"همکاری و مهربانی"},
    {label:"وظیفه",desc:"نظم و مسئولیت"},
    {label:"روان‌رنجوری",desc:"ثبات هیجانی"},
    {label:"گشودگی",desc:"خلاقیت و کنجکاوی"},
  ],
  "هیجان": [
    {label:"بازارزیابی",desc:"تفسیر مجدد"},
    {label:"سرکوب",desc:"پنهان‌کردن"},
    {label:"آگاهی",desc:"شناخت هیجان"},
    {label:"مقابله",desc:"مدیریت استرس"},
    {label:"تنظیم",desc:"کنترل هیجان"},
  ],
  "همدلی": [
    {label:"عاطفی",desc:"احساس با دیگران"},
    {label:"شناختی",desc:"درک دیدگاه"},
    {label:"خیال",desc:"تجربه‌پذیری"},
    {label:"نگرانی",desc:"دلسوزی فعال"},
    {label:"پریشانی",desc:"واکنش شخصی"},
  ],
  "گاتمان": [
    {label:"انتقاد",desc:"نقد شخصیت"},
    {label:"تحقیر",desc:"بی‌احترامی"},
    {label:"دفاعی",desc:"مقاومت"},
    {label:"سنگ",desc:"سکوت"},
    {label:"مثبت",desc:"تعاملات خوب"},
  ],
};


// رنگ هر تست
const TEST_META: Record<string,{name:string;icon:any;color:string;core:boolean}> = {
  raavi_matching_basis_v1:{name:"تیپ MBTI",icon:Cpu,color:"#FF6B00",core:false},
  neo_ffi:{name:"پنج عامل NEO",icon:Star,color:"#a855f7",core:true},
  ecr_r:{name:"دلبستگی ECR",icon:HeartCrack,color:"#ef4444",core:true},
  erq:{name:"تنظیم هیجان",icon:Scale,color:"#22c55e",core:true},
  iri:{name:"همدلی IRI",icon:Handshake,color:"#0ea5e9",core:true},
  gottman:{name:"الگوی گاتمان",icon:HeartHandshake,color:"#f97316",core:true},
  hexaco:{name:"HEXACO",icon:Diamond,color:"#6366f1",core:false},
  love_languages:{name:"زبان محبت",icon:Heart,color:"#ec4899",core:false},
  conflict_style:{name:"سبک تعارض",icon:Zap,color:"#eab308",core:false},
  phq9:{name:"PHQ-9",icon:Leaf,color:"#22c55e",core:false},
  gad7:{name:"GAD-7",icon:Frown,color:"#eab308",core:false},
  dass21:{name:"DASS-21",icon:BarChart2,color:"#6366f1",core:false},
  bai:{name:"BAI",icon:CircleDot,color:"#f97316",core:false},
  isi:{name:"ISI بی‌خوابی",icon:Moon,color:"#1d4ed8",core:false},
  asrs:{name:"ADHD",icon:Zap,color:"#dc2626",core:false},
  sexual_compat:{name:"سازگاری جنسی",icon:Sparkles,color:"#ec4899",core:false},
  pid5:{name:"PID-5",icon:Microscope,color:"#7c3aed",core:false},
  ysq:{name:"طرحواره YSQ",icon:Sprout,color:"#059669",core:false},
  bdi2:{name:"BDI-2",icon:CloudRain,color:"#3b82f6",core:false},
  pcl5:{name:"PCL-5",icon:Shield,color:"#dc2626",core:false},
  ybocs:{name:"Y-BOCS",icon:RefreshCw,color:"#7c3aed",core:false},
  mdq:{name:"MDQ",icon:Glasses,color:"#f59e0b",core:false},
  mmpi_screen:{name:"MMPI",icon:ClipboardList,color:"#64748b",core:false},
  mcmi_screen:{name:"MCMI",icon:ClipboardList,color:"#64748b",core:false},
};

function AnimBar({pct,color,delay=0,label=""}:{pct:number;color:string;delay?:number;label?:string}) {
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+300);return()=>clearTimeout(t);},[pct]);
  return (
    <div>
      {label&&<div className="flex justify-between mb-1 text-xs">
        <span className="text-slate-600 font-bold">{label}</span>
        <span className="font-black" style={{color}}>{pct}٪</span>
      </div>}
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full relative overflow-hidden"
          style={{width:`${w}%`,background:`linear-gradient(90deg,${color}60,${color})`,
            transition:`width ${0.9+delay/1000}s cubic-bezier(0.34,1.56,0.64,1)`}}>
          <div className="absolute inset-0 bg-white/20"/>
        </div>
      </div>
    </div>
  );
}

function Pentagon({dims,size=180,onSelect,selected}:{
  dims:{label:string;value:number;max:number;color:string}[];
  size?:number;onSelect?:(label:string)=>void;selected?:string|null;
}) {
  const [anim,setAnim]=useState(false);
  useEffect(()=>{setAnim(false);const t=setTimeout(()=>setAnim(true),100);return()=>clearTimeout(t);},[dims]);
  const n=dims.length; const cx=size/2; const cy=size/2; const r=size/2-22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{direction:"ltr"}}>
      {[.25,.5,.75,1].map((s,i)=>{
        const pts=dims.map((_,j)=>{const a=(j*2*Math.PI/n)-Math.PI/2;return `${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`;}).join(" ");
        return <polygon key={i} points={pts} fill="none" stroke={i===3?"rgba(0,0,0,0.1)":"rgba(0,0,0,0.04)"} strokeWidth={i===3?1.5:1}/>;
      })}
      {dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,0.05)" strokeWidth={1}/>;
      })}
      <polygon points={dims.map((d,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;const p=anim?Math.min(d.value/d.max,1):0;return `${cx+r*p*Math.cos(a)},${cy+r*p*Math.sin(a)}`;}).join(" ")}
        fill="rgba(255,107,0,0.12)" stroke="#FF6B00" strokeWidth={2.5}
        style={{transition:"all 1.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      {dims.map((d,i)=>{
        const a=(i*2*Math.PI/n)-Math.PI/2; const p=anim?Math.min(d.value/d.max,1):0;
        const x=cx+r*p*Math.cos(a); const y=cy+r*p*Math.sin(a);
        const lx=cx+(r+20)*Math.cos(a); const ly=cy+(r+20)*Math.sin(a);
        const isSel=selected===d.label;
        return (
          <g key={i} onClick={()=>onSelect?.(d.label)} style={{cursor:onSelect?"pointer":"default"}}>
            {isSel&&<circle cx={x} cy={y} r={14} fill={d.color} opacity={0.15}/>}
            <circle cx={x} cy={y} r={isSel?9:5} fill={d.color} stroke="white" strokeWidth={2.5}
              style={{transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
            {isSel&&<circle cx={x} cy={y} r={5} fill="white"/>}
            <text x={lx} y={ly+4} textAnchor="middle" fill={isSel?"#FF6B00":"#475569"}
              fontSize={isSel?9:8} fontWeight={isSel?"900":"700"}>{d.label}</text>
            <text x={lx} y={ly+14} textAnchor="middle" fill={d.color} fontSize={7} fontWeight="900">
              {Math.round(d.value/d.max*100)}٪
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Pentagon زیربعدها با انیمیشن ورود
function getSubValues(label:string, scores:any): number[] | null {
  const testId:Record<string,string>={دلبستگی:"ecr_r",شخصیت:"neo_ffi",هیجان:"erq",همدلی:"iri",گاتمان:"gottman"};
  const s=normalizeTestScores(testId[label]||"",scores);
  if(!scores||Object.keys(s).length===0) return null;
  const pct=(value:any,max:number)=>Math.max(0,Math.min(100,Math.round((Number(value)||0)/max*100)));
  if(label==="دلبستگی") {
    // ECR: ANX(0-63), AVO(0-63)
    const anx=Math.round(Math.min(100,(s.ANX||s.anxiety||0)/63*100));
    const avo=Math.round(Math.min(100,(s.AVO||s.avoidance||0)/63*100));
    const sec=Math.max(0,100-Math.max(anx,avo));
    const trust=Math.max(0,100-avo);
    const bond=Math.max(0,100-anx);
    return [anx,avo,sec,trust,bond]; // اضطراب,اجتناب,ایمنی,اعتماد,پیوند
  }
  if(label==="شخصیت") {
    // این مقادیر از answers هم بازحساب می‌شوند؛ بنابراین نتایج قدیمی نیز صفر نمایش داده نمی‌شوند.
    return [pct(s.E,30),pct(s.A,30),pct(s.C,30),pct(s.N,30),pct(s.O,30)];
  }
  if(label==="هیجان") {
    // نسخهٔ فعلی ERQ پنج سؤال برای هر خرده‌مقیاس دارد: سقف هرکدام ۳۵ است.
    const cr=pct(s.CR,35);
    const es=pct(s.ES,35);
    const aware=Math.round((cr+es)/2);
    const cope=Math.max(cr,es);
    const reg=Math.round((cr*0.7+es*0.3));
    return [cr,es,aware,cope,reg]; // بازارزیابی,سرکوب,آگاهی,مقابله,تنظیم
  }
  if(label==="همدلی") {
    const ec=pct(s.EC,s._EC_max||25); const pt=pct(s.PT,s._PT_max||20);
    const fs=s.FS==null?0:pct(s.FS,s._FS_max||1); const pd=pct(s.PD,s._PD_max||5);
    return [ec,pt,fs,pd,Math.round((ec+pt)/2)]; // عاطفی,شناختی,خیال,نگرانی,پریشانی
  }
  if(label==="گاتمان") {
    // گاتمن از total قابل استنتاج نیست؛ هر ضلع باید از همان خرده‌مقیاس واقعی ساخته شود.
    if(!Number.isFinite(s.relationship_health)) return null;
    const horseman=(value:any)=>Math.max(0,Math.min(100,Math.round(((Number(value)||2)-2)/8*100)));
    const positive=pct(s.positive_total,20);
    return [horseman(s.criticism),horseman(s.contempt),horseman(s.defensiveness),horseman(s.stonewalling),positive];
  }
  return null;
}

function SubPentagon({label,color,baseValue,scores}:{label:string;color:string;baseValue:number;scores?:any}) {
  const [anim,setAnim]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAnim(true),150);return()=>clearTimeout(t);},[label]);
  const subValues=scores?getSubValues(label,scores):null;
  if(!subValues) return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs leading-6 text-amber-800">
      دادهٔ این نسخه از آزمون برای نمودار معتبر نیست؛ با تکرار آزمون، نمودار دقیق نمایش داده می‌شود.
    </div>
  );
  const subs=(SUB_DIMS[label]||[]).map((s,i)=>{
    return {...s,value:Math.min(100,Math.max(0,subValues[i]??0)),max:100,color};
  });
  if(!subs.length) return null;
  const n=subs.length; const cx=90; const cy=90; const r=65; const size=180;
  return (
    <div style={{opacity:anim?1:0,transform:anim?"scale(1)":"scale(0.7)",
      transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{direction:"ltr"}}>
        {[.33,.66,1].map((s,gi)=>{
          const pts=subs.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return `${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`;}).join(" ");
          return <polygon key={gi} points={pts} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={1}/>;
        })}
        {subs.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,0.05)" strokeWidth={1}/>;
        })}
        <polygon
          points={subs.map((d,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;const p=anim?d.value/100:0;return `${cx+r*p*Math.cos(a)},${cy+r*p*Math.sin(a)}`;}).join(" ")}
          fill={`${color}18`} stroke={color} strokeWidth={2}
          style={{transition:"all 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        {subs.map((d,i)=>{
          const a=(i*2*Math.PI/n)-Math.PI/2; const p=anim?d.value/100:0;
          const x=cx+r*p*Math.cos(a); const y=cy+r*p*Math.sin(a);
          const lx=cx+(r+18)*Math.cos(a); const ly=cy+(r+18)*Math.sin(a);
          return <g key={i}>
            <circle cx={x} cy={y} r={4} fill={color} stroke="white" strokeWidth={2}
              style={{transition:"all 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
            <text x={lx} y={ly+3} textAnchor="middle" fill="#475569" fontSize={7.5} fontWeight="700">{d.label}</text>
            <text x={lx} y={ly+12} textAnchor="middle" fill={color} fontSize={7} fontWeight="900">{d.value}٪</text>
          </g>;
        })}
      </svg>
      <div className="space-y-1.5 mt-2">
        {subs.map((d,i)=>(
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-16 text-right flex-shrink-0">{d.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{width:`${anim?d.value:0}%`,background:color,
                transition:`width ${0.8+i*0.1}s cubic-bezier(0.34,1.56,0.64,1)`}}/>
            </div>
            <span className="text-[9px] font-black w-7 flex-shrink-0" style={{color}}>{d.value}٪</span>
          </div>
        ))}
        <p className="text-[9px] text-slate-400 text-center pt-1">{(SUB_DIMS[label]||[]).find(s=>true)?.desc||""}</p>
      </div>
    </div>
  );
}

function calcScoreFromResult(testName:string, scores:any, mainResult:string): number {
  return getTestProfileScore(testName, scores, mainResult);
}

async function getNEOAI(dim: string, score: number, setNeoAI: any, setNeoAILoading: any) {
  setNeoAILoading((p:any) => ({...p, [dim]: true}));
  try {
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({model:"gpt-4o",max_tokens:500,messages:[{role:"user",
        content:`تفسیر مختصر بُعد "${dim}" در پنج عامل بزرگ شخصیت با امتیاز ${score}٪ به فارسی روان.\n\n## معنای این امتیاز\n[۲ جمله]\n\n## نقاط قوت\n- [۲ مورد]\n\n## توصیه\n[۱ جمله]`
      }]})
    });
    const d = await r.json();
    const txt = d.choices?.[0]?.message?.content || "";
    setNeoAI((p:any) => ({...p, [dim]: txt}));
  } catch { setNeoAI((p:any) => ({...p, [dim]: "خطا در دریافت تفسیر"})); }
  setNeoAILoading((p:any) => ({...p, [dim]: false}));
}

export default function CompatibilityPage() {
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [selectedDim,setSelectedDim]=useState<string|null>(null);
  const [neoAI,setNeoAI]=useState<Record<string,string>>({});
  const [neoAILoading,setNeoAILoading]=useState<Record<string,boolean>>({});
  const [subAnim,setSubAnim]=useState(false);
  const [expandedTest,setExpandedTest]=useState<string|null>(null);

  useEffect(()=>{
    // BroadcastChannel real-time sync
    try {
      const ch=new BroadcastChannel("raavi_test_done");
      ch.onmessage=()=>{
        const tok=localStorage.getItem("token")||"";
        fetch(`${API}/api/test-results/my`,{headers:{Authorization:`Bearer ${tok}`}})
          .then(r=>r.ok?r.json():{}).then(d=>{
            const list=(d as any)?.results||(d as any)?.data||[];
            const seen=new Set<string>();
            setResults(list.filter((r:any)=>{const k=r.test_name;if(seen.has(k))return false;seen.add(k);return true;}));
          });
      };
      return ()=>ch.close();
    } catch {}
  },[]);

  useEffect(()=>{
    const tok=localStorage.getItem("token")||"";
    fetch(`${API}/api/test-results/my`,{headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.ok?r.json():{}).then(d=>{
        const list=(d as any)?.results||(d as any)?.data||[];
        const seen=new Set<string>();
        setResults(list.filter((r:any)=>{const k=r.test_name;if(seen.has(k))return false;seen.add(k);return true;}));
      }).finally(()=>setLoading(false));
  },[]);

  const doneMap = useMemo(()=>{
    const m:Record<string,any>={};
    results.forEach(r=>{ m[r.test_name]=r; });
    return m;
  },[results]);

  const coreResults = CORE.map(id=>({id,meta:TEST_META[id],result:doneMap[id]}));
  const coreCompleted = coreResults.filter(t=>t.result).length;
  const coreScore = coreCompleted===0?0:Math.round(
    coreResults.reduce((sum,t)=>{
      if(!t.result) return sum;
      return sum+calcScoreFromResult(t.id,t.result.scores,t.result.main_result);
    },0)/Math.max(coreCompleted,1)
  );
  const scoreColor=coreScore>=75?"#22c55e":coreScore>=55?"#FF6B00":coreScore>=35?"#eab308":"#ef4444";

  const pentagon=[
    {label:"دلبستگی",value:doneMap["ecr_r"]?calcScoreFromResult("ecr_r",doneMap["ecr_r"].scores,doneMap["ecr_r"].main_result):0,max:100,color:"#ef4444"},
    {label:"شخصیت",value:doneMap["neo_ffi"]?calcScoreFromResult("neo_ffi",doneMap["neo_ffi"].scores,doneMap["neo_ffi"].main_result):0,max:100,color:"#a855f7"},
    {label:"هیجان",value:doneMap["erq"]?calcScoreFromResult("erq",doneMap["erq"].scores,doneMap["erq"].main_result):0,max:100,color:"#22c55e"},
    {label:"همدلی",value:doneMap["iri"]?calcScoreFromResult("iri",doneMap["iri"].scores,doneMap["iri"].main_result):0,max:100,color:"#0ea5e9"},
    {label:"گاتمان",value:doneMap["gottman"]?calcScoreFromResult("gottman",doneMap["gottman"].scores,doneMap["gottman"].main_result):0,max:100,color:"#f97316"},
  ];

  const optionalDone = results.filter(r=>r.test_name!==MANDATORY&&!CORE.includes(r.test_name));

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <RefreshCw size={28} className="text-orange-400 animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 text-sm">در حال تحلیل پروفایل...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-5 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"40px",height:"40px",borderRadius:"14px",background:"linear-gradient(145deg,#FF6B00,#ea580c)",boxShadow:"3px 3px 12px rgba(255,107,0,0.35), inset 1px 1px 3px rgba(255,255,255,0.3)",transform:"rotateX(6deg) rotateY(-6deg)",flexShrink:0}}><Heart size={18} style={{color:"white"}}/></span>
            <div>
              <h1 className="text-slate-900 font-black text-lg">پروفایل سازگاری</h1>
              <p className="text-slate-400 text-xs">بر اساس {results.length} تست انجام‌شده</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* امتیاز کلی */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg width={90} height={90}>
                <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8}/>
                <circle cx={45} cy={45} r={38} fill="none" stroke={scoreColor} strokeWidth={8}
                  strokeDasharray={2*Math.PI*38} strokeDashoffset={2*Math.PI*38*(1-coreScore/100)}
                  strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{transition:"stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)"}}/>
                <text x={45} y={50} textAnchor="middle" fill={scoreColor} fontSize={18} fontWeight="900">{coreScore}</text>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-900 text-lg">امتیاز سازگاری</p>
              <p className="text-sm font-bold" style={{color:scoreColor}}>{coreScore>=75?"عالی":coreScore>=55?"خوب":coreScore>=35?"متوسط":"نیاز به تکمیل"}</p>
              <p className="text-xs text-slate-400 mt-1">{coreCompleted}/۵ تست اصلی کامل</p>
            </div>
          </div>
          {/* نوار پیشرفت تست‌های اصلی */}
          <div className="flex gap-1.5 mt-4">
            {CORE.map(id=>{
              const done2=!!doneMap[id];
              const meta=TEST_META[id];
              return <div key={id} title={meta.name}
                className="flex-1 h-2.5 rounded-full transition-all duration-700"
                style={{background:done2?`linear-gradient(90deg,${meta.color}80,${meta.color})`:"rgba(0,0,0,0.06)"}}/>;
            })}
          </div>
        </div>

        {/* Pentagon ۵ تست اصلی */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Star size={14} className="text-orange-500"/> نمودار ۵ بُعد اصلی
          </h2>
          <div className="flex justify-center">
            <Pentagon dims={pentagon} size={200} onSelect={(l)=>{setSelectedDim(selectedDim===l?null:l);setSubAnim(false);setTimeout(()=>setSubAnim(true),50);}} selected={selectedDim}/>
          </div>
          {selectedDim&&(
            <div className="mt-4 p-4 rounded-2xl border-2 transition-all"
              style={{borderColor:pentagon.find(d=>d.label===selectedDim)?.color+"30"||"rgba(255,107,0,0.2)",
                background:pentagon.find(d=>d.label===selectedDim)?.color+"06"||"rgba(255,107,0,0.04)"}}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 rounded-full" style={{background:pentagon.find(d=>d.label===selectedDim)?.color||"#FF6B00"}}/>
                <p className="font-black text-sm text-slate-800">{selectedDim} — جزئیات</p>
                <button onClick={()=>setSelectedDim(null)} className="mr-auto text-slate-300 text-xs">✕</button>
              </div>
              <SubPentagon
                label={pentagon.find(d=>d.label===selectedDim)?.label||""}
                color={pentagon.find(d=>d.label===selectedDim)?.color||"#FF6B00"}
                baseValue={pentagon.find(d=>d.label===selectedDim)?.value||0}
                scores={selectedDim==="دلبستگی"?doneMap["ecr_r"]?.scores:selectedDim==="شخصیت"?doneMap["neo_ffi"]?.scores:selectedDim==="هیجان"?doneMap["erq"]?.scores:selectedDim==="همدلی"?doneMap["iri"]?.scores:selectedDim==="گاتمان"?doneMap["gottman"]?.scores:null}/>
            </div>
          )}
          <div className="space-y-2 mt-2">
            {pentagon.map((d,i)=>(
              <AnimBar key={i} pct={d.value} color={d.color} label={d.label} delay={i*80}/>
            ))}
          </div>
        </div>

        {/* ۵ تست اصلی */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Award size={14} className="text-orange-500"/>
              تست‌های اصلی
            </h2>
            <span className="text-[10px] px-2 py-1 rounded-lg font-black text-white"
              style={{background:"linear-gradient(135deg,#22c55e,#10b981)"}}>
              {coreCompleted}/۵
            </span>
          </div>
          <div className="space-y-2.5">
            {CORE.map((id,idx)=>{
              const meta=TEST_META[id]; const result=doneMap[id];
              const score=result?calcScoreFromResult(id,result.scores,result.main_result):0;
              return (
                <Link key={id} href={`/dashboard/tests/${id}`}
                  className="flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden"
                  style={{
                    background:result?`linear-gradient(135deg,${meta.color}10,${meta.color}05)`:"rgba(0,0,0,0.02)",
                    border:`1.5px solid ${result?meta.color+"40":"rgba(0,0,0,0.06)"}`,
                    animation:`fadeSlideIn 0.4s ease-out ${idx*0.07}s both`,
                    boxShadow:result?`0 4px 16px ${meta.color}12`:"none",
                  }}>
                  {/* درخشش hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{background:`radial-gradient(circle at 30% 50%, ${meta.color}10, transparent 70%)`}}/>
                  {/* آیکون سه‌بعدی */}
                  <div className="relative flex-shrink-0" style={{
                    width:"44px",height:"44px",borderRadius:"14px",
                    background:`linear-gradient(145deg, ${meta.color}35, ${meta.color}15)`,
                    boxShadow:`3px 3px 10px rgba(0,0,0,0.18), inset 1px 1px 3px rgba(255,255,255,0.45)`,
                    transform:"rotateX(8deg) rotateY(-8deg)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"transform 0.3s ease",
                  }}>
                    <meta.icon size={20} style={{color:meta.color,filter:`drop-shadow(0 2px 4px ${meta.color}60)`}}/>
                    {result && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{background:`linear-gradient(135deg,${meta.color},${meta.color}cc)`,boxShadow:`0 2px 6px ${meta.color}80`}}>
                      <CheckCircle2 size={9} className="text-white"/>
                    </div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-slate-800 font-black text-xs">{meta.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black text-white"
                        style={{background:`linear-gradient(135deg,${meta.color},${meta.color}cc)`,
                          boxShadow:`0 2px 6px ${meta.color}40`}}>اصلی</span>
                    </div>
                    {result?(
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{background:`${meta.color}15`}}>
                            <div className="h-full rounded-full relative overflow-hidden"
                              style={{width:`${score}%`,
                                background:`linear-gradient(90deg,${meta.color}80,${meta.color})`,
                                transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}>
                              <div className="absolute inset-0" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",animation:"shimmer 2s infinite"}}/>
                            </div>
                          </div>
                          <span className="text-[11px] font-black w-8 text-right" style={{color:meta.color}}>{score}٪</span>
                        </div>
                        <p className="text-[10px] mt-1 font-bold" style={{color:`${meta.color}cc`}}>{result.main_result}</p>
                      </div>
                    ):(
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"/>
                        <p className="text-[10px] text-slate-400">انجام نشده</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-1">
                    <ChevronLeft size={15} style={{color:result?meta.color:"#cbd5e1"}}/>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* تست‌های فرعی — گرافیک کامل */}
        {optionalDone.length>0&&(
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-orange-500"/>
              تست‌های تکمیلی
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 text-orange-500 font-bold">{optionalDone.length} تست</span>
            </h2>
            <div className="space-y-2.5">
              {optionalDone.map((r,idx)=>{
                const meta=TEST_META[r.test_name]||{name:r.test_name,icon:ClipboardList,color:"#64748b",core:false};
                const score=calcScoreFromResult(r.test_name,r.scores,r.main_result);
                const isOpen=expandedTest===r.test_name;
                return (
                  <div key={r.id}
                    className="rounded-2xl overflow-hidden group"
                    style={{
                      border:`1.5px solid ${isOpen?meta.color+"50":"rgba(0,0,0,0.06)"}`,
                      boxShadow:isOpen?`0 8px 24px ${meta.color}18`:"0 2px 8px rgba(0,0,0,0.04)",
                      transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                      animation:`fadeSlideIn 0.4s ease-out ${idx*0.06}s both`,
                    }}>
                    <button onClick={()=>setExpandedTest(isOpen?null:r.test_name)}
                      className="w-full flex items-center gap-3 p-3.5 text-right relative overflow-hidden"
                      style={{background:isOpen?`linear-gradient(135deg,${meta.color}10,${meta.color}05)`:"#fafafa"}}>
                      {/* shimmer bg on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{background:`radial-gradient(circle at 20% 50%,${meta.color}08,transparent 60%)`}}/>
                      {/* آیکون */}
                      <div className="relative flex-shrink-0" style={{
                        width:"44px",height:"44px",borderRadius:"14px",
                        background:`linear-gradient(145deg,${meta.color}35,${meta.color}15)`,
                        boxShadow:`3px 3px 10px rgba(0,0,0,0.15),inset 1px 1px 3px rgba(255,255,255,0.5)`,
                        transform:isOpen?"rotateX(10deg) rotateY(-10deg) scale(1.05)":"rotateX(6deg) rotateY(-6deg)",
                        transition:"transform 0.3s ease",
                        display:"flex",alignItems:"center",justifyContent:"center",
                      }}>
                        <meta.icon size={20} style={{color:meta.color,filter:`drop-shadow(0 2px 3px ${meta.color}50)`}}/>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{background:`linear-gradient(135deg,${meta.color},${meta.color}bb)`,
                            boxShadow:`0 2px 6px ${meta.color}60`}}>
                          <CheckCircle2 size={10} className="text-white"/>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-xs font-black text-slate-800">{meta.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{background:`${meta.color}15`}}>
                            <div className="h-full rounded-full relative overflow-hidden"
                              style={{width:`${score}%`,
                                background:`linear-gradient(90deg,${meta.color}70,${meta.color})`,
                                transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}>
                              <div className="absolute inset-0"
                                style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)",
                                  animation:"shimmer 2s infinite"}}/>
                            </div>
                          </div>
                          <span className="text-[10px] font-black w-7 text-right flex-shrink-0" style={{color:meta.color}}>{score}٪</span>
                        </div>
                        <p className="text-[10px] mt-0.5 font-bold" style={{color:`${meta.color}aa`}}>{r.main_result}</p>
                      </div>
                      <div style={{
                        transform:isOpen?"rotate(180deg)":"none",
                        transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                        color:isOpen?meta.color:"#cbd5e1",
                      }}>
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </button>
                    {isOpen&&(
                      <div className="px-4 pb-4 pt-3 border-t"
                        style={{borderColor:`${meta.color}20`,
                          background:`linear-gradient(180deg,${meta.color}04,transparent)`,
                          animation:"fadeSlideIn 0.3s ease-out"}}>
                        <TestResultVisualization
                          testId={r.test_name}
                          testName={meta.name}
                          mainResult={r.main_result||""}
                          scores={r.scores||{}}
                          compact={true}/>
                        <Link href={`/dashboard/tests/${r.test_name}`}
                          className="flex items-center justify-center gap-1.5 mt-3 py-2.5 rounded-xl text-xs font-black transition-all"
                          style={{background:`linear-gradient(135deg,${meta.color}15,${meta.color}08)`,
                            color:meta.color,border:`1px solid ${meta.color}30`}}>
                          تکرار تست ←
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* تست‌های فرعی انجام‌نشده */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-slate-400"/>
            تست‌های اختیاری
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 text-orange-500 font-bold">دقت بیشتر</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TEST_META)
              .filter(([id])=>!CORE.includes(id)&&id!==MANDATORY&&!doneMap[id])
              .slice(0,8).map(([id,meta],idx)=>(
              <Link key={id} href={`/dashboard/tests/${id}`}
                className="flex items-center gap-2.5 p-3 rounded-2xl group transition-all duration-200 relative overflow-hidden"
                style={{
                  background:"linear-gradient(135deg,rgba(255,255,255,0.8),rgba(248,250,252,0.9))",
                  border:"1px solid rgba(0,0,0,0.06)",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
                  animation:`fadeSlideIn 0.35s ease-out ${idx*0.05}s both`,
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
                  style={{background:`linear-gradient(135deg,${meta.color}08,transparent)`}}/>
                <span style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:"34px",height:"34px",borderRadius:"10px",flexShrink:0,
                  background:`linear-gradient(145deg,${meta.color}30,${meta.color}12)`,
                  boxShadow:`2px 2px 6px rgba(0,0,0,0.12),inset 1px 1px 2px rgba(255,255,255,0.5)`,
                  transform:"rotateX(5deg) rotateY(-5deg)",
                  transition:"transform 0.2s ease",
                }}>
                  <meta.icon size={16} style={{color:meta.color}}/>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-slate-700 truncate">{meta.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:meta.color+"60"}}/>
                    <p className="text-[9px] text-slate-400 font-medium">انجام نشده</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/dashboard/tests"
            className="flex items-center justify-center gap-1 mt-3 py-2 text-xs font-bold text-orange-500">
            همه تست‌ها <ChevronLeft size={11}/>
          </Link>
        </div>

        {/* کارت RGCI */}
        <Link href="/rgci"
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl mb-3"
          style={{background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",boxShadow:"0 4px 20px rgba(124,58,237,0.2)"}}>
          <div>
            <p className="font-black text-sm text-white">پرسشنامه سازگاری RGCI</p>
            <p className="text-white/70 text-xs mt-0.5">
              برای گروه‌بندی بهتر در رویدادها و پیشنهاد روانشناس مناسب
            </p>
          </div>
          <Brain size={20} className="text-white flex-shrink-0"/>
        </Link>

        {/* لینک به روانشناسان */}
        <Link href="/dashboard/my-therapist/ham-ravan"
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white"
          style={{background:"linear-gradient(135deg,#1e3a5f,#2d5a8e)",boxShadow:"0 4px 20px rgba(30,58,95,0.2)"}}>
          <div>
            <p className="font-black text-sm">روانشناسان پیشنهادی</p>
            <p className="text-white/60 text-xs">
              {coreCompleted>=3?"بر اساس پروفایل شما":"تکمیل تست‌های اصلی را بشمار"}
            </p>
          </div>
          <Cpu size={20}/>
        </Link>

      </div>
    </div>
  );
}

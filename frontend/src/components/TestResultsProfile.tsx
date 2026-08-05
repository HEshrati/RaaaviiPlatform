"use client";
import dynamic from "next/dynamic";
const TestResultVisualization = dynamic(()=>import("@/components/TestResultVisualization"),{ssr:false,loading:()=><div className="h-32 animate-pulse rounded-2xl bg-white/5"/>});
import { streamAI } from "@/lib/ai-stream";
import { getTestProfileScore } from "@/lib/test-result-scoring";
// dynamic import
// import TestResultVisualization from "@/components/TestResultVisualization";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Cpu, ChevronDown, ChevronUp, RefreshCw, Sparkles, RotateCcw } from "lucide-react";

const API = "https://raaviiplatform.com";

// ── رنگ‌های MBTI ──────────────────────────────────────────────
const MBTI_COLORS: Record<string,{bg:string;text:string;emoji:string;desc:string}> = {
  ISTJ:{bg:"#1d4ed8",text:"#dbeafe",emoji:"📋",desc:"وظیفه‌شناس و قابل اعتماد"},
  ISFJ:{bg:"#0369a1",text:"#e0f2fe",emoji:"🛡️",desc:"محافظ و فداکار"},
  INFJ:{bg:"#7c3aed",text:"#ede9fe",emoji:"🔮",desc:"آرمان‌گرا و بینش‌مند"},
  INTJ:{bg:"#4c1d95",text:"#ede9fe",emoji:"♟️",desc:"معمار و استراتژیست"},
  ISTP:{bg:"#d97706",text:"#fef3c7",emoji:"🔧",desc:"ماهر و منطقی"},
  ISFP:{bg:"#b45309",text:"#fef3c7",emoji:"🎨",desc:"هنرمند و حساس"},
  INFP:{bg:"#059669",text:"#d1fae5",emoji:"🌿",desc:"آرمان‌گرا و شاعرمنش"},
  INTP:{bg:"#0284c7",text:"#e0f2fe",emoji:"🧩",desc:"منطقی و کنجکاو"},
  ESTP:{bg:"#dc2626",text:"#fee2e2",emoji:"⚡",desc:"کارآفرین و پرانرژی"},
  ESFP:{bg:"#ea580c",text:"#ffedd5",emoji:"🎭",desc:"سرگرم‌کننده و آزاد"},
  ENFP:{bg:"#16a34a",text:"#dcfce7",emoji:"✨",desc:"الهام‌بخش و خلاق"},
  ENTP:{bg:"#9333ea",text:"#f3e8ff",emoji:"💡",desc:"نوآور و بحث‌دوست"},
  ESTJ:{bg:"#1e40af",text:"#dbeafe",emoji:"⚖️",desc:"سازمان‌ده و عملگرا"},
  ESFJ:{bg:"#0891b2",text:"#cffafe",emoji:"🤝",desc:"مراقب و اجتماعی"},
  ENFJ:{bg:"#15803d",text:"#dcfce7",emoji:"🌟",desc:"رهبر الهام‌بخش"},
  ENTJ:{bg:"#6d28d9",text:"#ede9fe",emoji:"👑",desc:"فرمانده و راهبرد"},
};

// ── محاسبه subscale از raw answers ────────────────────────────
function calcNEO(answers: Record<string,number>) {
  const REV = new Set([4,6,10,12,16,18]);
  const subs: Record<string,number[]> = {E:[],A:[],C:[],N:[],O:[]};
  const map = ["","E","E","E","E","E","E","A","A","A","A","A","A","C","C","C","C","C","C","N","N","N","N","N","N","O","O","O","O","O","O"];
  for (let i=1;i<=30;i++) {
    const raw = answers[i] ?? answers[String(i)] ?? 3;
    const val = REV.has(i) ? 6-raw : raw;
    if (map[i]) subs[map[i]].push(val);
  }
  return Object.fromEntries(Object.entries(subs).map(([k,v]) => [k, v.reduce((a,b)=>a+b,0)]));
}

function calcECR(answers: Record<string,number>) {
  const ANX_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  const AVO_IDS = [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36];
  const REV_ANX = new Set([1,2,5,7,8]);
  const REV_AVO = new Set([19,20,21,22,23,24]);
  let anx=0,avo=0;
  for (const i of ANX_IDS) { const r=answers[i]??answers[String(i)]??4; anx+=REV_ANX.has(i)?8-r:r; }
  for (const i of AVO_IDS) { const r=answers[i]??answers[String(i)]??4; avo+=REV_AVO.has(i)?8-r:r; }
  return {ANX:anx,AVO:avo};
}

// ── Pentagon SVG ───────────────────────────────────────────────
function Pentagon({dims, size=180, onSelect, selected}: {
  dims:{label:string;value:number;max:number;color:string}[];
  size?:number; onSelect?:(i:number)=>void; selected?:number|null;
}) {
  const [anim,setAnim] = useState(false);

  useEffect(()=>{const t=setTimeout(()=>setAnim(true),200);return()=>clearTimeout(t);},[dims]);
  const n=dims.length; const cx=size/2; const cy=size/2; const r=size/2-20;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{direction:"ltr"}}>
      {[0.25,0.5,0.75,1].map((s,gi)=>{
        const pts=dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return `${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`;}).join(" ");
        return <polygon key={gi} points={pts} fill="none" stroke={gi===3?"rgba(0,0,0,0.12)":"rgba(0,0,0,0.05)"} strokeWidth={gi===3?1.5:1}/>;
      })}
      {dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,0.06)" strokeWidth={1}/>;
      })}
      <polygon
        points={dims.map((d,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;const pct=anim?Math.min(d.value/d.max,1):0;return `${cx+r*pct*Math.cos(a)},${cy+r*pct*Math.sin(a)}`;}).join(" ")}
        fill="rgba(255,107,0,0.12)" stroke="#FF6B00" strokeWidth={2}
        style={{transition:"all 1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      {dims.map((d,i)=>{
        const a=(i*2*Math.PI/n)-Math.PI/2;
        const pct=anim?Math.min(d.value/d.max,1):0;
        const x=cx+r*pct*Math.cos(a); const y=cy+r*pct*Math.sin(a);
        const lx=cx+(r+16)*Math.cos(a); const ly=cy+(r+16)*Math.sin(a);
        const isSel=selected===i;
        return (
          <g key={i} onClick={()=>onSelect?.(i)} style={{cursor:onSelect?"pointer":"default"}}>
            {isSel&&<circle cx={x} cy={y} r={12} fill={d.color} opacity={0.2}/>}
            <circle cx={x} cy={y} r={isSel?7:5} fill={d.color} stroke="white" strokeWidth={2}
              style={{transition:"all 0.3s"}}/>
            <text x={lx} y={ly+4} textAnchor="middle" fill={isSel?"#FF6B00":"#475569"}
              fontSize={isSel?9:8} fontWeight={isSel?"900":"700"}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── AnimBar ────────────────────────────────────────────────────
function AnimBar({pct,color,label,delay=0,showPct=true}:{pct:number;color:string;label:string;delay?:number;showPct?:boolean}) {
  const [w,setW] = useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+100);return()=>clearTimeout(t);},[pct,delay]);
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        {showPct&&<span className="text-xs font-black" style={{color}}>{pct}٪</span>}
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{width:`${w}%`,background:`linear-gradient(90deg,${color}80,${color})`,transition:`width ${0.8+delay/1000}s cubic-bezier(0.34,1.56,0.64,1)`}}/>
      </div>
    </div>
  );
}

// ── Gauge دایره‌ای ─────────────────────────────────────────────
function Gauge({value,max,label,color,size=80}:{value:number;max:number;label:string;color:string;size:number}) {
  const [anim,setAnim]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAnim(true),300);return()=>clearTimeout(t);},[]);
  const pct=Math.min(100,Math.round(value/max*100));
  const r=(size-10)/2; const c=2*Math.PI*r;
  const dash=anim?c*(1-pct/100):c;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={dash} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill="#0f172a" fontSize={13} fontWeight="900">{pct}٪</text>
      </svg>
      <span className="text-[10px] text-slate-600 font-bold text-center mt-1">{label}</span>
    </div>
  );
}

// ── MBTI آدمک ─────────────────────────────────────────────────
function MBTIAvatar({type}:{type:string}) {
  const meta = MBTI_COLORS[type] || {bg:"#64748b",text:"#f1f5f9",emoji:"🧠",desc:"تیپ شخصیتی"};
  const [anim,setAnim]=useState(false);
  useEffect(()=>{setTimeout(()=>setAnim(true),200);},[]);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{transform:anim?"scale(1)":"scale(0)",transition:"transform 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
        {/* بدن آدمک */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg"
          style={{background:`linear-gradient(135deg,${meta.bg},${meta.bg}cc)`,boxShadow:`0 8px 24px ${meta.bg}40`}}>
          {meta.emoji}
        </div>
        {/* نوار رنگی */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black shadow-sm"
          style={{background:meta.bg,color:meta.text}}>
          {type}
        </div>
      </div>
      <p className="text-slate-600 text-xs text-center mt-2">{meta.desc}</p>
    </div>
  );
}

// ── گرافیک هر تست ─────────────────────────────────────────────
function TestGraphic({result}:{result:any}) {
  const [selDim,setSelDim]=useState<number|null>(null);
  const s=result.scores||{};
  const answers=s.answers||{};
  const name=(result.test_name||"").toLowerCase();

  // ── MBTI ──────────────────────────────────────────────────
  if (name.includes("mbti")||name.includes("matching_basis")) {
    const type=(result.main_result||"ISTJ").split(" ")[0].toUpperCase().slice(0,4);
    const EI=s.EI??0; const SN=s.SN??0; const TF=s.TF??0; const JP=s.JP??0;
    const toP=(v:number,r=3)=>Math.round(((Math.max(-r,Math.min(r,v))+r)/(r*2))*100);
    const dims=[
      {label:"E↔I",value:toP(EI,3),max:100,color:"#FF6B00",lo:"درون‌گرا (I)",hi:"برون‌گرا (E)"},
      {label:"S↔N",value:toP(SN,3),max:100,color:"#a855f7",lo:"حسی (S)",hi:"شهودی (N)"},
      {label:"T↔F",value:toP(TF,3),max:100,color:"#ef4444",lo:"منطقی (T)",hi:"احساسی (F)"},
      {label:"J↔P",value:toP(JP,5),max:100,color:"#eab308",lo:"انعطافی (P)",hi:"قضاوتی (J)"},
    ];
    return (
      <div>
        <div className="flex items-center gap-4 mb-5">
          <MBTIAvatar type={type}/>
          <div className="flex-1">
            {dims.map((d,i)=>(
              <div key={i} className="mb-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>{d.lo}</span><span>{d.hi}</span>
                </div>
                <AnimBar pct={d.value} color={d.color} label="" delay={i*100} showPct={false}/>
                <div className="flex justify-between text-[9px] mt-0.5">
                  <span className={d.value<50?"font-black":"text-slate-300"} style={{color:d.value<50?d.color:"#94a3b8"}}>{100-d.value}٪</span>
                  <span className={d.value>=50?"font-black":"text-slate-300"} style={{color:d.value>=50?d.color:"#94a3b8"}}>{d.value}٪</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {s.fullType&&<p className="text-slate-500 text-xs text-center bg-slate-50 rounded-xl p-2">{s.fullType}</p>}
      </div>
    );
  }

  // ── NEO ───────────────────────────────────────────────────
  if (name==="neo_ffi") {
    const neo = (s.E!=null)?{E:s.E,A:s.A,C:s.C,N:s.N,O:s.O} : calcNEO(answers);
    const MAX=30;
    const dims=[
      {label:"E",full:"برون‌گرایی",value:neo.E||0,max:MAX,color:"#FF6B00",
       subs:[{l:"تسلط",v:(answers[1]||3)/5*30},{l:"جمع‌گرایی",v:(answers[2]||3)/5*30},{l:"قاطعیت",v:(answers[3]||3)/5*30}]},
      {label:"A",full:"توافق‌پذیری",value:neo.A||0,max:MAX,color:"#22c55e",
       subs:[{l:"همدلی",v:(answers[7]||3)/5*30},{l:"اعتماد",v:(answers[8]||3)/5*30},{l:"نوع‌دوستی",v:(answers[9]||3)/5*30}]},
      {label:"C",full:"وظیفه‌شناسی",value:neo.C||0,max:MAX,color:"#3b82f6",
       subs:[{l:"برنامه‌ریزی",v:(answers[13]||3)/5*30},{l:"دقت",v:(answers[14]||3)/5*30},{l:"پشتکار",v:(answers[17]||3)/5*30}]},
      {label:"N",full:"روان‌رنجوری",value:neo.N||0,max:MAX,color:"#ef4444",
       subs:[{l:"اضطراب",v:(answers[19]||3)/5*30},{l:"افسردگی",v:(answers[20]||3)/5*30},{l:"حساسیت",v:(answers[21]||3)/5*30}]},
      {label:"O",full:"گشودگی",value:neo.O||0,max:MAX,color:"#a855f7",
       subs:[{l:"تخیل",v:(answers[25]||3)/5*30},{l:"زیباشناسی",v:(answers[26]||3)/5*30},{l:"کنجکاوی",v:(answers[27]||3)/5*30}]},
    ];
    const selSubs = selDim!=null?dims[selDim].subs.map(sb=>({...sb,max:MAX,color:dims[selDim].color,label:sb.l})):null;
    return (
      <div>
        <div className="flex justify-center mb-2">
          <Pentagon dims={dims} size={200} onSelect={i=>setSelDim(selDim===i?null:i)} selected={selDim}/>
        </div>
        {selSubs&&(
          <div className="mb-3 p-3 rounded-2xl border-2 animate-pulse-once"
            style={{borderColor:dims[selDim!].color+"40",background:dims[selDim!].color+"08"}}>
            <p className="text-xs font-black mb-2" style={{color:dims[selDim!].color}}>{dims[selDim!].full} — جزئیات</p>
            <Pentagon dims={selSubs.map(s=>({label:s.l,value:s.v,max:MAX,color:dims[selDim!].color}))} size={130}/>
          </div>
        )}
        <div className="space-y-1">
          {dims.map((d,i)=>{
            const pct=Math.round(d.value/MAX*100);
            return (
              <button key={i} onClick={()=>setSelDim(selDim===i?null:i)}
                className="w-full text-right"
                style={{opacity:selDim!==null&&selDim!==i?0.5:1,transition:"opacity 0.2s"}}>
                <AnimBar pct={pct} color={d.color} label={d.full} delay={i*80}/>
              </button>
            );
          })}
        </div>
        {!selDim&&selDim!==0&&<p className="text-slate-400 text-[10px] text-center mt-1">روی هر نقطه کلیک کن → جزئیات</p>}
      </div>
    );
  }

  // ── ECR-R ─────────────────────────────────────────────────
  if (name.includes("ecr")) {
    const ecr = (s.ANX!=null)?{ANX:s.ANX,AVO:s.AVO}:calcECR(answers);
    const MAX=63;
    const pctA=Math.round(ecr.ANX/MAX*100);
    const pctAv=Math.round(ecr.AVO/MAX*100);
    const style=(ecr.ANX<36&&ecr.AVO<36)?"ایمن":(ecr.ANX>=36&&ecr.AVO<36)?"اضطرابی":(ecr.ANX<36&&ecr.AVO>=36)?"اجتنابی":"بی‌سازمان";
    const styleColor={ایمن:"#22c55e",اضطرابی:"#ef4444",اجتنابی:"#3b82f6",بی‌سازمان:"#f97316"}[style]||"#64748b";
    // Scatter plot دو محور
    const [anim,setAnim]=useState(false);
    useEffect(()=>{setTimeout(()=>setAnim(true),400);},[]);
    const dotX=anim?`${(ecr.AVO/MAX)*100}%`:"50%";
    const dotY=anim?`${100-(ecr.ANX/MAX)*100}%`:"50%";
    return (
      <div>
        <div className="flex justify-around mb-4">
          <Gauge value={ecr.ANX} max={MAX} label="اضطراب دلبستگی" color="#ef4444" size={85}/>
          <div className="flex flex-col items-center justify-center">
            <div className="px-3 py-1.5 rounded-2xl font-black text-sm shadow-sm"
              style={{background:styleColor+"15",color:styleColor,border:`2px solid ${styleColor}30`}}>
              {style}
            </div>
          </div>
          <Gauge value={ecr.AVO} max={MAX} label="اجتناب دلبستگی" color="#3b82f6" size={85}/>
        </div>
        {/* دو محور scatter */}
        <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3"
          style={{background:"linear-gradient(135deg,#f0f9ff,#fef9ec)",border:"1px solid rgba(0,0,0,0.07)"}}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200"/>
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200"/>
          <span className="absolute top-1 left-1 text-[8px] text-slate-400">بالا-اضطراب</span>
          <span className="absolute bottom-1 right-1 text-[8px] text-slate-400">ایمن</span>
          <span className="absolute bottom-1 left-1 text-[8px] text-slate-400">اجتنابی</span>
          <div className="absolute w-5 h-5 rounded-full -translate-x-1/2 translate-y-1/2 shadow-md flex items-center justify-center"
            style={{left:dotX,bottom:dotY,background:styleColor,transition:"all 1.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <div className="w-2 h-2 rounded-full bg-white"/>
          </div>
        </div>
        <AnimBar pct={pctA} color="#ef4444" label="اضطراب" delay={0}/>
        <AnimBar pct={pctAv} color="#3b82f6" label="اجتناب" delay={100}/>
      </div>
    );
  }

  // ── ERQ ───────────────────────────────────────────────────
  if (name==="erq") {
    const cr=s.CR??s.reappraisal??21; const es=s.ES??s.suppression??14;
    const pctCR=Math.round(cr/42*100); const pctES=Math.round(es/28*100);
    return (
      <div>
        <div className="flex justify-around mb-4">
          <Gauge value={cr} max={42} label="بازارزیابی شناختی" color="#22c55e" size={85}/>
          <Gauge value={es} max={28} label="سرکوب هیجان" color="#ef4444" size={85}/>
        </div>
        <AnimBar pct={pctCR} color="#22c55e" label="بازارزیابی — مطلوب بالا باشه" delay={0}/>
        <AnimBar pct={pctES} color="#ef4444" label="سرکوب — مطلوب پایین باشه" delay={100}/>
        <div className="p-3 rounded-xl text-xs leading-6 mt-2" style={{background:pctCR>60?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)"}}>
          {pctCR>60?"✅ تنظیم هیجان سالم — بازارزیابی قوی":"⚠️ تمایل به سرکوب هیجانات"}
        </div>
      </div>
    );
  }

  // ── IRI ───────────────────────────────────────────────────
  if (name==="iri") {
    const ec=s.EC??s.empathy??20; const pt=s.PT??s.perspective??20;
    const dims=[
      {label:"همدلی عاطفی",value:ec,max:40,color:"#ec4899"},
      {label:"دیدگاه‌گیری",value:pt,max:40,color:"#3b82f6"},
      {label:"خیال‌پردازی",value:s.FS??18,max:40,color:"#a855f7"},
      {label:"پریشانی شخصی",value:s.PD??12,max:40,color:"#ef4444"},
    ];
    return (
      <div>
        <div className="flex justify-center mb-3">
          <Pentagon dims={dims} size={170}/>
        </div>
        {dims.map((d,i)=><AnimBar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*80}/>)}
      </div>
    );
  }

  // ── PHQ-9 / GAD-7 / BAI / ISI / ASRS ─────────────────────
  if (["phq9","gad7","bai","isi","asrs","dass21","mdq","ybocs","pcl5","bdi2"].includes(name)) {
    const total=s.total??0;
    const maxes:any={phq9:27,gad7:21,bai:63,isi:28,asrs:72,dass21:63,mdq:13,ybocs:40,pcl5:80,bdi2:63};
    const labels:any={phq9:"افسردگی",gad7:"اضطراب عمومی",bai:"اضطراب بک",isi:"بی‌خوابی",asrs:"ADHD",dass21:"DASS-21",mdq:"اختلال خلقی",ybocs:"وسواس",pcl5:"PTSD",bdi2:"افسردگی بک"};
    const MAX=maxes[name]||100; const pct=Math.round(total/MAX*100);
    const severity=pct<25?"خفیف":pct<50?"متوسط":pct<75?"شدید":"بسیار شدید";
    const sevColor=pct<25?"#22c55e":pct<50?"#eab308":pct<75?"#f97316":"#ef4444";
    return (
      <div>
        <div className="flex justify-center mb-4">
          <Gauge value={total} max={MAX} label={labels[name]||name} color={sevColor} size={100}/>
        </div>
        <AnimBar pct={pct} color={sevColor} label={`شدت: ${severity}`}/>
        <div className="p-3 rounded-xl text-xs text-center font-bold mt-2"
          style={{background:sevColor+"12",color:sevColor}}>
          {severity} — امتیاز {total} از {MAX}
        </div>
      </div>
    );
  }

  // ── HEXACO ────────────────────────────────────────────────
  if (name==="hexaco") {
    const dims=[
      {label:"صداقت-فروتنی",value:s.H??30,max:50,color:"#f59e0b"},
      {label:"تعادل هیجانی",value:s.E??30,max:50,color:"#6366f1"},
      {label:"برون‌گرایی",value:s.X??30,max:50,color:"#FF6B00"},
      {label:"توافق‌پذیری",value:s.A??30,max:50,color:"#22c55e"},
      {label:"وظیفه‌شناسی",value:s.C??30,max:50,color:"#3b82f6"},
      {label:"گشودگی",value:s.O??30,max:50,color:"#a855f7"},
    ];
    return (
      <div>
        <div className="flex justify-center mb-3">
          <Pentagon dims={dims} size={190} onSelect={i=>setSelDim(selDim===i?null:i)} selected={selDim}/>
        </div>
        {dims.map((d,i)=><AnimBar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*70}/>)}
      </div>
    );
  }

  // ── Gottman ───────────────────────────────────────────────
  if (name==="gottman") {
    const horsemen={criticism:s.criticism??0,contempt:s.contempt??0,defensiveness:s.defensiveness??0,stonewalling:s.stonewalling??0};
    const total4=horsemen.criticism+horsemen.contempt+horsemen.defensiveness+horsemen.stonewalling;
    const isHealthy=total4<=8;
    const mainRes=result.main_result&&result.main_result!=="completed"?result.main_result:null;
    return (
      <div>
        {/* نتیجه اصلی */}
        <div className="text-center mb-3 p-3 rounded-2xl" style={{background:isHealthy?"#f0fdf4":"#fff7ed",border:isHealthy?"1px solid #bbf7d0":"1px solid #fed7aa"}}>
          <p className="text-xs font-bold mb-1" style={{color:isHealthy?"#16a34a":"#ea580c"}}>الگوی غالب رابطه</p>
          <p className="text-lg font-black" style={{color:isHealthy?"#15803d":"#c2410c"}}>{mainRes||(isHealthy?"رابطه سالم":"نیاز به بهبود")}</p>
          <p className="text-[10px] mt-1" style={{color:isHealthy?"#4ade80":"#fb923c"}}>نمره کل: {total4} از ۴۰</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            {k:"criticism",l:"انتقاد",color:"#f97316",icon:"🗣️"},
            {k:"contempt",l:"تحقیر",color:"#ef4444",icon:"😤"},
            {k:"defensiveness",l:"دفاعی",color:"#eab308",icon:"🛡️"},
            {k:"stonewalling",l:"سنگ‌شدن",color:"#6366f1",icon:"🧱"},
          ].map(({k,l,color,icon})=>(
            <div key={k} className="p-3 rounded-2xl text-center" style={{background:color+"10",border:`1px solid ${color}20`}}>
              <span className="text-2xl">{icon}</span>
              <AnimBar pct={Math.round(((horsemen as any)[k]||0)/10*100)} color={color} label={l} showPct/>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 text-center">هرچه نمره پایین‌تر، رابطه سالم‌تر</p>
      </div>
    );
  }

  // ── Love Languages ────────────────────────────────────────
  if (name==="love_languages") {
    const langs=[
      {k:"words",l:"کلمات تأییدآمیز",color:"#f97316",icon:"💬"},
      {k:"acts",l:"اعمال خدمتگزارانه",color:"#22c55e",icon:"🤲"},
      {k:"gifts",l:"هدیه دادن",color:"#ec4899",icon:"🎁"},
      {k:"time",l:"زمان باکیفیت",color:"#3b82f6",icon:"⏰"},
      {k:"touch",l:"لمس فیزیکی",color:"#a855f7",icon:"🤝"},
    ];
    const primary=result.main_result;
    return (
      <div>
        {primary&&<div className="text-center mb-3 p-3 rounded-2xl bg-orange-50 border border-orange-100">
          <p className="font-black text-orange-700">زبان محبت اصلی شما</p>
          <p className="text-orange-500 text-sm">{primary}</p>
        </div>}
        {langs.map(({k,l,color,icon},i)=>(
          <div key={k} className="flex items-center gap-2 mb-2">
            <span className="text-base">{icon}</span>
            <div className="flex-1">
              <AnimBar pct={Math.round(((s[k]||0)/12)*100)} color={color} label={l} delay={i*80}/>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── YSQ طرحواره ───────────────────────────────────────────
  if (name==="ysq") {
    const schemas=Object.entries(s).filter(([k])=>k!=='total'&&k!=='answers').slice(0,8);
    const colors=["#FF6B00","#ef4444","#a855f7","#3b82f6","#22c55e","#eab308","#ec4899","#0ea5e9"];
    return (
      <div>
        {schemas.map(([k,v]:any,i)=>(
          <AnimBar key={k} pct={Math.round(v/36*100)} color={colors[i%colors.length]} label={k} delay={i*60}/>
        ))}
      </div>
    );
  }

  // ── Generic fallback ──────────────────────────────────────
  const total=s.total??0;
  return (
    <div className="text-center py-4">
      <div className="text-3xl font-black text-slate-900 mb-2">{result.main_result||"—"}</div>
      {total>0&&<AnimBar pct={Math.min(100,total)} color="#FF6B00" label="امتیاز کل"/>}
    </div>
  );
}

// ── کارت تست ──────────────────────────────────────────────────
import { Brain, Star, HeartCrack, Scale, Handshake, HeartHandshake, Diamond, Zap, Leaf, Frown, BarChart3, CircleDot, Moon, Microscope, Sprout, CloudRain, Shield, Glasses, ClipboardList, Heart, Swords, RefreshCcw, FlaskConical } from "lucide-react";

const TEST_META: Record<string,{name:string;icon:any;color:string}> = {
  raavi_matching_basis_v1:{name:"تیپ شخصیتی MBTI",icon:Brain,color:"#FF6B00"},
  neo_ffi:{name:"پنج عامل بزرگ NEO",icon:Star,color:"#a855f7"},
  ecr_r:{name:"سبک دلبستگی ECR-R",icon:HeartCrack,color:"#ef4444"},
  erq:{name:"تنظیم هیجان ERQ",icon:Scale,color:"#22c55e"},
  iri:{name:"شاخص همدلی IRI",icon:Handshake,color:"#0ea5e9"},
  gottman:{name:"الگوی گاتمان",icon:HeartHandshake,color:"#f97316"},
  love_languages:{name:"زبان محبت",icon:Heart,color:"#ec4899"},
  conflict_style:{name:"سبک تعارض",icon:Zap,color:"#eab308"},
  hexaco:{name:"شخصیت HEXACO",icon:Diamond,color:"#6366f1"},
  phq9:{name:"سلامت روان PHQ-9",icon:Leaf,color:"#22c55e"},
  gad7:{name:"اضطراب GAD-7",icon:Frown,color:"#eab308"},
  dass21:{name:"DASS-21",icon:FlaskConical,color:"#6366f1"},
  bai:{name:"اضطراب بک BAI",icon:CircleDot,color:"#f97316"},
  isi:{name:"بی‌خوابی ISI",icon:Moon,color:"#1d4ed8"},
  asrs:{name:"ADHD ASRS",icon:Zap,color:"#dc2626"},
  sexual_compat:{name:"سازگاری جنسی",icon:Heart,color:"#ec4899"},
  pid5:{name:"ساختار شخصیت PID-5",icon:Microscope,color:"#7c3aed"},
  ysq:{name:"طرحواره‌های یانگ YSQ",icon:Sprout,color:"#059669"},
  mmpi_screen:{name:"MMPI",icon:ClipboardList,color:"#64748b"},
  mcmi_screen:{name:"MCMI",icon:ClipboardList,color:"#64748b"},
  bdi2:{name:"افسردگی بک BDI-2",icon:CloudRain,color:"#3b82f6"},
  pcl5:{name:"PTSD PCL-5",icon:Shield,color:"#dc2626"},
  ybocs:{name:"وسواس Y-BOCS",icon:RefreshCcw,color:"#7c3aed"},
  mdq:{name:"اختلال خلقی MDQ",icon:Glasses,color:"#f59e0b"},
};

function TestCard({result, index=0}:{result:any; index?:number}) {
  const [open,setOpen]=useState(false);
  const [aiText,setAiText]=useState("");
  const [loadingAI,setLoadingAI]=useState(false);
  const [history,setHistory]=useState<any[]>([]);
  const [histIdx,setHistIdx]=useState(0);
  const [showHist,setShowHist]=useState(false);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setTimeout(()=>setMounted(true),index*60);},[]);

  const id=(result.test_id||result.test_name||"").toLowerCase();
  const meta=TEST_META[id]||{name:result.test_name||"تست",icon:ClipboardList,color:"#64748b"};
  const date=result.completed_at?new Date(result.completed_at).toLocaleDateString("fa-IR"):"";
  const score=calcScoreFromResult(id,result.scores,result.main_result);
  const Icon=meta.icon;

  async function getAI() {
    if(loadingAI||aiText)return;
    setLoadingAI(true);
    setAiText("");
    try {
      await streamAI(
        `تفسیر جامع تست "${meta.name}" با نتیجه "${result.main_result}" به فارسی.

## معنای نتیجه
توضیح کامل در ۲ پاراگراف

## نقاط قوت
- مورد اول
- مورد دوم

## توصیه
یک راهکار عملی`,
        (chunk) => setAiText(prev => prev + chunk),
        () => setLoadingAI(false),
        { maxTokens: 1500 }
      );
    } catch { setAiText("خطا در دریافت تفسیر."); setLoadingAI(false); }
  }

  return (
    <div
      className="rounded-3xl overflow-hidden group"
      style={{
        opacity: mounted?1:0,
        transform: mounted?"translateY(0)":"translateY(16px)",
        transition:`opacity 0.4s ease, transform 0.4s ease`,
        background: open
          ? `linear-gradient(145deg,${meta.color}08,#ffffff)`
          : "linear-gradient(145deg,#ffffff,#f8fafc)",
        border: `1.5px solid ${open?meta.color+"45":"rgba(0,0,0,0.06)"}`,
        boxShadow: open
          ? `0 8px 32px ${meta.color}15, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 12px rgba(0,0,0,0.05)",
      }}>
      {/* نوار رنگی بالا */}
      <div className="h-0.5 w-full transition-all duration-500"
        style={{background:open?`linear-gradient(90deg,${meta.color},${meta.color}60,transparent)`:`linear-gradient(90deg,${meta.color}30,transparent)`}}/>

      <button className="w-full flex items-center gap-3.5 p-4 text-right" onClick={()=>{
        setOpen(o=>!o);
        if(!open && history.length===0){
          const tok=localStorage.getItem("token")||"";
          fetch(`${API}/api/test-results/history/${id}`,{headers:{Authorization:`Bearer ${tok}`}})
            .then(r=>r.ok?r.json():[]).then((h:any[])=>{if(h.length>1)setHistory(h);}).catch(()=>{});
        }
      }}>
        {/* آیکون سه‌بعدی */}
        <div className="relative flex-shrink-0" style={{
          width:"48px",height:"48px",borderRadius:"16px",
          background:`linear-gradient(145deg,${meta.color}30,${meta.color}12)`,
          boxShadow:`3px 3px 10px rgba(0,0,0,0.12),inset 1px 1px 3px rgba(255,255,255,0.6)`,
          transform:open?"rotateX(10deg) rotateY(-10deg) scale(1.05)":"rotateX(6deg) rotateY(-6deg)",
          transition:"transform 0.3s ease",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <Icon size={22} style={{color:meta.color,filter:`drop-shadow(0 2px 4px ${meta.color}50)`}}/>
          {/* نقطه سبز تکمیل */}
          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{background:`linear-gradient(135deg,${meta.color},${meta.color}bb)`,
              boxShadow:`0 2px 6px ${meta.color}60`,border:"2px solid white"}}>
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-black text-sm mb-1.5">{meta.name}</p>
          {/* progress bar */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:`${meta.color}12`}}>
              <div className="h-full rounded-full relative overflow-hidden"
                style={{
                  width:open?`${score}%`:"0%",
                  background:`linear-gradient(90deg,${meta.color}70,${meta.color})`,
                  transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                <div className="absolute inset-0"
                  style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
                    animation:"shimmer 2s infinite"}}/>
              </div>
            </div>
            <span className="text-[10px] font-black w-7 text-left flex-shrink-0" style={{color:meta.color}}>{score}٪</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg"
              style={{background:`${meta.color}15`,color:meta.color,
                boxShadow:`inset 0 1px 2px ${meta.color}20`}}>
              {result.main_result}
            </span>
            {date&&<span className="text-slate-400 text-[10px]">{date}</span>}
          </div>
        </div>

        <div style={{
          transform:open?"rotate(180deg)":"rotate(0deg)",
          transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          color:open?meta.color:"#cbd5e1",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M4 7l5 5 5-5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open&&(
        <div className="px-4 pb-5 border-t"
          style={{borderColor:`${meta.color}15`,
            animation:"fadeSlideIn 0.3s ease-out"}}>
          <div className="pt-4">
            <TestResultVisualization testId={id} testName={meta.name} mainResult={result.main_result} scores={result.scores} compact={false}/>

            {history.length>1&&(
              <div className="mt-4 mb-2">
                <button onClick={()=>setShowHist(h=>!h)}
                  className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl mb-2 text-xs font-bold transition-all"
                  style={{background:`linear-gradient(135deg,${meta.color}10,${meta.color}05)`,
                    color:meta.color,border:`1px solid ${meta.color}20`}}>
                  <span className="flex items-center gap-2">
                    <RotateCcw size={11}/>
                    تاریخچه {history.length} بار تست
                  </span>
                  <span style={{transform:showHist?"rotate(180deg)":"none",transition:"transform 0.3s"}}>▼</span>
                </button>
                {showHist&&(
                  <div className="space-y-2 animate-[fadeSlideIn_0.3s_ease-out]">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {history.map((h:any,i:number)=>(
                        <button key={h.id} onClick={()=>setHistIdx(i)}
                          className="flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all"
                          style={{
                            background:histIdx===i?`linear-gradient(135deg,${meta.color},${meta.color}cc)`:"rgba(0,0,0,0.03)",
                            border:histIdx===i?"none":`1px solid ${meta.color}20`,
                            boxShadow:histIdx===i?`0 4px 12px ${meta.color}40`:"none",
                          }}>
                          <p className="text-[9px] font-black" style={{color:histIdx===i?"white":meta.color}}>{h.main_result}</p>
                          <p className="text-[8px]" style={{color:histIdx===i?"rgba(255,255,255,0.7)":"#94a3b8"}}>
                            {new Date(h.completed_at).toLocaleDateString("fa-IR",{month:"short",day:"numeric"})}
                          </p>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-2xl p-3" style={{border:`1px solid ${meta.color}20`,background:`${meta.color}04`}}>
                      <TestResultVisualization
                        testId={id} testName={meta.name}
                        mainResult={history[histIdx]?.main_result||""}
                        scores={history[histIdx]?.scores||{}} compact={true}/>
                    </div>
                    {histIdx<history.length-1&&(
                      <div className="p-3 rounded-xl text-xs"
                        style={{background:`${meta.color}06`,border:`1px solid ${meta.color}15`}}>
                        {history[histIdx].main_result===history[histIdx+1].main_result
                          ?<span className="font-bold" style={{color:meta.color}}>نتیجه ثابت — ثبات شخصیتی ✓</span>
                          :<span className="text-slate-600">از <b style={{color:meta.color}}>{history[histIdx+1].main_result}</b> به <b style={{color:meta.color}}>{history[histIdx].main_result}</b></span>
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={getAI} disabled={loadingAI||!!aiText}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black text-white disabled:opacity-60 transition-all"
              style={{background:`linear-gradient(135deg,${meta.color},${meta.color}cc)`,
                boxShadow:`0 4px 16px ${meta.color}40`}}>
              {loadingAI?<RefreshCw size={12} className="animate-spin"/>:<Sparkles size={12}/>}
              {loadingAI?"در حال تحلیل...":aiText?"تحلیل دریافت شد ✓":"تحلیل هوش مصنوعی"}
            </button>

            {aiText&&(
              <div className="mt-3 p-4 rounded-2xl text-xs leading-7 text-slate-700"
                style={{background:`${meta.color}04`,border:`1px solid ${meta.color}15`}}>
                {aiText.split('\n').filter(Boolean).map((line,i)=>{
                  const isH2=line.startsWith('##');
                  const isH3=line.startsWith('###');
                  const isBullet=line.startsWith('-')||line.startsWith('•')||line.startsWith('*');
                  const text=line.replace(/^#+\s*/,'').replace(/^[-•*]\s*/,'').replace(/\*\*(.*?)\*\*/g,'$1');
                  if(isH3)return(<div key={i} className="flex items-center gap-2 mt-4 mb-1"><div className="w-1 h-4 rounded-full" style={{background:meta.color}}/><h4 className="font-black text-slate-800 text-sm">{text}</h4></div>);
                  if(isH2)return(<div key={i} className="mt-5 mb-2"><div className="flex items-center gap-2"><div className="w-1.5 h-5 rounded-full" style={{background:`linear-gradient(180deg,${meta.color},${meta.color}80)`}}/><h3 className="font-black text-slate-900 text-base">{text}</h3></div><div className="h-px mt-1.5" style={{background:`linear-gradient(90deg,${meta.color}30,transparent)`}}/></div>);
                  if(isBullet)return(<div key={i} className="flex items-start gap-2 mb-1.5 pr-2"><div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{background:meta.color}}/><p className="text-sm text-slate-600 leading-7">{text}</p></div>);
                  if(!text.trim())return<div key={i} className="h-2"/>;
                  return<p key={i} className="text-sm text-slate-600 leading-8 mb-1">{text}</p>;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── کامپوننت اصلی ────────────────────────────────────────────

function calcScoreFromResult(testName:string,scores:any,mainResult:string):number{
  return getTestProfileScore(testName, scores, mainResult);
}
// styles
const _styles = typeof document !== "undefined" && (() => {
  if(document.getElementById("trp-styles")) return;
  const s = document.createElement("style");
  s.id = "trp-styles";
  s.textContent = `
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  `;
  document.head.appendChild(s);
})();

export default function TestResultsProfile() {
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  
  // real-time sync
  useEffect(()=>{
    try {
      const ch=new BroadcastChannel("raavi_test_done");
      ch.onmessage=(e:any)=>{
        if(e.data?.testId){
          setResults((prev:any[])=>{
            const exists=prev.some((r:any)=>r.test_name===e.data.testId);
            if(exists) return prev;
            return [...prev,{test_name:e.data.testId,main_result:e.data.result,scores:e.data.scores,completed_at:new Date().toISOString()}];
          });
        }
        setTimeout(()=>{
          const tok=localStorage.getItem("token")||"";
          fetch(`${API}/api/test-results/my`,{headers:{Authorization:`Bearer ${tok}`}})
            .then(r=>r.ok?r.json():{}).then(d=>{
              const list=(d as any)?.results||(d as any)?.data||[];
              const seen=new Set<string>();
              setResults(list.filter((r:any)=>{const k=r.test_id||r.test_name;if(seen.has(k))return false;seen.add(k);return true;}));
            }).catch(()=>{});
        },700);
      };
      return ()=>ch.close();
    } catch {}
  },[]);

useEffect(()=>{
    const token=localStorage.getItem("token")||"";
    fetch(`${API}/api/test-results/my`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.ok?r.json():{}).then(d=>{
        const list=(d as any)?.results||(d as any)?.data||[];
        const seen=new Set<string>();
        const unique=list.filter((r:any)=>{
          const k=r.test_id||r.test_name;
          if(seen.has(k))return false;
          seen.add(k); return true;
        });
        setResults(unique);
      }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  if(loading)return(
    <div className="flex items-center gap-2 py-6 text-slate-500 text-sm">
      <RefreshCw size={14} className="animate-spin"/> بارگذاری نتایج...
    </div>
  );
  if(!results.length)return(
    <div className="py-8 text-center rounded-2xl bg-slate-50">
      <div className="text-3xl mb-3">🧪</div>
      <p className="text-slate-500 text-sm mb-3">هنوز تستی انجام نداده‌ای</p>
      <Link href="/dashboard/tests"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white"
        style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
        <Cpu size={13}/> شروع تست‌ها
      </Link>
    </div>
  );

  return(
    <div className="space-y-3">
      {results.map((r,i)=><TestCard key={r.id} result={r} index={i}/>)}
      <Link href="/dashboard/tests"
        className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold"
        style={{background:"rgba(255,107,0,0.06)",border:"1px solid rgba(255,107,0,0.15)",color:"#FF6B00"}}>
        مشاهده و انجام همه تست‌ها
      </Link>
    </div>
  );
}

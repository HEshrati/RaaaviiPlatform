"use client";
import { streamAI } from "@/lib/ai-stream";
import TestResultVisualization from "@/components/TestResultVisualization";
export const dynamic = "force-dynamic";
import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TESTS_BY_ID, ALL_TESTS } from "@/lib/tests-catalog";
import { normalizeTestScores } from "@/lib/test-result-scoring";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Cpu, Sparkles,
  AlertCircle, Zap, BookOpen, Calendar, TrendingUp, RefreshCw,
  ArrowRight, Clock, Star, RotateCcw, ArrowLeft, Award
} from "lucide-react";

const SITE = "https://raaviiplatform.com";
// raavi_matching_basis_v1 = اجباری اولین ورود — جزء ۵ تست اصلی نیست
const CORE = ["neo_ffi","ecr_r","erq","iri","gottman"];
const MANDATORY = "raavi_matching_basis_v1"; // اجباری ولی اصلی نه

const NEXT_TEST: Record<string,string> = {
  [MANDATORY]:"neo_ffi",
  "neo_ffi":"ecr_r","ecr_r":"erq","erq":"iri","iri":"gottman",
};

// تست‌های فرعی پیشنهادی بعد از هر تست اصلی
const RELATED_TESTS: Record<string,string[]> = {
  [MANDATORY]: ["hexaco","conflict_style","love_languages"],
  "neo_ffi":   ["hexaco","conflict_style","dass21"],
  "ecr_r":     ["isi","bai","dass21","phq9"],
  "erq":       ["bai","gad7","dass21"],
  "iri":       ["love_languages","conflict_style"],
  "gottman":   ["love_languages","sexual_compat","conflict_style"],
  "phq9":      ["dass21","bai","isi"],
  "gad7":      ["dass21","bai","isi"],
};

const TEST_COLORS: Record<string,string> = {
  [MANDATORY]:"#FF6B00", neo_ffi:"#a855f7", ecr_r:"#ef4444",
  erq:"#22c55e", iri:"#0ea5e9", gottman:"#f97316",
};

// ── subscale calculator ──────────────────────────────────────
function calcScores(testId:string, answers:Record<number,number>, qs:any[]) {
  const base:any = {answers, total: Object.values(answers).reduce((a:number,b:number)=>a+b,0)};
  const configuredMax=Math.max(...((TESTS_BY_ID[testId]?.options||[]).map(o=>o.value)),1);
  // helper: جمع سوالات خاص
  const sumQs=(qids:number[],reverse=false,scaleMax=configuredMax)=>
    qids.reduce((s,q)=>{const v=answers[q];return v!==undefined?s+(reverse?scaleMax+1-v:v):s;},0);
  // helper: درصد subscale
  const subPct=(qids:number[],scaleMax=5)=>{
    const vals=qids.map(q=>answers[q]).filter(v=>v!==undefined);
    return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/(vals.length*scaleMax)*100):0;
  };

  // ── NEO-FFI ──────────────────────────────────────────
  if (testId.includes("neo")) {
    const g:any={E:[],A:[],C:[],N:[],O:[]};
    const rev:any={E:[4,6],A:[10,12],C:[16,18],N:[20,22,24],O:[28,30]};
    qs.forEach((q:any)=>{if(!q.subscale||!(q.subscale in g))return;const v=answers[q.id];if(v===undefined)return;g[q.subscale].push(rev[q.subscale]?.includes(q.id)?6-v:v);});
    Object.entries(g).forEach(([k,vs]:any)=>{base[k]=vs.reduce((a:number,b:number)=>a+b,0);base[k+"_pct"]=Math.round(base[k]/30*100);});
  }

  // ── ECR-R ────────────────────────────────────────────
  if (testId.includes("ecr")) {
    const a:number[]=[],v:number[]=[];
    qs.forEach((q:any)=>{const val=answers[q.id];if(val===undefined)return;const n=q.reverse?8-val:val;if(q.subscale==="ANX")a.push(n);else if(q.subscale==="AVO")v.push(n);});
    base.ANX=a.reduce((a:number,b:number)=>a+b,0);
    base.AVO=v.reduce((a:number,b:number)=>a+b,0);
  }

  // ── ERQ ──────────────────────────────────────────────
  if (testId.includes("erq")) {
    const cr:number[]=[],es:number[]=[];
    qs.forEach((q:any)=>{const v=answers[q.id];if(v===undefined)return;if(q.subscale==="CR")cr.push(v);else if(q.subscale==="ES")es.push(v);});
    base.CR=cr.reduce((a:number,b:number)=>a+b,0);
    base.ES=es.reduce((a:number,b:number)=>a+b,0);
  }

  // ── IRI ──────────────────────────────────────────────
  if (testId.includes("iri")) {
    const g:any={EC:[],PT:[],FS:[],PD:[]};
    qs.forEach((q:any)=>{const v=answers[q.id];if(v===undefined)return;const n=q.reverse?6-v:v;if(q.subscale in g)g[q.subscale].push(n);});
    const IRI_SCALE=5; // likert5: 1-5
    base.EC=g.EC.reduce((a:number,b:number)=>a+b,0);
    base.PT=g.PT.reduce((a:number,b:number)=>a+b,0);
    base.PD=g.PD.length?g.PD.reduce((a:number,b:number)=>a+b,0):null;
    base.FS=g.FS.length?g.FS.reduce((a:number,b:number)=>a+b,0):null;
    base._EC_max=g.EC.length*IRI_SCALE;
    base._PT_max=g.PT.length*IRI_SCALE;
    base._PD_max=g.PD.length*IRI_SCALE;
    base._FS_max=g.FS.length*IRI_SCALE;
  }

  // ── MBTI / raavi_matching_basis_v1 ───────────────────
  if (testId.includes("matching_basis")||testId==="mbti") {
    const dim:any={E:[],I:[],N:[],S:[],T:[],F:[],J:[],P:[]};
    qs.forEach((q:any)=>{const v=answers[q.id];if(v===undefined)return;const sub=q.subscale?.toUpperCase();if(sub&&sub in dim)dim[sub].push(v);});
    const avg=(arr:number[])=>arr.length?arr.reduce((a:number,b:number)=>a+b,0)/arr.length:0;
    if(dim.E.length||dim.I.length){
      base.EI=Math.round((avg(dim.E)-avg(dim.I))*2)/2;
      base.SN=Math.round((avg(dim.N)-avg(dim.S))*2)/2;
      base.TF=Math.round((avg(dim.F)-avg(dim.T))*2)/2;
      base.JP=Math.round((avg(dim.J)-avg(dim.P))*2)/2;
    }
    const E=base.EI>=0?"E":"I",N=base.SN>=0?"N":"S";
    const F=base.TF>=0?"F":"T",J=base.JP>=0?"J":"P";
    base.mbtiType=`${E}${N}${F}${J}`;
  }

  // ── Conflict Style ───────────────────────────────────
  // collab:[1,6,10] compro:[2,9] avoid:[3,8] compete:[4,7] accom:[5]
  if (testId==="conflict_style") {
    base.collaborating =subPct([1,6,10]);
    base.competing     =subPct([4,7]);
    base.compromising  =subPct([2,9]);
    base.avoiding      =subPct([3,8]);
    base.accommodating =subPct([5]);
  }

  // ── Love Languages ───────────────────────────────────
  // words:[1,2] time:[3,4] gifts:[5,6] service:[7,8] touch:[9,10]
  if (testId==="love_languages") {
    base.words =sumQs([1,2]);
    base.time  =sumQs([3,4]);
    base.gifts =sumQs([5,6]);
    base.acts  =sumQs([7,8]); // service→acts
    base.touch =sumQs([9,10]);
    // max هر subscale = 2سوال × 5 = 10
    base._maxPerLang=10;
  }

  // ── HEXACO ───────────────────────────────────────────
  // H:[1-4](max20) E2:[5,6](max10) X:[7,8](max10) C2:[9,10](max10) O2:[11,12](max10)
  if (testId==="hexaco") {
    base.H  =sumQs([1,2,3,4]);
    base.E_h=sumQs([5,6]);
    base.X  =sumQs([7,8]);
    base.C  =sumQs([9,10]);
    base.O  =sumQs([11,12]);
  }

  // ── Gottman ──────────────────────────────────────────
  // criticism:[1,2] defensive:[3,4] stonewalling:[5,6] contempt:[7,8] empathy:[9,10] repair:[11,12]
  if (testId==="gottman") {
    base.criticism    =sumQs([1,2]);
    base.defensiveness=sumQs([3,4]);
    base.stonewalling =sumQs([5,6]);
    base.contempt     =sumQs([7,8]);
    base.empathy      =sumQs([9,10]);
    base.repair       =sumQs([11,12]);
  }

  // ── DASS-21 ──────────────────────────────────────────
  // D:[3,5,10,13,16,17,21] A:[2,4,7,9,15,19,20] S:[1,6,8,11,12,14,18]
  // scale: 0-3
  if (testId==="dass21") {
    base.D=sumQs([3,5,10,13,16,17,21],false,3);
    base.A=sumQs([2,4,7,9,15,19,20],false,3);
    base.S=sumQs([1,6,8,11,12,14,18],false,3);
    // DASS-21 نسخهٔ کوتاه است؛ برای تفسیر با آستانه‌های استاندارد، هر خرده‌مقیاس ×۲ می‌شود.
    base.D_standard=base.D*2;
    base.A_standard=base.A*2;
    base.S_standard=base.S*2;
    base.total_standard=(base.D+base.A+base.S)*2;
  }

  // Y-BOCS: همهٔ سؤال‌ها به‌صورت شدتِ علامت نوشته شده‌اند؛ مجموع مستقیم ۰ تا ۴۰ است.
  if (testId==="ybocs") {
    const ysum=(ids:number[])=>ids.reduce((acc,q)=>{
      const value=answers[q]??0;
      return acc+value;
    },0);
    base.obsession=ysum([1,2,3,4,5]);
    base.compulsion=ysum([6,7,8,9,10]);
    base.total=base.obsession+base.compulsion;
  }

  // ASRS-v1.1 Part A: تعداد پاسخ‌های مثبتِ آستانه‌ای، نه جمع سادهٔ لیکرت.
  if (testId==="asrs") {
    const thresholds=[2,2,2,3,3,3];
    base.asrs_positive_count=thresholds.reduce((count,threshold,index)=>count+(Number(answers[index+1]??0)>=threshold?1:0),0);
    base.inattention=sumQs([1,2,3,4],false,4);
    base.hyperactivity=sumQs([5,6],false,4);
  }

  // ── Sexual Compat ────────────────────────────────────
  // بدون subscale — 5 سوال × 5 دیمنشن
  if (testId==="sexual_compat") {
    const all=Object.entries(answers).sort(([a],[b])=>Number(a)-Number(b)).map(([,v])=>v as number);
    const n=Math.ceil(all.length/5);
    const pct=(sl:number[])=>sl.length?Math.round(sl.reduce((a,b)=>a+b,0)/(sl.length*5)*100):50;
    base.desire       =pct(all.slice(0,n));
    base.compatibility=pct(all.slice(n,n*2));
    base.communication=pct(all.slice(n*2,n*3));
    base.intimacy     =pct(all.slice(n*3,n*4));
    base.satisfaction =pct(all.slice(n*4));
  }

  // ── PID5 ─────────────────────────────────────────────
  // suspiciousness+withdrawal+anhedonia→detachment, emotional_lability→negative_affect
  // impulsivity+self_harm→disinhibition, eccentricity→psychoticism
  if (testId==="pid5") {
    base.negative_affect=sumQs([3,4,15]);
    base.detachment     =sumQs([7,8,9,10]);
    base.antagonism     =sumQs([1,2]);      // suspiciousness proxy
    base.disinhibition  =sumQs([5,6,13,14]);
    base.psychoticism   =sumQs([11,12]);
  }

  // ── YSQ ──────────────────────────────────────────────
  // abandonment:[1,2] mistrust:[3,4] dependence:[5,6] defectiveness:[7,8]
  // isolation:[9,10] unrelenting_standards:[11,12] entitlement:[13,14]
  // self_sacrifice:[15,16] approval_seeking:[17,18]
  if (testId==="ysq") {
    const schemas:any={
      abandonment:[1,2],mistrust:[3,4],dependence:[5,6],defectiveness:[7,8],
      isolation:[9,10],unrelenting_standards:[11,12],entitlement:[13,14],
      self_sacrifice:[15,16],approval_seeking:[17,18]
    };
    Object.entries(schemas).forEach(([k,qids]:any)=>{base[k]=sumQs(qids);});
  }

  return base;
}

function deriveTestMainResult(testId:string, scores:any, fallback:string) {
  if(testId==="neo_ffi") return "پروفایل پنج‌عاملی تکمیل شد";
  if(testId==="ecr_r") {
    const anx=Number(scores.ANX||0), avo=Number(scores.AVO||0);
    if(anx<36&&avo<36) return "سبک دلبستگی ایمن";
    if(anx>=36&&avo<36) return "سبک دلبستگی اضطرابی";
    if(anx<36&&avo>=36) return "سبک دلبستگی اجتنابی";
    return "سبک دلبستگی دوسوگرا";
  }
  if(testId==="erq") return Number(scores.CR||0)>=Number(scores.ES||0)?"بازارزیابی شناختی غالب":"سرکوب هیجان غالب";
  if(testId==="iri") return Number(scores.EC||0)>=Number(scores.PT||0)?"همدلی هیجانی غالب":"همدلی شناختی غالب";
  if(testId==="hexaco") return "پروفایل شخصیت کوتاه تکمیل شد";
  if(testId==="conflict_style") {
    const labels:any={collaborating:"همکارانه",competing:"رقابتی",compromising:"مصالحه",avoiding:"اجتنابی",accommodating:"سازگار"};
    return labels[Object.entries(labels).sort(([a],[b])=>Number(scores[b]||0)-Number(scores[a]||0))[0]?.[0]]||fallback;
  }
  if(testId==="love_languages") {
    const labels:any={words:"کلام تأییدی",time:"زمان باکیفیت",gifts:"هدیه",acts:"خدمت",touch:"تماس فیزیکی"};
    return labels[Object.entries(labels).sort(([a],[b])=>Number(scores[b]||0)-Number(scores[a]||0))[0]?.[0]]||fallback;
  }
  if(testId==="dass21") {
    const levels=[
      ["افسردگی",Number(scores.D_standard||0),[9,13,20,27]],
      ["اضطراب",Number(scores.A_standard||0),[7,9,14,19]],
      ["استرس",Number(scores.S_standard||0),[14,18,25,33]],
    ] as const;
    const rank=(v:number,c:number[])=>v<=c[0]?0:v<=c[1]?1:v<=c[2]?2:v<=c[3]?3:4;
    const highest=levels.map(([name,value,cuts])=>({name,level:rank(value,[...cuts])})).sort((a,b)=>b.level-a.level)[0];
    const text=["طبیعی","خفیف","متوسط","شدید","بسیار شدید"][highest.level];
    return `${highest.name}: ${text}`;
  }
  if(testId==="asrs") return Number(scores.asrs_positive_count||0)>=4?"غربالگری مثبت — ارزیابی تخصصی پیشنهاد می‌شود":"غربالگری منفی";
  if(testId==="mdq") {
    const symptomCount=Object.keys(scores.answers||{}).filter(k=>Number(k)<=13&&Number(scores.answers[k])===1).length;
    return symptomCount>=7&&Number(scores.answers?.[14])===1&&Number(scores.answers?.[15])===1
      ?"نیازمند ارزیابی بالینی":"زیر آستانهٔ غربالگری";
  }
  return fallback;
}

function Pentagon({dims,selected,onSelect,size=200}:{
  dims:{label:string;value:number;max:number;color:string}[];
  selected?:number|null; onSelect?:(i:number)=>void; size?:number;
}) {
  const [anim,setAnim]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAnim(true),400);return()=>clearTimeout(t);},[]);
  const n=dims.length; const cx=size/2; const cy=size/2; const r=size/2-22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{direction:"ltr"}}>
      {[.25,.5,.75,1].map((s,gi)=>{
        const pts=dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return `${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`;}).join(" ");
        return <polygon key={gi} points={pts} fill="none" stroke={gi===3?"rgba(0,0,0,0.12)":"rgba(0,0,0,0.05)"} strokeWidth={gi===3?1.5:1}/>;
      })}
      {dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,0.07)" strokeWidth={1}/>;
      })}
      <polygon
        points={dims.map((d,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;const p=anim?Math.min(d.value/d.max,1):0;return `${cx+r*p*Math.cos(a)},${cy+r*p*Math.sin(a)}`;}).join(" ")}
        fill="rgba(255,107,0,0.15)" stroke="#FF6B00" strokeWidth={2.5}
        style={{transition:"all 1.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      {dims.map((d,i)=>{
        const a=(i*2*Math.PI/n)-Math.PI/2; const p=anim?Math.min(d.value/d.max,1):0;
        const x=cx+r*p*Math.cos(a); const y=cy+r*p*Math.sin(a);
        const lx=cx+(r+18)*Math.cos(a); const ly=cy+(r+18)*Math.sin(a);
        const sel=selected===i;
        return (
          <g key={i} onClick={()=>onSelect?.(i)} style={{cursor:onSelect?"pointer":"default"}}>
            {sel&&<circle cx={x} cy={y} r={13} fill={d.color} opacity={0.15}/>}
            <circle cx={x} cy={y} r={sel?8:5} fill={d.color} stroke="white" strokeWidth={2.5}
              style={{transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
            <text x={lx} y={ly+4} textAnchor="middle"
              fill={sel?"#FF6B00":"#475569"} fontSize={sel?9:8} fontWeight={sel?"900":"700"}>
              {d.label}
            </text>
            {sel&&<text x={lx} y={ly+14} textAnchor="middle" fill={d.color} fontSize={8} fontWeight="700">
              {Math.round(d.value/d.max*100)}٪
            </text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── AnimBar ───────────────────────────────────────────────────
function AnimBar({pct,color,label,delay=0}:{pct:number;color:string;label:string;delay?:number}) {
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+200);return()=>clearTimeout(t);},[pct]);
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-xs font-black" style={{color}}>{pct}٪</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full relative overflow-hidden"
          style={{width:`${w}%`,background:`linear-gradient(90deg,${color}60,${color})`,
            transition:`width ${0.9+delay/1000}s cubic-bezier(0.34,1.56,0.64,1)`}}>
          <div className="absolute inset-0 bg-white/20 animate-pulse" style={{animationDuration:"2s"}}/>
        </div>
      </div>
    </div>
  );
}

// ── ResultGraphic ─────────────────────────────────────────────
function ResultGraphic({testId,scores,mainResult}:{testId:string;scores:any;mainResult:string}) {
  const [selDim,setSelDim]=useState<number|null>(null);
  const s=scores||{};

  if (testId.includes("matching_basis")||testId.includes("mbti")) {
    const MBTI_COLORS:any={ISTJ:"#1d4ed8",ISFJ:"#0369a1",INFJ:"#7c3aed",INTJ:"#4c1d95",
      ISTP:"#d97706",ISFP:"#b45309",INFP:"#059669",INTP:"#0284c7",
      ESTP:"#dc2626",ESFP:"#ea580c",ENFP:"#16a34a",ENTP:"#9333ea",
      ESTJ:"#1e40af",ESFJ:"#0891b2",ENFJ:"#15803d",ENTJ:"#6d28d9"};
    const type=(mainResult||"ISTJ").split(" ")[0].toUpperCase().slice(0,4);
    const color=MBTI_COLORS[type]||"#FF6B00";
    const toP=(v:number,r=3)=>Math.round(((Math.max(-r,Math.min(r,v))+r)/(r*2))*100);
    const dims=[
      {label:"E↔I",value:toP(s.EI??0,3),max:100,color:"#FF6B00"},
      {label:"S↔N",value:toP(s.SN??0,3),max:100,color:"#a855f7"},
      {label:"T↔F",value:toP(s.TF??0,3),max:100,color:"#ef4444"},
      {label:"J↔P",value:toP(s.JP??0,5),max:100,color:"#eab308"},
      {label:"ریتم",value:toP(s.PACE??0,3),max:100,color:"#22c55e"},
    ];
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl"
            style={{background:`linear-gradient(135deg,${color},${color}cc)`,boxShadow:`0 12px 32px ${color}40`}}>
            🧠
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-black text-sm text-white shadow"
            style={{background:color,whiteSpace:"nowrap"}}>{type}</div>
        </div>
        <div className="w-full pt-4">
          <Pentagon dims={dims} size={180} onSelect={i=>setSelDim(selDim===i?null:i)} selected={selDim}/>
        </div>
        {dims.map((d,i)=>(
          <AnimBar key={i} pct={d.value} color={d.color} label={["برون‌گرایی","شهودی","احساسی","قضاوتی","ریتم"][i]} delay={i*100}/>
        ))}
      </div>
    );
  }

  if (testId==="neo_ffi") {
    const MAX=30;
    const dims=[
      {label:"E",full:"برون‌گرایی",value:s.E??15,max:MAX,color:"#FF6B00"},
      {label:"A",full:"توافق‌پذیری",value:s.A??15,max:MAX,color:"#22c55e"},
      {label:"C",full:"وظیفه‌شناسی",value:s.C??15,max:MAX,color:"#3b82f6"},
      {label:"N",full:"روان‌رنجوری",value:s.N??15,max:MAX,color:"#ef4444"},
      {label:"O",full:"گشودگی",value:s.O??15,max:MAX,color:"#a855f7"},
    ];
    return (
      <div>
        <div className="flex justify-center">
          <Pentagon dims={dims} size={200} onSelect={i=>setSelDim(selDim===i?null:i)} selected={selDim}/>
        </div>
        {selDim!==null&&(
          <div className="my-3 p-3 rounded-2xl border-2" style={{borderColor:dims[selDim].color+"30",background:dims[selDim].color+"06"}}>
            <p className="text-xs font-black mb-2" style={{color:dims[selDim].color}}>{dims[selDim].full}</p>
            <Pentagon dims={[
              {label:"بالا",value:dims[selDim].value,max:MAX,color:dims[selDim].color},
              {label:"میانه",value:MAX/2,max:MAX,color:dims[selDim].color},
              {label:"پایین",value:MAX-dims[selDim].value,max:MAX,color:dims[selDim].color},
            ]} size={120}/>
          </div>
        )}
        {dims.map((d,i)=><AnimBar key={i} pct={Math.round(d.value/MAX*100)} color={d.color} label={d.full} delay={i*80}/>)}
        <p className="text-[10px] text-slate-400 text-center mt-2">روی نقاط کلیک کن → جزئیات</p>
      </div>
    );
  }

  if (testId==="ecr_r") {
    const MAX=63; const anx=s.ANX??31; const avo=s.AVO??31;
    const style=(anx<36&&avo<36)?"ایمن 💚":(anx>=36&&avo<36)?"اضطرابی ⚠️":(anx<36&&avo>=36)?"اجتنابی 🔵":"بی‌سازمان ❗";
    return (
      <div>
        <div className="text-center p-4 rounded-2xl mb-4 font-black text-lg"
          style={{background:"rgba(239,68,68,0.06)",border:"2px solid rgba(239,68,68,0.15)",color:"#ef4444"}}>
          {style}
        </div>
        <Pentagon dims={[
          {label:"اضطراب",value:anx,max:MAX,color:"#ef4444"},
          {label:"اجتناب",value:avo,max:MAX,color:"#3b82f6"},
          {label:"ایمنی",value:MAX-anx,max:MAX,color:"#22c55e"},
          {label:"پیوند",value:MAX/2,max:MAX,color:"#f97316"},
          {label:"اعتماد",value:MAX/2,max:MAX,color:"#a855f7"},
        ]} size={180}/>
        <AnimBar pct={Math.round(anx/MAX*100)} color="#ef4444" label="اضطراب دلبستگی"/>
        <AnimBar pct={Math.round(avo/MAX*100)} color="#3b82f6" label="اجتناب دلبستگی" delay={100}/>
      </div>
    );
  }

  if (testId==="erq") {
    const cr=s.CR??21; const es=s.ES??14;
    return (
      <div>
        <Pentagon dims={[
          {label:"بازارزیابی",value:cr,max:35,color:"#22c55e"},
          {label:"سرکوب",value:es,max:35,color:"#ef4444"},
        ]} size={180}/>
        <AnimBar pct={Math.round(cr/35*100)} color="#22c55e" label="بازارزیابی شناختی"/>
        <AnimBar pct={Math.round(es/35*100)} color="#ef4444" label="سرکوب هیجان" delay={100}/>
      </div>
    );
  }

  if (testId==="iri") {
    const ec=s.EC??15; const pt=s.PT??12; const pd=s.PD??3;
    return (
      <div>
        <Pentagon dims={[
          {label:"همدلی عاطفی",value:ec,max:25,color:"#ec4899"},
          {label:"دیدگاه‌گیری",value:pt,max:20,color:"#3b82f6"},
          {label:"پریشانی شخصی",value:pd,max:5,color:"#ef4444"},
        ]} size={180}/>
        <AnimBar pct={Math.round(ec/25*100)} color="#ec4899" label="همدلی عاطفی"/>
        <AnimBar pct={Math.round(pt/20*100)} color="#3b82f6" label="دیدگاه‌گیری" delay={100}/>
      </div>
    );
  }

  // Generic
  const total=s.total??0;
  return (
    <div className="text-center py-4">
      <div className="text-4xl font-black text-slate-900 mb-2">{mainResult}</div>
      {total>0&&<AnimBar pct={Math.min(100,total)} color="#FF6B00" label="امتیاز"/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function TestPage({params}:{params:Promise<{id:string}>}) {
  const {id}=use(params);
  const router=useRouter();
  const test=TESTS_BY_ID[id] || (id===MANDATORY ? TESTS_BY_ID["mbti"] : null);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [current,setCurrent]=useState(0);
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [prevResult,setPrevResult]=useState<any>(null);
  const [showRetake,setShowRetake]=useState(false);
  const [doneTests,setDoneTests]=useState<string[]>([]);
  const [saveError,setSaveError]=useState<string|null>(null);
  const [result,setResult]=useState("");
  const [aiText,setAiText]=useState("");
  const [loadingAI,setLoadingAI]=useState(false);
  const [selDim,setSelDim]=useState<number|null>(null);
  const [articles,setArticles]=useState<any[]>([]);
  const [events,setEvents]=useState<any[]>([]);
  const [animQ,setAnimQ]=useState(true);
  const [finalScores,setFinalScores]=useState<any>({});
  const [showCompare,setShowCompare]=useState(false);

  useEffect(()=>{
    const token=typeof window!=="undefined"?localStorage.getItem("token")||"":"";
    if(!token){router.replace("/login");return;}
    fetch(`${SITE}/api/test-results/my`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.ok?r.json():{}).then(d=>{
        const list=(d as any)?.results||(d as any)?.data||[];
        setDoneTests(list.map((x:any)=>x.test_name));
        // چک تست قبلی
        const prev=list.find((x:any)=>x.test_name===id);
        if(prev)setPrevResult(prev);
      });
  },[]);

  // اگه تست قبلاً انجام شده → صفحه انتخاب
  useEffect(()=>{
    if(prevResult&&!done&&Object.keys(answers).length===0){
      setShowRetake(true);
    }
  },[prevResult]);

  if(!test) return (
    <div className="min-h-screen flex flex-col items-center justify-center" dir="rtl">
      <Cpu size={40} className="text-slate-200 mb-4"/>
      <p className="text-slate-700 font-bold mb-4">تست پیدا نشد</p>
      <Link href="/dashboard/tests" className="text-orange-500 text-sm">← بازگشت</Link>
    </div>
  );

  const questions=test.questions||[];
  const q=questions[current];
  const total=questions.length;
  const progressPct=Math.round(((current+1)/total)*100);
  const isCore=CORE.includes(id);
  const isMandatory=id===MANDATORY;

  async function finishTest() {
    const freshToken=typeof window!=="undefined"?localStorage.getItem("token")||"":"";
    setSaving(true);setSaveError(null);
    try{localStorage.setItem(`raavi_test_backup_${id}`,JSON.stringify({answers,ts:Date.now()}));}catch{}
    const totalScore=Object.values(answers).reduce((a:number,b:number)=>a+b,0);
    // Derived scores are rebuilt once from raw answers; profile and compatibility
    // use this exact same formula.
    const scores=normalizeTestScores(id,calcScores(id,answers,questions));
    setFinalScores(scores);
    const range=test.scoring?.ranges?.find((r:any)=>totalScore>=r.min&&totalScore<=r.max)
      ||test.scoring?.ranges?.[test.scoring?.ranges?.length-1];
    // برای MBTI — تیپ واقعی رو استفاده کن
    const isMBTI=(id.includes("matching_basis")||id==="mbti");
    const mbtiType=isMBTI?scores?.mbtiType:null;

    // گاتمان — main_result براساس الگوی غالب
    let gottmanResult:string|null=null;
    if(id==="gottman"){
      const horsemen={
        criticism:   scores.criticism??0,
        contempt:    scores.contempt??0,
        defensiveness:scores.defensiveness??0,
        stonewalling:scores.stonewalling??0,
      };
      const labels:Record<string,string>={
        criticism:"انتقاد",contempt:"تحقیر",
        defensiveness:"دفاعی‌بودن",stonewalling:"سنگ‌شدن"
      };
      const total4=horsemen.criticism+horsemen.contempt+horsemen.defensiveness+horsemen.stonewalling;
      // اگه نمره کل پایینه — رابطه سالم
      if(total4<=8){
        gottmanResult="رابطه سالم";
      } else {
        // غالب‌ترین الگو
        const dominant=Object.entries(horsemen).sort(([,a],[,b])=>b-a)[0][0];
        gottmanResult=labels[dominant]||"نیاز به بهبود";
      }
    }

    const mainResult=mbtiType||gottmanResult||deriveTestMainResult(id,scores,range?.label||"completed");
    setResult(mainResult);
    // ── ذخیره تست با retry ──────────────────────────
    let saved=false;
    for(let attempt=0;attempt<3;attempt++){
      try {
        const res=await fetch(`${SITE}/api/test-results`,{
          method:"POST",
          headers:{"Content-Type":"application/json",Authorization:`Bearer ${freshToken}`},
          body:JSON.stringify({test_id:id,test_name:id,main_result:mainResult,scores,total_score:totalScore}),
        });
        if(res.ok||res.status===201||res.status===200){saved=true;break;}
        if(res.status===401){router.replace("/login");return;}
        await new Promise(r=>setTimeout(r,500*(attempt+1)));
      } catch { await new Promise(r=>setTimeout(r,500*(attempt+1))); }
    }
    if(!saved){
      setSaveError("خطا در ذخیره — لطفاً دوباره تلاش کنید");
      setSaving(false);
      return; // برنگرد — کاربر باید retry کنه
    }
    // اگه MBTI اجباری بود — sessionStorage و cookie ست کن تا guard بلاک نکنه
    if(id==="raavi_matching_basis_v1"||id==="mbti"){
      sessionStorage.setItem("raavi_mbti_done","1");
      // cookie برای middleware — فوری ست میشه قبل از redirect
      document.cookie = "mbti_done=1; path=/; max-age=31536000; SameSite=Lax";
      // ✅ isTestTaken رو روی سرور true کن تا CTAButton درست کار کنه
      fetch(`${SITE}/api/auth/mark-test-taken`,{
        method:"POST",
        headers:{Authorization:`Bearer ${freshToken}`}
      }).catch(()=>{});
    }
    // فوری آپدیت doneTests
    setDoneTests(prev=>[...new Set([...prev,id])]);
    setSaving(false);setDone(true);
    // فوری broadcast
    try {
      const ch=new BroadcastChannel("raavi_test_done");
      ch.postMessage({testId:id,result:mainResult,scores,timestamp:Date.now()});
      setTimeout(()=>ch.close(),2000);
    } catch {}
    localStorage.setItem("last_test_done",JSON.stringify({testId:id,result:mainResult,ts:Date.now()}));
    // sync در background + آپدیت doneTests
    setTimeout(async ()=>{
      await fetch(`${SITE}/api/intelligence/sync`,{method:"POST",headers:{Authorization:`Bearer ${freshToken}`}}).catch(()=>{});
      fetch(`${SITE}/api/test-results/my`,{headers:{Authorization:`Bearer ${freshToken}`}})
        .then(r=>r.ok?r.json():{}).then(d=>{
          const list=(d as any)?.results||(d as any)?.data||[];
          setDoneTests(list.map((x:any)=>x.test_name));
        }).catch(()=>{});
    }, 1200);

    // ── پیشنهادات ──────────────────────────────────────
    const catMap:any={neo_ffi:"رشد فردی",ecr_r:"روابط سالم",erq:"هوش هیجانی",iri:"هوش هیجانی",
      gottman:"روابط سالم",[MANDATORY]:"خودشناسی"};
    const cat=catMap[id]||"رشد فردی";
    fetch(`${SITE}/api/content/articles?limit=3&category=${encodeURIComponent(cat)}`)
      .then(r=>r.ok?r.json():[]).then(d=>{setArticles(Array.isArray(d)?d:(d?.data||[]));}).catch(()=>{});
    fetch(`${SITE}/api/events?limit=3`)
      .then(r=>r.ok?r.json():{}).then(d=>{setEvents(((d as any)?.events||(d as any)?.data||[]).slice(0,3));}).catch(()=>{});

    // ── redirect بعد از تست اجباری → تست دوم (neo_ffi) ──────
    if(id==="raavi_matching_basis_v1"||id==="mbti"){
      setTimeout(()=>{ window.location.href="/dashboard/tests/neo_ffi"; },4500);
    }
  }

  async function getAI() {
    if(loadingAI)return; setLoadingAI(true);
    try {
      const r=await fetch("/api/ai",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${localStorage.getItem("token")||""}`,
        },
        body:JSON.stringify({model:"gpt-4o",max_tokens:600,messages:[{role:"user",
          content:`تفسیر تست روانشناسی "${test.name}" با نتیجه "${result}" به فارسی. دقیقاً با این فرمت:\n\n## معنای نتیجه\n[۲ پاراگراف توضیح]\n\n## نقاط قوت\n- [۳ مورد با خط تیره]\n\n## زمینه‌های رشد\n- [۲ مورد با خط تیره]\n\n## توصیه عملی\n[۱ پاراگراف راهکار]`}]})
      });
      const d=await r.json();
      const txt=d.choices?.[0]?.message?.content||"";
      setAiText(txt||"تفسیر موجود نیست.");
    } catch {setAiText("خطا در دریافت تفسیر.");}
    setLoadingAI(false);
  }

  function selectAnswer(val:number) {
    // فقط ذخیره جواب — بدون auto-advance
    setAnswers(a=>({...a,[q.id]:val}));
  }
  function goPrev(){if(current>0){setAnimQ(false);setTimeout(()=>{setCurrent(c=>c-1);setAnimQ(true);},180);}}

  const nextTestId=NEXT_TEST[id]; const nextTest=nextTestId?TESTS_BY_ID[nextTestId]:null;
  const CORE_ALL=[MANDATORY,...CORE];
  const coreCompleted=CORE_ALL.filter(t=>doneTests.includes(t)||(t===id&&done)).length;
  const coreTotal=CORE_ALL.length;

  // ── صفحه re-take ──────────────────────────────────────────
  if(showRetake&&!done) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{background:"rgba(255,107,0,0.1)",border:"2px solid rgba(255,107,0,0.2)"}}>
            <RotateCcw size={32} className="text-orange-500"/>
          </div>
          <h2 className="text-slate-900 font-black text-xl mb-2">این تست رو قبلاً دادی!</h2>
          <p className="text-slate-500 text-sm mb-4">{test.name}</p>
          {prevResult&&(
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-2"
              style={{background:"rgba(255,107,0,0.06)",border:"1px solid rgba(255,107,0,0.15)"}}>
              <span className="text-orange-600 font-black">نتیجه قبلی: {prevResult.main_result}</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <button onClick={()=>setShowRetake(false)}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3"
            style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",boxShadow:"0 4px 16px rgba(255,107,0,0.3)"}}>
            <RotateCcw size={18}/> تست مجدد و مقایسه
          </button>
          <Link href="/dashboard"
            className="w-full py-3 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2"
            style={{background:"rgba(0,0,0,0.04)"}}>
            <ArrowLeft size={16}/> بازگشت به داشبورد
          </Link>
          <Link href="/dashboard/compatibility"
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            style={{background:"rgba(30,58,95,0.06)",color:"#1e3a5f"}}>
            مشاهده پروفایل سازگاری
          </Link>
        </div>
      </div>
    </div>
  );

  // ── صفحه نتیجه ─────────────────────────────────────────────
  if(done) return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24" dir="rtl">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",boxShadow:"0 12px 40px rgba(255,107,0,0.35)"}}>
              <CheckCircle2 size={42} className="text-white"/>
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-base">🎉</div>
          </div>
          <h2 className="text-slate-900 font-black text-2xl mb-1">
            {prevResult?"تست مجدد کامل شد!":"آفرین! تست کامل شد"}
          </h2>
          <p className="text-slate-500 text-sm">{test.name}</p>
          {result&&result!=="completed"&&(
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl mt-3"
              style={{background:"rgba(255,107,0,0.08)",border:"2px solid rgba(255,107,0,0.25)"}}>
              <span className="text-orange-600 font-black text-xl">{result}</span>
            </div>
          )}
          {saveError&&(
            <div className="mt-3 p-4 rounded-2xl text-center"
              style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}>
              <p className="text-red-600 text-sm font-bold mb-3">⚠️ {saveError}</p>
              <button onClick={finishTest} disabled={saving}
                className="w-full py-3 rounded-2xl text-white font-black text-sm"
                style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",touchAction:"manipulation"}}>
                {saving?"در حال ذخیره...":"🔄 تلاش مجدد"}
              </button>
            </div>
          )}
        </div>

        {/* مقایسه با قبلی */}
        {prevResult&&(
          <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-orange-100">
            <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-500"/> مقایسه با نتیجه قبلی
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-2xl text-center bg-slate-50">
                <p className="text-[10px] text-slate-400 mb-1">قبلی</p>
                <p className="font-black text-slate-700">{prevResult.main_result}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(prevResult.completed_at).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <ArrowRight size={16} className="text-slate-300"/>
              <div className="flex-1 p-3 rounded-2xl text-center"
                style={{background:"rgba(255,107,0,0.06)",border:"1px solid rgba(255,107,0,0.2)"}}>
                <p className="text-[10px] text-orange-400 mb-1">جدید</p>
                <p className="font-black text-orange-600">{result}</p>
                <p className="text-[10px] text-orange-400 mt-1">همین الان</p>
              </div>
            </div>
            <button onClick={()=>setShowCompare(!showCompare)}
              className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-orange-500"
              style={{background:"rgba(255,107,0,0.05)"}}>
              {showCompare?"بستن":"تحلیل تفاوت‌ها"}
            </button>
            {showCompare&&(
              <div className="mt-3 p-3 rounded-xl text-xs text-slate-600 leading-7 bg-slate-50">
                <p className="font-bold mb-1">📊 تحلیل تغییر:</p>
                {result===prevResult.main_result
                  ?"نتیجه تست یکسان است. این نشانه ثبات شخصیتی شماست."
                  :`نتیجه از "${prevResult.main_result}" به "${result}" تغییر کرد. این تغییر می‌تواند نشان‌دهنده رشد و تحول باشد.`}
              </div>
            )}
          </div>
        )}

        {/* گرافیک نتیجه */}
        <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
          <h3 className="text-slate-900 font-black text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-orange-500"/> نمودار نتیجه
          </h3>
          <TestResultVisualization testId={id} testName={test.name} mainResult={result} scores={finalScores}/>
        </div>

        {/* تفسیر AI */}
        <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-orange-500"/> تفسیر هوشمند
            </h3>
            {!aiText&&(
              <button onClick={getAI} disabled={loadingAI}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-50"
                style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
                {loadingAI?<RefreshCw size={11} className="animate-spin"/>:<Zap size={11}/>}
                {loadingAI?"تحلیل...":"تفسیر AI"}
              </button>
            )}
          </div>
          {aiText?(
            <div className="text-sm leading-8 text-slate-700">
              {aiText.split('\n').filter(Boolean).map((line,i)=>{
                const isH2 = line.startsWith('##');
                const isH3 = line.startsWith('###');
                const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
                const text = line.replace(/^#+\s*/,'').replace(/^[-•*]\s*/,'').replace(/\*\*(.*?)\*\*/g,'$1');
                if(isH3) return (
                  <div key={i} className="flex items-center gap-2 mt-4 mb-1">
                    <div className="w-1 h-4 rounded-full" style={{background:"#FF6B00"}}/>
                    <h4 className="font-black text-slate-800 text-sm">{text}</h4>
                  </div>
                );
                if(isH2) return (
                  <div key={i} className="mt-5 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 rounded-full" style={{background:"linear-gradient(180deg,#FF6B00,#f97316)"}}/>
                      <h3 className="font-black text-slate-900 text-base">{text}</h3>
                    </div>
                    <div className="h-px bg-gradient-to-l from-transparent to-orange-100 mt-1.5"/>
                  </div>
                );
                if(isBullet) return (
                  <div key={i} className="flex items-start gap-2 mb-1.5 pr-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{background:"#FF6B00"}}/>
                    <p className="text-sm text-slate-600 leading-7">{text}</p>
                  </div>
                );
                if(!text.trim()) return <div key={i} className="h-2"/>;
                return <p key={i} className="text-sm text-slate-600 leading-8 mb-1">{text}</p>;
              })}
            </div>
          ):<p className="text-slate-400 text-xs">روی دکمه بزنید تا تفسیر هوشمند دریافت کنید</p>}
        </div>

        {/* پیشرفت core tests */}
        {!isMandatory&&(
          <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
                <Award size={14} className="text-orange-500"/> تست‌های اصلی
              </h3>
              <span className="font-black text-sm" style={{color:coreCompleted>=coreTotal?"#22c55e":"#FF6B00"}}>
                {coreCompleted}/{coreTotal}
              </span>
            </div>
            <div className="flex gap-1.5 mb-3">
              {CORE_ALL.map(t=>{
                const done2=doneTests.includes(t)||t===id;
                return <div key={t} className="flex-1 h-2.5 rounded-full transition-all duration-700"
                  style={{background:done2?"linear-gradient(90deg,#22c55e,#10b981)":"rgba(0,0,0,0.07)"}}/>;
              })}
            </div>
            {CORE.filter(t=>!doneTests.includes(t)&&t!==id).slice(0,2).map(t=>{
              const td=TESTS_BY_ID[t];
              return <Link key={t} href={`/dashboard/tests/${t}`}
                className="flex items-center justify-between p-3 rounded-2xl mb-2"
                style={{background:"rgba(255,107,0,0.04)",border:"1px solid rgba(255,107,0,0.1)"}}>
                <span className="text-slate-700 text-xs font-bold">{td?.name||t}</span>
                <span className="text-orange-500 text-xs font-bold">انجام ←</span>
              </Link>;
            })}
          </div>
        )}

        {/* تست‌های فرعی پیشنهادی */}
        {(()=>{
          const related=(RELATED_TESTS[id]||[]).filter(t=>!doneTests.includes(t));
          if(!related.length) return null;
          return (
            <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
              <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
                <span className="text-lg">🔬</span> تست‌های پیشنهادی برای شما
                <span className="text-xs text-slate-400 font-normal">بر اساس نتیجه این تست</span>
              </h3>
              <div className="flex flex-col gap-2">
                {related.slice(0,3).map(t=>{
                  const td=TESTS_BY_ID[t];
                  if(!td) return null;
                  return (
                    <Link key={t} href={`/dashboard/tests/${t}`}
                      className="flex items-center justify-between p-3 rounded-2xl border transition-all"
                      style={{background:"rgba(99,102,241,0.04)",border:"1px solid rgba(99,102,241,0.15)"}}>
                      <div>
                        <p className="text-slate-800 text-xs font-black">{td.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{td.description||"تست تکمیلی"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-500 text-xs font-bold">
                        شروع <span>←</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* لینک سازگاری */}
        <Link href="/dashboard/compatibility"
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl mb-4 text-white"
          style={{background:"linear-gradient(135deg,#1e3a5f,#2d5a8e)",boxShadow:"0 4px 20px rgba(30,58,95,0.2)"}}>
          <div><p className="font-black text-sm">پروفایل سازگاری</p><p className="text-white/60 text-xs">نمودار کامل ابعاد</p></div>
          <ChevronLeft size={20}/>
        </Link>

        {/* مقالات */}
        {articles.length>0&&(
          <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
            <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
              <BookOpen size={14} className="text-orange-500"/> مقالات مرتبط
            </h3>
            {articles.map((a:any)=>(
              <Link key={a.id} href={`/articles/${a.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all mb-1">
                <span className="text-lg">📖</span>
                <p className="text-slate-700 font-bold text-xs flex-1 line-clamp-1">{a.title}</p>
                <ChevronLeft size={11} className="text-slate-300"/>
              </Link>
            ))}
          </div>
        )}

        {/* ایونت‌ها */}
        {events.length>0&&(
          <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100">
            <h3 className="text-slate-900 font-black text-sm mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-orange-500"/> رویدادهای پیشنهادی
            </h3>
            {events.map((ev:any)=>(
              <Link key={ev.id} href={`/events/${ev.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 mb-1">
                <span className="text-lg">🎉</span>
                <p className="text-slate-700 font-bold text-xs flex-1 line-clamp-1">{ev.title}</p>
                <ChevronLeft size={11} className="text-slate-300"/>
              </Link>
            ))}
            <Link href="/events/recommended"
              className="flex items-center justify-center gap-1 py-2 text-xs font-bold text-orange-500">
              همه رویدادها <ArrowRight size={10}/>
            </Link>
          </div>
        )}

        {/* nav */}
        <div className="space-y-3 pb-8">
          {nextTest&&!doneTests.includes(nextTestId!)&&(
            <Link href={`/dashboard/tests/${nextTestId}`}
              className="flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white font-black"
              style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",boxShadow:"0 4px 16px rgba(255,107,0,0.3)"}}>
              <div><p className="text-sm">تست بعدی</p><p className="text-white/70 text-xs">{nextTest.name}</p></div>
              <ChevronLeft size={20}/>
            </Link>
          )}
          <Link href="/dashboard/tests"
            className="flex items-center justify-center w-full px-5 py-3 rounded-2xl text-sm font-bold text-slate-600"
            style={{background:"rgba(0,0,0,0.04)"}}>
            بازگشت به همه تست‌ها
          </Link>
        </div>
      </div>
    </div>
  );

  // ── صفحه سوالات ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/96 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isCore&&<span className="text-[10px] px-2 py-0.5 rounded-full font-black text-white"
                style={{background:"linear-gradient(135deg,#22c55e,#10b981)"}}>اصلی</span>}
              {isMandatory&&<span className="text-[10px] px-2 py-0.5 rounded-full font-black text-white"
                style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>اجباری</span>}
              <span className="text-slate-800 font-black text-sm truncate max-w-[160px]">{test.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={10}/>{test.estimatedMinutes} دقیقه</span>
              <span className="font-black text-slate-700">{current+1}<span className="text-slate-400 font-normal">/{total}</span></span>
            </div>
          </div>
          {/* progress bar */}
          <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="absolute right-0 top-0 h-full rounded-full"
              style={{width:`${progressPct}%`,background:"linear-gradient(90deg,#FF6B00,#f97316)",
                transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          </div>
          {/* dot steps */}
          <div className="flex justify-center gap-1 mt-2 flex-wrap">
            {Array.from({length:Math.min(total,15)}).map((_,i)=>{
              const qi=Math.round(i/Math.min(total,15)*total);
              const answered=questions[qi]&&answers[questions[qi].id]!==undefined;
              const isCur=Math.abs(i-Math.round((current/total)*Math.min(total,15)))<1;
              return <div key={i} className="rounded-full transition-all duration-300"
                style={{width:isCur?"18px":"5px",height:"5px",
                  background:answered?"#FF6B00":isCur?"rgba(255,107,0,0.3)":"rgba(0,0,0,0.08)"}}/>;
            })}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8"
        style={{opacity:animQ?1:0,transform:animQ?"translateY(0)":"translateY(12px)",
          transition:"opacity 0.2s ease, transform 0.2s ease"}}>
        {/* شماره + سوال */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-lg"
              style={{background:`linear-gradient(135deg,${TEST_COLORS[id]||"#FF6B00"},${TEST_COLORS[id]||"#FF6B00"}cc)`,
                boxShadow:`0 4px 16px ${TEST_COLORS[id]||"#FF6B00"}40`}}>
              {current+1}
            </div>
            <p className="text-slate-900 font-bold text-base leading-8 pt-2">{q?.text}</p>
          </div>
          {q?.subscale&&(
            <span className="mr-14 text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{background:`${TEST_COLORS[id]||"#FF6B00"}12`,color:TEST_COLORS[id]||"#FF6B00"}}>
              {q.subscale}
            </span>
          )}
        </div>

        {/* گزینه‌ها */}
        <div className="space-y-3">
          {((q as any)?.options||test.options||[]).map((opt:any,oi:number)=>{
            const sel=answers[q?.id]===opt.value;
            return (
              <button key={opt.value}
                onClick={()=>selectAnswer(opt.value)}
                onTouchEnd={(e)=>{e.preventDefault();selectAnswer(opt.value);}}
                className="w-full text-right px-5 py-4 rounded-2xl flex items-center gap-4 group"
                style={{touchAction:"manipulation",
                  background:sel?`${TEST_COLORS[id]||"#FF6B00"}08`:"#f8fafc",
                  border:`2px solid ${sel?TEST_COLORS[id]+"50"||"#FF6B0050":"rgba(0,0,0,0.06)"}`,
                  boxShadow:sel?`0 4px 20px ${TEST_COLORS[id]||"#FF6B00"}15`:"0 1px 3px rgba(0,0,0,0.04)",
                  transform:sel?"scale(1.015)":"scale(1)",
                  transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background:sel?TEST_COLORS[id]||"#FF6B00":"rgba(0,0,0,0.06)",
                    border:sel?"none":"2px solid rgba(0,0,0,0.1)",
                    boxShadow:sel?`0 4px 12px ${TEST_COLORS[id]||"#FF6B00"}40`:"none",
                  }}>
                  {sel?<CheckCircle2 size={14} className="text-white"/>
                    :<span className="text-[10px] text-slate-400 font-black">{oi+1}</span>}
                </div>
                <span className="text-sm font-bold flex-1 transition-colors"
                  style={{color:sel?TEST_COLORS[id]||"#FF6B00":"#374151"}}>
                  {opt.label}
                </span>
                {sel&&<div className="w-2 h-2 rounded-full animate-ping"
                  style={{background:TEST_COLORS[id]||"#FF6B00"}}/>}
              </button>
            );
          })}
        </div>

        {/* توضیح اول */}
        {current===0&&test.description&&(
          <div className="mt-8 p-4 rounded-2xl border"
            style={{background:`${TEST_COLORS[id]||"#FF6B00"}06`,borderColor:`${TEST_COLORS[id]||"#FF6B00"}20`}}>
            <div className="flex items-start gap-2">
              <Star size={14} className="mt-0.5 flex-shrink-0" style={{color:TEST_COLORS[id]||"#FF6B00"}}/>
              <div>
                <p className="font-bold text-xs mb-1" style={{color:TEST_COLORS[id]||"#FF6B00"}}>{test.name}</p>
                <p className="text-slate-600 text-xs leading-6">{test.description}</p>
                <p className="text-xs mt-1 font-bold" style={{color:TEST_COLORS[id]||"#FF6B00"}}>
                  {total} سوال · {test.estimatedMinutes} دقیقه
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* footer nav */}
      <div className="sticky bottom-0 bg-white/96 backdrop-blur-sm border-t border-slate-100 px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={goPrev} disabled={current===0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 transition-all"
            style={{background:"rgba(0,0,0,0.04)",color:"#64748b"}}>
            <ChevronRight size={15}/> قبلی
          </button>
          <span className="text-xs text-slate-400">
            {Object.keys(answers).length}/{total} پاسخ
          </span>
          <button
            onClick={answers[q?.id]!==undefined&&current===total-1?finishTest:()=>{
              if(answers[q?.id]!==undefined){setAnimQ(false);setTimeout(()=>{setCurrent(c=>c+1);setAnimQ(true);},200);}
            }}
            disabled={answers[q?.id]===undefined||saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all"
            style={{
              background:answers[q?.id]!==undefined?`linear-gradient(135deg,${TEST_COLORS[id]||"#FF6B00"},${TEST_COLORS[id]||"#f97316"})`:"rgba(0,0,0,0.15)",
              boxShadow:answers[q?.id]!==undefined?`0 4px 16px ${TEST_COLORS[id]||"#FF6B00"}40`:"none",
            }}>
            {saving?<RefreshCw size={13} className="animate-spin"/>:null}
            {saving?"ذخیره...":current===total-1?"پایان":"بعدی"}
            {!saving&&<ChevronLeft size={15}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

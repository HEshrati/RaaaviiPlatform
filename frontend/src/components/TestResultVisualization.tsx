"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { streamAI } from "@/lib/ai-stream";
import { normalizeTestScores } from "@/lib/test-result-scoring";


// ── انیمیشن utilities ──────────────────────────────────────

// ── زیربعدهای هر بُعد اصلی ────────────────────────────────
const SUB_DIMS_MAP: Record<string, Record<string, {label:string;desc:string;score?:number}[]>> = {
  neo_ffi: {
    "E": [
      {label:"تسلط",desc:"تمایل به رهبری و کنترل"},
      {label:"جمع‌گرایی",desc:"لذت از بودن در جمع"},
      {label:"قاطعیت",desc:"بیان نظرات با اعتماد"},
      {label:"فعالیت",desc:"سطح انرژی و سرعت عمل"},
      {label:"هیجان‌خواهی",desc:"جستجوی تحریک و هیجان"},
    ],
    "A": [
      {label:"اعتماد",desc:"تمایل به خوش‌بینی درباره دیگران"},
      {label:"صداقت",desc:"صریح و راحت بودن"},
      {label:"نوع‌دوستی",desc:"توجه به نیاز دیگران"},
      {label:"همکاری",desc:"تمایل به سازگاری"},
      {label:"فروتنی",desc:"ساده‌زیستی و تواضع"},
    ],
    "C": [
      {label:"کارایی",desc:"سازماندهی و برنامه‌ریزی"},
      {label:"نظم",desc:"دقت و ترتیب"},
      {label:"وظیفه‌شناسی",desc:"احساس تکلیف و مسئولیت"},
      {label:"پشتکار",desc:"ادامه تا رسیدن به هدف"},
      {label:"خویشتنداری",desc:"مقاومت در برابر تکانه"},
    ],
    "N": [
      {label:"اضطراب",desc:"نگرانی و تنش مزمن"},
      {label:"خصومت",desc:"خشم و ناامیدی"},
      {label:"افسردگی",desc:"احساس گناه و غم"},
      {label:"خودآگاهی",desc:"شرم و ناراحتی اجتماعی"},
      {label:"آسیب‌پذیری",desc:"احساس درماندگی در فشار"},
    ],
    "O": [
      {label:"تخیل",desc:"دنیای درونی غنی"},
      {label:"زیباشناسی",desc:"قدردانی از هنر و زیبایی"},
      {label:"احساسات",desc:"توجه به احساسات درونی"},
      {label:"عمل",desc:"کنجکاوی در تجربیات جدید"},
      {label:"ایده‌ها",desc:"علاقه به مفاهیم انتزاعی"},
    ],
  },
  ecr_r: {
    "اضطراب": [
      {label:"ترس از رها شدن",desc:"نگرانی از طرد شدن توسط شریک"},
      {label:"نیاز به تأیید",desc:"جستجوی مکرر تأیید"},
      {label:"وابستگی عاطفی",desc:"شدت پیوند عاطفی"},
      {label:"حساسیت",desc:"واکنش به نشانه‌های طرد"},
      {label:"اعتماد به نفس",desc:"باور به ارزش خود"},
    ],
    "اجتناب": [
      {label:"نزدیکی",desc:"ناراحتی از صمیمیت"},
      {label:"اعتماد",desc:"تکیه به دیگران"},
      {label:"استقلال",desc:"ترجیح خودکفایی"},
      {label:"بیان",desc:"افشای احساسات"},
      {label:"پیوند",desc:"عمق روابط"},
    ],
    "ایمنی": [
      {label:"آرامش",desc:"احساس امنیت در رابطه"},
      {label:"اعتماد",desc:"باور به قابل اعتماد بودن"},
      {label:"ارتباط",desc:"راحتی در صمیمیت"},
      {label:"انعطاف",desc:"مقابله با تعارض"},
      {label:"پایداری",desc:"ثبات عاطفی"},
    ],
    "اعتماد": [
      {label:"صداقت",desc:"باور به صداقت شریک"},
      {label:"قابلیت اتکا",desc:"اعتماد به وفای شریک"},
      {label:"خیرخواهی",desc:"باور به نیت خوب"},
      {label:"توانمندی",desc:"اعتقاد به توانایی‌ها"},
      {label:"یکپارچگی",desc:"ارزش‌های مشترک"},
    ],
    "پیوند": [
      {label:"عمق",desc:"عمق ارتباط عاطفی"},
      {label:"صمیمیت",desc:"نزدیکی و گرمی"},
      {label:"تعهد",desc:"پایبندی به رابطه"},
      {label:"همدلی",desc:"درک احساسات شریک"},
      {label:"حمایت",desc:"پشتیبانی متقابل"},
    ],
  },
  iri: {
    "همدلی عاطفی EC": [
      {label:"احساس مشترک",desc:"احساس همراه دیگران"},
      {label:"تأثیرپذیری",desc:"تأثیر از حالت دیگران"},
      {label:"گرمی",desc:"دلسوزی فعال"},
      {label:"پاسخ هیجانی",desc:"واکنش عاطفی خودکار"},
      {label:"اشتراک",desc:"تجربه هیجان مشترک"},
    ],
    "دیدگاه‌گیری PT": [
      {label:"دیدگاه دیگران",desc:"توانایی دیدن از چشم دیگری"},
      {label:"درک شناختی",desc:"فهم منطق دیگران"},
      {label:"انعطاف",desc:"تغییر دیدگاه"},
      {label:"تحلیل",desc:"بررسی موقعیت از زوایا"},
      {label:"بردباری",desc:"پذیرش دیدگاه مخالف"},
    ],
    "خیال‌پردازی FS": [
      {label:"غرق شدن",desc:"جذب شدن در داستان‌ها"},
      {label:"تخیل",desc:"ساختن سناریوهای فرضی"},
      {label:"احساس درونی",desc:"همراهی با شخصیت‌های داستانی"},
      {label:"خلاقیت",desc:"تصویرسازی ذهنی"},
      {label:"کنجکاوی",desc:"کنجکاوی درباره انگیزه‌ها"},
    ],
    "پریشانی PD": [
      {label:"اضطراب همدلانه",desc:"نگرانی از رنج دیگران"},
      {label:"واکنش فیزیکی",desc:"پاسخ جسمی به درد دیگران"},
      {label:"ناراحتی",desc:"احساس ناخوشایند"},
      {label:"آسیب‌پذیری",desc:"حساسیت به رنج"},
      {label:"بازیابی",desc:"سرعت بازگشت به آرامش"},
    ],
    "نگرانی": [
      {label:"دلسوزی",desc:"توجه به مشکل دیگران"},
      {label:"حمایت",desc:"تمایل به کمک"},
      {label:"صمیمیت",desc:"نزدیکی عاطفی"},
      {label:"ارتباط",desc:"کیفیت روابط"},
      {label:"اثرگذاری",desc:"تأثیر مثبت بر دیگران"},
    ],
  },
  hexaco: {
    "H — صداقت": [
      {label:"صداقت",desc:"صادق بودن در گفتار و رفتار"},
      {label:"عدالت‌خواهی",desc:"پرهیز از دستکاری و فریب"},
      {label:"قناعت",desc:"رضایت از داشته‌ها"},
      {label:"بی‌ریایی",desc:"خودنمایی نکردن"},
      {label:"فروتنی",desc:"تواضع واقعی"},
    ],
    "E — هیجان": [
      {label:"ترس",desc:"میزان احتیاط در خطر"},
      {label:"اضطراب",desc:"نگرانی از آینده"},
      {label:"وابستگی",desc:"نیاز به حمایت"},
      {label:"احساساتی",desc:"تجربه احساسات عمیق"},
      {label:"آسیب‌پذیری",desc:"حساسیت هیجانی"},
    ],
    "X — برون‌گرا": [
      {label:"اجتماعی",desc:"لذت از تعاملات"},
      {label:"پرانرژی",desc:"سطح انرژی اجتماعی"},
      {label:"جرأت",desc:"ابراز وجود"},
      {label:"مثبت",desc:"شاد و خوش‌رو بودن"},
      {label:"صمیمی",desc:"ایجاد روابط گرم"},
    ],
    "A — توافق": [
      {label:"مدارا",desc:"بخشش و گذشت"},
      {label:"ملایمت",desc:"پرهیز از قضاوت"},
      {label:"انعطاف",desc:"سازگاری با نظرات"},
      {label:"صبر",desc:"تحمل در تعارض"},
      {label:"مهربانی",desc:"خیرخواهی فعال"},
    ],
    "C — وظیفه": [
      {label:"سازماندهی",desc:"نظم و ترتیب"},
      {label:"دقت",desc:"توجه به جزئیات"},
      {label:"پشتکار",desc:"ادامه تا پایان"},
      {label:"کمال‌گرایی",desc:"استانداردهای بالا"},
      {label:"احتیاط",desc:"تصمیم‌گیری دقیق"},
    ],
    "O — گشودگی": [
      {label:"زیباشناسی",desc:"قدردانی از هنر"},
      {label:"کنجکاوی",desc:"علاقه به دانش"},
      {label:"خلاقیت",desc:"تفکر نوآورانه"},
      {label:"انعطاف",desc:"پذیرش ایده‌های جدید"},
      {label:"عمق",desc:"تفکر انتزاعی"},
    ],
  },
};

function useAnim(delay=0) {
  const [on,setOn]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setOn(true),delay);return()=>clearTimeout(t);},[delay]);
  return on;
}


// ── محاسبه زیربعدهای واقعی از raw answers ──────────────────
const NEO_FACETS: Record<string, {qIds:number[];reverse?:boolean[]}> = {
  "E": {qIds:[1,2,3,4,5,6], reverse:[false,false,false,true,false,true]},
  "A": {qIds:[7,8,9,10,11,12], reverse:[false,false,false,true,false,true]},
  "C": {qIds:[13,14,15,16,17,18], reverse:[false,false,false,true,false,true]},
  "N": {qIds:[19,20,21,22,23,24], reverse:[false,true,false,true,false,true]},
  "O": {qIds:[25,26,27,28,29,30], reverse:[false,false,false,true,false,true]},
};

const ECR_FACETS: Record<string, {qIds:number[];reverse?:number[]}> = {
  "اضطراب": {qIds:[1,2,3,4,5,6,7,8,9], reverse:[1,2,5,7,8]},
  "اجتناب": {qIds:[19,20,21,22,23,24,25,26,27], reverse:[19,20,21,22,23]},
  "ایمنی":  {qIds:[9,10,11,12,13,14], reverse:[]},
  "اعتماد": {qIds:[15,16,17,18], reverse:[16,17]},
  "پیوند":  {qIds:[28,29,30,31,32], reverse:[29,30]},
};

const IRI_FACETS: Record<string, number[]> = {
  "همدلی عاطفی EC": [2,4,9,14,18,20,22,26],
  "دیدگاه‌گیری PT": [3,8,11,15,21,25,28],
  "خیال‌پردازی FS": [1,5,7,12,16,23,26],
  "پریشانی PD":     [6,10,13,17,19,24,27],
  "نگرانی":         [3,8,11,15,21],
};

function calcRealFacet(answers: Record<string,number>, qIds: number[], reverseIds: number[] = []): number {
  if (!answers || !Object.keys(answers).length) return 50;
  let total = 0; let count = 0;
  for (const qId of qIds) {
    const raw = answers[qId] ?? answers[String(qId)];
    if (raw === undefined) continue;
    const val = reverseIds.includes(qId) ? 6 - raw : raw;
    total += val; count++;
  }
  if (!count) return 50;
  return Math.round((total / count / 5) * 100);
}

function getSubDimValues(testId: string, dimLabel: string, scores: any): number[] {
  const answers = scores?.answers || {};
  if (!Object.keys(answers).length) return []; // بدون raw answers

  if (testId === "neo_ffi") {
    const facetData = NEO_FACETS[dimLabel];
    if (!facetData) return [];
    return facetData.qIds.map((qId, i) => {
      const raw = answers[qId] ?? answers[String(qId)] ?? 3;
      const val = facetData.reverse?.[i] ? 6 - raw : raw;
      return Math.round((val / 5) * 100);
    });
  }

  if (testId === "ecr_r") {
    const facetData = ECR_FACETS[dimLabel];
    if (!facetData) return [];
    return facetData.qIds.slice(0, 5).map(qId => {
      const raw = answers[qId] ?? answers[String(qId)] ?? 4;
      const rev = (facetData.reverse || []) as number[];
      const val = rev.includes(qId) ? 8 - raw : raw;
      return Math.round((val / 7) * 100);
    });
  }

  if (testId === "iri") {
    const qIds = IRI_FACETS[dimLabel] || [];
    return qIds.slice(0, 5).map(qId => {
      const raw = answers[qId] ?? answers[String(qId)] ?? 3;
      return Math.round((raw / 5) * 100);
    });
  }

  return [];
}

// ── Ring gauge ────────────────────────────────────────────
function Ring({value,max,color,size=100,label,thick=8}:{value:number;max:number;color:string;size:number;label:string;thick?:number}) {
  const anim=useAnim(300);
  const pct=Math.min(100,Math.round(value/max*100));
  const r=(size-thick*2)/2; const c2=2*Math.PI*r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{width:size,height:size}}>
        <svg width={size} height={size} style={{direction:"ltr"}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={thick}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
            strokeDasharray={c2} strokeLinecap="round"
            strokeDashoffset={anim?c2*(1-pct/100):c2}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{transition:"stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          <circle cx={size/2} cy={size/2} r={r-thick} fill="none" stroke={color+"10"} strokeWidth={thick/2}
            strokeDasharray={c2} strokeLinecap="round"
            strokeDashoffset={anim?c2*(1-pct/100*0.7):c2}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{transition:"stroke-dashoffset 1.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-slate-700" style={{fontSize:size>80?22:16}}>{pct}</span>
          <span className="text-slate-400 font-bold" style={{fontSize:8}}>٪</span>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 text-center">{label}</span>
    </div>
  );
}

// ── Pentagon ──────────────────────────────────────────────
function Pentagon({dims,size=200,onSelect,selected,testId="",scores={}}:{
  dims:{label:string;value:number;max:number;color:string}[];
  size?:number;onSelect?:(i:number)=>void;selected?:number|null;testId?:string;scores?:any;
}) {
  const anim=useAnim(200);
  const [subSel,setSubSel]=useState<number|null>(null);
  const n=dims.length; const cx=size/2; const cy=size/2; const r=size/2-24;
  const selDim=selected!==null&&selected!==undefined?dims[selected]:null;
  const subDims:any[]=selDim&&testId&&(SUB_DIMS_MAP as any)[testId]?.[(selDim as any).label]||[];
  // مقادیر واقعی از raw answers
  const realVals:number[]=selDim&&testId?getSubDimValues(testId,(selDim as any).label,scores):[];
  const hasRealData=realVals.length>0;
  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{direction:"ltr",overflow:"visible"}}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow2"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[.2,.4,.6,.8,1].map((s,gi)=>{
          const pts=dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return `${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`;}).join(" ");
          return <polygon key={gi} points={pts} fill="none" stroke={`rgba(0,0,0,${gi===4?0.1:0.04})`} strokeWidth={gi===4?1.5:1}/>;
        })}
        {dims.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,0.05)" strokeWidth={1}/>;
        })}
        <polygon
          points={dims.map((d,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;const p=anim?Math.min(d.value/d.max,1):0;return `${cx+r*p*Math.cos(a)},${cy+r*p*Math.sin(a)}`;}).join(" ")}
          fill="rgba(255,107,0,0.08)" stroke="#FF6B00" strokeWidth={2.5} filter="url(#glow)"
          style={{transition:"all 1.6s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        {dims.map((d,i)=>{
          const a=(i*2*Math.PI/n)-Math.PI/2; const p=anim?Math.min(d.value/d.max,1):0;
          const x=cx+r*p*Math.cos(a); const y=cy+r*p*Math.sin(a);
          const lx=cx+(r+22)*Math.cos(a); const ly=cy+(r+22)*Math.sin(a);
          const sel=selected===i;
          const hasSubDims=!!(SUB_DIMS_MAP as any)[testId]?.[d.label];
          return (
            <g key={i} onClick={()=>onSelect?.(i)} style={{cursor:onSelect?"pointer":"default"}}>
              {sel&&<><circle cx={x} cy={y} r={20} fill={d.color} opacity={0.1} style={{animation:"ping 1.5s infinite"}}/>
                <circle cx={x} cy={y} r={14} fill={d.color} opacity={0.08}/></>}
              {anim&&!sel&&<circle cx={x} cy={y} r={12} fill="none" stroke={d.color} strokeWidth={1} opacity={0.2}
                style={{animation:"ping 3s infinite",animationDelay:`${i*0.4}s`}}/>}
              <circle cx={x} cy={y} r={sel?10:6} fill={d.color} stroke="white" strokeWidth={2.5}
                filter={sel?"url(#glow)":"url(#glow2)"}
                style={{transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/>
              {sel&&hasSubDims&&<text x={cx+(r+22)*Math.cos(a)} y={cy+(r+22)*Math.sin(a)-8}
                textAnchor="middle" fill={d.color} fontSize={6} fontWeight="900">▼ جزئیات</text>}
              <text x={lx} y={ly+4} textAnchor="middle" fill={sel?"#FF6B00":"#334155"}
                fontSize={sel?10:8} fontWeight={sel?"900":"700"}>{d.label}</text>
              <text x={lx} y={ly+14} textAnchor="middle" fill={d.color} fontSize={sel?9:7} fontWeight="900">
                {Math.round(d.value/d.max*100)}٪
              </text>
            </g>
          );
        })}
      </svg>
      {/* sub-pentagon */}
      {selDim&&subDims.length>0&&(
        <div className="mt-3 rounded-2xl overflow-hidden border-2"
          style={{borderColor:(selDim as any).color+"30",background:`${(selDim as any).color}04`,
            animation:"fadeIn 0.4s ease"}}>
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full" style={{background:(selDim as any).color}}/>
            <p className="font-black text-sm text-slate-900">{(selDim as any).label}</p>
            <span className="text-xs text-slate-400">— زیربعدها</span>
            <span className="mr-auto font-black text-sm" style={{color:(selDim as any).color}}>
              {Math.round((selDim as any).value/(selDim as any).max*100)}٪
            </span>
          </div>
          <div className="flex justify-center py-1">
            <svg width={150} height={150} viewBox="0 0 150 150" style={{direction:"ltr",overflow:"visible"}}>
              {[.33,.66,1].map((s,gi)=>{
                const pts=subDims.map((_:any,i:number)=>{const a=(i*2*Math.PI/subDims.length)-Math.PI/2;return `${75+55*s*Math.cos(a)},${75+55*s*Math.sin(a)}`;}).join(" ");
                return <polygon key={gi} points={pts} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={1}/>;
              })}
              <polygon
                points={subDims.map((_:any,i:number)=>{
                  const pct=hasRealData?(realVals[i]??50)/100:Math.max(0.3,Math.min(1,((selDim as any).value/(selDim as any).max)*[0.9,0.7,0.85,0.75,0.8][i%5]+0.05));
                  const a=(i*2*Math.PI/subDims.length)-Math.PI/2;
                  return `${75+55*pct*Math.cos(a)},${75+55*pct*Math.sin(a)}`;
                }).join(" ")}
                fill={`${(selDim as any).color}18`} stroke={(selDim as any).color} strokeWidth={2}
                style={{transition:"all 1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
              {subDims.map((sd:any,i:number)=>{
                const pct=hasRealData?(realVals[i]??50)/100:Math.max(0.3,Math.min(1,((selDim as any).value/(selDim as any).max)*[0.9,0.7,0.85,0.75,0.8][i%5]+0.05));
                const a=(i*2*Math.PI/subDims.length)-Math.PI/2;
                const x=75+55*pct*Math.cos(a); const y=75+55*pct*Math.sin(a);
                const lx=75+72*Math.cos(a); const ly=75+72*Math.sin(a);
                return <g key={i} onClick={()=>setSubSel(subSel===i?null:i)} style={{cursor:"pointer"}}>
                  <circle cx={x} cy={y} r={subSel===i?7:4} fill={(selDim as any).color} stroke="white" strokeWidth={1.5}
                    style={{transition:"r 0.3s"}}/>
                  <text x={lx} y={ly+3} textAnchor="middle" fill={subSel===i?"#FF6B00":"#475569"} fontSize={6.5} fontWeight={subSel===i?"900":"700"}>{sd.label}</text>
                </g>;
              })}
            </svg>
          </div>
          {subSel!==null&&subDims[subSel]&&(
            <div className="mx-3 mb-2 p-2.5 rounded-xl text-xs"
              style={{background:`${(selDim as any).color}10`,border:`1px solid ${(selDim as any).color}20`,
                animation:"fadeIn 0.3s ease"}}>
              <p className="font-black" style={{color:(selDim as any).color}}>{subDims[subSel].label}</p>
              <p className="text-slate-500 mt-0.5 leading-5">{subDims[subSel].desc}</p>
            </div>
          )}
          <div className="px-3 pb-3 space-y-1.5">
            {subDims.map((sd:any,i:number)=>{
              const pct=hasRealData?(realVals[i]??50):Math.round(Math.max(30,Math.min(95,(selDim as any).value/(selDim as any).max*100*[0.9,0.7,0.85,0.75,0.8][i%5])));
              return (
                <div key={i}>
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="font-bold text-slate-600">{sd.label}</span>
                    <span className="font-black" style={{color:(selDim as any).color}}>{pct}٪</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${pct}%`,
                      background:`linear-gradient(90deg,${(selDim as any).color}50,${(selDim as any).color})`,
                      transition:`width ${0.7+i*0.15}s cubic-bezier(0.34,1.56,0.64,1)`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AnimBar ───────────────────────────────────────────────
function Bar({pct,color,label,delay=0,sublabel=""}:{pct:number;color:string;label:string;delay?:number;sublabel?:string}) {
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+400);return()=>clearTimeout(t);},[pct]);
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <div><span className="text-xs font-black text-slate-800">{label}</span>
          {sublabel&&<span className="text-[9px] text-slate-400 mr-1">{sublabel}</span>}</div>
        <span className="text-xs font-black" style={{color}}>{pct}٪</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden relative">
        <div className="h-full rounded-full relative overflow-hidden"
          style={{width:`${w}%`,background:`linear-gradient(90deg,${color}50,${color})`,
            transition:`width ${1+delay/1000}s cubic-bezier(0.34,1.56,0.64,1)`}}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{animation:"shimmer 2s infinite"}}/>
        </div>
      </div>
    </div>
  );
}

// ── MBTI Avatar ───────────────────────────────────────────
const MBTI_META:Record<string,{color:string;emoji:string;title:string;desc:string}> = {
  ISTJ:{color:"#1d4ed8",emoji:"📋",title:"بازرس",desc:"وظیفه‌شناس و قابل اعتماد"},
  ISFJ:{color:"#0369a1",emoji:"🛡️",title:"مدافع",desc:"محافظ و فداکار"},
  INFJ:{color:"#7c3aed",emoji:"🔮",title:"مشاور",desc:"آرمان‌گرا و بینش‌مند"},
  INTJ:{color:"#4c1d95",emoji:"♟️",title:"معمار",desc:"استراتژیست و مستقل"},
  ISTP:{color:"#d97706",emoji:"🔧",title:"استاد",desc:"ماهر و منطقی"},
  ISFP:{color:"#b45309",emoji:"🎨",title:"هنرمند",desc:"حساس و خلاق"},
  INFP:{color:"#059669",emoji:"🌿",title:"میانجی",desc:"آرمان‌گرا و شاعرمنش"},
  INTP:{color:"#0284c7",emoji:"🧩",title:"منطق‌دان",desc:"تحلیل‌گر و کنجکاو"},
  ESTP:{color:"#dc2626",emoji:"⚡",title:"کارآفرین",desc:"پرانرژی و ریسک‌پذیر"},
  ESFP:{color:"#ea580c",emoji:"🎭",title:"سرگرم‌کننده",desc:"شاد و آزاد"},
  ENFP:{color:"#16a34a",emoji:"✨",title:"قهرمان",desc:"الهام‌بخش و خلاق"},
  ENTP:{color:"#9333ea",emoji:"💡",title:"مناظره‌گر",desc:"نوآور و بحث‌دوست"},
  ESTJ:{color:"#1e40af",emoji:"⚖️",title:"مدیر",desc:"سازمان‌ده و عملگرا"},
  ESFJ:{color:"#0891b2",emoji:"🤝",title:"کنسول",desc:"مراقب و اجتماعی"},
  ENFJ:{color:"#15803d",emoji:"🌟",title:"قهرمان",desc:"رهبر الهام‌بخش"},
  ENTJ:{color:"#6d28d9",emoji:"👑",title:"فرمانده",desc:"راهبرد و قاطع"},
};

function MBTIViz({scores,mainResult}:{scores:any;mainResult:string}) {
  const anim=useAnim(100);
  const type=(mainResult||"ISTJ").split(" ")[0].toUpperCase().slice(0,4);
  const meta=MBTI_META[type]||{color:"#FF6B00",emoji:"🧠",title:"شخصیت",desc:"تیپ شخصیتی شما"};
  const toP=(v:number,r=3)=>Math.round(((Math.max(-r,Math.min(r,v))+r)/(r*2))*100);
  const dims=[
    {label:"برون‌گرایی E",value:toP(scores?.EI??0,3),color:"#FF6B00",lo:"I",hi:"E"},
    {label:"شهودی N",value:toP(scores?.SN??0,3),color:"#a855f7",lo:"S",hi:"N"},
    {label:"احساسی F",value:toP(scores?.TF??0,3),color:"#ef4444",lo:"T",hi:"F"},
    {label:"قضاوتی J",value:toP(scores?.JP??0,5),color:"#eab308",lo:"P",hi:"J"},
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 justify-center">
        <div style={{transform:anim?"scale(1) rotate(0deg)":"scale(0) rotate(-180deg)",
          transition:"all 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-2xl"
            style={{background:`linear-gradient(135deg,${meta.color},${meta.color}99)`,
              boxShadow:`0 16px 48px ${meta.color}40`}}>
            {meta.emoji}
          </div>
        </div>
        <div style={{opacity:anim?1:0,transform:anim?"translateX(0)":"translateX(20px)",
          transition:"all 0.6s 0.3s ease"}}>
          <div className="px-4 py-1.5 rounded-2xl font-black text-xl text-white mb-1 shadow-lg"
            style={{background:`linear-gradient(135deg,${meta.color},${meta.color}cc)`}}>{type}</div>
          <p className="font-black text-slate-800 text-lg">{meta.title}</p>
          <p className="text-slate-500 text-xs">{meta.desc}</p>
        </div>
      </div>
      {dims.map((d,i)=>(
        <div key={i} style={{opacity:anim?1:0,transform:anim?"translateY(0)":"translateY(10px)",
          transition:`all 0.4s ${0.2+i*0.1}s ease`}}>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="font-black">{d.lo}</span><span className="font-black">{d.hi}</span>
          </div>
          <Bar pct={d.value} color={d.color} label={d.label} delay={i*100}/>
          <div className="flex justify-between text-[9px] -mt-2">
            <span style={{color:d.value<50?d.color:"#94a3b8"}} className="font-black">{100-d.value}٪</span>
            <span style={{color:d.value>=50?d.color:"#94a3b8"}} className="font-black">{d.value}٪</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NEOViz({scores}:{scores:any}) {
  const [sel,setSel]=useState<number|null>(null);
  const facets=[
    {label:"E",full:"برون‌گرایی",value:Math.min(100,scores?.E??50),max:100,color:"#FF6B00",subs:["تسلط","جمع‌گرایی","قاطعیت","فعالیت","هیجان"]},
    {label:"A",full:"توافق‌پذیری",value:Math.min(100,scores?.A??50),max:100,color:"#22c55e",subs:["همدلی","اعتماد","نوع‌دوستی","همکاری","صداقت"]},
    {label:"C",full:"وظیفه‌شناسی",value:Math.min(100,scores?.C??50),max:100,color:"#3b82f6",subs:["برنامه‌ریزی","دقت","پشتکار","نظم","مسئولیت"]},
    {label:"N",full:"روان‌رنجوری",value:Math.min(100,scores?.N??50),max:100,color:"#ef4444",subs:["اضطراب","افسردگی","تحریک‌پذیری","خودآگاهی","آسیب‌پذیری"]},
    {label:"O",full:"گشودگی",value:Math.min(100,scores?.O??50),max:100,color:"#a855f7",subs:["تخیل","زیباشناسی","کنجکاوی","خلاقیت","انعطاف"]},
  ];
  const selData=sel!==null?facets[sel]:null;
  return (
    <div>
      <Pentagon dims={facets} size={210} onSelect={i=>setSel(sel===i?null:i)} selected={sel} testId="neo_ffi" scores={scores}/>
      {!selData&&<div className="space-y-2 mt-2">
        {facets.map((d,i)=><Bar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.full} delay={i*80}/>)}
        <p className="text-[10px] text-slate-400 text-center">روی نقاط پنتاگون کلیک کن</p>
      </div>}
    </div>
  );
}

function ECRViz({scores,mainResult}:{scores:any;mainResult:string}) {
  const anim=useAnim(200);
  const MAX=63; const anx=scores?.ANX??31; const avo=scores?.AVO??31;
  const pctAnx=Math.round(anx/MAX*100); const pctAvo=Math.round(avo/MAX*100);
  const style=(anx<36&&avo<36)?"ایمن":(anx>=36&&avo<36)?"اضطرابی":(anx<36&&avo>=36)?"اجتنابی":"بی‌سازمان";
  const styleColor={ایمن:"#22c55e",اضطرابی:"#ef4444",اجتنابی:"#3b82f6",بی‌سازمان:"#f97316"}[style]||"#64748b";
  const styleEmoji={ایمن:"💚",اضطرابی:"😰",اجتنابی:"🏃",بی‌سازمان:"🌀"}[style]||"💔";
  const dotX=`${pctAvo}%`; const dotY=`${100-pctAnx}%`;
  return (
    <div className="space-y-4">
      <div className="text-center p-4 rounded-2xl"
        style={{background:`${styleColor}10`,border:`2px solid ${styleColor}30`}}>
        <div className="text-4xl mb-1">{styleEmoji}</div>
        <p className="font-black text-lg" style={{color:styleColor}}>{style}</p>
        <p className="text-xs text-slate-500 mt-1">سبک دلبستگی شما</p>
      </div>
      {/* scatter plot */}
      <div className="relative h-36 rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(135deg,#f0f9ff,#fef9ec)",border:"1px solid rgba(0,0,0,0.06)"}}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200"/>
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200"/>
        <span className="absolute top-1 right-1 text-[8px] text-slate-400">اضطراب بالا</span>
        <span className="absolute bottom-1 right-1 text-[8px] text-slate-400">اضطراب پایین</span>
        <span className="absolute bottom-1 left-1 text-[8px] text-slate-400">اجتناب بالا</span>
        {/* zone labels */}
        <span className="absolute top-2 left-2 text-[8px] text-red-400 font-bold">اضطرابی</span>
        <span className="absolute top-2 right-2 text-[8px] text-orange-400 font-bold">بی‌سازمان</span>
        <span className="absolute bottom-2 left-2 text-[8px] text-blue-400 font-bold">اجتنابی</span>
        <span className="absolute bottom-2 right-2 text-[8px] text-green-500 font-bold">ایمن</span>
        <div className="absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl flex items-center justify-center"
          style={{left:anim?dotX:"50%",bottom:anim?dotY:"50%",
            background:styleColor,boxShadow:`0 0 16px ${styleColor}60`,
            transition:"all 1.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div className="w-2.5 h-2.5 rounded-full bg-white"/>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <Ring value={anx} max={MAX} color="#ef4444" size={85} label="اضطراب"/>
        <Ring value={avo} max={MAX} color="#3b82f6" size={85} label="اجتناب"/>
        <Ring value={MAX-anx} max={MAX} color="#22c55e" size={85} label="ایمنی"/>
      </div>
    </div>
  );
}

function ERQViz({scores}:{scores:any}) {
  // CR,ES قبلاً با toP به % تبدیل شدن — max=100
  const cr=Math.min(100,scores?.CR??0); const es=Math.min(100,scores?.ES??0);
  return (
    <div>
      <Pentagon dims={[
        {label:"بازارزیابی",value:cr,max:100,color:"#22c55e"},
        {label:"کنترل",value:Math.min(100,100-es),max:100,color:"#3b82f6"},
        {label:"مثبت‌اندیشی",value:Math.min(100,Math.round(cr*0.7)),max:100,color:"#a855f7"},
        {label:"آرامش",value:Math.min(100,Math.max(0,100-es)),max:100,color:"#0ea5e9"},
        {label:"انعطاف",value:Math.min(100,Math.round(cr*0.5)),max:100,color:"#FF6B00"},
      ]} size={190}/>
      <div className="flex gap-4 justify-center mt-3">
        <Ring value={cr} max={100} color="#22c55e" size={90} label="بازارزیابی شناختی"/>
        <Ring value={Math.max(0,100-es)} max={100} color="#3b82f6" size={90} label="کنترل هیجان"/>
      </div>
      <div className="mt-3 p-3 rounded-2xl text-xs text-center font-bold"
        style={{background:cr>50?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",
          color:cr>50?"#16a34a":"#dc2626"}}>
        {cr>50?"✅ تنظیم هیجان سالم — بازارزیابی قوی":"⚠️ تمایل به سرکوب هیجانات"}
      </div>
    </div>
  );
}

function GaugeViz({scores,testId}:{scores:any;testId:string}) {
  const anim=useAnim(300);
  const total=scores?.total??0;
  const maxes:any={phq9:27,gad7:21,bai:63,isi:28,asrs:24,bdi2:63,pcl5:80,ybocs:40,mmpi_screen:12,mcmi_screen:12};
  const MAX=maxes[testId]||100; const pct=Math.round(total/MAX*100);
  const severity=pct<25?"خفیف 😊":pct<50?"متوسط 😐":pct<75?"شدید 😟":"بسیار شدید 😰";
  const color=pct<25?"#22c55e":pct<50?"#eab308":pct<75?"#f97316":"#ef4444";
  // speedometer
  const ang=anim?(-135+pct*2.7):(-135);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{width:180,height:110}}>
        <svg width={180} height={110} viewBox="0 0 180 110" style={{direction:"ltr"}}>
          {/* arc */}
          {["#22c55e","#eab308","#f97316","#ef4444"].map((c,i)=>(
            <path key={i} d={`M ${90+80*Math.cos((-135+i*67.5)*Math.PI/180)} ${90+80*Math.sin((-135+i*67.5)*Math.PI/180)} A 80 80 0 0 1 ${90+80*Math.cos((-135+(i+1)*67.5)*Math.PI/180)} ${90+80*Math.sin((-135+(i+1)*67.5)*Math.PI/180)}`}
              fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" opacity={0.3}/>
          ))}
          {/* value arc */}
          <path d={`M ${90+80*Math.cos(-135*Math.PI/180)} ${90+80*Math.sin(-135*Math.PI/180)} A 80 80 0 ${pct>50?1:0} 1 ${90+80*Math.cos((anim?(-135+pct*2.7):-135)*Math.PI/180)} ${90+80*Math.sin((anim?(-135+pct*2.7):-135)*Math.PI/180)}`}
            fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
            style={{transition:"all 1.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          {/* needle */}
          <line x1={90} y1={90} x2={90+65*Math.cos(ang*Math.PI/180)} y2={90+65*Math.sin(ang*Math.PI/180)}
            stroke={color} strokeWidth={3} strokeLinecap="round"
            style={{transformOrigin:"90px 90px",transition:"all 1.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          <circle cx={90} cy={90} r={6} fill={color} stroke="white" strokeWidth={2}/>
          <text x={90} y={78} textAnchor="middle" fill={color} fontSize={22} fontWeight="900">{pct}</text>
          <text x={90} y={88} textAnchor="middle" fill="#94a3b8" fontSize={8}>٪</text>
        </svg>
      </div>
      <div className="text-center p-3 rounded-2xl font-black text-base"
        style={{background:`${color}12`,color,border:`2px solid ${color}25`}}>
        {severity}
      </div>
      <Bar pct={pct} color={color} label={`امتیاز: ${total} از ${MAX}`}/>
    </div>
  );
}

function IRIViz({scores}:{scores:any}) {
  // فقط subscale هایی که داده دارن نشون بده
  const allDims=[
    {label:"همدلی عاطفی EC",value:Math.min(100,scores?.EC??0),max:100,color:"#ec4899",key:"EC"},
    {label:"دیدگاه‌گیری PT",value:Math.min(100,scores?.PT??0),max:100,color:"#3b82f6",key:"PT"},
    {label:"خیال‌پردازی FS",value:Math.min(100,scores?.FS??0),max:100,color:"#a855f7",key:"FS"},
    {label:"پریشانی PD",value:Math.min(100,scores?.PD??0),max:100,color:"#ef4444",key:"PD"},
  ];
  // فقط subscale هایی که مقدار واقعی دارن (نه -1 یا null)
  const dims=allDims.filter(d=>scores[d.key]!=null&&scores[d.key]>=0);
  const showDims=dims.length>0?dims:allDims.filter(d=>d.value>0);
  const finalDims=showDims.length>0?showDims:allDims;
  return (
    <div>
      <Pentagon dims={finalDims} size={200} testId="iri"/>
      <div className="space-y-2 mt-3">
        {finalDims.map((d,i)=><Bar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*80}/>)}
      </div>
    </div>
  );
}

// ── AI streaming panel ─────────────────────────────────────
function AIPanel({testName,mainResult,testId}:{testName:string;mainResult:string;testId:string}) {
  const [text,setText]=useState(""); const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false); const ref=useRef<HTMLDivElement>(null);

  async function start() {
    if(loading||text) return;
    setLoading(true);
    await streamAI(
      `تفسیر کامل تست روانشناسی "${testName}" با نتیجه "${mainResult}" به فارسی روان.

## معنای نتیجه
توضیح کامل در ۲-۳ پاراگراف

## نقاط قوت این تیپ
- ویژگی مثبت اول با توضیح
- ویژگی مثبت دوم با توضیح  
- ویژگی مثبت سوم با توضیح

## زمینه‌های رشد
- فرصت رشد اول با راهکار
- فرصت رشد دوم با راهکار

## تأثیر بر روابط
توضیح کامل در یک پاراگراف

## توصیه‌های عملی
- توصیه اول
- توصیه دوم
- توصیه سوم

## جمع‌بندی
یک پاراگراف پایانی الهام‌بخش`,
      (chunk)=>{ setText(p=>p+chunk); setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100); },
      ()=>setLoading(false),
      {maxTokens:2000}
    ).catch(()=>{setText("خطا در دریافت تفسیر.");setLoading(false);});
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100">
      <button onClick={()=>{ setOpen(o=>!o); if(!open&&!text) start(); }}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{background:"linear-gradient(135deg,rgba(255,107,0,0.06),rgba(249,115,22,0.04))"}}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{background:"linear-gradient(135deg,#FF6B00,#f97316)"}}>
            {loading?<RefreshCw size={13} className="text-white animate-spin"/>:<Sparkles size={13} className="text-white"/>}
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-white">تفسیر هوشمند AI</p>
            <p className="text-[9px] text-slate-400">{text?"دریافت شد":loading?"در حال تحلیل...":"کلیک کن"}</p>
          </div>
        </div>
        {open?<ChevronUp size={14} className="text-slate-400"/>:<ChevronDown size={14} className="text-slate-400"/>}
      </button>
      {open&&(
        <div className="px-4 pb-4 pt-2 border-t border-slate-50">
          {!text&&loading&&(
            <div className="flex gap-1 py-4 justify-center">
              {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-orange-400"
                style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
            </div>
          )}
          {text&&(
            <div className="text-sm leading-8 text-slate-700 space-y-0.5">
              {text.split('\n').map((line,i)=>{
                const isH2=line.startsWith('##'); const isH3=line.startsWith('###');
                const isBullet=line.startsWith('-')||line.startsWith('•');
                const t=line.replace(/^#+\s*/,'').replace(/^[-•]\s*/,'').replace(/\*\*(.*?)\*\*/g,'$1');
                if(!t.trim()) return <div key={i} className="h-2"/>;
                if(isH2) return (
                  <div key={i} className="mt-5 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 rounded-full" style={{background:"linear-gradient(180deg,#FF6B00,#f97316)"}}/>
                      <h3 className="font-black text-slate-900 text-sm">{t}</h3>
                    </div>
                    <div className="h-px bg-gradient-to-l from-transparent to-orange-100 mt-1"/>
                  </div>
                );
                if(isH3) return <h4 key={i} className="font-black text-slate-800 text-xs mt-3 mb-1">{t}</h4>;
                if(isBullet) return (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0" style={{background:"#FF6B00"}}/>
                    <p className="text-slate-600 text-sm leading-7">{t}</p>
                  </div>
                );
                return <p key={i} className="text-slate-600 text-sm leading-8">{t}</p>;
              })}
              <div ref={ref}/>
              {loading&&<span className="inline-block w-1.5 h-4 bg-orange-400 animate-pulse ml-1 rounded"/>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── کامپوننت اصلی ─────────────────────────────────────────
export default function TestResultVisualization({
  testId, testName, mainResult, scores, compact=false
}:{
  testId:string; testName:string; mainResult:string; scores:any; compact?:boolean;
}) {
  const renderGraph=()=>{
    let _raw:any={};
    try { _raw=typeof scores==='string'?JSON.parse(scores):scores||{}; } catch { _raw={}; }
    const canonical=normalizeTestScores(testId,_raw);
    const _ans=_raw.answers||{};
    function _sub(f:number,t:number,rv:number[]=[]){
    // فقط برای تست‌هایی که answers عددی دارن
    if(!_ans||Object.keys(_ans).length===0) return 50;
    const firstVal=Object.values(_ans)[0];
    if(typeof firstVal==="string"&&isNaN(Number(firstVal))) return 50; // MBTI-style
    let sm=0,n=0;
    for(let i=f;i<=t;i++){
      const raw=_ans[i]??_ans[String(i)]??3;
      const v=Number(raw)||3; // handle NaN
      sm+=rv.includes(i)?6-v:v; n++;
    }
    return n?Math.round(sm/n/5*100):50;
  }
    // raw→درصد: اگه مقدار کمتر از max بود raw هست وگرنه درصد
  function toP(v:any,mx:number):number{
    if(v==null||v===undefined)return -1;
    const n=Number(v); if(isNaN(n))return -1;
    // cap at 100% — اگه raw value بزرگتر از max بود نرمال کن
    if(n>mx) return 100;
    return Math.min(100,Math.round(n/mx*100));
  }
  const s:any={
      ...canonical,
      E: toP(canonical.E,30)>=0 ? toP(canonical.E,30) : _sub(1,6,[4,6]),
      A: toP(canonical.A,30)>=0 ? toP(canonical.A,30) : _sub(7,12,[10,12]),
      C: toP(canonical.C,30)>=0 ? toP(canonical.C,30) : _sub(13,18,[16,18]),
      N: toP(canonical.N,30)>=0 ? toP(canonical.N,30) : _sub(19,24,[20,22,24]),
      O: toP(canonical.O,30)>=0 ? toP(canonical.O,30) : _sub(25,30,[28,30]),
      // ANX/AVO raw نگه داشته میشن چون ECRViz با MAX=63 و threshold=36 کار میکنه
      ANX: canonical.ANX??canonical.anxiety??0,
      AVO: canonical.AVO??canonical.avoidance??0,
      CR: toP(canonical.CR,canonical._CR_max||35)>=0 ? toP(canonical.CR,canonical._CR_max||35) : 0,
      ES: toP(canonical.ES,canonical._ES_max||35)>=0 ? toP(canonical.ES,canonical._ES_max||35) : 0,
      // IRI: محاسبه از answers اگه max ذخیره شده
      // subscale mapping از catalog: PT:[1,2,3,9], EC:[4,5,6,8,10], PD:[7]
      EC: (()=>{
        const raw=canonical.EC; if(raw==null)return 0;
        const mx=canonical._EC_max||25;
        if(mx>0) return Math.min(100,Math.round(raw/mx*100));
        // fallback: از answers بازحساب
        const ans=_raw.answers||{};
        const ecQs=[4,5,6,8,10];
        const ecVals=ecQs.map(q=>Number(ans[q]??ans[String(q)]??0)).filter(v=>v>0);
        return ecVals.length?Math.min(100,Math.round(ecVals.reduce((a,b)=>a+b,0)/(ecVals.length*5)*100)):0;
      })(),
      PT: (()=>{
        const raw=canonical.PT; if(raw==null)return 0;
        const mx=canonical._PT_max||20;
        if(mx>0) return Math.min(100,Math.round(raw/mx*100));
        const ans=_raw.answers||{};
        const ptQs=[1,2,3,9];
        const ptVals=ptQs.map(q=>Number(ans[q]??ans[String(q)]??0)).filter(v=>v>0);
        return ptVals.length?Math.min(100,Math.round(ptVals.reduce((a,b)=>a+b,0)/(ptVals.length*5)*100)):0;
      })(),
      FS: (()=>{
        const raw=canonical.FS; if(raw==null)return -1;
        const mx=canonical._FS_max||0;
        return mx>0?Math.min(100,Math.round(raw/mx*100)):0;
      })(),
      PD: (()=>{
        const raw=canonical.PD;
        if(raw==null){
          // از answers بازحساب: PD=[7]
          const ans=_raw.answers||{};
          const v=Number(ans[7]??ans["7"]??0);
          return v>0?Math.min(100,Math.round(v/5*100)):-1;
        }
        const mx=canonical._PD_max||5;
        return mx>0?Math.min(100,Math.round(raw/mx*100)):0;
      })(),
      total:canonical.total??0,
    };
    if(testId==="raavi_matching_basis_v1"||testId==="mbti"||testId.includes("matching")) return <MBTIViz scores={s} mainResult={mainResult}/>;
    if(testId==="neo_ffi") return <NEOViz scores={s}/>;
    if(testId==="ecr_r") return <ECRViz scores={s} mainResult={mainResult}/>;
    if(testId==="erq") return <ERQViz scores={s}/>;
    if(testId==="iri") return <IRIViz scores={s}/>;
    if(["phq9","gad7","bai","isi","asrs","bdi2","pcl5","ybocs"].includes(testId))
      return <GaugeViz scores={s} testId={testId}/>;
    if(testId==="gottman") {
      if (!Number.isFinite(s.relationship_health)) {
        return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm leading-7 text-amber-800">
          این نتیجه با نسخهٔ قدیمی پرسش‌نامه ثبت شده و با مقیاس ۱۲ سؤالی فعلی قابل مقایسه نیست. برای تفسیر و امتیاز معتبر، آزمون را دوباره انجام دهید.
        </div>;
      }
      const level = (value:number) => Math.max(0,Math.min(100,Math.round((value-2)/8*100)));
      const health = Number(s.relationship_health ?? 0);
      const horsemen=[
        {k:"criticism",l:"انتقاد",icon:"🗣️",color:"#f97316",val:level(Number(s.criticism??2)),max:100},
        {k:"contempt",l:"تحقیر",icon:"😤",color:"#ef4444",val:level(Number(s.contempt??2)),max:100},
        {k:"defensiveness",l:"دفاعی",icon:"🛡️",color:"#eab308",val:level(Number(s.defensiveness??2)),max:100},
        {k:"stonewalling",l:"سنگ",icon:"🧱",color:"#6366f1",val:level(Number(s.stonewalling??2)),max:100},
      ];
      return (
        <div>
          <Pentagon dims={horsemen.map(h=>({
            label:h.l,
            value:Math.max(1,100-h.val), // معکوس: کمتر=سالم‌تر
            max:100,color:h.color
          }))} size={190} testId={testId} scores={s}/>
          <div className="flex justify-center my-2">
            <div className="px-4 py-2 rounded-full text-xs font-black"
              style={{background:health>=70?"rgba(34,197,94,0.1)":health>=40?"rgba(234,179,8,0.1)":"rgba(239,68,68,0.1)",
                color:health>=70?"#22c55e":health>=40?"#eab308":"#ef4444"}}>
              {health>=70?"🟢 روابط سالم":health>=40?"🟡 نیاز به توجه":"🔴 نیاز به کمک"} — سلامت رابطه {health}٪
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {horsemen.map((h:any)=>{
              // healthPct: کمتر = مشکل بیشتر (سینک با pentagon)
              const healthPct=Math.max(0,100-h.val); // h.val قبلاً % شده
              const clr=healthPct>=70?"#22c55e":healthPct>=40?"#f97316":"#ef4444";
              const label=healthPct>=70?"✅ سالم":healthPct>=40?"⚠️ متوسط":"❌ بالا";
              return (
              <div key={h.k} className="p-3 rounded-2xl"
                style={{background:`${h.color}06`,border:`1px solid ${h.color}20`}}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{h.icon}</span>
                  <span className="text-xs font-black text-slate-700">{h.l}</span>
                  <span className="mr-auto text-[10px] font-black" style={{color:clr}}>
                    {label} {healthPct}٪
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{width:`${healthPct}%`,background:`linear-gradient(90deg,${clr}60,${clr})`,
                      transition:"width 1s ease"}}/>
                </div>
              </div>
            );})}
          </div>
        </div>
      );
    }

    // ── Love Languages ──────────────────────────────────
    if(testId==="love_languages") {
      // recalc از answers — words:[1,2] time:[3,4] gifts:[5,6] acts:[7,8] touch:[9,10]
    const llAns=_raw.answers||{};
    const llSum=(qs:number[])=>qs.reduce((s,q)=>s+(Number(llAns[q]??llAns[String(q)]??0)),0);
    const llMax=10; // 2سوال × 5
    const langs=[
        {k:"words",l:"تأیید کلامی",icon:"💬",color:"#ec4899",val:s.words||llSum([1,2]),max:llMax},
        {k:"acts",l:"خدمت‌گزاری",icon:"🤝",color:"#f97316",val:s.acts||llSum([7,8]),max:llMax},
        {k:"gifts",l:"هدیه دادن",icon:"🎁",color:"#eab308",val:s.gifts||llSum([5,6]),max:llMax},
        {k:"time",l:"وقت باهم",icon:"⏰",color:"#22c55e",val:s.time||llSum([3,4]),max:llMax},
        {k:"touch",l:"لمس فیزیکی",icon:"🤗",color:"#a855f7",val:s.touch||llSum([9,10]),max:llMax},
      ];
      const maxVal=Math.max(...langs.map(l=>l.val));
      return (
        <div>
          <Pentagon dims={langs.map(l=>({label:l.l,value:l.val,max:l.max,color:l.color}))} size={200} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {langs.map((l,i)=>(
              <div key={l.k} className="flex items-center gap-2">
                <span className="text-base flex-shrink-0">{l.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-black text-slate-700">{l.l}</span>
                    <span className="text-xs font-black" style={{color:l.color}}>
                      {l.val}/{l.max} {l.val===maxVal?"⭐":""}
                    </span>
                  </div>
                  <Bar pct={Math.round(l.val/l.max*100)} color={l.color} label="" delay={i*80}/>
                </div>
              </div>
            ))}
          </div>
          {mainResult&&<div className="mt-3 p-3 rounded-2xl text-center text-sm font-black"
            style={{background:"rgba(236,72,153,0.06)",color:"#ec4899"}}>
            زبان محبت اصلی: {mainResult}
          </div>}
        </div>
      );
    }

    // ── Conflict Style ────────────────────────────────────
    if(testId==="conflict_style") {
      // calcScores مقادیر % برمیگردونه (0-100)
    // recalc از answers اگه subscale ذخیره نشده
    const csAns=_raw.answers||{};
    const csSum=(qs:number[])=>{const vs=qs.map(q=>Number(csAns[q]??csAns[String(q)]??0)).filter(v=>v>0);return vs.length?Math.round(vs.reduce((a,b)=>a+b,0)/(vs.length*5)*100):0;};
    const hasCS=s.collaborating!=null&&s.collaborating!==0;
    const styles=[
        {k:"collaborating",l:"همکارانه",color:"#22c55e",val:hasCS?s.collaborating:csSum([1,6,10]),max:100},
        {k:"competing",l:"رقابتی",color:"#ef4444",val:hasCS?s.competing:csSum([4,7]),max:100},
        {k:"compromising",l:"مصالحه",color:"#eab308",val:hasCS?s.compromising:csSum([2,9]),max:100},
        {k:"avoiding",l:"اجتنابی",color:"#6366f1",val:hasCS?s.avoiding:csSum([3,8]),max:100},
        {k:"accommodating",l:"تسلیم",color:"#0ea5e9",val:hasCS?s.accommodating:csSum([5]),max:100},
      ];
      return (
        <div>
          <Pentagon dims={styles.map(st=>({label:st.l,value:st.val,max:st.max,color:st.color}))} size={190} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {styles.map((st,i)=><Bar key={st.k} pct={Math.round(st.val/st.max*100)} color={st.color} label={st.l} delay={i*70}/>)}
          </div>
        </div>
      );
    }

    // ── HEXACO ───────────────────────────────────────────
    if(testId==="hexaco") {
      // H:[1-4](max20) E2:[5,6](max10) X:[7,8](max10) C2:[9,10](max10) O2:[11,12](max10)
      const ha=_raw.answers||{};
      const hexRaw=(qs:number[])=>qs.reduce((s,q)=>s+(Number(ha[q]??ha[String(q)]??0)),0);
      const hexPct=(qs:number[],mx:number)=>{const r=hexRaw(qs);return r>0?Math.min(100,Math.round(r/mx*100)):0;};
      const dims=[
        {label:"H — صداقت",value:s.H>0?Math.min(100,Math.round(s.H/20*100)):hexPct([1,2,3,4],20),max:100,color:"#f59e0b"},
        {label:"E — هیجان",value:s.E_h>0?Math.min(100,Math.round(s.E_h/10*100)):hexPct([5,6],10),max:100,color:"#6366f1"},
        {label:"X — برون‌گرا",value:s.X>0?Math.min(100,Math.round(s.X/10*100)):hexPct([7,8],10),max:100,color:"#FF6B00"},
        {label:"C — وظیفه",value:s.C>0?Math.min(100,Math.round(s.C/10*100)):hexPct([9,10],10),max:100,color:"#3b82f6"},
        {label:"O — گشودگی",value:s.O>0?Math.min(100,Math.round(s.O/10*100)):hexPct([11,12],10),max:100,color:"#a855f7"},
      ];
      return (
        <div>
          <Pentagon dims={dims} size={200} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {dims.map((d,i)=><Bar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*70}/>)}
          </div>
        </div>
      );
    }

    // ── DASS-21 ──────────────────────────────────────────
    if(testId==="dass21") {
      const d2=s.D_standard??((s.D??s.depression??0)*2);
      const a2=s.A_standard??((s.A??s.anxiety??0)*2);
      const ss=s.S_standard??((s.S??s.stress??0)*2);
      return (
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            <Ring value={d2} max={42} color="#6366f1" size={90} label="افسردگی"/>
            <Ring value={a2} max={42} color="#f97316" size={90} label="اضطراب"/>
            <Ring value={ss} max={42} color="#ef4444" size={90} label="استرس"/>
          </div>
          <Bar pct={Math.round(d2/42*100)} color="#6366f1" label="افسردگی" delay={0}/>
          <Bar pct={Math.round(a2/42*100)} color="#f97316" label="اضطراب" delay={100}/>
          <Bar pct={Math.round(ss/42*100)} color="#ef4444" label="استرس" delay={200}/>
        </div>
      );
    }

    // ── MDQ ──────────────────────────────────────────────
    if(testId==="mdq") {
      const answers=s.answers||{};
      const symptoms=Array.from({length:13},(_,i)=>Number(answers[i+1]??answers[String(i+1)]??0)).filter(v=>v===1).length;
      const concurrent=Number(answers[14]??answers["14"]??0)===1;
      const impaired=Number(answers[15]??answers["15"]??0)===1;
      const needsReview=symptoms>=7&&concurrent&&impaired;
      const color=needsReview?"#ef4444":"#22c55e";
      return (
        <div className="flex flex-col items-center gap-4">
          <Ring value={symptoms} max={13} color={color} size={110} label="نشانه‌های مثبت"/>
          <Bar pct={Math.round(symptoms/13*100)} color={color} label={needsReview?"نیازمند ارزیابی":"زیر آستانهٔ غربالگری"}/>
        </div>
      );
    }

    // ── PID-5 ────────────────────────────────────────────
    if(testId==="pid5") {
      // recalc از answers اگه subscale ذخیره نشده
      const p5Ans=_raw.answers||{};
      const p5Sum=(qs:number[])=>qs.reduce((s,q)=>s+(Number(p5Ans[q]??p5Ans[String(q)]??0)),0);
      const p5Max=(qs:number[])=>qs.length*3;
      const p5Pct=(qs:number[])=>{const r=p5Sum(qs);return r>0?Math.min(100,Math.round(r/p5Max(qs)*100)):0;};
      const hasPid=s.negative_affect!=null&&s.negative_affect>0;
      const dims=[
        {label:"اثر منفی",value:hasPid?Math.min(100,Math.round((s.negative_affect??0)/9*100)):p5Pct([3,4,15]),max:100,color:"#ef4444"},
        {label:"جدایی",value:hasPid?Math.min(100,Math.round((s.detachment??0)/12*100)):p5Pct([7,8,9,10]),max:100,color:"#6366f1"},
        {label:"خصومت",value:hasPid?Math.min(100,Math.round((s.antagonism??0)/6*100)):p5Pct([1,2]),max:100,color:"#f97316"},
        {label:"مهارگسیختگی",value:hasPid?Math.min(100,Math.round((s.disinhibition??0)/12*100)):p5Pct([5,6,13,14]),max:100,color:"#eab308"},
        {label:"روان‌پریشی",value:hasPid?Math.min(100,Math.round((s.psychoticism??0)/6*100)):p5Pct([11,12]),max:100,color:"#a855f7"},
      ];
      return (
        <div>
          <Pentagon dims={dims} size={200} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {dims.map((d,i)=><Bar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*80}/>)}
          </div>
        </div>
      );
    }

    // ── YSQ ──────────────────────────────────────────────
    if(testId==="ysq") {
      // recalc از answers اگه subscale ذخیره نشده
      const yAns=_raw.answers||{};
      const ySum=(qs:number[])=>qs.reduce((s,q)=>s+(Number(yAns[q]??yAns[String(q)]??0)),0);
      const schemas:any={
        abandonment:[1,2],mistrust:[3,4],dependence:[5,6],defectiveness:[7,8],
        isolation:[9,10],unrelenting_standards:[11,12],entitlement:[13,14],
        self_sacrifice:[15,16],approval_seeking:[17,18]
      };
      const schemaLabels:any={abandonment:"رهاشدگی",mistrust:"بی‌اعتمادی",dependence:"وابستگی",defectiveness:"نقص",isolation:"انزوا",unrelenting_standards:"معیارهای سخت",entitlement:"استحقاق",self_sacrifice:"ایثار",approval_seeking:"تأییدطلبی"};
      // اگه subscale در s هست استفاده کن وگرنه از answers
      const schemaVals=Object.entries(schemas).map(([k,qs]:any)=>({
        key:k,label:schemaLabels[k]||k,
        val:s[k]!=null&&s[k]>0?s[k]:ySum(qs),
        max:12
      }));
      const colors=["#ef4444","#f97316","#eab308","#22c55e","#a855f7","#3b82f6","#ec4899","#0ea5e9","#6366f1"];
      if(!Object.keys(yAns).length&&!Object.entries(s).some(([k,v])=>!["total","answers"].includes(k)&&typeof v==="number"&&Number(v)>0))
        return <Ring value={s.total??50} max={100} color="#a855f7" size={100} label="YSQ"/>;
      const dims=schemaVals.map((sv,i)=>({label:sv.label.slice(0,8),value:sv.val,max:sv.max,color:colors[i%9]}));
      return (
        <div>
          <Pentagon dims={dims} size={190} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {dims.map((d,i)=><Bar key={i} pct={Math.round(d.value/d.max*100)} color={d.color} label={d.label} delay={i*70}/>)}
          </div>
        </div>
      );
    }

    // ── Sexual Compat ────────────────────────────────────
    if(testId==="sexual_compat") {
      // recalc از answers — 5 گروه مساوی
      const scAns=Object.entries(_raw.answers||{}).sort(([a],[b])=>Number(a)-Number(b)).map(([,v])=>Number(v));
      const scN=Math.ceil(scAns.length/5);
      const scPct=(sl:number[])=>sl.length?Math.round(sl.reduce((a,b)=>a+b,0)/(sl.length*5)*100):50;
      const dims=[
        {label:"نیاز جنسی",value:s.desire!=null&&s.desire!==50?s.desire:scPct(scAns.slice(0,scN)),max:100,color:"#ec4899"},
        {label:"تناسب",value:s.compatibility!=null&&s.compatibility!==50?s.compatibility:scPct(scAns.slice(scN,scN*2)),max:100,color:"#f97316"},
        {label:"ارتباط",value:s.communication!=null&&s.communication!==50?s.communication:scPct(scAns.slice(scN*2,scN*3)),max:100,color:"#3b82f6"},
        {label:"صمیمیت",value:s.intimacy!=null&&s.intimacy!==50?s.intimacy:scPct(scAns.slice(scN*3,scN*4)),max:100,color:"#a855f7"},
        {label:"رضایت",value:s.satisfaction!=null&&s.satisfaction!==50?s.satisfaction:scPct(scAns.slice(scN*4)),max:100,color:"#22c55e"},
      ];
      return (
        <div>
          <Pentagon dims={dims} size={200} testId={testId} scores={s}/>
          <div className="space-y-2 mt-3">
            {dims.map((d,i)=><Bar key={i} pct={d.value} color={d.color} label={d.label} delay={i*80}/>)}
          </div>
        </div>
      );
    }

    // ── MMPI / MCMI ──────────────────────────────────────
    if(testId==="mmpi_screen"||testId==="mcmi_screen") {
      const sc=Object.entries(s).filter(([k])=>!["total","answers"].includes(k)&&typeof s[k]==="number").slice(0,6);
      const colors=["#ef4444","#f97316","#eab308","#22c55e","#0ea5e9","#a855f7"];
      if(!sc.length) return <Ring value={s.total??50} max={100} color="#64748b" size={100} label={testId}/>;
      return (
        <div>
          <div className="flex gap-3 flex-wrap justify-center mb-4">
            {sc.slice(0,4).map(([k,v],i)=><Ring key={k} value={Number(v)} max={100} color={colors[i]} size={72} label={k.slice(0,6)}/>)}
          </div>
          <div className="space-y-2">
            {sc.map(([k,v],i)=><Bar key={k} pct={Math.min(100,Math.round(Number(v)))} color={colors[i%6]} label={k} delay={i*60}/>)}
          </div>
        </div>
      );
    }

    // ── Generic Fallback ─────────────────────────────────
    const total=s.total??0;
    const pctG=typeof total==="number"&&total>0?Math.min(100,Math.round(total/27*100)):65;
    const colorG=pctG>=70?"#22c55e":pctG>=40?"#f97316":"#ef4444";
    return (
      <div className="flex flex-col items-center gap-4">
        <Ring value={total||65} max={Math.max(total||65,100)} color={colorG} size={110} label={testName||testId}/>
        {mainResult&&<p className="text-sm font-black text-slate-700 text-center">{mainResult}</p>}
      </div>
    );
  };

  return (
    <div style={{direction:"rtl"}}>
      <style>{`
        @keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>
      {renderGraph()}
    </div>
  );
}

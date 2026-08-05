"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowRight, MapPin, Clock, Users, DollarSign } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EditEventPage() {
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:"success"|"error",text:string}|null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    city: "",
    start_date: "",
    end_date: "",
    capacity: 0,
    price: 0,
    is_active: true,
  });

  useEffect(()=>{
    const tok=localStorage.getItem("token")||"";
    fetch(`${API}/api/events/${id}`,{headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if(!d){router.push("/admin/events");return;}
        // تبدیل تاریخ به فرمت input
        const toLocal=(dt:string)=>{
          if(!dt) return "";
          const d=new Date(dt);
          const pad=(n:number)=>String(n).padStart(2,"0");
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setForm({
          title: d.title||"",
          description: d.description||"",
          location: d.location||"",
          city: d.city||"",
          start_date: toLocal(d.start_date),
          end_date: toLocal(d.end_date),
          capacity: d.capacity||0,
          price: d.price||0,
          is_active: d.is_active!==false,
        });
      })
      .finally(()=>setLoading(false));
  },[id]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const tok=localStorage.getItem("token")||"";
    try {
      const body={
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price),
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
      };
      const res=await fetch(`${API}/api/events/${id}`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${tok}`},
        body:JSON.stringify(body),
      });
      if(res.ok){
        setMsg({type:"success",text:"✅ همنشینی با موفقیت آپدیت شد"});
        setTimeout(()=>router.push("/admin/events"),1500);
      } else {
        const err=await res.json();
        setMsg({type:"error",text:err?.message||"خطا در ذخیره"});
      }
    } catch {
      setMsg({type:"error",text:"خطا در ارتباط با سرور"});
    } finally { setSaving(false); }
  };

  const inp = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent"/>
    </div>
  );

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto" style={{direction:"rtl"}}>
      {/* هدر */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>router.push("/admin/events")}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{background:"rgba(0,0,0,0.05)"}}>
          <ArrowRight size={20}/>
        </button>
        <h1 className="text-xl font-black text-slate-900">ویرایش همنشینی</h1>
      </div>

      {msg&&(
        <div className={`p-4 rounded-2xl mb-4 font-bold text-sm ${msg.type==="success"?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

        {/* عنوان */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 block">عنوان همنشینی</label>
          <input className={inp} value={form.title}
            onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        </div>

        {/* توضیحات */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 block">توضیحات</label>
          <textarea className={inp} rows={3} value={form.description}
            onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>

        {/* زمان شروع */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
            <Clock size={12}/> زمان شروع
          </label>
          <input type="datetime-local" className={inp} value={form.start_date}
            onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/>
        </div>

        {/* زمان پایان */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
            <Clock size={12}/> زمان پایان
          </label>
          <input type="datetime-local" className={inp} value={form.end_date}
            onChange={e=>setForm(f=>({...f,end_date:e.target.value}))}/>
        </div>

        {/* مکان */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
            <MapPin size={12}/> مکان دقیق
            <span className="text-orange-500 font-normal text-[10px]">(۱۰ ساعت قبل نمایش داده میشه)</span>
          </label>
          <input className={inp} value={form.location}
            onChange={e=>setForm(f=>({...f,location:e.target.value}))}
            placeholder="آدرس کامل محل برگزاری"/>
        </div>

        {/* شهر */}
        <div>
          <label className="text-xs font-black text-slate-600 mb-1 block">شهر</label>
          <input className={inp} value={form.city}
            onChange={e=>setForm(f=>({...f,city:e.target.value}))}/>
        </div>

        {/* ظرفیت + قیمت */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
              <Users size={12}/> ظرفیت
            </label>
            <input type="number" className={inp} value={form.capacity}
              onChange={e=>setForm(f=>({...f,capacity:Number(e.target.value)}))}/>
          </div>
          <div>
            <label className="text-xs font-black text-slate-600 mb-1 flex items-center gap-1">
              <DollarSign size={12}/> قیمت (تومان)
            </label>
            <input type="number" className={inp} value={form.price}
              onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))}/>
          </div>
        </div>

        {/* وضعیت */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
          <label className="text-sm font-black text-slate-700">فعال</label>
          <button onClick={()=>setForm(f=>({...f,is_active:!f.is_active}))}
            className={`w-12 h-6 rounded-full transition-all ${form.is_active?"bg-orange-500":"bg-slate-300"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5 ${form.is_active?"translate-x-6":"translate-x-0"}`}/>
          </button>
        </div>
      </div>

      {/* دکمه ذخیره */}
      <button onClick={handleSave} disabled={saving}
        className="w-full mt-4 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        style={{background:"linear-gradient(135deg,#FF6B00,#f97316)",
          boxShadow:"0 4px 20px rgba(255,107,0,0.4)"}}>
        <Save size={18}/>
        {saving?"در حال ذخیره...":"ذخیره تغییرات"}
      </button>
    </div>
  );
}

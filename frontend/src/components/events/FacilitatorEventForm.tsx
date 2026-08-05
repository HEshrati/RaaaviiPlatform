"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Calendar, CheckCircle2, Clock, FileText, ImageIcon,
  Loader2, MapPin, Save, Tag, Users, Wallet,
} from "lucide-react";
import {
  ApiEvent, createFacilitatorEvent, fetchFacilitatorEvents,
  updateFacilitatorEvent,
} from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const CATEGORIES = [
  ["hamneshin", "همنشین"], ["hamsohbat", "هم‌صحبت"], ["hambazi", "هم‌بازی"],
  ["hampa", "هم‌پا"], ["hamamooz", "هم‌آموز"], ["hamfekr", "هم‌فکر"],
  ["hamteymi", "هم‌تیمی"], ["hamghesse", "هم‌قصه"],
];
const CITIES = ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت", "یزد", "کرمان", "همدان"];

type FormState = {
  title: string; description: string; category: string; city: string;
  location: string; date: string; time: string; duration: number;
  capacity: number; price: number; tags: string;
};

const emptyForm: FormState = {
  title: "", description: "", category: "hamneshin", city: "تهران",
  location: "", date: "", time: "", duration: 120, capacity: 10, price: 0, tags: "",
};

function localParts(value?: string) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offset).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function localIso(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 19);
}

export default function FacilitatorEventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!eventId) return;
    fetchFacilitatorEvents()
      .then(({ events }) => {
        const found = events.find(item => item.id === eventId);
        if (!found) throw new Error("رویداد در فهرست شما پیدا نشد");
        setEvent(found);
        const start = localParts(found.start_date || found.startDate);
        const end = found.end_date || found.endDate ? new Date(found.end_date || found.endDate!) : null;
        const startDate = new Date(found.start_date || found.startDate);
        const duration = end && Number.isFinite(end.getTime()) ? Math.max(30, Math.round((end.getTime() - startDate.getTime()) / 60_000)) : 120;
        setForm({
          title: found.title || "",
          description: found.description || "",
          category: found.category || found.event_type || "hamneshin",
          city: found.city || "تهران",
          location: found.location || "",
          date: start.date,
          time: start.time,
          duration,
          capacity: found.capacity || 10,
          price: Number(found.price || 0),
          tags: (found.tags || []).join(", "),
        });
        setImagePreview(found.image_url || "");
      })
      .catch(err => setError(err.message || "خطا در دریافت رویداد"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const set = (key: keyof FormState, value: string | number) =>
    setForm(previous => ({ ...previous, [key]: value }));

  async function uploadImage() {
    if (!imageFile) return event?.image_url;
    const body = new FormData();
    body.append("image", imageFile);
    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${API}/api/events/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "آپلود تصویر ناموفق بود");
    return data.url as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.title.trim() || !form.city || !form.location.trim() || !form.date || !form.time) {
      setError("عنوان، شهر، مکان، تاریخ و ساعت برگزاری الزامی است.");
      return;
    }
    const startValue = `${form.date}T${form.time}:00`;
    const start = new Date(startValue);
    if (start.getTime() <= Date.now()) {
      setError("زمان رویداد باید در آینده باشد.");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const payload: Partial<ApiEvent> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        event_type: form.category,
        city: form.city,
        location: form.location.trim(),
        start_date: startValue,
        end_date: localIso(new Date(start.getTime() + Number(form.duration) * 60_000)),
        capacity: Number(form.capacity),
        price: Number(form.price),
        tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: imageUrl || undefined,
      };
      if (eventId) {
        await updateFacilitatorEvent(eventId, payload);
        setSuccess(event?.approval_status === "needs_revision"
          ? "اصلاحات ثبت و درخواست دوباره برای ادمین ارسال شد."
          : "تغییرات رویداد ذخیره شد.");
      } else {
        await createFacilitatorEvent(payload);
        setSuccess("درخواست رویداد برای بررسی ادمین ارسال شد.");
      }
      setTimeout(() => router.push("/panel/facilitator/events"), 1200);
    } catch (err: any) {
      setError(err.message || "ثبت رویداد ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-orange-400" /></div>;

  const input = "w-full rounded-xl border border-white/[.08] bg-white/[.045] px-3 py-3 text-sm text-white outline-none transition focus:border-orange-400/60";
  return (
    <div dir="rtl" className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-white">{eventId ? "ویرایش رویداد" : "پیشنهاد رویداد جدید"}</h1>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          {eventId ? "اطلاعات را با دقت به‌روزرسانی کنید." : "پس از ثبت، رویداد برای بررسی ادمین ارسال می‌شود و تا زمان تأیید منتشر نخواهد شد."}
        </p>
      </div>

      {event?.review_note && (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/[.07] p-4 text-xs text-amber-200">
          یادداشت ادمین: {event.review_note}
        </div>
      )}
      {error && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4 text-xs text-red-300"><AlertCircle size={15} />{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-4 text-xs text-emerald-300"><CheckCircle2 size={15} />{success}</div>}

      <form onSubmit={submit} className="space-y-4">
        <section className="rounded-3xl border border-white/[.07] bg-white/[.035] p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-white"><FileText size={16} className="text-orange-400" /> اطلاعات اصلی</h2>
          <div className="space-y-3">
            <input className={input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="عنوان رویداد *" maxLength={120} />
            <textarea className={`${input} min-h-28 resize-y`} value={form.description} onChange={e => set("description", e.target.value)} placeholder="شرح رویداد، برنامه و مناسب چه کسانی است؟" maxLength={3000} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative"><Tag className="absolute right-3 top-3.5 text-slate-500" size={14} /><select className={`${input} pr-9`} value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(([id, label]) => <option className="bg-slate-900" key={id} value={id}>{label}</option>)}</select></label>
              <label className="relative"><MapPin className="absolute right-3 top-3.5 text-slate-500" size={14} /><select className={`${input} pr-9`} value={form.city} onChange={e => set("city", e.target.value)}>{CITIES.map(city => <option className="bg-slate-900" key={city}>{city}</option>)}</select></label>
            </div>
            <input className={input} value={form.location} onChange={e => set("location", e.target.value)} placeholder="نشانی دقیق (فقط ۱۰ ساعت قبل برای رزروکننده نمایش داده می‌شود) *" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/[.07] bg-white/[.035] p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-white"><Calendar size={16} className="text-orange-400" /> زمان و ظرفیت</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={input} value={form.date} onChange={e => set("date", e.target.value)} />
            <input type="time" className={input} value={form.time} onChange={e => set("time", e.target.value)} />
            <label className="relative"><Clock className="absolute right-3 top-3.5 text-slate-500" size={14} /><input type="number" min={30} step={15} className={`${input} pr-9`} value={form.duration} onChange={e => set("duration", Number(e.target.value))} placeholder="مدت (دقیقه)" /></label>
            <label className="relative"><Users className="absolute right-3 top-3.5 text-slate-500" size={14} /><input type="number" min={1} max={500} className={`${input} pr-9`} value={form.capacity} onChange={e => set("capacity", Number(e.target.value))} placeholder="ظرفیت" /></label>
            <label className="relative col-span-2"><Wallet className="absolute right-3 top-3.5 text-slate-500" size={14} /><input type="number" min={0} step={1000} className={`${input} pr-9`} value={form.price} onChange={e => set("price", Number(e.target.value))} placeholder="مبلغ به ریال؛ برای رایگان صفر وارد کنید" /></label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[.07] bg-white/[.035] p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-white"><ImageIcon size={16} className="text-orange-400" /> تصویر و برچسب‌ها</h2>
          <input className={input} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="برچسب‌ها با ویرگول؛ مثال: گفتگو، رشد فردی" />
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/10 p-3 text-xs text-slate-400 hover:border-orange-400/40">
            <ImageIcon size={18} className="text-orange-400" />
            <span className="flex-1">{imageFile?.name || "انتخاب تصویر رویداد (حداکثر ۵ مگابایت)"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) return setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }} />
          </label>
          {imagePreview && <img src={imagePreview} alt="پیش‌نمایش" className="mt-3 h-44 w-full rounded-2xl object-cover" />}
        </section>

        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-orange-400 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/15 disabled:opacity-60">
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? "در حال ثبت..." : eventId ? "ذخیره تغییرات" : "ارسال درخواست برای ادمین"}
        </button>
      </form>
    </div>
  );
}

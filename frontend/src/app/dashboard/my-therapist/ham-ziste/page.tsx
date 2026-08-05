"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, MapPin, Globe, Calendar, Loader2 } from "lucide-react";

interface Group {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  schedule?: string;
  mode?: "online" | "in_person";
  city?: string;
  members_count: number;
  capacity: number;
  price_per_month: number;
  status: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://raaviiplatform.com";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");

export default function HamZistehListPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [confirmingGroup, setConfirmingGroup] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "wallet">("zarinpal");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // FIX: استفاده از API واقعی hamzist (نه my-therapist قدیمی)
    fetch(`${API}/api/hamzist/groups`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (groupId: string, price: number) => {
    // اگه گروه پولیه و هنوز روش پرداخت تأیید نشده → نمایش modal تأیید
    if (price > 0 && confirmingGroup !== groupId) {
      setConfirmingGroup(groupId);
      setMsg(null);
      return;
    }

    setJoinLoading(groupId);
    setMsg(null);

    try {
      const r = await fetch(`${API}/api/hamzist/groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ paymentMethod: price > 0 ? paymentMethod : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "خطا در عضویت");

      // FIX: ریدایرکت به درگاه اگه paymentUrl داشت
      if (d.paymentUrl) {
        window.location.href = d.paymentUrl;
        return;
      }

      setMsg({ type: "success", text: d.message || "درخواست عضویت ثبت شد ✅" });
      setConfirmingGroup(null);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    }
    setJoinLoading(null);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <div className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/my-therapist")} className="p-2 rounded-xl hover:bg-slate-100">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            <h1 className="text-base font-black">هم‌زیسته</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {msg && (
          <div className={`mt-4 p-3 rounded-2xl text-center text-sm font-bold ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="mt-5 mb-5 rounded-3xl p-5 bg-gradient-to-r from-[#1a1035] to-[#3b1d63] text-white">
          <h2 className="text-xl font-black">
            {groups.length > 0 ? `${groups.length} گروه فعال` : "در حال حاضر گروه فعالی موجود نیست"}
          </h2>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {groups.map(g => (
            <div key={g.id} className="rounded-3xl bg-white p-5 shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black">{g.name}</h3>
                  {g.topic && <p className="text-xs text-indigo-600 font-bold mt-1">{g.topic}</p>}
                </div>
              </div>
              {g.description && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{g.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                {g.schedule && <><Calendar size={11} /> {g.schedule}</>}
                {g.mode === "online" ? <Globe size={11} /> : <MapPin size={11} />}
                {g.mode === "online" ? "آنلاین" : g.city}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-slate-500">{g.members_count}/{g.capacity} عضو</span>
                <span className="text-sm font-black">
                  {g.price_per_month > 0 ? `${g.price_per_month.toLocaleString()} تومان/ماه` : "رایگان"}
                </span>
              </div>

              {/* FIX: تأیید پرداخت + انتخاب روش */}
              {confirmingGroup === g.id ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-600 font-bold">روش پرداخت:</p>
                  <div className="flex gap-2">
                    {(["zarinpal", "wallet"] as const).map(m => (
                      <button key={m} onClick={() => setPaymentMethod(m)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: paymentMethod === m ? "rgba(99,102,241,0.15)" : "#f8fafc",
                          border: `1px solid ${paymentMethod === m ? "#6366f1" : "#e2e8f0"}`,
                          color: paymentMethod === m ? "#4f46e5" : "#64748b",
                        }}>
                        {m === "zarinpal" ? "💳 درگاه بانکی" : "👛 کیف پول"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleJoin(g.id, g.price_per_month)}
                      disabled={joinLoading === g.id}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-white"
                      style={{ background: joinLoading === g.id ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                      {joinLoading === g.id ? "..." : "تأیید و پرداخت"}
                    </button>
                    <button onClick={() => { setConfirmingGroup(null); setMsg(null); }}
                      className="px-3 py-2 rounded-xl text-xs text-slate-500 bg-slate-100">
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => handleJoin(g.id, g.price_per_month)}
                  disabled={joinLoading === g.id || g.members_count >= g.capacity}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-black text-white"
                  style={{ background: g.members_count >= g.capacity ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  {g.members_count >= g.capacity ? "ظرفیت تکمیل" : "عضویت در گروه"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

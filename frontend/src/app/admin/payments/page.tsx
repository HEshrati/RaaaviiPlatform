"use client";
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";

const API = "https://raaviiplatform.com";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0, failed: 0 });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/api/admin/payments`, { headers: { Authorization:`Bearer ${token}` } });
    if (r.ok) {
      const d = await r.json();
      const list = Array.isArray(d) ? d : d?.payments || [];
      setPayments(list);
      setStats({
        total: list.reduce((s:number,p:any) => s + (p.amount||0), 0),
        successful: list.filter((p:any) => p.status === "paid").length,
        pending: list.filter((p:any) => p.status === "pending").length,
        failed: list.filter((p:any) => p.status === "failed").length,
      });
    }
    setLoading(false);
  }

  const STATUS_CFG: Record<string,any> = {
    paid:    { label:"پرداخت شده", color:"#22c55e", icon:CheckCircle2 },
    pending: { label:"در انتظار",  color:"#eab308", icon:Clock },
    failed:  { label:"ناموفق",    color:"#ef4444", icon:XCircle },
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.25)" }}>
            <DollarSign size={18} className="text-green-400" />
          </div>
          <h1 className="text-slate-800 font-black text-lg">مدیریت پرداخت‌ها</h1>
        </div>
        <button onClick={load}><RefreshCw size={16} className={`text-slate-500 ${loading?"animate-spin":""}`} /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label:"درآمد کل", value: stats.total ? `${(stats.total/10000).toFixed(0)}k` : "0k", color:"#22c55e" },
          { label:"پرداخت موفق", value: stats.successful, color:"#22c55e" },
          { label:"در انتظار", value: stats.pending, color:"#eab308" },
          { label:"ناموفق", value: stats.failed, color:"#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-2xl text-center"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-2xl font-black" style={{ color }}>{value || "۰"}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background:"rgba(255,255,255,0.04)" }} />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">پرداختی ثبت نشده</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="grid grid-cols-5 px-4 py-3 text-[10px] text-slate-500 font-bold border-b border-white/6">
            <span>کاربر</span><span>مبلغ</span><span>نوع</span><span>تاریخ</span><span>وضعیت</span>
          </div>
          {payments.map((p:any,i:number) => {
            const sc = STATUS_CFG[p.status] || STATUS_CFG.pending;
            const Icon = sc.icon;
            return (
              <div key={p.id||i} className="grid grid-cols-5 px-4 py-3 text-xs border-b border-white/4 hover:bg-white/2">
                <span className="text-slate-800 font-bold truncate">{p.user?.name || p.user_id?.slice(0,8)}</span>
                <span className="text-orange-400 font-bold">{p.amount ? (p.amount/10).toLocaleString("fa-IR")+"T" : "—"}</span>
                <span className="text-slate-400">{p.type || "—"}</span>
                <span className="text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString("fa-IR") : "—"}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color:sc.color }}>
                  <Icon size={10}/>{sc.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

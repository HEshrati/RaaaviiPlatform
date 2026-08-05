'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacilitatorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form'|'manifesto'|'status'>('form');
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [form, setForm] = useState({ firstName:'', lastName:'', nationalId:'', city:'', bio:'', eventExperience:'', portfolioUrl:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<any>(null);

  const CITIES = ['تهران','مشهد','اصفهان','شیراز','کرج','تبریز','اهواز','قم'];
  const token = () => localStorage.getItem('token');
  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' };

  useEffect(() => {
    fetch('/api/facilitator/domains', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setDomains(d.domains || [])).catch(() => {});
    fetch('/api/facilitator/status', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => { if (d.status !== 'not_started') { setStatus(d); setStep('status'); } }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.nationalId || !form.city || selectedDomains.length === 0)
      return setMsg('لطفاً همه فیلدهای اجباری را پر کنید');
    setLoading(true); setMsg('');
    try {
      const r = await fetch('/api/facilitator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, domains: selectedDomains }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStep('manifesto');
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const handleAcceptManifesto = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/facilitator/accept-manifesto', {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStatus({ status: 'pending_review', message: 'پروفایل در انتظار بررسی است' });
      setStep('status');
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const toggleDomain = (d: string) => setSelectedDomains(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  );

  return (
    <div dir="rtl" className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg,#0d1b2e,#1B2A4A,#243555)' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎭</div>
          <h1 className="text-2xl font-bold text-white">ثبت‌نام تسهیلگر</h1>
          <p className="text-white/50 text-sm mt-1">برگزاری رویدادهای راوی</p>
        </div>

        {msg && <div className="mb-4 p-3 rounded-xl text-red-400 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)' }}>{msg}</div>}

        {step === 'form' && (
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-white/70 text-sm mb-1 block">نام *</label>
                <input className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}
                  value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
              <div><label className="text-white/70 text-sm mb-1 block">نام خانوادگی *</label>
                <input className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}
                  value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
            </div>
            <div><label className="text-white/70 text-sm mb-1 block">کد ملی *</label>
              <input className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} dir="ltr"
                value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} /></div>
            <div><label className="text-white/70 text-sm mb-1 block">شهر *</label>
              <select className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}
                value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                <option value="">انتخاب کنید</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">حوزه‌های تسهیلگری * (حداقل ۱)</label>
              <div className="flex flex-wrap gap-2">
                {domains.map(d => (
                  <button key={d} onClick={() => toggleDomain(d)}
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: selectedDomains.includes(d) ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${selectedDomains.includes(d) ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
                      color: selectedDomains.includes(d) ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                    }}>{d}</button>
                ))}
              </div>
            </div>
            <div><label className="text-white/70 text-sm mb-1 block">تجربه برگزاری رویداد</label>
              <textarea rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle}
                placeholder="توضیح مختصری از سابقه برگزاری رویداد"
                value={form.eventExperience} onChange={e => setForm({...form, eventExperience: e.target.value})} /></div>
            <div><label className="text-white/70 text-sm mb-1 block">لینک نمونه کار (اختیاری)</label>
              <input className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} dir="ltr"
                placeholder="https://" value={form.portfolioUrl} onChange={e => setForm({...form, portfolioUrl: e.target.value})} /></div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
              {loading ? '...' : 'ادامه ←'}
            </button>
          </div>
        )}

        {step === 'manifesto' && (
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-white font-bold text-lg mb-4">📜 مرامنامه تسهیلگران راوی</h2>
            <div className="space-y-3 text-white/70 text-sm leading-relaxed mb-6">
              {['حفظ فضای امن روانشناختی برای همه شرکت‌کنندگان',
                'عدم تبعیض بر اساس جنسیت، قومیت، مذهب یا هر ویژگی دیگر',
                'محرمانگی اطلاعات شخصی شرکت‌کنندگان',
                'گزارش هرگونه رفتار ناایمن به تیم راوی',
                'پایبندی به ارزش‌های انسانی و اخلاق حرفه‌ای',
                'آمادگی کافی برای هر رویداد',
              ].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {msg && <p className="text-red-400 text-sm mb-3">{msg}</p>}
            <button onClick={handleAcceptManifesto} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
              {loading ? '...' : '✅ می‌پذیرم و ارسال می‌کنم'}
            </button>
          </div>
        )}

        {step === 'status' && status && (
          <div className="rounded-2xl p-8 text-center" style={cardStyle}>
            <div className="text-6xl mb-4">
              {status.status === 'approved' ? '✅' : status.status === 'rejected' ? '❌' : '⏳'}
            </div>
            <h2 className="text-white font-bold text-xl mb-2">{status.message || 'وضعیت نامشخص'}</h2>
            <p className="text-white/40 text-sm mt-4">تیم راوی درخواست شما را بررسی خواهد کرد</p>
          </div>
        )}
      </div>
    </div>
  );
}




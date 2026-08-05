'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'license' | 'profile' | 'status';

const SPECIALTIES = [
  'اضطراب و استرس','افسردگی','روابط زوجین','کودک و نوجوان','تروما و PTSD',
  'اختلالات شخصیت','وسواس فکری-عملی','مشاوره شغلی','خانواده‌درمانی','سایر',
];

export default function PsychologistOnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('license');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<any>(null);

  // Step 1
  const [licenseNumber, setLicenseNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Step 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [sessionPrice, setSessionPrice] = useState('');
  const [workingAreas, setWorkingAreas] = useState('');

  const token = () => localStorage.getItem('token');
  const CITIES = ['تهران','مشهد','اصفهان','شیراز','کرج','تبریز','اهواز','قم'];

  const handleVerifyLicense = async () => {
    if (!licenseNumber || !mobileNumber) return setError('همه فیلدها الزامی است');
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/psychologist-verify/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ licenseNumber, mobileNumber }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStep('profile');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !nationalId || !specialty || !city)
      return setError('لطفاً همه فیلدهای اجباری را پر کنید');
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/psychologist-verify/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ firstName, lastName, nationalId, specialty, bio, city, sessionPrice: +sessionPrice, workingAreas }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      const sr = await fetch('/api/psychologist-verify/status', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setStatus(await sr.json());
      setStep('status');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg,#0d1b2e,#1B2A4A,#243555)' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-2xl font-bold text-white">ثبت‌نام روانشناس</h1>
          <p className="text-white/50 text-sm mt-1">به تیم متخصصان راوی بپیوندید</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {['تأیید کد نظام','تکمیل پروفایل','وضعیت'].map((s, i) => {
            const idx = ['license','profile','status'].indexOf(step);
            return (
              <div key={s} className="flex-1 text-center">
                <div className="h-1 rounded-full mb-2" style={{ background: i <= idx ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
                <span className="text-xs" style={{ color: i <= idx ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>{s}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-red-400 text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        {/* Step 1: License */}
        {step === 'license' && (
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h2 className="text-white font-bold text-lg mb-4">مرحله ۱: تأیید کد نظام روانشناسی</h2>
            <div>
              <label className="text-white/70 text-sm mb-1 block">کد نظام روانشناسی *</label>
              <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                placeholder="مثلاً: ۱۲۳۴۵۶" className="w-full px-4 py-3 rounded-xl text-sm"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">شماره موبایل *</label>
              <input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="w-full px-4 py-3 rounded-xl text-sm"
                style={inputStyle} dir="ltr" />
            </div>
            <div className="p-3 rounded-xl text-xs text-white/50" style={{ background: 'rgba(59,130,246,0.05)' }}>
              💡 کد نظام شما با سامانه نظام پزشکی بررسی می‌شود. لطفاً از صحت آن مطمئن شوید.
            </div>
            <button onClick={handleVerifyLicense} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
              {loading ? 'در حال بررسی...' : 'ادامه ←'}
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 'profile' && (
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h2 className="text-white font-bold text-lg mb-4">مرحله ۲: تکمیل پروفایل تخصصی</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm mb-1 block">نام *</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">نام خانوادگی *</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">کد ملی *</label>
              <input value={nationalId} onChange={e => setNationalId(e.target.value)}
                placeholder="۱۲۳۴۵۶۷۸۹۰" className="w-full px-4 py-2 rounded-xl text-sm"
                style={inputStyle} dir="ltr" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">حوزه تخصص *</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
                <option value="">انتخاب کنید</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">شهر *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
                <option value="">انتخاب کنید</option>
                {['تهران','مشهد','اصفهان','شیراز','کرج','تبریز','اهواز','قم'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">بیوگرافی (اختیاری)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="توضیح مختصری از تجربه و رویکرد درمانی شما"
                className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">قیمت هر جلسه (تومان)</label>
              <input value={sessionPrice} onChange={e => setSessionPrice(e.target.value)}
                placeholder="مثلاً: ۳۰۰۰۰۰" type="number"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} dir="ltr" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">حوزه‌های کاری (اختیاری)</label>
              <input value={workingAreas} onChange={e => setWorkingAreas(e.target.value)}
                placeholder="مثلاً: مشاوره آنلاین، جلسات حضوری در کلینیک"
                className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
            </div>
            <button onClick={handleCompleteProfile} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
              {loading ? 'در حال ارسال...' : 'ارسال برای بررسی ←'}
            </button>
          </div>
        )}

        {/* Step 3: Status */}
        {step === 'status' && status && (
          <div className="rounded-2xl p-8 text-center" style={cardStyle}>
            <div className="text-6xl mb-4">
              {status.status === 'active' || status.status === 'approved' ? '✅' :
               status.status === 'rejected' ? '❌' : '⏳'}
            </div>
            <h2 className="text-white font-bold text-xl mb-2">{status.message}</h2>
            {status.trust_score > 0 && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <p className="text-white/60 text-sm">امتیاز اعتبارسنجی: <span className="text-blue-400 font-bold">{status.trust_score}/100</span></p>
              </div>
            )}
            {(status.status === 'active' || status.status === 'approved') && (
              <button onClick={() => router.push('/panel/psychologist')}
                className="mt-6 px-8 py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                ورود به داشبورد →
              </button>
            )}
            {(status.status !== 'active' && status.status !== 'approved') && (
              <p className="text-white/40 text-sm mt-4">پس از بررسی، ایمیل/پیامک اطلاع‌رسانی می‌شود</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




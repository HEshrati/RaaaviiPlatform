'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Slot {
  slot_id: string;
  start_datetime: string;
  end_datetime: string;
  session_type: string;
  location_description: string;
  psychologist_id: string;
  psychologist_name: string;
  specialty: string;
  bio: string;
  session_price: number;
  city: string;
  avatar_url?: string;
}

export default function HamravanPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [booking, setBooking] = useState<string | null>(null);
  const [userNeed, setUserNeed] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zarinpal' | 'wallet'>('zarinpal');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const CITIES = ['تهران','مشهد','اصفهان','شیراز','کرج','تبریز','اهواز','قم'];

  useEffect(() => { fetchSlots(); }, [city, sessionType]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (sessionType) params.append('type', sessionType);
      const r = await fetch(`/api/hamravan/slots?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const d = await r.json();
      setSlots(Array.isArray(d) ? d : []);
    } catch { setSlots([]); }
    setLoading(false);
  };

  const handleBookSlot = async (slotId: string) => {
    setBookingLoading(true);
    setErrorMsg('');
    try {
      const r = await fetch('/api/hamravan/book-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ slotId, dominantNeed: userNeed, paymentMethod }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'خطا در رزرو');

      // FIX: اگه paymentUrl داشت به درگاه ریدایرکت کن
      if (d.paymentUrl) {
        window.location.href = d.paymentUrl;
        return;
      }

      setSuccessMsg(d.message || 'جلسه با موفقیت رزرو شد ✅');
      setBooking(null);
      fetchSlots();
    } catch (e: any) { setErrorMsg(e.message); }
    setBookingLoading(false);
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('fa-IR', { weekday:'long', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });

  const fmtPrice = (p: number) => p ? `${p.toLocaleString('fa-IR')} تومان` : 'رایگان';

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1B2A4A 50%, #243555 100%)' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/60 hover:text-white text-2xl">←</button>
          <div>
            <h1 className="text-xl font-bold text-white">همروان</h1>
            <p className="text-white/60 text-sm">رزرو جلسه با روانشناس</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl text-center font-bold text-green-400" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            {successMsg}
          </div>
        )}

        <div className="mb-6 flex gap-3 flex-wrap">
          <select value={city} onChange={e => setCity(e.target.value)}
            className="px-4 py-2 rounded-xl text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <option value="">همه شهرها</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sessionType} onChange={e => setSessionType(e.target.value)}
            className="px-4 py-2 rounded-xl text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <option value="">همه انواع</option>
            <option value="online">آنلاین</option>
            <option value="in_person">حضوری</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-20 text-lg">در حال بارگذاری...</div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white/60 text-lg">هیچ زمان آزادی یافت نشد</p>
            <p className="text-white/40 text-sm mt-2">فیلتر دیگری امتحان کنید</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {slots.map(slot => (
              <div key={slot.slot_id}
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
                className="rounded-2xl p-5">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {slot.avatar_url ? <img src={slot.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👨‍⚕️'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-bold text-lg">{slot.psychologist_name || 'روانشناس'}</h3>
                        <p className="text-white/60 text-sm">{slot.specialty}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: slot.session_type === 'online' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
                          color: slot.session_type === 'online' ? '#60a5fa' : '#4ade80',
                          border: `1px solid ${slot.session_type === 'online' ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
                        {slot.session_type === 'online' ? '🎥 آنلاین' : '🏢 حضوری'}
                      </span>
                    </div>
                    {slot.bio && <p className="text-white/50 text-xs mt-1 line-clamp-2">{slot.bio}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 items-center">
                      <span className="text-white/80 text-sm">📅 {fmtDate(slot.start_datetime)}</span>
                      <span className="text-white/60 text-sm">📍 {slot.city}</span>
                      <span className="text-amber-400 font-bold text-sm">{fmtPrice(slot.session_price)}</span>
                    </div>
                    {slot.location_description && (
                      <p className="text-white/40 text-xs mt-1">🏠 {slot.location_description}</p>
                    )}

                    {booking === slot.slot_id ? (
                      <div className="mt-4 space-y-3">
                        <textarea value={userNeed} onChange={e => setUserNeed(e.target.value)}
                          placeholder="خلاصه‌ای از نیاز یا مشکلی که می‌خواید بررسی بشه (اختیاری)"
                          rows={3} className="w-full px-3 py-2 rounded-xl text-white text-sm resize-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }} />

                        {slot.session_price > 0 && (
                          <div className="flex gap-2">
                            {(['zarinpal', 'wallet'] as const).map(m => (
                              <button key={m} onClick={() => setPaymentMethod(m)}
                                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{
                                  background: paymentMethod === m ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${paymentMethod === m ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                  color: paymentMethod === m ? '#c4b5fd' : '#94a3b8',
                                }}>
                                {m === 'zarinpal' ? '💳 درگاه بانکی' : '👛 کیف پول'}
                              </button>
                            ))}
                          </div>
                        )}

                        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => handleBookSlot(slot.slot_id)} disabled={bookingLoading}
                            className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                            style={{ background: bookingLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }}>
                            {bookingLoading ? '...' : slot.session_price > 0
                              ? (paymentMethod === 'zarinpal' ? '💳 پرداخت و رزرو' : '👛 پرداخت از کیف‌پول')
                              : '✅ تأیید رزرو'}
                          </button>
                          <button onClick={() => setBooking(null)}
                            className="px-4 py-2 rounded-xl text-white/60 text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            انصراف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setBooking(slot.slot_id); setErrorMsg(''); setPaymentMethod('zarinpal'); }}
                        className="mt-3 px-6 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }}>
                        رزرو این جلسه
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            آیا روانشناس هستید؟{' '}
            <a href="/psychologist/onboard" className="text-blue-400 hover:underline">اینجا کلیک کنید</a>
          </p>
        </div>
      </div>
    </div>
  );
}




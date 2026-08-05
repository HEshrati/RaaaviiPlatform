'use client';
import { useState, useEffect } from 'react';

type ActiveTab = 'psychologists' | 'facilitators' | 'venues' | 'interviews';

function formatDomains(domains: unknown): string {
  if (Array.isArray(domains)) {
    return domains.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join('، ') || 'حوزه تخصصی ثبت نشده';
  }

  if (typeof domains === 'string') {
    const value = domains.trim();
    if (!value) return 'حوزه تخصصی ثبت نشده';
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return formatDomains(parsed);
    } catch {
      // دادهٔ قدیمی می‌تواند متن ساده باشد؛ همان متن قابل نمایش است.
    }
    return value;
  }

  return 'حوزه تخصصی ثبت نشده';
}

function getRiskFlags(flags: unknown): string[] {
  if (Array.isArray(flags)) return flags.filter((flag): flag is string => typeof flag === 'string');
  if (typeof flags !== 'string' || !flags.trim()) return [];
  try {
    const parsed = JSON.parse(flags);
    return Array.isArray(parsed) ? parsed.filter((flag): flag is string => typeof flag === 'string') : [];
  } catch {
    return [];
  }
}

export default function AdminProfessionalsPage() {
  const [tab, setTab] = useState<ActiveTab>('psychologists');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const token = () => localStorage.getItem('token');
  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true); setData([]);
    const endpoints: Record<ActiveTab, string> = {
      psychologists: '/api/psychologist-verify/admin/pending',
      facilitators: '/api/facilitator/admin/all?status=pending_review',
      venues: '/api/venue/admin/all?status=pending_review',
      interviews: '/api/psychologist-verify/interviews',
    };
    try {
      const r = await fetch(endpoints[tab], { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  };

  const handleAction = async (type: string, id: string, action: string, note?: string) => {
    setActionMsg('');
    const endpoints: Record<string, string> = {
      psychologist_approve: `/api/psychologist-verify/admin/${id}/approve`,
      psychologist_reject: `/api/psychologist-verify/admin/${id}/reject`,
      psychologist_revision: `/api/psychologist-verify/admin/${id}/request-revision`,
      facilitator_approve: `/api/facilitator/admin/approve/${id}`,
      facilitator_reject: `/api/facilitator/admin/reject/${id}`,
      facilitator_revision: `/api/facilitator/admin/request-revision/${id}`,
      venue_approve: `/api/venue/admin/approve/${id}`,
      venue_reject: `/api/venue/admin/reject/${id}`,
      venue_revision: `/api/venue/admin/request-revision/${id}`,
    };
    const key = `${type}_${action}`;
    const endpoint = endpoints[key];
    if (!endpoint) return;
    try {
      const body: any = {};
      if (action === 'reject' || action === 'revision') body.reason = note || 'توسط ادمین';
      if (action === 'approve') body.adminNote = note || '';
      const res = await fetch(endpoint, {
        method: type === 'psychologist' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'عملیات انجام نشد');
      }
      setActionMsg(`✅ عملیات با موفقیت انجام شد`);
      loadData();
    } catch (e: any) { setActionMsg(`❌ ${e.message}`); }
  };

  const TABS: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'psychologists', label: 'روانشناسان', icon: '🧠' },
    { key: 'facilitators', label: 'تسهیلگران', icon: '🎭' },
    { key: 'venues', label: 'فضاها', icon: '🏡' },
    { key: 'interviews', label: 'مصاحبه‌ها', icon: '⚠️' },
  ];

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0d1b2e,#1B2A4A)' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="px-6 py-4">
        <h1 className="text-xl font-bold text-white">پنل مدیریت حرفه‌ای‌ها</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
            style={{
              background: tab === t.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: tab === t.key ? '#60a5fa' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${tab === t.key ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
            }}>
            {t.icon} {t.label} {data.length > 0 && tab === t.key ? `(${data.length})` : ''}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {actionMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center"
            style={{ background: actionMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: actionMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>
            {actionMsg}
          </div>
        )}

        {loading && <div className="text-center text-white/50 py-20">در حال بارگذاری...</div>}

        {!loading && data.length === 0 && (
          <div className="text-center py-20 rounded-2xl" style={cardStyle}>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white/60">موردی در انتظار بررسی نیست</p>
          </div>
        )}

        {!loading && data.map((item: any) => (
          <div key={item.id || item.license_number} className="rounded-xl p-5 mb-3" style={cardStyle}>
            {/* Psychologist */}
            {tab === 'psychologists' && (
              <div>
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{item.name_from_irimc || item.name || '-'}</p>
                    <p className="text-white/60 text-sm">کد نظام: {item.license_number}</p>
                    <p className="text-white/50 text-xs">{item.specialty} | {item.city}</p>
                    <p className="text-white/50 text-xs">{item.mobileNumber}</p>
                    {item.score_summary && (
                      <p className="text-blue-400 text-xs mt-1">امتیاز اعتبارسنجی: {item.score_summary}/100</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg self-start"
                    style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
                    {item.verification_status}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleAction('psychologist', item.license_number, 'approve')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>✅ تأیید</button>
                  <button onClick={() => handleAction('psychologist', item.license_number, 'reject', 'اطلاعات ناقص')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>❌ رد</button>
                  <button onClick={() => handleAction('psychologist', item.license_number, 'revision', 'لطفاً اطلاعات را کامل کنید')}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>⚡ نیاز به اصلاح</button>
                </div>
              </div>
            )}

            {/* Facilitator */}
            {tab === 'facilitators' && (
              <div>
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{item.first_name} {item.last_name}</p>
                    <p className="text-white/60 text-sm">{item.city} | {item.mobileNumber}</p>
                    <p className="text-white/50 text-xs mt-1">{formatDomains(item.domains)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg self-start"
                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>{item.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('facilitator', item.id, 'approve')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>✅ تأیید</button>
                  <button onClick={() => handleAction('facilitator', item.id, 'reject', 'اطلاعات کافی نیست')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>❌ رد</button>
                  <button onClick={() => handleAction('facilitator', item.id, 'revision', 'لطفاً اطلاعات پروفایل را تکمیل کنید')}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>⚡ نیاز به اصلاح</button>
                </div>
              </div>
            )}

            {/* Venue */}
            {tab === 'venues' && (
              <div>
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{item.venue_name}</p>
                    <p className="text-white/60 text-sm">{item.venue_type} | {item.city}</p>
                    <p className="text-white/50 text-xs">{item.address}</p>
                    <p className="text-white/50 text-xs">ظرفیت: {item.capacity} نفر | مسئول: {item.manager_name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg self-start"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#4ade80' }}>{item.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('venue', item.id, 'approve')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>✅ تأیید</button>
                  <button onClick={() => handleAction('venue', item.id, 'reject', 'عکس‌ها کافی نیست')}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>❌ رد</button>
                  <button onClick={() => handleAction('venue', item.id, 'revision', 'لطفاً اطلاعات یا تصاویر فضا را تکمیل کنید')}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>⚡ نیاز به اصلاح</button>
                </div>
              </div>
            )}

            {/* Interviews */}
            {tab === 'interviews' && (
              <div>
                <div className="flex justify-between mb-2">
                  <div>
                    <p className="text-white font-bold">{item.patient_name}</p>
                    <p className="text-white/60 text-sm">روانشناس: {item.psychologist_name}</p>
                    {item.ai_summary && <p className="text-white/40 text-xs mt-1 line-clamp-3">{item.ai_summary}</p>}
                    {getRiskFlags(item.ai_risk_flags).length > 0 && (
                      <p className="text-red-400 text-xs mt-1">
                        ⚠️ {getRiskFlags(item.ai_risk_flags).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg self-start"
                    style={{
                      background: item.risk_level === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(251,146,60,0.2)',
                      color: item.risk_level === 'high' ? '#f87171' : '#fb923c',
                    }}>
                    {item.risk_level === 'high' ? '⚠️ پرخطر' : '⚡ متوسط'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

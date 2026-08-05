import { NextRequest, NextResponse } from 'next/server';

const API =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';
const BOT_SECRET = process.env.RAVI_BOT_SECRET;

const ADMIN_PHONES = ['09356815523', '09929564895', '09933830958'];

function isAdminProfile(profile: Record<string, unknown>): boolean {
  const role = profile.role as string | undefined;
  if (role === 'admin' || role === 'super_admin') return true;
  const raw = String(profile.mobileNumber || profile.phone_number || '');
  const phone = raw.replace(/[\s\-+]/g, '').replace(/^98/, '0');
  return ADMIN_PHONES.includes(phone);
}

/** پروکسی ادمین برای notify کافه‌ها — secret ربات فقط سمت سرور */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profileRes = await fetch(`${API}/api/auth/profile`, {
    headers: { Authorization: auth },
  });
  if (!profileRes.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const profile = await profileRes.json();
  if (!isAdminProfile(profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!BOT_SECRET) {
    return NextResponse.json({ error: 'Bot secret not configured' }, { status: 503 });
  }

  const body = await req.json();
  const res = await fetch(`${API}/api/bot/event/notify-cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ravi-bot-secret': BOT_SECRET,
      Authorization: auth,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

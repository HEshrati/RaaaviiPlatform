import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/jwt-verify-edge';

const AI_KEY = process.env.AI_API_KEY || process.env.GAPGPT_API_KEY || '';
const AI_URL =
  process.env.AI_API_URL || 'https://api.gapgpt.app/v1/chat/completions';

export async function POST(req: NextRequest) {
  const token =
    req.cookies.get('token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyJwtEdge(token, secret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!AI_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const resp = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({ ...body, model: body.model || 'gpt-4o' }),
    });

    if (body.stream) {
      return new Response(resp.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return NextResponse.json(await resp.json());
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

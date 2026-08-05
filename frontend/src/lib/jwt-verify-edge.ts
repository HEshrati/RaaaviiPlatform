/**
 * تأیید JWT HS256 در Edge Middleware (بدون dependency خارجی)
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function verifyJwtEdge(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  if (!token || !secret) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const data = encoder.encode(`${header}.${payload}`);
    const sigBytes = base64UrlToUint8Array(signature);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as BufferSource,
      data,
    );
    if (!valid) return null;

    const decoded = JSON.parse(
      new TextDecoder().decode(base64UrlToUint8Array(payload)),
    ) as Record<string, unknown>;

    const exp = decoded.exp as number | undefined;
    if (exp && exp * 1000 < Date.now()) return null;

    return decoded;
  } catch {
    return null;
  }
}

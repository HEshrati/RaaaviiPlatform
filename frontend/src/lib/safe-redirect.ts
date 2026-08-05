/**
 * مسیر redirect امن — جلوگیری از open redirect
 */
export function safeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path || typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  // فقط path داخلی با یک /
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes(':') || trimmed.includes('\\')) return fallback;
  return trimmed;
}

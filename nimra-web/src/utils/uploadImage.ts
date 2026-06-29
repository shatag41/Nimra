const UPLOAD_ROUTE_PREFIXES = /^(?:api\/file|api\/uploads|uploads)\//i;
const VALID_STORAGE_PATH = /^(products|banners)\/[^/]+\.(?:jpe?g|png|webp|gif)$/i;

/** Return the portable path stored in Sheets/JSON, never an external URL. */
export function getUploadStoragePath(value: unknown): string {
  const raw = String(value || '').trim().replace(/\\/g, '/');
  if (!raw || /^(?:https?:|data:|blob:)/i.test(raw)) return '';

  const withoutQuery = raw.split(/[?#]/, 1)[0];
  const cleaned = withoutQuery.replace(/^\/+/, '').replace(UPLOAD_ROUTE_PREFIXES, '');
  if (!VALID_STORAGE_PATH.test(cleaned) || cleaned.includes('..')) return '';
  return cleaned;
}

/** Build the same-origin backend URL used by every web image renderer. */
export function getUploadImageUrl(value: unknown): string {
  const storagePath = getUploadStoragePath(value);
  if (!storagePath) return '';
  return `/uploads/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

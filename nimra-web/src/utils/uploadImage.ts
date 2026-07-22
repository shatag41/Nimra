const UPLOAD_ROUTE_PREFIXES = /^(?:api\/file|api\/uploads|uploads)\//i;
const VALID_STORAGE_PATH = /^(products|banners)\/[^/]+\.(?:jpe?g|png|webp|gif)$/i;

export function isVercelBlobUrl(value: unknown): boolean {
  try {
    const url = new URL(String(value || '').trim());
    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) &&
      VALID_STORAGE_PATH.test(pathname) &&
      !pathname.includes('..')
    );
  } catch {
    return false;
  }
}

export function getVercelBlobStoragePath(value: unknown): string {
  if (!isVercelBlobUrl(value)) return '';
  return decodeURIComponent(new URL(String(value).trim()).pathname).replace(/^\/+/, '');
}

/** Return the value persisted by the selected storage provider. */
export function getStoredUploadValue(value: unknown): string {
  const raw = String(value || '').trim();
  return isVercelBlobUrl(raw) ? raw : getUploadStoragePath(raw);
}

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
  const raw = String(value || '').trim();
  if (isVercelBlobUrl(raw)) return raw;
  const storagePath = getUploadStoragePath(value);
  if (!storagePath) return '';
  return `/uploads/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

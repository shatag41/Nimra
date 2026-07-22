import type { NextRequest } from 'next/server';

type SessionUser = { ID?: unknown; Role?: unknown; Active?: unknown };
type Session = { token?: unknown; userId?: unknown; role?: unknown; expiresAt?: unknown };

function parseCookie<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value)) as T;
    } catch {
      return null;
    }
  }
}

function normalizeRole(value: unknown) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

/** Apply the same session checks used by the protected admin App Router pages. */
export function isAdminStorageRequest(request: NextRequest) {
  const user = parseCookie<SessionUser>(request.cookies.get('nimra_user')?.value);
  const session = parseCookie<Session>(request.cookies.get('nimra_session')?.value);
  if (!user || !session || !session.token) return false;
  if (session.expiresAt && Date.now() >= Number(session.expiresAt)) return false;
  if (String(user.Active).toLowerCase() === 'false') return false;
  if (session.userId && user.ID && String(session.userId) !== String(user.ID)) return false;
  if (session.role && normalizeRole(session.role) !== normalizeRole(user.Role)) return false;
  return ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(user.Role));
}

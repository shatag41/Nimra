import { NextResponse } from 'next/server';

const AUTH_COOKIES = [
  'nimra_user',
  'nimra_session',
  'nimra_admin_user',
  'nimra_auth_return_to',
];

export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, '', {
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

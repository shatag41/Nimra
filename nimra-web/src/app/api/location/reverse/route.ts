import { NextResponse } from 'next/server';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get('lat'));
  const longitude = Number(url.searchParams.get('lon'));

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ message: 'Valid latitude and longitude are required.' }, { status: 400 });
  }

  const upstreamUrl = new URL(NOMINATIM_REVERSE_URL);
  upstreamUrl.searchParams.set('format', 'jsonv2');
  upstreamUrl.searchParams.set('lat', String(latitude));
  upstreamUrl.searchParams.set('lon', String(longitude));
  upstreamUrl.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-IN,en;q=0.9',
        'User-Agent': 'NIMRA-Web/1.0 (reverse-geocoding)',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Address lookup service is unavailable.' }, { status: 502 });
    }

    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return NextResponse.json({ message: 'Unable to look up this location.' }, { status: 502 });
  }
}

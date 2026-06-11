import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';

const hasRequiredInquiryFields = (body: Record<string, unknown>) => {
  const phone = String(body.phone || '').trim();
  return Boolean(
    String(body.name || '').trim() &&
    /^\d{10}$/.test(phone) &&
    String(body.subject || '').trim() &&
    String(body.message || '').trim()
  );
};

// Proxy GET requests to Google Apps Script (avoids redirect + CORS issues)
export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'No Apps Script URL configured' }, { status: 500 });
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    const text = await res.text();

    // Detect HTML error pages
    if (text.trim().startsWith('<')) {
      console.error('Apps Script returned HTML instead of JSON. Check deployment settings.');
      return NextResponse.json({ error: 'Apps Script returned HTML - check deployment' }, { status: 502 });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error('CMS proxy error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Proxy POST requests (inquiry form submissions)
export async function POST(req: Request) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'No Apps Script URL configured' }, { status: 500 });
  }

  try {
    const body = await req.json();

    if (!hasRequiredInquiryFields(body)) {
      return NextResponse.json(
        { success: false, message: 'Please fill out all required fields with a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (text.trim().startsWith('<')) {
      return NextResponse.json({ success: false, message: 'Google Sheets returned an invalid response.' }, { status: 502 });
    }

    const data = JSON.parse(text);
    if (!res.ok || data.success === false) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || 'Google Sheets did not save the inquiry.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Inquiry submitted successfully',
    });
  } catch (err) {
    console.error('Inquiry proxy error:', err);
    return NextResponse.json({ success: false, message: 'Unable to submit inquiry right now.' }, { status: 500 });
  }
}

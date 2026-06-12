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

const hasRequiredOrderFields = (body: Record<string, unknown>) => {
  const customer = body.customer as Record<string, unknown> | undefined;
  const mobile = String(customer?.mobile || '').trim();
  const pincode = String(customer?.pincode || '').trim();
  return Boolean(
    body.type === 'order' &&
    customer &&
    String(customer.name || '').trim() &&
    /^\d{10}$/.test(mobile) &&
    String(customer.address || '').trim() &&
    String(customer.city || '').trim() &&
    String(customer.state || '').trim() &&
    /^\d{6}$/.test(pincode) &&
    Array.isArray(body.items) &&
    body.items.length > 0 &&
    Number(body.total) > 0
  );
};

// Proxy GET requests to Google Apps Script (avoids redirect + CORS issues)
export async function GET(req: Request) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'No Apps Script URL configured' }, { status: 500 });
  }

  try {
    const requestUrl = new URL(req.url);
    const targetUrl = new URL(APPS_SCRIPT_URL);
    requestUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

    const res = await fetch(targetUrl.toString(), {
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

// Proxy POST requests (inquiries and orders)
export async function POST(req: Request) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'No Apps Script URL configured' }, { status: 500 });
  }

  try {
    const body = await req.json();

    console.log('NIMRA /api/cms POST payload:', body);

    const payload = { ...body };

    // Auto-detect and normalize the request type if missing
    if (!payload.type) {
      if (payload.customer && payload.items) {
        payload.type = 'order';
      } else if (payload.phone && payload.message) {
        payload.type = 'inquiry';
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid request payload. Unable to determine submission type.' },
          { status: 400 }
        );
      }
    }

    // Validate request according to its normalized type
    if (payload.type === 'order') {
      console.log('CMS Proxy Route: Normalized payload matches "order". Calling hasRequiredOrderFields validation...');
      if (!hasRequiredOrderFields(payload)) {
        console.warn('CMS Proxy Route: Order validation failed.');
        return NextResponse.json(
          { success: false, message: 'Please complete checkout with a valid mobile number, pincode, and cart items.' },
          { status: 400 }
        );
      }
      console.log('CMS Proxy Route: Order validation passed. Proxying request to Google Apps Script...');
    } else if (payload.type === 'inquiry') {
      console.log('CMS Proxy Route: Normalized payload matches "inquiry". Calling hasRequiredInquiryFields validation...');
      if (!hasRequiredInquiryFields(payload)) {
        console.warn('CMS Proxy Route: Inquiry validation failed.');
        return NextResponse.json(
          { success: false, message: 'Please fill out all required fields with a valid 10-digit phone number.' },
          { status: 400 }
        );
      }
      console.log('CMS Proxy Route: Inquiry validation passed. Proxying request to Google Apps Script...');
    } else {
      console.warn('CMS Proxy Route: Invalid payload type:', payload.type);
      return NextResponse.json(
        { success: false, message: 'Invalid submission type. Must be "order" or "inquiry".' },
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
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('CMS Proxy Route: Received raw response from Google Sheets Apps Script:', text);

    if (text.trim().startsWith('<')) {
      console.error('CMS Proxy Route: Received HTML response instead of JSON. Web App may have crashed or is outdated.');
      return NextResponse.json({ success: false, message: 'Google Sheets returned an invalid response.' }, { status: 502 });
    }

    const data = JSON.parse(text);
    console.log('CMS Proxy Route: Google Sheets Apps Script parsed response:', data);
    if (!res.ok || data.success === false) {
      console.warn('CMS Proxy Route: Apps Script save returned failure.');
      return NextResponse.json(
        { success: false, message: data.message || data.error || (payload.type === 'order' ? 'Google Sheets did not save the order.' : 'Google Sheets did not save the inquiry.') },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || (payload.type === 'order' ? 'Order placed successfully' : 'Inquiry submitted successfully'),
      orderId: data.orderId,
    });
  } catch (err) {
    console.error('Inquiry proxy error:', err);
    return NextResponse.json({ success: false, message: 'Unable to process your request right now.' }, { status: 500 });
  }
}

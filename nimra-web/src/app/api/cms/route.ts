import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';

// Proxy GET requests to Google Apps Script
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  
  if (APPS_SCRIPT_URL) {
    try {
      const targetUrl = new URL(APPS_SCRIPT_URL);
      requestUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

      const res = await fetch(targetUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 0 }, // Do not cache for admin operations to get live sync
      });

      const text = await res.text();
      if (!text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        return NextResponse.json(data);
      } else {
        console.warn('Apps Script returned HTML.');
      }
    } catch (err) {
      console.warn('Google Sheets GET fetch failed:', err);
    }
  }

  // Return empty data if Google Sheets not available
  const action = requestUrl.searchParams.get('action');
  const emptyData = {
    banners: [],
    products: [],
    faqs: [],
    companyInfo: {},
    orders: [],
    inquiries: [],
    users: [],
    notifications: []
  };
  if (action === 'getBanners') {
    return NextResponse.json(emptyData.banners);
  } else if (action === 'getProducts') {
    return NextResponse.json(emptyData.products);
  } else if (action === 'getFAQs') {
    return NextResponse.json(emptyData.faqs);
  } else if (action === 'getCompanyInfo') {
    return NextResponse.json(emptyData.companyInfo);
  } else if (action === 'trackOrder') {
    return NextResponse.json({ success: false, message: 'No matching order found.' });
  } else if (action === 'getOrders') {
    return NextResponse.json(emptyData.orders);
  } else if (action === 'getInquiries') {
    return NextResponse.json(emptyData.inquiries);
  } else if (action === 'getUsers') {
    return NextResponse.json(emptyData.users);
  } else if (action === 'getNotifications') {
    return NextResponse.json(emptyData.notifications);
  } else {
    // Return all customer CMS collections
    return NextResponse.json({
      banners: emptyData.banners,
      products: emptyData.products,
      faqs: emptyData.faqs,
      companyInfo: emptyData.companyInfo
    });
  }
}

// Proxy POST requests to Google Apps Script
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = { ...body };

    if (APPS_SCRIPT_URL) {
      try {
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
        if (!text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          return NextResponse.json(data);
        }
        console.warn('Apps Script returned error or HTML.');
      } catch (err) {
        console.warn('Google Sheets POST failed:', err);
      }
    }

    // Return error if Google Sheets not available
    return NextResponse.json(
      { success: false, message: 'Google Sheets backend not available or failed to process request.' },
      { status: 500 }
    );
  } catch (err) {
    console.error('API POST error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing request.' },
      { status: 500 }
    );
  }
}

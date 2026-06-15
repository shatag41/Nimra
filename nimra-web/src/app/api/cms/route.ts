import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';

const fallbackData = {
  banners: [
    { ID: 1, Title: 'Pure Hydration. Healthy Living.', Subtitle: 'NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.', ImageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1200', ButtonText: 'Explore Products', ButtonLink: '#products', Active: true },
  ],
  products: [
    { ID: 1, Name: 'NIMRA 250ml Bottle', Category: 'Packaged Drinking Water', Volume: '250ml', Price: '6.00', Description: 'Perfect pocket-sized pure drinking water for short trips, conferences, and quick refreshments.', ImageUrl: 'https://images.unsplash.com/photo-1616166330003-8e550d199b26?auto=format&fit=crop&q=80&w=600', Active: true },
    { ID: 2, Name: 'NIMRA 500ml Bottle', Category: 'Packaged Drinking Water', Volume: '500ml', Price: '10.00', Description: 'Your convenient hydration companion for daily commutes, gyms, and office desks.', ImageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=600', Active: true },
    { ID: 3, Name: 'NIMRA 1 Litre Bottle', Category: 'Packaged Drinking Water', Volume: '1L', Price: '20.00', Description: 'Standard 1 Litre bottle for absolute pure hydration at home, dining, or long travel.', ImageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600', Active: true },
    { ID: 4, Name: 'NIMRA 2 Litre Bottle', Category: 'Packaged Drinking Water', Volume: '2L', Price: '30.00', Description: 'Bigger size for family picnics and long journeys. Keep clean water accessible for all.', ImageUrl: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&q=80&w=600', Active: true },
  ],
  faqs: [
    { ID: 1, Question: 'What makes NIMRA Packaged Drinking Water pure?', Answer: 'NIMRA water goes through an advanced 10-step purification process.', Active: true },
  ],
  companyInfo: {
    BrandName: 'NIMRA',
    Phone: '+91 8888378411',
    Email: 'tsenterprises.nat@gmail.com',
  },
  orders: [
    {
      orderId: 'NIMRA-SAMPLE-001',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'Pending',
      customer: {
        name: 'John Doe',
        mobile: '9876543210',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
      items: [
        { productId: '1', name: 'NIMRA 500ml Bottle', quantity: 2 },
      ],
      subtotal: 20,
      deliveryCharge: 0,
      total: 20,
      paymentMethod: 'Cash on Delivery',
      source: 'Website',
    },
  ],
  inquiries: [
    {
      Timestamp: new Date(Date.now() - 172800000).toISOString(),
      Name: 'Jane Smith',
      Email: 'jane@example.com',
      Phone: '9876543211',
      Subject: 'Bulk Order Inquiry',
      Message: 'I would like to place a bulk order for my office.',
    },
  ],
  users: [
    { ID: 1, Name: 'System Admin', Username: 'admin', Role: 'Admin', Active: true },
  ],
  notifications: [
    { ID: 1, Timestamp: new Date(Date.now() - 3600000).toISOString(), Title: 'Welcome to NIMRA Console', Message: 'Your admin panel is ready!', Read: false },
  ],
};

// Proxy GET requests to Google Apps Script
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const action = requestUrl.searchParams.get('action');
  const userId = requestUrl.searchParams.get('userId') || '';
  const mobile = requestUrl.searchParams.get('mobile') || '';
  const email = requestUrl.searchParams.get('email') || '';
  
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
      }
    } catch (err) {
      console.error('Google Sheets GET fetch failed, using local fallback:', err);
    }
  }

  // Use fallback data
  if (action === 'getBanners') {
    return NextResponse.json(fallbackData.banners);
  } else if (action === 'getProducts') {
    return NextResponse.json(fallbackData.products);
  } else if (action === 'getFAQs') {
    return NextResponse.json(fallbackData.faqs);
  } else if (action === 'getCompanyInfo') {
    return NextResponse.json(fallbackData.companyInfo);
  } else if (action === 'trackOrder') {
    return NextResponse.json({ success: false, message: 'No matching order found.' });
  } else if (action === 'getOrders') {
    if (!userId && !mobile && !email) return NextResponse.json(fallbackData.orders);
    return NextResponse.json(
      fallbackData.orders.filter((order) =>
        (mobile && order.customer.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '')) ||
        (email && order.customer.email.toLowerCase() === email.toLowerCase())
      )
    );
  } else if (action === 'getInquiries') {
    return NextResponse.json(fallbackData.inquiries);
  } else if (action === 'getUsers') {
    return NextResponse.json(fallbackData.users);
  } else if (action === 'getNotifications') {
    return NextResponse.json(fallbackData.notifications);
  } else {
    // Return all customer CMS collections
    return NextResponse.json({
      banners: fallbackData.banners,
      products: fallbackData.products,
      faqs: fallbackData.faqs,
      companyInfo: fallbackData.companyInfo
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
      } catch (err) {
        console.error('Google Sheets POST failed, using local fallback:', err);
      }
    }

    // Local fallback if Google Sheets not available
    
    if (payload.type === 'order') {
      const orderId = `NIMRA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return NextResponse.json({
        success: true,
        message: 'Order placed successfully (local fallback mode)',
        orderId: orderId
      });
    } else if (payload.type === 'inquiry') {
      return NextResponse.json({
        success: true,
        message: 'Inquiry submitted successfully (local fallback mode)'
      });
    } else if (payload.type === 'login') {
      // Simple local login fallback
      if (payload.username === 'admin' && payload.password === 'nimraadmin123') {
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: { Name: 'Admin User', Username: 'admin', Role: 'Admin' }
        });
      }
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      });
    } else if (payload.type === 'userCRUD') {
      const action = payload.action || 'create';
      const incomingUser = payload.user || {};
      const userIndex = fallbackData.users.findIndex((user: any) => {
        if (incomingUser.ID !== undefined && incomingUser.ID !== null && user.ID !== undefined && user.ID !== null) {
          return String(user.ID) === String(incomingUser.ID);
        }
        return String(user.Username || '').toLowerCase() === String(incomingUser.Username || '').toLowerCase();
      });

      if (action === 'update') {
        if (userIndex >= 0) {
          fallbackData.users[userIndex] = {
            ...fallbackData.users[userIndex],
            ...incomingUser,
            ID: fallbackData.users[userIndex].ID,
          };
          return NextResponse.json({ success: true, message: 'User updated successfully', ID: fallbackData.users[userIndex].ID });
        }

        return NextResponse.json({ success: false, message: 'User record not found for update.' }, { status: 404 });
      }

      if (action === 'create') {
        const newUser = {
          ID: incomingUser.ID || Date.now(),
          ...incomingUser,
        };
        fallbackData.users.push(newUser);
        return NextResponse.json({ success: true, message: 'User created successfully', ID: newUser.ID });
      }

      return NextResponse.json({ success: false, message: 'Unsupported user action.' }, { status: 400 });
    } else if (payload.type === 'requestOTP') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email OTP requires the Google Apps Script backend. Please deploy and authorize the latest Apps Script, then try again.'
        },
        { status: 503 }
      );
    } else if (payload.type === 'resetPassword') {
      return NextResponse.json(
        {
          success: false,
          message: 'Password reset requires the Google Apps Script backend. Please deploy and authorize the latest Apps Script, then try again.'
        },
        { status: 503 }
      );
    }

    // Return error for other types
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

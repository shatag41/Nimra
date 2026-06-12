import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.EXPO_PUBLIC_APPS_SCRIPT_URL || '';
const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// Local DB Helpers
async function readLocalDb() {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local db.json, returning empty structure', err);
    return {
      banners: [],
      products: [],
      faqs: [],
      companyInfo: {},
      orders: [],
      inquiries: [],
      users: [],
      notifications: []
    };
  }
}

async function writeLocalDb(data: any) {
  try {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to local db.json', err);
    return false;
  }
}

function safeUser(user: any) {
  if (!user) return null;
  const { Password, ResetOTP, ResetOTPExpiresAt, ...rest } = user;
  return rest;
}

function normalizeEmail(value?: string) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMobile(value?: string) {
  return String(value || '').replace(/\D/g, '');
}

// Proxy GET requests to Google Apps Script or fall back to local JSON
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const action = requestUrl.searchParams.get('action');

  // Try to use Google Sheets if configured
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
        
        // Determine if Apps Script actually handled the requested action
        let handledByAppsScript = true;
        if (action === 'getUsers' && !data.users && !Array.isArray(data)) handledByAppsScript = false;
        if (action === 'getOrders' && !data.orders && !Array.isArray(data)) handledByAppsScript = false;
        if (action === 'getInquiries' && !data.inquiries && !Array.isArray(data)) handledByAppsScript = false;
        if (action === 'getNotifications' && !data.notifications && !Array.isArray(data)) handledByAppsScript = false;
        if (action === 'trackOrder' && !data.order) handledByAppsScript = false;
        
        if (handledByAppsScript) {
          return NextResponse.json(data);
        } else {
          console.warn(`Apps Script did not handle action '${action}'. Falling back to local database.`);
        }
      } else {
        console.warn('Apps Script returned HTML. Falling back to local database.');
      }
    } catch (err) {
      console.warn('Google Sheets GET fetch failed, falling back to local db:', err);
    }
  }

  // Local JSON Database Fallback
  const db = await readLocalDb();
  if (action === 'getBanners') {
    return NextResponse.json(db.banners.filter((b: any) => b.Active !== false));
  } else if (action === 'getProducts') {
    return NextResponse.json(db.products.filter((p: any) => p.Active !== false));
  } else if (action === 'getFAQs') {
    return NextResponse.json(db.faqs.filter((f: any) => f.Active !== false));
  } else if (action === 'getCompanyInfo') {
    return NextResponse.json(db.companyInfo);
  } else if (action === 'trackOrder') {
    const orderId = requestUrl.searchParams.get('orderId');
    const mobile = requestUrl.searchParams.get('mobile');
    const order = db.orders.find((o: any) => 
      (orderId && String(o.orderId).trim() === String(orderId).trim()) ||
      (mobile && String(o.customer.mobile).trim() === String(mobile).trim())
    );
    if (order) {
      return NextResponse.json({ success: true, order });
    }
    return NextResponse.json({ success: false, message: 'No matching order found.' });
  } else if (action === 'getOrders') {
    return NextResponse.json(db.orders || []);
  } else if (action === 'getInquiries') {
    return NextResponse.json(db.inquiries || []);
  } else if (action === 'getUsers') {
    return NextResponse.json(db.users || []);
  } else if (action === 'getNotifications') {
    return NextResponse.json(db.notifications || []);
  } else {
    // Return all customer CMS collections
    return NextResponse.json({
      banners: db.banners,
      products: db.products,
      faqs: db.faqs,
      companyInfo: db.companyInfo
    });
  }
}

// Proxy POST requests or write to local DB
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = { ...body };

    // Auto-detect submission type if missing
    if (!payload.type) {
      if (payload.customer && payload.items) {
        payload.type = 'order';
      } else if (payload.phone && payload.message) {
        payload.type = 'inquiry';
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid request payload. Unable to determine action type.' },
          { status: 400 }
        );
      }
    }

    // Attempt Google Sheets API first
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
          if (data.success !== false) {
            return NextResponse.json(data);
          }
        }
        console.warn('Apps Script returned error or HTML. Falling back to local database.');
      } catch (err) {
        console.warn('Google Sheets POST failed, falling back to local db:', err);
      }
    }

    // Local JSON Database Fallback
    const db = await readLocalDb();
    const timestamp = new Date().toISOString();

    if (payload.type === 'order') {
      const orderId = 'NIMRA-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 900 + 100);
      const newOrder = {
        orderId,
        status: 'Pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        customer: payload.customer,
        items: payload.items,
        subtotal: Number(payload.subtotal || 0),
        deliveryCharge: Number(payload.deliveryCharge || 0),
        total: Number(payload.total || 0),
        paymentMethod: payload.paymentMethod || 'Cash on Delivery',
        source: payload.source || 'Website'
      };
      db.orders.unshift(newOrder);
      await writeLocalDb(db);
      return NextResponse.json({ success: true, orderId, message: 'Order placed successfully (Local Database)' });

    } else if (payload.type === 'inquiry') {
      const newInquiry = {
        Timestamp: timestamp,
        Name: payload.name,
        Email: payload.email,
        Phone: payload.phone,
        Subject: payload.subject,
        Message: payload.message
      };
      db.inquiries.unshift(newInquiry);
      await writeLocalDb(db);
      return NextResponse.json({ success: true, message: 'Inquiry submitted successfully (Local Database)' });

    } else if (payload.type === 'updateOrderStatus') {
      const index = db.orders.findIndex((o: any) => String(o.orderId).trim() === String(payload.orderId).trim());
      if (index !== -1) {
        db.orders[index].status = payload.status;
        db.orders[index].updatedAt = timestamp;
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'Order status updated successfully (Local Database)' });
      }
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });

    } else if (payload.type === 'productCRUD') {
      const action = payload.action;
      const product = payload.product;

      if (action === 'create') {
        const maxId = db.products.reduce((max: number, p: any) => Number(p.ID) > max ? Number(p.ID) : max, 0);
        product.ID = maxId + 1;
        product.Active = true;
        db.products.push(product);
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'Product created successfully (Local Database)', ID: product.ID });
      }

      const index = db.products.findIndex((p: any) => String(p.ID).trim() === String(product.ID).trim());
      if (index !== -1) {
        if (action === 'delete') {
          db.products.splice(index, 1);
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Product deleted successfully (Local Database)' });
        } else if (action === 'update') {
          db.products[index] = { ...db.products[index], ...product };
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Product updated successfully (Local Database)' });
        }
      }
      return NextResponse.json({ success: false, message: 'Product ID not found.' }, { status: 404 });

    } else if (payload.type === 'bannerCRUD') {
      const action = payload.action;
      const banner = payload.banner;

      if (action === 'create') {
        const maxId = db.banners.reduce((max: number, b: any) => Number(b.ID) > max ? Number(b.ID) : max, 0);
        banner.ID = maxId + 1;
        banner.Active = true;
        db.banners.push(banner);
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'Banner created successfully (Local Database)', ID: banner.ID });
      }

      const index = db.banners.findIndex((b: any) => String(b.ID).trim() === String(banner.ID).trim());
      if (index !== -1) {
        if (action === 'delete') {
          db.banners.splice(index, 1);
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Banner deleted successfully (Local Database)' });
        } else if (action === 'update') {
          db.banners[index] = { ...db.banners[index], ...banner };
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Banner updated successfully (Local Database)' });
        }
      }
      return NextResponse.json({ success: false, message: 'Banner ID not found.' }, { status: 404 });

    } else if (payload.type === 'faqCRUD') {
      const action = payload.action;
      const faq = payload.faq;

      if (action === 'create') {
        const maxId = db.faqs.reduce((max: number, f: any) => Number(f.ID) > max ? Number(f.ID) : max, 0);
        faq.ID = maxId + 1;
        faq.Active = true;
        db.faqs.push(faq);
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'FAQ created successfully (Local Database)', ID: faq.ID });
      }

      const index = db.faqs.findIndex((f: any) => String(f.ID).trim() === String(faq.ID).trim());
      if (index !== -1) {
        if (action === 'delete') {
          db.faqs.splice(index, 1);
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'FAQ deleted successfully (Local Database)' });
        } else if (action === 'update') {
          db.faqs[index] = { ...db.faqs[index], ...faq };
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'FAQ updated successfully (Local Database)' });
        }
      }
      return NextResponse.json({ success: false, message: 'FAQ ID not found.' }, { status: 404 });

    } else if (payload.type === 'companyInfoUpdate') {
      db.companyInfo = payload.companyInfo;
      await writeLocalDb(db);
      return NextResponse.json({ success: true, message: 'Company Info updated successfully (Local Database)' });

    } else if (payload.type === 'login') {
      const username = String(payload.username || '').trim().toLowerCase();
      const password = String(payload.password || '');
      const user = (db.users || []).find((u: any) => {
        const active = u.Active === true || u.Active === 'true' || u.Active === undefined;
        const matchesUsername = normalizeEmail(u.Username) === username || normalizeMobile(u.Mobile) === normalizeMobile(username);
        return active && matchesUsername && String(u.Password || '') === password;
      });

      if (!user) {
        return NextResponse.json({ success: false, message: 'Invalid username/mobile or password.' }, { status: 401 });
      }

      return NextResponse.json({ success: true, user: safeUser(user) });

    } else if (payload.type === 'register') {
      const incomingUser = payload.user || {};
      const name = String(incomingUser.Name || '').trim();
      const username = normalizeEmail(incomingUser.Username);
      const mobile = normalizeMobile(incomingUser.Mobile);
      const password = String(incomingUser.Password || '');
      const role = incomingUser.Role || 'Customer';

      if (!name || !password || (!username && !mobile)) {
        return NextResponse.json(
          { success: false, message: 'Name, password, and either email or mobile are required.' },
          { status: 400 }
        );
      }

      const duplicate = (db.users || []).find((u: any) =>
        (username && normalizeEmail(u.Username) === username) ||
        (mobile && normalizeMobile(u.Mobile) === mobile)
      );

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'An account with this email or mobile already exists.' },
          { status: 409 }
        );
      }

      const maxId = db.users.reduce((max: number, u: any) => Number(u.ID) > max ? Number(u.ID) : max, 0);
      const newUser = {
        ID: maxId + 1,
        Name: name,
        Username: username || mobile,
        Mobile: mobile,
        Password: password,
        Role: role,
        Active: true,
      };

      db.users.unshift(newUser);
      await writeLocalDb(db);
      return NextResponse.json({ success: true, user: safeUser(newUser), message: 'Registration successful.' });

    } else if (payload.type === 'googleSignIn') {
      const email = normalizeEmail(payload.email);
      const name = String(payload.name || '').trim() || 'Google User';
      const role = payload.role || 'Customer';

      if (!email) {
        return NextResponse.json({ success: false, message: 'Google account email is required.' }, { status: 400 });
      }

      let user = (db.users || []).find((u: any) => normalizeEmail(u.Username) === email);
      if (user) {
        user.Name = user.Name || name;
        user.Role = user.Role || role;
        user.Active = user.Active !== false && user.Active !== 'false';
      } else {
        const maxId = db.users.reduce((max: number, u: any) => Number(u.ID) > max ? Number(u.ID) : max, 0);
        user = {
          ID: maxId + 1,
          Name: name,
          Username: email,
          Mobile: '',
          Password: '',
          Role: role,
          Active: true,
        };
        db.users.unshift(user);
      }

      await writeLocalDb(db);
      return NextResponse.json({ success: true, user: safeUser(user), message: 'Google sign-in successful.' });

    } else if (payload.type === 'requestOTP') {
      const email = normalizeEmail(payload.email);
      const user = (db.users || []).find((u: any) => normalizeEmail(u.Username) === email);
      if (!user) {
        return NextResponse.json({ success: false, message: 'No account found for this email.' }, { status: 404 });
      }

      const otp = '123456';
      user.ResetOTP = otp;
      user.ResetOTPExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await writeLocalDb(db);

      return NextResponse.json({
        success: true,
        message: 'OTP generated successfully. Use 123456 in local development.',
      });

    } else if (payload.type === 'resetPassword') {
      const email = normalizeEmail(payload.email);
      const otp = String(payload.otp || '').trim();
      const newPassword = String(payload.newPassword || '');
      const user = (db.users || []).find((u: any) => normalizeEmail(u.Username) === email);

      if (!user) {
        return NextResponse.json({ success: false, message: 'No account found for this email.' }, { status: 404 });
      }

      const isOtpValid = String(user.ResetOTP || '') === otp;
      const isOtpFresh = !user.ResetOTPExpiresAt || new Date(user.ResetOTPExpiresAt).getTime() >= Date.now();

      if (!isOtpValid || !isOtpFresh) {
        return NextResponse.json({ success: false, message: 'Invalid or expired OTP.' }, { status: 400 });
      }

      if (!newPassword) {
        return NextResponse.json({ success: false, message: 'New password is required.' }, { status: 400 });
      }

      user.Password = newPassword;
      delete user.ResetOTP;
      delete user.ResetOTPExpiresAt;
      await writeLocalDb(db);

      return NextResponse.json({ success: true, message: 'Password reset successfully.' });

    } else if (payload.type === 'userCRUD') {
      const action = payload.action;
      const user = payload.user;

      if (action === 'create') {
        const maxId = db.users.reduce((max: number, u: any) => Number(u.ID) > max ? Number(u.ID) : max, 0);
        user.ID = maxId + 1;
        user.Active = true;
        db.users.push(user);
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'User created successfully (Local Database)', ID: user.ID });
      }

      const index = db.users.findIndex((u: any) => String(u.ID).trim() === String(user.ID).trim());
      if (index !== -1) {
        if (action === 'delete') {
          db.users.splice(index, 1);
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'User deleted successfully (Local Database)' });
        } else if (action === 'update') {
          db.users[index] = { ...db.users[index], ...user };
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'User updated successfully (Local Database)' });
        }
      }
      return NextResponse.json({ success: false, message: 'User ID not found.' }, { status: 404 });

    } else if (payload.type === 'notificationCRUD') {
      const action = payload.action;
      const notification = payload.notification;

      if (action === 'create') {
        const maxId = db.notifications.reduce((max: number, n: any) => Number(n.ID) > max ? Number(n.ID) : max, 0);
        notification.ID = maxId + 1;
        notification.Timestamp = timestamp;
        notification.Read = false;
        db.notifications.push(notification);
        await writeLocalDb(db);
        return NextResponse.json({ success: true, message: 'Notification created successfully (Local Database)', ID: notification.ID });
      }

      const index = db.notifications.findIndex((n: any) => String(n.ID).trim() === String(notification.ID).trim());
      if (index !== -1) {
        if (action === 'delete') {
          db.notifications.splice(index, 1);
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Notification deleted successfully (Local Database)' });
        } else if (action === 'update') {
          db.notifications[index] = { ...db.notifications[index], ...notification };
          await writeLocalDb(db);
          return NextResponse.json({ success: true, message: 'Notification updated successfully (Local Database)' });
        }
      }
      return NextResponse.json({ success: false, message: 'Notification ID not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Action type not recognized.' }, { status: 400 });

  } catch (err) {
    console.error('API POST error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error processing request.' }, { status: 500 });
  }
}

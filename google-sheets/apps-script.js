/**
 * NIMRA Beverage Company CMS & Backend Database API
 * Deploy this script as a Web App in Google Apps Script associated with your Google Sheet.
 * Set Access to "Anyone" and Execute as "Me".
 */

function doGet(e) {
  var action = e.parameter.action;
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getBanners') {
    return jsonResponse(getSheetData(spreadsheet.getSheetByName('Banners')));
  } else if (action === 'getProducts') {
    return jsonResponse(getSheetData(spreadsheet.getSheetByName('Products')));
  } else if (action === 'getFAQs') {
    return jsonResponse(getSheetData(spreadsheet.getSheetByName('FAQs')));
  } else if (action === 'getCompanyInfo') {
    return jsonResponse(getCompanyInfoData(spreadsheet.getSheetByName('CompanyInfo')));
  } else if (action === 'trackOrder') {
    return jsonResponse(trackOrder(spreadsheet, e.parameter.orderId, e.parameter.mobile));
  } else if (action === 'getOrders') {
    return jsonResponse(getAllOrders(spreadsheet));
  } else if (action === 'getInquiries') {
    return jsonResponse(getSheetData(spreadsheet.getSheetByName('Inquiries')));
  } else if (action === 'getUsers') {
    return jsonResponse(getUsersData(spreadsheet));
  } else if (action === 'getNotifications') {
    return jsonResponse(getNotificationsData(spreadsheet));
  } else {
    // Return all data in one request to optimize API calls!
    var data = {
      banners: getSheetData(spreadsheet.getSheetByName('Banners')),
      products: getSheetData(spreadsheet.getSheetByName('Products')),
      faqs: getSheetData(spreadsheet.getSheetByName('FAQs')),
      companyInfo: getCompanyInfoData(spreadsheet.getSheetByName('CompanyInfo'))
    };
    return jsonResponse(data);
  }
}

function doPost(e) {
  try {
    Logger.log("doPost: Received POST request.");
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log("doPost Error: Empty request body.");
      return jsonResponse({ success: false, message: 'Empty request body.' });
    }
    
    var params = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("doPost: Parsed payload type = " + params.type);
    
    if (params.type === 'order') {
      Logger.log("doPost: Routing to saveOrder()");
      return jsonResponse(saveOrder(spreadsheet, params));
    } else if (params.type === 'inquiry') {
      Logger.log("doPost: Routing to saveInquiry()");
      return jsonResponse(saveInquiry(spreadsheet, params));
    } else if (params.type === 'updateOrderStatus') {
      Logger.log("doPost: Routing to updateOrderStatus()");
      return jsonResponse(updateOrderStatus(spreadsheet, params));
    } else if (params.type === 'productCRUD') {
      Logger.log("doPost: Routing to productCRUD()");
      return jsonResponse(handleProductCRUD(spreadsheet, params));
    } else if (params.type === 'bannerCRUD') {
      Logger.log("doPost: Routing to bannerCRUD()");
      return jsonResponse(handleBannerCRUD(spreadsheet, params));
    } else if (params.type === 'faqCRUD') {
      Logger.log("doPost: Routing to faqCRUD()");
      return jsonResponse(handleFaqCRUD(spreadsheet, params));
    } else if (params.type === 'companyInfoUpdate') {
      Logger.log("doPost: Routing to companyInfoUpdate()");
      return jsonResponse(handleCompanyInfoUpdate(spreadsheet, params));
    } else if (params.type === 'userCRUD') {
      Logger.log("doPost: Routing to userCRUD()");
      return jsonResponse(handleUserCRUD(spreadsheet, params));
    } else if (params.type === 'notificationCRUD') {
      Logger.log("doPost: Routing to notificationCRUD()");
      return jsonResponse(handleNotificationCRUD(spreadsheet, params));
    } else if (params.type === 'login') {
      Logger.log("doPost: Routing to handleAuthLogin()");
      return jsonResponse(handleAuthLogin(spreadsheet, params));
    } else if (params.type === 'register') {
      Logger.log("doPost: Routing to handleAuthRegister()");
      return jsonResponse(handleAuthRegister(spreadsheet, params));
    } else if (params.type === 'googleSignIn') {
      Logger.log("doPost: Routing to handleAuthGoogleSignIn()");
      return jsonResponse(handleAuthGoogleSignIn(spreadsheet, params));
    } else if (params.type === 'requestOTP') {
      Logger.log("doPost: Routing to handleAuthRequestOTP()");
      return jsonResponse(handleAuthRequestOTP(spreadsheet, params));
    } else if (params.type === 'resetPassword') {
      Logger.log("doPost: Routing to handleAuthResetPassword()");
      return jsonResponse(handleAuthResetPassword(spreadsheet, params));
    } else {
      // Fallback structural check to identify request type
      if (params.customer && params.items) {
        Logger.log("doPost Fallback: Identified order payload structure. Routing to saveOrder()");
        return jsonResponse(saveOrder(spreadsheet, params));
      } else if (params.phone && params.message) {
        Logger.log("doPost Fallback: Identified inquiry payload structure. Routing to saveInquiry()");
        return jsonResponse(saveInquiry(spreadsheet, params));
      } else {
        Logger.log("doPost Error: Invalid payload structure.");
        return jsonResponse({ success: false, message: 'Invalid payload type. Must be a valid admin action or contain required customer/inquiry fields.' });
      }
    }
  } catch (error) {
    Logger.log("doPost Exception: " + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function saveInquiry(spreadsheet, params) {
  Logger.log("saveInquiry: Starting inquiry validation.");
  var name = String(params.name || '').trim();
  var email = String(params.email || '').trim();
  var phone = String(params.phone || '').trim();
  var subject = String(params.subject || '').trim();
  var message = String(params.message || '').trim();

  // Validate required fields (Email is optional, Name, Phone (10 digits), Subject, and Message are required)
  if (!name || !/^[0-9]{10}$/.test(phone) || !subject || !message) {
    Logger.log("saveInquiry Validation Failure. Name=" + name + ", Phone=" + phone + ", Subject=" + subject);
    return { success: false, message: 'Invalid inquiry payload. Required fields are missing or invalid.' };
  }

  var sheet = spreadsheet.getSheetByName('Inquiries');
  if (!sheet) {
    Logger.log("saveInquiry: Inquiries sheet not found. Creating it...");
    sheet = spreadsheet.insertSheet('Inquiries');
    sheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message']]);
  }

  var timestamp = new Date();
  Logger.log("saveInquiry: Appending row for " + name);
  sheet.appendRow([timestamp, name, email, phone, subject, message]);
  return { success: true, message: 'Inquiry submitted successfully' };
}

function saveOrder(spreadsheet, params) {
  Logger.log("saveOrder: Starting order validation.");
  var customer = params.customer || {};
  var items = params.items || [];
  
  var name = String(customer.name || '').trim();
  var mobile = String(customer.mobile || '').trim();
  var email = String(customer.email || '').trim();
  var address = String(customer.address || '').trim();
  var city = String(customer.city || '').trim();
  var state = String(customer.state || '').trim();
  var pincode = String(customer.pincode || '').trim();
  var instructions = String(customer.instructions || '').trim();
  var totalAmount = Number(params.total || 0);

  // Validate required fields: Name, Mobile (10 digits), Address, City, State, Pincode (6 digits), items, and totalAmount
  if (!name || !/^[0-9]{10}$/.test(mobile) || !address || !city || !state || !/^[0-9]{6}$/.test(pincode) || !items.length || totalAmount <= 0) {
    Logger.log("saveOrder Validation Failure. Name=" + name + ", Mobile=" + mobile + ", Address=" + address + ", ItemsCount=" + items.length + ", Total=" + totalAmount);
    return { success: false, message: 'Invalid order payload. Required fields are missing or invalid.' };
  }

  Logger.log("Handler Execution: saveOrder handler is executing.");
  var sheet = ensureOrdersSheet(spreadsheet);
  Logger.log("Sheet Selection: Selected sheet name is: " + sheet.getName());

  var timestamp = new Date();
  var orderId = 'NIMRA-' + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
  var paymentMethod = String(params.paymentMethod || 'Cash on Delivery');
  var source = String(params.source || 'Website');
  var createdAt = params.createdAt ? new Date(params.createdAt) : timestamp;
  var updatedAt = params.updatedAt ? new Date(params.updatedAt) : timestamp;
  var subtotal = Number(params.subtotal || 0);
  var deliveryCharge = Number(params.deliveryCharge || 0);
  var products = items.map(function(item) {
    return item.name + ' (' + item.volume + ')';
  }).join(' | ');
  var quantities = items.map(function(item) {
    return item.quantity;
  }).join(' | ');

  var rowData = [
    orderId,
    timestamp,
    name,
    mobile,
    email,
    address,
    city,
    state,
    pincode,
    instructions,
    products,
    quantities,
    subtotal,
    deliveryCharge,
    totalAmount,
    paymentMethod,
    'Pending',
    source,
    createdAt,
    updatedAt
  ];
  Logger.log("Appended Values: Appending row data to " + sheet.getName() + " sheet: " + JSON.stringify(rowData));
  sheet.appendRow(rowData);

  return { success: true, orderId: orderId, message: 'Order placed successfully' };
}

function getAllOrders(spreadsheet) {
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var orders = [];
  for (var i = 1; i < data.length; i++) {
    orders.push(rowToOrder(headers, data[i]));
  }
  return orders;
}

function trackOrder(spreadsheet, orderId, mobile) {
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet || (!orderId && !mobile)) {
    return { success: false, message: 'Order not found.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var orderIdIndex = headers.indexOf('Order ID');
  var mobileIndex = headers.indexOf('Mobile Number');

  for (var i = 1; i < data.length; i++) {
    var matchesOrderId = orderId && String(data[i][orderIdIndex]).trim() === String(orderId).trim();
    var matchesMobile = mobile && String(data[i][mobileIndex]).trim() === String(mobile).trim();
    if ((orderId && matchesOrderId) || (mobile && matchesMobile)) {
      return {
        success: true,
        order: rowToOrder(headers, data[i])
      };
    }
  }

  return { success: false, message: 'No matching order found for this Order ID and mobile number.' };
}

function updateOrderStatus(spreadsheet, params) {
  var orderId = params.orderId;
  var status = params.status;
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) return { success: false, message: 'Orders sheet not found.' };
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var orderIdIndex = headers.indexOf('Order ID');
  var statusIndex = headers.indexOf('Order Status');
  var updatedAtIndex = headers.indexOf('Updated At');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][orderIdIndex]).trim() === String(orderId).trim()) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(status);
      sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date());
      return { success: true, message: 'Order status updated successfully' };
    }
  }
  return { success: false, message: 'Order ID ' + orderId + ' not found.' };
}

function toISOString(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    return date.toISOString();
  }
  return String(date);
}

function rowToOrder(headers, row) {
  function value(name) {
    var index = headers.indexOf(name);
    return index >= 0 ? row[index] : '';
  }

  var products = String(value('Products') || '').split(' | ');
  var quantities = String(value('Quantities') || '').split(' | ');
  var items = products.filter(Boolean).map(function(name, index) {
    return {
      productId: name,
      name: name,
      category: '',
      volume: '',
      price: 0,
      imageUrl: '',
      quantity: Number(quantities[index] || 1)
    };
  });

  return {
    type: 'order',
    orderId: value('Order ID'),
    status: value('Order Status') || 'Pending',
    createdAt: toISOString(value('Order Date')),
    updatedAt: toISOString(value('Updated At')) || toISOString(value('Order Date')),
    customer: {
      name: value('Customer Name'),
      mobile: value('Mobile Number'),
      email: value('Email'),
      address: value('Address'),
      city: value('City'),
      state: value('State'),
      pincode: value('Pincode'),
      instructions: value('Special Instructions')
    },
    items: items,
    subtotal: Number(value('Subtotal') || 0),
    deliveryCharge: Number(value('Delivery Charge') || 0),
    total: Number(value('Total Amount') || 0),
    paymentMethod: value('Payment Method') || 'Cash on Delivery',
    source: value('Source') || 'Website'
  };
}

function ensureOrdersSheet(spreadsheet) {
  var requiredHeaders = [
    'Order ID',
    'Order Date',
    'Customer Name',
    'Mobile Number',
    'Email',
    'Address',
    'City',
    'State',
    'Pincode',
    'Special Instructions',
    'Products',
    'Quantities',
    'Subtotal',
    'Delivery Charge',
    'Total Amount',
    'Payment Method',
    'Order Status',
    'Source',
    'Created At',
    'Updated At'
  ];

  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Orders');
  }

  var headerRange = sheet.getRange(1, 1, 1, requiredHeaders.length);
  var currentHeaders = headerRange.getValues()[0] || [];
  var needsUpdate = currentHeaders.join('|') !== requiredHeaders.join('|');

  if (needsUpdate) {
    headerRange.setValues([requiredHeaders]);
  }

  return sheet;
}

function getSheetData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header or empty
  
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    var active = true;
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().trim();
      var val = data[i][j];
      // Convert dates to ISO strings
      if (val instanceof Date) {
        row[key] = toISOString(val);
      } else {
        row[key] = val;
      }
      if (key.toLowerCase() === 'active' && (val === false || val === 'false')) {
        active = false;
      }
    }
    if (active) {
      rows.push(row);
    }
  }
  return rows;
}

function getCompanyInfoData(sheet) {
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var info = {};
  for (var i = 0; i < data.length; i++) {
    var key = data[i][0].toString().trim();
    var val = data[i][1];
    if (key) {
      info[key] = val;
    }
  }
  return info;
}

function getUsersData(spreadsheet) {
  var sheet = spreadsheet.getSheetByName('Users');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Users');
    var headers = ['User ID', 'Full Name', 'Mobile', 'Email', 'Password (hashed)', 'Role (Admin/Customer)', 'Status', 'Registration Date', 'Last Login'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed default users with hashed password
    sheet.appendRow([1, 'System Admin', '', 'admin', hashPassword('nimraadmin123'), 'Admin', 'Active', new Date().toISOString(), '']);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    var active = true;
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().trim();
      var val = data[i][j];
      
      // Map custom headers to what frontend expects
      if (key === 'User ID' || key === 'ID') row['ID'] = val;
      else if (key === 'Full Name' || key === 'Name') row['Name'] = val;
      else if (key === 'Email' || key === 'Username') row['Username'] = val;
      else if (key === 'Password (hashed)' || key === 'Password') row['Password'] = val;
      else if (key === 'Role (Admin/Customer)' || key === 'Role') row['Role'] = val;
      else if (key === 'Status' || key === 'Active') {
        var isActive = (val === 'Active' || val === true || val === 'TRUE');
        row['Active'] = isActive;
        active = isActive;
      }
      else {
        row[key] = val;
      }
    }
    // If Active property wasn't set by mapping, assume true unless specified
    if (row['Active'] === undefined) row['Active'] = true;
    
    if (active || row['Active']) {
      rows.push(row);
    }
  }
  return rows;
}

function getNotificationsData(spreadsheet) {
  var sheet = spreadsheet.getSheetByName('Notifications');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Notifications');
    var headers = ['ID', 'Timestamp', 'Title', 'Message', 'Read'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.appendRow([1, new Date().toISOString(), 'Welcome to Nimra CMS', 'Your secure Admin Portal is fully set up and ready.', false]);
  }
  return getSheetData(sheet);
}

function handleProductCRUD(spreadsheet, params) {
  var action = params.action; // 'create' | 'update' | 'delete'
  var product = params.product;
  var sheet = spreadsheet.getSheetByName('Products');
  if (!sheet) return { success: false, message: 'Products sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('ID');

  var rowValues = [
    product.ID,
    product.Name,
    product.Category,
    product.Volume,
    product.Price,
    product.Description,
    product.ImageUrl,
    product.Specifications || '',
    product.StockStatus || 'In Stock',
    product.DiscountPercent || '',
    product.ComboPack || '',
    product.Active !== undefined ? product.Active : true
  ];

  if (action === 'create') {
    // Generate new numeric ID if not provided
    if (!product.ID) {
      var maxId = 0;
      for (var i = 1; i < data.length; i++) {
        var currId = Number(data[i][idIndex]);
        if (!isNaN(currId) && currId > maxId) maxId = currId;
      }
      product.ID = maxId + 1;
      rowValues[0] = product.ID;
    }
    sheet.appendRow(rowValues);
    return { success: true, message: 'Product created successfully', ID: product.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(product.ID).trim()) {
      if (action === 'delete') {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Product deleted successfully' };
      } else if (action === 'update') {
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return { success: true, message: 'Product updated successfully' };
      }
    }
  }
  return { success: false, message: 'Product ID not found.' };
}

function handleBannerCRUD(spreadsheet, params) {
  var action = params.action;
  var banner = params.banner;
  var sheet = spreadsheet.getSheetByName('Banners');
  if (!sheet) return { success: false, message: 'Banners sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('ID');

  var rowValues = [
    banner.ID,
    banner.Title,
    banner.Subtitle,
    banner.ImageUrl,
    banner.ButtonText,
    banner.ButtonLink,
    banner.Active !== undefined ? banner.Active : true
  ];

  if (action === 'create') {
    if (!banner.ID) {
      var maxId = 0;
      for (var i = 1; i < data.length; i++) {
        var currId = Number(data[i][idIndex]);
        if (!isNaN(currId) && currId > maxId) maxId = currId;
      }
      banner.ID = maxId + 1;
      rowValues[0] = banner.ID;
    }
    sheet.appendRow(rowValues);
    return { success: true, message: 'Banner created successfully', ID: banner.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(banner.ID).trim()) {
      if (action === 'delete') {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Banner deleted successfully' };
      } else if (action === 'update') {
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return { success: true, message: 'Banner updated successfully' };
      }
    }
  }
  return { success: false, message: 'Banner ID not found.' };
}

function handleFaqCRUD(spreadsheet, params) {
  var action = params.action;
  var faq = params.faq;
  var sheet = spreadsheet.getSheetByName('FAQs');
  if (!sheet) return { success: false, message: 'FAQs sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('ID');

  var rowValues = [
    faq.ID,
    faq.Question,
    faq.Answer,
    faq.Active !== undefined ? faq.Active : true
  ];

  if (action === 'create') {
    if (!faq.ID) {
      var maxId = 0;
      for (var i = 1; i < data.length; i++) {
        var currId = Number(data[i][idIndex]);
        if (!isNaN(currId) && currId > maxId) maxId = currId;
      }
      faq.ID = maxId + 1;
      rowValues[0] = faq.ID;
    }
    sheet.appendRow(rowValues);
    return { success: true, message: 'FAQ created successfully', ID: faq.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(faq.ID).trim()) {
      if (action === 'delete') {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'FAQ deleted successfully' };
      } else if (action === 'update') {
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return { success: true, message: 'FAQ updated successfully' };
      }
    }
  }
  return { success: false, message: 'FAQ ID not found.' };
}

function handleCompanyInfoUpdate(spreadsheet, params) {
  var info = params.companyInfo;
  var sheet = spreadsheet.getSheetByName('CompanyInfo');
  if (!sheet) return { success: false, message: 'CompanyInfo sheet not found.' };

  // Clear sheet content except header
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);

  var rows = [];
  for (var key in info) {
    if (info.hasOwnProperty(key)) {
      rows.push([key, info[key]]);
    }
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  return { success: true, message: 'Company Info updated successfully' };
}

function handleUserCRUD(spreadsheet, params) {
  var action = params.action;
  var user = params.user;
  var sheet = spreadsheet.getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find ID index (check both possible column names)
  var idIndex = headers.indexOf('User ID');
  if (idIndex === -1) idIndex = headers.indexOf('ID');
  if (idIndex === -1) return { success: false, message: 'User ID column not found.' };

  // Prepare row values based on existing headers
  var rowValues = new Array(headers.length);
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j].toString().trim();
    if (key === 'User ID' || key === 'ID') rowValues[j] = user.ID;
    else if (key === 'Full Name' || key === 'Name') rowValues[j] = user.Name || '';
    else if (key === 'Email' || key === 'Username') rowValues[j] = user.Username || '';
    else if (key === 'Password (hashed)' || key === 'Password') rowValues[j] = user.Password || '';
    else if (key === 'Role (Admin/Customer)' || key === 'Role') rowValues[j] = user.Role || 'Customer';
    else if (key === 'Status' || key === 'Active') rowValues[j] = (user.Active !== false) ? 'Active' : 'Inactive';
    else if (key === 'Registration Date') rowValues[j] = action === 'create' ? new Date().toISOString() : data[1] ? data[1][j] : '';
    else rowValues[j] = ''; // Keep empty for others like Last Login or Mobile
  }

  if (action === 'create') {
    if (!user.ID) {
      var maxId = 0;
      for (var i = 1; i < data.length; i++) {
        var currId = Number(data[i][idIndex]);
        if (!isNaN(currId) && currId > maxId) maxId = currId;
      }
      user.ID = maxId + 1;
      rowValues[idIndex] = user.ID;
    }
    sheet.appendRow(rowValues);
    return { success: true, message: 'User created successfully', ID: user.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(user.ID).trim()) {
      if (action === 'delete') {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'User deleted successfully' };
      } else if (action === 'update') {
        // Keep existing values for unmapped columns
        for (var j = 0; j < headers.length; j++) {
          var key = headers[j].toString().trim();
          if (key === 'Mobile' || key === 'Registration Date' || key === 'Last Login') {
             rowValues[j] = data[i][j];
          }
        }
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return { success: true, message: 'User updated successfully' };
      }
    }
  }
  return { success: false, message: 'User ID not found.' };
}

function handleNotificationCRUD(spreadsheet, params) {
  var action = params.action;
  var notification = params.notification;
  var sheet = spreadsheet.getSheetByName('Notifications');
  if (!sheet) return { success: false, message: 'Notifications sheet not found.' };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('ID');

  var rowValues = [
    notification.ID,
    notification.Timestamp || new Date().toISOString(),
    notification.Title,
    notification.Message,
    notification.Read !== undefined ? notification.Read : false
  ];

  if (action === 'create') {
    if (!notification.ID) {
      var maxId = 0;
      for (var i = 1; i < data.length; i++) {
        var currId = Number(data[i][idIndex]);
        if (!isNaN(currId) && currId > maxId) maxId = currId;
      }
      notification.ID = maxId + 1;
      rowValues[0] = notification.ID;
    }
    sheet.appendRow(rowValues);
    return { success: true, message: 'Notification created successfully', ID: notification.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(notification.ID).trim()) {
      if (action === 'delete') {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Notification deleted successfully' };
      } else if (action === 'update') {
        sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
        return { success: true, message: 'Notification updated successfully' };
      }
    }
  }
  return { success: false, message: 'Notification ID not found.' };
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- AUTHENTICATION FUNCTIONS ---

function hashPassword(password) {
  // Simple hashing for demonstration purposes. In a real scenario, use an external API or more robust mechanism if possible, 
  // as Apps Script doesn't have a built-in bcrypt.
  var signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hexString = '';
  for (var i = 0; i < signature.length; i++) {
    var byte = signature[i];
    if (byte < 0) byte += 256;
    var hex = byte.toString(16);
    if (hex.length == 1) hex = '0' + hex;
    hexString += hex;
  }
  return hexString;
}

function handleAuthLogin(spreadsheet, params) {
  var username = String(params.username || '').trim(); // Can be email or mobile
  var password = String(params.password || '').trim();
  
  if (!username || !password) {
    return { success: false, message: 'Username and password are required.' };
  }

  var users = getUsersData(spreadsheet);
  var hashedPassword = hashPassword(password);
  
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if ((String(user.Username).trim() === username || String(user.Mobile).trim() === username) && 
        (user.Password === hashedPassword || user.Password === password)) { // Check both hashed and plain text for backwards compatibility
      if (!user.Active) {
        return { success: false, message: 'Your account is inactive. Please contact support.' };
      }
      
      // Update Last Login
      updateUserLastLogin(spreadsheet, user.ID);
      
      // Remove password from response
      var safeUser = Object.assign({}, user);
      delete safeUser.Password;
      
      return { success: true, message: 'Login successful', user: safeUser };
    }
  }
  
  return { success: false, message: 'Invalid username or password.' };
}

function handleAuthRegister(spreadsheet, params) {
  var user = params.user || {};
  var name = String(user.Name || '').trim();
  var mobile = String(user.Mobile || '').trim();
  var email = String(user.Username || '').trim();
  var password = String(user.Password || '').trim();
  var role = String(user.Role || 'Customer').trim();
  
  if (!name || !password || (!mobile && !email)) {
    return { success: false, message: 'Name, password, and at least one contact method (email/mobile) are required.' };
  }

  var users = getUsersData(spreadsheet);
  
  // Check duplicates
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (email && String(u.Username).trim() === email) {
      return { success: false, message: 'Email already registered.' };
    }
    if (mobile && String(u.Mobile).trim() === mobile) {
      return { success: false, message: 'Mobile number already registered.' };
    }
  }
  
  // Create user
  var newUser = {
    Name: name,
    Username: email,
    Mobile: mobile,
    Password: hashPassword(password),
    Role: role,
    Active: true
  };
  
  var result = handleUserCRUD(spreadsheet, { action: 'create', user: newUser });
  if (result.success) {
    newUser.ID = result.ID;
    delete newUser.Password;
    return { success: true, message: 'Registration successful', user: newUser };
  }
  return result;
}

function handleAuthGoogleSignIn(spreadsheet, params) {
  var email = String(params.email || '').trim();
  var name = String(params.name || '').trim();
  var role = String(params.role || 'Customer').trim(); // Default role for new users
  
  if (!email) {
    return { success: false, message: 'Email is required for Google Sign-In.' };
  }

  var users = getUsersData(spreadsheet);
  
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.Username).trim() === email) {
      if (!u.Active) {
        return { success: false, message: 'Your account is inactive. Please contact support.' };
      }
      updateUserLastLogin(spreadsheet, u.ID);
      var safeUser = Object.assign({}, u);
      delete safeUser.Password;
      return { success: true, message: 'Login successful', user: safeUser };
    }
  }
  
  // Create new user if not found
  // Use a random strong password for google sign in users so they can't login via normal method unless they reset password
  var randomPass = Utilities.getUuid();
  var newUser = {
    Name: name,
    Username: email,
    Mobile: '',
    Password: hashPassword(randomPass),
    Role: role,
    Active: true
  };
  
  var result = handleUserCRUD(spreadsheet, { action: 'create', user: newUser });
  if (result.success) {
    newUser.ID = result.ID;
    delete newUser.Password;
    return { success: true, message: 'Registration successful', user: newUser };
  }
  return result;
}

function handleAuthRequestOTP(spreadsheet, params) {
  var email = normalizeEmail(params.email);
  if (!email) return { success: false, message: 'Email is required.' };
  if (!isValidEmail(email)) return { success: false, message: 'Enter a valid registered email address.' };

  var userMatch = findUserRowByEmail(spreadsheet, email);
  if (!userMatch) return { success: false, message: 'Email not found.' };
  if (userMatch.user.Active === false) {
    return { success: false, message: 'Your account is inactive. Please contact support.' };
  }

  var otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  var expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  var otpIndex = ensureUserColumn(userMatch.sheet, userMatch.headers, 'ResetOTP');
  var expiresIndex = ensureUserColumn(userMatch.sheet, userMatch.headers, 'ResetOTPExpiresAt');
  userMatch.sheet.getRange(userMatch.rowNumber, otpIndex + 1).setValue(otp);
  userMatch.sheet.getRange(userMatch.rowNumber, expiresIndex + 1).setValue(expiresAt.toISOString());

  // Cache is fast, sheet columns are the durable fallback.
  var cache = CacheService.getScriptCache();
  cache.put('otp_' + email, otp, 600); // Valid for 10 minutes

  try {
    sendPasswordResetOtpEmail(email, otp, userMatch.user.Name);
    return { success: true, message: 'OTP sent to your registered email.' };
  } catch (e) {
    var emailError = getErrorMessage(e);
    Logger.log('handleAuthRequestOTP email failure: ' + emailError);
    return {
      success: false,
      message: 'Failed to send email: ' + emailError,
      hint: 'Run authorizeNimraEmailSending once in Apps Script, then deploy a new Web App version with Execute as Me.'
    };
  }
}

function handleAuthResetPassword(spreadsheet, params) {
  var email = normalizeEmail(params.email);
  var otp = String(params.otp || '').trim();
  var newPassword = String(params.newPassword || '').trim();
  
  if (!email || !otp || !newPassword) {
    return { success: false, message: 'Email, OTP, and new password are required.' };
  }
  if (newPassword.length < 4) {
    return { success: false, message: 'New password must be at least 4 characters.' };
  }
  
  var cache = CacheService.getScriptCache();
  var cachedOtp = cache.get('otp_' + email);

  var userMatch = findUserRowByEmail(spreadsheet, email);
  if (!userMatch) return { success: false, message: 'User not found.' };

  var otpIndex = findHeaderIndex(userMatch.headers, ['ResetOTP', 'Reset OTP']);
  var expiresIndex = findHeaderIndex(userMatch.headers, ['ResetOTPExpiresAt', 'Reset OTP Expires At']);
  var sheetOtp = otpIndex >= 0 ? String(userMatch.row[otpIndex] || '').trim() : '';
  var expiresAt = expiresIndex >= 0 ? new Date(userMatch.row[expiresIndex]) : null;
  var hasValidSheetOtp = sheetOtp === otp && expiresAt && !isNaN(expiresAt.getTime()) && expiresAt.getTime() >= Date.now();

  if ((cachedOtp && cachedOtp !== otp) || (!cachedOtp && !hasValidSheetOtp)) {
    return { success: false, message: 'Invalid or expired OTP.' };
  }

  var passIndex = findHeaderIndex(userMatch.headers, ['Password (hashed)', 'Password']);
  if (passIndex < 0) {
    return { success: false, message: 'Password column not found.' };
  }

  userMatch.sheet.getRange(userMatch.rowNumber, passIndex + 1).setValue(hashPassword(newPassword));
  if (otpIndex >= 0) userMatch.sheet.getRange(userMatch.rowNumber, otpIndex + 1).setValue('');
  if (expiresIndex >= 0) userMatch.sheet.getRange(userMatch.rowNumber, expiresIndex + 1).setValue('');
  cache.remove('otp_' + email);
  return { success: true, message: 'Password reset successfully.' };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function findHeaderIndex(headers, names) {
  for (var i = 0; i < names.length; i++) {
    var index = headers.indexOf(names[i]);
    if (index >= 0) return index;
  }
  return -1;
}

function ensureUserColumn(sheet, headers, name) {
  var index = headers.indexOf(name);
  if (index >= 0) return index;
  var nextColumn = headers.length + 1;
  sheet.getRange(1, nextColumn).setValue(name);
  headers.push(name);
  return headers.length - 1;
}

function findUserRowByEmail(spreadsheet, email) {
  getUsersData(spreadsheet); // Ensure the Users sheet and headers exist.
  var sheet = spreadsheet.getSheetByName('Users');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  var headers = data[0];
  var emailIndex = findHeaderIndex(headers, ['Email', 'Username']);
  if (emailIndex < 0) return null;

  for (var i = 1; i < data.length; i++) {
    if (normalizeEmail(data[i][emailIndex]) === email) {
      var users = getUsersData(spreadsheet);
      var rowIdIndex = findHeaderIndex(headers, ['User ID', 'ID']);
      var rowId = rowIdIndex >= 0 ? String(data[i][rowIdIndex]).trim() : '';
      var user = null;

      for (var j = 0; j < users.length; j++) {
        if (rowId && String(users[j].ID).trim() === rowId) {
          user = users[j];
          break;
        }
        if (!rowId && normalizeEmail(users[j].Username) === email) {
          user = users[j];
          break;
        }
      }

      return {
        sheet: sheet,
        headers: headers,
        row: data[i],
        rowNumber: i + 1,
        user: user || { Username: email, Active: true, Name: '' }
      };
    }
  }

  return null;
}

function sendPasswordResetOtpEmail(email, otp, name) {
  var displayName = String(name || 'NIMRA customer').trim();
  var subject = 'NIMRA password reset OTP';
  var plainBody = 'Hello ' + displayName + ',\n\n' +
    'Your OTP for NIMRA password reset is: ' + otp + '\n\n' +
    'This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.\n\n' +
    'NIMRA Support';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>Your OTP for NIMRA password reset is:</p>' +
    '<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">' + otp + '</p>' +
    '<p>This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>' +
    '<p>NIMRA Support</p>';

  var message = {
    to: email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: 'NIMRA Support'
  };

  try {
    MailApp.sendEmail(message);
  } catch (mailError) {
    Logger.log('MailApp failed, retrying with GmailApp: ' + getErrorMessage(mailError));
    GmailApp.sendEmail(email, subject, plainBody, {
      htmlBody: htmlBody,
      name: 'NIMRA Support'
    });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  return error.message || error.toString();
}

function authorizeNimraEmailSending() {
  var email = Session.getEffectiveUser().getEmail();
  if (!email) {
    throw new Error('Could not detect the effective user email. Run this from the Apps Script editor account that owns the web app deployment.');
  }

  sendPasswordResetOtpEmail(email, '000000', 'NIMRA Admin');
  return 'Authorization email sent to ' + email + '. Now deploy the Web App as a new version.';
}

function updateUserLastLogin(spreadsheet, userId) {
  var sheet = spreadsheet.getSheetByName('Users');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('User ID') !== -1 ? headers.indexOf('User ID') : headers.indexOf('ID');
  var lastLoginIndex = headers.indexOf('Last Login');
  
  if (lastLoginIndex === -1) return; // Ignore if column doesn't exist
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(userId).trim()) {
      sheet.getRange(i + 1, lastLoginIndex + 1).setValue(new Date().toISOString());
      break;
    }
  }
}

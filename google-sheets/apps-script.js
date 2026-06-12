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
        return jsonResponse({ success: false, message: 'Invalid payload type. Must be "order" or "inquiry" and contain required fields.' });
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
    createdAt: value('Order Date'),
    updatedAt: value('Updated At') || value('Order Date'),
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
    deliveryCharge: Number(value('Delivery Charges') || 0),
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
    'Delivery Charges',
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
      row[key] = val;
      if (key.toLowerCase() === 'active' && val === false) {
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

function jsonResponse(data) {
  // Note: ContentService does not support setHeader() - CORS is handled by the Next.js proxy.
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

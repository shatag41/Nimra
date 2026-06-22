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
    return jsonResponse(trackOrder(spreadsheet, e.parameter.orderId, e.parameter.mobile, e.parameter.userId, e.parameter.email));
  } else if (action === 'getOrders') {
    return jsonResponse(getAllOrders(spreadsheet, e.parameter.userId, e.parameter.mobile, e.parameter.email));
  } else if (action === 'getCancellationRequests') {
    return jsonResponse(getCancellationRequests(spreadsheet));
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
    } else if (params.type === 'requestOrderCancellation') {
      Logger.log("doPost: Routing to requestOrderCancellation()");
      return jsonResponse(requestOrderCancellation(spreadsheet, params));
    } else if (params.type === 'reviewCancellationRequest') {
      Logger.log("doPost: Routing to reviewCancellationRequest()");
      return jsonResponse(reviewCancellationRequest(spreadsheet, params));
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
    } else if (params.type === 'userAddresses') {
      Logger.log("doPost: Routing to handleUserAddresses()");
      return jsonResponse(handleUserAddresses(spreadsheet, params));
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
    } else if (params.type === 'requestEmailChangeOTP') {
      Logger.log("doPost: Routing to handleRequestEmailChangeOTP()");
      return jsonResponse(handleRequestEmailChangeOTP(spreadsheet, params));
    } else if (params.type === 'resetPassword') {
      Logger.log("doPost: Routing to handleAuthResetPassword()");
      return jsonResponse(handleAuthResetPassword(spreadsheet, params));
    } else if (params.type === 'getCart') {
      Logger.log("doPost: Routing to getCart()");
      return jsonResponse(getCart(spreadsheet, params));
    } else if (params.type === 'cartSync') {
      Logger.log("doPost: Routing to handleCartSync()");
      return jsonResponse(handleCartSync(spreadsheet, params));
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

  // ── Extract all checkout fields ──────────────────────────────────────────
  var name           = String(customer.name        || '').trim();
  var mobile         = String(customer.mobile      || '').trim();
  var altMobile      = String(customer.altMobile   || '').trim();
  var email          = normalizeEmail(customer.email);
  var flatNo         = String(customer.flatNo      || '').trim();
  var buildingName   = String(customer.buildingName|| '').trim();
  var locality       = String(customer.locality    || '').trim();
  var landmark       = String(customer.landmark    || '').trim();
  var city           = String(customer.city        || '').trim();
  var state          = String(customer.state       || '').trim();
  var pincode        = String(customer.pincode     || '').trim();
  var addressType    = String(customer.addressType || 'Home').trim();
  var instructions   = String(customer.instructions|| '').trim();
  var totalAmount    = Number(params.total         || 0);
  var userId         = String(params.userId || customer.userId || customer.userID || customer.ID || '').trim();
  var savedAddressId = String(customer.savedAddressId || params.savedAddressId || '').trim();
  var selectedSavedAddress = null;
  var usersForOrder = null;
  var profileForOrder = null;

  if (userId) {
    usersForOrder = getUsersData(spreadsheet);
    for (var u = 0; u < usersForOrder.length; u++) {
      if (String(usersForOrder[u].ID).trim() === userId) {
        profileForOrder = usersForOrder[u];
        break;
      }
    }
  }

  if (userId && savedAddressId) {
    var savedAddress = findUserSavedAddress(spreadsheet, userId, savedAddressId, usersForOrder);
    if (savedAddress) {
      selectedSavedAddress = savedAddress;
      name = String(savedAddress.name || name || '').trim();
      mobile = String(savedAddress.mobile || mobile || '').trim();
      altMobile = String(savedAddress.altMobile || altMobile || '').trim();
      email = normalizeEmail(savedAddress.email || email);
      flatNo = String(savedAddress.flatNo || '').trim();
      buildingName = String(savedAddress.buildingName || '').trim();
      locality = String(savedAddress.locality || '').trim();
      landmark = String(savedAddress.landmark || '').trim();
      city = String(savedAddress.city || '').trim();
      state = String(savedAddress.state || '').trim();
      pincode = String(savedAddress.pincode || '').trim();
      addressType = String(savedAddress.type || addressType || 'Home').trim();
    }
  }

  if (userId && !selectedSavedAddress && !flatNo && !locality) {
    selectedSavedAddress = findUserSavedAddressForOrder(spreadsheet, userId, savedAddressId, addressType, usersForOrder);
    if (selectedSavedAddress) {
      savedAddressId = selectedSavedAddress.id || savedAddressId;
      flatNo = String(selectedSavedAddress.flatNo || '').trim();
      buildingName = String(selectedSavedAddress.buildingName || '').trim();
      locality = String(selectedSavedAddress.locality || '').trim();
      landmark = String(selectedSavedAddress.landmark || '').trim();
      city = String(selectedSavedAddress.city || '').trim();
      state = String(selectedSavedAddress.state || '').trim();
      pincode = String(selectedSavedAddress.pincode || '').trim();
      addressType = String(selectedSavedAddress.type || addressType || 'Home').trim();
    }
  }

  if (profileForOrder) {
    name = String(name || profileForOrder.Name || '').trim();
    mobile = String(mobile || profileForOrder.Mobile || '').trim();
    altMobile = String(altMobile || profileForOrder.AlternateMobile || '').trim();
    email = normalizeEmail(email || profileForOrder.Username);
  }

  // Build composite Full Address from granular fields (also accept legacy address field)
  var fullAddress = String(customer.address || '').trim();
  if (!fullAddress) {
    fullAddress = [flatNo, buildingName, locality, landmark, city, state, pincode]
      .filter(Boolean).join(', ');
  }

  // If email not provided, try to fetch it from the Users sheet via userId
  if ((!email || !isValidEmail(email)) && userId) {
    var users = usersForOrder || getUsersData(spreadsheet);
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].ID).trim() === userId && isValidEmail(users[i].Username)) {
        email = normalizeEmail(users[i].Username);
        break;
      }
    }
  }

  // ── Validation: required fields ──────────────────────────────────────────
  // Accept either new granular fields (flatNo + locality) or legacy address
  var hasAddress = (flatNo && locality) || fullAddress;
  if (!name || !/^[0-9]{10}$/.test(mobile) || !hasAddress || !city || !state || !/^[0-9]{6}$/.test(pincode) || !items.length || totalAmount <= 0) {
    Logger.log("saveOrder Validation Failure. Name=" + name + ", Mobile=" + mobile + ", FlatNo=" + flatNo + ", Locality=" + locality + ", City=" + city + ", State=" + state + ", Pincode=" + pincode + ", ItemsCount=" + items.length + ", Total=" + totalAmount);
    return { success: false, message: 'Invalid order payload. Required fields (name, mobile, address, city, state, pincode, items) are missing or invalid.' };
  }

  if (!userId) {
    return { success: false, message: 'A user account is required to save and reuse delivery addresses.' };
  }

  if (userId) {
    var addressPayload = normalizeSavedAddressRecord({
      id: savedAddressId,
      type: addressType,
      name: name,
      mobile: mobile,
      altMobile: altMobile,
      email: email,
      flatNo: flatNo,
      buildingName: buildingName,
      locality: locality,
      landmark: landmark,
      pincode: pincode,
      state: state,
      city: city,
      country: customer.country || 'India',
      instructions: instructions,
      fullAddress: fullAddress,
      isDefault: customer.isDefault === true || Boolean(selectedSavedAddress && selectedSavedAddress.isDefault) || !savedAddressId
    });
    var savedResult = upsertUserSavedAddress(spreadsheet, userId, addressPayload);
    if (!savedResult.success) {
      return savedResult;
    }
    savedAddressId = savedResult.address.id;
    addressType = savedResult.address.type || addressType;
  }

  Logger.log("Handler Execution: saveOrder handler is executing.");
  var sheet = ensureOrdersSheet(spreadsheet);
  Logger.log("Sheet Selection: Selected sheet name is: " + sheet.getName());

  // ── Build row data ───────────────────────────────────────────────────────
  var timestamp     = new Date();
  var orderId       = 'NIMRA-' + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
  var paymentMethod = String(params.paymentMethod || 'Cash on Delivery');
  var source        = String(params.source || 'Website');
  var createdAt     = params.createdAt ? new Date(params.createdAt) : timestamp;
  var updatedAt     = params.updatedAt ? new Date(params.updatedAt) : timestamp;
  var subtotal      = Number(params.subtotal || 0);
  var deliveryCharge= Number(params.deliveryCharge || 0);

  var products = items.map(function(item) {
    return item.name + ' (' + item.volume + ')';
  }).join(' | ');
  var quantities = items.map(function(item) {
    return item.quantity;
  }).join(' | ');

  // ── Row order MUST match ensureOrdersSheet headers exactly ───────────────
  // Customer/contact/address details are intentionally not written to Orders.
  // Orders keep only the user/address references; delivery details live in
  // Users/UserAddresses and are resolved at read time.
  var orderValues = {
    'Order ID': orderId,
    'Order Date': timestamp,
    'Customer User ID': userId,
    'Address Type': addressType,
    'Saved Address ID': savedAddressId,
    'Delivery Instructions': instructions,
    'Products': products,
    'Quantities': quantities,
    'Subtotal': subtotal,
    'Delivery Charge': deliveryCharge,
    'Total Amount': totalAmount,
    'Payment Method': paymentMethod,
    'Order Status': 'Pending',
    'Source': source,
    'Created At': createdAt,
    'Updated At': updatedAt,
    'Cancellation Status': '',
    'Cancellation Request ID': '',
    'Status History': ''
  };
  var orderHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = orderHeaders.map(function(header) {
    return orderValues[header] !== undefined ? orderValues[header] : '';
  });

  Logger.log("Appended Values: Appending row data to " + sheet.getName() + " sheet: " + JSON.stringify(rowData));
  sheet.appendRow(rowData);

  var emailResult = sendOrderConfirmationEmail(email, name, orderId, products, totalAmount, mobile);
  var response = { success: true, orderId: orderId, message: 'Order placed successfully', emailSent: emailResult.sent };
  if (!emailResult.sent && emailResult.error) {
    response.emailError = emailResult.error;
    response.emailHint = 'Run authorizeNimraEmailSending once in Apps Script, then deploy a new Web App version with Execute as Me.';
  }
  return response;
}

function getAllOrders(spreadsheet, userId, mobile, email) {
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var users = getUsersData(spreadsheet);
  var customerLookup = buildOrderCustomerLookup(spreadsheet, users);
  var orders = [];
  for (var i = 1; i < data.length; i++) {
    var order = rowToOrder(headers, data[i], spreadsheet, users, customerLookup);
    if (!userId && !mobile && !email || orderBelongsToUser(order, userId, mobile, email)) {
      orders.push(order);
    }
  }
  return orders;
}

function trackOrder(spreadsheet, orderId, mobile, userId, email) {
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet || (!orderId && !mobile && !userId && !email)) {
    return { success: false, message: 'Order not found.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var orderIdIndex = headers.indexOf('Order ID');
  var userIdIndex = headers.indexOf('Customer User ID');
  var users = getUsersData(spreadsheet);

  for (var i = 1; i < data.length; i++) {
    var matchesOrderId = orderId && String(data[i][orderIdIndex]).trim() === String(orderId).trim();
    var order = rowToOrder(headers, data[i], spreadsheet, users);
    var matchesMobile = mobile && normalizeDigits(order.customer.mobile) === normalizeDigits(mobile);
    var matchesEmail = email && normalizeEmail(order.customer.email) === normalizeEmail(email);
    var matchesUserId = userId && userIdIndex >= 0 && String(data[i][userIdIndex]).trim() === String(userId).trim();
    var hasUserScope = Boolean(userId || mobile || email);
    var matchesUserScope = matchesUserId || matchesMobile || matchesEmail;
    if ((!orderId || matchesOrderId) && (!hasUserScope || matchesUserScope)) {
      return {
        success: true,
        order: order
      };
    }
  }

  return { success: false, message: 'No matching order found for this Order ID and mobile number.' };
}

function updateOrderStatus(spreadsheet, params) {
  var orderId = params.orderId;
  var status  = params.status;
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) return { success: false, message: 'Orders sheet not found.' };

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var users = null;

  // Use exact new column names
  var orderIdIndex   = headers.indexOf('Order ID');
  var statusIndex    = headers.indexOf('Order Status');
  var updatedAtIndex = headers.indexOf('Updated At');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][orderIdIndex]).trim() === String(orderId).trim()) {
      if (statusIndex  >= 0) sheet.getRange(i + 1, statusIndex  + 1).setValue(status);
      if (updatedAtIndex >= 0) sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date());

      users = users || getUsersData(spreadsheet);
      var order = rowToOrder(headers, data[i], spreadsheet, users);
      var name   = order.customer.name || '';
      var email  = order.customer.email || '';
      var mobile = order.customer.mobile || '';

      var emailResult = sendOrderStatusUpdateEmail(email, name, orderId, status, mobile);
      var response = { success: true, message: 'Order status updated successfully', emailSent: emailResult.sent };
      if (!emailResult.sent && emailResult.error) {
        response.emailError = emailResult.error;
      }
      return response;
    }
  }
  return { success: false, message: 'Order ID ' + orderId + ' not found.' };
}

function requestOrderCancellation(spreadsheet, params) {
  var orderId = String(params.orderId || '').trim();
  var reason = String(params.reason || 'Customer requested cancellation').trim();
  if (!orderId) return { success: false, message: 'Order ID is required.' };

  var orderSheet = spreadsheet.getSheetByName('Orders');
  if (!orderSheet) return { success: false, message: 'Orders sheet not found.' };

  var orderData = orderSheet.getDataRange().getValues();
  var orderHeaders = orderData[0] || [];
  var users = null;
  var orderIdIndex = orderHeaders.indexOf('Order ID');
  var statusIndex = orderHeaders.indexOf('Order Status');
  var cancellationStatusIndex = ensureColumn(orderSheet, orderHeaders, 'Cancellation Status');
  var cancellationRequestIdIndex = ensureColumn(orderSheet, orderHeaders, 'Cancellation Request ID');
  var statusHistoryIndex = ensureColumn(orderSheet, orderHeaders, 'Status History');
  orderHeaders = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0] || [];

  for (var i = 1; i < orderData.length; i++) {
    if (String(orderData[i][orderIdIndex]).trim() !== orderId) continue;

    var currentStatus = String(orderData[i][statusIndex] || '').trim();
    if (currentStatus === 'Cancelled') return { success: false, message: 'This order is already cancelled.' };
    if (String(orderData[i][cancellationStatusIndex] || '').trim() === 'Pending') {
      return { success: false, message: 'A cancellation request is already pending for this order.' };
    }

    users = users || getUsersData(spreadsheet);
    var order = rowToOrder(orderHeaders, orderSheet.getRange(i + 1, 1, 1, orderSheet.getLastColumn()).getValues()[0], spreadsheet, users);
    var now = new Date();
    var requestId = 'CAN-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
    var history = [{ status: 'Pending', at: now.toISOString(), by: 'Customer', remarks: reason }];
    var refundStatus = getRefundStatus(order.paymentMethod, 'Pending');

    var requestSheet = ensureCancellationRequestsSheet(spreadsheet);
    requestSheet.appendRow([
      requestId,
      orderId,
      order.customer.name,
      order.customer.mobile,
      order.customer.email || '',
      order.total,
      order.paymentMethod || '',
      reason,
      now,
      '',
      '',
      '',
      refundStatus,
      'Pending',
      JSON.stringify(history)
    ]);

    orderSheet.getRange(i + 1, cancellationStatusIndex + 1).setValue('Pending');
    orderSheet.getRange(i + 1, cancellationRequestIdIndex + 1).setValue(requestId);
    orderSheet.getRange(i + 1, statusHistoryIndex + 1).setValue(appendStatusHistory(orderData[i][statusHistoryIndex], history[0]));

    var adminEmail = Session.getEffectiveUser().getEmail() || NIMRA_OVERRIDE_TEST_EMAIL || 'tsenterprises.nat@gmail.com';
    sendNimraEmail(
      adminEmail,
      'NIMRA Cancellation Approval Needed: ' + orderId,
      'Cancellation request ' + requestId + ' is pending for order ' + orderId + '. Reason: ' + reason,
      '<p>Cancellation request <strong>' + requestId + '</strong> is pending for order <strong>' + orderId + '</strong>.</p><p><strong>Customer:</strong> ' + escapeHtml(order.customer.name) + '</p><p><strong>Reason:</strong> ' + escapeHtml(reason) + '</p>',
      'NIMRA Admin Alerts'
    );

    return { success: true, message: 'Cancellation request submitted for admin approval.', request: cancellationRequestRowToObject(requestSheet.getRange(requestSheet.getLastRow(), 1, 1, requestSheet.getLastColumn()).getValues()[0]) };
  }

  return { success: false, message: 'Order ID ' + orderId + ' not found.' };
}

function reviewCancellationRequest(spreadsheet, params) {
  var requestId = String(params.requestId || '').trim();
  var decision = String(params.decision || '').trim();
  var adminName = String(params.adminName || 'Admin').trim();
  var adminRemarks = String(params.adminRemarks || '').trim();
  if (!requestId || (decision !== 'Approved' && decision !== 'Rejected')) {
    return { success: false, message: 'Valid request ID and decision are required.' };
  }
  if (!adminRemarks) return { success: false, message: 'Admin remarks are required.' };

  var requestSheet = ensureCancellationRequestsSheet(spreadsheet);
  var requestData = requestSheet.getDataRange().getValues();
  var requestHeaders = requestData[0] || [];
  var idIndex = requestHeaders.indexOf('Request ID');
  var statusIndex = requestHeaders.indexOf('Status');
  var approvalDateIndex = requestHeaders.indexOf('Approval Date');
  var adminNameIndex = requestHeaders.indexOf('Admin Name');
  var remarksIndex = requestHeaders.indexOf('Admin Remarks');
  var refundIndex = requestHeaders.indexOf('Refund Status');
  var historyIndex = requestHeaders.indexOf('Status History');
  var orderIdIndex = requestHeaders.indexOf('Order ID');
  var emailIndex = requestHeaders.indexOf('Customer Email');
  var nameIndex = requestHeaders.indexOf('Customer Name');
  var mobileIndex = requestHeaders.indexOf('Customer Mobile');
  var paymentMethodIndex = requestHeaders.indexOf('Payment Method');

  for (var i = 1; i < requestData.length; i++) {
    if (String(requestData[i][idIndex]).trim() !== requestId) continue;
    if (String(requestData[i][statusIndex]).trim() !== 'Pending') {
      return { success: false, message: 'This cancellation request has already been reviewed.' };
    }

    var now = new Date();
    var orderId = requestData[i][orderIdIndex];
    var historyItem = { status: decision, at: now.toISOString(), by: adminName, remarks: adminRemarks };
    var refundStatus = decision === 'Approved' ? getRefundStatus(requestData[i][paymentMethodIndex], 'Processed') : 'Not applicable';

    requestSheet.getRange(i + 1, statusIndex + 1).setValue(decision);
    requestSheet.getRange(i + 1, approvalDateIndex + 1).setValue(now);
    requestSheet.getRange(i + 1, adminNameIndex + 1).setValue(adminName);
    requestSheet.getRange(i + 1, remarksIndex + 1).setValue(adminRemarks);
    requestSheet.getRange(i + 1, refundIndex + 1).setValue(refundStatus);
    requestSheet.getRange(i + 1, historyIndex + 1).setValue(appendStatusHistory(requestData[i][historyIndex], historyItem));

    updateOrderCancellationAudit(spreadsheet, orderId, requestId, decision, historyItem);
    if (decision === 'Approved') {
      updateOrderStatus(spreadsheet, { orderId: orderId, status: 'Cancelled' });
      sendCancellationDecisionEmail(requestData[i][emailIndex], requestData[i][nameIndex], orderId, decision, adminRemarks, refundStatus, requestData[i][mobileIndex]);
      return { success: true, message: 'Cancellation approved. Order cancelled and customer notified.' };
    }

    sendCancellationDecisionEmail(requestData[i][emailIndex], requestData[i][nameIndex], orderId, decision, adminRemarks, refundStatus, requestData[i][mobileIndex]);
    return { success: true, message: 'Cancellation request rejected and customer notified.' };
  }

  return { success: false, message: 'Cancellation request not found.' };
}

function toISOString(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    return date.toISOString();
  }
  return String(date);
}

function rowToOrder(headers, row, spreadsheet, users, customerLookup) {
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

  var userId = String(value('Customer User ID') || '').trim();
  var savedAddressId = value('Saved Address ID') || '';
  var orderId = value('Order ID');
  customerLookup = customerLookup || { usersById: indexUsersById(users || []) };
  var recovered = customerLookup.ordersById && customerLookup.ordersById[String(orderId)] || {};
  if (!userId && savedAddressId && customerLookup.userIdByAddressId) {
    userId = String(customerLookup.userIdByAddressId[String(savedAddressId)] || '').trim();
  }
  if (!userId && recovered.userId) userId = String(recovered.userId).trim();
  var profile = customerLookup.usersById && customerLookup.usersById[userId] || {};
  var savedAddress = spreadsheet && userId
    ? findUserSavedAddressForOrder(spreadsheet, userId, savedAddressId, value('Address Type'), users)
    : null;
  var customer = buildOrderCustomerFromAddress(userId, value('Address Type'), savedAddress, {
    name:         value('Customer Name') || recovered.name || profile.Name,
    mobile:       value('Mobile Number') || recovered.mobile || profile.Mobile,
    altMobile:    value('Alternate Mobile Number'),
    email:        value('Email') || recovered.email || profile.Username,
    flatNo:       value('House/Flat No.'),
    buildingName: value('Building/Society Name'),
    locality:     value('Area/Locality'),
    landmark:     value('Landmark'),
    address:      value('Full Address'),
    city:         value('City'),
    state:        value('State'),
    pincode:      value('Pincode'),
    addressType:  value('Address Type'),
    instructions: value('Delivery Instructions')
  });

  return {
    type: 'order',
    orderId: orderId,
    status: value('Order Status') || 'Pending',
    createdAt: toISOString(value('Order Date')),
    updatedAt: toISOString(value('Updated At')) || toISOString(value('Order Date')),
    customer: customer,
    items: items,
    subtotal:      Number(value('Subtotal')       || 0),
    deliveryCharge:Number(value('Delivery Charge')|| 0),
    total:         Number(value('Total Amount')   || 0),
    paymentMethod: value('Payment Method') || 'Cash on Delivery',
    source:        value('Source')         || 'Website',
    savedAddressId: savedAddressId || (savedAddress && savedAddress.id) || '',
    cancellationStatus: value('Cancellation Status') || '',
    cancellationRequestId: value('Cancellation Request ID') || '',
    statusHistory: parseStatusHistory(value('Status History'))
  };
}

function indexUsersById(users) {
  var result = {};
  for (var i = 0; i < (users || []).length; i++) {
    var id = String(users[i].ID || '').trim();
    if (id) result[id] = users[i];
  }
  return result;
}

// Recover legacy order ownership from durable related records. This only uses
// exact order IDs, saved-address IDs, email, or mobile matches; it never guesses.
function buildOrderCustomerLookup(spreadsheet, users) {
  var lookup = {
    usersById: indexUsersById(users || []),
    userIdByAddressId: {},
    ordersById: {}
  };

  var addressSheet = spreadsheet.getSheetByName('UserAddresses');
  if (addressSheet && addressSheet.getLastRow() > 1) {
    var addressData = addressSheet.getDataRange().getValues();
    var addressHeaders = addressData[0] || [];
    var addressIdIndex = addressHeaders.indexOf('AddressId');
    var customerIdIndex = addressHeaders.indexOf('CustomerId');
    for (var i = 1; i < addressData.length; i++) {
      var addressId = addressIdIndex >= 0 ? String(addressData[i][addressIdIndex] || '').trim() : '';
      var customerId = customerIdIndex >= 0 ? String(addressData[i][customerIdIndex] || '').trim() : '';
      if (addressId && customerId) lookup.userIdByAddressId[addressId] = customerId;
    }
  }

  var requestSheet = spreadsheet.getSheetByName('CancellationRequests');
  if (requestSheet && requestSheet.getLastRow() > 1) {
    var requestData = requestSheet.getDataRange().getValues();
    var requestHeaders = requestData[0] || [];
    var requestOrderIndex = requestHeaders.indexOf('Order ID');
    var requestNameIndex = requestHeaders.indexOf('Customer Name');
    var requestMobileIndex = requestHeaders.indexOf('Customer Mobile');
    var requestEmailIndex = requestHeaders.indexOf('Customer Email');
    for (var j = 1; j < requestData.length; j++) {
      var requestOrderId = requestOrderIndex >= 0 ? String(requestData[j][requestOrderIndex] || '').trim() : '';
      if (!requestOrderId) continue;
      var recovered = {
        name: requestNameIndex >= 0 ? requestData[j][requestNameIndex] : '',
        mobile: requestMobileIndex >= 0 ? requestData[j][requestMobileIndex] : '',
        email: requestEmailIndex >= 0 ? requestData[j][requestEmailIndex] : ''
      };
      for (var userKey in lookup.usersById) {
        if (!lookup.usersById.hasOwnProperty(userKey)) continue;
        var candidate = lookup.usersById[userKey];
        if ((recovered.email && normalizeEmail(candidate.Username) === normalizeEmail(recovered.email)) ||
            (recovered.mobile && normalizeDigits(candidate.Mobile) === normalizeDigits(recovered.mobile))) {
          recovered.userId = userKey;
          break;
        }
      }
      lookup.ordersById[requestOrderId] = recovered;
    }
  }
  return lookup;
}

function ensureColumn(sheet, headers, columnName) {
  var index = headers.indexOf(columnName);
  if (index >= 0) return index;
  var nextColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextColumn).setValue(columnName);
  return nextColumn - 1;
}

function parseStatusHistory(value) {
  if (!value) return [];
  try {
    var parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function appendStatusHistory(existing, item) {
  var history = parseStatusHistory(existing);
  history.push(item);
  return JSON.stringify(history);
}

function ensureCancellationRequestsSheet(spreadsheet) {
  var requiredHeaders = [
    'Request ID',
    'Order ID',
    'Customer Name',
    'Customer Mobile',
    'Customer Email',
    'Order Total',
    'Payment Method',
    'Reason',
    'Request Date',
    'Approval Date',
    'Admin Name',
    'Admin Remarks',
    'Refund Status',
    'Status',
    'Status History'
  ];
  var sheet = spreadsheet.getSheetByName('CancellationRequests');
  if (!sheet) sheet = spreadsheet.insertSheet('CancellationRequests');
  var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || requiredHeaders.length).getValues()[0] || [];
  if (existingHeaders.slice(0, requiredHeaders.length).join('|') !== requiredHeaders.join('|')) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  }
  return sheet;
}

function cancellationRequestRowToObject(row) {
  return {
    requestId: row[0],
    orderId: row[1],
    customerName: row[2],
    customerMobile: row[3],
    customerEmail: row[4],
    orderTotal: Number(row[5] || 0),
    paymentMethod: row[6],
    reason: row[7],
    requestDate: toISOString(row[8]),
    approvalDate: toISOString(row[9]),
    adminName: row[10],
    adminRemarks: row[11],
    refundStatus: row[12],
    status: row[13] || 'Pending',
    statusHistory: parseStatusHistory(row[14])
  };
}

function getCancellationRequests(spreadsheet) {
  var sheet = ensureCancellationRequestsSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();
  var requests = [];
  for (var i = 1; i < data.length; i++) {
    requests.push(cancellationRequestRowToObject(data[i]));
  }
  return requests.reverse();
}

function getRefundStatus(paymentMethod, approvedState) {
  var method = String(paymentMethod || '').toLowerCase();
  if (method.indexOf('cash') >= 0 || method.indexOf('cod') >= 0) return 'No online refund required';
  return approvedState === 'Processed' ? 'Refund processed or queued via payment provider' : 'Pending admin approval';
}

function updateOrderCancellationAudit(spreadsheet, orderId, requestId, decision, historyItem) {
  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var orderIdIndex = headers.indexOf('Order ID');
  var cancellationStatusIndex = ensureColumn(sheet, headers, 'Cancellation Status');
  var cancellationRequestIdIndex = ensureColumn(sheet, sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], 'Cancellation Request ID');
  var statusHistoryIndex = ensureColumn(sheet, sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], 'Status History');
  var updatedAtIndex = headers.indexOf('Updated At');
  data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][orderIdIndex]).trim() === String(orderId).trim()) {
      sheet.getRange(i + 1, cancellationStatusIndex + 1).setValue(decision);
      sheet.getRange(i + 1, cancellationRequestIdIndex + 1).setValue(requestId);
      var updatedHistory = appendStatusHistory(data[i][statusHistoryIndex], historyItem);
      if (decision === 'Approved') {
        updatedHistory = appendStatusHistory(updatedHistory, {
          status: 'Cancelled',
          at: historyItem.at,
          by: historyItem.by,
          remarks: historyItem.remarks
        });
      }
      sheet.getRange(i + 1, statusHistoryIndex + 1).setValue(updatedHistory);
      if (updatedAtIndex >= 0) sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date());
      return;
    }
  }
}

function ensureOrdersSheet(spreadsheet) {
  var requiredHeaders = [
    'Order ID', 'Order Date', 'Customer User ID', 'Address Type',
    'Saved Address ID',
    'Delivery Instructions', 'Products', 'Quantities', 'Subtotal',
    'Delivery Charge', 'Total Amount', 'Payment Method', 'Order Status',
    'Source', 'Created At', 'Updated At', 'Cancellation Status',
    'Cancellation Request ID', 'Status History'
  ];

  var sheet = spreadsheet.getSheetByName('Orders');
  if (!sheet) {
    Logger.log("ensureOrdersSheet: Orders sheet not found, creating it.");
    sheet = spreadsheet.insertSheet('Orders');
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return sheet;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  if (hasDeprecatedOrderColumns(existingHeaders)) {
    var existingData = sheet.getDataRange().getValues();
    for (var r = 1; r < existingData.length; r++) {
      compactOrderRow(spreadsheet, existingHeaders, existingData[r], requiredHeaders);
    }
    removeDeprecatedOrderColumns(sheet);
    existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  }

  for (var i = 0; i < requiredHeaders.length; i++) {
    if (existingHeaders.indexOf(requiredHeaders[i]) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(requiredHeaders[i]);
      existingHeaders.push(requiredHeaders[i]);
    }
  }

  return sheet;
}

function getDeprecatedOrderHeaders() {
  return [
    'Customer Name',
    'Mobile Number',
    'Alternate Mobile Number',
    'Email',
    'House/Flat No.',
    'Building/Society Name',
    'Area/Locality',
    'Landmark',
    'Full Address',
    'City',
    'State',
    'Pincode'
  ];
}

function hasDeprecatedOrderColumns(headers) {
  var deprecated = getDeprecatedOrderHeaders();
  for (var i = 0; i < headers.length; i++) {
    if (deprecated.indexOf(headers[i]) >= 0) return true;
  }
  return false;
}

function removeDeprecatedOrderColumns(sheet) {
  var deprecated = getDeprecatedOrderHeaders();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = headers.length - 1; i >= 0; i--) {
    if (deprecated.indexOf(headers[i]) >= 0) {
      sheet.deleteColumn(i + 1);
    }
  }
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

function orderBelongsToUser(order, userId, mobile, email) {
  var requestedUserId = String(userId || '').trim();
  var requestedMobile = normalizeDigits(mobile);
  var requestedEmail = normalizeEmail(email);
  var customer = order.customer || {};

  if (requestedUserId && String(customer.userId || '').trim() === requestedUserId) return true;
  if (requestedMobile && normalizeDigits(customer.mobile) === requestedMobile) return true;
  if (requestedEmail && normalizeEmail(customer.email) === requestedEmail) return true;
  return false;
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
    var headers = getRequiredUserHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed default users with hashed password
    sheet.appendRow(buildSeedAdminUserRow());
  }

  ensureUsersSheetColumns(sheet);
  ensureUserAddressesSheet(spreadsheet, sheet);
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var addressesByCustomer = getAllUserAddresses(spreadsheet);
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
      else if (key === 'Mobile') row['Mobile'] = val;
      else if (key === 'Email' || key === 'Username') row['Username'] = val;
      else if (key === 'Password (hashed)' || key === 'Password') row['Password'] = val;
      else if (key === 'Role (Admin/Customer)' || key === 'Role') row['Role'] = val;
      else if (key === 'Status' || key === 'Active') {
        var isActive = (val === 'Active' || val === true || val === 'TRUE');
        row['Active'] = isActive;
        active = isActive;
      }
      else if (key === 'Alternate Mobile Number') row['AlternateMobile'] = normalizeDigits(val);
      else if (key === 'SavedAddresses' || key === 'Saved Addresses') row['SavedAddresses'] = val;
      else {
        row[key] = val;
      }
    }
    row['SavedAddresses'] = JSON.stringify(addressesByCustomer[String(row.ID || '').trim()] || []);
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
  Logger.log('handleUserCRUD called with params: ' + JSON.stringify(params));
  var action = params.action;
  var user = params.user;
  var sheet = spreadsheet.getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found.' };
  ensureUsersSheetColumns(sheet);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  Logger.log('handleUserCRUD - headers: ' + JSON.stringify(headers));
  var primaryAddress = getPrimaryAddressForUserPayload(user);
  var clearAddressFields = userHasExplicitEmptySavedAddresses(user);
  var suppliedAddresses = user.SavedAddresses !== undefined && user.SavedAddresses !== null;
  
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
    else if (key === 'Mobile' || key === 'Mobile Number' || key === 'Phone') rowValues[j] = getUserMobile(user);
    else if (key === 'Alternate Mobile Number') rowValues[j] = normalizeDigits(user.AlternateMobile || user.altMobile);
    else if (key === 'Password (hashed)' || key === 'Password') rowValues[j] = user.Password || '';
    else if (key === 'Role (Admin/Customer)' || key === 'Role') rowValues[j] = user.Role || 'Customer';
    else if (key === 'Status' || key === 'Active') rowValues[j] = (user.Active !== false) ? 'Active' : 'Inactive';
    else if (key === 'Registration Date') rowValues[j] = action === 'create' ? new Date().toISOString() : data[1] ? data[1][j] : '';
    else if (key === 'SavedAddresses' || key === 'Saved Addresses') rowValues[j] = normalizeSavedAddressesForStorage(user.SavedAddresses);
    else if (key === 'RecentlyViewed') rowValues[j] = user.RecentlyViewed || '';
    else if (isUserAddressColumn(key)) rowValues[j] = clearAddressFields ? '' : valueForUserAddressColumn(key, primaryAddress, user);
    else rowValues[j] = ''; // Keep empty for others like Last Login
  }
  
  Logger.log('handleUserCRUD - rowValues: ' + JSON.stringify(rowValues));

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
    Logger.log('handleUserCRUD - appending row: ' + JSON.stringify(rowValues));
    sheet.appendRow(rowValues);
    if (suppliedAddresses) replaceUserAddresses(spreadsheet, user.ID, parseUserSavedAddresses(user.SavedAddresses));
    return { success: true, message: 'User created successfully', ID: user.ID };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]).trim() === String(user.ID).trim()) {
      if (action === 'delete') {
        deleteUserAddresses(spreadsheet, user.ID);
        sheet.deleteRow(i + 1);
        return { success: true, message: 'User deleted successfully' };
      } else if (action === 'update') {
        var existingRow = data[i] || [];
        var emailColIndex = headers.indexOf('Email');
        if (emailColIndex === -1) emailColIndex = headers.indexOf('Username');
        var currentEmail = emailColIndex >= 0 ? normalizeEmail(existingRow[emailColIndex]) : '';
        var newEmail = user.Username !== undefined ? normalizeEmail(user.Username) : '';
        
        if (newEmail && currentEmail && newEmail !== currentEmail) {
          var cache = CacheService.getScriptCache();
          var cachedOtp = cache.get('email_change_otp_' + user.ID);
          
          var otpIndex = findHeaderIndex(headers, ['ResetOTP', 'Reset OTP']);
          var expiresIndex = findHeaderIndex(headers, ['ResetOTPExpiresAt', 'Reset OTP Expires At']);
          var sheetOtp = otpIndex >= 0 ? String(existingRow[otpIndex] || '').trim() : '';
          var expiresAt = expiresIndex >= 0 ? new Date(existingRow[expiresIndex]) : null;
          var hasValidSheetOtp = sheetOtp === user.otp && expiresAt && !isNaN(expiresAt.getTime()) && expiresAt.getTime() >= Date.now();
          
          if ((cachedOtp && cachedOtp !== user.otp) || (!cachedOtp && !hasValidSheetOtp)) {
            return { success: false, message: 'Invalid or expired OTP.' };
          }
          
          cache.remove('email_change_otp_' + user.ID);
          if (otpIndex >= 0) {
            sheet.getRange(i + 1, otpIndex + 1).setValue('');
            existingRow[otpIndex] = '';
          }
          if (expiresIndex >= 0) {
            sheet.getRange(i + 1, expiresIndex + 1).setValue('');
            existingRow[expiresIndex] = '';
          }
        }

        var updatedRowValues = new Array(headers.length);

        for (var j = 0; j < headers.length; j++) {
          var key = headers[j].toString().trim();
          var existingValue = existingRow[j];

          if (key === 'User ID' || key === 'ID') {
            updatedRowValues[j] = user.ID !== undefined && user.ID !== null ? user.ID : existingValue;
          } else if (key === 'Full Name' || key === 'Name') {
            updatedRowValues[j] = user.Name !== undefined && user.Name !== null ? user.Name : existingValue;
          } else if (key === 'Email' || key === 'Username') {
            updatedRowValues[j] = user.Username !== undefined && user.Username !== null ? user.Username : existingValue;
          } else if (key === 'Mobile' || key === 'Mobile Number' || key === 'Phone') {
            updatedRowValues[j] = getUserMobile(user) !== '' ? getUserMobile(user) : existingValue;
          } else if (key === 'Alternate Mobile Number') {
            updatedRowValues[j] = user.AlternateMobile !== undefined
              ? normalizeDigits(user.AlternateMobile)
              : (user.altMobile !== undefined ? normalizeDigits(user.altMobile) : existingValue);
          } else if (key === 'Password (hashed)' || key === 'Password') {
            updatedRowValues[j] = user.Password !== undefined && user.Password !== null ? user.Password : existingValue;
          } else if (key === 'Role (Admin/Customer)' || key === 'Role') {
            updatedRowValues[j] = user.Role !== undefined && user.Role !== null ? user.Role : existingValue;
          } else if (key === 'Status' || key === 'Active') {
            updatedRowValues[j] = user.Active !== undefined && user.Active !== null ? ((user.Active !== false) ? 'Active' : 'Inactive') : existingValue;
          } else if (key === 'SavedAddresses' || key === 'Saved Addresses') {
            updatedRowValues[j] = user.SavedAddresses !== undefined && user.SavedAddresses !== null ? normalizeSavedAddressesForStorage(user.SavedAddresses) : existingValue;
          } else if (key === 'RecentlyViewed') {
            updatedRowValues[j] = user.RecentlyViewed !== undefined && user.RecentlyViewed !== null ? user.RecentlyViewed : existingValue;
          } else if (isUserAddressColumn(key)) {
            updatedRowValues[j] = clearAddressFields ? '' : (primaryAddress ? valueForUserAddressColumn(key, primaryAddress, user) : existingValue);
          } else if (key === 'Registration Date' || key === 'Last Login') {
            updatedRowValues[j] = existingValue;
          } else {
            updatedRowValues[j] = existingValue;
          }
        }

        sheet.getRange(i + 1, 1, 1, updatedRowValues.length).setValues([updatedRowValues]);
        if (suppliedAddresses) replaceUserAddresses(spreadsheet, user.ID, parseUserSavedAddresses(user.SavedAddresses));
        return { success: true, message: 'User updated successfully' };
      }
    }
  }
  return { success: false, message: 'User ID not found.' };
}

function getNotificationsData(spreadsheet) {
  var sheet = spreadsheet.getSheetByName('Notifications');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Notifications');
    var headers = ['ID', 'Timestamp', 'Title', 'Message', 'Read', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.appendRow([1, new Date().toISOString(), 'Welcome to Nimra CMS', 'Your secure Admin Portal is fully set up and ready.', false, 'Published']);
  }

  ensureNotificationIds(sheet);
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    
    // Check if using the specific mismatched/custom layout from screenshot
    if (headers.indexOf('NotificationID') >= 0 && headers.indexOf('Title') >= 0 && headers.indexOf('Message') >= 0 && headers.indexOf('Type') >= 0) {
      var idVal = data[i][headers.indexOf('NotificationID')];
      var timeVal = data[i][headers.indexOf('Title')];
      var titleVal = data[i][headers.indexOf('Message')];
      var msgVal = data[i][headers.indexOf('Type')];
      var activeVal = data[i][headers.indexOf('Active')];
      var createdVal = headers.indexOf('CreatedAt') >= 0 ? data[i][headers.indexOf('CreatedAt')] : '';
      
      row = {
        ID: idVal,
        Timestamp: toISOString(timeVal),
        Title: String(titleVal),
        Message: String(msgVal),
        Read: false,
        Status: 'Published',
        CreatedAt: createdVal ? toISOString(createdVal) : toISOString(timeVal)
      };
    } else {
      // Standard header mapping
      var active = true;
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j].toString().trim();
        var val = data[i][j];
        var valStr = val instanceof Date ? val.toISOString() : val;
        
        if (key === 'ID' || key === 'NotificationID') row['ID'] = valStr;
        else if (key === 'Timestamp') row['Timestamp'] = valStr;
        else if (key === 'Title') row['Title'] = valStr;
        else if (key === 'Message') row['Message'] = valStr;
        else if (key === 'Read') row['Read'] = (valStr === true || valStr === 'true' || valStr === 'TRUE');
        else if (key === 'Status') row['Status'] = valStr;
        else if (key === 'CreatedAt') row['CreatedAt'] = valStr;
        else if (key === 'Active') {
          // If the column header is actually Active (not Read), map it
          row['Active'] = (valStr === true || valStr === 'true' || valStr === 'TRUE');
        }
        else row[key] = valStr;
      }
      if (row['Active'] !== undefined && row['Active'] === false) {
        active = false;
      }
      if (!row['Status']) row['Status'] = 'Published';
      if (!row['Timestamp']) row['Timestamp'] = new Date().toISOString();
      if (!row['CreatedAt']) row['CreatedAt'] = row['Timestamp'];
      
      if (!active) continue;
    }
    rows.push(row);
  }
  return rows;
}

function handleNotificationCRUD(spreadsheet, params) {
  var action = params.action;
  var notification = params.notification;
  var sheet = spreadsheet.getSheetByName('Notifications');
  if (!sheet) return { success: false, message: 'Notifications sheet not found.' };
  if ((action === 'delete' || action === 'update') && (!notification || notification.ID === undefined || notification.ID === null || String(notification.ID).trim() === '')) {
    return { success: false, message: 'Notification ID is required.' };
  }

  ensureNotificationIds(sheet);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idIndex = headers.indexOf('NotificationID');
  if (idIndex === -1) idIndex = headers.indexOf('ID');
  if (idIndex === -1) idIndex = 0;

  if (action === 'create' && !notification.ID) {
    var maxId = 0;
    for (var i = 1; i < data.length; i++) {
      var currId = Number(data[i][idIndex]);
      if (!isNaN(currId) && currId > maxId) maxId = currId;
    }
    notification.ID = maxId + 1;
  }

  // Build row values matching spreadsheet headers dynamically
  var rowValues = new Array(headers.length);
  
  // Check if user's specific custom layout is used
  var isCustomLayout = headers.indexOf('NotificationID') >= 0 && headers.indexOf('Title') >= 0 && headers.indexOf('Message') >= 0 && headers.indexOf('Type') >= 0;
  
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j].toString().trim();
    if (isCustomLayout) {
      if (key === 'NotificationID') rowValues[j] = notification.ID;
      else if (key === 'Title') rowValues[j] = notification.Timestamp || new Date().toISOString();
      else if (key === 'Message') rowValues[j] = notification.Title;
      else if (key === 'Type') rowValues[j] = notification.Message;
      else if (key === 'Active') rowValues[j] = true; // Set to true/active so it's not filtered out
      else if (key === 'CreatedAt') rowValues[j] = new Date().toISOString();
      else rowValues[j] = '';
    } else {
      if (key === 'ID' || key === 'NotificationID') rowValues[j] = notification.ID;
      else if (key === 'Timestamp') rowValues[j] = notification.Timestamp || new Date().toISOString();
      else if (key === 'Title') rowValues[j] = notification.Title;
      else if (key === 'Message') rowValues[j] = notification.Message;
      else if (key === 'Read') rowValues[j] = notification.Read !== undefined ? notification.Read : false;
      else if (key === 'Status') rowValues[j] = notification.Status || 'Published';
      else if (key === 'CreatedAt') rowValues[j] = new Date().toISOString();
      else if (key === 'Active') rowValues[j] = true;
      else rowValues[j] = '';
    }
  }

  if (action === 'create') {
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

function ensureNotificationIds(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  var headers = data[0];
  var idIndex = headers.indexOf('NotificationID');
  if (idIndex === -1) idIndex = headers.indexOf('ID');

  if (idIndex === -1) {
    idIndex = headers.length;
    sheet.getRange(1, idIndex + 1).setValue('ID');
    headers.push('ID');
  }

  var seen = {};
  var maxId = 0;
  for (var i = 1; i < data.length; i++) {
    var current = String(data[i][idIndex] || '').trim();
    var numeric = Number(current);
    if (current && !isNaN(numeric) && numeric > maxId) maxId = numeric;
    if (current) seen[current] = (seen[current] || 0) + 1;
  }

  var used = {};
  for (var row = 1; row < data.length; row++) {
    var id = String(data[row][idIndex] || '').trim();
    if (!id || seen[id] > 1 || used[id]) {
      maxId += 1;
      id = String(maxId);
      sheet.getRange(row + 1, idIndex + 1).setValue(id);
    }
    used[id] = true;
  }
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
  Logger.log('handleAuthRegister called with params: ' + JSON.stringify(params));
  var user = params.user || {};
  var name = String(user.Name || '').trim();
  var mobile = getUserMobile(user);
  var email = normalizeEmail(user.Username);
  var password = String(user.Password || '').trim();
  var role = String(user.Role || 'Customer').trim();
  
  Logger.log('handleAuthRegister - name: ' + name + ', mobile: ' + mobile + ', email: ' + email);
  
  if (!name || !password || (!mobile && !email)) {
    return { success: false, message: 'Name, password, and at least one contact method (email/mobile) are required.' };
  }
  if (email && !isValidEmail(email)) {
    return { success: false, message: 'Enter a valid email address.' };
  }

  var users = getUsersData(spreadsheet);
  
  // Check duplicates
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (email && normalizeEmail(u.Username) === email) {
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
  
  Logger.log('handleAuthRegister - newUser: ' + JSON.stringify(newUser));
  
  var result = handleUserCRUD(spreadsheet, { action: 'create', user: newUser });
  if (result.success) {
    newUser.ID = result.ID;
    delete newUser.Password;
    var emailResult = sendWelcomeEmail(email, name);
    var response = { success: true, message: 'Registration successful', user: newUser, emailSent: emailResult.sent };
    if (!emailResult.sent && emailResult.error) {
      response.emailError = emailResult.error;
      response.emailHint = 'Run authorizeNimraEmailSending once in Apps Script, then deploy a new Web App version with Execute as Me.';
    }
    return response;
  }
  return result;
}

function getUserMobile(user) {
  user = user || {};
  return String(
    user.Mobile ||
    user.mobile ||
    user.MobileNumber ||
    user.mobileNumber ||
    user['Mobile Number'] ||
    user.Phone ||
    user.phone ||
    ''
  ).replace(/\D/g, '').trim();
}

function getRequiredUserHeaders() {
  return [
    'User ID',
    'Full Name',
    'Mobile',
    'Email',
    'Password (hashed)',
    'Role (Admin/Customer)',
    'Status',
    'Registration Date',
    'Last Login',
    'Alternate Mobile Number',
    'RecentlyViewed'
  ];
}

function getRequiredUserAddressHeaders() {
  return [
    'AddressId', 'CustomerId', 'AddressType', 'House/Flat No',
    'Building/Society Name', 'Area/Locality', 'Landmark', 'City', 'State',
    'Pincode', 'IsDefault', 'CreatedDate', 'UpdatedDate'
  ];
}

function buildSeedAdminUserRow() {
  var headers = getRequiredUserHeaders();
  var values = {
    'User ID': 1,
    'Full Name': 'System Admin',
    'Mobile': '',
    'Email': 'admin',
    'Password (hashed)': hashPassword('nimraadmin123'),
    'Role (Admin/Customer)': 'Admin',
    'Status': 'Active',
    'Registration Date': new Date().toISOString(),
    'Last Login': '',
  };
  return headers.map(function(header) {
    return values[header] || '';
  });
}

function ensureUsersSheetColumns(sheet) {
  var requiredHeaders = getRequiredUserHeaders();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || requiredHeaders.length).getValues()[0] || [];

  for (var i = 0; i < requiredHeaders.length; i++) {
    if (headers.indexOf(requiredHeaders[i]) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(requiredHeaders[i]);
      headers.push(requiredHeaders[i]);
    }
  }
}

function ensureUserAddressesSheet(spreadsheet, usersSheet) {
  var sheet = spreadsheet.getSheetByName('UserAddresses');
  if (!sheet) sheet = spreadsheet.insertSheet('UserAddresses');
  var required = getRequiredUserAddressHeaders();
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
  } else {
    var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
    for (var h = 0; h < required.length; h++) {
      if (existing.indexOf(required[h]) < 0) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(required[h]);
        existing.push(required[h]);
      }
    }
  }

  // One-time migration: copy every JSON/flattened address before removing Users columns.
  var data = usersSheet.getDataRange().getValues();
  var headers = data[0] || [];
  var idIndex = findHeaderIndex(headers, ['User ID', 'ID']);
  var savedIndex = findHeaderIndex(headers, ['SavedAddresses', 'Saved Addresses']);
  var hasLegacyAddressColumns = savedIndex >= 0 || findHeaderIndex(headers, [
    'SavedAddressId', 'Saved Address ID', 'Address ID', 'AddressType', 'Address Type',
    'House/Flat No', 'House/Flat No.', 'Area/Locality', 'City', 'State', 'Pincode'
  ]) >= 0;
  if (!hasLegacyAddressColumns) return sheet;

  var existingByCustomer = getAllUserAddresses(spreadsheet);
  for (var i = 1; i < data.length; i++) {
    var customerId = idIndex >= 0 ? data[i][idIndex] : '';
    if (!customerId || (existingByCustomer[String(customerId).trim()] || []).length) continue;
    var addresses = savedIndex >= 0 ? parseUserSavedAddresses(data[i][savedIndex]) : [];
    if (!addresses.length) {
      var flattened = userAddressFromColumns(rowObjectFromHeaders(headers, data[i]));
      if (flattened) addresses = [flattened];
    }
    if (addresses.length) replaceUserAddresses(spreadsheet, customerId, addresses);
  }
  removeDeprecatedUserAddressColumns(usersSheet);
  return sheet;
}

function getUserAddresses(spreadsheet, customerId) {
  return getAllUserAddresses(spreadsheet)[String(customerId || '').trim()] || [];
}

function getAllUserAddresses(spreadsheet) {
  var sheet = spreadsheet.getSheetByName('UserAddresses');
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var result = {};
  for (var i = 1; i < data.length; i++) {
    var row = rowObjectFromHeaders(headers, data[i]);
    var customerId = String(row.CustomerId || '').trim();
    if (!customerId) continue;
    if (!result[customerId]) result[customerId] = [];
    result[customerId].push(normalizeSavedAddressRecord({
      id: row.AddressId,
      type: row.AddressType,
      flatNo: row['House/Flat No'],
      buildingName: row['Building/Society Name'],
      locality: row['Area/Locality'],
      landmark: row.Landmark,
      city: row.City,
      state: row.State,
      pincode: row.Pincode,
      isDefault: row.IsDefault === true || String(row.IsDefault).toLowerCase() === 'true'
    }));
  }
  for (var customerId in result) {
    if (result.hasOwnProperty(customerId)) result[customerId] = normalizeSavedAddressList(result[customerId]);
  }
  return result;
}

function replaceUserAddresses(spreadsheet, customerId, addresses) {
  var usersSheet = spreadsheet.getSheetByName('Users');
  var sheet = spreadsheet.getSheetByName('UserAddresses') || ensureUserAddressesSheet(spreadsheet, usersSheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  var data = sheet.getDataRange().getValues();
  var existingCreated = {};
  for (var i = data.length - 1; i >= 1; i--) {
    var oldRow = rowObjectFromHeaders(headers, data[i]);
    if (String(oldRow.CustomerId || '').trim() === String(customerId).trim()) {
      existingCreated[String(oldRow.AddressId || '')] = oldRow.CreatedDate;
      sheet.deleteRow(i + 1);
    }
  }
  var normalized = normalizeSavedAddressList(addresses || []);
  var now = new Date().toISOString();
  for (var j = 0; j < normalized.length; j++) {
    var address = normalized[j];
    var values = {
      AddressId: address.id,
      CustomerId: customerId,
      AddressType: address.type,
      'House/Flat No': address.flatNo,
      'Building/Society Name': address.buildingName,
      'Area/Locality': address.locality,
      Landmark: address.landmark,
      City: address.city,
      State: address.state,
      Pincode: address.pincode,
      IsDefault: address.isDefault === true,
      CreatedDate: existingCreated[address.id] || now,
      UpdatedDate: now
    };
    sheet.appendRow(headers.map(function(header) { return values[header] !== undefined ? values[header] : ''; }));
  }
  return normalized;
}

function deleteUserAddresses(spreadsheet, customerId) {
  return replaceUserAddresses(spreadsheet, customerId, []);
}

function handleUserAddresses(spreadsheet, params) {
  var customerId = String(params.customerId || '').trim();
  if (!customerId) return { success: false, message: 'Customer ID is required.' };
  var users = getUsersData(spreadsheet);
  var found = false;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].ID || '').trim() === customerId) { found = true; break; }
  }
  if (!found) return { success: false, message: 'Customer not found.' };
  var addresses = replaceUserAddresses(spreadsheet, customerId, params.addresses || []);
  return { success: true, message: 'Addresses saved successfully', addresses: addresses };
}

function rowObjectFromHeaders(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[String(headers[i] || '').trim()] = row[i];
  }
  return obj;
}

function isUserAddressColumn(key) {
  return [
    'Saved Address ID',
    'Address Type',
    'House/Flat No.',
    'Building/Society Name',
    'Area/Locality',
    'Landmark',
    'City',
    'State',
    'Pincode',
    'Alternate Mobile Number'
  ].indexOf(key) >= 0;
}

function valueForUserAddressColumn(key, address, user) {
  address = address || {};
  user = user || {};
  var values = {
    'Saved Address ID': address.id || '',
    'Address Type': address.type || address.addressType || '',
    'House/Flat No.': address.flatNo || '',
    'Building/Society Name': address.buildingName || '',
    'Area/Locality': address.locality || '',
    'Landmark': address.landmark || '',
    'City': address.city || '',
    'State': address.state || '',
    'Pincode': address.pincode || '',
    'Alternate Mobile Number': address.altMobile || ''
  };
  return values[key] || '';
}

function getPrimarySavedAddress(addresses) {
  addresses = normalizeSavedAddressList(addresses || []);
  if (!addresses.length) return null;
  for (var i = 0; i < addresses.length; i++) {
    if (addresses[i].isDefault) return addresses[i];
  }
  return addresses[0];
}

function getPrimaryAddressForUserPayload(user) {
  if (!user) return null;
  var saved = parseUserSavedAddresses(user.SavedAddresses || '[]');
  var primary = getPrimarySavedAddress(saved);
  if (primary) return primary;
  return userAddressFromColumns(user);
}

function userHasExplicitEmptySavedAddresses(user) {
  if (!user || user.SavedAddresses === undefined || user.SavedAddresses === null) return false;
  return parseUserSavedAddresses(user.SavedAddresses).length === 0;
}

function userAddressFromColumns(row) {
  row = row || {};
  var hasAddress = row.SavedAddressId || row['Saved Address ID'] || row['Address ID'] || row['House/Flat No'] || row['House/Flat No.'] || row['Area/Locality'] || row.City || row.State || row.Pincode;
  if (!hasAddress) return null;
  return normalizeSavedAddressRecord({
    id: row.SavedAddressId || row['Saved Address ID'] || row['Address ID'],
    type: row.AddressType || row['Address Type'],
    name: row.Name,
    mobile: row.Mobile,
    altMobile: row['Alternate Mobile Number'],
    email: row.Username,
    flatNo: row['House/Flat No'] || row['House/Flat No.'],
    buildingName: row['Building/Society Name'],
    locality: row['Area/Locality'],
    landmark: row.Landmark,
    city: row.City,
    state: row.State,
    pincode: row.Pincode,
    isDefault: true
  });
}

function writeUserAddressColumns(sheet, headers, rowNumber, address) {
  address = normalizeSavedAddressRecord(address);
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (isUserAddressColumn(key)) {
      sheet.getRange(rowNumber, i + 1).setValue(valueForUserAddressColumn(key, address, {}));
    }
  }
}

function removeDeprecatedUserAddressColumns(sheet) {
  var deprecatedHeaders = [
    'SavedAddressId', 'Saved Address ID', 'Address ID', 'AddressType', 'Address Type',
    'House/Flat No', 'House/Flat No.', 'Building/Society Name', 'Area/Locality',
    'Landmark', 'City', 'State', 'Pincode', 'SavedAddresses', 'Saved Addresses',
    'Delivery Instructions', 'Contact Name', 'Contact Mobile', 'Contact Email'
  ];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = headers.length - 1; i >= 0; i--) {
    if (deprecatedHeaders.indexOf(String(headers[i] || '').trim()) >= 0) {
      sheet.deleteColumn(i + 1);
    }
  }
}

function parseUserSavedAddresses(raw) {
  try {
    var parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    Logger.log('parseUserSavedAddresses failure: ' + e.toString());
    return [];
  }
}

function normalizeSavedAddressesForStorage(raw) {
  return JSON.stringify(normalizeSavedAddressList(parseUserSavedAddresses(raw)));
}

function buildFullAddress(address) {
  address = address || {};
  return String(address.fullAddress || address.address || [
    address.flatNo,
    address.buildingName,
    address.locality,
    address.landmark
  ].filter(Boolean).join(', ')).trim();
}

function normalizeSavedAddressRecord(address) {
  address = address || {};
  var id = String(address.id || '').trim();
  if (!id) {
    id = 'addr-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
  }

  return {
    id: id,
    type: String(address.type || address.addressType || 'Home').trim() || 'Home',
    name: String(address.name || '').trim(),
    mobile: normalizeDigits(address.mobile),
    altMobile: normalizeDigits(address.altMobile),
    email: normalizeEmail(address.email),
    flatNo: String(address.flatNo || '').trim(),
    buildingName: String(address.buildingName || '').trim(),
    locality: String(address.locality || '').trim(),
    landmark: String(address.landmark || '').trim(),
    pincode: normalizeDigits(address.pincode).slice(0, 6),
    state: String(address.state || '').trim(),
    city: String(address.city || '').trim(),
    country: String(address.country || 'India').trim() || 'India',
    instructions: '',
    fullAddress: buildFullAddress(address),
    isDefault: address.isDefault === true
  };
}

function normalizeSavedAddressList(addresses) {
  addresses = (addresses || []).filter(Boolean).map(function(address) {
    return normalizeSavedAddressRecord(address);
  });
  if (!addresses.length) return [];

  var defaultIndex = -1;
  for (var i = 0; i < addresses.length; i++) {
    if (addresses[i].isDefault && defaultIndex < 0) defaultIndex = i;
  }
  if (defaultIndex < 0) defaultIndex = 0;

  return addresses.map(function(address, index) {
    address.isDefault = index === defaultIndex;
    return address;
  });
}

function findUserSavedAddress(spreadsheet, userId, savedAddressId, users) {
  if (!userId || !savedAddressId) return null;
  var addresses = null;
  if (users) {
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].ID || '').trim() === String(userId).trim()) {
        addresses = parseUserSavedAddresses(users[i].SavedAddresses || '[]');
        break;
      }
    }
  }
  addresses = addresses || getUserAddresses(spreadsheet, userId);
  for (var j = 0; j < addresses.length; j++) {
    if (String(addresses[j].id || '').trim() === String(savedAddressId).trim()) {
      return normalizeSavedAddressRecord(addresses[j]);
    }
  }
  return null;
}

function findUserSavedAddressForOrder(spreadsheet, userId, savedAddressId, addressType, users) {
  if (savedAddressId) {
    var exact = findUserSavedAddress(spreadsheet, userId, savedAddressId, users);
    if (exact) return exact;
  }

  var addresses = null;
  if (users) {
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].ID || '').trim() === String(userId).trim()) {
        addresses = normalizeSavedAddressList(parseUserSavedAddresses(users[i].SavedAddresses || '[]'));
        break;
      }
    }
  }
  addresses = addresses || getUserAddresses(spreadsheet, userId);
  var requestedType = String(addressType || '').trim().toLowerCase();
  if (requestedType) {
    for (var j = 0; j < addresses.length; j++) {
      if (String(addresses[j].type || '').trim().toLowerCase() === requestedType) return addresses[j];
    }
  }
  return getPrimarySavedAddress(addresses);
}

function upsertUserSavedAddress(spreadsheet, userId, address) {
  if (!userId) return { success: false, message: 'User ID is required to save an address.' };
  var normalizedAddress = normalizeSavedAddressRecord(address);
  var addresses = getUserAddresses(spreadsheet, userId);
  var replaced = false;
  for (var i = 0; i < addresses.length; i++) {
    if (String(addresses[i].id) === String(normalizedAddress.id)) {
      addresses[i] = normalizedAddress;
      replaced = true;
      break;
    }
  }
  if (!replaced) addresses.push(normalizedAddress);
  addresses = replaceUserAddresses(spreadsheet, userId, addresses);
  return { success: true, address: normalizedAddress, addresses: addresses };
}

function buildOrderCustomerFromAddress(userId, orderAddressType, savedAddress, fallback) {
  fallback = fallback || {};
  var address = savedAddress ? normalizeSavedAddressRecord(savedAddress) : fallback;
  var fullAddress = buildFullAddress(address) || buildFullAddress(fallback);
  return {
    userId: userId,
    savedAddressId: address.id || fallback.savedAddressId || '',
    name: address.name || fallback.name || '',
    mobile: address.mobile || fallback.mobile || '',
    altMobile: address.altMobile || fallback.altMobile || '',
    email: address.email || fallback.email || '',
    flatNo: address.flatNo || fallback.flatNo || '',
    buildingName: address.buildingName || fallback.buildingName || '',
    locality: address.locality || fallback.locality || '',
    landmark: address.landmark || fallback.landmark || '',
    address: fullAddress,
    city: address.city || fallback.city || '',
    state: address.state || fallback.state || '',
    pincode: address.pincode || fallback.pincode || '',
    addressType: orderAddressType || address.type || fallback.addressType || 'Home',
    instructions: address.instructions || fallback.instructions || ''
  };
}

function compactOrderRow(spreadsheet, oldHeaders, oldRow, requiredHeaders) {
  function oldValue(name) {
    var index = oldHeaders.indexOf(name);
    return index >= 0 ? oldRow[index] : '';
  }

  var userId = oldValue('Customer User ID');
  var savedAddressId = oldValue('Saved Address ID');
  var addressType = oldValue('Address Type') || 'Home';

  if (userId && !findUserSavedAddress(spreadsheet, userId, savedAddressId)) {
    var addressPayload = normalizeSavedAddressRecord({
      id: savedAddressId,
      type: addressType,
      name: oldValue('Customer Name'),
      mobile: oldValue('Mobile Number'),
      altMobile: oldValue('Alternate Mobile Number'),
      email: oldValue('Email'),
      flatNo: oldValue('House/Flat No.'),
      buildingName: oldValue('Building/Society Name'),
      locality: oldValue('Area/Locality'),
      landmark: oldValue('Landmark'),
      pincode: oldValue('Pincode'),
      state: oldValue('State'),
      city: oldValue('City'),
      instructions: oldValue('Delivery Instructions'),
      fullAddress: oldValue('Full Address'),
      isDefault: false
    });
    var saveResult = upsertUserSavedAddress(spreadsheet, userId, addressPayload);
    if (saveResult.success) {
      savedAddressId = saveResult.address.id;
      addressType = saveResult.address.type;
    }
  }

  var mapped = {
    'Order ID': oldValue('Order ID'),
    'Order Date': oldValue('Order Date'),
    'Address Type': addressType,
    'Saved Address ID': savedAddressId,
    'Delivery Instructions': oldValue('Delivery Instructions'),
    'Products': oldValue('Products'),
    'Quantities': oldValue('Quantities'),
    'Subtotal': oldValue('Subtotal'),
    'Delivery Charge': oldValue('Delivery Charge'),
    'Total Amount': oldValue('Total Amount'),
    'Payment Method': oldValue('Payment Method'),
    'Order Status': oldValue('Order Status') || 'Pending',
    'Source': oldValue('Source'),
    'Created At': oldValue('Created At'),
    'Updated At': oldValue('Updated At'),
    'Customer User ID': userId,
    'Cancellation Status': oldValue('Cancellation Status'),
    'Cancellation Request ID': oldValue('Cancellation Request ID'),
    'Status History': oldValue('Status History')
  };

  return requiredHeaders.map(function(header) {
    return mapped[header] || '';
  });
}

function handleAuthGoogleSignIn(spreadsheet, params) {
  var email = normalizeEmail(params.email);
  var name = String(params.name || '').trim();
  var role = String(params.role || 'Customer').trim(); // Default role for new users
  
  if (!email) {
    return { success: false, message: 'Email is required for Google Sign-In.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: 'Enter a valid Google account email address.' };
  }

  var users = getUsersData(spreadsheet);
  
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (normalizeEmail(u.Username) === email) {
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
    var emailResult = sendWelcomeEmail(email, name);
    var response = { success: true, message: 'Registration successful', user: newUser, emailSent: emailResult.sent };
    if (!emailResult.sent && emailResult.error) {
      response.emailError = emailResult.error;
      response.emailHint = 'Run authorizeNimraEmailSending once in Apps Script, then deploy a new Web App version with Execute as Me.';
    }
    return response;
  }
  return result;
}

function handleRequestEmailChangeOTP(spreadsheet, params) {
  var userId = String(params.userId || '').trim();
  var newEmail = normalizeEmail(params.newEmail);
  if (!userId || !newEmail) return { success: false, message: 'User ID and new email are required.' };
  if (!isValidEmail(newEmail)) return { success: false, message: 'Enter a valid email address.' };
  
  var users = getUsersData(spreadsheet);
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].ID).trim() === userId) {
      user = users[i];
    }
    if (String(users[i].ID).trim() !== userId && normalizeEmail(users[i].Username) === newEmail) {
      return { success: false, message: 'Email address already registered to another account.' };
    }
  }
  if (!user) return { success: false, message: 'User not found.' };
  
  var otp = Math.floor(100000 + Math.random() * 900000).toString();
  var expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  var cache = CacheService.getScriptCache();
  cache.put('email_change_otp_' + userId, otp, 600);
  
  var userMatch = findUserRowByEmail(spreadsheet, user.Username);
  if (userMatch) {
    var otpIndex = ensureUserColumn(userMatch.sheet, userMatch.headers, 'ResetOTP');
    var expiresIndex = ensureUserColumn(userMatch.sheet, userMatch.headers, 'ResetOTPExpiresAt');
    userMatch.sheet.getRange(userMatch.rowNumber, otpIndex + 1).setValue(otp);
    userMatch.sheet.getRange(userMatch.rowNumber, expiresIndex + 1).setValue(expiresAt.toISOString());
  }
  
  try {
    sendEmailChangeOtpEmail(newEmail, otp, user.Name);
    return { success: true, message: 'OTP sent to your new email.' };
  } catch (e) {
    var emailError = getErrorMessage(e);
    Logger.log('handleRequestEmailChangeOTP email failure: ' + emailError);
    return {
      success: false,
      message: 'Failed to send email: ' + emailError,
      hint: 'Run authorizeNimraEmailSending once in Apps Script, then deploy a new Web App version with Execute as Me.'
    };
  }
}

function sendEmailChangeOtpEmail(email, otp, name) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    throw new Error('Invalid email address.');
  }
  var displayName = String(name || 'NIMRA customer').trim();
  var subject = 'NIMRA email change OTP';
  var plainBody = 'Hello ' + displayName + ',\n\n' +
    'Your OTP for changing your NIMRA account email is: ' + otp + '\n\n' +
    'This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.\n\n' +
    'NIMRA Support';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>Your OTP for changing your NIMRA account email is:</p>' +
    '<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">' + otp + '</p>' +
    '<p>This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>' +
    '<p>NIMRA Support</p>';

  var result = sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Support');
  if (!result.sent) throw new Error(result.error || 'Unable to send OTP email.');
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
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    throw new Error('Invalid email address.');
  }
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

  var result = sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Support');
  if (!result.sent) throw new Error(result.error || 'Unable to send OTP email.');
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

function sendNimraEmail(email, subject, plainBody, htmlBody, senderName) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    return { sent: false, error: 'Invalid email address.' };
  }

  var message = {
    to: email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: senderName || 'NIMRA Support',
    replyTo: 'tsenterprises.nat@gmail.com'
  };

  try {
    MailApp.sendEmail(message);
    Logger.log('Email sent with MailApp to ' + email + ' subject: ' + subject);
    return { sent: true };
  } catch (mailError) {
    var mailErrorMessage = getErrorMessage(mailError);
    Logger.log('MailApp failed for ' + email + ': ' + mailErrorMessage);
    try {
      GmailApp.sendEmail(email, subject, plainBody, {
        htmlBody: htmlBody,
        name: senderName || 'NIMRA Support',
        replyTo: 'tsenterprises.nat@gmail.com'
      });
      Logger.log('Email sent with GmailApp to ' + email + ' subject: ' + subject);
      return { sent: true };
    } catch (gmailError) {
      var gmailErrorMessage = getErrorMessage(gmailError);
      Logger.log('GmailApp failed for ' + email + ': ' + gmailErrorMessage);
      return { sent: false, error: mailErrorMessage + ' | GmailApp: ' + gmailErrorMessage };
    }
  }
}

// ── HARDCODE YOUR EMAIL HERE if Session.getEffectiveUser() keeps failing ──
var NIMRA_OVERRIDE_TEST_EMAIL = ''; // e.g. 'yourname@gmail.com'

function authorizeNimraEmailSending() {
  // Try to get email from session; fall back to override
  var rawEmail = Session.getEffectiveUser().getEmail();
  Logger.log('Session.getEffectiveUser().getEmail() returned: [' + rawEmail + ']');

  var email = normalizeEmail(rawEmail || NIMRA_OVERRIDE_TEST_EMAIL);
  Logger.log('Normalized test email: [' + email + ']');

  if (!email || !isValidEmail(email)) {
    throw new Error(
      'Could not get a valid email address.\n' +
      'Session returned: [' + rawEmail + ']\n' +
      'Fix: Set NIMRA_OVERRIDE_TEST_EMAIL at the top of this script to your Gmail address and run again.\n' +
      'Also make sure you are running this function from the Apps Script EDITOR (not via web app URL).'
    );
  }

  Logger.log('Starting authorization test emails to: ' + email);
  var results = [];

  // 1. OTP email
  try {
    sendPasswordResetOtpEmail(email, '123456', 'NIMRA Admin');
    results.push('OTP email: SENT');
    Logger.log('OTP email sent OK');
  } catch (e) {
    results.push('OTP email: FAILED - ' + getErrorMessage(e));
    Logger.log('OTP email FAILED: ' + getErrorMessage(e));
  }

  // 2. Welcome email
  try {
    var welcomeResult = sendWelcomeEmail(email, 'NIMRA Admin');
    if (welcomeResult && welcomeResult.sent) {
      results.push('Welcome email: SENT');
      Logger.log('Welcome email sent OK');
    } else {
      results.push('Welcome email: FAILED - ' + (welcomeResult ? welcomeResult.error : 'unknown'));
      Logger.log('Welcome email FAILED: ' + (welcomeResult ? welcomeResult.error : 'unknown'));
    }
  } catch (e) {
    results.push('Welcome email: FAILED - ' + getErrorMessage(e));
    Logger.log('Welcome email FAILED: ' + getErrorMessage(e));
  }

  // 3. Order confirmation email
  try {
    var orderResult = sendOrderConfirmationEmail(email, 'NIMRA Admin', 'NIMRA-AUTH-TEST', 'Auth test item x1', 99);
    if (orderResult && orderResult.sent) {
      results.push('Order email: SENT');
      Logger.log('Order email sent OK');
    } else {
      results.push('Order email: FAILED - ' + (orderResult ? orderResult.error : 'unknown'));
      Logger.log('Order email FAILED: ' + (orderResult ? orderResult.error : 'unknown'));
    }
  } catch (e) {
    results.push('Order email: FAILED - ' + getErrorMessage(e));
    Logger.log('Order email FAILED: ' + getErrorMessage(e));
  }

  var summary = 'Auth test complete for [' + email + ']:\n' + results.join('\n');
  Logger.log(summary);

  var allSent = results.every(function(r) { return r.indexOf('SENT') !== -1; });
  if (!allSent) {
    throw new Error(summary + '\n\nIf permission errors appear, make sure the Web App is deployed with "Execute as: Me" and this function was run from the Script EDITOR (not via web app URL).');
  }

  return summary + '\n\nAll emails sent! Now deploy the Web App as a NEW VERSION with "Execute as: Me".';
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

function handleCartSync(spreadsheet, params) {
  var userId = String(params.userId || '').trim();
  var items = params.items || [];
  
  if (!userId) {
    return { success: false, message: 'userId is required for cart sync' };
  }
  
  var sheet = spreadsheet.getSheetByName('Carts');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Carts');
    sheet.getRange(1, 1, 1, 3).setValues([['User ID', 'Cart Data', 'Updated At']]);
  }
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === userId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  var cartJson = JSON.stringify(items);
  var now = new Date().toISOString();
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 2, 1, 2).setValues([[cartJson, now]]);
  } else {
    sheet.appendRow([userId, cartJson, now]);
  }
  
  return { success: true, message: 'Cart synced successfully' };
}

function getCart(spreadsheet, params) {
  var userId = String(params.userId || '').trim();
  
  if (!userId) {
    return { success: false, message: 'userId is required to get cart' };
  }
  
  var sheet = spreadsheet.getSheetByName('Carts');
  if (!sheet) {
    return { success: true, items: [] };
  }
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === userId) {
      try {
        var items = JSON.parse(data[i][1]);
        return { success: true, items: items };
      } catch (e) {
        return { success: true, items: [] };
      }
    }
  }
  
  return { success: true, items: [] };
}

function sendWelcomeEmail(email, name) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    Logger.log("sendWelcomeEmail skipped: invalid email address provided.");
    return { sent: false };
  }
  var displayName = String(name || 'Customer').trim();
  var subject = 'Welcome to NIMRA!';
  var plainBody = 'Hello ' + displayName + ',\n\n' +
    'Welcome to NIMRA Beverage Company! We are thrilled to have you on board.\n\n' +
    'Explore our wide range of premium beverages. If you have any questions, feel free to reply to this email.\n\n' +
    'Cheers,\nThe NIMRA Team';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>Welcome to <strong>NIMRA Beverage Company</strong>! We are thrilled to have you on board.</p>' +
    '<p>Explore our wide range of premium beverages. If you have any questions, feel free to reply to this email.</p>' +
    '<p>Cheers,<br>The NIMRA Team</p>';

  return sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Team');
}

function sendOrderConfirmationEmail(email, name, orderId, products, totalAmount, mobile) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    Logger.log("sendOrderConfirmationEmail skipped: invalid email address provided.");
    return { sent: false };
  }
  var displayName = String(name || 'Customer').trim();
  var trackingUrl = 'https://nimrawater.com/track?orderId=' + encodeURIComponent(orderId) + '&mobile=' + encodeURIComponent(mobile || '') + '&autoSubmit=true';
  var subject = 'NIMRA Order Confirmation - ' + orderId;
  var plainBody = 'Hello ' + displayName + ',\n\n' +
    'Thank you for your order! Your order ' + orderId + ' has been placed successfully.\n\n' +
    'Items:\n' + products + '\n\n' +
    'Total: ₹' + totalAmount + '\n\n' +
    'You can track your order here: ' + trackingUrl + '\n\n' +
    'We will notify you once it is dispatched.\n\n' +
    'NIMRA Support';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>Thank you for your order! Your order <strong>' + orderId + '</strong> has been placed successfully.</p>' +
    '<p><strong>Items:</strong><br/>' + escapeHtml(products) + '</p>' +
    '<p><strong>Total:</strong> ₹' + totalAmount + '</p>' +
    '<p>You can track your order here: <a href="' + trackingUrl + '">' + trackingUrl + '</a></p>' +
    '<p>We will notify you once it is dispatched.</p>' +
    '<p>NIMRA Support</p>';

  return sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Support');
}

function sendOrderStatusUpdateEmail(email, name, orderId, status, mobile) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) {
    Logger.log("sendOrderStatusUpdateEmail skipped: invalid email address provided.");
    return { sent: false };
  }
  var displayName = String(name || 'Customer').trim();
  var trackingUrl = 'https://nimrawater.com/track?orderId=' + encodeURIComponent(orderId) + '&mobile=' + encodeURIComponent(mobile || '') + '&autoSubmit=true';
  var subject = 'NIMRA Order #' + orderId + ' Status Update: ' + status;
  
  var messageText = 'Your order status has been updated to: ' + status + '.';
  if (status.toLowerCase() === 'dispatched' || status.toLowerCase() === 'shipped') {
    messageText = 'Good news! Your order has been shipped and is on its way.';
  } else if (status.toLowerCase() === 'delivered') {
    messageText = 'Your order has been delivered successfully. Thank you for choosing NIMRA!';
  } else if (status.toLowerCase() === 'cancelled') {
    messageText = 'Your order has been cancelled.';
  } else if (status.toLowerCase() === 'confirmed') {
    messageText = 'Your order has been confirmed and is now being processed.';
  }

  var plainBody = 'Hello ' + displayName + ',\n\n' +
    'Your order ' + orderId + ' status has been updated.\n\n' +
    'New Status: ' + status + '\n' +
    messageText + '\n\n' +
    'You can track your order here: ' + trackingUrl + '\n\n' +
    'NIMRA Support';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>Your order <strong>' + orderId + '</strong> status has been updated.</p>' +
    '<p><strong>New Status:</strong> <span style="font-weight:bold;color:#1e3a8a;">' + escapeHtml(status) + '</span></p>' +
    '<p>' + escapeHtml(messageText) + '</p>' +
    '<p>You can track your order here: <a href="' + trackingUrl + '">' + trackingUrl + '</a></p>' +
    '<p>NIMRA Support</p>';

  return sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Support');
}

function sendCancellationDecisionEmail(email, name, orderId, decision, adminRemarks, refundStatus, mobile) {
  email = normalizeEmail(email);
  if (!email || !isValidEmail(email)) return { sent: false };
  var displayName = String(name || 'Customer').trim();
  var approved = decision === 'Approved';
  var trackingUrl = 'https://nimrawater.com/track?orderId=' + encodeURIComponent(orderId) + '&mobile=' + encodeURIComponent(mobile || '') + '&autoSubmit=true';
  var subject = approved ? 'NIMRA Order #' + orderId + ' Cancellation Confirmed' : 'NIMRA Order #' + orderId + ' Cancellation Request Update';
  var plainBody = 'Hello ' + displayName + ',\n\n' +
    (approved ? 'Your cancellation request has been approved and your order is now Cancelled.' : 'Your cancellation request was reviewed and rejected.') + '\n\n' +
    'Admin remarks: ' + adminRemarks + '\n' +
    'Refund status: ' + refundStatus + '\n\n' +
    'Track your order here: ' + trackingUrl + '\n\n' +
    'NIMRA Support';
  var htmlBody = '<p>Hello ' + escapeHtml(displayName) + ',</p>' +
    '<p>' + (approved ? 'Your cancellation request has been approved and your order is now <strong>Cancelled</strong>.' : 'Your cancellation request was reviewed and rejected.') + '</p>' +
    '<p><strong>Admin remarks:</strong> ' + escapeHtml(adminRemarks) + '</p>' +
    '<p><strong>Refund status:</strong> ' + escapeHtml(refundStatus) + '</p>' +
    '<p>You can track your order here: <a href="' + trackingUrl + '">' + trackingUrl + '</a></p>' +
    '<p>NIMRA Support</p>';
  return sendNimraEmail(email, subject, plainBody, htmlBody, 'NIMRA Support');
}

function testEmailTemplates() {
  var testEmail = Session.getEffectiveUser().getEmail();
  Logger.log("Testing welcome email to: " + testEmail);
  sendWelcomeEmail(testEmail, "Test User");
  Logger.log("Testing order confirmation email to: " + testEmail);
  sendOrderConfirmationEmail(testEmail, "Test User", "NIMRA-TEST-12345", "NIMRA 1 Litre Bottle (1L) x 2 | NIMRA 5 Litre Can (5L) x 1", 95);
  Logger.log("Email tests complete. Check your inbox!");
}

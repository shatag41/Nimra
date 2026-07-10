/**
 * NIMRA Google Sheets setup script.
 * Run setupNIMRASheets once from the Apps Script editor attached to your Sheet.
 */

function setupNIMRASheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var bannersSheet = getOrCreateSheet(ss, 'Banners');
  bannersSheet.clearContents();
  bannersSheet.getRange(1, 1, 1, 7).setValues([[
    'ID', 'Title', 'Subtitle', 'ImageUrl', 'ButtonText', 'ButtonLink', 'Active'
  ]]);
  bannersSheet.getRange(2, 1, 2, 7).setValues([
    [1, 'Pure Hydration. Healthy Living.',
      'NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.',
      '',
      'Explore Products', '/products', true],
    [2, 'Mineral Balanced Purity',
      'Sourced responsibly and purified through a rigorous 10-step process for absolute safety.',
      '',
      'Order Now', '/products', true]
  ]);

  var productsSheet = getOrCreateSheet(ss, 'Products');
  productsSheet.clearContents();
  productsSheet.getRange(1, 1, 1, 12).setValues([[
    'ID', 'Name', 'Category', 'Volume', 'Price', 'Description', 'ImageUrl',
    'Specifications', 'StockStatus', 'DiscountPercent', 'ComboPack', 'Active'
  ]]);
  productsSheet.getRange(2, 1, 7, 12).setValues([
    [1, 'NIMRA 250ml Bottle', 'Packaged Drinking Water', '250ml', '6.00',
      'Perfect pocket-sized pure drinking water for short trips, conferences, and quick refreshments.',
      '',
      'RO purified, mineral balanced, food-grade PET bottle', 'In Stock', '', '', true],
    [2, 'NIMRA 500ml Bottle', 'Packaged Drinking Water', '500ml', '10.00',
      'Your convenient hydration companion for daily commutes, gyms, and office desks.',
      '',
      'RO purified, mineral balanced, food-grade PET bottle', 'In Stock', '', '', true],
    [3, 'NIMRA 1 Litre Bottle', 'Mineral Water', '1L', '20.00',
      'Standard 1 Litre bottle for pure mineral-balanced hydration at home, dining, or travel.',
      '',
      'Balanced minerals, UV and ozone treated, travel pack', 'In Stock', '', '', true],
    [4, 'NIMRA 2 Litre Bottle', 'Packaged Drinking Water', '2L', '30.00',
      'Bigger size for family picnics and long journeys. Keep clean water accessible for all.',
      '',
      'Family bottle, tamper-evident cap, recyclable pack', 'In Stock', '', '', true],
    [5, 'NIMRA 5 Litre Can', 'Bulk Water', '5L', '55.00',
      'Family-sized purified water can for home kitchens, travel groups, and small gatherings.',
      '',
      'RO purified, mineral balanced, recyclable food-grade pack', 'In Stock', '', '', true],
    [6, 'NIMRA 20 Litre Dispenser Jar', 'Bulk Water', '20L Jar', '80.00',
      'Eco-friendly bulk jar for continuous hydration at office spaces and household kitchen units.',
      '',
      'Returnable jar, dispenser compatible, scheduled delivery available', 'In Stock', '', '', true],
    [7, 'RUSH Club Soda 500ml', 'Upcoming RUSH Soda', '500ml', '25.00',
      'Upcoming extra-fizzy RUSH soda made on the NIMRA purified water base.',
      '',
      'Coming soon, carbonated beverage, launch stock managed from Sheets', 'Coming Soon', '', '', true]
  ]);

  var faqsSheet = getOrCreateSheet(ss, 'FAQs');
  faqsSheet.clearContents();
  faqsSheet.getRange(1, 1, 1, 4).setValues([['ID', 'Question', 'Answer', 'Active']]);
  faqsSheet.getRange(2, 1, 4, 4).setValues([
    [1, 'What makes NIMRA Packaged Drinking Water pure?',
      'NIMRA water goes through an advanced 10-step purification process including sand filtration, carbon filtration, RO, mineral enrichment, UV, and ozonation.',
      true],
    [2, 'Where is NIMRA water manufactured?',
      'NIMRA water is manufactured at our packaging plant near Jagtap Vasti, Daund, Pune, Lingali - 413801.',
      true],
    [3, 'Can I place bulk orders for corporate events or weddings?',
      'Yes. Add bulk jars or bottle packs to cart, checkout, or contact us at +91 8888378411 for scheduled delivery.',
      true],
    [4, 'How are order statuses updated?',
      'Orders are saved in Google Sheets. Update the Status column to Pending, Confirmed, Processing, Out for Delivery, or Delivered.',
      true]
  ]);

  var infoSheet = getOrCreateSheet(ss, 'CompanyInfo');
  infoSheet.clearContents();
  infoSheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
  infoSheet.getRange(2, 1, 9, 2).setValues([
    ['BrandName', 'NIMRA'],
    ['Phone', '+91 8888378411'],
    ['Email', 'tsenterprises.nat@gmail.com'],
    ['OfficeAddress', '#10, Gulistan Building, K.B. Hidayatullah Road, Camp, Pune - 411001'],
    ['PlantAddress', 'SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali - 413801'],
    ['WhatsAppNumber', '918888378411'],
    ['AboutStory', 'At NIMRA, we believe pure drinking water is the cornerstone of robust health and energetic living.'],
    ['QualityText', 'Quality is our philosophy. Our labs run strict controls and every pack is processed with modern purification.'],
    ['InfrastructureText', 'Our Daund plant features automated bottle blow-moulding, touch-free filling lines, and rapid logistics storage.']
  ]);

  var inquiriesSheet = getOrCreateSheet(ss, 'Inquiries');
  if (inquiriesSheet.getLastRow() === 0) {
    inquiriesSheet.getRange(1, 1, 1, 16).setValues([[
      'Inquiry ID',
      'Submission Key',
      'Customer ID',
      'Timestamp',
      'Name',
      'Email',
      'Phone',
      'Subject',
      'Message',
      'Status',
      'Admin Notification Sent',
      'Admin Notification ID',
      'Admin Email Sent At',
      'Admin Email Error',
      'Reviewed At',
      'Reviewed By'
    ]]);
  }

  var ordersSheet = getOrCreateSheet(ss, 'Orders');
  ensureOrdersSetupSheet(ordersSheet);

  var cancellationSheet = getOrCreateSheet(ss, 'CancellationRequests');
  if (cancellationSheet.getLastRow() === 0) {
    var cancellationHeaders = [
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
    cancellationSheet.getRange(1, 1, 1, cancellationHeaders.length).setValues([cancellationHeaders]);
  }

  var eventsSheet = getOrCreateSheet(ss, 'Events');
  if (eventsSheet.getLastRow() === 0) {
    eventsSheet.getRange(1, 1, 1, 19).setValues([[
      'EventID', 'Timestamp', 'TargetAudience', 'EventType', 'Title', 'Message',
      'Read', 'Status', 'Category', 'Priority', 'ActionLink', 'UserID',
      'Username', 'InquiryID', 'OrderID', 'RelatedEntityID',
      'DeduplicationKey', 'CreatedAt', 'ReadByUserIDs'
    ]]);
  }

  // Set up Users sheet
  var usersSheet = getOrCreateSheet(ss, 'Users');
  var userAddressesSheet = getOrCreateSheet(ss, 'UserAddresses');
  ensureUserAddressesSetupSheet(userAddressesSheet);
  if (usersSheet.getLastRow() === 0) {
    var userHeaders = getRequiredUserHeaders();
    usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    // Seed default admin user
    // We need to define hashPassword here or just use a placeholder
    // For setup, we'll just use a simple placeholder hash, user can reset it later
    usersSheet.appendRow(buildSetupAdminUserRow());
  } else {
    ensureUsersSetupSheet(usersSheet, userAddressesSheet);
  }

  var activitySheet = getOrCreateSheet(ss, 'AdminActivityLogs');
  if (activitySheet.getLastRow() === 0) {
    var activityHeaders = ['LogID', 'AdminID', 'AdminName', 'Role', 'Action', 'Module', 'TargetID', 'OldData', 'NewData', 'IP', 'Browser', 'Timestamp', 'Result'];
    activitySheet.getRange(1, 1, 1, activityHeaders.length).setValues([activityHeaders]);
  }

  var permissionsSheet = getOrCreateSheet(ss, 'RolesPermissions');
  if (permissionsSheet.getLastRow() === 0) {
    var permissionHeaders = ['Role', 'Orders', 'Products', 'Customers', 'Admins', 'Reports', 'Notifications', 'Settings', 'FAQs', 'Banners', 'Analytics'];
    permissionsSheet.getRange(1, 1, 1, permissionHeaders.length).setValues([permissionHeaders]);
    permissionsSheet.appendRow(['SUPER_ADMIN', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*']);
    permissionsSheet.appendRow(['ADMIN', 'view,create,edit', 'view,create,edit', 'view,edit', '', '', 'view,create', 'view', 'view,create,edit', 'view,create,edit', 'view']);
  }

  notifySetupComplete('NIMRA Sheets setup complete. Role-based admin, audit, catalog, inquiry, order, and user tabs are ready.');
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function getRequiredOrderHeaders() {
  return [
    'Order ID',
    'Order Date',
    'Customer User ID',
    'Address Type',
    'Saved Address ID',
    'Delivery Instructions',
    'Products',
    'Quantities',
    'Items JSON',
    'Subtotal',
    'Delivery Charge',
    'Total Amount',
    'Payment Method',
    'Order Status',
    'Source',
    'Created At',
    'Updated At',
    'Cancellation Status',
    'Cancellation Request ID',
    'Status History'
  ];
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
    'Department',
    'Permissions',
    'Created By',
    'Created At',
    'Updated At',
    'Last Login',
    'Alternate Mobile Number',
    'RecentlyViewed',
    'Email Preferences'
  ];
}

function getRequiredUserAddressHeaders() {
  return [
    'AddressId', 'CustomerId', 'AddressType', 'House/Flat No',
    'Building/Society Name', 'Area/Locality', 'Landmark', 'City', 'State',
    'Pincode', 'IsDefault', 'CreatedDate', 'UpdatedDate'
  ];
}

function buildSetupAdminUserRow() {
  var values = {
    'User ID': 1,
    'Full Name': 'System Admin',
    'Mobile': '',
    'Email': 'admin',
    'Password (hashed)': 'placeholder_hash',
    'Role (Admin/Customer)': 'SUPER_ADMIN',
    'Status': 'Active',
    'Created At': new Date().toISOString(),
    'Updated At': new Date().toISOString(),
    'Last Login': ''
  };
  return getRequiredUserHeaders().map(function(header) {
    return values[header] || '';
  });
}

function ensureOrdersSetupSheet(sheet) {
  var requiredHeaders = getRequiredOrderHeaders();
  var existingHeaders = sheet.getDataRange().getValues()[0] || [];
  if (sheet.getLastRow() === 0 || existingHeaders.length === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return;
  }

  removeDeprecatedOrderColumns(sheet);
  existingHeaders = normalizeOrderSetupHeaders(sheet);

  for (var i = 0; i < requiredHeaders.length; i++) {
    if (existingHeaders.indexOf(requiredHeaders[i]) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(requiredHeaders[i]);
      existingHeaders.push(requiredHeaders[i]);
    }
  }
}

function normalizeOrderSetupHeaderName(name) {
  var normalized = String(name || '').trim();
  var aliases = {
    'OrderID': 'Order ID',
    'OrderDate': 'Order Date',
    'CustomerUserID': 'Customer User ID',
    'Customer UserID': 'Customer User ID',
    'AddressType': 'Address Type',
    'SavedAddressId': 'Saved Address ID',
    'Saved AddressId': 'Saved Address ID',
    'DeliveryInstructions': 'Delivery Instructions',
    'ItemsJSON': 'Items JSON',
    'PaymentMethod': 'Payment Method',
    'OrderStatus': 'Order Status',
    'CreatedAt': 'Created At',
    'UpdatedAt': 'Updated At',
    'CancellationStatus': 'Cancellation Status',
    'CancellationRequestID': 'Cancellation Request ID',
    'StatusHistory': 'Status History'
  };
  return aliases[normalized] || normalized;
}

function normalizeOrderSetupHeaders(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  var normalizedHeaders = headers.map(normalizeOrderSetupHeaderName);
  var changed = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || '') !== normalizedHeaders[i]) {
      changed = true;
      break;
    }
  }
  if (changed) {
    sheet.getRange(1, 1, 1, normalizedHeaders.length).setValues([normalizedHeaders]);
  }
  return normalizedHeaders;
}

function removeDeprecatedOrderColumns(sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  if (!sheet) {
    throw new Error('Orders sheet was not found. Run setupNIMRASheets first.');
  }
  var deprecated = [
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
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = headers.length - 1; i >= 0; i--) {
    if (deprecated.indexOf(headers[i]) >= 0) {
      sheet.deleteColumn(i + 1);
    }
  }
}

function ensureUserAddressesSetupSheet(sheet) {
  var headers = getRequiredUserAddressHeaders();
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = 0; i < headers.length; i++) {
    if (existing.indexOf(headers[i]) < 0) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(headers[i]);
  }
}

function ensureUsersSetupSheet(sheet, addressSheet) {
  var requiredHeaders = getRequiredUserHeaders();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  for (var i = 0; i < requiredHeaders.length; i++) {
    if (requiredHeaders[i] === 'Role (Admin/Customer)' && headers.indexOf('Role') !== -1) continue;
    if (headers.indexOf(requiredHeaders[i]) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(requiredHeaders[i]);
      headers.push(requiredHeaders[i]);
    }
  }

  var data = sheet.getDataRange().getValues();
  headers = data[0] || [];
  var savedIndex = headers.indexOf('SavedAddresses');
  if (savedIndex === -1) savedIndex = headers.indexOf('Saved Addresses');

  var idIndex = headers.indexOf('User ID');
  if (idIndex < 0) idIndex = headers.indexOf('ID');
  var addressHeaders = addressSheet.getRange(1, 1, 1, addressSheet.getLastColumn()).getValues()[0];
  var existingAddressData = addressSheet.getDataRange().getValues();
  for (var rowIndex = 1; rowIndex < data.length; rowIndex++) {
    var customerId = idIndex >= 0 ? data[rowIndex][idIndex] : '';
    if (!customerId || setupCustomerHasAddress(existingAddressData, addressHeaders, customerId)) continue;
    var addresses = savedIndex >= 0 ? parseSetupAddresses(data[rowIndex][savedIndex]) : [];
    if (!addresses.length) {
      var flattened = getSetupAddressFromColumns(headers, data[rowIndex]);
      if (flattened) addresses = [flattened];
    }
    var now = new Date().toISOString();
    for (var addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
      var address = addresses[addressIndex] || {};
      var addressId = address.id || address.addressId || ('addr-' + Utilities.getUuid());
      var values = {
        AddressId: addressId, CustomerId: customerId,
        AddressType: address.type || address.addressType || 'Home',
        'House/Flat No': address.flatNo || '',
        'Building/Society Name': address.buildingName || '',
        'Area/Locality': address.locality || '', Landmark: address.landmark || '',
        City: address.city || '', State: address.state || '', Pincode: address.pincode || '',
        IsDefault: address.isDefault === true || (addressIndex === 0 && !addresses.some(function(a) { return a && a.isDefault; })),
        CreatedDate: now, UpdatedDate: now
      };
      addressSheet.appendRow(addressHeaders.map(function(header) { return values[header] !== undefined ? values[header] : ''; }));
    }
  }
  removeDeprecatedSetupUserColumns(sheet);
}

function parseSetupAddresses(raw) {
  if (!raw) return [];
  try {
    var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

function setupCustomerHasAddress(data, headers, customerId) {
  var index = headers.indexOf('CustomerId');
  if (index < 0) return false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][index]).trim() === String(customerId).trim()) return true;
  }
  return false;
}

function getPrimarySetupAddress(raw) {
  if (!raw) return null;
  try {
    var parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    for (var i = 0; i < parsed.length; i++) {
      if (parsed[i] && parsed[i].isDefault) return parsed[i];
    }
    return parsed[0];
  } catch (e) {
    Logger.log('Could not parse SavedAddresses during setup: ' + e.toString());
    return null;
  }
}

function valueForSetupAddressColumn(header, address) {
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
  return values.hasOwnProperty(header) ? values[header] : null;
}

function getSetupAddressFromColumns(headers, row) {
  var data = {};
  for (var i = 0; i < headers.length; i++) {
    data[String(headers[i] || '').trim()] = row[i];
  }
  var hasAddress = data.SavedAddressId || data['Saved Address ID'] || data['Address ID'] || data['House/Flat No'] || data['House/Flat No.'] || data['Area/Locality'] || data.City || data.State || data.Pincode;
  if (!hasAddress) return null;
  return {
    id: data.SavedAddressId || data['Saved Address ID'] || data['Address ID'] || '',
    type: data.AddressType || data['Address Type'] || '',
    flatNo: data['House/Flat No'] || data['House/Flat No.'] || '',
    buildingName: data['Building/Society Name'] || '',
    locality: data['Area/Locality'] || '',
    landmark: data.Landmark || '',
    city: data.City || '',
    state: data.State || '',
    pincode: data.Pincode || '',
    name: '',
    mobile: '',
    altMobile: data['Alternate Mobile Number'] || '',
    email: ''
  };
}

function removeDeprecatedSetupUserColumns(sheet) {
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

function notifySetupComplete(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

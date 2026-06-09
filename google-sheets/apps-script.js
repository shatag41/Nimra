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
    var params = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Inquiries');
    
    if (!sheet) {
      return jsonResponse({ success: false, error: "Sheet 'Inquiries' not found." });
    }
    
    var timestamp = new Date();
    var name = params.name || '';
    var email = params.email || '';
    var phone = params.phone || '';
    var subject = params.subject || '';
    var message = params.message || '';
    
    sheet.appendRow([timestamp, name, email, phone, subject, message]);
    
    return jsonResponse({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
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

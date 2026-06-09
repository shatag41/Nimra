/**
 * NIMRA Google Sheets Setup Script
 * ─────────────────────────────────
 * Run this ONCE from the Apps Script editor to:
 *   1. Create all required sheet tabs
 *   2. Add headers and sample NIMRA data
 *
 * How to run:
 *   1. Open your Google Sheet → Extensions → Apps Script
 *   2. Paste this entire file (or just this function) alongside apps-script.js
 *   3. Select "setupNIMRASheets" from the function dropdown
 *   4. Click ▶ Run
 */

function setupNIMRASheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 1. BANNERS ────────────────────────────────────────────────────────────
  var bannersSheet = getOrCreateSheet(ss, 'Banners');
  bannersSheet.clearContents();
  bannersSheet.getRange(1, 1, 1, 7).setValues([
    ['ID', 'Title', 'Subtitle', 'ImageUrl', 'ButtonText', 'ButtonLink', 'Active']
  ]);
  bannersSheet.getRange(2, 1, 2, 7).setValues([
    [1, 'Pure Hydration. Healthy Living.',
      'NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.',
      'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1200',
      'Explore Products', '#products', true],
    [2, 'Mineral Balanced Purity',
      'Sourced responsibly and purified through a rigorous 10-step process for absolute safety.',
      'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&q=80&w=1200',
      'Our Quality Standards', '/quality', true]
  ]);
  Logger.log('✅ Banners sheet set up.');

  // ── 2. PRODUCTS ───────────────────────────────────────────────────────────
  var productsSheet = getOrCreateSheet(ss, 'Products');
  productsSheet.clearContents();
  productsSheet.getRange(1, 1, 1, 8).setValues([
    ['ID', 'Name', 'Category', 'Volume', 'Price', 'Description', 'ImageUrl', 'Active']
  ]);
  productsSheet.getRange(2, 1, 5, 8).setValues([
    [1, 'NIMRA 250ml Bottle', 'Packaged Water', '250ml', '6.00',
      'Perfect pocket-sized pure drinking water for short trips, conferences, and quick refreshments.',
      'https://images.unsplash.com/photo-1616166330003-8e550d199b26?auto=format&fit=crop&q=80&w=600', true],
    [2, 'NIMRA 500ml Bottle', 'Packaged Water', '500ml', '10.00',
      'Your convenient hydration companion for daily commutes, gyms, and office desks.',
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=600', true],
    [3, 'NIMRA 1 Litre Bottle', 'Packaged Water', '1L', '20.00',
      'Standard 1 Litre bottle for absolute pure hydration at home, dining, or long travel.',
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600', true],
    [4, 'NIMRA 2 Litre Bottle', 'Packaged Water', '2L', '30.00',
      'Bigger size for family picnics and long journeys. Keep clean water accessible for all.',
      'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&q=80&w=600', true],
    [5, 'NIMRA 20 Litre Dispenser Jar', 'Packaged Water', '20L', '80.00',
      'Eco-friendly bulk jar for continuous hydration at office spaces and household kitchen units.',
      'https://images.unsplash.com/photo-1589135790587-8d77d70cfd00?auto=format&fit=crop&q=80&w=600', true]
  ]);
  Logger.log('✅ Products sheet set up.');

  // ── 3. FAQs ───────────────────────────────────────────────────────────────
  var faqsSheet = getOrCreateSheet(ss, 'FAQs');
  faqsSheet.clearContents();
  faqsSheet.getRange(1, 1, 1, 4).setValues([
  ['ID', 'Question', 'Answer', 'Active']
]);
  faqsSheet.getRange(2, 1, 4, 4).setValues([
    [1, 'What makes NIMRA Packaged Drinking Water pure?',
      'NIMRA water goes through an advanced 10-step purification process, including sand filtration, carbon filtration, reverse osmosis (RO), mineral enrichment, and final UV & Ozonation sterilization.',
      true],
    [2, 'Where is NIMRA water manufactured?',
      'NIMRA water is manufactured at our state-of-the-art packaging plant located at SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali - 413801.',
      true],
    [3, 'Can I place bulk orders for corporate events or weddings?',
      'Yes! We specialize in bulk corporate orders. Contact us at +91 8888378411 to arrange scheduled deliveries.',
      true],
    [4, 'Is there a delivery fee for corporate jars?',
      'Delivery charges vary based on distance and quantity. We offer free shipping on minimum bulk orders for Camp (Pune) and Daund regions.',
      true]
  ]);
  Logger.log('✅ FAQs sheet set up.');

  // ── 4. COMPANY INFO ───────────────────────────────────────────────────────
  var infoSheet = getOrCreateSheet(ss, 'CompanyInfo');
  infoSheet.clearContents();
  infoSheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
  infoSheet.getRange(2, 1, 9, 2).setValues([
    ['BrandName', 'NIMRA'],
    ['Phone', '+91 8888378411'],
    ['Email', 'tsenterprises.nat@gmail.com'],
    ['OfficeAddress', '#10, Gulistan Building, K.B. Hidayatullah Road, Camp, Pune – 411001'],
    ['PlantAddress', 'SR No. 83/1/3/4/2, Near Jagtap Vasti, Daund, Pune, Lingali – 413801'],
    ['WhatsAppNumber', '918888378411'],
    ['AboutStory', 'At NIMRA, we believe that pure drinking water is the cornerstone of robust health and energetic living. Founded under T.S. Enterprises, NIMRA has committed itself to raising the standard of hydration.'],
    ['QualityText', 'Quality is not just a checklist at NIMRA; it is our philosophy. Our state-of-the-art testing labs run strict controls every hour.'],
    ['InfrastructureText', 'Our Daund (Lingali) manufacturing plant represents the pinnacle of modern beverage packaging technology, featuring fully automated bottle blow-moulding and touch-free filling lines.']
  ]);
  Logger.log('✅ CompanyInfo sheet set up.');

  // ── 5. INQUIRIES (empty, just headers) ───────────────────────────────────
  var inquiriesSheet = getOrCreateSheet(ss, 'Inquiries');
  if (inquiriesSheet.getLastRow() === 0) {
    inquiriesSheet.getRange(1, 1, 1, 6).setValues([
      ['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message']
    ]);
    Logger.log('✅ Inquiries sheet set up.');
  } else {
    Logger.log('ℹ️  Inquiries sheet already has data, skipping headers.');
  }

  SpreadsheetApp.getUi().alert('✅ NIMRA Sheets setup complete!\n\nAll 5 tabs created with sample data.\nRefresh your website to see live content.');
  Logger.log('🎉 NIMRA Google Sheets setup complete!');
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('Created new sheet: ' + name);
  }
  return sheet;
}

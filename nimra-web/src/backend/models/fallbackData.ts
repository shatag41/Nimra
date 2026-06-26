export const fallbackData: any = {
  banners: [
    { ID: 1, Title: 'Pure Hydration. Healthy Living.', Subtitle: 'NIMRA Packaged Drinking Water keeps you fresh and energized through every moment of the day.', ImageUrl: 'banners/1782400800295-50bba580-d62b-436d-985b-87fd558d5ad8.jpg', ButtonText: 'Explore Products', ButtonLink: '#products', Active: true },
  ],
  products: [
    { ID: 1, Name: 'NIMRA 250ml Bottle', Category: 'Packaged Drinking Water', Volume: '250ml', Price: '6.00', Description: 'Perfect pocket-sized pure drinking water for short trips, conferences, and quick refreshments.', ImageUrl: 'products/1782400801277-e98426f2-832c-43f8-ace7-d39458d03a20.jpg', Active: true },
    { ID: 2, Name: 'NIMRA 500ml Bottle', Category: 'Packaged Drinking Water', Volume: '500ml', Price: '10.00', Description: 'Your convenient hydration companion for daily commutes, gyms, and office desks.', ImageUrl: 'products/1782400801994-3a7d515e-6c24-4cc9-a482-cf2a009ef4b2.jpg', Active: true },
    { ID: 3, Name: 'NIMRA 1 Litre Bottle', Category: 'Packaged Drinking Water', Volume: '1L', Price: '20.00', Description: 'Standard 1 Litre bottle for absolute pure hydration at home, dining, or long travel.', ImageUrl: 'products/1782400802152-3726c4f7-0b51-4d97-a3c3-f66f010b587a.jpg', Active: true },
    { ID: 4, Name: 'NIMRA 2 Litre Bottle', Category: 'Packaged Drinking Water', Volume: '2L', Price: '30.00', Description: 'Bigger size for family picnics and long journeys. Keep clean water accessible for all.', ImageUrl: 'products/1782400802172-f85d909c-fcaa-4e12-8b11-0f44a10b9330.jpg', Active: true },
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
        { productId: '2', name: 'NIMRA 500ml Bottle', category: 'Packaged Drinking Water', volume: '500ml', price: 10, imageUrl: '', quantity: 2 },
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
    { ID: 1, Timestamp: new Date(Date.now() - 3600000).toISOString(), Title: 'Welcome to NIMRA Console', Message: 'Your admin panel is ready!', Read: false, Status: 'Published' },
  ],
};

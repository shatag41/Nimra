export const fallbackData: any = {
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

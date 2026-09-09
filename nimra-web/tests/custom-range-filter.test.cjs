const assert = require('node:assert/strict');
const { test } = require('node:test');

// Test date parsing logic without timezone shift
const parseLocalDate = (dateStr, isEndOfDay = false) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  if (isEndOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const formatDateForInput = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

test('parseLocalDate accurately sets start and end of day in local timezone', () => {
  const start = parseLocalDate('2026-09-01', false);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 8); // September is 8 (0-indexed)
  assert.equal(start.getDate(), 1);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);

  const end = parseLocalDate('2026-09-05', true);
  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 8);
  assert.equal(end.getDate(), 5);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
});

test('formatDateForInput formats date objects into standard YYYY-MM-DD', () => {
  const date = new Date(2026, 8, 9);
  assert.equal(formatDateForInput(date), '2026-09-09');
});

test('filtering orders and metrics dynamically based on custom date range window', () => {
  const mockOrders = [
    { orderId: 'ord-1', total: 1000, status: 'Delivered', createdAt: '2026-09-01T10:00:00' },
    { orderId: 'ord-2', total: 1500, status: 'Delivered', createdAt: '2026-09-03T15:30:00' },
    { orderId: 'ord-3', total: 2000, status: 'Confirmed', createdAt: '2026-09-04T12:00:00' },
    { orderId: 'ord-4', total: 500, status: 'Delivered', createdAt: '2026-09-06T18:00:00' },
    { orderId: 'ord-5', total: 800, status: 'Delivered', createdAt: '2026-08-25T11:00:00' },
  ];

  const filterStart = parseLocalDate('2026-09-01', false);
  const filterEnd = parseLocalDate('2026-09-04', true);

  const filtered = mockOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= filterStart && d <= filterEnd;
  });

  assert.equal(filtered.length, 3);
  assert.deepEqual(filtered.map(o => o.orderId), ['ord-1', 'ord-2', 'ord-3']);

  const delivered = filtered.filter(o => o.status.toLowerCase() === 'delivered');
  const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
  assert.equal(revenue, 2500);
});

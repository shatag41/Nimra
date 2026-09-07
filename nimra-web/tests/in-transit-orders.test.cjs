const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Run the production TypeScript utility without adding a test-runner dependency.
const source = fs.readFileSync(path.join(__dirname, '../src/frontend/admin/utils/filterUtils.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const utility = { exports: {} };
new Function('exports', 'require', 'module', compiled)(utility.exports, require, utility);
const { isInTransitOrder, filterOrders } = utility.exports;
const order = (status, extra = {}) => ({
  orderId: 'order-1', status, createdAt: '2026-09-06T10:00:00.000Z', ...extra,
});
const review = (orders, start = '', exact = '') =>
  filterOrders(orders, '', 'InTransit', 'All', 'latest', start, '', exact);

test('only the four delivery statuses qualify, ignoring casing and surrounding whitespace', () => {
  for (const status of ['Confirmed', 'Processing', 'Dispatched', 'Out for Delivery']) {
    assert.equal(isInTransitOrder(order(`  ${status.toUpperCase()}  `)), true);
  }
  for (const status of ['Pending', 'Delivered', 'Completed', 'Cancelled', 'Cancellation Requested', 'Rejected', 'Returned', 'Refunded', 'Packed', 'In Transit', '', null, undefined]) {
    assert.equal(isInTransitOrder(order(status)), false, String(status));
    assert.equal(isInTransitOrder(order(` ${String(status).toLowerCase()} `)), false);
  }
});

test('cancellation requests block transit even if the order still has an active delivery status', () => {
  for (const cancellationStatus of [' Pending ', 'APPROVED', 'Requested', 'Cancelled', 'unknown']) {
    assert.equal(isInTransitOrder(order('Confirmed', { cancellationStatus })), false);
  }
  // Rejecting cancellation resumes delivery; rejecting the order never does.
  assert.equal(isInTransitOrder(order('Confirmed', { cancellationStatus: ' Rejected ' })), true);
  assert.equal(isInTransitOrder(order('Rejected')), false);
});

test('Overall, Today, Week and Month review results match the count at exact boundaries', () => {
  const now = new Date('2026-09-06T12:34:56.000Z');
  for (const days of [null, 0, 7, 30]) {
    const start = days === null ? null : days === 0
      ? new Date('2026-09-06T00:00:00.000Z')
      : new Date(now.getTime() - days * 86400000);
    const boundary = start || now;
    const orders = [-1, 0, 1].flatMap((offset, i) => ['Confirmed', 'Delivered', 'Completed'].map(status =>
      order(status, { orderId: `${i}-${status}`, createdAt: new Date(boundary.getTime() + offset).toISOString() })));
    const counted = orders.filter(o => (!start || new Date(o.createdAt) >= start) && isInTransitOrder(o));
    const listed = review(orders, start?.toISOString().slice(0, 10), start?.toISOString());
    assert.deepEqual(listed.map(o => o.orderId).sort(), counted.map(o => o.orderId).sort());
    assert.equal(listed.length, days === null ? 3 : 2);
  }
});

test('updated order state immediately removes final statuses from both derived views', () => {
  const orders = [order('Confirmed'), order('Processing', { orderId: 'order-2' })];
  assert.equal(review(orders).length, 2);
  for (const status of [' delivered ', 'Completed', 'Cancelled', 'Rejected']) {
    const updated = orders.map(o => o.orderId === 'order-1' ? { ...o, status } : o);
    assert.equal(updated.filter(isInTransitOrder).length, 1);
    assert.deepEqual(review(updated).map(o => o.orderId), ['order-2']);
  }
  assert.equal(filterOrders(orders, '', 'All', 'All', 'latest', '', '').length, 2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { listPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from '../src/services/purchaseOrders.js';

test('Purchase Order CRUD is scoped to the Dry Dock and supports the expense category fields', async () => {
  const originalFetch = globalThis.fetch;
  const received = [];
  globalThis.fetch = async (url, options = {}) => {
    received.push({ url, options });
    return new Response(options.method === 'DELETE' ? null : JSON.stringify({ data: {} }), { status: options.method === 'POST' ? 201 : options.method === 'DELETE' ? 204 : 200 });
  };
  try {
    await listPurchaseOrders(7);
    await createPurchaseOrder(7, { poNo: 'PO-1', expenseCategory: 'Materials' });
    await updatePurchaseOrder(11, { expenseCategory: 'Services' });
    await deletePurchaseOrder(11);
    assert.deepEqual(received.map(({ url, options }) => [url, options.method || 'GET']), [
      ['/api/v1/dry-docks/7/purchase-orders', 'GET'],
      ['/api/v1/dry-docks/7/purchase-orders', 'POST'],
      ['/api/v1/purchase-orders/11', 'PATCH'], ['/api/v1/purchase-orders/11', 'DELETE']
    ]);
    assert.equal(JSON.parse(received[1].options.body).expenseCategory, 'Materials');
  } finally { globalThis.fetch = originalFetch; }
});

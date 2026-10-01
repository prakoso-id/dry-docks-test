import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listRfqs, createRfq, updateRfq, deleteRfq, listInvitations, createInvitation,
  updateInvitation, deleteInvitation, listQuotations, createQuotation,
  updateQuotation, deleteQuotation, compareQuotes
} from '../src/services/sourcing.js';

test('sourcing CRUD uses the dock, invitation, and quotation API collections', async () => {
  const originalFetch = globalThis.fetch;
  const received = [];
  globalThis.fetch = async (url, options = {}) => {
    received.push({ url, options });
    return new Response(options.method === 'DELETE' ? null : JSON.stringify({ data: [] }), { status: options.method === 'POST' ? 201 : options.method === 'DELETE' ? 204 : 200 });
  };
  try {
    await listRfqs(7);
    await createRfq(7, { rfqNo: 'RFQ-1' });
    await updateRfq(8, { status: 'OPEN' });
    await deleteRfq(8);
    await listInvitations(8);
    await createInvitation(8, { shipyardId: 2 });
    await updateInvitation(9, { status: 'SENT' });
    await deleteInvitation(9);
    await listQuotations(9);
    await createQuotation(9, { currency: 'USD' });
    await updateQuotation(10, { totalCost: 25 });
    await deleteQuotation(10);
    await compareQuotes(7, 8);
    assert.deepEqual(received.map(({ url, options }) => [url, options.method || 'GET']), [
      ['/api/v1/dry-docks/7/rfqs', 'GET'], ['/api/v1/dry-docks/7/rfqs', 'POST'],
      ['/api/v1/rfqs/8', 'PATCH'], ['/api/v1/rfqs/8', 'DELETE'],
      ['/api/v1/rfqs/8/invitations', 'GET'], ['/api/v1/rfqs/8/invitations', 'POST'],
      ['/api/v1/rfq-invitations/9', 'PATCH'], ['/api/v1/rfq-invitations/9', 'DELETE'],
      ['/api/v1/rfq-invitations/9/quotations', 'GET'], ['/api/v1/rfq-invitations/9/quotations', 'POST'],
      ['/api/v1/quotations/10', 'PATCH'], ['/api/v1/quotations/10', 'DELETE'],
      ['/api/v1/dry-docks/7/quotation-comparison?rfqId=8', 'GET']
    ]);
    assert.equal(JSON.parse(received[1].options.body).rfqNo, 'RFQ-1');
  } finally { globalThis.fetch = originalFetch; }
});

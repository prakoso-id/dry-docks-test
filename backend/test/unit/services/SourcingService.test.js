import test from 'node:test';
import assert from 'node:assert/strict';
import { SourcingService } from '../../../src/services/SourcingService.js';

function createService(overrides = {}) {
  const calls = [];
  const repository = {
    dockExists: async () => true,
    listRfqsForDock: async () => [],
    createRfq: async (dockId, input) => { calls.push(['createRfq', dockId, input]); return { id: 2, dryDockId: dockId, ...input }; },
    findRfqById: async (id) => ({ id, dryDockId: 10, rfqNo: 'RFQ-1', requestDate: '2026-02-01', expiryDate: '2026-02-10' }),
    updateRfq: async (id, changes) => ({ id, ...changes }),
    hasRfqDependents: async () => false,
    deleteRfq: async () => true,
    shipyardExists: async () => true,
    createInvitation: async (rfqId, input) => ({ id: 3, rfqId, ...input }),
    findInvitationById: async (id) => ({ id, rfqId: 2, shipyardId: 1 }),
    updateInvitation: async (id, changes) => ({ id, ...changes }),
    hasInvitationQuotations: async () => false,
    deleteInvitation: async () => true,
    createQuotation: async (rfqInvitationId, input) => ({ id: 4, rfqInvitationId, ...input }),
    findQuotationById: async (id) => ({ id, rfqInvitationId: 3 }),
    updateQuotation: async (id, changes) => ({ id, ...changes }),
    deleteQuotation: async () => true,
    listQuotesForRfq: async () => [
      { id: 7, currency: 'USD', totalCost: '120.00', shipyardName: 'North Yard' },
      { id: 8, currency: 'EUR', totalCost: '100.00', shipyardName: 'East Yard' }
    ],
    ...overrides
  };
  return { service: new SourcingService({ repository }), calls };
}

test('creates and lists RFQs under a Dry Dock', async () => {
  const { service, calls } = createService();
  const rfq = await service.createRfq(10, { rfqNo: 'RFQ-1' });
  assert.equal(rfq.dryDockId, 10);
  await service.listRfqs(10);
  assert.equal(calls[0][0], 'createRfq');
});

test('returns a conflict for duplicate RFQ numbers', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
  const { service } = createService({ createRfq: async () => { throw duplicate; } });
  await assert.rejects(service.createRfq(10, { rfqNo: 'RFQ-1' }), { statusCode: 409, code: 'CONFLICT' });
});

test('rejects deleting an RFQ with invitation or Purchase Order dependencies', async () => {
  const { service } = createService({ hasRfqDependents: async () => true });
  await assert.rejects(service.deleteRfq(2), { statusCode: 409, code: 'CONFLICT' });
});

test('validates parent records before creating invitations and quotations', async () => {
  const missing = createService({ findRfqById: async () => null });
  await assert.rejects(missing.service.createInvitation(404, { shipyardId: 1 }), { statusCode: 404, code: 'NOT_FOUND' });

  const service = createService();
  const invitation = await service.service.createInvitation(2, { shipyardId: 1 });
  const quote = await service.service.createQuotation(invitation.id, { currency: 'USD', totalCost: 1 });
  assert.equal(quote.rfqInvitationId, invitation.id);
});

test('rejects deleting invitations that have quotations', async () => {
  const { service } = createService({ hasInvitationQuotations: async () => true });
  await assert.rejects(service.deleteInvitation(3), { statusCode: 409, code: 'CONFLICT' });
});

test('keeps quote comparisons grouped by currency', async () => {
  const { service } = createService();
  const result = await service.compareQuotes(10, 2);
  assert.deepEqual(result.currencies.map(({ currency, quotes }) => [currency, quotes.length]), [['USD', 1], ['EUR', 1]]);
});

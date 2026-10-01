import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../src/app.js';

function createTestApp(masterDataRepository = {}, dryDockRepository = {}, reportRepository = {}, sourcingRepository = {}, purchaseOrderRepository = {}, costRepository = {}, workOrderImageStorage = {}, workOrderRepository = {}) {
  return createApp({
    dryDockRepository,
    workOrderRepository,
    costRepository,
    workOrderImageStorage,
    taskRepository: {},
    dryDockFactRepository: {},
    reportRepository,
    sourcingRepository,
    purchaseOrderRepository,
    masterDataRepository,
    database: { ping: async () => {} }
  });
}

async function withServer(run, masterDataRepository, dryDockRepository, reportRepository, sourcingRepository, purchaseOrderRepository, costRepository, workOrderImageStorage, workOrderRepository) {
  const server = createTestApp(masterDataRepository, dryDockRepository, reportRepository, sourcingRepository, purchaseOrderRepository, costRepository, workOrderImageStorage, workOrderRepository).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('health endpoint responds without exposing Express headers', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health/live`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.equal(response.headers.get('x-powered-by'), null);
  });
});

test('invalid create request returns structured validation error', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.error.details));
  });
});

test('cost summary route returns the standard data envelope', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks/10/cost-summary`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: {
      budget: '0.00', costBudget: '0.00', currency: 'USD', yardEstimates: '0.00', ownerEstimates: '0.00',
      totalEstimates: '0.00', actualYardCosts: '0.00', actualOwnerCosts: '0.00',
      totalCosts: '0.00', variance: '0.00'
    } });
  }, {}, {
    findById: async () => ({ id: 10 }),
    findCostSummaryInput: async () => ({ budget: '0.00', currency: 'USD', costs: [] })
  });
});

test('creates Cost records through the Dry Dock collection', async () => {
  let created;
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks/10/costs`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobName: 'Pump overhaul', yardEstimate: 120, ownerEstimate: 20, actualYardCost: 15 })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.jobName, 'Pump overhaul');
  }, {}, {}, {}, {}, {}, {
    dockExists: async () => true,
    createForDock: async (id, values) => { created = { id: 4, dryDockId: id, ...values }; return created; }
  });
  assert.equal(created.yardEstimate, 120);
});

test('copies Yard Estimates into Actual Yard Costs for the selected dock', async () => {
  let copiedDockId;
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks/10/costs/copy-yard-estimates-to-actual`, { method: 'POST' });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { updatedCount: 3 });
  }, {}, {}, {}, {}, {}, {
    dockExists: async () => true,
    copyYardEstimatesToActual: async (id) => { copiedDockId = id; return 3; }
  });
  assert.equal(copiedDockId, 10);
});

test('uploads a Work Order image through the binary attachment route', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/work-orders/8/attachments`, {
      method: 'POST', headers: { 'content-type': 'image/png', 'x-file-name': 'pump.png' }, body: Buffer.from('png-data')
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.fileName, 'pump.png');
  }, {}, {}, {}, {}, {}, {}, {
    save: async ({ fileName }) => ({ fileName, storageKey: 'safe.png' }),
    remove: async () => {}
  }, {
    findById: async () => ({ id: 8 }),
    addAttachment: async (_id, values) => ({ id: 1, ...values })
  });
});

test('report create returns 201 and rejects unsupported report types', async () => {
  const reports = [];
  await withServer(async (baseUrl) => {
    const valid = await fetch(`${baseUrl}/api/v1/dry-docks/10/reports`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Daily status', reportDate: '2026-02-02', reportType: 'Daily' })
    });
    assert.equal(valid.status, 201);
    assert.deepEqual((await valid.json()).data, { id: 1, dryDockId: 10, title: 'Daily status', reportDate: '2026-02-02', reportType: 'Daily' });

    const invalid = await fetch(`${baseUrl}/api/v1/dry-docks/10/reports`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Invalid', reportDate: '2026-02-02', reportType: 'Variation' })
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, 'VALIDATION_ERROR');
  }, {}, {}, {
    dockExists: async () => true,
    createForDock: async (dryDockId, input) => { reports.push(input); return { id: 1, dryDockId, ...input }; }
  });
  assert.equal(reports.length, 1);
});

test('creates a Shipyard through the master-data API', async () => {
  let created;
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/shipyards`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'North Yard', city: 'Jakarta', contactPerson: 'Ayu' })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.name, 'North Yard');
  }, {
    createShipyard: async (input) => { created = input; return { id: 5, ...input }; }
  });
  assert.deepEqual(created, { name: 'North Yard', city: 'Jakarta', contactPerson: 'Ayu' });
});

test('creates an RFQ with the standard data envelope', async () => {
  let saved;
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks/10/rfqs`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rfqNo: 'RFQ-10', requestDate: '2026-02-01', expiryDate: '2026-02-10' })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.rfqNo, 'RFQ-10');
  }, {}, {}, {}, {
    dockExists: async () => true,
    createRfq: async (dryDockId, input) => { saved = { dryDockId, input }; return { id: 2, dryDockId, ...input }; }
  });
  assert.equal(saved.dryDockId, 10);
});

test('creates a Purchase Order through its dock collection route', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/dry-docks/10/purchase-orders`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipyardId: 1, poNo: 'PO-10', currency: 'USD', totalCost: 12.5 })
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.poNo, 'PO-10');
  }, {}, {}, {}, {}, {
    dockExists: async () => true,
    shipyardExists: async () => true,
    createForDock: async (dryDockId, input) => ({ id: 6, dryDockId, ...input })
  });
});

test('creates required Vessel and Specification Group lookup records', async () => {
  const calls = [];
  const repository = {
    createVessel: async (input) => { calls.push(['vessel', input]); return { id: 3, ...input }; },
    createSpecificationGroup: async (input) => { calls.push(['specificationGroup', input]); return { id: 4, ...input }; }
  };

  await withServer(async (baseUrl) => {
    const vesselResponse = await fetch(`${baseUrl}/api/v1/vessels`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Test Vessel' })
    });
    const groupResponse = await fetch(`${baseUrl}/api/v1/specification-groups`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ vesselId: 3, groupNo: '01', name: 'Main Engine' })
    });

    assert.equal(vesselResponse.status, 201);
    assert.equal(groupResponse.status, 201);
    assert.deepEqual(calls, [
      ['vessel', { name: 'Test Vessel' }],
      ['specificationGroup', { vesselId: 3, groupNo: '01', name: 'Main Engine' }]
    ]);
  }, repository);
});

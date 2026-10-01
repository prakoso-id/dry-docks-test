import test from 'node:test';
import assert from 'node:assert/strict';
import { createReport, updateReport } from '../src/services/reports.js';

test('creates Daily and Completion reports with the selected report type', async () => {
  const originalFetch = globalThis.fetch;
  const received = [];
  globalThis.fetch = async (url, options = {}) => {
    received.push({ url, options });
    return new Response(JSON.stringify({ data: { id: received.length } }), { status: 201 });
  };

  try {
    await createReport(10, { title: 'Daily log', reportType: 'Daily' });
    await createReport(10, { title: 'Completion', reportType: 'Completion' });
    assert.equal(received[0].url, '/api/v1/dry-docks/10/reports');
    assert.equal(received[0].options.method, 'POST');
    assert.equal(JSON.parse(received[1].options.body).reportType, 'Completion');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('updates reports with PATCH', async () => {
  const originalFetch = globalThis.fetch;
  let received;
  globalThis.fetch = async (url, options = {}) => {
    received = { url, options };
    return new Response(JSON.stringify({ data: { id: 22 } }), { status: 200 });
  };

  try {
    await updateReport(22, { title: 'Updated report' });
    assert.equal(received.url, '/api/v1/reports/22');
    assert.equal(received.options.method, 'PATCH');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

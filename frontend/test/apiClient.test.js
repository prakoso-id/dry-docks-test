import test from 'node:test';
import assert from 'node:assert/strict';
import { request, ApiError } from '../src/services/apiClient.js';

test('returns JSON for a successful request and sends JSON bodies', async () => {
  const originalFetch = globalThis.fetch;
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return new Response(JSON.stringify({ data: { id: 1 } }), { status: 201 });
  };

  try {
    const result = await request('dry-docks', { method: 'POST', body: { dockNo: 'DD-1' } });
    assert.deepEqual(result, { data: { id: 1 } });
    assert.equal(received.url, '/api/v1/dry-docks');
    assert.equal(received.options.headers['content-type'], 'application/json');
    assert.equal(received.options.body, JSON.stringify({ dockNo: 'DD-1' }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('preserves status, code, and validation details for API errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: [{ field: 'dockNo', message: 'Required' }] }
  }), { status: 400 });

  try {
    await assert.rejects(request('dry-docks', { method: 'POST', body: {} }), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.deepEqual(error.details, [{ field: 'dockNo', message: 'Required' }]);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

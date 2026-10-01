import test from 'node:test';
import assert from 'node:assert/strict';
import { CostRepository } from '../../../src/repositories/CostRepository.js';

test('binds the dock id and every source Cost field on insert', async () => {
  const calls = [];
  const pool = { execute: async (sql, values) => {
    calls.push({ sql, values });
    return sql.startsWith('INSERT INTO') ? [{ insertId: 9 }] : [[{ id: 9, jobName: 'Pump' }]];
  } };
  await new CostRepository({ pool }).createForDock(10, { jobName: 'Pump', yardEstimate: 12 });

  const insert = calls[0];
  assert.equal((insert.sql.match(/\?/g) ?? []).length, insert.values.length);
  assert.equal(insert.values[0], 10);
});

test('copies Work Order estimates into Cost items with an idempotent upsert', async () => {
  const calls = [];
  const pool = { execute: async (sql, values) => {
    calls.push({ sql, values });
    return sql.startsWith('SELECT COUNT(*)') ? [[{ total: 2 }]] : [{ affectedRows: 4 }];
  } };
  const count = await new CostRepository({ pool }).copyYardEstimatesToActual(10);

  assert.equal(count, 2);
  assert.deepEqual(calls[1].values, [10]);
  assert.match(calls[1].sql, /FROM work_order wo WHERE wo\.dry_dock_id = \?/);
  assert.match(calls[1].sql, /ON DUPLICATE KEY UPDATE/);
  assert.match(calls[1].sql, /actual_yard_cost = COALESCE\(dry_dock_cost\.actual_yard_cost/);
});

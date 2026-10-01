import test from 'node:test';
import assert from 'node:assert/strict';
import { reportCreateSchema, reportUpdateSchema } from '../../../src/validators/reportSchemas.js';

test('accepts the source-informed report fields and nullable details', () => {
  const result = reportCreateSchema.safeParse({
    title: 'Daily update', reportDate: '2026-02-02', reportType: 'Daily',
    lastUpdatedBy: null, updatedText: 'Work continued', extraNote: null, action: null
  });

  assert.equal(result.success, true);
});

test('rejects malformed dates, unsupported types, and unknown fields', () => {
  assert.equal(reportCreateSchema.safeParse({ title: 'x', reportDate: '2026-13-40', reportType: 'Daily' }).success, false);
  assert.equal(reportCreateSchema.safeParse({ title: 'x', reportDate: '2026-02-02', reportType: 'Variation' }).success, false);
  assert.equal(reportCreateSchema.safeParse({ title: 'x', reportDate: '2026-02-02', reportType: 'Daily', opaque: 1 }).success, false);
  assert.equal(reportUpdateSchema.safeParse({ unknown: true }).success, false);
});

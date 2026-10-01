import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyReport } from '../../../src/models/DailyReport.js';

test('requires report title, date, and supported type', () => {
  assert.throws(() => new DailyReport({ title: ' ', reportDate: '2026-02-02', reportType: 'Daily' }).assertValid(), { code: 'VALIDATION_ERROR' });
  assert.throws(() => new DailyReport({ title: 'Report', reportDate: '2026-02-02', reportType: 'Other' }).assertValid(), { code: 'VALIDATION_ERROR' });
});

test('accepts null optional report details', () => {
  const record = new DailyReport({ title: 'Daily status', reportDate: '2026-02-02', reportType: 'Daily', updatedText: null, extraNote: null, lastUpdatedBy: null, action: null }).assertValid().toRecord();

  assert.equal(record.title, 'Daily status');
  assert.equal(record.extraNote, null);
});

test('rejects an impossible calendar date', () => {
  assert.throws(() => new DailyReport({ title: 'Report', reportDate: '2026-02-30', reportType: 'Completion' }).assertValid(), { code: 'VALIDATION_ERROR' });
});

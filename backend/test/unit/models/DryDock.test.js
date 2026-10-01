import test from 'node:test';
import assert from 'node:assert/strict';
import { DryDock } from '../../../src/models/DryDock.js';

test('rejects planned end before planned start', () => {
  const dock = new DryDock({
    plannedStart: '2026-10-12',
    plannedEnd: '2026-10-11'
  });

  assert.throws(() => dock.assertValid(), { code: 'VALIDATION_ERROR' });
});

test('rejects negative budget', () => {
  const dock = new DryDock({ budget: -0.01 });

  assert.throws(() => dock.assertValid(), { code: 'VALIDATION_ERROR' });
});

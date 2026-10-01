import test from 'node:test';
import assert from 'node:assert/strict';
import { DryDockFactService } from '../../../src/services/DryDockFactService.js';

test('allows repeated activity labels on the same dock', async () => {
  const entries = [];
  const repository = {
    dockExists: async () => true,
    createForDock: async (_dockId, fact) => {
      entries.push(fact);
      return { id: entries.length, ...fact };
    }
  };
  const service = new DryDockFactService({ repository });

  await service.createForDock(10, { activity: 'Dock Master Onboard' });
  await service.createForDock(10, { activity: 'Dock Master Onboard' });

  assert.equal(entries.length, 2);
});

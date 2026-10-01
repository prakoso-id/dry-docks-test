import test from 'node:test';
import assert from 'node:assert/strict';
import { dryDockTabs } from '../src/views/dryDockTabs.js';

test('defines all nine detail sections with a separate Dry Dock Facts tab', () => {
  assert.deepEqual(dryDockTabs, [
    'General', 'Specifications', 'Tasks', 'Sourcing', 'Execution', 'Reporting', 'Costs', 'Purchase Orders', 'Dry Dock Facts'
  ]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { taskCreateSchema } from '../../../src/validators/workItemSchemas.js';
import { TaskService } from '../../../src/services/TaskService.js';

test('requires a task title and due date', () => {
  const result = taskCreateSchema.safeParse({ description: 'Check equipment' });

  assert.equal(result.success, false);
});

test('creates a dock-owned task without querying a work order', async () => {
  let created;
  const repository = {
    dockExists: async () => true,
    createForDock: async (dockId, input) => { created = { dockId, input }; return created; }
  };
  const service = new TaskService({ repository });

  const result = await service.createForDock(10, { title: 'Inspect pump', dueDate: '2026-11-02' });

  assert.deepEqual(result, { dockId: 10, input: { title: 'Inspect pump', dueDate: '2026-11-02', status: 'Open' } });
});

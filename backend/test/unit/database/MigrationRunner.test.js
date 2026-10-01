import test from 'node:test';
import assert from 'node:assert/strict';
import { MigrationRunner } from '../../../src/database/MigrationRunner.js';

function fakeConnection(applied = []) {
  const statements = [];
  return {
    statements,
    async query(sql, values = []) {
      statements.push({ sql, values });
      if (sql.startsWith('SELECT name')) return [[...applied].map((name) => ({ name }))];
      if (sql.startsWith('INSERT INTO schema_migration')) applied.push(values[0]);
      return [[]];
    }
  };
}

test('applies and records pending migrations in order, skipping applied migrations', async () => {
  const connection = fakeConnection(['001_first']);
  const runner = new MigrationRunner({ connection });

  const result = await runner.migrate([
    { name: '001_first', sql: 'CREATE TABLE first_table (id INT)' },
    { name: '002_second', sql: 'CREATE TABLE second_table (id INT)' }
  ]);

  assert.deepEqual(result, ['002_second']);
  assert.ok(connection.statements.some(({ sql }) => sql === 'CREATE TABLE second_table (id INT)'));
  assert.ok(connection.statements.some(({ sql, values }) => sql.startsWith('INSERT INTO schema_migration') && values[0] === '002_second'));
  assert.equal(connection.statements.some(({ sql }) => sql === 'CREATE TABLE first_table (id INT)'), false);
});

test('does not record a migration when its SQL fails', async () => {
  const connection = fakeConnection();
  connection.query = async (sql, values = []) => {
    connection.statements.push({ sql, values });
    if (sql === 'BROKEN DDL') throw new Error('migration failed');
    if (sql.startsWith('SELECT name')) return [[]];
    return [[]];
  };
  const runner = new MigrationRunner({ connection });

  await assert.rejects(runner.migrate([{ name: '001_broken', sql: 'BROKEN DDL' }]), /migration failed/);
  assert.equal(connection.statements.some(({ sql }) => sql.startsWith('INSERT INTO schema_migration')), false);
});

ALTER TABLE task
  DROP FOREIGN KEY fk_task_work_order,
  DROP INDEX idx_task_work_order,
  DROP COLUMN work_order_id;

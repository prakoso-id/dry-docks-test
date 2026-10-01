ALTER TABLE task
  ADD COLUMN work_order_id BIGINT UNSIGNED NULL AFTER dry_dock_id,
  ADD KEY idx_task_work_order (work_order_id),
  ADD CONSTRAINT fk_task_work_order FOREIGN KEY (work_order_id)
    REFERENCES work_order (id) ON UPDATE CASCADE ON DELETE RESTRICT;

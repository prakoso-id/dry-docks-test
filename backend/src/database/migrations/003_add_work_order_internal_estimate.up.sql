ALTER TABLE work_order
  ADD COLUMN internal_estimate DECIMAL(15,2) NULL AFTER total_budget;

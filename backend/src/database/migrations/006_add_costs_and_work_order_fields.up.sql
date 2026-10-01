ALTER TABLE work_order
  ADD COLUMN account_codes VARCHAR(255) NULL AFTER account_code_id,
  ADD COLUMN total_estimates DECIMAL(15,2)
    GENERATED ALWAYS AS (COALESCE(yard_estimate, 0) + COALESCE(owner_estimate, 0)) STORED
    AFTER owner_estimate;

CREATE TABLE dry_dock_cost (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  work_order_id BIGINT UNSIGNED NULL,
  priority VARCHAR(30) NULL,
  status VARCHAR(30) NULL,
  budget DECIMAL(15,2) NULL,
  item_budget DECIMAL(15,2) NULL,
  total_budget DECIMAL(15,2)
    GENERATED ALWAYS AS (COALESCE(budget, 0) + COALESCE(item_budget, 0)) STORED,
  yard_estimate DECIMAL(15,2) NULL,
  owner_estimate DECIMAL(15,2) NULL,
  total_estimates DECIMAL(15,2)
    GENERATED ALWAYS AS (COALESCE(yard_estimate, 0) + COALESCE(owner_estimate, 0)) STORED,
  actual_yard_cost DECIMAL(15,2) NULL,
  actual_owner_cost DECIMAL(15,2) NULL,
  total_costs DECIMAL(15,2)
    GENERATED ALWAYS AS (COALESCE(actual_yard_cost, 0) + COALESCE(actual_owner_cost, 0)) STORED,
  variance DECIMAL(15,2)
    GENERATED ALWAYS AS (COALESCE(actual_yard_cost, 0) + COALESCE(actual_owner_cost, 0) - COALESCE(yard_estimate, 0) - COALESCE(owner_estimate, 0)) STORED,
  machinery_group VARCHAR(200) NULL,
  machinery VARCHAR(200) NULL,
  job_code VARCHAR(100) NULL,
  job_name VARCHAR(255) NOT NULL,
  job_category VARCHAR(100) NULL,
  specification_group_id BIGINT UNSIGNED NULL,
  sort_order INT NOT NULL DEFAULT 0,
  job_type VARCHAR(100) NULL,
  critical_job VARCHAR(30) NULL,
  internal_job VARCHAR(30) NULL,
  account_codes VARCHAR(255) NULL,
  last_done_date DATE NULL,
  last_done_value DECIMAL(12,2) NULL,
  estimated_hours DECIMAL(10,2) NULL,
  job_description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dry_dock_cost_dock_order (dry_dock_id, sort_order, id),
  KEY idx_dry_dock_cost_spec_group (specification_group_id),
  UNIQUE KEY uq_dry_dock_cost_work_order (work_order_id),
  CONSTRAINT fk_dry_dock_cost_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dry_dock_cost_spec_group FOREIGN KEY (specification_group_id)
    REFERENCES specification_group (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dry_dock_cost_work_order FOREIGN KEY (work_order_id)
    REFERENCES work_order (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

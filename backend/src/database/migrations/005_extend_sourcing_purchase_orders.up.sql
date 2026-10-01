ALTER TABLE rfq
  ADD COLUMN requisition_type VARCHAR(100) NULL AFTER rfq_no,
  ADD COLUMN requisition_date DATE NULL AFTER requisition_type,
  ADD COLUMN requisition_nature VARCHAR(100) NULL AFTER requisition_date,
  ADD COLUMN voyage_number VARCHAR(100) NULL AFTER requisition_nature,
  ADD COLUMN account_code_id BIGINT UNSIGNED NULL AFTER comments,
  ADD COLUMN supply_port VARCHAR(200) NULL AFTER account_code_id,
  ADD COLUMN supply_date DATE NULL AFTER supply_port,
  ADD UNIQUE KEY uq_rfq_dock_number (dry_dock_id, rfq_no),
  ADD KEY idx_rfq_account_code (account_code_id),
  ADD CONSTRAINT fk_rfq_account_code FOREIGN KEY (account_code_id)
    REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE purchase_order
  ADD COLUMN expense_category VARCHAR(100) NULL AFTER po_date,
  ADD COLUMN total_cost_usd DECIMAL(15,2) NULL AFTER total_cost,
  ADD COLUMN account_code_id BIGINT UNSIGNED NULL AFTER total_cost_usd,
  ADD COLUMN supply_port VARCHAR(200) NULL AFTER account_code_id,
  ADD UNIQUE KEY uq_purchase_order_dock_number (dry_dock_id, po_no),
  ADD KEY idx_purchase_order_account_code (account_code_id),
  ADD CONSTRAINT fk_purchase_order_account_code FOREIGN KEY (account_code_id)
    REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE RESTRICT;

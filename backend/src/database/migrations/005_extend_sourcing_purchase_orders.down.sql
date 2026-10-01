ALTER TABLE purchase_order
  DROP FOREIGN KEY fk_purchase_order_account_code,
  DROP INDEX idx_purchase_order_account_code,
  DROP INDEX uq_purchase_order_dock_number,
  DROP COLUMN supply_port,
  DROP COLUMN account_code_id,
  DROP COLUMN total_cost_usd,
  DROP COLUMN expense_category;

ALTER TABLE rfq
  DROP FOREIGN KEY fk_rfq_account_code,
  DROP INDEX idx_rfq_account_code,
  DROP INDEX uq_rfq_dock_number,
  DROP COLUMN supply_date,
  DROP COLUMN supply_port,
  DROP COLUMN account_code_id,
  DROP COLUMN voyage_number,
  DROP COLUMN requisition_nature,
  DROP COLUMN requisition_date,
  DROP COLUMN requisition_type;

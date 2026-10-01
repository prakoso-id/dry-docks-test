DROP TABLE dry_dock_cost;

ALTER TABLE work_order
  DROP COLUMN total_estimates,
  DROP COLUMN account_codes;

-- Destructive rollback: this drops the Dry Docks schema and all rows in it.
DROP TABLE purchase_order;
DROP TABLE quotation;
DROP TABLE rfq_invitation;
DROP TABLE rfq;
DROP TABLE attachment;
DROP TABLE dry_dock_fact;
DROP TABLE work_order_update;
DROP TABLE task;
DROP TABLE work_order;
DROP TABLE dry_dock;
DROP TABLE specification_group;
DROP TABLE account_code;
DROP TABLE app_user;
DROP TABLE shipyard;
DROP TABLE vessel;
DELETE FROM schema_migration WHERE name = '001_create_dry_dock_schema';

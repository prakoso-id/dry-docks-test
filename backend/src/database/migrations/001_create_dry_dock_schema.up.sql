-- Initial schema for the Dry Docks module.
-- Apply once to an empty application database after the database service is healthy.

CREATE TABLE vessel (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vessel_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipyard (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500) NULL,
  contact_person VARCHAR(200) NULL,
  capacity DECIMAL(12,2) NULL,
  rating DECIMAL(5,2) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(254) NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipyard_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(254) NULL,
  photo_url VARCHAR(1000) NULL,
  user_role VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE account_code (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_account_code_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE specification_group (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vessel_id BIGINT UNSIGNED NOT NULL,
  group_no VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  frontpage TINYINT(1) NOT NULL DEFAULT 0,
  image_url VARCHAR(1000) NULL,
  budget_code VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_spec_group_vessel_no (vessel_id, group_no),
  KEY idx_spec_group_vessel (vessel_id),
  CONSTRAINT fk_spec_group_vessel FOREIGN KEY (vessel_id)
    REFERENCES vessel (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dry_dock (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vessel_id BIGINT UNSIGNED NOT NULL,
  dock_no VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  shipyard_id BIGINT UNSIGNED NULL,
  shipyard_details TEXT NULL,
  planned_start DATE NULL,
  planned_end DATE NULL,
  actual_start DATE NULL,
  actual_end DATE NULL,
  completed_date DATE NULL,
  account_code_id BIGINT UNSIGNED NULL,
  company VARCHAR(200) NULL,
  budget DECIMAL(15,2) NULL,
  currency CHAR(3) NOT NULL,
  manager_user_id BIGINT UNSIGNED NULL,
  responsible_rank VARCHAR(100) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Planning',
  priority VARCHAR(30) NOT NULL DEFAULT 'Medium',
  image_url VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dock_vessel_no (vessel_id, dock_no),
  KEY idx_dock_status (status),
  KEY idx_dock_vessel (vessel_id),
  KEY idx_dock_planned_start (planned_start),
  KEY idx_dock_shipyard (shipyard_id),
  KEY idx_dock_account_code (account_code_id),
  KEY idx_dock_manager (manager_user_id),
  CONSTRAINT fk_dock_vessel FOREIGN KEY (vessel_id)
    REFERENCES vessel (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dock_shipyard FOREIGN KEY (shipyard_id)
    REFERENCES shipyard (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dock_account_code FOREIGN KEY (account_code_id)
    REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dock_manager FOREIGN KEY (manager_user_id)
    REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  specification_group_id BIGINT UNSIGNED NOT NULL,
  machinery_group VARCHAR(200) NULL,
  machinery VARCHAR(200) NULL,
  job_code VARCHAR(100) NULL,
  job_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NULL,
  job_category VARCHAR(100) NULL,
  job_type VARCHAR(100) NULL,
  standard_job TINYINT(1) NOT NULL DEFAULT 0,
  critical_job TINYINT(1) NOT NULL DEFAULT 0,
  internal_job TINYINT(1) NOT NULL DEFAULT 0,
  account_code_id BIGINT UNSIGNED NULL,
  last_done_date DATE NULL,
  last_done_value DECIMAL(12,2) NULL,
  estimated_hours DECIMAL(10,2) NULL,
  description TEXT NOT NULL,
  responsible_rank VARCHAR(100) NULL,
  priority VARCHAR(30) NULL,
  status VARCHAR(30) NULL,
  total_budget DECIMAL(15,2) NULL,
  yard_estimate DECIMAL(15,2) NULL,
  owner_estimate DECIMAL(15,2) NULL,
  actual_yard_cost DECIMAL(15,2) NULL,
  actual_owner_cost DECIMAL(15,2) NULL,
  currency CHAR(3) NOT NULL,
  inspection_types TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_order_dock_status (dry_dock_id, status),
  KEY idx_work_order_spec_group (specification_group_id),
  KEY idx_work_order_account_code (account_code_id),
  CONSTRAINT fk_work_order_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_work_order_spec_group FOREIGN KEY (specification_group_id)
    REFERENCES specification_group (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_work_order_account_code FOREIGN KEY (account_code_id)
    REFERENCES account_code (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  work_order_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  assigned_user_id BIGINT UNSIGNED NULL,
  responsible_rank VARCHAR(100) NULL,
  due_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_dock_status_due (dry_dock_id, status, due_date),
  KEY idx_task_work_order (work_order_id),
  KEY idx_task_assigned_user (assigned_user_id),
  CONSTRAINT fk_task_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_task_work_order FOREIGN KEY (work_order_id)
    REFERENCES work_order (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_task_assigned_user FOREIGN KEY (assigned_user_id)
    REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_order_update (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  work_order_id BIGINT UNSIGNED NOT NULL,
  progress DECIMAL(5,2) NULL,
  action_type VARCHAR(100) NULL,
  description TEXT NULL,
  actual_yard_cost DECIMAL(15,2) NULL,
  actual_owner_cost DECIMAL(15,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_order_update_order_time (work_order_id, created_at),
  CONSTRAINT fk_work_order_update_order FOREIGN KEY (work_order_id)
    REFERENCES work_order (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dry_dock_fact (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  activity VARCHAR(200) NOT NULL,
  fact_date DATE NULL,
  fact_time TIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dock_fact_date (dry_dock_id, fact_date),
  CONSTRAINT fk_dock_fact_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attachment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NULL,
  work_order_id BIGINT UNSIGNED NULL,
  task_id BIGINT UNSIGNED NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(150) NULL,
  size_bytes BIGINT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attachment_dock (dry_dock_id),
  KEY idx_attachment_work_order (work_order_id),
  KEY idx_attachment_task (task_id),
  CONSTRAINT chk_attachment_one_owner CHECK (
    (dry_dock_id IS NOT NULL) + (work_order_id IS NOT NULL) + (task_id IS NOT NULL) = 1
  ),
  CONSTRAINT fk_attachment_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_attachment_work_order FOREIGN KEY (work_order_id)
    REFERENCES work_order (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_attachment_task FOREIGN KEY (task_id)
    REFERENCES task (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rfq (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  rfq_no VARCHAR(100) NULL,
  request_date DATE NULL,
  expiry_date DATE NULL,
  status VARCHAR(30) NULL,
  subject VARCHAR(255) NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rfq_dock (dry_dock_id),
  KEY idx_rfq_no (rfq_no),
  CONSTRAINT fk_rfq_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rfq_invitation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_id BIGINT UNSIGNED NOT NULL,
  shipyard_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'NOT SENT',
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rfq_invitation_yard (rfq_id, shipyard_id),
  KEY idx_rfq_invitation_shipyard (shipyard_id),
  CONSTRAINT fk_rfq_invitation_rfq FOREIGN KEY (rfq_id)
    REFERENCES rfq (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rfq_invitation_shipyard FOREIGN KEY (shipyard_id)
    REFERENCES shipyard (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quotation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_invitation_id BIGINT UNSIGNED NOT NULL,
  quote_no VARCHAR(100) NULL,
  quote_date DATE NULL,
  currency CHAR(3) NOT NULL,
  total_cost DECIMAL(15,2) NULL,
  tax DECIMAL(15,2) NULL,
  terms TEXT NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quotation_invitation (rfq_invitation_id),
  CONSTRAINT fk_quotation_invitation FOREIGN KEY (rfq_invitation_id)
    REFERENCES rfq_invitation (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  rfq_id BIGINT UNSIGNED NULL,
  shipyard_id BIGINT UNSIGNED NOT NULL,
  po_no VARCHAR(100) NULL,
  po_date DATE NULL,
  currency CHAR(3) NOT NULL,
  total_cost DECIMAL(15,2) NULL,
  status VARCHAR(30) NULL,
  delivery_date DATE NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_purchase_order_dock (dry_dock_id),
  KEY idx_purchase_order_rfq (rfq_id),
  KEY idx_purchase_order_shipyard (shipyard_id),
  KEY idx_purchase_order_no (po_no),
  CONSTRAINT fk_purchase_order_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_order_rfq FOREIGN KEY (rfq_id)
    REFERENCES rfq (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_order_shipyard FOREIGN KEY (shipyard_id)
    REFERENCES shipyard (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

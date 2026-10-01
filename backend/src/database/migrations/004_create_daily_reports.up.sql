CREATE TABLE daily_report (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dry_dock_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(20) NOT NULL,
  report_date DATE NOT NULL,
  last_updated_by VARCHAR(200) NULL,
  updated_text TEXT NULL,
  extra_note TEXT NULL,
  action VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_daily_report_dock_date (dry_dock_id, report_date),
  CONSTRAINT chk_daily_report_type CHECK (report_type IN ('Daily', 'Completion')),
  CONSTRAINT fk_daily_report_dock FOREIGN KEY (dry_dock_id)
    REFERENCES dry_dock (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  page_path TEXT NOT NULL DEFAULT '/',
  context TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_product_event_created_at
ON product_event(created_at);

CREATE INDEX IF NOT EXISTS idx_product_event_name_created
ON product_event(event_name, created_at);

CREATE TABLE IF NOT EXISTS place_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tour_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  note TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS idx_place_report_status_created
ON place_report(status, created_at);

CREATE INDEX IF NOT EXISTS idx_place_report_tour_id
ON place_report(tour_id);

PRAGMA optimize;

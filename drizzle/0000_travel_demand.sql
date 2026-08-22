CREATE TABLE IF NOT EXISTS travel_demand (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  journey_status TEXT NOT NULL,
  country TEXT NOT NULL,
  interests TEXT NOT NULL,
  contact_type TEXT,
  contact_value TEXT,
  contact_consent INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'es',
  source TEXT NOT NULL DEFAULT 'welcome_funnel'
);

CREATE INDEX IF NOT EXISTS idx_travel_demand_created_at
ON travel_demand(created_at);

CREATE INDEX IF NOT EXISTS idx_travel_demand_country_status
ON travel_demand(country, journey_status);

PRAGMA optimize;

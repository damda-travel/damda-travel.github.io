export const travelDemandSchemaSql = `CREATE TABLE IF NOT EXISTS travel_demand (
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
)`;

export const travelDemandIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_travel_demand_created_at ON travel_demand(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_travel_demand_country_status ON travel_demand(country, journey_status)'
];

export const productEventSchemaSql = `CREATE TABLE IF NOT EXISTS product_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  page_path TEXT NOT NULL DEFAULT '/',
  context TEXT NOT NULL DEFAULT '{}'
)`;

export const productEventIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_product_event_created_at ON product_event(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_product_event_name_created ON product_event(event_name, created_at)'
];

export const placeReportSchemaSql = `CREATE TABLE IF NOT EXISTS place_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tour_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  note TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'open'
)`;

export const placeReportIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_place_report_status_created ON place_report(status, created_at)',
  'CREATE INDEX IF NOT EXISTS idx_place_report_tour_id ON place_report(tour_id)'
];

const JOURNEY_STATUSES = new Set([
  'planning_first',
  'visited_before',
  'planning_return',
  'living_in_korea'
]);

const TRAVEL_INTERESTS = new Set([
  'tradition',
  'food',
  'nature',
  'coast',
  'festival',
  'local',
  'wellness',
  'winter'
]);

let schemaReady;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

async function ensureTravelDemandSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS travel_demand (
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
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_travel_demand_created_at ON travel_demand(created_at)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_travel_demand_country_status ON travel_demand(country, journey_status)')
    ]).catch(error => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

async function saveTravelDemand(request, env) {
  if (!env.DB) return jsonResponse({ ok: false, error: 'database_unavailable' }, 503);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8192) return jsonResponse({ ok: false, error: 'payload_too_large' }, 413);
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonResponse({ ok: false, error: 'invalid_content_type' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  if (cleanText(body.website, 120)) return jsonResponse({ ok: true }, 201);
  if (!Number.isFinite(body.elapsedMs) || body.elapsedMs < 900) {
    return jsonResponse({ ok: false, error: 'invalid_submission' }, 400);
  }

  const journeyStatus = cleanText(body.journeyStatus, 40);
  const country = cleanText(body.country, 80);
  const interests = Array.isArray(body.interests)
    ? [...new Set(body.interests.map(value => cleanText(value, 30)).filter(value => TRAVEL_INTERESTS.has(value)))].slice(0, 3)
    : [];
  const language = body.language === 'ko' ? 'ko' : 'es';
  const contactConsent = body.contactConsent === true;
  const contactType = contactConsent && ['email', 'whatsapp'].includes(body.contactType) ? body.contactType : '';
  const contactValue = contactConsent ? cleanText(body.contactValue, 160) : '';

  if (!JOURNEY_STATUSES.has(journeyStatus) || country.length < 2 || !interests.length) {
    return jsonResponse({ ok: false, error: 'invalid_fields' }, 400);
  }
  if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)) {
    return jsonResponse({ ok: false, error: 'invalid_contact' }, 400);
  }
  if (contactType === 'whatsapp' && !/^[+()\d\s.-]{7,24}$/.test(contactValue)) {
    return jsonResponse({ ok: false, error: 'invalid_contact' }, 400);
  }
  if (contactConsent && (!contactType || !contactValue)) {
    return jsonResponse({ ok: false, error: 'invalid_contact' }, 400);
  }

  await ensureTravelDemandSchema(env.DB);
  await env.DB.prepare(`INSERT INTO travel_demand (
    journey_status, country, interests, contact_type, contact_value,
    contact_consent, language, source
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      journeyStatus,
      country,
      JSON.stringify(interests),
      contactType || null,
      contactValue || null,
      contactConsent ? 1 : 0,
      language,
      'welcome_funnel'
    )
    .run();

  return jsonResponse({ ok: true }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/travel-demand') {
      if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
      try {
        return await saveTravelDemand(request, env);
      } catch (error) {
        console.error('travel_demand_submit_failed', error);
        return jsonResponse({ ok: false, error: 'submit_failed' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

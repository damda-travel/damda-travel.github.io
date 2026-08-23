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

const PRODUCT_EVENTS = new Set([
  'page_view', 'region_select', 'category_select', 'discovery_filter', 'load_more',
  'place_open', 'place_save', 'place_unsave', 'place_share', 'maps_open',
  'funnel_open', 'funnel_step', 'funnel_complete', 'personalized_plan_create',
  'profile_invite_answer', 'damda_pick_open',
  'planner_generate', 'plan_stop_add', 'plan_stop_remove', 'plan_reorder',
  'plan_save', 'plan_share', 'day_route_open', 'shared_plan_open',
  'place_report_open', 'place_report_submit'
]);

const PLACE_REPORT_ISSUES = new Set([
  'photo', 'details', 'location', 'closed', 'translation', 'other'
]);

let schemaReady;

const CORS_ALLOWED_ORIGINS = new Set([
  'https://damda-travel.github.io',
  'https://damda.parkg9832.chatgpt.site'
]);

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  if (!origin || !CORS_ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function isAllowedRequestOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || CORS_ALLOWED_ORIGINS.has(origin);
}

function jsonResponse(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(request ? corsHeaders(request) : {})
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
      db.prepare('CREATE INDEX IF NOT EXISTS idx_travel_demand_country_status ON travel_demand(country, journey_status)'),
      db.prepare(`CREATE TABLE IF NOT EXISTS product_event (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        event_name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'es',
        page_path TEXT NOT NULL DEFAULT '/',
        context TEXT NOT NULL DEFAULT '{}'
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_product_event_created_at ON product_event(created_at)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_product_event_name_created ON product_event(event_name, created_at)'),
      db.prepare(`CREATE TABLE IF NOT EXISTS place_report (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        tour_id TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        note TEXT,
        language TEXT NOT NULL DEFAULT 'es',
        status TEXT NOT NULL DEFAULT 'open'
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_place_report_status_created ON place_report(status, created_at)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_place_report_tour_id ON place_report(tour_id)')
    ]).catch(error => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

async function parseJsonBody(request, maxBytes = 4096) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxBytes) return { error: 'payload_too_large', status: 413 };
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return { error: 'invalid_content_type', status: 415 };
  }
  try {
    return { body: await request.json() };
  } catch {
    return { error: 'invalid_json', status: 400 };
  }
}

async function saveTravelDemand(request, env) {
  const respond = (body, status) => jsonResponse(body, status, request);
  if (!env.DB) return respond({ ok: false, error: 'database_unavailable' }, 503);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8192) return respond({ ok: false, error: 'payload_too_large' }, 413);
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return respond({ ok: false, error: 'invalid_content_type' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return respond({ ok: false, error: 'invalid_json' }, 400);
  }

  if (cleanText(body.website, 120)) return respond({ ok: true }, 201);
  if (!Number.isFinite(body.elapsedMs) || body.elapsedMs < 900) {
    return respond({ ok: false, error: 'invalid_submission' }, 400);
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
    return respond({ ok: false, error: 'invalid_fields' }, 400);
  }
  if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)) {
    return respond({ ok: false, error: 'invalid_contact' }, 400);
  }
  if (contactType === 'whatsapp' && !/^[+()\d\s.-]{7,24}$/.test(contactValue)) {
    return respond({ ok: false, error: 'invalid_contact' }, 400);
  }
  if (contactConsent && (!contactType || !contactValue)) {
    return respond({ ok: false, error: 'invalid_contact' }, 400);
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

  return respond({ ok: true }, 201);
}

async function saveProductEvent(request, env) {
  const respond = (body, status) => jsonResponse(body, status, request);
  if (!env.DB) return respond({ ok: false, error: 'database_unavailable' }, 503);
  const parsed = await parseJsonBody(request);
  if (parsed.error) return respond({ ok: false, error: parsed.error }, parsed.status);

  const body = parsed.body;
  const eventName = cleanText(body.eventName, 50);
  const sessionId = cleanText(body.sessionId, 80);
  const language = body.language === 'ko' ? 'ko' : 'es';
  const pagePath = cleanText(body.pagePath, 180) || '/';
  let context = '{}';
  try {
    context = JSON.stringify(body.context && typeof body.context === 'object' ? body.context : {});
  } catch {
    return respond({ ok: false, error: 'invalid_context' }, 400);
  }
  if (!PRODUCT_EVENTS.has(eventName) || !/^[a-zA-Z0-9_-]{8,80}$/.test(sessionId) || context.length > 1200) {
    return respond({ ok: false, error: 'invalid_fields' }, 400);
  }

  await ensureTravelDemandSchema(env.DB);
  await env.DB.prepare(`INSERT INTO product_event (
    event_name, session_id, language, page_path, context
  ) VALUES (?, ?, ?, ?, ?)`)
    .bind(eventName, sessionId, language, pagePath, context)
    .run();
  return respond({ ok: true }, 201);
}

async function savePlaceReport(request, env) {
  const respond = (body, status) => jsonResponse(body, status, request);
  if (!env.DB) return respond({ ok: false, error: 'database_unavailable' }, 503);
  const parsed = await parseJsonBody(request);
  if (parsed.error) return respond({ ok: false, error: parsed.error }, parsed.status);

  const body = parsed.body;
  const tourId = cleanText(body.tourId, 120);
  const issueType = cleanText(body.issueType, 30);
  const note = cleanText(body.note, 500);
  const language = body.language === 'ko' ? 'ko' : 'es';
  if (tourId.length < 2 || !PLACE_REPORT_ISSUES.has(issueType)) {
    return respond({ ok: false, error: 'invalid_fields' }, 400);
  }

  await ensureTravelDemandSchema(env.DB);
  await env.DB.prepare(`INSERT INTO place_report (
    tour_id, issue_type, note, language, status
  ) VALUES (?, ?, ?, ?, 'open')`)
    .bind(tourId, issueType, note || null, language)
    .run();
  return respond({ ok: true }, 201);
}

function getRouteDistanceKm(origin, destination) {
  const toRadians = value => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat))
    * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createRouteFallback(origin, destination, mode) {
  const directKm = getRouteDistanceKm(origin, destination);
  const distanceKm = directKm * (mode === 'walking' ? 1.18 : 1.28);
  let durationMinutes;
  let costKrw = 0;
  if (mode === 'walking') {
    durationMinutes = distanceKm / 4.5 * 60;
  } else if (mode === 'driving') {
    durationMinutes = distanceKm / (distanceKm > 80 ? 75 : 48) * 60 + 10;
    costKrw = distanceKm * 185 + 3000;
  } else {
    durationMinutes = distanceKm / (distanceKm > 80 ? 72 : 27) * 60 + (distanceKm > 80 ? 28 : 16);
    costKrw = distanceKm > 80 ? 18000 + distanceKm * 35 : 1450 + distanceKm * 115;
  }
  return {
    distanceMeters: Math.round(distanceKm * 1000),
    durationMinutes: Math.max(5, Math.round(durationMinutes / 5) * 5),
    costKrw: mode === 'walking' ? 0 : Math.max(0, Math.round(costKrw / 500) * 500)
  };
}

function validLatLng(value) {
  return value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
    && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
}

async function getRouteEstimate(request, env) {
  const respond = (body, status = 200) => jsonResponse(body, status, request);
  const parsed = await parseJsonBody(request, 2048);
  if (parsed.error) return respond({ ok: false, error: parsed.error }, parsed.status);
  const origin = { lat: Number(parsed.body?.origin?.lat), lng: Number(parsed.body?.origin?.lng) };
  const destination = { lat: Number(parsed.body?.destination?.lat), lng: Number(parsed.body?.destination?.lng) };
  const mode = ['transit', 'driving', 'walking'].includes(parsed.body?.mode) ? parsed.body.mode : 'transit';
  const departureTime = cleanText(parsed.body?.departureTime, 40);
  if (!validLatLng(origin) || !validLatLng(destination)) {
    return respond({ ok: false, error: 'invalid_coordinates' }, 400);
  }

  const fallback = createRouteFallback(origin, destination, mode);
  if (!env.GOOGLE_MAPS_API_KEY) {
    return respond({ ok: true, provider: 'damda_estimate', ...fallback });
  }

  const travelMode = { transit: 'TRANSIT', driving: 'DRIVE', walking: 'WALK' }[mode];
  const routeRequest = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    travelMode,
    languageCode: 'es-419',
    units: 'METRIC'
  };
  if (departureTime && !Number.isNaN(Date.parse(departureTime))) routeRequest.departureTime = departureTime;

  try {
    const routeResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.localizedValues,routes.travelAdvisory.transitFare'
      },
      body: JSON.stringify(routeRequest)
    });
    if (!routeResponse.ok) return respond({ ok: true, provider: 'damda_estimate', ...fallback });
    const routeData = await routeResponse.json();
    const route = routeData.routes?.[0];
    if (!route) return respond({ ok: true, provider: 'damda_estimate', ...fallback });
    const durationSeconds = Number.parseFloat(String(route.duration || '').replace('s', ''));
    const fare = route.travelAdvisory?.transitFare;
    const fareAmount = fare ? Number(fare.units || 0) + Number(fare.nanos || 0) / 1e9 : null;
    return respond({
      ok: true,
      provider: 'google',
      distanceMeters: Number(route.distanceMeters) || fallback.distanceMeters,
      durationMinutes: Number.isFinite(durationSeconds) ? Math.max(1, Math.round(durationSeconds / 60)) : fallback.durationMinutes,
      durationText: route.localizedValues?.duration?.text || '',
      distanceText: route.localizedValues?.distance?.text || '',
      fare: Number.isFinite(fareAmount) ? {
        text: `${fare.currencyCode || ''} ${fareAmount.toLocaleString('en-US')}`.trim(),
        currencyCode: fare.currencyCode || ''
      } : null
    });
  } catch {
    return respond({ ok: true, provider: 'damda_estimate', ...fallback });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiHandlers = {
      '/api/travel-demand': saveTravelDemand,
      '/api/product-event': saveProductEvent,
      '/api/place-report': savePlaceReport,
      '/api/route-estimate': getRouteEstimate
    };
    const handler = apiHandlers[url.pathname];
    if (handler) {
      if (request.method === 'OPTIONS') {
        if (!isAllowedRequestOrigin(request)) {
          return jsonResponse({ ok: false, error: 'origin_not_allowed' }, 403, request);
        }
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }
      if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, request);
      if (!isAllowedRequestOrigin(request)) return jsonResponse({ ok: false, error: 'origin_not_allowed' }, 403, request);
      try {
        return await handler(request, env);
      } catch (error) {
        console.error('damda_api_submit_failed', url.pathname, error);
        return jsonResponse({ ok: false, error: 'submit_failed' }, 500, request);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

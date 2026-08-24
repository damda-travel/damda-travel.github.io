import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const worker = (await import(moduleUrl)).default;

function createEnvironment() {
  const inserts = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              inserts.push({ sql, values });
              return { success: true };
            }
          };
        }
      };
    },
    async batch() {
      return [];
    }
  };
  return {
    env: {
      DB,
      ASSETS: { fetch: () => new Response('asset', { status: 200 }) }
    },
    inserts
  };
}

async function post(path, body, env, origin = 'https://damda-travel.github.io') {
  return worker.fetch(new Request(`https://damda.example${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body)
  }), env);
}

{
  const { env, inserts } = createEnvironment();
  const response = await post('/api/travel-demand', {
    journeyStatus: 'planning_first',
    country: 'México',
    interests: ['tradition', 'food'],
    contactType: 'email',
    contactValue: 'not-consented@example.com',
    contactConsent: false,
    language: 'es',
    website: '',
    elapsedMs: 1200
  }, env);
  assert.equal(response.status, 201);
  assert.match(inserts.at(-1).sql, /INSERT INTO travel_demand/);
  assert.equal(inserts.at(-1).values[3], null, 'contact type must not be stored without consent');
  assert.equal(inserts.at(-1).values[4], null, 'contact value must not be stored without consent');
}

{
  const { env, inserts } = createEnvironment();
  const events = [
    'planner_generate', 'language_change', 'hero_cta', 'mobile_nav_select',
    'funnel_skip', 'funnel_back', 'funnel_validation_error', 'funnel_submit_error',
    'saved_panel_open', 'saved_filter_toggle', 'sort_change', 'filter_reset',
    'planner_preset_select', 'planner_region_toggle', 'planner_regions_toggle',
    'planner_route_mode_open', 'plan_clear'
  ];
  for (const eventName of events) {
    const response = await post('/api/product-event', {
      eventName,
      sessionId: 'test-session-1234',
      language: 'es',
      pagePath: '/',
      context: { source: 'regression' }
    }, env);
    assert.equal(response.status, 201, `${eventName} should be accepted`);
    assert.match(inserts.at(-1).sql, /INSERT INTO product_event/);
  }
}

{
  const { env, inserts } = createEnvironment();
  const response = await post('/api/place-report', {
    tourId: 'jeonju-hanok',
    issueType: 'photo',
    note: 'La foto no corresponde al lugar.',
    language: 'es'
  }, env);
  assert.equal(response.status, 201);
  assert.match(inserts.at(-1).sql, /INSERT INTO place_report/);
}

{
  const { env } = createEnvironment();
  const routeEstimate = await post('/api/route-estimate', {
    origin: { lat: 35.8499, lng: 127.1618 },
    destination: { lat: 35.815, lng: 127.153 },
    mode: 'transit',
    departureTime: '2026-09-01T09:30:00+09:00'
  }, env);
  assert.equal(routeEstimate.status, 200);
  const routeBody = await routeEstimate.json();
  assert.equal(routeBody.provider, 'damda_estimate');
  assert.ok(routeBody.durationMinutes > 0);

  const invalidRoute = await post('/api/route-estimate', {
    origin: { lat: 999, lng: 127 },
    destination: { lat: 35, lng: 127 }
  }, env);
  assert.equal(invalidRoute.status, 400);

  const invalidEvent = await post('/api/product-event', {
    eventName: 'unknown',
    sessionId: 'test-session-1234'
  }, env);
  assert.equal(invalidEvent.status, 400);

  const invalidOrigin = await post('/api/place-report', {
    tourId: 'jeonju-hanok',
    issueType: 'photo'
  }, env, 'https://example.com');
  assert.equal(invalidOrigin.status, 403);
}

console.log('DAMDA server API tests passed');

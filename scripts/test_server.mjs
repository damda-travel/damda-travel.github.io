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
  const response = await post('/api/product-event', {
    eventName: 'planner_generate',
    sessionId: 'test-session-1234',
    language: 'es',
    pagePath: '/',
    context: { days: 2, stops: 6 }
  }, env);
  assert.equal(response.status, 201);
  assert.match(inserts.at(-1).sql, /INSERT INTO product_event/);
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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteUrl = 'https://damda-travel.github.io/';
const instagramUrl = 'https://www.instagram.com/damda_ktravel/';
const youtubeUrl = 'https://www.youtube.com/@damda_ktravel';

const [html, robots, sitemap] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../sitemap.xml', import.meta.url), 'utf8')
]);

assert.match(html, /<html lang="es">/);
assert.match(html, /<link rel="canonical" href="https:\/\/damda-travel\.github\.io\/">/);
assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">/);
assert.match(html, /<meta property="og:image:width" content="1200">/);
assert.match(html, /<meta property="og:image:height" content="630">/);
assert.match(html, new RegExp(instagramUrl.replaceAll('/', '\\/')));
assert.match(html, new RegExp(youtubeUrl.replaceAll('/', '\\/')));

const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(jsonLdMatch, 'JSON-LD block is missing');
const jsonLd = JSON.parse(jsonLdMatch[1]);
const organization = jsonLd['@graph'].find((entry) => entry['@type'] === 'Organization');
const website = jsonLd['@graph'].find((entry) => entry['@type'] === 'WebSite');

assert.ok(organization, 'Organization JSON-LD is missing');
assert.ok(website, 'WebSite JSON-LD is missing');
assert.deepEqual(organization.sameAs, [instagramUrl, youtubeUrl]);
assert.equal(website.url, siteUrl);
assert.match(robots, new RegExp(`Sitemap: ${siteUrl}sitemap\\.xml`));
assert.match(sitemap, new RegExp(`<loc>${siteUrl}</loc>`));
assert.match(sitemap, /<lastmod>2026-08-25<\/lastmod>/);

console.log('DAMDA SEO tests passed');

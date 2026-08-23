import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = `${await readFile(new URL('js/tourData.js', root), 'utf8')}\n${await readFile(new URL('js/tourCatalog.js', root), 'utf8')}`;
const context = vm.createContext({ console });
vm.runInContext(`${source}\nglobalThis.__catalog = OFFICIAL_TOUR_CATALOG; globalThis.__regions = JEONBUK_REGIONS;`, context);

assert.equal(context.__catalog.length, 797, 'official catalog item count changed unexpectedly');
assert.ok(context.__catalog.every(tour => !Object.hasOwn(tour, 'overview')), 'long overviews must not return to the initial catalog');

const lazyDetails = {};
for (const regionId of Object.keys(context.__regions)) {
  Object.assign(lazyDetails, JSON.parse(await readFile(new URL(`data/catalog-details/${regionId}.json`, root), 'utf8')));
}

assert.equal(Object.keys(lazyDetails).length, context.__catalog.length, 'every official place needs a lazy detail record');
assert.equal(context.__catalog.find(tour => tour.id === 'official-a-25255')?.regionId, 'gimje');
assert.equal(context.__catalog.find(tour => tour.id === 'official-a-10297')?.regionId, 'imsil');
assert.equal(context.__catalog.find(tour => tour.id === 'official-c-25474')?.regionId, 'gochang');
assert.equal(context.__catalog.find(tour => tour.id === 'official-c-25380')?.regionId, 'jeonju');

const total = Object.values(context.__regions).reduce((sum, region) => sum + region.tours.length, 0);
assert.equal(total, 812, 'combined DAMDA catalog must contain 812 unique places');
console.log('DAMDA client catalog tests passed');

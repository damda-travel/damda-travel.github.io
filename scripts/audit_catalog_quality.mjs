import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const tourDataSource = await readFile(new URL('js/tourData.js', root), 'utf8');
const catalogSource = await readFile(new URL('js/tourCatalog.js', root), 'utf8');
const imageSource = await readFile(new URL('js/tourImages.js', root), 'utf8');
const detailSource = await readFile(new URL('js/tourDetails.js', root), 'utf8');
const appSource = await readFile(new URL('js/app.js', root), 'utf8');

const context = vm.createContext({ console });
vm.runInContext(`${tourDataSource}\n${catalogSource}\n${imageSource}\n${detailSource}\nglobalThis.__regions = JEONBUK_REGIONS;`, context);
const tours = Object.entries(context.__regions).flatMap(([regionId, region]) =>
  region.tours.map(tour => ({ ...tour, regionId }))
);

function objectKeysFromSource(name) {
  const match = appSource.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/^\s*['"]([^'"]+)['"]\s*:/gm)].map(item => item[1]));
}

const spanishNames = objectKeysFromSource('TOUR_NAMES_ES');
const spanishDescriptions = objectKeysFromSource('TOUR_DESCRIPTIONS_ES');
const normalize = value => String(value || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, '');
const duplicateGroups = new Map();
tours.forEach(tour => {
  const key = `${tour.regionId}:${normalize(tour.name)}`;
  if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
  duplicateGroups.get(key).push(tour.id);
});

const report = {
  generatedAt: new Date().toISOString(),
  sourceReviewedAt: '2026-07-24',
  total: tours.length,
  byCategory: Object.fromEntries([...new Set(tours.map(tour => tour.category))].sort().map(category => [
    category,
    tours.filter(tour => tour.category === category).length
  ])),
  completeness: {
    image: tours.filter(tour => tour.image).length,
    sourceUrl: tours.filter(tour => tour.sourceUrl).length,
    address: tours.filter(tour => tour.address).length,
    coordinates: tours.filter(tour => Number.isFinite(Number(tour.lat ?? tour.mapY)) && Number.isFinite(Number(tour.lng ?? tour.mapX))).length,
    overview: tours.filter(tour => tour.overview || tour.desc).length,
    officialHours: tours.filter(tour => tour.hours).length,
    officialFee: tours.filter(tour => tour.fee).length,
    curatedSpanishName: tours.filter(tour => spanishNames.has(tour.id)).length,
    curatedSpanishDescription: tours.filter(tour => spanishDescriptions.has(tour.id)).length
  },
  missing: {
    image: tours.filter(tour => !tour.image).map(tour => tour.id),
    sourceUrl: tours.filter(tour => !tour.sourceUrl).map(tour => tour.id),
    address: tours.filter(tour => !tour.address).map(tour => tour.id),
    coordinates: tours.filter(tour => !Number.isFinite(Number(tour.lat ?? tour.mapY)) || !Number.isFinite(Number(tour.lng ?? tour.mapX))).map(tour => tour.id)
  },
  duplicates: [...duplicateGroups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, ids }))
};

await writeFile(new URL('scripts/catalog_quality_audit.json', root), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Catalog audit: ${report.total} places, ${report.completeness.sourceUrl} sources, ${report.duplicates.length} duplicate groups.`);

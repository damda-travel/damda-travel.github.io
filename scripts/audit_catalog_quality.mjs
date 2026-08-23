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
const catalogDetails = {};
for (const regionId of Object.keys(context.__regions)) {
  try {
    Object.assign(catalogDetails, JSON.parse(await readFile(new URL(`data/catalog-details/${regionId}.json`, root), 'utf8')));
  } catch {
    // Unsplit development catalogs keep their details inline.
  }
}
const resolveCategory = tour => {
  if (tour.category === 'festival' || tour.category === 'food') return tour.category;
  const value = `${tour.name || ''} ${tour.subCategory || ''}`;
  if (/박물관|미술관|문학관|기념관|문화관|전시관|성당|교회|사찰|향교|서원|사당|고택|생가|한옥|읍성|산성|유적|문화|예술|역사/.test(value)) return 'culture';
  if (/국립공원|도립공원|군립공원|자연휴양림|생태|수목원|식물원|동물원|해수욕장|계곡|폭포|호수|저수지|습지|숲|정원|둘레길|산책길|산$|섬$/.test(value)) return 'nature';
  if (/시장|장터|카페|커피|다방|빵|제과|베이커리|음식|식당/.test(value)) return 'food';
  return tour.category;
};
const tours = Object.entries(context.__regions).flatMap(([regionId, region]) =>
  region.tours.map(tour => {
    const mergedTour = { ...tour, ...(catalogDetails[tour.id] || {}), regionId };
    return { ...mergedTour, category: resolveCategory(mergedTour) };
  })
);

function objectKeysFromSource(name) {
  const match = appSource.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/^\s*['"]([^'"]+)['"]\s*:/gm)].map(item => item[1]));
}

const spanishNames = objectKeysFromSource('TOUR_NAMES_ES');
const spanishDescriptions = objectKeysFromSource('TOUR_DESCRIPTIONS_ES');
const regionAddressTokens = {
  jeonju: '전주시', gunsan: '군산시', iksan: '익산시', jeongeup: '정읍시', namwon: '남원시', gimje: '김제시', wanju: '완주군',
  jinan: '진안군', muju: '무주군', jangsu: '장수군', imsil: '임실군', sunchang: '순창군', gochang: '고창군', buan: '부안군'
};
const regionAddressExceptions = new Set(['official-a-25822', 'official-a-25785']);
const regionAddressMismatches = tours.filter(tour => {
  const addressRegionId = Object.entries(regionAddressTokens)
    .find(([, token]) => String(tour.address || '').includes(token))?.[0];
  return addressRegionId && addressRegionId !== tour.regionId && !regionAddressExceptions.has(tour.id);
});
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
    regionAddressConsistent: tours.length - regionAddressMismatches.length,
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
  regionAddressExceptions: [...regionAddressExceptions],
  regionAddressMismatches: regionAddressMismatches.map(tour => tour.id),
  duplicates: [...duplicateGroups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, ids }))
};

await writeFile(new URL('scripts/catalog_quality_audit.json', root), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Catalog audit: ${report.total} places, ${report.completeness.sourceUrl} sources, ${report.duplicates.length} duplicate groups.`);

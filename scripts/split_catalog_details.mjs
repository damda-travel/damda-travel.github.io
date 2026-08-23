import { mkdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const detailDirectory = new URL('data/catalog-details/', root);
const detailFields = new Set(['overview', 'phone', 'homepage', 'hours', 'closed', 'fee', 'parking', 'visitTip']);
const regionAddressTokens = {
  jeonju: '전주시',
  gunsan: '군산시',
  iksan: '익산시',
  jeongeup: '정읍시',
  namwon: '남원시',
  gimje: '김제시',
  wanju: '완주군',
  jinan: '진안군',
  muju: '무주군',
  jangsu: '장수군',
  imsil: '임실군',
  sunchang: '순창군',
  gochang: '고창군',
  buan: '부안군'
};
const regionTagNames = {
  jeonju: '전주', gunsan: '군산', iksan: '익산', jeongeup: '정읍', namwon: '남원', gimje: '김제', wanju: '완주',
  jinan: '진안', muju: '무주', jangsu: '장수', imsil: '임실', sunchang: '순창', gochang: '고창', buan: '부안'
};
// These two official entries describe cross-boundary destinations whose detail-page address is not the represented travel area.
const addressRegionExceptions = new Set(['official-a-25822', 'official-a-25785']);

const tourDataSource = await readFile(new URL('js/tourData.js', root), 'utf8');
const catalogSource = await readFile(new URL('js/tourCatalog.js', root), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(`${tourDataSource}\n${catalogSource}\nglobalThis.__catalog = OFFICIAL_TOUR_CATALOG; globalThis.__regionIds = Object.keys(JEONBUK_REGIONS);`, context);

const existingDetails = {};
for (const regionId of context.__regionIds) {
  try {
    Object.assign(existingDetails, JSON.parse(await readFile(new URL(`${regionId}.json`, detailDirectory), 'utf8')));
  } catch {
    // The first split has no existing detail file to merge.
  }
}

const catalog = context.__catalog.map(tour => {
  const mergedTour = { ...tour, ...(existingDetails[tour.id] || {}) };
  const addressRegionId = Object.entries(regionAddressTokens)
    .find(([, token]) => String(mergedTour.address || '').includes(token))?.[0];
  if (!addressRegionId || addressRegionId === mergedTour.regionId || addressRegionExceptions.has(mergedTour.id)) {
    return mergedTour;
  }
  const previousTag = `#${regionTagNames[mergedTour.regionId] || ''}`;
  return {
    ...mergedTour,
    regionId: addressRegionId,
    tags: (mergedTour.tags || []).map(tag => tag === previousTag ? `#${regionTagNames[addressRegionId]}` : tag)
  };
});
const slimCatalog = catalog.map(tour => Object.fromEntries(
  Object.entries(tour).filter(([key]) => !detailFields.has(key))
));
const detailsByRegion = {};

catalog.forEach(tour => {
  const details = Object.fromEntries(
    Object.entries(tour).filter(([key, value]) => detailFields.has(key) && value)
  );
  if (!Object.keys(details).length) return;
  if (!detailsByRegion[tour.regionId]) detailsByRegion[tour.regionId] = {};
  detailsByRegion[tour.regionId][tour.id] = details;
});

const mergeFooter = `
const normalizeCatalogName = (value = '') => String(value)
  .toLowerCase()
  .replace(/\\([^)]*\\)/g, '')
  .replace(/[^0-9a-z가-힣]/g, '');

OFFICIAL_TOUR_CATALOG.forEach((tour) => {
  const region = JEONBUK_REGIONS[tour.regionId];
  if (!region) return;
  const incomingName = normalizeCatalogName(tour.name);
  const duplicate = region.tours.some((item) => {
    if (item.id === tour.id) return true;
    const existingName = normalizeCatalogName(item.name);
    return existingName === incomingName ||
      (Math.min(existingName.length, incomingName.length) >= 4 &&
        (existingName.includes(incomingName) || incomingName.includes(existingName)));
  });
  if (!duplicate) region.tours.push(tour);
});
`;

const catalogOutput = `// 투어전북 공식 목록용 경량 카탈로그입니다. 긴 소개와 운영 정보는 지역별 JSON으로 지연 로딩합니다.\n\nconst OFFICIAL_TOUR_CATALOG = ${JSON.stringify(slimCatalog, null, 2)};\n${mergeFooter}`;
await writeFile(new URL('js/tourCatalog.js', root), catalogOutput, 'utf8');

await mkdir(detailDirectory, { recursive: true });
for (const [regionId, details] of Object.entries(detailsByRegion)) {
  await writeFile(new URL(`${regionId}.json`, detailDirectory), `${JSON.stringify(details)}\n`, 'utf8');
}

const initialBytes = Buffer.byteLength(catalogOutput);
const detailBytes = Object.values(detailsByRegion)
  .reduce((sum, details) => sum + Buffer.byteLength(JSON.stringify(details)), 0);
console.log(`Catalog split: ${catalog.length} places, ${(initialBytes / 1024).toFixed(0)} KB initial, ${(detailBytes / 1024).toFixed(0)} KB lazy details.`);

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const CATALOG_DIR = path.join(IMAGES_DIR, 'catalog');
const SPOTS_DIR = path.join(IMAGES_DIR, 'spots');
const CATALOG_FILE = path.join(ROOT, 'js', 'tourCatalog.js');
const TOUR_IMAGES_FILE = path.join(ROOT, 'js', 'tourImages.js');
const REPORT_FILE = path.join(ROOT, 'scripts', 'image_optimization_audit.json');

function readVmValue(filePath, variableName) {
  const context = { JEONBUK_REGIONS: {} };
  vm.createContext(context);
  const source = fs.readFileSync(filePath, 'utf8')
    .replace(new RegExp(`\\bconst\\s+${variableName}\\b`), `var ${variableName}`)
    .replace(/\bconst\s+normalizeCatalogName\b/, 'var normalizeCatalogName');
  vm.runInContext(source, context);
  return context[variableName];
}

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function directorySize(directory) {
  if (!fs.existsSync(directory)) return 0;
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(directory, entry.name);
    return total + (entry.isDirectory() ? directorySize(entryPath) : fileSize(entryPath));
  }, 0);
}

function ensureInsideImages(filePath) {
  const resolved = path.resolve(filePath);
  const root = `${path.resolve(IMAGES_DIR)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new Error(`Unsafe image path: ${resolved}`);
  return resolved;
}

async function fetchBuffer(url, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; JeonbukTourImageOptimizer/1.0)' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 600));
      return fetchBuffer(url, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function toTourWebp(input, outputPath) {
  ensureInsideImages(outputPath);
  await sharp(input, { failOn: 'none', limitInputPixels: 120000000 })
    .rotate()
    .resize({
      width: 720,
      height: 480,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: 68,
      effort: 4,
      smartSubsample: true
    })
    .toFile(outputPath);
}

async function concurrentMap(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
      if ((index + 1) % 50 === 0) {
        console.log(`IMAGE_PROGRESS ${index + 1}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function catalogRuntimeSource() {
  return `
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
}

function tourImagesRuntimeSource() {
  return `
Object.values(JEONBUK_REGIONS).forEach((region) => {
  region.tours.forEach((tour) => {
    const official = OFFICIAL_TOUR_IMAGES[tour.id];
    if (official) Object.assign(tour, official);
  });
});
`;
}

async function optimizeCatalog(catalog) {
  fs.mkdirSync(CATALOG_DIR, { recursive: true });
  const failures = [];
  const stats = await concurrentMap(catalog, 8, async (entry) => {
    const originalUrl = entry.image;
    const outputPath = path.join(CATALOG_DIR, `${entry.id}.webp`);
    try {
      const input = await fetchBuffer(originalUrl);
      await toTourWebp(input, outputPath);
      entry.image = `images/catalog/${entry.id}.webp`;
      return {
        id: entry.id,
        originalUrl,
        originalBytes: input.length,
        optimizedBytes: fileSize(outputPath)
      };
    } catch (error) {
      failures.push({ id: entry.id, url: originalUrl, error: error.message });
      return null;
    }
  });
  return { stats: stats.filter(Boolean), failures };
}

async function optimizeLocalSpots(imageMap) {
  const stats = [];
  for (const [id, item] of Object.entries(imageMap)) {
    const sourcePath = path.join(ROOT, item.image);
    const outputPath = path.join(SPOTS_DIR, `${id}.webp`);
    const originalBytes = fileSize(sourcePath);
    await toTourWebp(sourcePath, outputPath);
    item.image = `images/spots/${id}.webp`;
    stats.push({
      id,
      originalPath: path.relative(ROOT, sourcePath).replaceAll('\\', '/'),
      originalBytes,
      optimizedBytes: fileSize(outputPath)
    });
  }
  return stats;
}

async function optimizeSharedImages() {
  const shared = [];

  const mapSource = path.join(IMAGES_DIR, 'jeonbuk_map_clean-v2.png');
  const mapOutput = path.join(IMAGES_DIR, 'jeonbuk_map_clean-v2.webp');
  await sharp(mapSource)
    .resize({ width: 1600, height: 1100, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 74, effort: 5, smartSubsample: true })
    .toFile(mapOutput);
  shared.push({
    name: 'map',
    originalPath: 'images/jeonbuk_map_clean-v2.png',
    optimizedPath: 'images/jeonbuk_map_clean-v2.webp',
    originalBytes: fileSize(mapSource),
    optimizedBytes: fileSize(mapOutput)
  });

  const ogSource = path.join(IMAGES_DIR, 'og.png');
  const ogOutput = path.join(IMAGES_DIR, 'og.jpg');
  await sharp(ogSource)
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(ogOutput);
  shared.push({
    name: 'social-preview',
    originalPath: 'images/og.png',
    optimizedPath: 'images/og.jpg',
    originalBytes: fileSize(ogSource),
    optimizedBytes: fileSize(ogOutput)
  });

  const legacySource = path.join(IMAGES_DIR, 'jeonbuk_map_illust.jpg');
  const legacyOutput = path.join(IMAGES_DIR, 'jeonbuk_map_illust.webp');
  await sharp(legacySource)
    .resize({ width: 1600, height: 1100, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72, effort: 5, smartSubsample: true })
    .toFile(legacyOutput);
  shared.push({
    name: 'legacy-map',
    originalPath: 'images/jeonbuk_map_illust.jpg',
    optimizedPath: 'images/jeonbuk_map_illust.webp',
    originalBytes: fileSize(legacySource),
    optimizedBytes: fileSize(legacyOutput)
  });

  return shared;
}

function deleteReplacedFiles(localStats, sharedStats) {
  const targets = [
    ...localStats.map(item => path.join(ROOT, item.originalPath)),
    ...sharedStats.map(item => path.join(ROOT, item.originalPath))
  ];
  for (const target of targets) {
    ensureInsideImages(target);
    if (fs.existsSync(target)) fs.rmSync(target);
  }
}

async function main() {
  const beforeBytes = directorySize(IMAGES_DIR);
  const catalog = readVmValue(CATALOG_FILE, 'OFFICIAL_TOUR_CATALOG');
  const imageMap = readVmValue(TOUR_IMAGES_FILE, 'OFFICIAL_TOUR_IMAGES');

  const localStats = await optimizeLocalSpots(imageMap);
  const sharedStats = await optimizeSharedImages();
  const catalogResult = await optimizeCatalog(catalog);

  if (catalogResult.failures.length) {
    throw new Error(`Catalog image conversion failed for ${catalogResult.failures.length} entries`);
  }

  fs.writeFileSync(
    CATALOG_FILE,
    `// 투어전북 공식 데이터를 경량 WebP 이미지와 연결한 관광 카탈로그입니다.\n` +
      `// 이미지 최적화 기준일: ${new Date().toISOString()}\n\n` +
      `const OFFICIAL_TOUR_CATALOG = ${JSON.stringify(catalog, null, 2)};\n` +
      catalogRuntimeSource(),
    'utf8'
  );
  fs.writeFileSync(
    TOUR_IMAGES_FILE,
    `// 핵심 추천 명소의 경량 WebP 이미지 연결 정보입니다.\n\n` +
      `const OFFICIAL_TOUR_IMAGES = ${JSON.stringify(imageMap, null, 2)};\n` +
      tourImagesRuntimeSource(),
    'utf8'
  );

  deleteReplacedFiles(localStats, sharedStats);
  const afterBytes = directorySize(IMAGES_DIR);
  const catalogOriginalBytes = catalogResult.stats.reduce((sum, item) => sum + item.originalBytes, 0);
  const catalogOptimizedBytes = catalogResult.stats.reduce((sum, item) => sum + item.optimizedBytes, 0);
  const localOriginalBytes = localStats.reduce((sum, item) => sum + item.originalBytes, 0);
  const localOptimizedBytes = localStats.reduce((sum, item) => sum + item.optimizedBytes, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    settings: {
      tourImages: 'WebP, max 720x480, quality 68',
      map: 'WebP, max 1600x1100, quality 74',
      socialPreview: 'progressive JPEG, 1200x630, quality 80'
    },
    counts: {
      catalog: catalogResult.stats.length,
      coreSpots: localStats.length,
      shared: sharedStats.length,
      failures: catalogResult.failures.length
    },
    bytes: {
      websiteImagesBefore: beforeBytes,
      websiteImagesAfter: afterBytes,
      catalogOriginal: catalogOriginalBytes,
      catalogOptimized: catalogOptimizedBytes,
      coreSpotsOriginal: localOriginalBytes,
      coreSpotsOptimized: localOptimizedBytes
    },
    savingsPercent: {
      catalog: Number((100 - (catalogOptimizedBytes / catalogOriginalBytes) * 100).toFixed(1)),
      coreSpots: Number((100 - (localOptimizedBytes / localOriginalBytes) * 100).toFixed(1))
    },
    shared: sharedStats,
    failures: catalogResult.failures
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

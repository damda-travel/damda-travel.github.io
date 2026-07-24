const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://tour.jb.go.kr';
const REGION_IDS = {
  전주: 'jeonju',
  군산: 'gunsan',
  익산: 'iksan',
  정읍: 'jeongeup',
  남원: 'namwon',
  김제: 'gimje',
  완주: 'wanju',
  진안: 'jinan',
  무주: 'muju',
  장수: 'jangsu',
  임실: 'imsil',
  순창: 'sunchang',
  고창: 'gochang',
  부안: 'buan'
};

const REGION_NAMES = Object.fromEntries(
  Object.entries(REGION_IDS).map(([name, id]) => [id, name])
);
const CAFE_ADDRESSES = {
  아담원: '전북특별자치도 남원시 이백면 목가길 193',
  아원고택: '전북특별자치도 완주군 소양면 송광수만로 516-7',
  대율담: '전북특별자치도 김제시 금구면 대화1길 95',
  어스언더파크: '전북특별자치도 익산시 황등면 황등7길 34'
};

const LIST_BASE = `${BASE_URL}/travel/info/list.do?contentsSid=30&menuCd=DOM_000000110002002000&order_by=5`;
const FOOD_SOURCE = `${BASE_URL}/index.do?menuCd=DOM_000000109001004000`;
const CAFE_SOURCE = `${BASE_URL}/index.do?menuCd=DOM_000000109001031000`;
const USER_AGENT = 'Mozilla/5.0 (compatible; JeonbukTourCatalogSync/1.0)';

function cleanText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value = '') {
  if (!value) return '';
  try {
    return new URL(value, BASE_URL).href;
  } catch {
    return '';
  }
}

function normalizeName(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^0-9a-z가-힣]/g, '');
}

function isSamePlace(a, b) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return Math.min(left.length, right.length) >= 4 && (left.includes(right) || right.includes(left));
}

async function fetchText(url, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } catch (error) {
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 700));
      return fetchText(url, attempt + 1);
    }
    console.warn(`FETCH_FAILED ${url}: ${error.message}`);
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function parseListCards(html, categoryTopId) {
  return html
    .split('<div class="photoWrap">')
    .slice(1)
    .map(part => {
      const href = part.match(/href="([^"]*ctnt_id=[^"]+)"/i)?.[1] || '';
      const image = part.match(/<img[^>]+src="([^"]+)"/i)?.[1] || '';
      const region = cleanText(part.match(/list_best_badge[\s\S]*?<span>([^<]+)<\/span>/i)?.[1]);
      const listCategory = cleanText(part.match(/accom_cate[^>]*>([^<]+)/i)?.[1]);
      const name = cleanText(part.match(/<strong>([^<]+)<\/strong>/i)?.[1]);
      const listItems = [...part.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(match => cleanText(match[1]))
        .filter(Boolean);
      const ctntId = href.match(/[?&]ctnt_id=(\d+)/)?.[1] || '';
      if (!name || !href || !REGION_IDS[region]) return null;
      return {
        categoryTopId,
        ctntId,
        name,
        region,
        regionId: REGION_IDS[region],
        listCategory,
        addressOrPeriod: listItems[0] || '',
        listItems,
        image: absoluteUrl(image),
        sourceUrl: absoluteUrl(href)
      };
    })
    .filter(Boolean);
}

function parseDefinitionRows(html) {
  const rows = {};
  const regex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const match of html.matchAll(regex)) {
    const label = cleanText(match[1]);
    const value = cleanText(match[2]);
    if (label && value && !rows[label]) rows[label] = value;
  }
  return rows;
}

function findRow(rows, labels) {
  for (const [key, value] of Object.entries(rows)) {
    if (labels.some(label => key.includes(label))) return value;
  }
  return '';
}

function findHomepage(html) {
  const siteBlock = html.match(/<dt[^>]*class="site"[^>]*>[\s\S]*?<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i)?.[1] || '';
  const href = siteBlock.match(/href="([^"]+)"/i)?.[1] || '';
  return href && !href.toLowerCase().startsWith('javascript:') ? absoluteUrl(href) : '';
}

function parseDetail(html) {
  const rows = parseDefinitionRows(html);
  const articles = [...html.matchAll(
    /<h3[^>]*class="article_tit"[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*class="article_cont"[^>]*>([\s\S]*?)<\/p>/gi
  )].map(match => ({
    title: cleanText(match[1]),
    text: cleanText(match[2])
  })).filter(item => item.text);
  const coords = html.match(/fnLoadFindRoutePopup\('([^']+)',\s*'([^']+)'\)/i);
  const location = findRow(rows, ['위치정보', '주소']);
  const tel = findRow(rows, ['문의전화', '전화']);
  return {
    overview: articles.map(item => item.text).join('\n\n'),
    address: location.replace(/^\(\d+\)\s*/, ''),
    phone: tel.replace(/^일반전화\s*:\s*/, ''),
    homepage: findHomepage(html),
    hours: findRow(rows, ['이용시간', '운영시간', '관람시간']),
    closed: findRow(rows, ['휴무일', '쉬는날', '휴관일']),
    fee: findRow(rows, ['이용요금', '입장료', '관람료']),
    parking: findRow(rows, ['주차']),
    lat: coords ? Number(coords[1]) : null,
    lng: coords ? Number(coords[2]) : null
  };
}

function attractionCategory(card) {
  const value = `${card.name} ${card.listCategory} ${card.listItems.join(' ')}`;
  if (/시장|야시장|카페|커피|와인|식당|먹거리|푸드|빵|베이커리/.test(value)) return 'food';
  if (/산|해수욕장|자연|공원|계곡|휴양림|수목원|섬|호수|저수지|폭포|숲|해안|습지|동굴|수변|정원|고원|생태|둘레길|산책길/.test(value)) return 'nature';
  return 'culture';
}

function categoryName(category, name = '') {
  if (category === 'festival') return '축제/행사';
  if (category === 'food') return /카페|커피/.test(name) ? '카페' : '맛집';
  if (category === 'nature') return '자연/힐링';
  return '역사/문화';
}

function shortDescription(text, fallback) {
  const cleaned = cleanText(text);
  if (!cleaned) return fallback;
  const sentence = cleaned.match(/^.{20,160}?[.!?。]|^.{20,160}?(?=\s[A-Z가-힣])/u)?.[0] || cleaned.slice(0, 150);
  return sentence.length < cleaned.length ? `${sentence.replace(/[,\s]+$/, '')}…` : sentence;
}

function eventStatus(period) {
  const parts = String(period).split(/\s*(?:~|∼|～|–|—|부터)\s*/);
  const firstNumbers = parts[0]?.match(/(20\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!firstNumbers) return '일정 확인';
  const year = Number(firstNumbers[1]);
  const start = new Date(year, Number(firstNumbers[2]) - 1, Number(firstNumbers[3]), 12);
  const lastPart = parts.at(-1) || '';
  const fullEnd = lastPart.match(/(20\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
  const shortEnd = lastPart.match(/(?:^|\D)(\d{1,2})\D+(\d{1,2})(?:\D|$)/);
  const end = fullEnd
    ? new Date(Number(fullEnd[1]), Number(fullEnd[2]) - 1, Number(fullEnd[3]), 12)
    : shortEnd
      ? new Date(year, Number(shortEnd[1]) - 1, Number(shortEnd[2]), 12)
      : start;
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (today < start) return '개최 예정';
  if (today > end) return '종료';
  return '진행 중';
}

async function concurrentMap(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
      if ((index + 1) % 25 === 0) console.log(`DETAIL_PROGRESS ${index + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function loadExistingCatalog() {
  const context = {};
  vm.createContext(context);
  const source = fs.readFileSync(path.join(ROOT, 'js', 'tourData.js'), 'utf8')
    .replace(/\bconst\s+JEONBUK_REGIONS\b/, 'var JEONBUK_REGIONS')
    .replace(/\bconst\s+RECOMMENDED_COURSES\b/, 'var RECOMMENDED_COURSES');
  vm.runInContext(source, context);
  const tours = Object.values(context.JEONBUK_REGIONS).flatMap(region => region.tours);
  return {
    names: tours.map(tour => tour.name),
    ids: new Set(tours.map(tour => tour.id))
  };
}

async function collectList(categoryTopId) {
  const all = [];
  for (let page = 1; page <= 30; page += 1) {
    const url = `${LIST_BASE}&category_top_id=${categoryTopId}&pageindex=${page}`;
    const html = await fetchText(url);
    const cards = parseListCards(html, categoryTopId);
    console.log(`LIST ${categoryTopId} page=${page} cards=${cards.length}`);
    if (!cards.length) break;
    all.push(...cards);
    if (cards.length < 40 && page > 1) break;
  }
  const seen = new Set();
  return all.filter(card => {
    if (seen.has(card.ctntId)) return false;
    seen.add(card.ctntId);
    return true;
  });
}

function toOfficialEntry(card, detail) {
  const isFestival = card.categoryTopId === 'c';
  const category = isFestival ? 'festival' : attractionCategory(card);
  const period = isFestival ? card.addressOrPeriod.replace(/^기간\s*:\s*/, '') : '';
  const fallback = isFestival
    ? `${card.region}에서 열리는 ${card.name}의 일정과 프로그램을 확인해보세요.`
    : `${card.region}의 ${card.name}에서 전북 여행의 매력을 만나보세요.`;
  const overview = detail.overview || fallback;
  return {
    regionId: card.regionId,
    id: `official-${card.categoryTopId}-${card.ctntId}`,
    name: card.name,
    category,
    categoryName: categoryName(category, card.name),
    subCategory: card.listCategory || categoryName(category, card.name),
    lat: detail.lat,
    lng: detail.lng,
    address: detail.address || (isFestival ? `${card.region} 일원` : card.addressOrPeriod) || `전북특별자치도 ${card.region}`,
    image: card.image,
    tags: [
      `#${card.region}`,
      `#${isFestival ? '전북축제' : card.listCategory || '전북여행'}`,
      `#${categoryName(category, card.name).replace('/', '')}`
    ],
    desc: shortDescription(overview, fallback),
    overview,
    phone: detail.phone,
    homepage: detail.homepage,
    hours: detail.hours,
    closed: detail.closed,
    fee: detail.fee,
    parking: detail.parking,
    eventPeriod: period,
    eventStatus: period ? eventStatus(period) : '',
    recommendedDuration: isFestival ? '행사 일정에 따라' : category === 'nature' ? '1~3시간' : '1~2시간',
    recommendedFor: isFestival ? '계절 축제·지역 행사 여행' : `${categoryName(category, card.name)} 중심 여행`,
    visitTip: isFestival
      ? '행사 일정과 프로그램은 날씨와 주최 측 사정으로 바뀔 수 있으니 출발 전 공식 페이지를 확인하세요.'
      : '운영시간과 이용요금은 계절과 현장 사정에 따라 달라질 수 있으니 방문 전 공식 페이지를 확인하세요.',
    sourceUrl: card.sourceUrl,
    imageSource: '투어전북',
    imageUsageNote: ''
  };
}

function parseFoodEntries(html) {
  return html
    .split('<li class="flex">')
    .slice(1)
    .map((block, index) => {
      const name = cleanText(block.match(/class="trip_name"[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
      const description = cleanText(block.match(/class="trip_txt"[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
      const address = cleanText(block.match(/class="location"[^>]*>([\s\S]*?)<\/span>/i)?.[1]);
      const image = absoluteUrl(block.match(/<img[^>]+src="([^"]+)"/i)?.[1]);
      const link = absoluteUrl(block.match(/<a[^>]+href="([^"]+)"[^>]*>\s*자세히보기/i)?.[1]);
      const region = Object.keys(REGION_IDS).find(nameRegion => address.includes(`${nameRegion}시`) || address.includes(`${nameRegion}군`));
      if (!name || !region) return null;
      const isCafe = /제과|빵|이성당/.test(name);
      const overview = description || `${region}에서 오랫동안 사랑받아온 ${name}의 대표 메뉴를 만나보세요.`;
      return {
        regionId: REGION_IDS[region],
        id: `official-food-${index + 1}`,
        name,
        category: 'food',
        categoryName: isCafe ? '베이커리' : '맛집',
        subCategory: isCafe ? '베이커리' : '노포 맛집',
        address: address.startsWith('전북') ? address : `전북특별자치도 ${address}`,
        image,
        tags: [`#${region}`, '#전북노포', isCafe ? '#베이커리' : '#전북맛집'],
        desc: shortDescription(overview, `${name}의 대표 메뉴를 만나보세요.`),
        overview,
        recommendedDuration: '1시간 내외',
        recommendedFor: isCafe ? '빵지순례·간식 여행' : '지역 대표 음식·미식 여행',
        visitTip: '재료 소진과 대기 시간이 생길 수 있으니 영업시간과 휴무일을 방문 전에 확인하세요.',
        sourceUrl: FOOD_SOURCE,
        homepage: link,
        imageSource: '투어전북 노포 맛집 기획전',
        imageUsageNote: ''
      };
    })
    .filter(Boolean);
}

function parseCafeEntries(html) {
  const regionByIndex = ['namwon', 'wanju', 'gimje', 'iksan'];
  return html
    .split(/<div class="tour_list"[^>]*id="place\d+"[^>]*>/i)
    .slice(1)
    .map((block, index) => {
      const heading = cleanText(block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1]);
      const name = heading.split(',').at(-1).trim();
      const overview = cleanText(block.match(/<p[^>]*class="desc"[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
      const image = absoluteUrl(block.match(/<img[^>]+src="([^"]+)"/i)?.[1]);
      const links = [...block.matchAll(/<a[^>]+href="([^"]+)"[^>]*>/gi)].map(match => absoluteUrl(match[1])).filter(Boolean);
      const regionId = regionByIndex[index];
      if (!name || !regionId) return null;
      const region = REGION_NAMES[regionId];
      return {
        regionId,
        id: `official-cafe-${index + 1}`,
        name,
        category: 'food',
        categoryName: '카페',
        subCategory: '뷰세권 카페',
        address: CAFE_ADDRESSES[name] || `전북특별자치도 ${region}`,
        image,
        tags: [`#${region}`, '#전북카페', '#뷰세권'],
        desc: shortDescription(overview, `${region}의 풍경과 함께 쉬어가기 좋은 카페입니다.`),
        overview: overview || `${region}의 풍경과 함께 쉬어가기 좋은 카페입니다.`,
        recommendedDuration: '1~2시간',
        recommendedFor: '카페·사진·휴식 여행',
        visitTip: '좌석과 운영시간은 현장 상황에 따라 달라질 수 있으니 방문 전에 확인하세요.',
        sourceUrl: CAFE_SOURCE,
        homepage: links.at(-1) || '',
        imageSource: '투어전북 뷰세권 카페 기획전',
        imageUsageNote: ''
      };
    })
    .filter(Boolean);
}

async function main() {
  const existing = loadExistingCatalog();
  console.log(`EXISTING ${existing.names.length}`);

  const [attractions, festivals, foodHtml, cafeHtml] = await Promise.all([
    collectList('a'),
    collectList('c'),
    fetchText(FOOD_SOURCE),
    fetchText(CAFE_SOURCE)
  ]);

  const listCards = [...attractions, ...festivals].filter(card =>
    !existing.names.some(name => isSamePlace(name, card.name))
  );
  console.log(`DETAIL_TARGETS ${listCards.length}`);

  const enriched = await concurrentMap(listCards, 10, async card => {
    const html = await fetchText(card.sourceUrl);
    return toOfficialEntry(card, html ? parseDetail(html) : {});
  });

  const editorial = [
    ...parseFoodEntries(foodHtml),
    ...parseCafeEntries(cafeHtml)
  ];
  const merged = [];
  for (const entry of [...enriched, ...editorial]) {
    if (existing.names.some(name => isSamePlace(name, entry.name))) continue;
    if (merged.some(item => isSamePlace(item.name, entry.name))) continue;
    merged.push(entry);
  }

  const output = `// 이 파일은 scripts/sync_official_catalog.js에서 생성됩니다.\n` +
    `// 기준일: ${new Date().toISOString()}\n\n` +
    `const OFFICIAL_TOUR_CATALOG = ${JSON.stringify(merged, null, 2)};\n\n` +
    `OFFICIAL_TOUR_CATALOG.forEach((tour) => {\n` +
    `  const region = JEONBUK_REGIONS[tour.regionId];\n` +
    `  if (!region) return;\n` +
    `  const normalize = (value = '') => String(value).toLowerCase().replace(/\\([^)]*\\)/g, '').replace(/[^0-9a-z가-힣]/g, '');\n` +
    `  const incomingName = normalize(tour.name);\n` +
    `  const duplicate = region.tours.some((item) => {\n` +
    `    if (item.id === tour.id) return true;\n` +
    `    const existingName = normalize(item.name);\n` +
    `    return existingName === incomingName || (Math.min(existingName.length, incomingName.length) >= 4 && (existingName.includes(incomingName) || incomingName.includes(existingName)));\n` +
    `  });\n` +
    `  if (!duplicate) region.tours.push(tour);\n` +
    `});\n`;
  fs.writeFileSync(path.join(ROOT, 'js', 'tourCatalog.js'), output, 'utf8');

  const categoryCounts = merged.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const regionCounts = merged.reduce((acc, item) => {
    acc[item.regionId] = (acc[item.regionId] || 0) + 1;
    return acc;
  }, {});
  const audit = {
    generatedAt: new Date().toISOString(),
    sources: {
      attractions: `${LIST_BASE}&category_top_id=a`,
      festivals: `${LIST_BASE}&category_top_id=c`,
      food: FOOD_SOURCE,
      cafe: CAFE_SOURCE
    },
    fetched: {
      attractions: attractions.length,
      festivals: festivals.length,
      food: parseFoodEntries(foodHtml).length,
      cafe: parseCafeEntries(cafeHtml).length
    },
    added: merged.length,
    skippedExistingOrDuplicate:
      attractions.length + festivals.length + editorial.length - merged.length,
    categoryCounts,
    regionCounts,
    missingImages: merged.filter(item => !item.image).map(item => item.name),
    missingOverviews: merged.filter(item => !item.overview).map(item => item.name),
    entries: merged.map(item => ({
      id: item.id,
      name: item.name,
      regionId: item.regionId,
      category: item.category,
      sourceUrl: item.sourceUrl,
      image: item.image
    }))
  };
  fs.writeFileSync(
    path.join(ROOT, 'scripts', 'official_catalog_audit.json'),
    `${JSON.stringify(audit, null, 2)}\n`,
    'utf8'
  );
  console.log(JSON.stringify(audit, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

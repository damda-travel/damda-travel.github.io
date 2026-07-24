const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const photoAudit = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'official_photo_audit.json'), 'utf8')
);

const VERIFIED_DETAIL_OVERRIDES = {
  'gs-2': {
    hours: '3~10월 09:00~18:00 · 11~2월 09:00~17:00',
    closed: '매주 월요일 · 1월 1일',
    fee: '성인 개별권 2,000원부터',
    parking: '박물관 주차장 무료',
    recommendedDuration: '약 1시간'
  },
  'gs-3': {
    overview: '1945년부터 자리를 지켜 온 군산의 대표 제과점입니다. 단팥빵과 야채빵으로 널리 알려져 있으며, 오래된 빵집의 역사와 군산 원도심의 분위기를 함께 경험할 수 있습니다.',
    phone: '063-445-2772',
    recommendedDuration: '30~60분',
    visitTip: '인기 제품은 일찍 소진되거나 대기 줄이 생길 수 있어 오전 방문이 비교적 여유롭습니다.'
  },
  'gs-4': {
    overview: '1940년대 신문용지 공장과 군산역을 잇던 철로 주변에 형성된 마을입니다. 현재는 약 400m의 철길과 낮은 집, 교복 대여점과 추억의 간식 가게가 어우러진 군산 대표 레트로 사진 명소로 사랑받고 있습니다.',
    phone: '063-453-4986',
    hours: '상시 개방',
    closed: '연중무휴',
    fee: '무료',
    parking: '인근 주차장 이용',
    recommendedDuration: '40~60분'
  },
  'is-2': {
    overview: '어르신을 위한 공간으로 가꾸기 시작해 누구나 찾을 수 있는 정원으로 개방된 민간 정원입니다. 메타세쿼이아 길과 공작단풍, 계절마다 달라지는 꽃과 나무가 어우러져 조용한 산책과 사진 촬영에 잘 어울립니다.',
    recommendedDuration: '60~90분',
    visitTip: '계절별 개방 일정과 관람 방법이 달라질 수 있으니 방문 전에 공식 관광정보를 확인하세요.'
  },
  'wj-1': {
    overview: '종남산과 위봉산, 서방산에 둘러싸인 오성한옥마을의 대표 문화공간입니다. 경남 진주의 250년 고택을 옮겨온 한옥과 현대미술 전시, 산중 풍경이 어우러져 전통 건축과 예술, 휴식을 한 번에 경험할 수 있습니다.',
    phone: '063-241-8195',
    homepage: 'https://www.awon.kr',
    recommendedDuration: '1~2시간',
    visitTip: '숙박 공간과 관람 공간의 운영 방식이 다를 수 있어 입장·예약 여부를 방문 전에 확인하세요.'
  },
  'ja-1': {
    overview: '마이산 남부의 탑사는 비바람에도 무너지지 않는 80여 기의 돌탑이 산봉우리와 함께 독특한 풍경을 만드는 사찰입니다. 천지탑·오방탑·일광탑·월광탑을 따라 걸으며 자연과 민간 신앙이 어우러진 공간을 볼 수 있습니다.',
    phone: '063-430-8751',
    recommendedDuration: '40~60분',
    visitTip: '남부주차장에서 탑사까지 걷는 시간이 필요합니다. 오전 이른 시간이나 일몰 전이 비교적 여유롭습니다.'
  },
  'mj-2': {
    overview: '무주 양수발전소 건설 당시 작업용으로 쓰던 터널을 2007년 와인 숙성·저장·판매 공간으로 바꾼 관광지입니다. 적상산 중턱 해발 450m에 자리하며 연중 13~14℃를 유지하는 동굴에서 머루와인 시음과 족욕 체험을 즐길 수 있습니다.',
    phone: '063-322-4720',
    homepage: 'https://tour.muju.go.kr/cave/index.do',
    hours: '4~10월 10:00~17:30 · 11~3월 10:00~16:30',
    closed: '매주 월요일 · 설·추석 당일',
    fee: '입장 2,000원 · 족욕 별도',
    parking: '11:30~15:00 혼잡 가능',
    recommendedDuration: '60~90분'
  },
  'js-1': {
    overview: '장수 출신 의암 주논개의 충절을 기리는 사당과 공원입니다. 의암사·의암루·충혼탑이 의암호 주변에 나란히 자리해 임진왜란과 논개의 삶을 돌아보며 조용히 산책하기 좋습니다.',
    phone: '063-350-2344',
    hours: '상시 개방',
    closed: '연중무휴',
    recommendedDuration: '40~60분'
  },
  'js-2': {
    overview: '장안산 기슭의 방화동계곡과 덕산용소를 잇는 사계절 휴양지입니다. 울창한 숲과 깨끗한 계곡, 방화폭포, 산림욕장과 숙박·야영 시설이 어우러져 가족 단위 산책부터 체류형 휴식까지 즐길 수 있습니다.',
    phone: '063-350-2474',
    homepage: 'https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030082',
    recommendedDuration: '반나절',
    visitTip: '숙박·야영 시설은 숲나들e에서 예약하고, 계곡·탐방로 이용 가능 여부는 날씨에 따라 확인하세요.'
  }
};

function decodeEntities(value = '') {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    ldquo: '“',
    lsquo: '‘',
    lt: '<',
    middot: '·',
    nbsp: ' ',
    ndash: '–',
    quot: '"',
    rdquo: '”',
    rsquo: '’'
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function cleanHTML(value = '') {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDefinition(html, className) {
  const pattern = new RegExp(
    `<dt[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`,
    'i'
  );
  return cleanHTML(html.match(pattern)?.[1] || '');
}

function extractHref(html, className) {
  const pattern = new RegExp(
    `<dt[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<\\/dt>\\s*<dd[^>]*>[\\s\\S]*?<a[^>]*href=["']([^"']+)["']`,
    'i'
  );
  return decodeEntities(html.match(pattern)?.[1] || '').trim();
}

function extractOverview(html) {
  const introStart = html.search(/<h3[^>]*class=["'][^"']*article_tit[^"']*["'][^>]*>\s*소개\s*<\/h3>/i);
  if (introStart >= 0) {
    const introSlice = html.slice(introStart, introStart + 60000);
    const intro = introSlice.match(/<p[^>]*class=["'][^"']*article_cont[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    if (intro?.[1]) return cleanHTML(intro[1]);
  }

  const firstArticle = html.match(/<p[^>]*class=["'][^"']*article_cont[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  return cleanHTML(firstArticle?.[1] || '');
}

function stripPhoneLabel(value = '') {
  return value
    .replace(/^(일반전화|대표전화|전화|문의전화)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferDuration(name, category) {
  if (/국립공원|산\b|뱀사골|변산반도|고군산|선유도|대둔산|마이산/.test(name)) return '반나절';
  if (/시장|빵집|이성당|치즈테마파크/.test(name)) return '1~2시간';
  if (/박물관|미술관|기념관|성당|사찰|금산사|내소사|경기전|향교/.test(name)) return '60~90분';
  if (category === 'festival') return '행사 일정에 따라';
  if (category === 'food') return '30~60분';
  return '1~2시간';
}

function inferAudience(category) {
  return {
    culture: '역사·문화 여행',
    nature: '산책·풍경 감상',
    food: '미식·시장 탐방',
    festival: '축제·체험 여행'
  }[category] || '전북 여행';
}

function inferVisitTip(name, category) {
  if (/국립공원|산\b|뱀사골|변산반도|대둔산|마이산/.test(name)) {
    return '걷는 구간이 많을 수 있어 편한 신발과 계절별 등산·방한 장비를 준비하세요.';
  }
  if (/시장|빵집|이성당/.test(name)) {
    return '주말과 식사 시간에는 대기할 수 있어 오전이나 비교적 한산한 시간대 방문을 권합니다.';
  }
  if (/박물관|미술관|기념관/.test(name)) {
    return '마감 직전보다 여유 있게 도착하면 상설전시와 주변 연계 공간까지 보기 좋습니다.';
  }
  if (/성당|사찰|금산사|내소사|경기전|향교/.test(name)) {
    return '종교·문화유산 공간이므로 조용히 관람하고 행사 중에는 촬영과 동선을 배려해주세요.';
  }
  if (category === 'festival') {
    return '행사 기간과 프로그램은 매년 달라질 수 있으니 방문 전 공식 일정을 확인하세요.';
  }
  return '날씨와 운영 정보가 달라질 수 있으니 출발 전 공식 관광정보를 확인하세요.';
}

function firstSentence(text = '') {
  const normalized = text.replace(/\n+/g, ' ').trim();
  const match = normalized.match(/^(.{20,180}?[.!?]|.{20,180}?(?:이다|입니다|있다|있습니다)\.)/);
  return (match?.[1] || normalized.slice(0, 150)).trim();
}

function escapeScriptJSON(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

async function main() {
  const details = {};
  const auditRows = [];

  for (const item of photoAudit) {
    const response = await fetch(item.pageUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; JeonbukTourGuide/1.0)' }
    });
    const html = await response.text();
    const overview = extractOverview(html);
    const phone = stripPhoneLabel(extractDefinition(html, 'tel'));
    const homepage = extractHref(html, 'site');
    const address = extractDefinition(html, 'location');

    const detail = {
      overview,
      highlight: firstSentence(overview),
      phone,
      homepage,
      officialAddress: address
    };
    Object.assign(detail, VERIFIED_DETAIL_OVERRIDES[item.id] || {});
    detail.highlight = firstSentence(detail.overview);
    details[item.id] = detail;
    auditRows.push({
      id: item.id,
      name: item.name,
      sourceUrl: item.pageUrl,
      overviewLength: overview.length,
      phone,
      homepage,
      address
    });
    process.stdout.write(
      `${item.id.padEnd(5)} overview=${String(overview.length).padStart(4)} phone=${phone ? 'Y' : '-'} homepage=${homepage ? 'Y' : '-'}\n`
    );
  }

  const script = `// 투어전북 공식 관광정보 페이지에서 확인한 상세 정보
// 생성: node scripts/sync_official_details.js

const OFFICIAL_TOUR_DETAILS = ${escapeScriptJSON(details)};

Object.values(JEONBUK_REGIONS).forEach((region) => {
  region.tours.forEach((tour) => {
    const detail = OFFICIAL_TOUR_DETAILS[tour.id];
    if (!detail) return;
    Object.assign(tour, detail, {
      recommendedDuration: detail.recommendedDuration || (${inferDuration.toString()})(tour.name, tour.category),
      recommendedFor: detail.recommendedFor || (${inferAudience.toString()})(tour.category),
      visitTip: detail.visitTip || (${inferVisitTip.toString()})(tour.name, tour.category)
    });
  });
});
`;

  fs.writeFileSync(path.join(ROOT, 'js', 'tourDetails.js'), script, 'utf8');
  fs.writeFileSync(
    path.join(__dirname, 'official_detail_audit.json'),
    JSON.stringify(auditRows, null, 2),
    'utf8'
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

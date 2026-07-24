const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PROJECT_ROOT, "js", "tourData.js");
const IMAGE_DIR = path.join(PROJECT_ROOT, "images", "spots");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "js", "tourImages.js");
const BASE_URL = "https://tour.jb.go.kr";

const SEARCH_ALIASES = {
  "jj-1": "전주한옥마을",
  "jj-2": "경기전",
  "jj-3": "덕진공원",
  "jj-4": "전동성당",
  "jj-5": "전주 남부시장",
  "gs-1": "선유도",
  "gs-2": "군산근대역사박물관",
  "gs-3": "이성당",
  "gs-4": "경암동 철길마을",
  "is-1": "미륵사지",
  "is-2": "아가페정원",
  "ju-1": "내장산국립공원",
  "ju-2": "쌍화차거리",
  "nw-1": "광한루원",
  "nw-2": "뱀사골",
  "gj-1": "벽골제",
  "gj-2": "금산사",
  "wj-1": "아원고택",
  "wj-2": "대둔산도립공원",
  "ja-1": "마이산 탑사",
  "ja-2": "진안홍삼스파",
  "mj-1": "덕유산",
  "mj-2": "무주머루와인동굴",
  "js-1": "의암사",
  "js-2": "방화동자연휴양림",
  "im-1": "임실치즈테마파크",
  "im-2": "옥정호 붕어섬",
  "sc-1": "강천산",
  "sc-2": "고추장민속마을",
  "gc-1": "학원농장",
  "gc-2": "고창읍성",
  "ba-1": "채석강",
  "ba-2": "내소사",
};

const OFFICIAL_FALLBACKS = {
  "jj-5": {
    title: "전주 남부시장",
    source: "투어전북",
    url: "https://tour.jb.go.kr/travel/info/view.do?category_top_id=a&contentsSid=38&ctnt_id=102&menuCd=DOM_000000102003002000"
  },
  "gs-3": {
    title: "이성당",
    source: "대한민국 구석구석",
    url: "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=309f5605-5964-4a41-ba18-05a8d3151c17"
  },
  "gs-4": {
    title: "경암동 철길마을",
    source: "대한민국 구석구석",
    url: "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=1a3dfa97-421e-4b7b-a429-015c4076615c"
  },
  "is-2": {
    title: "아가페정원",
    source: "대한민국 구석구석",
    url: "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=d206b56e-b8ec-44d2-801f-64e73d5c3800"
  },
  "wj-1": {
    title: "아원고택과 오성한옥마을",
    source: "대한민국 구석구석",
    url: "https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=7f616212-8b00-4a45-88bb-d1d7aec466ef"
  },
  "ja-1": {
    title: "마이산 탑사",
    source: "진안군 문화관광",
    url: "https://www.jinan.go.kr/tour/board/view.jtour?boardId=BBS_0000001&dataSid=592&menuCd=DOM_000000102000000000&paging=ok&startPage=1",
    imageUrl: "https://www.jinan.go.kr/tour/upload_data/board_data/BBS_0000001/176524184368347.jpg"
  },
  "mj-2": {
    title: "무주 머루와인동굴",
    source: "무주군 문화관광",
    url: "https://tour.muju.go.kr/cave/contents.do?key=365",
    imageUrl: "https://tour.muju.go.kr/cave/images/contents/cts365_img01.jpg"
  },
  "js-1": {
    title: "논개사당(의암공원)",
    source: "장수군 문화관광",
    url: "https://www.jangsu.go.kr/tour/index.jangsu?menuCd=DOM_000000402001006000",
    imageUrl: "https://www.jangsu.go.kr/upload_data/board_data/BBS_0000004/156930602200162.jpg"
  },
  "js-2": {
    title: "방화동가족휴가촌·자연휴양림",
    source: "장수군 문화관광",
    url: "https://www.jangsu.go.kr/tour/index.jangsu?menuCd=DOM_000000402001001000",
    imageUrl: "https://www.jangsu.go.kr/upload_data/board_data/BBS_0000004/156893926241068.jpg"
  }
};

const CATEGORY_PREFIXES = [
  "관광지", "수목원", "공원", "휴양림", "문화시설", "추천음식",
  "음식점", "축제", "체험", "쇼핑", "레저"
];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(value) {
  let text = decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  for (const prefix of CATEGORY_PREFIXES) {
    if (text.startsWith(`${prefix} `)) {
      text = text.slice(prefix.length + 1).trim();
      break;
    }
  }
  return text;
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/&.*$/g, "")
    .replace(/[^0-9a-z가-힣]/g, "");
}

function scoreTitle(title, query) {
  const normalizedTitle = normalize(title);
  const normalizedQuery = normalize(query);
  if (normalizedTitle === normalizedQuery) return 100;
  if (normalizedTitle.includes(normalizedQuery)) return 80;
  if (normalizedQuery.includes(normalizedTitle)) return 60;

  let common = 0;
  for (const char of new Set(normalizedQuery)) {
    if (normalizedTitle.includes(char)) common += 1;
  }
  return common;
}

function loadTours() {
  const context = {};
  const source = fs.readFileSync(DATA_PATH, "utf8");
  vm.runInNewContext(`${source}\n;globalThis.__regions = JEONBUK_REGIONS;`, context);
  return Object.values(context.__regions).flatMap((region) => region.tours);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "JeonbukTourMap/1.0 (tourism-data-verification)"
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function findOfficialPage(query) {
  const searchUrl = new URL("/travel/info/list.do", BASE_URL);
  searchUrl.searchParams.set("category_top_id", "a");
  searchUrl.searchParams.set("contentsSid", "30");
  searchUrl.searchParams.set("menuCd", "DOM_000000110002002000");
  searchUrl.searchParams.set("order_by", "5");
  searchUrl.searchParams.set("pageindex", "1");
  searchUrl.searchParams.set("sk", query);

  const html = await fetchText(searchUrl);
  const linkPattern = /<a[^>]+href="([^"]*ctnt_id=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const candidates = [];
  let match;

  while ((match = linkPattern.exec(html))) {
    const title = stripHtml(match[2]);
    if (!title || title.length > 80) continue;
    const url = new URL(decodeHtml(match[1]), BASE_URL).href;
    candidates.push({ title, url, score: scoreTitle(title, query) });
  }

  return candidates.sort((a, b) => b.score - a.score)[0] || null;
}

async function getOfficialImage(page) {
  let imageUrl = page.imageUrl || "";
  if (!imageUrl) {
    const html = await fetchText(page.url);
    const attachedImage = /<img[^>]+src="(\/attachfiles\/ctnt\/[^"]+)"[^>]*>/i.exec(html);
    const ogImage = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i.exec(html);
    const candidate = attachedImage?.[1] || ogImage?.[1];
    if (!candidate) return null;
    imageUrl = new URL(decodeHtml(candidate), page.url).href;
  }

  const response = await fetch(imageUrl, {
    headers: {
      "user-agent": "JeonbukTourMap/1.0 (tourism-data-verification)",
      "referer": page.url
    }
  });
  if (!response.ok) {
    throw new Error(`image ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const bytes = Buffer.from(await response.arrayBuffer());
  return { imageUrl, extension, bytes };
}

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const tours = loadTours();
  const results = {};
  const audit = [];

  for (const tour of tours) {
    const query = SEARCH_ALIASES[tour.id] || tour.name;
    try {
      const searchedPage = await findOfficialPage(query);
      const fallback = OFFICIAL_FALLBACKS[tour.id];
      const page = searchedPage && searchedPage.score >= 5
        ? { ...searchedPage, source: "투어전북" }
        : fallback
          ? { ...fallback, score: 100 }
          : null;
      if (!page || page.score < 5) {
        audit.push({ id: tour.id, name: tour.name, query, status: "page-not-found" });
        continue;
      }

      const officialImage = await getOfficialImage(page);
      if (!officialImage) {
        audit.push({ id: tour.id, name: tour.name, query, status: "image-not-found", matchedTitle: page.title, pageUrl: page.url });
        continue;
      }

      const fileName = `${tour.id}.${officialImage.extension}`;
      fs.writeFileSync(path.join(IMAGE_DIR, fileName), officialImage.bytes);
      results[tour.id] = {
        image: `images/spots/${fileName}`,
        imageSource: page.source || "투어전북",
        sourceUrl: page.url,
        officialTitle: page.title,
        imageUsageNote: page.source === "장수군 문화관광" ? "공공누리 제4유형" : ""
      };
      audit.push({
        id: tour.id,
        name: tour.name,
        query,
        status: "ok",
        matchedTitle: page.title,
        pageUrl: page.url,
        imageUrl: officialImage.imageUrl,
        bytes: officialImage.bytes.length
      });
      console.log(`[ok] ${tour.name} -> ${page.title}`);
    } catch (error) {
      audit.push({ id: tour.id, name: tour.name, query, status: "error", error: error.message });
      console.error(`[error] ${tour.name}: ${error.message}`);
    }
  }

  const js = `// 투어전북 공식 관광정보 페이지에서 확인한 장소별 대표 이미지\n` +
    `// 생성: node scripts/sync_official_photos.js\n\n` +
    `const OFFICIAL_TOUR_IMAGES = ${JSON.stringify(results, null, 2)};\n\n` +
    `Object.values(JEONBUK_REGIONS).forEach((region) => {\n` +
    `  region.tours.forEach((tour) => {\n` +
    `    const official = OFFICIAL_TOUR_IMAGES[tour.id];\n` +
    `    if (official) Object.assign(tour, official);\n` +
    `  });\n` +
    `});\n`;

  fs.writeFileSync(OUTPUT_PATH, js, "utf8");
  fs.writeFileSync(path.join(PROJECT_ROOT, "scripts", "official_photo_audit.json"), JSON.stringify(audit, null, 2), "utf8");

  const okCount = audit.filter((item) => item.status === "ok").length;
  console.log(`\n완료: ${okCount}/${tours.length}`);
  if (okCount !== tours.length) process.exitCode = 2;
}

main();

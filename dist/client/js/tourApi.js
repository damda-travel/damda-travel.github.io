/**
 * 한국관광공사 국문 관광정보 서비스_GW (공공데이터포털) 연동 모듈
 * 2025년 변경된 KorService2 엔드포인트 기준
 */

const TOUR_API_CONFIG = {
  baseUrl: 'https://apis.data.go.kr/B551011/KorService2',
  areaCodeJeonbuk: 37, // 전라북도 지역 코드
  
  // 시군구 코드 매핑 (TourAPI 4.0 전북 기준)
  sigunguMapping: {
    jeonju: 7,     // 전주시
    gunsan: 11,    // 군산시
    iksan: 4,      // 익산시
    jeongeup: 8,   // 정읍시
    namwon: 1,     // 남원시
    gimje: 12,     // 김제시
    wanju: 14,     // 완주군
    jinan: 9,      // 진안군
    muju: 13,      // 무주군
    jangsu: 6,     // 장수군
    imsil: 5,      // 임실군
    sunchang: 3,   // 순창군
    gochang: 10,   // 고창군
    buan: 2        // 부안군
  },

  // 시군구 코드로 역매핑
  sigunguReverseMapping: {
    7: 'jeonju',
    11: 'gunsan',
    4: 'iksan',
    8: 'jeongeup',
    1: 'namwon',
    12: 'gimje',
    14: 'wanju',
    9: 'jinan',
    13: 'muju',
    6: 'jangsu',
    5: 'imsil',
    3: 'sunchang',
    10: 'gochang',
    2: 'buan'
  },

  // 카테고리 / contentTypeId 매핑
  contentTypeMapping: {
    food: 39,      // 음식점
    culture: 14,   // 문화시설 (12: 관광지 포함)
    nature: 12,    // 관광지 (자연/산/계곡/해변)
    festival: 15   // 행사/축제
  }
};

class TourApiClient {
  constructor() {
    this.apiKey = localStorage.getItem('JEONBUK_TOUR_API_KEY') || '';
    this.isLiveMode = false;
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem('JEONBUK_TOUR_API_KEY', this.apiKey);
    } else {
      localStorage.removeItem('JEONBUK_TOUR_API_KEY');
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  hasValidKey() {
    return this.apiKey && this.apiKey.length > 5;
  }

  getRequestServiceKey() {
    // 공공데이터포털은 Encoding/Decoding 키를 모두 제공하므로 이미 인코딩된 키는 다시 인코딩하지 않습니다.
    return /%[0-9A-Fa-f]{2}/.test(this.apiKey) ? this.apiKey : encodeURIComponent(this.apiKey);
  }

  /**
   * 지역 기반 관광정보 조회 (areaBasedList2)
   */
  async fetchAreaBasedList(regionId = null, contentTypeId = null, pageNo = 1, numOfRows = 500) {
    if (!this.hasValidKey()) {
      console.warn('[TourAPI] API 키가 설정되지 않아 Mock 데이터를 사용합니다.');
      return null;
    }

    try {
      let url = `${TOUR_API_CONFIG.baseUrl}/areaBasedList2?serviceKey=${this.getRequestServiceKey()}`
        + `&numOfRows=${numOfRows}&pageNo=${pageNo}&MobileOS=ETC&MobileApp=JeonbukTourMap&_type=json`
        + `&areaCode=${TOUR_API_CONFIG.areaCodeJeonbuk}`;

      if (regionId && TOUR_API_CONFIG.sigunguMapping[regionId]) {
        url += `&sigunguCode=${TOUR_API_CONFIG.sigunguMapping[regionId]}`;
      }

      if (contentTypeId) {
        url += `&contentTypeId=${contentTypeId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error status: ${response.status}`);
      }

      const data = await response.json();
      if (data.response && data.response.header.resultCode === '0000') {
        const items = data.response?.body?.items?.item || [];
        return this.parseApiItems(items);
      } else {
        console.error('[TourAPI] API Error Result:', data.response?.header?.resultMsg);
        return null;
      }
    } catch (error) {
      console.error('[TourAPI] Fetch Error:', error);
      return null;
    }
  }

  /**
   * 키워드 검색 조회 (searchKeyword2)
   */
  async fetchKeywordSearch(keyword, pageNo = 1, numOfRows = 100) {
    if (!this.hasValidKey() || !keyword) return null;

    try {
      const url = `${TOUR_API_CONFIG.baseUrl}/searchKeyword2?serviceKey=${this.getRequestServiceKey()}`
        + `&numOfRows=${numOfRows}&pageNo=${pageNo}&MobileOS=ETC&MobileApp=JeonbukTourMap&_type=json`
        + `&areaCode=${TOUR_API_CONFIG.areaCodeJeonbuk}&keyword=${encodeURIComponent(keyword)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.response && data.response.header.resultCode === '0000') {
        const items = data.response?.body?.items?.item || [];
        return this.parseApiItems(items);
      }
      return null;
    } catch (error) {
      console.error('[TourAPI] Keyword Search Error:', error);
      return null;
    }
  }

  /**
   * TourAPI 결과 아이템을 앱 데이터 표준 포맷으로 변환
   */
  parseApiItems(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    return items.map(item => {
      const regionId = TOUR_API_CONFIG.sigunguReverseMapping[item.sigungucode] || 'jeonju';
      const regionName = typeof JEONBUK_REGIONS !== 'undefined' && JEONBUK_REGIONS[regionId]
        ? JEONBUK_REGIONS[regionId].name
        : '전북';
      
      let category = 'culture';
      let categoryName = '역사/문화';

      if (item.contenttypeid == '39' || item.cat1 === 'A05') {
        category = 'food';
        categoryName = '맛집/카페';
      } else if (item.contenttypeid == '15') {
        category = 'festival';
        categoryName = '축제/행사';
      } else if (item.cat1 === 'A01') {
        category = 'nature';
        categoryName = '자연/힐링';
      }

      const copyrightType = item.cpyrhtDivCd === 'Type1'
        ? '공공누리 1유형'
        : item.cpyrhtDivCd === 'Type3'
          ? '공공누리 3유형'
          : '';

      return {
        id: `api-${item.contentid}`,
        name: item.title,
        category: category,
        categoryName: categoryName,
        address: item.addr1 || item.addr2 || '전라북도 상세 정보 참조',
        image: item.firstimage || item.firstimage2 || '',
        imageSource: '한국관광공사 TourAPI',
        sourceUrl: `https://korean.visitkorea.or.kr/search/search_list.do?keyword=${encodeURIComponent(item.title)}`,
        imageUsageNote: copyrightType,
        tags: [`#${item.title.split(' ')[0]}`, `#전북관광`, `#공공데이터`],
        desc: item.addr1 ? `[공공데이터포털 제공] ${item.addr1}에 위치한 대표 관광지입니다.` : '한국관광공사 TourAPI를 통해 제공되는 관광정보입니다.',
        regionId: regionId,
        regionName: regionName,
        mapX: item.mapx,
        mapY: item.mapy,
        isLiveApi: true
      };
    });
  }
}

// Global API Instance
const tourApiClient = new TourApiClient();

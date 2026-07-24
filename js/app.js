/**
 * 전북 관광 정보 지도 - 탐색, 저장, 여행 플래너 및 접근성 컨트롤러
 */

// Application State
let currentSelectedRegion = null;
let currentSelectedCategory = 'all';
let currentSearchQuery = '';
let currentSortOrder = 'recommended';
let currentLiveApiData = [];
let currentPlan = [];
let showSavedOnly = false;
let activeTourId = null;
let lastFocusedElement = null;
let searchDebounceTimer = null;
let visibleResultLimit = 24;
let lastResultSignature = '';
const RESULTS_PAGE_SIZE = 24;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const tourCardList = document.getElementById('tourCardList');
const regionChips = document.getElementById('regionChips');
const bannerBadge = document.getElementById('bannerBadge');
const bannerTitle = document.getElementById('bannerTitle');
const bannerCount = document.getElementById('bannerCount');
const bannerDesc = document.getElementById('bannerDesc');
const filterSummary = document.getElementById('filterSummary');
const savedOnlyBtn = document.getElementById('savedOnlyBtn');
const savedCount = document.getElementById('savedCount');
const mobileSavedCount = document.getElementById('mobileSavedCount');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreLabel = document.getElementById('loadMoreLabel');

const apiStatusBadge = document.getElementById('apiStatusBadge');
const apiStatusText = document.getElementById('apiStatusText');
const apiModal = document.getElementById('apiModal');
const apiKeyInput = document.getElementById('apiKeyInput');

const courseGrid = document.getElementById('courseGrid');
const courseSection = document.getElementById('courseSection');
const plannerSection = document.getElementById('plannerSection');
const plannerRegion = document.getElementById('plannerRegion');
const plannerResult = document.getElementById('plannerResult');

const tourModal = document.getElementById('tourModal');
const modalImg = document.getElementById('modalImg');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalAddress = document.getElementById('modalAddress');
const modalDesc = document.getElementById('modalDesc');
const modalDescToggle = document.getElementById('modalDescToggle');
const modalTags = document.getElementById('modalTags');
const modalDuration = document.getElementById('modalDuration');
const modalRecommendedFor = document.getElementById('modalRecommendedFor');
const modalDetailSection = document.getElementById('modalDetailSection');
const modalDetailGrid = document.getElementById('modalDetailGrid');
const modalVisitTip = document.getElementById('modalVisitTip');
const modalVisitTipText = document.getElementById('modalVisitTipText');
const modalVisitNotice = document.getElementById('modalVisitNotice');
const modalStatusLabel = document.getElementById('modalStatusLabel');

const savedDrawer = document.getElementById('savedDrawer');
const savedList = document.getElementById('savedList');
const savedPlanBtn = document.getElementById('savedPlanBtn');
const appToast = document.getElementById('appToast');

document.addEventListener('DOMContentLoaded', () => {
  initRegionChips();
  initPlannerRegions();
  renderRecommendedCourses();
  restoreSavedPlan();
  updateApiStatusBadge();
  updateSavedUI();
  updateUI();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (tourModal?.classList.contains('active')) {
    closeModal();
  } else if (savedDrawer?.classList.contains('active')) {
    closeSavedPanel();
  } else if (apiModal?.classList.contains('active')) {
    closeApiModal();
  }
});

const textEntityDecoder = document.createElement('textarea');

function decodeTextEntities(value = '') {
  textEntityDecoder.innerHTML = String(value);
  return textEntityDecoder.value;
}

function escapeHTML(value = '') {
  return decodeTextEntities(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCurrentEventStatus(period = '') {
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

function getDisplaySubcategory(tour) {
  if (tour.category !== 'food' || tour.subCategory !== '관광지') return tour.subCategory;
  if (/시장|장터/.test(tour.name)) return '전통시장';
  if (/카페|커피|다방/.test(tour.name)) return '카페';
  if (/빵|제과|베이커리/.test(tour.name)) return '베이커리';
  return '미식 명소';
}

function getAllTours() {
  const tours = [];
  Object.entries(JEONBUK_REGIONS).forEach(([regionId, region]) => {
    region.tours.forEach(tour => {
      tours.push({
        ...tour,
        eventStatus: tour.eventPeriod ? getCurrentEventStatus(tour.eventPeriod) : tour.eventStatus,
        subCategory: getDisplaySubcategory(tour),
        regionId,
        regionName: region.name
      });
    });
  });
  return tours;
}

function findTourById(tourId) {
  const apiTour = currentLiveApiData.find(tour => tour.id === tourId);
  return apiTour || getAllTours().find(tour => tour.id === tourId) || null;
}

function getSavedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem('jeonbuk_bookmarks') || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(id => typeof id === 'string'))] : [];
  } catch {
    return [];
  }
}

function setSavedIds(ids) {
  localStorage.setItem('jeonbuk_bookmarks', JSON.stringify([...new Set(ids)]));
  updateSavedUI();
}

function initRegionChips() {
  let html = '<button type="button" class="chip-btn active" data-id="all" onclick="resetSelection()">전북 전체</button>';
  Object.keys(JEONBUK_REGIONS).forEach(key => {
    const region = JEONBUK_REGIONS[key];
    html += `<button type="button" class="chip-btn" data-id="${escapeHTML(region.id)}" onclick="selectRegion('${escapeHTML(region.id)}')">${escapeHTML(region.name)}</button>`;
  });
  regionChips.innerHTML = html;
}

function initPlannerRegions() {
  if (!plannerRegion) return;
  Object.keys(JEONBUK_REGIONS).forEach(key => {
    const region = JEONBUK_REGIONS[key];
    const option = document.createElement('option');
    option.value = region.id;
    option.textContent = region.name;
    plannerRegion.appendChild(option);
  });
}

function selectRegion(regionId) {
  currentSelectedRegion = JEONBUK_REGIONS[regionId] ? regionId : null;
  currentSearchQuery = '';
  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  updateUI();
  if (window.innerWidth <= 1100) scrollToResults();
}

function resetSelection() {
  currentSelectedRegion = null;
  currentSelectedCategory = 'all';
  currentSearchQuery = '';
  currentSortOrder = 'recommended';
  showSavedOnly = false;

  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'recommended';
  document.querySelectorAll('.cat-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.category === 'all');
  });
  updateUI();
}

function setCategory(categoryKey, btnElem) {
  if (categoryKey === 'course') {
    scrollToSection('courseSection');
    return;
  }

  currentSelectedCategory = categoryKey;
  document.querySelectorAll('.cat-btn').forEach(button => button.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');
  updateUI();
}

function handleSearch(event) {
  const nextQuery = event.target.value.trim().toLowerCase();
  currentSearchQuery = nextQuery;
  if (searchClearBtn) searchClearBtn.style.display = nextQuery ? 'block' : 'none';

  // 통합 검색은 이전 지역·테마 필터를 해제해 전북 전체에서 결과를 찾습니다.
  if (nextQuery) {
    currentSelectedRegion = null;
    currentSelectedCategory = 'all';
    document.querySelectorAll('.cat-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.category === 'all');
    });
  }

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(updateUI, tourApiClient.hasValidKey() ? 350 : 80);
}

function clearSearch() {
  if (searchInput) searchInput.value = '';
  currentSearchQuery = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  updateUI();
}

function setSortOrder(sortOrder) {
  currentSortOrder = ['recommended', 'name', 'region'].includes(sortOrder) ? sortOrder : 'recommended';
  updateUI();
}

function toggleSavedOnly() {
  showSavedOnly = !showSavedOnly;
  updateUI();
}

async function updateUI() {
  const allTours = getAllTours();
  const categoryCounts = allTours.reduce((counts, tour) => {
    counts[tour.category] = (counts[tour.category] || 0) + 1;
    return counts;
  }, { all: allTours.length });
  document.querySelectorAll('[data-count-category]').forEach(element => {
    const category = element.dataset.countCategory;
    element.textContent = (categoryCounts[category] || 0).toLocaleString('ko-KR');
  });

  document.querySelectorAll('.illust-pin').forEach(pin => {
    const pinRegion = pin.id.replace('pin-', '');
    pin.classList.toggle('active', pinRegion === currentSelectedRegion);
    pin.setAttribute('aria-pressed', String(pinRegion === currentSelectedRegion));
  });

  document.querySelectorAll('.chip-btn').forEach(chip => {
    const chipId = chip.dataset.id;
    const isActive = (chipId === 'all' && !currentSelectedRegion) || chipId === currentSelectedRegion;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });

  if (currentSelectedRegion && JEONBUK_REGIONS[currentSelectedRegion]) {
    const region = JEONBUK_REGIONS[currentSelectedRegion];
    bannerBadge.textContent = region.badge || '추천 관광지';
    bannerTitle.textContent = `${region.name} 관광 안내`;
    bannerDesc.textContent = region.description;
  } else {
    bannerBadge.textContent = currentSearchQuery ? '통합 검색' : '전북 전체';
    bannerTitle.textContent = currentSearchQuery ? `'${searchInput.value.trim()}' 검색 결과` : '전라북도 대표 명소';
    bannerDesc.textContent = currentSearchQuery
      ? '전북 14개 시·군 전체에서 관광지명, 지역, 주소와 키워드를 검색했습니다.'
      : '14개 시·군의 실제 명소 사진을 비교하고, 지역과 테마에 맞춰 여행지를 골라보세요.';
  }

  const filteredTours = await getFilteredTourList();
  const resultSignature = [
    currentSelectedRegion || 'all',
    currentSelectedCategory,
    currentSearchQuery,
    currentSortOrder,
    showSavedOnly
  ].join('|');
  if (resultSignature !== lastResultSignature) {
    visibleResultLimit = RESULTS_PAGE_SIZE;
    lastResultSignature = resultSignature;
  }

  bannerCount.textContent = `${filteredTours.length.toLocaleString('ko-KR')}개 장소`;
  const totalCountPill = document.getElementById('totalTourCount');
  if (totalCountPill) totalCountPill.textContent = `${allTours.length.toLocaleString('ko-KR')}개 여행정보`;

  updateToolbarState(filteredTours.length);
  renderTourCards(filteredTours);
}

async function getFilteredTourList() {
  if (tourApiClient.hasValidKey()) {
    const contentTypeId = ['food', 'festival'].includes(currentSelectedCategory)
      ? TOUR_API_CONFIG.contentTypeMapping[currentSelectedCategory]
      : null;
    let apiResults = [];

    if (currentSearchQuery) {
      apiResults = await tourApiClient.fetchKeywordSearch(currentSearchQuery);
    } else {
      apiResults = await tourApiClient.fetchAreaBasedList(currentSelectedRegion, contentTypeId);
    }

    if (apiResults?.length) {
      const categoryFiltered = currentSelectedCategory === 'all'
        ? apiResults
        : apiResults.filter(tour => tour.category === currentSelectedCategory);
      currentLiveApiData = categoryFiltered;
      return sortTours(filterSavedTours(categoryFiltered));
    }
  }

  let tours = getAllTours();
  if (currentSelectedRegion) {
    tours = tours.filter(tour => tour.regionId === currentSelectedRegion);
  }
  if (currentSelectedCategory !== 'all') {
    tours = tours.filter(tour => tour.category === currentSelectedCategory);
  }
  if (currentSearchQuery) {
    tours = tours.filter(tour => {
      const searchable = [
        tour.name,
        tour.regionName,
        tour.address,
        tour.desc,
        tour.overview,
        tour.subCategory,
        tour.eventPeriod,
        tour.eventStatus,
        ...(tour.tags || [])
      ].join(' ').toLowerCase();
      return searchable.includes(currentSearchQuery);
    });
  }

  return sortTours(filterSavedTours(tours));
}

function filterSavedTours(tours) {
  if (!showSavedOnly) return tours;
  const saved = new Set(getSavedIds());
  return tours.filter(tour => saved.has(tour.id));
}

function sortTours(tours) {
  const sorted = [...tours];
  if (currentSortOrder === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else if (currentSortOrder === 'region') {
    sorted.sort((a, b) => {
      const regionCompare = (a.regionName || '').localeCompare(b.regionName || '', 'ko');
      return regionCompare || a.name.localeCompare(b.name, 'ko');
    });
  }
  return sorted;
}

function updateToolbarState(resultCount) {
  if (savedOnlyBtn) {
    savedOnlyBtn.classList.toggle('active', showSavedOnly);
    savedOnlyBtn.innerHTML = showSavedOnly
      ? '<i class="fa-solid fa-bookmark"></i> 저장한 장소만'
      : '<i class="fa-regular fa-bookmark"></i> 저장한 장소만';
    savedOnlyBtn.setAttribute('aria-pressed', String(showSavedOnly));
  }

  const categoryName = {
    all: '전체 테마',
    food: '맛집·카페',
    culture: '역사·문화',
    nature: '자연·힐링',
    festival: '축제·행사'
  }[currentSelectedCategory];
  const parts = [
    currentSelectedRegion ? JEONBUK_REGIONS[currentSelectedRegion].name : '전북 전체',
    categoryName,
    showSavedOnly ? '저장한 장소' : null
  ].filter(Boolean);
  filterSummary.textContent = `${parts.join(' · ')}에서 ${resultCount}곳을 보고 있습니다.`;
}

function renderTourCards(tours) {
  if (!tours?.length) {
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    tourCardList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-map-location"></i>
        <h3>${showSavedOnly ? '저장한 장소가 없습니다' : '검색된 관광명소가 없습니다'}</h3>
        <p>${showSavedOnly ? '관광지 상세 화면에서 장소를 저장해보세요.' : '검색어나 지역·테마 필터를 바꿔보세요.'}</p>
        <button type="button" class="empty-reset-btn" onclick="resetSelection()">전체 관광지 보기</button>
      </div>
    `;
    return;
  }

  const saved = new Set(getSavedIds());
  const visibleTours = tours.slice(0, visibleResultLimit);
  tourCardList.innerHTML = visibleTours.map(tour => {
    const tags = (tour.tags || []).slice(0, 3).map(tag => `<span class="tag-item">${escapeHTML(tag)}</span>`).join('');
    const savedBadge = saved.has(tour.id)
      ? '<span class="card-saved-badge"><i class="fa-solid fa-bookmark"></i> 저장됨</span>'
      : '<span class="card-view-badge"><i class="fa-solid fa-arrow-right"></i></span>';
    const imageMarkup = tour.image
      ? `<img src="${escapeHTML(tour.image)}" alt="${escapeHTML(tour.name)}" loading="lazy" onerror="handleImageError(this)">`
      : '';
    const eventMeta = tour.eventPeriod
      ? `<div class="card-event-meta">
          <span class="event-status ${tour.eventStatus === '진행 중' ? 'active' : ''}">${escapeHTML(tour.eventStatus || '일정 확인')}</span>
          <span><i class="fa-regular fa-calendar"></i> ${escapeHTML(tour.eventPeriod)}</span>
        </div>`
      : tour.subCategory
        ? `<div class="card-subcategory"><i class="fa-solid fa-circle-info"></i> ${escapeHTML(tour.subCategory)}</div>`
        : '';

    return `
      <button type="button" class="tour-card" onclick="openModal('${escapeHTML(tour.id)}')" aria-label="${escapeHTML(tour.name)} 상세 정보 보기">
        <div class="card-img-box${tour.image ? '' : ' image-unavailable'}">
          ${imageMarkup}
          <span class="card-cat-badge">${escapeHTML(tour.categoryName)}</span>
          ${savedBadge}
        </div>
        <div class="card-content">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHTML(tour.name)}</h3>
            <span class="card-region-label">${escapeHTML(tour.regionName || '전북')}</span>
          </div>
          <p class="card-address"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(tour.address)}</p>
          ${eventMeta}
          <p class="card-desc">${escapeHTML(tour.desc)}</p>
          <div class="card-tags">${tags}</div>
        </div>
      </button>
    `;
  }).join('');

  if (loadMoreBtn) {
    const remaining = Math.max(0, tours.length - visibleTours.length);
    loadMoreBtn.hidden = remaining === 0;
    if (loadMoreLabel) {
      loadMoreLabel.textContent = remaining
        ? `더 많은 장소 보기 · ${remaining.toLocaleString('ko-KR')}곳 남음`
        : '전체 장소를 모두 불러왔습니다';
    }
  }
}

function loadMoreTours() {
  visibleResultLimit += RESULTS_PAGE_SIZE;
  updateUI();
}

function handleImageError(image) {
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.removeAttribute('src');
  image.alt = '';
  image.parentElement?.classList.add('image-unavailable');
}

function renderRecommendedCourses() {
  if (!courseGrid) return;
  courseGrid.innerHTML = RECOMMENDED_COURSES.map((course, index) => {
    const tags = course.tags.map(tag => `<span class="course-tag">#${escapeHTML(tag)}</span>`).join('');
    return `
      <button type="button" class="course-card" style="background:${course.bg}" onclick="applyRecommendedCourse(${index})">
        <div>
          <span class="course-period">${escapeHTML(course.period)}</span>
          <h3 class="course-title">${escapeHTML(course.title)}</h3>
          <p class="course-desc">${escapeHTML(course.desc)}</p>
        </div>
        <div class="course-card-footer">
          <div class="course-tags">${tags}</div>
          <span class="course-open-label">일정 보기 <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </button>
    `;
  }).join('');
}

function openModal(tourId) {
  const foundTour = findTourById(tourId);
  if (!foundTour) return;

  activeTourId = foundTour.id;
  lastFocusedElement = document.activeElement;
  const modalImageBox = modalImg.parentElement;
  modalImageBox?.classList.remove('image-unavailable');
  delete modalImg.dataset.fallbackApplied;
  if (foundTour.image) {
    modalImg.src = foundTour.image;
  } else {
    modalImg.removeAttribute('src');
    modalImageBox?.classList.add('image-unavailable');
  }
  modalImg.alt = foundTour.name;
  modalCategory.textContent = `${foundTour.regionName || '전북'} · ${foundTour.categoryName}`;
  modalTitle.textContent = foundTour.name;
  modalAddress.textContent = `📍 ${foundTour.address}`;
  const overviewText = decodeTextEntities(foundTour.overview || foundTour.desc);
  modalDesc.textContent = overviewText;
  modalDesc.classList.remove('expanded');
  modalDescToggle.hidden = overviewText.length <= 220;
  modalDescToggle.setAttribute('aria-expanded', 'false');
  modalDescToggle.innerHTML = '설명 더 보기 <i class="fa-solid fa-chevron-down"></i>';
  modalDescToggle.onclick = () => {
    const expanded = modalDesc.classList.toggle('expanded');
    modalDescToggle.setAttribute('aria-expanded', String(expanded));
    modalDescToggle.innerHTML = expanded
      ? '설명 접기 <i class="fa-solid fa-chevron-up"></i>'
      : '설명 더 보기 <i class="fa-solid fa-chevron-down"></i>';
  };
  modalTags.innerHTML = (foundTour.tags || []).map(tag => `<span class="tag-item">${escapeHTML(tag)}</span>`).join('');
  modalDuration.textContent = foundTour.recommendedDuration || '1~2시간';
  modalRecommendedFor.textContent = foundTour.recommendedFor || foundTour.categoryName || '전북 여행';
  if (modalStatusLabel) {
    modalStatusLabel.textContent = foundTour.eventStatus || foundTour.subCategory || '추천 명소';
  }

  const detailRows = [
    { icon: 'fa-regular fa-calendar', label: '행사 기간', value: foundTour.eventPeriod },
    { icon: 'fa-solid fa-signal', label: '행사 상태', value: foundTour.eventStatus },
    { icon: 'fa-regular fa-clock', label: '운영시간', value: foundTour.hours },
    { icon: 'fa-regular fa-calendar-xmark', label: '휴무일', value: foundTour.closed },
    { icon: 'fa-solid fa-ticket', label: '이용요금', value: foundTour.fee },
    { icon: 'fa-solid fa-square-parking', label: '주차', value: foundTour.parking },
    {
      icon: 'fa-solid fa-phone',
      label: '문의',
      value: foundTour.phone,
      href: foundTour.phone ? `tel:${foundTour.phone.replace(/[^\d+]/g, '')}` : ''
    },
    {
      icon: 'fa-solid fa-globe',
      label: '홈페이지',
      value: foundTour.homepage ? '공식 홈페이지 열기' : '',
      href: foundTour.homepage
    },
    {
      icon: 'fa-solid fa-shield-halved',
      label: '정보 출처',
      value: '공식 관광정보 확인',
      href: foundTour.sourceUrl || (foundTour.isLiveApi
        ? 'https://korean.visitkorea.or.kr/main/cr_main.do'
        : 'https://tour.jb.go.kr/index.do')
    }
  ].filter(item => item.value);

  modalDetailGrid.innerHTML = detailRows.map(item => {
    const value = item.href
      ? `<a href="${escapeHTML(item.href)}" ${item.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHTML(item.value)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : `<strong>${escapeHTML(item.value)}</strong>`;
    return `
      <div class="modal-detail-item">
        <i class="${item.icon}" aria-hidden="true"></i>
        <div>
          <span>${escapeHTML(item.label)}</span>
          ${value}
        </div>
      </div>
    `;
  }).join('');
  modalDetailSection.hidden = detailRows.length === 0;

  modalVisitTipText.textContent = foundTour.visitTip || '날씨와 운영 정보가 달라질 수 있으니 출발 전 공식 관광정보를 확인하세요.';
  modalVisitTip.hidden = !modalVisitTipText.textContent;
  const hasVisitInfo = Boolean(
    foundTour.hours || foundTour.closed || foundTour.fee ||
    foundTour.parking || foundTour.phone || foundTour.homepage ||
    foundTour.eventPeriod
  );
  modalVisitNotice.innerHTML = hasVisitInfo
    ? '<i class="fa-solid fa-circle-exclamation"></i> 운영시간·휴무일·요금은 변경될 수 있으니 방문 전 공식 페이지에서 다시 확인해주세요.'
    : '<i class="fa-solid fa-circle-exclamation"></i> 상세 운영 정보가 확인되지 않은 장소입니다. 방문 전 공식 관광정보를 확인해주세요.';

  const navBtn = document.getElementById('modalNavBtn');
  navBtn.href = `https://map.kakao.com/link/search/${encodeURIComponent(foundTour.name)}`;

  const bookmarkBtn = document.getElementById('modalBookmarkBtn');
  bookmarkBtn.onclick = () => toggleBookmark(foundTour.id);
  updateModalBookmarkButton(foundTour.id);

  const shareBtn = document.getElementById('modalShareBtn');
  shareBtn.onclick = () => shareTour(foundTour);

  const officialUrl = foundTour.sourceUrl || (foundTour.isLiveApi
    ? 'https://korean.visitkorea.or.kr/main/cr_main.do'
    : 'https://tour.jb.go.kr/index.do');
  const sourceName = foundTour.imageSource || (foundTour.isLiveApi ? '한국관광공사 TourAPI' : '공식 관광정보');
  const photoSource = document.getElementById('modalPhotoSource');
  photoSource.href = officialUrl;
  photoSource.textContent = `사진 · ${sourceName}`;
  photoSource.hidden = !foundTour.image;

  const officialSource = document.getElementById('modalOfficialSource');
  officialSource.href = officialUrl;
  officialSource.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHTML(sourceName)}에서 확인`;

  tourModal.classList.add('active');
  tourModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => tourModal.querySelector('.modal-close-btn')?.focus());
}

function closeModal(event) {
  if (event && event.target !== tourModal) return;
  tourModal.classList.remove('active');
  tourModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  activeTourId = null;
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function toggleBookmark(tourId) {
  const tour = findTourById(tourId);
  if (!tour) return;
  const saved = getSavedIds();
  const isSaved = saved.includes(tourId);
  const nextSaved = isSaved ? saved.filter(id => id !== tourId) : [...saved, tourId];
  setSavedIds(nextSaved);
  updateModalBookmarkButton(tourId);
  updateUI();
  if (savedDrawer?.classList.contains('active')) renderSavedList();
  showToast(isSaved ? `${tour.name} 저장을 해제했습니다.` : `${tour.name}을 여행 보관함에 저장했습니다.`);
}

function updateModalBookmarkButton(tourId) {
  const button = document.getElementById('modalBookmarkBtn');
  if (!button) return;
  const isSaved = getSavedIds().includes(tourId);
  button.classList.toggle('bookmarked', isSaved);
  button.innerHTML = isSaved
    ? '<i class="fa-solid fa-bookmark"></i> 저장 완료'
    : '<i class="fa-regular fa-bookmark"></i> 장소 저장하기';
}

async function shareTour(tour) {
  const shareData = {
    title: `${tour.name} | 전북 관광 정보 지도`,
    text: `${tour.name} - ${tour.address}`,
    url: window.location.href.split('#')[0]
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      showToast('관광지 정보가 클립보드에 복사되었습니다.');
    } else {
      showToast('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('공유하지 못했습니다. 다시 시도해주세요.');
  }
}

function updateSavedUI() {
  const count = getSavedIds().length;
  if (savedCount) savedCount.textContent = String(count);
  if (mobileSavedCount) mobileSavedCount.textContent = count ? String(count) : '';
  if (savedPlanBtn) savedPlanBtn.disabled = count === 0;
}

function openSavedPanel() {
  lastFocusedElement = document.activeElement;
  renderSavedList();
  savedDrawer.classList.add('active');
  savedDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => savedDrawer.querySelector('.drawer-close-btn')?.focus());
}

function closeSavedPanel(event) {
  if (event && event.target !== savedDrawer) return;
  savedDrawer.classList.remove('active');
  savedDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function renderSavedList() {
  const tours = getSavedIds().map(findTourById).filter(Boolean);
  if (!tours.length) {
    savedList.innerHTML = `
      <div class="saved-empty">
        <i class="fa-regular fa-bookmark"></i>
        <h3>아직 저장한 장소가 없습니다</h3>
        <p>마음에 드는 관광지의 상세 화면에서 저장 버튼을 눌러보세요.</p>
      </div>
    `;
    return;
  }

  savedList.innerHTML = tours.map(tour => `
    <article class="saved-item">
      <button type="button" class="saved-item-main" onclick="openSavedTour('${escapeHTML(tour.id)}')">
        <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" onerror="handleImageError(this)">
        <span>
          <strong>${escapeHTML(tour.name)}</strong>
          <small>${escapeHTML(tour.regionName)} · ${escapeHTML(tour.categoryName)}</small>
        </span>
      </button>
      <button type="button" class="saved-remove-btn" onclick="toggleBookmark('${escapeHTML(tour.id)}')" aria-label="${escapeHTML(tour.name)} 저장 해제">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </article>
  `).join('');
}

function openSavedTour(tourId) {
  closeSavedPanel();
  openModal(tourId);
}

function generateTravelPlan(options = {}) {
  const duration = Number(options.duration || document.getElementById('plannerDuration').value);
  const theme = options.theme || document.getElementById('plannerTheme').value;
  const regionId = options.regionId || document.getElementById('plannerRegion').value;
  const targetCount = Math.max(1, duration) * 3;

  let candidates = options.tourIds?.length
    ? options.tourIds.map(findTourById).filter(Boolean)
    : getAllTours()
      .map((tour, originalIndex) => ({
        ...tour,
        plannerScore:
          (regionId !== 'all' && tour.regionId === regionId ? 100 : 0) +
          (theme !== 'all' && tour.category === theme ? 20 : 0),
        plannerIndex: originalIndex
      }))
      .sort((a, b) => b.plannerScore - a.plannerScore || a.plannerIndex - b.plannerIndex);

  const uniqueCandidates = [...new Map(candidates.map(tour => [tour.id, tour])).values()];
  currentPlan = uniqueCandidates.slice(0, Math.min(targetCount, uniqueCandidates.length));
  renderTravelPlan(duration, options.title || null);
  scrollToSection('plannerSection');
}

function renderTravelPlan(duration, customTitle = null) {
  if (!currentPlan.length) {
    plannerResult.innerHTML = '<div class="planner-empty"><p>선택한 조건에 맞는 관광지가 없습니다.</p></div>';
    return;
  }

  const dayGroups = [];
  for (let day = 0; day < duration; day += 1) {
    const stops = currentPlan.slice(day * 3, day * 3 + 3);
    if (stops.length) dayGroups.push(stops);
  }

  const daysHTML = dayGroups.map((stops, dayIndex) => `
    <section class="plan-day">
      <div class="plan-day-label">${dayIndex + 1}일차</div>
      <div class="plan-stops">
        ${stops.map((tour, stopIndex) => `
          <button type="button" class="plan-stop" onclick="openModal('${escapeHTML(tour.id)}')">
            <span class="plan-stop-number">${stopIndex + 1}</span>
            <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" onerror="handleImageError(this)">
            <span class="plan-stop-copy">
              <strong>${escapeHTML(tour.name)}</strong>
              <small>${escapeHTML(tour.regionName)} · ${escapeHTML(tour.categoryName)}</small>
            </span>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  plannerResult.innerHTML = `
    <div class="plan-result-header">
      <div>
        <span>추천 일정 초안</span>
        <h3>${escapeHTML(customTitle || `${duration === 1 ? '당일' : `${duration - 1}박 ${duration}일`} 전북 여행`)}</h3>
      </div>
      <div class="plan-header-actions">
        <button type="button" class="clear-plan-btn" onclick="clearCurrentPlan()">초기화</button>
        <button type="button" class="save-plan-btn" onclick="saveCurrentPlan()"><i class="fa-regular fa-floppy-disk"></i> 일정 저장</button>
      </div>
    </div>
    ${daysHTML}
    <p class="plan-disclaimer"><i class="fa-solid fa-circle-info"></i> 이동 거리와 운영시간은 반영하지 않은 일정 초안입니다. 방문 전 동선과 운영정보를 확인해주세요.</p>
  `;
}

function saveCurrentPlan() {
  if (!currentPlan.length) return;
  const title = document.querySelector('.plan-result-header h3')?.textContent.trim() || '저장된 전북 여행';
  const plan = {
    savedAt: new Date().toISOString(),
    title,
    tourIds: currentPlan.map(tour => tour.id)
  };
  localStorage.setItem('jeonbuk_travel_plan', JSON.stringify(plan));
  showToast('현재 여행 일정이 이 기기에 저장되었습니다.');
}

function restoreSavedPlan() {
  try {
    const savedPlan = JSON.parse(localStorage.getItem('jeonbuk_travel_plan') || 'null');
    if (!savedPlan || !Array.isArray(savedPlan.tourIds)) return;
    const restoredTours = savedPlan.tourIds.map(findTourById).filter(Boolean);
    if (!restoredTours.length) return;
    currentPlan = restoredTours;
    const duration = Math.max(1, Math.min(3, Math.ceil(restoredTours.length / 3)));
    const durationSelect = document.getElementById('plannerDuration');
    if (durationSelect) durationSelect.value = String(duration);
    renderTravelPlan(duration, savedPlan.title || '저장된 전북 여행');
  } catch {
    localStorage.removeItem('jeonbuk_travel_plan');
  }
}

function clearCurrentPlan() {
  currentPlan = [];
  localStorage.removeItem('jeonbuk_travel_plan');
  plannerResult.innerHTML = `
    <div class="planner-empty">
      <i class="fa-solid fa-map-location-dot"></i>
      <p>조건을 선택하고 일정 만들기를 눌러보세요.</p>
    </div>
  `;
  showToast('저장된 여행 일정을 초기화했습니다.');
}

function createPlanFromSaved() {
  const ids = getSavedIds();
  if (!ids.length) return;
  closeSavedPanel();
  const duration = Math.max(1, Math.min(3, Math.ceil(ids.length / 3)));
  document.getElementById('plannerDuration').value = String(duration);
  generateTravelPlan({ duration, tourIds: ids, title: '저장한 장소로 만든 여행' });
}

function applyRecommendedCourse(index) {
  const course = RECOMMENDED_COURSES[index];
  if (!course) return;
  const duration = course.period.includes('2박 3일') ? 3 : course.period.includes('1박 2일') ? 2 : 1;
  const ids = course.spotIds || [];
  document.getElementById('plannerDuration').value = String(duration);
  generateTravelPlan({ duration, tourIds: ids, title: course.title });
}

function showToast(message) {
  if (!appToast) return;
  appToast.textContent = message;
  appToast.classList.add('active');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => appToast.classList.remove('active'), 2600);
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToResults() {
  document.querySelector('.sidebar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateApiStatusBadge() {
  if (!apiStatusBadge || !apiStatusText) return;
  const isLive = tourApiClient.hasValidKey();
  apiStatusBadge.className = `api-status-badge ${isLive ? 'live' : 'mock'}`;
  apiStatusText.textContent = isLive ? '공공API 실시간 모드' : '공공API 설정';
}

function openApiModal() {
  lastFocusedElement = document.activeElement;
  apiKeyInput.value = tourApiClient.getApiKey();
  apiModal.classList.add('active');
  apiModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => apiKeyInput.focus());
}

function closeApiModal(event) {
  if (event && event.target !== apiModal) return;
  apiModal.classList.remove('active');
  apiModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function saveApiKey() {
  const key = apiKeyInput.value;
  tourApiClient.setApiKey(key);
  updateApiStatusBadge();
  closeApiModal();
  showToast(key ? '공공데이터 연동 키를 저장했습니다.' : '기본 관광지 데이터로 전환했습니다.');
  updateUI();
}

function clearApiKey() {
  tourApiClient.setApiKey('');
  apiKeyInput.value = '';
  updateApiStatusBadge();
  closeApiModal();
  showToast('저장된 연동 키를 삭제했습니다.');
  updateUI();
}

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
let visibleResultLimit = 6;
let lastResultSignature = '';
let currentLanguage = localStorage.getItem('jeonbuk_language') === 'ko' ? 'ko' : 'es';
let selectedPlannerRegions = new Set();
let activeRoutePreset = 'heritage';
const RESULTS_PAGE_SIZE = 6;

const REGION_NAMES_ES = {
  jeonju: 'Jeonju',
  gunsan: 'Gunsan',
  iksan: 'Iksan',
  jeongeup: 'Jeongeup',
  namwon: 'Namwon',
  gimje: 'Gimje',
  wanju: 'Wanju',
  jinan: 'Jinan',
  muju: 'Muju',
  jangsu: 'Jangsu',
  imsil: 'Imsil',
  sunchang: 'Sunchang',
  gochang: 'Gochang',
  buan: 'Buan'
};

const TOUR_NAMES_ES = {
  'jj-1': 'Aldea Hanok de Jeonju',
  'jj-2': 'Santuario Gyeonggijeon y Museo del Retrato Real',
  'jj-3': 'Parque Deokjin y Biblioteca Yeonhwajeong',
  'jj-4': 'Catedral de Jeondong',
  'jj-5': 'Mercado Nambu y Youth Mall',
  'gs-1': 'Archipiélago Gogunsan e isla Seonyudo',
  'gs-2': 'Museo de Historia Moderna de Gunsan',
  'gs-3': 'Panadería Lee Sung Dang',
  'gs-4': 'Aldea del Ferrocarril de Gyeongam-dong',
  'is-1': 'Sitio de Mireuksaji y pagoda de piedra',
  'is-2': 'Jardín Agape',
  'ju-1': 'Parque Nacional Naejangsan y pabellón Uhwajeong',
  'ju-2': 'Calle del ssanghwa-cha de Jeongeup',
  'nw-1': 'Jardín Gwanghalluwon y puente Ojakgyo',
  'nw-2': 'Valle Baemsagol de Jirisan',
  'gj-1': 'Byeokgolje y los campos dorados de Gimje',
  'gj-2': 'Templo Geumsansa en Moaksan',
  'wj-1': 'Casa tradicional Awon y aldea Hanok de Oseong',
  'wj-2': 'Daedunsan y puente colgante Geumgang',
  'ja-1': 'Templo Tapsa de Maisan',
  'ja-2': 'Spa de ginseng rojo de Jinan',
  'mj-1': 'Pico Hyangjeokbong y teleférico de Deogyusan',
  'mj-2': 'Cueva del vino de moras de Muju',
  'js-1': 'Santuario Uiamsa de Nongae',
  'js-2': 'Bosque recreativo Banghwadong',
  'im-1': 'Parque temático del queso de Imsil',
  'im-2': 'Lago Okjeong y puente colgante de Bungeoseom',
  'sc-1': 'Parque de Gangcheonsan y cascada Byeongpung',
  'sc-2': 'Aldea tradicional del gochujang de Sunchang',
  'gc-1': 'Campos de cebada verde de Gochang',
  'gc-2': 'Fortaleza Gochang-eupseong (Moyangseong)',
  'ba-1': 'Acantilados Chaeseokgang y Jeokbyeokgang',
  'ba-2': 'Templo Naesosa y bosque de abetos',
  'official-a-24396': 'Colina de flores Wansan'
};

const TOUR_DESCRIPTIONS_ES = {
  'jj-1': 'Un barrio histórico con más de 700 hanok, talleres tradicionales y calles ideales para recorrer a pie.',
  'jj-2': 'El santuario conserva el retrato del fundador de Joseon y valiosos archivos de la antigua familia real.',
  'jj-3': 'Un parque junto al lago, famoso por sus lotos de verano y una biblioteca contemporánea de estilo hanok.',
  'jj-4': 'Una catedral románica levantada en un antiguo sitio de martirio, junto a la aldea hanok.',
  'jj-5': 'Mercado tradicional con comida de Jeonju, puestos nocturnos y espacios gestionados por jóvenes.',
  'gs-1': 'Islas, playas y miradores unidos por puentes: una de las mejores escapadas costeras de Jeonbuk.',
  'gs-2': 'Un museo que explica el puerto, la ciudad moderna y la vida cotidiana de Gunsan durante el siglo XX.',
  'gs-3': 'La panadería histórica más conocida de Gunsan, famosa por sus panes rellenos de frijol rojo y verduras.',
  'gs-4': 'Casas y murales junto a una antigua vía férrea que atraviesa el corazón de un barrio residencial.',
  'is-1': 'Restos de un gran templo de Baekje y su pagoda de piedra, reconocidos como Patrimonio Mundial de la UNESCO.',
  'is-2': 'Un jardín privado de ambiente sereno con cipreses, senderos y rincones fotogénicos para caminar sin prisa.',
  'ju-1': 'Montañas de intenso color otoñal, senderos panorámicos y un pabellón reflejado sobre el lago.',
  'ju-2': 'Una calle de salones tradicionales dedicados al ssanghwa-cha, una bebida coreana de hierbas, frutos y nueces.',
  'nw-1': 'Jardín histórico ligado a la historia de amor de Chunhyang, con pabellones, estanque y el puente Ojakgyo.',
  'nw-2': 'Uno de los valles más conocidos de Jirisan, con agua clara, bosque denso y rutas para caminar.',
  'gj-1': 'El mayor embalse antiguo de Corea y extensos campos que muestran la larga tradición agrícola de Gimje.',
  'gj-2': 'Templo budista al pie de Moaksan, conocido por sus edificios históricos y su tranquilo paisaje de montaña.',
  'wj-1': 'Arquitectura hanok, arte contemporáneo y vistas de montaña reunidos en una aldea tranquila cerca de Jeonju.',
  'wj-2': 'Cumbres rocosas y un puente colgante con amplias vistas; el teleférico permite acortar el ascenso.',
  'ja-1': 'Un templo singular rodeado por decenas de torres de piedra construidas al pie de los picos de Maisan.',
  'ja-2': 'Circuitos de descanso inspirados en el ginseng rojo de Jinan, con piscinas y espacios de relajación.',
  'mj-1': 'Teleférico hasta Seolcheonbong y una caminata final hacia las grandes vistas del pico Hyangjeokbong.',
  'mj-2': 'Una antigua galería transformada en cava, donde se conoce y degusta el vino de moras de Muju.',
  'js-1': 'Santuario dedicado a Nongae, figura histórica de Jangsu, con salas de exposición y un recinto tranquilo.',
  'js-2': 'Bosque recreativo con valle, senderos y zonas de descanso para disfrutar de la naturaleza en familia.',
  'im-1': 'Experiencias, exposiciones y restaurantes dedicados al queso que convirtió a Imsil en un destino gastronómico.',
  'im-2': 'Un puente peatonal conduce a la isla Bungeoseom, rodeada por las curvas panorámicas del lago Okjeong.',
  'sc-1': 'Senderos entre bosques, un puente colgante y la gran cascada Byeongpung en uno de los paisajes clásicos de Sunchang.',
  'sc-2': 'Aldea dedicada al gochujang, con maestros artesanos, grandes tinajas y experiencias sobre la fermentación coreana.',
  'gc-1': 'Campos ondulantes de cebada verde en primavera y flores estacionales en una extensa granja de paisaje abierto.',
  'gc-2': 'Fortaleza de la era Joseon con una muralla transitable que rodea bosque, pabellones y edificios históricos.',
  'ba-1': 'Capas de roca esculpidas por el mar, puestas de sol y senderos costeros dentro del Parque Nacional Byeonsanbando.',
  'ba-2': 'Un camino bajo altos abetos conduce a un templo histórico entre montañas, especialmente sereno por la mañana.',
  'official-a-24396': 'Una colina de Jeonju con unos 1.500 árboles florales, especialmente vistosa entre finales de abril y comienzos de mayo.'
};

const ROUTE_PRESETS = {
  heritage: ['jeonju', 'iksan', 'gunsan'],
  coast: ['gunsan', 'buan', 'gochang'],
  mountain: ['jeongeup', 'jinan', 'muju'],
  flavor: ['jeonju', 'imsil', 'sunchang', 'namwon']
};

const COURSE_ES = [
  {
    period: '3 días / 2 noches',
    title: 'Patrimonio y descanso: lo esencial de Jeonbuk',
    desc: 'Jeonju Hanok Village ➔ Wanju ➔ patrimonio de Iksan ➔ historia y costa de Gunsan',
    open: 'Usar esta ruta'
  },
  {
    period: '2 días / 1 noche',
    title: 'Costa de Byeonsan y sabores del oeste',
    desc: 'Acantilados de Buan ➔ bosque de Naesosa ➔ sabores de Gochang ➔ tradición de Sunchang',
    open: 'Usar esta ruta'
  },
  {
    period: '1–2 días',
    title: 'Montañas, paisajes y descanso',
    desc: 'Naejangsan ➔ las torres de piedra de Maisan ➔ vistas de Deogyusan ➔ vino de moras de Muju',
    open: 'Usar esta ruta'
  }
];

const I18N = {
  es: {
    brandTitle: 'Viaja por Jeonbuk',
    searchPlaceholder: 'Busca un lugar, una región o una palabra clave',
    savedPlaces: 'Guardados',
    myPage: 'Mi',
    catAll: 'Todo',
    catFood: 'Comida y cafés',
    catCulture: 'Historia y cultura',
    catNature: 'Naturaleza',
    catFestival: 'Festivales',
    catCourses: 'Rutas recomendadas',
    plannerKicker: 'Tu viaje por Jeonbuk',
    plannerTitle: 'Planificador de ruta',
    plannerDesc: 'Combina varias regiones y crea una ruta práctica para cada día.',
    duration: 'Duración',
    dayTrip: '1 día',
    twoDays: '2 días',
    threeDays: '3 días',
    fourDays: '4 días',
    theme: 'Interés principal',
    themeAll: 'Un poco de todo',
    themeNature: 'Naturaleza',
    themeCulture: 'Historia y cultura',
    themeFood: 'Comida y cafés',
    themeFestival: 'Festivales',
    pace: 'Ritmo del viaje',
    paceRelaxed: 'Suave · 2',
    paceBalanced: 'Normal · 3',
    paceIntense: 'Intenso · 4',
    makeRoute: 'Crear mi ruta',
    presetTitle: 'Elige una ruta base',
    presetDesc: 'Usa una combinación recomendada y cambia las regiones después.',
    presetHeritage: 'Esencia cultural',
    presetCoast: 'Costa oeste',
    presetMountain: 'Montaña y descanso',
    presetFlavor: 'Sabores de Jeonbuk',
    chooseRegions: 'Añade o quita regiones',
    plannerEmpty: 'Elige una combinación y crea tu itinerario.',
    heroKicker: 'Guía de Jeonbuk, Corea',
    heroTitleStart: 'Descubre',
    heroTitleStrong: '14 destinos distintos',
    heroTitleEnd: 'en un solo viaje',
    heroDesc: 'Callejones hanok, montañas, costa, sabores locales y festivales: arma una ruta que conecte lo mejor de Jeonbuk.',
    statRegions: 'municipios',
    statPlaces: 'lugares destacados',
    statThemes: 'temas',
    statRoutes: 'rutas',
    explorePlaces: 'Explorar lugares',
    planTrip: 'Planear mi viaje',
    coursesKicker: 'Si es tu primera vez',
    coursesTitle: 'Rutas recomendadas',
    coursesDesc: 'Empieza con una ruta preparada y ajústala en el planificador.',
    regionSelectorKicker: 'Explora por región',
    regionSelectorTitle: '¿A dónde quieres ir?',
    regionSelectorDesc: 'Selecciona una región para ver sus lugares y fotos.',
    showAllRegions: 'Ver todo Jeonbuk',
    categoryFilterKicker: 'Elige un tema',
    savedOnly: 'Solo guardados',
    sortResults: 'Ordenar resultados',
    sortRecommended: 'Recomendados',
    sortName: 'Por nombre',
    sortRegion: 'Por región',
    resetFilters: 'Quitar filtros',
    mobileRegions: 'Regiones',
    mobilePlaces: 'Lugares',
    mobilePlanner: 'Mi ruta',
    mobileSaved: 'Guardados',
    footerTitle: 'Viaja por Jeonbuk',
    footerDesc: 'Una guía para explorar cultura, comida y naturaleza en los 14 municipios de Jeonbuk.',
    footerHome: 'Inicio',
    footerRoutes: 'Rutas recomendadas',
    footerSaved: 'Guardados',
    footerData: 'Datos',
    footerHelp: 'Ayuda turística 1330',
    footerNotice: 'Confirma horarios y precios en la fuente oficial antes de visitar. · Información turística 1330',
    modalStay: 'Tiempo recomendado',
    modalGoodFor: 'Ideal para',
    modalAbout: '¿Qué encontrarás aquí?',
    modalCheck: 'Antes de visitar',
    modalTip: 'Consejo de viaje',
    modalDirections: 'Abrir en Google Maps',
    modalSave: 'Guardar lugar',
    modalShare: 'Compartir',
    modalOfficial: 'Información oficial',
    drawerKicker: 'Área personal',
    drawerTitle: 'Mi viaje',
    drawerDesc: 'Revisa tus lugares guardados y conviértelos en una ruta.',
    drawerPlan: 'Crear ruta con guardados'
  },
  ko: {
    brandTitle: '전북 관광',
    searchPlaceholder: '관광지, 지역, 키워드를 검색해보세요',
    savedPlaces: '여행 보관함',
    myPage: '마이',
    catAll: '전체',
    catFood: '맛집/카페',
    catCulture: '역사/문화',
    catNature: '자연/힐링',
    catFestival: '축제/행사',
    catCourses: '추천 여행 코스',
    plannerKicker: '나만의 전북 여행',
    plannerTitle: '다지역 여행 플래너',
    plannerDesc: '여러 지역을 묶어 하루 단위로 이동하기 좋은 여행 일정을 만들어보세요.',
    duration: '여행 기간',
    dayTrip: '당일 여행',
    twoDays: '1박 2일',
    threeDays: '2박 3일',
    fourDays: '3박 4일',
    theme: '관심 테마',
    themeAll: '골고루 둘러보기',
    themeNature: '자연·힐링',
    themeCulture: '역사·문화',
    themeFood: '맛집·카페',
    themeFestival: '축제·행사',
    pace: '여행 속도',
    paceRelaxed: '여유 · 2곳',
    paceBalanced: '보통 · 3곳',
    paceIntense: '알차게 · 4곳',
    makeRoute: '여행 일정 만들기',
    presetTitle: '추천 동선을 선택하세요',
    presetDesc: '추천 조합을 선택한 뒤 지역을 직접 추가하거나 뺄 수 있습니다.',
    presetHeritage: '역사문화 핵심',
    presetCoast: '서해안 여행',
    presetMountain: '산과 휴식',
    presetFlavor: '전북 미식 여행',
    chooseRegions: '여행할 지역을 추가·제거하세요',
    plannerEmpty: '동선과 조건을 선택한 뒤 여행 일정을 만들어보세요.',
    heroKicker: '전북특별자치도 관광 안내',
    heroTitleStart: '한 번의 여행으로',
    heroTitleStrong: '14개 시·군',
    heroTitleEnd: '을 만나보세요',
    heroDesc: '한옥 골목, 산, 바다, 지역 음식과 축제를 연결해 전북만의 여행 동선을 만들어보세요.',
    statRegions: '시·군',
    statPlaces: '대표 명소',
    statThemes: '테마',
    statRoutes: '추천 코스',
    explorePlaces: '관광지 둘러보기',
    planTrip: '여행 계획 만들기',
    coursesKicker: '처음이라면 여기부터',
    coursesTitle: '테마별 추천 코스',
    coursesDesc: '준비된 동선을 플래너에 담고 내 여행에 맞게 수정하세요.',
    regionSelectorKicker: '지역별 탐색',
    regionSelectorTitle: '어디로 떠나고 싶나요?',
    regionSelectorDesc: '지역을 선택하면 해당 지역의 장소와 사진만 볼 수 있습니다.',
    showAllRegions: '전북 전체 보기',
    categoryFilterKicker: '테마별로 둘러보기',
    savedOnly: '저장한 장소만',
    sortResults: '결과 정렬',
    sortRecommended: '추천순',
    sortName: '이름순',
    sortRegion: '지역순',
    resetFilters: '필터 초기화',
    mobileRegions: '지역',
    mobilePlaces: '관광지',
    mobilePlanner: '플래너',
    mobileSaved: '저장',
    footerTitle: '전북 관광',
    footerDesc: '전북 14개 시·군의 문화·미식·자연 명소를 탐색하고 일정을 만드는 여행 정보 서비스',
    footerHome: '홈',
    footerRoutes: '추천 여행 코스',
    footerSaved: '여행 보관함',
    footerData: '데이터 설정',
    footerHelp: '관광안내 1330',
    footerNotice: '관광지 운영시간·요금은 방문 전 공식 관광정보에서 다시 확인해주세요. · 관광안내 1330',
    modalStay: '추천 체류',
    modalGoodFor: '이런 여행에 추천',
    modalAbout: '이곳은 어떤 곳인가요?',
    modalCheck: '방문 전에 확인하세요',
    modalTip: '여행 팁',
    modalDirections: 'Google Maps에서 열기',
    modalSave: '장소 저장하기',
    modalShare: '공유',
    modalOfficial: '공식 관광정보',
    drawerKicker: '나의 전북 여행',
    drawerTitle: '마이페이지',
    drawerDesc: '저장한 장소와 여행 일정을 한곳에서 확인하세요.',
    drawerPlan: '저장한 장소로 일정 만들기'
  }
};

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
const plannerRegionChips = document.getElementById('plannerRegionChips');
const plannerRegionSummary = document.getElementById('plannerRegionSummary');
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
const modalRouteSection = document.getElementById('modalRouteSection');
const modalRouteHint = document.getElementById('modalRouteHint');
const modalWalkBtn = document.getElementById('modalWalkBtn');
const modalTransitBtn = document.getElementById('modalTransitBtn');
const modalDriveBtn = document.getElementById('modalDriveBtn');

const savedDrawer = document.getElementById('savedDrawer');
const savedList = document.getElementById('savedList');
const savedPlanBtn = document.getElementById('savedPlanBtn');
const appToast = document.getElementById('appToast');
const mobileNavButtons = [...document.querySelectorAll('.mobile-bottom-nav [data-mobile-nav]')];

document.addEventListener('DOMContentLoaded', () => {
  applyRoutePreset(activeRoutePreset, false);
  initRegionChips();
  renderRecommendedCourses();
  restoreSavedPlan();
  updateApiStatusBadge();
  updateSavedUI();
  applyLanguage(currentLanguage, false);
  updateUI();
  initMobileNavigation();
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

function getTourCoordinates(tour) {
  if (!tour) return null;
  const lat = Number(tour.lat ?? tour.mapY);
  const lng = Number(tour.lng ?? tour.mapX);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function getGoogleMapsWaypoint(tour) {
  const coordinates = getTourCoordinates(tour);
  if (coordinates) return `${coordinates.lat},${coordinates.lng}`;
  return [tour?.name, tour?.address].filter(Boolean).join(' ');
}

function buildGoogleMapsDirectionsUrl(destinationTour, travelMode = 'transit', originTour = null) {
  const destination = getGoogleMapsWaypoint(destinationTour);
  if (!destination) return 'https://www.google.com/maps';
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: travelMode,
    dir_action: 'navigate'
  });
  const origin = getGoogleMapsWaypoint(originTour);
  if (origin) params.set('origin', origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getDirectDistanceKm(originTour, destinationTour) {
  const origin = getTourCoordinates(originTour);
  const destination = getTourCoordinates(destinationTour);
  if (!origin || !destination) return null;
  const toRadians = value => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat))
    * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDirectDistance(originTour, destinationTour) {
  const distanceKm = getDirectDistanceKm(originTour, destinationTour);
  if (distanceKm === null) return '';
  if (distanceKm < 1) return `${Math.max(50, Math.round(distanceKm * 1000 / 50) * 50)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function renderRouteModeLink(originTour, destinationTour, mode, icon, label) {
  return `<a href="${escapeHTML(buildGoogleMapsDirectionsUrl(destinationTour, mode, originTour))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(label)} · Google Maps"><i class="${icon}"></i><span>${escapeHTML(label)}</span></a>`;
}

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.es[key] || key;
}

function getLocale() {
  return currentLanguage === 'ko' ? 'ko-KR' : 'es-419';
}

function getRegionName(regionId, fallback = '') {
  if (currentLanguage === 'ko') return JEONBUK_REGIONS[regionId]?.name || fallback || '전북';
  return REGION_NAMES_ES[regionId] || fallback || 'Jeonbuk';
}

function getTourName(tour) {
  if (!tour) return '';
  return currentLanguage === 'ko' ? tour.name : (TOUR_NAMES_ES[tour.id] || tour.name);
}

function getCategoryName(category) {
  return {
    all: currentLanguage === 'ko' ? '전체 테마' : 'Todos los temas',
    food: currentLanguage === 'ko' ? '맛집·카페' : 'Comida y cafés',
    culture: currentLanguage === 'ko' ? '역사·문화' : 'Historia y cultura',
    nature: currentLanguage === 'ko' ? '자연·힐링' : 'Naturaleza',
    festival: currentLanguage === 'ko' ? '축제·행사' : 'Festivales'
  }[category] || category;
}

function getLocalizedDuration(value = '') {
  if (!value || currentLanguage === 'ko') return value;
  return String(value)
    .replace(/[~～]/g, '–')
    .replace(/\s*시간/g, ' h')
    .replace(/\s*분/g, ' min');
}

function getEventStatusLabel(status = '') {
  if (currentLanguage === 'ko') return status || '일정 확인';
  return {
    '진행 중': 'En curso',
    '개최 예정': 'Próximamente',
    '종료': 'Finalizado',
    '일정 확인': 'Consultar fecha'
  }[status] || 'Consultar fecha';
}

function getTourDescription(tour) {
  if (currentLanguage === 'ko') return tour.desc || tour.overview || '';
  if (TOUR_DESCRIPTIONS_ES[tour.id]) return TOUR_DESCRIPTIONS_ES[tour.id];
  const region = getRegionName(tour.regionId, tour.regionName);
  const category = getCategoryName(tour.category);
  return `${category} en ${region}. Consulta la dirección oficial en coreano y la ruta actual antes de salir.`;
}

function getCardDescription(tour) {
  if (currentLanguage === 'es') {
    if (TOUR_DESCRIPTIONS_ES[tour.id]) return TOUR_DESCRIPTIONS_ES[tour.id];
    const region = getRegionName(tour.regionId, tour.regionName);
    const descriptions = {
      culture: `Historia y patrimonio para descubrir en ${region}.`,
      nature: `Naturaleza y paisajes para disfrutar en ${region}.`,
      food: `Un sabor local recomendado de ${region}.`,
      festival: `Una experiencia cultural para vivir en ${region}.`
    };
    return descriptions[tour.category] || `Un lugar recomendado para conocer ${region}.`;
  }

  const source = String(tour.desc || tour.highlight || tour.overview || '').replace(/\s+/g, ' ').trim();
  if (!source) return '';
  const firstSentence = source.match(/^.*?[.!?。](?:\s|$)/)?.[0]?.trim();
  return firstSentence || source;
}

function applyLanguage(language, persist = true) {
  currentLanguage = language === 'ko' ? 'ko' : 'es';
  document.documentElement.lang = currentLanguage;
  if (persist) localStorage.setItem('jeonbuk_language', currentLanguage);

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = t(element.dataset.i18n);
    if (value) element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const value = t(element.dataset.i18nPlaceholder);
    if (value) element.setAttribute('placeholder', value);
  });
  document.querySelectorAll('.language-btn').forEach(button => {
    const active = button.dataset.language === currentLanguage;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.api-settings-link').forEach(link => {
    link.hidden = currentLanguage === 'es';
  });

  initRegionChips();
  renderPlannerRegionOptions();
  renderRecommendedCourses();
  updateSavedUI();
  if (currentPlan.length) {
    const duration = Number(document.getElementById('plannerDuration')?.value || Math.ceil(currentPlan.length / 3));
    renderTravelPlan(Math.max(1, duration));
  }
  updateUI();
}

function setLanguage(language) {
  applyLanguage(language, true);
}

function handleLanguageButton(language) {
  const isCompactMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isCompactMobile && currentLanguage === language) {
    setLanguage(language === 'ko' ? 'es' : 'ko');
    return;
  }
  setLanguage(language);
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
  if (!regionChips) return;
  let html = `<button type="button" class="chip-btn active" data-id="all" onclick="resetSelection()">${currentLanguage === 'ko' ? '전북 전체' : 'Todo Jeonbuk'}</button>`;
  Object.keys(JEONBUK_REGIONS).forEach(key => {
    const region = JEONBUK_REGIONS[key];
    html += `<button type="button" class="chip-btn" data-id="${escapeHTML(region.id)}" onclick="selectRegion('${escapeHTML(region.id)}')">${escapeHTML(getRegionName(region.id, region.name))}</button>`;
  });
  regionChips.innerHTML = html;
}

function renderPlannerRegionOptions() {
  if (!plannerRegionChips) return;
  plannerRegionChips.innerHTML = Object.keys(JEONBUK_REGIONS).map(regionId => {
    const selected = selectedPlannerRegions.has(regionId);
    return `
      <button type="button" class="planner-region-chip${selected ? ' active' : ''}" data-region-id="${escapeHTML(regionId)}"
        onclick="togglePlannerRegion('${escapeHTML(regionId)}')" aria-pressed="${selected}">
        <i class="fa-solid ${selected ? 'fa-circle-check' : 'fa-circle-plus'}"></i>
        ${escapeHTML(getRegionName(regionId, JEONBUK_REGIONS[regionId].name))}
      </button>
    `;
  }).join('');
  if (plannerRegionSummary) {
    const count = selectedPlannerRegions.size;
    plannerRegionSummary.textContent = currentLanguage === 'ko'
      ? `${count}개 지역 선택됨 · 여행 순서대로 일정에 반영됩니다.`
      : `${count} regiones seleccionadas · se incluirán en este orden.`;
  }
}

function applyRoutePreset(presetId, announce = true) {
  const regions = ROUTE_PRESETS[presetId];
  if (!regions) return;
  activeRoutePreset = presetId;
  selectedPlannerRegions = new Set(regions);
  document.querySelectorAll('.route-preset').forEach(button => {
    const active = button.dataset.preset === presetId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderPlannerRegionOptions();
  if (announce) {
    showToast(currentLanguage === 'ko' ? '추천 동선을 적용했습니다.' : 'Ruta base aplicada. Puedes cambiar las regiones.');
  }
}

function togglePlannerRegion(regionId) {
  if (!JEONBUK_REGIONS[regionId]) return;
  if (selectedPlannerRegions.has(regionId)) {
    if (selectedPlannerRegions.size === 1) {
      showToast(currentLanguage === 'ko' ? '지역을 한 곳 이상 선택해주세요.' : 'Selecciona al menos una región.');
      return;
    }
    selectedPlannerRegions.delete(regionId);
  } else if (selectedPlannerRegions.size >= 6) {
    showToast(currentLanguage === 'ko' ? '이동 동선을 위해 최대 6개 지역까지 선택할 수 있습니다.' : 'Puedes elegir hasta 6 regiones para mantener una ruta práctica.');
    return;
  } else {
    selectedPlannerRegions.add(regionId);
  }
  activeRoutePreset = '';
  document.querySelectorAll('.route-preset').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  renderPlannerRegionOptions();
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

function handleSearchKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  clearTimeout(searchDebounceTimer);
  Promise.resolve(updateUI()).then(scrollToResults);
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
    element.textContent = (categoryCounts[category] || 0).toLocaleString(getLocale());
  });

  document.querySelectorAll('.chip-btn').forEach(chip => {
    const chipId = chip.dataset.id;
    const isActive = (chipId === 'all' && !currentSelectedRegion) || chipId === currentSelectedRegion;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });

  if (currentSelectedRegion && JEONBUK_REGIONS[currentSelectedRegion]) {
    const region = JEONBUK_REGIONS[currentSelectedRegion];
    bannerBadge.textContent = currentLanguage === 'ko' ? (region.badge || '추천 관광지') : 'Región seleccionada';
    bannerTitle.textContent = currentLanguage === 'ko'
      ? `${region.name} 관광 안내`
      : `Qué ver en ${getRegionName(region.id, region.name)}`;
    bannerDesc.textContent = currentLanguage === 'ko'
      ? `${region.name}의 대표 명소와 여행 정보를 확인하세요.`
      : `Lugares y experiencias de ${getRegionName(region.id, region.name)}.`;
  } else {
    bannerBadge.textContent = currentSearchQuery
      ? (currentLanguage === 'ko' ? '통합 검색' : 'Búsqueda')
      : (currentLanguage === 'ko' ? '전북 전체' : 'Todo Jeonbuk');
    bannerTitle.textContent = currentSearchQuery
      ? (currentLanguage === 'ko' ? `'${searchInput.value.trim()}' 검색 결과` : `Resultados para “${searchInput.value.trim()}”`)
      : (currentLanguage === 'ko' ? '전라북도 대표 명소' : 'Lugares destacados de Jeonbuk');
    bannerDesc.textContent = currentSearchQuery
      ? (currentLanguage === 'ko'
        ? '전북 전체 관광정보 검색 결과입니다.'
        : 'Resultados en todo Jeonbuk.')
      : (currentLanguage === 'ko'
        ? '14개 시·군의 명소를 지역과 테마별로 살펴보세요.'
        : 'Explora lugares reales de los 14 municipios.');
  }
  bannerDesc.hidden = !currentSelectedRegion && !currentSearchQuery;

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

  const hasActiveDiscoveryFilter = Boolean(
    currentSelectedRegion
    || currentSearchQuery
    || currentSelectedCategory !== 'all'
    || showSavedOnly
  );
  bannerCount.textContent = hasActiveDiscoveryFilter
    ? (currentLanguage === 'ko'
      ? `${filteredTours.length.toLocaleString(getLocale())}개 장소`
      : `${filteredTours.length.toLocaleString(getLocale())} lugares`)
    : (currentLanguage === 'ko' ? '엄선한 여행 정보' : 'Selección local');
  const heroTourCount = document.getElementById('heroTourCount');
  if (heroTourCount) heroTourCount.textContent = allTours.length.toLocaleString(getLocale());
  const heroRouteCount = document.getElementById('heroRouteCount');
  if (heroRouteCount) heroRouteCount.textContent = String(RECOMMENDED_COURSES.length);

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
        getTourName(tour),
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
    sorted.sort((a, b) => getTourName(a).localeCompare(getTourName(b), currentLanguage === 'ko' ? 'ko' : 'es'));
  } else if (currentSortOrder === 'region') {
    sorted.sort((a, b) => {
      const regionCompare = getRegionName(a.regionId, a.regionName).localeCompare(
        getRegionName(b.regionId, b.regionName),
        currentLanguage === 'ko' ? 'ko' : 'es'
      );
      return regionCompare || getTourName(a).localeCompare(getTourName(b), currentLanguage === 'ko' ? 'ko' : 'es');
    });
  }
  return sorted;
}

function updateToolbarState(resultCount) {
  if (savedOnlyBtn) {
    savedOnlyBtn.classList.toggle('active', showSavedOnly);
    savedOnlyBtn.innerHTML = showSavedOnly
      ? `<i class="fa-solid fa-bookmark"></i> ${currentLanguage === 'ko' ? '저장한 장소만' : 'Solo guardados'}`
      : `<i class="fa-regular fa-bookmark"></i> ${currentLanguage === 'ko' ? '저장한 장소만' : 'Solo guardados'}`;
    savedOnlyBtn.setAttribute('aria-pressed', String(showSavedOnly));
  }

  const activeFilters = [
    currentSelectedRegion ? getRegionName(currentSelectedRegion) : null,
    currentSelectedCategory !== 'all' ? getCategoryName(currentSelectedCategory) : null,
    currentSearchQuery ? (currentLanguage === 'ko' ? '검색 결과' : 'Búsqueda') : null,
    showSavedOnly ? (currentLanguage === 'ko' ? '저장한 장소' : 'Guardados') : null
  ].filter(Boolean);
  filterSummary.hidden = activeFilters.length === 0;
  filterSummary.textContent = currentLanguage === 'ko'
    ? `${resultCount.toLocaleString(getLocale())}곳${activeFilters.length ? ` · ${activeFilters.join(' · ')}` : ''}`
    : `${resultCount.toLocaleString(getLocale())} lugares${activeFilters.length ? ` · ${activeFilters.join(' · ')}` : ''}`;
}

function renderTourCards(tours) {
  if (!tours?.length) {
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    tourCardList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-map-location"></i>
        <h3>${currentLanguage === 'ko'
          ? (showSavedOnly ? '저장한 장소가 없습니다' : '검색된 관광명소가 없습니다')
          : (showSavedOnly ? 'Aún no guardaste lugares' : 'No encontramos lugares')}</h3>
        <p>${currentLanguage === 'ko'
          ? (showSavedOnly ? '관광지 상세 화면에서 장소를 저장해보세요.' : '검색어나 지역·테마 필터를 바꿔보세요.')
          : (showSavedOnly ? 'Guarda lugares desde su ficha para verlos aquí.' : 'Prueba otra búsqueda, región o tema.')}</p>
        <button type="button" class="empty-reset-btn" onclick="resetSelection()">${currentLanguage === 'ko' ? '전체 관광지 보기' : 'Ver todos los lugares'}</button>
      </div>
    `;
    return;
  }

  const saved = new Set(getSavedIds());
  const visibleTours = tours.slice(0, visibleResultLimit);
  tourCardList.innerHTML = visibleTours.map(tour => {
    const tourName = getTourName(tour);
    const tags = currentLanguage === 'ko'
      ? (tour.tags || []).slice(0, 2).map(tag => `<span class="tag-item">${escapeHTML(tag)}</span>`).join('')
      : '';
    const savedBadge = saved.has(tour.id)
      ? `<span class="card-saved-badge"><i class="fa-solid fa-bookmark"></i> ${currentLanguage === 'ko' ? '저장됨' : 'Guardado'}</span>`
      : '<span class="card-view-badge"><i class="fa-solid fa-arrow-right"></i></span>';
    const imageMarkup = tour.image
      ? `<img src="${escapeHTML(tour.image)}" alt="${escapeHTML(tourName)}" loading="lazy" decoding="async" onerror="handleImageError(this)">`
      : '';
    const eventMeta = tour.eventPeriod
      ? `<div class="card-event-meta">
          <span class="event-status ${tour.eventStatus === '진행 중' ? 'active' : ''}">${escapeHTML(getEventStatusLabel(tour.eventStatus))}</span>
          <span><i class="fa-regular fa-calendar"></i> ${escapeHTML(tour.eventPeriod)}</span>
        </div>`
      : '';
    const practicalItems = [
      tour.recommendedDuration
        ? `<span><i class="fa-regular fa-clock"></i> ${escapeHTML(getLocalizedDuration(tour.recommendedDuration))}</span>`
        : '',
      tour.fee && String(tour.fee).length <= 32
        ? `<span><i class="fa-solid fa-ticket"></i> ${escapeHTML(tour.fee)}</span>`
        : ''
    ].filter(Boolean).join('');
    const practicalMeta = practicalItems ? `<div class="card-practical-meta">${practicalItems}</div>` : '';

    return `
      <button type="button" class="tour-card" onclick="openModal('${escapeHTML(tour.id)}')" aria-label="${escapeHTML(tourName)} · ${currentLanguage === 'ko' ? '상세 정보 보기' : 'ver detalles'}">
        <div class="card-img-box${tour.image ? '' : ' image-unavailable'}">
          ${imageMarkup}
          <span class="card-cat-badge">${escapeHTML(getCategoryName(tour.category))}</span>
          ${savedBadge}
        </div>
        <div class="card-content">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHTML(tourName)}</h3>
            <span class="card-region-label">${escapeHTML(getRegionName(tour.regionId, tour.regionName))}</span>
          </div>
          <p class="card-address"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(tour.address)}</p>
          ${eventMeta}
          ${getCardDescription(tour) ? `<p class="card-desc">${escapeHTML(getCardDescription(tour))}</p>` : ''}
          ${practicalMeta}
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>
      </button>
    `;
  }).join('');

  if (loadMoreBtn) {
    const remaining = Math.max(0, tours.length - visibleTours.length);
    loadMoreBtn.hidden = remaining === 0;
    if (loadMoreLabel) {
      loadMoreLabel.textContent = remaining
        ? (currentLanguage === 'ko'
          ? `더 많은 장소 보기 · ${remaining.toLocaleString(getLocale())}곳 남음`
          : `Ver más lugares · quedan ${remaining.toLocaleString(getLocale())}`)
        : (currentLanguage === 'ko' ? '전체 장소를 모두 불러왔습니다' : 'Ya viste todos los lugares');
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
    const translated = currentLanguage === 'es' ? COURSE_ES[index] : null;
    const tags = course.tags.map(tag => `<span class="course-tag">#${escapeHTML(currentLanguage === 'ko' ? tag : (REGION_NAMES_ES[Object.keys(JEONBUK_REGIONS).find(id => JEONBUK_REGIONS[id].name.includes(tag))] || tag))}</span>`).join('');
    return `
      <button type="button" class="course-card" style="background:${course.bg}" onclick="applyRecommendedCourse(${index})">
        <div>
          <span class="course-period">${escapeHTML(translated?.period || course.period)}</span>
          <h3 class="course-title">${escapeHTML(translated?.title || course.title)}</h3>
          <p class="course-desc">${escapeHTML(translated?.desc || course.desc)}</p>
        </div>
        <div class="course-card-footer">
          <div class="course-tags">${tags}</div>
          <span class="course-open-label">${escapeHTML(translated?.open || '일정 보기')} <i class="fa-solid fa-arrow-right"></i></span>
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
  modalImg.alt = getTourName(foundTour);
  modalCategory.textContent = `${getRegionName(foundTour.regionId, foundTour.regionName)} · ${getCategoryName(foundTour.category)}`;
  modalTitle.textContent = getTourName(foundTour);
  modalAddress.textContent = `📍 ${foundTour.address}`;
  const overviewText = decodeTextEntities(currentLanguage === 'ko'
    ? (foundTour.overview || foundTour.desc)
    : getTourDescription(foundTour));
  modalDesc.textContent = overviewText;
  modalDesc.classList.remove('expanded');
  modalDescToggle.hidden = overviewText.length <= 220;
  modalDescToggle.setAttribute('aria-expanded', 'false');
  modalDescToggle.innerHTML = `${currentLanguage === 'ko' ? '설명 더 보기' : 'Ver más'} <i class="fa-solid fa-chevron-down"></i>`;
  modalDescToggle.onclick = () => {
    const expanded = modalDesc.classList.toggle('expanded');
    modalDescToggle.setAttribute('aria-expanded', String(expanded));
    modalDescToggle.innerHTML = expanded
      ? `${currentLanguage === 'ko' ? '설명 접기' : 'Ver menos'} <i class="fa-solid fa-chevron-up"></i>`
      : `${currentLanguage === 'ko' ? '설명 더 보기' : 'Ver más'} <i class="fa-solid fa-chevron-down"></i>`;
  };
  modalTags.hidden = currentLanguage !== 'ko';
  modalTags.innerHTML = currentLanguage === 'ko'
    ? (foundTour.tags || []).map(tag => `<span class="tag-item">${escapeHTML(tag)}</span>`).join('')
    : '';
  modalDuration.textContent = getLocalizedDuration(foundTour.recommendedDuration || '1~2시간');
  modalRecommendedFor.textContent = currentLanguage === 'ko'
    ? (foundTour.recommendedFor || foundTour.categoryName || '전북 여행')
    : getCategoryName(foundTour.category);
  if (modalStatusLabel) {
    modalStatusLabel.textContent = currentLanguage === 'ko'
      ? (foundTour.eventStatus || foundTour.subCategory || '추천 명소')
      : (foundTour.eventStatus ? getEventStatusLabel(foundTour.eventStatus) : 'Lugar turístico');
  }

  const detailRows = [
    { icon: 'fa-regular fa-calendar', label: currentLanguage === 'ko' ? '행사 기간' : 'Fechas', value: foundTour.eventPeriod },
    { icon: 'fa-solid fa-signal', label: currentLanguage === 'ko' ? '행사 상태' : 'Estado', value: foundTour.eventStatus ? getEventStatusLabel(foundTour.eventStatus) : '' },
    { icon: 'fa-regular fa-clock', label: currentLanguage === 'ko' ? '운영시간' : 'Horario', value: foundTour.hours },
    { icon: 'fa-regular fa-calendar-xmark', label: currentLanguage === 'ko' ? '휴무일' : 'Días de cierre', value: foundTour.closed },
    { icon: 'fa-solid fa-ticket', label: currentLanguage === 'ko' ? '이용요금' : 'Entrada', value: foundTour.fee },
    { icon: 'fa-solid fa-square-parking', label: currentLanguage === 'ko' ? '주차' : 'Estacionamiento', value: foundTour.parking },
    {
      icon: 'fa-solid fa-phone',
      label: currentLanguage === 'ko' ? '문의' : 'Contacto',
      value: foundTour.phone,
      href: foundTour.phone ? `tel:${foundTour.phone.replace(/[^\d+]/g, '')}` : ''
    },
    {
      icon: 'fa-solid fa-globe',
      label: currentLanguage === 'ko' ? '홈페이지' : 'Sitio web',
      value: foundTour.homepage ? (currentLanguage === 'ko' ? '공식 홈페이지 열기' : 'Abrir sitio oficial') : '',
      href: foundTour.homepage
    },
    {
      icon: 'fa-solid fa-shield-halved',
      label: currentLanguage === 'ko' ? '정보 출처' : 'Fuente',
      value: currentLanguage === 'ko' ? '공식 관광정보 확인' : 'Consultar información oficial',
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

  const hasSpecificVisitTip = currentLanguage === 'ko'
    && foundTour.visitTip
    && !/운영시간|이용요금|공식 (페이지|관광정보)|방문 전 확인/.test(foundTour.visitTip);
  modalVisitTipText.textContent = hasSpecificVisitTip ? foundTour.visitTip : '';
  modalVisitTip.hidden = !hasSpecificVisitTip;
  const hasVisitInfo = Boolean(
    foundTour.hours || foundTour.closed || foundTour.fee ||
    foundTour.parking || foundTour.phone || foundTour.homepage ||
    foundTour.eventPeriod
  );
  modalVisitNotice.innerHTML = hasVisitInfo
    ? `<i class="fa-solid fa-circle-exclamation"></i> ${currentLanguage === 'ko' ? '운영시간·휴무일·요금은 변경될 수 있으니 방문 전 공식 페이지에서 다시 확인해주세요.' : 'Los horarios, cierres y precios pueden cambiar. Revísalos en la página oficial.'}`
    : `<i class="fa-solid fa-circle-exclamation"></i> ${currentLanguage === 'ko' ? '상세 운영 정보가 확인되지 않은 장소입니다. 방문 전 공식 관광정보를 확인해주세요.' : 'No hay información operativa completa. Confirma los datos antes de visitar.'}`;

  const routeLabels = currentLanguage === 'ko'
    ? { title: '이동 방법', hint: '실시간 시간과 경로는 Google Maps에서 확인하세요.', walk: '도보', transit: '대중교통', drive: '자동차' }
    : { title: 'Cómo llegar', hint: 'Consulta la ruta y el tiempo actual en Google Maps.', walk: 'A pie', transit: 'Transporte', drive: 'Auto' };
  document.getElementById('modalRouteTitle').textContent = routeLabels.title;
  modalRouteHint.textContent = routeLabels.hint;
  [
    [modalWalkBtn, 'walking', routeLabels.walk],
    [modalTransitBtn, 'transit', routeLabels.transit],
    [modalDriveBtn, 'driving', routeLabels.drive]
  ].forEach(([button, mode, label]) => {
    button.href = buildGoogleMapsDirectionsUrl(foundTour, mode);
    button.querySelector('span').textContent = label;
  });
  modalRouteSection.hidden = false;

  const navBtn = document.getElementById('modalNavBtn');
  navBtn.href = buildGoogleMapsDirectionsUrl(foundTour, 'transit');

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
  photoSource.textContent = currentLanguage === 'ko' ? `사진 · ${sourceName}` : 'Fuente de la foto';
  photoSource.hidden = !foundTour.image;

  const officialSource = document.getElementById('modalOfficialSource');
  officialSource.href = officialUrl;
  officialSource.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${currentLanguage === 'ko' ? `${escapeHTML(sourceName)}에서 확인` : 'Consultar fuente oficial'}`;

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
  showToast(currentLanguage === 'ko'
    ? (isSaved ? `${tour.name} 저장을 해제했습니다.` : `${tour.name}을 여행 보관함에 저장했습니다.`)
    : (isSaved ? 'Se eliminó de tus guardados.' : 'Lugar guardado para tu viaje.'));
}

function updateModalBookmarkButton(tourId) {
  const button = document.getElementById('modalBookmarkBtn');
  if (!button) return;
  const isSaved = getSavedIds().includes(tourId);
  button.classList.toggle('bookmarked', isSaved);
  button.innerHTML = isSaved
    ? `<i class="fa-solid fa-bookmark"></i> ${currentLanguage === 'ko' ? '저장 완료' : 'Guardado'}`
    : `<i class="fa-regular fa-bookmark"></i> ${currentLanguage === 'ko' ? '장소 저장하기' : 'Guardar lugar'}`;
}

async function shareTour(tour) {
  const shareData = {
    title: `${getTourName(tour)} | ${currentLanguage === 'ko' ? '전북 관광 가이드' : 'Guía turística de Jeonbuk'}`,
    text: `${getTourName(tour)} - ${tour.address}`,
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
  setMobileNavActive('saved');
  requestAnimationFrame(() => savedDrawer.querySelector('.drawer-close-btn')?.focus());
}

function closeSavedPanel(event) {
  if (event && event.target !== savedDrawer) return;
  savedDrawer.classList.remove('active');
  savedDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  updateMobileNavActive();
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function renderSavedList() {
  const tours = getSavedIds().map(findTourById).filter(Boolean);
  if (!tours.length) {
    savedList.innerHTML = `
      <div class="saved-empty">
        <i class="fa-regular fa-bookmark"></i>
        <h3>${currentLanguage === 'ko' ? '아직 저장한 장소가 없습니다' : 'Aún no guardaste lugares'}</h3>
        <p>${currentLanguage === 'ko' ? '마음에 드는 관광지의 상세 화면에서 저장 버튼을 눌러보세요.' : 'Abre la ficha de un lugar y toca Guardar.'}</p>
      </div>
    `;
    return;
  }

  savedList.innerHTML = tours.map(tour => `
    <article class="saved-item">
      <button type="button" class="saved-item-main" onclick="openSavedTour('${escapeHTML(tour.id)}')">
        <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" onerror="handleImageError(this)">
        <span>
          <strong>${escapeHTML(getTourName(tour))}</strong>
          <small>${escapeHTML(getRegionName(tour.regionId, tour.regionName))} · ${escapeHTML(getCategoryName(tour.category))}</small>
        </span>
      </button>
      <button type="button" class="saved-remove-btn" onclick="toggleBookmark('${escapeHTML(tour.id)}')" aria-label="${escapeHTML(getTourName(tour))} ${currentLanguage === 'ko' ? '저장 해제' : 'eliminar de guardados'}">
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
  const pace = Number(options.pace || document.getElementById('plannerPace')?.value || 3);
  const targetCount = Math.max(1, duration) * Math.max(2, Math.min(4, pace));
  const selectedRegionIds = options.regionIds?.length
    ? options.regionIds.filter(regionId => JEONBUK_REGIONS[regionId])
    : [...selectedPlannerRegions];

  const allTours = getAllTours();
  let candidates = options.tourIds?.length
    ? options.tourIds.map(findTourById).filter(Boolean)
    : selectedRegionIds.flatMap((regionId, regionIndex) => {
      const regionTours = allTours
        .filter(tour => tour.regionId === regionId)
        .map((tour, originalIndex) => ({
          ...tour,
          plannerScore:
            (theme !== 'all' && tour.category === theme ? 40 : 0) +
            (tour.rating || 0) * 2 -
            originalIndex * 0.001,
          plannerRegionOrder: regionIndex
        }))
        .sort((a, b) => b.plannerScore - a.plannerScore);

      const baseCount = Math.floor(targetCount / Math.max(1, selectedRegionIds.length));
      const remainder = targetCount % Math.max(1, selectedRegionIds.length);
      const regionTarget = baseCount + (regionIndex < remainder ? 1 : 0);
      return regionTours.slice(0, Math.max(1, regionTarget));
    });

  if (!options.tourIds?.length && candidates.length < targetCount) {
    const selectedIds = new Set(candidates.map(tour => tour.id));
    const extras = allTours
      .filter(tour => !selectedIds.has(tour.id) && (!selectedRegionIds.length || selectedRegionIds.includes(tour.regionId)))
      .sort((a, b) => {
        const aTheme = theme !== 'all' && a.category === theme ? 1 : 0;
        const bTheme = theme !== 'all' && b.category === theme ? 1 : 0;
        return bTheme - aTheme || (b.rating || 0) - (a.rating || 0);
      });
    candidates = [...candidates, ...extras.slice(0, targetCount - candidates.length)];
  }

  const uniqueCandidates = [...new Map(candidates.map(tour => [tour.id, tour])).values()];
  currentPlan = uniqueCandidates.slice(0, Math.min(targetCount, uniqueCandidates.length));
  renderTravelPlan(duration, options.title || null, selectedRegionIds);
  scrollToSection('plannerSection');
}

function renderPlanTransfer(originTour, destinationTour) {
  const directDistance = formatDirectDistance(originTour, destinationTour);
  const labels = currentLanguage === 'ko'
    ? { title: '다음 장소로 이동', distance: '직선거리', walk: '도보', transit: '대중교통', drive: '자동차' }
    : { title: 'Siguiente trayecto', distance: 'Distancia directa', walk: 'A pie', transit: 'Transporte', drive: 'Auto' };
  return `
    <div class="plan-transfer">
      <div class="plan-transfer-copy">
        <span class="plan-transfer-icon"><i class="fa-solid fa-route"></i></span>
        <div>
          <strong>${labels.title}</strong>
          ${directDistance ? `<small>${labels.distance} · ${escapeHTML(directDistance)}</small>` : ''}
        </div>
      </div>
      <div class="plan-transfer-actions">
        ${renderRouteModeLink(originTour, destinationTour, 'walking', 'fa-solid fa-person-walking', labels.walk)}
        ${renderRouteModeLink(originTour, destinationTour, 'transit', 'fa-solid fa-bus-simple', labels.transit)}
        ${renderRouteModeLink(originTour, destinationTour, 'driving', 'fa-solid fa-car-side', labels.drive)}
      </div>
    </div>
  `;
}

function renderTravelPlan(duration, customTitle = null, selectedRegionIds = [...selectedPlannerRegions]) {
  plannerResult.hidden = false;
  if (!currentPlan.length) {
    plannerResult.innerHTML = `<div class="planner-empty"><p>${currentLanguage === 'ko' ? '선택한 조건에 맞는 관광지가 없습니다.' : 'No encontramos lugares para esta combinación.'}</p></div>`;
    return;
  }

  const dayGroups = [];
  const stopsPerDay = Math.max(1, Math.ceil(currentPlan.length / duration));
  for (let day = 0; day < duration; day += 1) {
    const stops = currentPlan.slice(day * stopsPerDay, day * stopsPerDay + stopsPerDay);
    if (stops.length) dayGroups.push(stops);
  }

  const daysHTML = dayGroups.map((stops, dayIndex) => `
    <section class="plan-day">
      <div class="plan-day-label">${currentLanguage === 'ko' ? `${dayIndex + 1}일차` : `Día ${dayIndex + 1}`}</div>
      <div class="plan-stops">
        ${stops.map((tour, stopIndex) => `
          <div class="plan-stop-group">
            <button type="button" class="plan-stop" onclick="openModal('${escapeHTML(tour.id)}')">
              <span class="plan-stop-number">${stopIndex + 1}</span>
              <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" onerror="handleImageError(this)">
              <span class="plan-stop-copy">
                <strong>${escapeHTML(getTourName(tour))}</strong>
                <small>${escapeHTML(getRegionName(tour.regionId, tour.regionName))} · ${escapeHTML(getCategoryName(tour.category))}</small>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            ${stopIndex < stops.length - 1 ? renderPlanTransfer(tour, stops[stopIndex + 1]) : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');

  const regionNames = selectedRegionIds.map(regionId => getRegionName(regionId)).filter(Boolean);
  const routeTitle = customTitle || (currentLanguage === 'ko'
    ? `${duration === 1 ? '당일' : `${duration - 1}박 ${duration}일`} · ${regionNames.join(' → ')}`
    : `${duration} ${duration === 1 ? 'día' : 'días'} · ${regionNames.join(' → ')}`);

  plannerResult.innerHTML = `
    <div class="plan-result-header">
      <div>
        <span>${currentLanguage === 'ko' ? '추천 일정 초안' : 'Borrador de itinerario'}</span>
        <h3>${escapeHTML(routeTitle)}</h3>
      </div>
      <div class="plan-header-actions">
        <button type="button" class="clear-plan-btn" onclick="clearCurrentPlan()">${currentLanguage === 'ko' ? '초기화' : 'Borrar'}</button>
        <button type="button" class="save-plan-btn" onclick="saveCurrentPlan()"><i class="fa-regular fa-floppy-disk"></i> ${currentLanguage === 'ko' ? '일정 저장' : 'Guardar ruta'}</button>
      </div>
    </div>
    ${daysHTML}
    <p class="plan-disclaimer"><i class="fa-solid fa-circle-info"></i> ${currentLanguage === 'ko'
      ? '직선거리는 참고용입니다. 실제 이동시간·교통비는 각 Google Maps 버튼에서 확인해주세요.'
      : 'La distancia directa es orientativa. Consulta tiempo y costo actual en cada enlace de Google Maps.'}</p>
  `;
}

function saveCurrentPlan() {
  if (!currentPlan.length) return;
  const title = document.querySelector('.plan-result-header h3')?.textContent.trim() || (currentLanguage === 'ko' ? '저장된 전북 여행' : 'Ruta guardada en Jeonbuk');
  const plan = {
    savedAt: new Date().toISOString(),
    title,
    tourIds: currentPlan.map(tour => tour.id)
  };
  localStorage.setItem('jeonbuk_travel_plan', JSON.stringify(plan));
  showToast(currentLanguage === 'ko' ? '현재 여행 일정이 이 기기에 저장되었습니다.' : 'La ruta se guardó en este dispositivo.');
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
    renderTravelPlan(duration, savedPlan.title || (currentLanguage === 'ko' ? '저장된 전북 여행' : 'Ruta guardada en Jeonbuk'));
  } catch {
    localStorage.removeItem('jeonbuk_travel_plan');
  }
}

function clearCurrentPlan() {
  currentPlan = [];
  localStorage.removeItem('jeonbuk_travel_plan');
  plannerResult.innerHTML = '';
  plannerResult.hidden = true;
  showToast(currentLanguage === 'ko' ? '저장된 여행 일정을 초기화했습니다.' : 'La ruta guardada se eliminó.');
}

function createPlanFromSaved() {
  const ids = getSavedIds();
  if (!ids.length) return;
  closeSavedPanel();
  const duration = Math.max(1, Math.min(3, Math.ceil(ids.length / 3)));
  const regionIds = [...new Set(ids.map(findTourById).filter(Boolean).map(tour => tour.regionId))];
  if (regionIds.length) {
    selectedPlannerRegions = new Set(regionIds.slice(0, 6));
    renderPlannerRegionOptions();
  }
  document.getElementById('plannerDuration').value = String(duration);
  generateTravelPlan({
    duration,
    tourIds: ids,
    regionIds,
    title: currentLanguage === 'ko' ? '저장한 장소로 만든 여행' : 'Ruta con tus lugares guardados'
  });
}

function applyRecommendedCourse(index) {
  const course = RECOMMENDED_COURSES[index];
  if (!course) return;
  const duration = course.period.includes('2박 3일') ? 3 : course.period.includes('1박 2일') ? 2 : 1;
  const ids = course.spotIds || [];
  const regionIds = [...new Set(ids.map(findTourById).filter(Boolean).map(tour => tour.regionId))];
  if (regionIds.length) {
    selectedPlannerRegions = new Set(regionIds);
    renderPlannerRegionOptions();
  }
  document.getElementById('plannerDuration').value = String(duration);
  generateTravelPlan({
    duration,
    tourIds: ids,
    regionIds,
    title: currentLanguage === 'ko' ? course.title : (COURSE_ES[index]?.title || course.title)
  });
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
  document.getElementById('tourCardList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setMobileNavActive(key) {
  mobileNavButtons.forEach(button => {
    const active = button.dataset.mobileNav === key;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function updateMobileNavActive() {
  if (!mobileNavButtons.length || window.innerWidth > 768) return;
  if (savedDrawer?.classList.contains('active')) {
    setMobileNavActive('saved');
    return;
  }

  const probe = window.scrollY + window.innerHeight * 0.38;
  const documentTop = element => element
    ? element.getBoundingClientRect().top + window.scrollY
    : Infinity;
  const plannerTop = documentTop(document.getElementById('plannerSection'));
  const tourTop = documentTop(document.getElementById('tourSection'));
  const placesTop = documentTop(document.getElementById('tourCardList'));
  let active = 'regions';
  if (probe >= plannerTop) active = 'planner';
  if (probe >= tourTop) active = 'regions';
  if (probe >= placesTop) active = 'places';
  setMobileNavActive(active);
}

function initMobileNavigation() {
  if (!mobileNavButtons.length) return;
  let ticking = false;
  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateMobileNavActive();
      ticking = false;
    });
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  mobileNavButtons.forEach(button => {
    button.addEventListener('click', () => setMobileNavActive(button.dataset.mobileNav));
  });
  updateMobileNavActive();
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

// ── Back to Top ──
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

(function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 300);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

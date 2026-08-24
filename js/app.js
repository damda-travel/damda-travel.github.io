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
let currentPlanContext = { duration: 2, title: null, regionIds: [], origin: 'jeonju', date: '', startTime: '09:30', mode: 'transit' };
let personalizedTourIds = [];
let showSavedOnly = false;
let activeTourId = null;
let lastFocusedElement = null;
let searchDebounceTimer = null;
let visibleResultLimit = 6;
let lastResultSignature = '';
let lastTrackedDiscoverySignature = '';
let currentLanguage = localStorage.getItem('jeonbuk_language') === 'ko' ? 'ko' : 'es';
const DAMDA_API_BASE = window.location.hostname.endsWith('github.io') ? 'https://damda.parkg9832.chatgpt.site' : '';
const TRAVEL_DEMAND_API_URL = `${DAMDA_API_BASE}/api/travel-demand`;
const ANALYTICS_API_URL = `${DAMDA_API_BASE}/api/product-event`;
const PLACE_REPORT_API_URL = `${DAMDA_API_BASE}/api/place-report`;
const ROUTE_ESTIMATE_API_URL = `${DAMDA_API_BASE}/api/route-estimate`;
const TRAVEL_PROFILE_STORAGE_KEY = 'damda_travel_profile';
const TRAVEL_PROFILE_DRAFT_KEY = 'damda_travel_profile_draft_status';
const SHARED_PLACE_QUERY_KEY = 'place';
const SHARED_PLAN_QUERY_KEY = 'route';
const CATALOG_VERIFIED_AT = '2026-07-24';
let selectedPlannerRegions = new Set();
let activeRoutePreset = 'heritage';
let plannerRegionsExpanded = false;
let tourIndexCache = null;
let categoryCountsCache = null;
let uiRequestSequence = 0;
let modalRequestSequence = 0;
const catalogDetailPromises = new Map();
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
  'official-a-24396': 'Colina de flores Wansan',
  'official-a-24056': 'Zoológico de Jeonju',
  'official-a-24044': 'Santuario Gyeonggijeon',
  'official-a-24296': 'Jardín botánico de Jeonju',
  'official-a-24260': 'Rail Bike Hanok de Jeonju',
  'official-a-24397': 'Museo retro Jeonju Nanjang',
  'official-a-20549': 'Museo Nacional de Jeonju'
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
  'official-a-24396': 'Una colina de Jeonju con unos 1.500 árboles florales, especialmente vistosa entre finales de abril y comienzos de mayo.',
  'official-a-24056': 'Un zoológico urbano rodeado de bosque, con recorridos tranquilos y áreas pensadas para familias.',
  'official-a-24044': 'El santuario histórico que conserva el retrato del fundador de la dinastía Joseon, en pleno centro de Jeonju.',
  'official-a-24296': 'El único jardín botánico operado por la Korea Expressway Corporation, con colecciones de plantas y acceso gratuito.',
  'official-a-24260': 'Un paseo en bicicleta ferroviaria de 3,4 km por una antigua vía cerca de la aldea hanok.',
  'official-a-24397': 'Una experiencia inmersiva que recrea calles, tiendas y escenas cotidianas de la Corea del siglo XX.',
  'official-a-20549': 'Museo dedicado a la historia y el arte de Jeonbuk, con exposiciones permanentes, jardín y espacios para familias.'
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

const DAMDA_COLLECTIONS = [
  {
    id: 'first-jeonbuk',
    icon: 'fa-solid fa-compass',
    es: { title: 'Mi primera vez en Jeonbuk', desc: 'Hanok, patrimonio y sabores locales sin intentar verlo todo.' },
    ko: { title: '첫 전북 여행', desc: '한옥·역사·로컬 미식을 무리하지 않는 동선으로 만나요.' },
    spotIds: ['jj-1', 'jj-5', 'wj-1']
  },
  {
    id: 'seoul-day',
    coverId: 'jj-2',
    icon: 'fa-solid fa-train-subway',
    es: { title: 'Una escapada desde Seúl', desc: 'Una ruta compacta para descubrir otra Corea en un solo día.' },
    ko: { title: '서울에서 떠나는 하루', desc: '하루 안에 서울과 다른 한국의 표정을 만나는 압축 코스예요.' },
    spotIds: ['jj-1', 'jj-2', 'jj-5']
  },
  {
    id: 'local-flavors',
    coverId: 'sc-2',
    icon: 'fa-solid fa-utensils',
    es: { title: 'Sabores que cuentan Jeonbuk', desc: 'Mercados, fermentación y especialidades con una historia local.' },
    ko: { title: '전북을 기억하게 하는 맛', desc: '시장·발효·지역 음식을 그 지역의 이야기와 함께 담았어요.' },
    spotIds: ['jj-5', 'gs-3', 'sc-2']
  },
  {
    id: 'rainy-day',
    coverId: 'gs-2',
    icon: 'fa-solid fa-cloud-rain',
    es: { title: 'Jeonbuk para un día de lluvia', desc: 'Museos, arquitectura y experiencias que no dependen del clima.' },
    ko: { title: '비 오는 날의 전북', desc: '날씨 걱정 없이 즐길 수 있는 박물관·건축·실내 경험이에요.' },
    spotIds: ['gs-2', 'jj-2', 'im-1']
  }
];

const I18N = {
  es: {
    brandTitle: 'DAMDA',
    searchPlaceholder: 'Busca lugares o regiones',
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
    plannerOrigin: 'Punto de partida',
    originSeoul: 'Seúl · Estación de Seúl',
    originJeonju: 'Jeonju · Estación de Jeonju',
    originCurrent: 'Mi alojamiento / ubicación',
    plannerDate: 'Fecha de inicio',
    plannerStartTime: 'Hora de salida',
    plannerTransport: 'Transporte principal',
    transportTransit: 'Transporte público',
    transportDriving: 'Auto',
    transportWalking: 'A pie',
    presetTitle: 'Elige una ruta base',
    presetDesc: 'Usa una combinación recomendada y cambia las regiones después.',
    presetHeritage: 'Esencia cultural',
    presetCoast: 'Costa oeste',
    presetMountain: 'Montaña y descanso',
    presetFlavor: 'Sabores de Jeonbuk',
    customRoute: 'Ruta personalizada',
    chooseRegions: 'Añade o quita regiones',
    changeRegions: 'Cambiar regiones',
    hideRegions: 'Ocultar regiones',
    plannerEmpty: 'Elige una combinación y crea tu itinerario.',
    heroKicker: 'Más allá de Seúl',
    heroTitleStart: 'Más que un viaje',
    heroTitleStrong: 'Una Corea para recordar',
    heroTitleEnd: '',
    heroDesc: 'A solo 1 h 30 min de Seúl: hanok, montañas, mar y sabores locales en un solo viaje.',
    statRegions: 'municipios',
    statPlaces: 'lugares destacados',
    statThemes: 'temas',
    statRoutes: 'rutas',
    explorePlaces: 'Explorar lugares',
    planTrip: 'Planear mi viaje',
    profileInviteKicker: 'Recomendaciones que empiezan contigo',
    profileInviteTitle: '¿Qué momento de tu viaje estás viviendo?',
    profileInviteDesc: 'Responde una sola pregunta ahora. Completa tu perfil solo cuando quieras una ruta personalizada.',
    profileInviteFirst: 'Mi primer viaje',
    profileInviteReturn: 'Quiero volver',
    profileInviteResident: 'Vivo en Corea',
    profileInviteVisited: 'Ya conozco Corea',
    profileInviteContinue: 'Personalizar mis recomendaciones',
    picksKicker: 'Selección editorial',
    picksTitle: 'DAMDA Picks',
    picksDesc: 'No es una lista de popularidad. Son lugares elegidos por el tipo de viaje que quieres vivir.',
    picksAll: 'Ver todos los lugares',
    allPlacesKicker: 'Guía completa',
    allPlacesTitle: 'Más lugares de Jeonbuk',
    allPlacesDesc: 'Busca por región o tema y guarda lo que quieras comparar después.',
    coursesKicker: 'Si es tu primera vez',
    coursesTitle: 'Rutas recomendadas',
    coursesDesc: 'Empieza con una ruta preparada y ajústala en el planificador.',
    regionSelectorKicker: 'Elige tu zona',
    regionSelectorTitle: 'Elige una región',
    regionSelectorDesc: 'Selecciona una región para ver sus lugares y fotos.',
    showAllRegions: 'Ver todo Jeonbuk',
    categoryFilterKicker: 'O explora por tema',
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
    footerTitle: 'DAMDA',
    footerDesc: 'Una guía para explorar cultura, comida y naturaleza en los 14 municipios de Jeonbuk.',
    footerHome: 'Inicio',
    footerRoutes: 'Rutas recomendadas',
    footerSaved: 'Guardados',
    footerData: 'Datos',
    footerHelp: 'Ayuda turística 1330',
    footerNotice: 'Confirma horarios y precios antes de visitar. · Información turística 1330',
    footerPrivacy: 'Política de privacidad',
    footerTerms: 'Términos de uso',
    footerBusinessTitle: 'Información de la empresa',
    footerCompanyLabel: 'Empresa',
    footerCompany: '먹다 (MOKDA)',
    footerCeoLabel: 'Representante',
    footerCeo: 'Gyeom Park',
    footerRegistrationLabel: 'Registro comercial',
    footerAddressLabel: 'Dirección',
    footerAddress: '44 Nambuk 10-gil, 2F, Gimje-si, Jeonbuk, República de Corea',
    footerCopyright: '© 2026 DAMDA by MOKDA. Todos los derechos reservados.',
    modalStay: 'Estancia sugerida',
    estimateLabel: 'Estimación',
    estimateNote: 'Estimación basada en el tipo de lugar y una visita habitual.',
    officialLabel: 'Dato oficial',
    modalGoodFor: 'Ideal para',
    modalAbout: '¿Qué encontrarás aquí?',
    modalCheck: 'Antes de visitar',
    modalTip: 'Consejo de viaje',
    modalDirections: 'Abrir en Google Maps',
    modalSave: 'Guardar lugar',
    modalAddPlan: 'Añadir a mi ruta',
    modalRemovePlan: 'Quitar de mi ruta',
    modalShare: 'Compartir',
    modalReport: 'Reportar información',
    modalOfficial: 'Información oficial',
    searchAria: 'Buscar lugares turísticos en Jeonbuk',
    brandAria: 'Inicio de la guía turística de Jeonbuk',
    clearSearchAria: 'Borrar búsqueda',
    regionSelectAria: 'Seleccionar una región de Jeonbuk',
    plannerRegionsAria: 'Regiones para incluir en la ruta',
    categoryNavAria: 'Filtrar lugares por tema',
    resultsToolbarAria: 'Ordenar y filtrar lugares',
    backToTopAria: 'Volver arriba',
    modalSnapshotAria: 'Información clave del lugar',
    modalCloseAria: 'Cerrar detalles',
    drawerCloseAria: 'Cerrar mi viaje',
    mobileNavAria: 'Navegación principal',
    drawerKicker: 'Área personal',
    drawerTitle: 'Mi viaje',
    drawerDesc: 'Revisa tus lugares guardados y conviértelos en una ruta.',
    drawerPlan: 'Crear ruta con guardados',
    personalizedKicker: 'Seleccionado para ti',
    personalizedTitle: 'Tu Jeonbuk, según tu forma de viajar',
    personalizedPlan: 'Crear mi ruta recomendada',
    personalizedEdit: 'Editar mi perfil',
    footerDiagnosis: 'Tu perfil de viaje',
    funnelSkip: 'Ahora no',
    funnelKicker: 'Tu próxima experiencia en Corea',
    funnelStatusTitle: '¿Cuál de estas opciones te describe mejor?',
    funnelStatusDesc: 'Elige una opción. Así podremos entender mejor qué información necesitas.',
    funnelFirstTrip: 'Estoy planeando mi primer viaje a Corea',
    funnelVisited: 'Ya viajé a Corea',
    funnelReturn: 'Estoy planeando volver a Corea',
    funnelResident: 'Vivo actualmente en Corea',
    funnelCountryKicker: 'Cuéntanos de dónde vienes',
    funnelCountryTitle: '¿Cuál es tu país?',
    funnelCountryDesc: 'Esto nos ayuda a preparar información útil para cada mercado.',
    funnelCountryLabel: 'País',
    funnelCountryPlaceholder: 'Ej. México',
    funnelInterestKicker: 'Diseña tu viaje ideal',
    funnelInterestTitle: '¿Qué tipo de viaje buscas?',
    funnelInterestDesc: 'Puedes elegir hasta 3 opciones.',
    funnelTradition: 'Tradición y hanok',
    funnelFood: 'Comida y cafés',
    funnelNature: 'Montañas y naturaleza',
    funnelCoast: 'Mar y costa',
    funnelFestival: 'Festivales y eventos',
    funnelLocal: 'Vida local',
    funnelWellness: 'Descanso y bienestar',
    funnelWinter: 'Invierno y esquí',
    funnelContactKicker: 'Mantente cerca de DAMDA',
    funnelContactTitle: '¿Quieres recibir rutas y futuras invitaciones?',
    funnelContactDesc: 'El contacto es opcional. Tu respuesta de viaje se guardará aunque lo dejes vacío.',
    funnelContactType: 'Cómo prefieres recibir información',
    funnelContactValue: 'Tu contacto',
    funnelConsent: 'Acepto recibir información de DAMDA relacionada con viajes y experiencias. Puedo solicitar dejar de recibirla.',
    funnelPrivacy: 'DAMDA utiliza estas respuestas para analizar intereses turísticos y solo usa tu contacto si das permiso.',
    funnelPrivacyLink: 'Ver política de privacidad',
    funnelBack: 'Atrás',
    funnelNext: 'Continuar',
    funnelSubmit: 'Guardar mi perfil',
    funnelSuccessTitle: 'Gracias. Ya conocemos mejor tu viaje.',
    funnelSuccessDesc: 'Ahora explora lugares que encajan con lo que buscas.',
    funnelExplore: 'Ver recomendaciones',
    reportKicker: 'Ayúdanos a mantener DAMDA al día',
    reportTitle: '¿Qué información debemos revisar?',
    reportType: 'Tipo de corrección',
    reportPhoto: 'La foto no corresponde',
    reportDetails: 'Horario, precio o contacto',
    reportLocation: 'Dirección o ubicación',
    reportClosed: 'Cerrado o ya no existe',
    reportTranslation: 'Nombre o traducción',
    reportOther: 'Otro',
    reportNote: 'Cuéntanos qué encontraste',
    reportPlaceholder: 'Escribe un detalle breve. No incluyas información personal.',
    reportSubmit: 'Enviar reporte'
  },
  ko: {
    brandTitle: 'DAMDA',
    searchPlaceholder: '관광지나 지역을 검색해보세요',
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
    plannerOrigin: '출발 기준',
    originSeoul: '서울 · 서울역',
    originJeonju: '전주 · 전주역',
    originCurrent: '숙소 / 현재 위치',
    plannerDate: '여행 시작일',
    plannerStartTime: '출발 시간',
    plannerTransport: '주요 이동수단',
    transportTransit: '대중교통',
    transportDriving: '자동차',
    transportWalking: '도보',
    presetTitle: '추천 동선을 선택하세요',
    presetDesc: '추천 조합을 선택한 뒤 지역을 직접 추가하거나 뺄 수 있습니다.',
    presetHeritage: '역사문화 핵심',
    presetCoast: '서해안 여행',
    presetMountain: '산과 휴식',
    presetFlavor: '전북 미식 여행',
    customRoute: '직접 선택한 동선',
    chooseRegions: '여행할 지역을 추가·제거하세요',
    changeRegions: '지역 변경',
    hideRegions: '지역 선택 닫기',
    plannerEmpty: '동선과 조건을 선택한 뒤 여행 일정을 만들어보세요.',
    heroKicker: '서울 너머의 한국',
    heroTitleStart: '여행 그 이상',
    heroTitleStrong: '기억에 남을 한국',
    heroTitleEnd: '',
    heroDesc: '서울에서 약 1시간 30분. 한옥, 산, 바다와 지역의 맛을 한 번의 여행에서 만나보세요.',
    statRegions: '시·군',
    statPlaces: '대표 명소',
    statThemes: '테마',
    statRoutes: '추천 코스',
    explorePlaces: '관광지 둘러보기',
    planTrip: '여행 계획 만들기',
    profileInviteKicker: '당신에게서 시작하는 추천',
    profileInviteTitle: '지금 어떤 여행을 준비하고 있나요?',
    profileInviteDesc: '지금은 한 가지만 답하세요. 맞춤 일정이 필요할 때 나머지를 이어서 입력할 수 있어요.',
    profileInviteFirst: '첫 한국 여행',
    profileInviteReturn: '다시 가는 한국',
    profileInviteResident: '한국 거주 중',
    profileInviteVisited: '한국 여행 경험 있음',
    profileInviteContinue: '내 추천 맞춤 설정하기',
    picksKicker: 'DAMDA 에디터 셀렉션',
    picksTitle: 'DAMDA Picks',
    picksDesc: '인기순 목록이 아니라, 여행의 상황과 취향에 맞춰 직접 고른 장소입니다.',
    picksAll: '모든 장소 보기',
    allPlacesKicker: '전체 여행 정보',
    allPlacesTitle: '전북의 더 많은 장소',
    allPlacesDesc: '지역과 테마로 찾고, 나중에 비교할 장소를 저장해보세요.',
    coursesKicker: '처음이라면 여기부터',
    coursesTitle: '테마별 추천 코스',
    coursesDesc: '준비된 동선을 플래너에 담고 내 여행에 맞게 수정하세요.',
    regionSelectorKicker: '지역 선택',
    regionSelectorTitle: '여행할 지역을 선택하세요',
    regionSelectorDesc: '지역을 선택하면 해당 지역의 장소와 사진만 볼 수 있습니다.',
    showAllRegions: '전북 전체 보기',
    categoryFilterKicker: '또는 테마로 둘러보기',
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
    footerTitle: 'DAMDA',
    footerDesc: '전북 14개 시·군의 문화·미식·자연 명소를 탐색하고 일정을 만드는 여행 정보 서비스',
    footerHome: '홈',
    footerRoutes: '추천 여행 코스',
    footerSaved: '여행 보관함',
    footerData: '데이터 설정',
    footerHelp: '관광안내 1330',
    footerNotice: '관광지 운영시간·요금은 방문 전에 다시 확인해주세요. · 관광안내 1330',
    footerPrivacy: '개인정보 처리방침',
    footerTerms: '이용약관',
    footerBusinessTitle: '사업자 정보',
    footerCompanyLabel: '상호',
    footerCompany: '먹다 (MOKDA)',
    footerCeoLabel: '대표',
    footerCeo: '박겸',
    footerRegistrationLabel: '사업자등록번호',
    footerAddressLabel: '주소',
    footerAddress: '전북특별자치도 김제시 남북10길 44, 2층',
    footerCopyright: '© 2026 DAMDA by MOKDA. 모든 권리 보유.',
    modalStay: '추천 체류',
    estimateLabel: '예상',
    estimateNote: '장소 유형과 일반적인 관람 범위를 기준으로 한 예상치입니다.',
    officialLabel: '공식 안내',
    modalGoodFor: '이런 여행에 추천',
    modalAbout: '이곳은 어떤 곳인가요?',
    modalCheck: '방문 전에 확인하세요',
    modalTip: '여행 팁',
    modalDirections: 'Google Maps에서 열기',
    modalSave: '장소 저장하기',
    modalAddPlan: '내 일정에 추가',
    modalRemovePlan: '내 일정에서 빼기',
    modalShare: '공유',
    modalReport: '정보 오류 신고',
    modalOfficial: '공식 관광정보',
    searchAria: '전북 관광지 검색',
    brandAria: '전북 관광 가이드 홈',
    clearSearchAria: '검색어 지우기',
    regionSelectAria: '전북 지역 선택',
    plannerRegionsAria: '여행 일정에 포함할 지역',
    categoryNavAria: '관광지 테마 필터',
    resultsToolbarAria: '관광지 정렬 및 필터',
    backToTopAria: '맨 위로 이동',
    modalSnapshotAria: '명소 핵심 정보',
    modalCloseAria: '상세 정보 닫기',
    drawerCloseAria: '마이페이지 닫기',
    mobileNavAria: '주요 모바일 메뉴',
    drawerKicker: '나의 전북 여행',
    drawerTitle: '마이페이지',
    drawerDesc: '저장한 장소와 여행 일정을 한곳에서 확인하세요.',
    drawerPlan: '저장한 장소로 일정 만들기',
    personalizedKicker: '당신을 위한 DAMDA 추천',
    personalizedTitle: '여행 성향에 맞춘 전북',
    personalizedPlan: '맞춤 추천 일정 만들기',
    personalizedEdit: '여행 성향 수정',
    footerDiagnosis: '여행 성향 진단',
    funnelSkip: '다음에 하기',
    funnelKicker: '당신의 다음 한국 여행',
    funnelStatusTitle: '현재 상황에 가장 가까운 항목은 무엇인가요?',
    funnelStatusDesc: '한 가지를 선택해주세요. 필요한 여행 정보를 이해하는 데 도움이 됩니다.',
    funnelFirstTrip: '첫 한국 여행을 계획하고 있어요',
    funnelVisited: '한국을 여행해본 적이 있어요',
    funnelReturn: '한국 재방문을 계획하고 있어요',
    funnelResident: '현재 한국에 거주하고 있어요',
    funnelCountryKicker: '어디에서 오셨나요?',
    funnelCountryTitle: '당신의 나라는 어디인가요?',
    funnelCountryDesc: '국가별로 더 유용한 여행 정보를 준비하는 데 활용합니다.',
    funnelCountryLabel: '국가',
    funnelCountryPlaceholder: '예: 멕시코',
    funnelInterestKicker: '원하는 여행을 알려주세요',
    funnelInterestTitle: '어떤 여행을 원하시나요?',
    funnelInterestDesc: '최대 3개까지 선택할 수 있습니다.',
    funnelTradition: '전통문화와 한옥',
    funnelFood: '음식과 카페',
    funnelNature: '산과 자연',
    funnelCoast: '바다와 해안',
    funnelFestival: '축제와 행사',
    funnelLocal: '로컬 일상 체험',
    funnelWellness: '휴식과 웰니스',
    funnelWinter: '겨울과 스키',
    funnelContactKicker: 'DAMDA와 계속 연결되기',
    funnelContactTitle: '추천 코스와 향후 초대 소식을 받아보시겠어요?',
    funnelContactDesc: '연락처는 선택사항입니다. 입력하지 않아도 여행 성향 답변은 저장됩니다.',
    funnelContactType: '정보를 받을 방법',
    funnelContactValue: '연락처',
    funnelConsent: 'DAMDA의 여행·체험 관련 정보를 받는 것에 동의합니다. 언제든 수신 중지를 요청할 수 있습니다.',
    funnelPrivacy: 'DAMDA는 관광 수요 분석에 답변을 활용하며, 동의한 경우에만 연락처를 사용합니다.',
    funnelPrivacyLink: '개인정보 처리방침 보기',
    funnelBack: '이전',
    funnelNext: '계속하기',
    funnelSubmit: '내 여행 성향 저장',
    funnelSuccessTitle: '감사합니다. 당신의 여행을 더 잘 알게 됐어요.',
    funnelSuccessDesc: '이제 관심사에 맞는 전북 여행지를 둘러보세요.',
    funnelExplore: '추천 여행지 보기',
    reportKicker: 'DAMDA의 여행 정보를 함께 정확하게 만들어주세요',
    reportTitle: '어떤 정보를 확인해야 하나요?',
    reportType: '수정할 정보',
    reportPhoto: '사진이 장소와 다름',
    reportDetails: '운영시간·요금·연락처',
    reportLocation: '주소 또는 위치',
    reportClosed: '폐업 또는 운영 종료',
    reportTranslation: '이름 또는 번역',
    reportOther: '기타',
    reportNote: '확인한 내용을 알려주세요',
    reportPlaceholder: '간단히 적어주세요. 개인정보는 입력하지 마세요.',
    reportSubmit: '신고 보내기'
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
const filterResetBtn = document.getElementById('filterResetBtn');
const regionResetBtn = document.getElementById('regionResetBtn');
const savedHeaderBtn = document.getElementById('savedHeaderBtn');
const savedCount = document.getElementById('savedCount');
const mobileSavedCount = document.getElementById('mobileSavedCount');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreLabel = document.getElementById('loadMoreLabel');
const personalizedPanel = document.getElementById('personalizedPanel');
const personalizedSummary = document.getElementById('personalizedSummary');
const personalizedTags = document.getElementById('personalizedTags');
const personalizedSpots = document.getElementById('personalizedSpots');
const travelProfileInvite = document.getElementById('travelProfileInvite');
const profileInviteContinue = document.getElementById('profileInviteContinue');
const damdaPicksGrid = document.getElementById('damdaPicksGrid');

const apiStatusBadge = document.getElementById('apiStatusBadge');
const apiStatusText = document.getElementById('apiStatusText');
const apiModal = document.getElementById('apiModal');
const apiKeyInput = document.getElementById('apiKeyInput');

const courseGrid = document.getElementById('courseGrid');
const courseSection = document.getElementById('courseSection');
const plannerSection = document.getElementById('plannerSection');
const plannerRegionChips = document.getElementById('plannerRegionChips');
const plannerRegionSummary = document.getElementById('plannerRegionSummary');
const plannerRegionsToggle = document.getElementById('plannerRegionsToggle');
const routePresetSelect = document.getElementById('routePresetSelect');
const plannerResult = document.getElementById('plannerResult');
const plannerOrigin = document.getElementById('plannerOrigin');
const plannerDate = document.getElementById('plannerDate');
const plannerStartTime = document.getElementById('plannerStartTime');
const plannerTransport = document.getElementById('plannerTransport');
const regionSelectMobile = document.getElementById('regionSelectMobile');

const tourModal = document.getElementById('tourModal');
const modalImg = document.getElementById('modalImg');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalAddress = document.getElementById('modalAddress');
const modalDesc = document.getElementById('modalDesc');
const modalDescToggle = document.getElementById('modalDescToggle');
const modalTags = document.getElementById('modalTags');
const modalDuration = document.getElementById('modalDuration');
const modalDurationSource = document.getElementById('modalDurationSource');
const modalDurationNote = document.getElementById('modalDurationNote');
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
const reportModal = document.getElementById('reportModal');
const reportForm = document.getElementById('reportForm');
const reportPlaceName = document.getElementById('reportPlaceName');
const reportIssueType = document.getElementById('reportIssueType');
const reportNote = document.getElementById('reportNote');
const reportError = document.getElementById('reportError');
const reportSubmitBtn = document.getElementById('reportSubmitBtn');

const savedDrawer = document.getElementById('savedDrawer');
const savedList = document.getElementById('savedList');
const savedPlanBtn = document.getElementById('savedPlanBtn');
const savedPlanSummary = document.getElementById('savedPlanSummary');
const appToast = document.getElementById('appToast');
const mobileNavButtons = [...document.querySelectorAll('.mobile-bottom-nav [data-mobile-nav]')];
const travelFunnel = document.getElementById('travelFunnel');
const travelFunnelForm = document.getElementById('travelFunnelForm');
const travelFunnelSuccess = document.getElementById('travelFunnelSuccess');
const funnelProgressBar = document.getElementById('funnelProgressBar');
const funnelStepLabel = document.getElementById('funnelStepLabel');
const funnelBackBtn = document.getElementById('funnelBackBtn');
const funnelNextBtn = document.getElementById('funnelNextBtn');
const funnelSubmitBtn = document.getElementById('funnelSubmitBtn');
const funnelError = document.getElementById('funnelError');
const funnelContactType = document.getElementById('funnelContactType');
const funnelContactValue = document.getElementById('funnelContactValue');
let travelFunnelStep = 1;
let travelFunnelStartedAt = 0;
let travelFunnelCategory = 'all';
let travelFunnelOpenedManually = false;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
  requestAnimationFrame(() => window.scrollTo(0, 0));
}, { once: true });

window.addEventListener('pageshow', event => {
  if (event.persisted) window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
  if (plannerDate && !plannerDate.value) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    plannerDate.value = tomorrow.toISOString().slice(0, 10);
  }
  applyRoutePreset(activeRoutePreset, false);
  restoreSavedPlan();
  updateApiStatusBadge();
  applyLanguage(currentLanguage, false);
  initMobileNavigation();
  initTravelFunnel();
  renderDamdaPicks();
  initPlaceReport();
  renderPersonalizedPanel();
  openSharedTourFromUrl();
  openSharedPlanFromUrl();
  trackEvent('page_view');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (reportModal?.classList.contains('active')) {
    closeReportModal();
  } else if (travelFunnel?.classList.contains('active')) {
    snoozeTravelFunnel();
  } else if (tourModal?.classList.contains('active')) {
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

function buildGoogleMapsDayRouteUrl(stops, travelMode = 'transit') {
  const validStops = (stops || []).filter(Boolean);
  if (!validStops.length) return 'https://www.google.com/maps';
  if (validStops.length === 1) return buildGoogleMapsDirectionsUrl(validStops[0], travelMode);
  const params = new URLSearchParams({
    api: '1',
    origin: getGoogleMapsWaypoint(validStops[0]),
    destination: getGoogleMapsWaypoint(validStops.at(-1)),
    travelmode: travelMode,
    dir_action: 'navigate'
  });
  const waypoints = validStops.slice(1, -1).map(getGoogleMapsWaypoint).filter(Boolean);
  if (waypoints.length) params.set('waypoints', waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getAnalyticsSessionId() {
  try {
    const key = 'damda_session_id';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return '';
  }
}

function trackEvent(eventName, context = {}) {
  if (window.location.protocol !== 'https:' || !eventName) return;
  const safeContext = Object.fromEntries(Object.entries(context)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .slice(0, 10));
  fetch(ANALYTICS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      sessionId: getAnalyticsSessionId(),
      language: currentLanguage,
      pagePath: window.location.pathname,
      context: safeContext
    }),
    keepalive: true
  }).catch(() => {});
}

function trackFunnelValidationError(field) {
  trackEvent('funnel_validation_error', {
    step: travelFunnelStep,
    field,
    manual: travelFunnelOpenedManually
  });
}

const PERSONALIZATION_RULES = {
  tradition: { categories: ['culture'], regions: ['jeonju', 'iksan', 'wanju', 'namwon'] },
  food: { categories: ['food'], regions: ['jeonju', 'gunsan', 'sunchang', 'imsil'] },
  nature: { categories: ['nature'], regions: ['jeongeup', 'jinan', 'muju', 'buan'] },
  coast: { categories: ['nature', 'food'], regions: ['gunsan', 'buan', 'gochang'] },
  festival: { categories: ['festival'], regions: ['jeonju', 'gimje', 'namwon', 'muju'] },
  local: { categories: ['food', 'culture'], regions: ['gunsan', 'namwon', 'sunchang', 'jeonju'] },
  wellness: { categories: ['nature'], regions: ['jinan', 'muju', 'imsil', 'jangsu'] },
  winter: { categories: ['nature'], regions: ['muju', 'jeongeup', 'jinan'] }
};

function getTravelProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(TRAVEL_PROFILE_STORAGE_KEY) || 'null');
    return profile && Array.isArray(profile.interests) && profile.interests.length ? profile : null;
  } catch {
    localStorage.removeItem(TRAVEL_PROFILE_STORAGE_KEY);
    return null;
  }
}

function getInterestLabel(interest) {
  const labels = currentLanguage === 'ko'
    ? { tradition: '전통문화', food: '음식·카페', nature: '산·자연', coast: '바다·해안', festival: '축제', local: '로컬 체험', wellness: '휴식·웰니스', winter: '겨울·스키' }
    : { tradition: 'Tradición', food: 'Comida y cafés', nature: 'Naturaleza', coast: 'Mar y costa', festival: 'Festivales', local: 'Vida local', wellness: 'Bienestar', winter: 'Invierno y esquí' };
  return labels[interest] || interest;
}

function getJourneyLabel(status) {
  const labels = currentLanguage === 'ko'
    ? { planning_first: '첫 한국 여행', visited_before: '한국 여행 경험자', planning_return: '한국 재방문', living_in_korea: '한국 거주 여행자' }
    : { planning_first: 'tu primer viaje a Corea', visited_before: 'un nuevo viaje después de conocer Corea', planning_return: 'tu regreso a Corea', living_in_korea: 'una escapada desde Corea' };
  return labels[status] || (currentLanguage === 'ko' ? '전북 여행' : 'tu viaje por Jeonbuk');
}

function renderTravelProfileInvite() {
  if (!travelProfileInvite) return;
  const completed = Boolean(localStorage.getItem('damda_travel_profile_completed'));
  travelProfileInvite.hidden = completed;
  if (completed) return;
  const draftStatus = localStorage.getItem(TRAVEL_PROFILE_DRAFT_KEY) || '';
  travelProfileInvite.querySelectorAll('[data-journey-status]').forEach(button => {
    const selected = button.dataset.journeyStatus === draftStatus;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (profileInviteContinue) profileInviteContinue.hidden = !draftStatus;
}

function startTravelProfile(status) {
  if (!['planning_first', 'visited_before', 'planning_return', 'living_in_korea'].includes(status)) return;
  localStorage.setItem(TRAVEL_PROFILE_DRAFT_KEY, status);
  renderTravelProfileInvite();
  showToast(currentLanguage === 'ko'
    ? '저장했습니다. 맞춤 추천이 필요할 때 이어서 입력하세요.'
    : 'Guardado. Completa el perfil cuando quieras recomendaciones personales.');
  trackEvent('profile_invite_answer', { journeyStatus: status });
}

function continueTravelProfile() {
  const draftStatus = localStorage.getItem(TRAVEL_PROFILE_DRAFT_KEY);
  openTravelFunnel(true);
  const input = travelFunnelForm?.querySelector(`input[name="journeyStatus"][value="${draftStatus}"]`);
  if (input) input.checked = true;
  travelFunnelStep = input ? 2 : 1;
  renderTravelFunnelStep();
}

function getPersonalizedReason(tour, profile) {
  const match = (profile?.interests || []).find(interest => {
    const rule = PERSONALIZATION_RULES[interest];
    return rule && (rule.categories.includes(tour.category) || rule.regions.includes(tour.regionId));
  });
  if (!match) return currentLanguage === 'ko' ? 'DAMDA 편집 추천' : 'Selección editorial DAMDA';
  return currentLanguage === 'ko'
    ? `${getInterestLabel(match)} 관심사와 잘 맞아요`
    : `Porque elegiste ${getInterestLabel(match).toLowerCase()}`;
}

function renderDamdaPicks() {
  if (!damdaPicksGrid) return;
  damdaPicksGrid.innerHTML = DAMDA_COLLECTIONS.map(collection => {
    const localized = collection[currentLanguage === 'ko' ? 'ko' : 'es'];
    const spots = collection.spotIds.map(findTourById).filter(Boolean);
    const cover = findTourById(collection.coverId) || spots[0];
    return `
      <article class="damda-pick-card">
        <button type="button" onclick="applyDamdaCollection('${escapeHTML(collection.id)}')">
          <span class="damda-pick-image${cover?.image ? '' : ' image-unavailable'}">
            ${cover?.image ? `<img src="${escapeHTML(cover.image)}" alt="" loading="lazy" decoding="async" onerror="handleImageError(this)">` : ''}
            <i class="${collection.icon}" aria-hidden="true"></i>
          </span>
          <span class="damda-pick-copy">
            <small>DAMDA PICK</small>
            <strong>${escapeHTML(localized.title)}</strong>
            <span>${escapeHTML(localized.desc)}</span>
            <em>${spots.map(tour => escapeHTML(getRegionName(tour.regionId, tour.regionName))).filter((name, index, all) => all.indexOf(name) === index).join(' · ')}</em>
          </span>
          <span class="damda-pick-action">${currentLanguage === 'ko' ? '이 코스로 시작' : 'Empezar con esta ruta'} <i class="fa-solid fa-arrow-right"></i></span>
        </button>
      </article>`;
  }).join('');
}

function applyDamdaCollection(collectionId) {
  const collection = DAMDA_COLLECTIONS.find(item => item.id === collectionId);
  if (!collection) return;
  const tours = collection.spotIds.map(findTourById).filter(Boolean);
  const regionIds = [...new Set(tours.map(tour => tour.regionId))];
  selectedPlannerRegions = new Set(regionIds);
  renderPlannerRegionOptions();
  const localized = collection[currentLanguage === 'ko' ? 'ko' : 'es'];
  generateTravelPlan({
    duration: collection.id === 'first-jeonbuk' ? 2 : 1,
    pace: 3,
    tourIds: collection.spotIds,
    regionIds,
    title: localized.title
  });
  trackEvent('damda_pick_open', { collection: collection.id });
}

function scrollToAllPlaces() {
  document.getElementById('regionSelector')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getPersonalizedTours(profile, limit = 6) {
  if (!profile) return [];
  const interests = profile.interests.filter(interest => PERSONALIZATION_RULES[interest]);
  const allTours = getAllTours();
  const ranked = allTours.map((tour, index) => {
    let score = Math.max(0, 10 - index * 0.001) + Number(tour.rating || 0);
    interests.forEach((interest, interestIndex) => {
      const rule = PERSONALIZATION_RULES[interest];
      if (rule.categories.includes(tour.category)) score += 45 - interestIndex * 3;
      const regionRank = rule.regions.indexOf(tour.regionId);
      if (regionRank >= 0) score += 22 - regionRank * 3;
    });
    return { tour, score };
  }).sort((a, b) => b.score - a.score);

  const selected = [];
  const selectedRegions = new Set();
  ranked.forEach(({ tour }) => {
    if (selected.length >= limit) return;
    if (selectedRegions.has(tour.regionId) && selected.length < Math.min(4, limit)) return;
    selected.push(tour);
    selectedRegions.add(tour.regionId);
  });
  ranked.forEach(({ tour }) => {
    if (selected.length < limit && !selected.some(item => item.id === tour.id)) selected.push(tour);
  });
  return selected.slice(0, limit);
}

function renderPersonalizedPanel() {
  if (!personalizedPanel || !personalizedSummary || !personalizedTags || !personalizedSpots) return;
  const profile = getTravelProfile();
  if (!profile) {
    personalizedPanel.hidden = true;
    personalizedTourIds = [];
    return;
  }

  const recommendations = getPersonalizedTours(profile);
  personalizedTourIds = recommendations.map(tour => tour.id);
  personalizedPanel.hidden = recommendations.length === 0;
  const interests = profile.interests.map(getInterestLabel);
  personalizedSummary.textContent = currentLanguage === 'ko'
    ? `${profile.country || '여행자'} · ${getJourneyLabel(profile.journeyStatus)}에 맞춰 ${interests.join(', ')} 중심으로 골랐습니다.`
    : `Para ${getJourneyLabel(profile.journeyStatus)} desde ${profile.country || 'tu país'}, combinamos ${interests.join(' + ')}.`;
  personalizedTags.innerHTML = interests.map(label => `<span>${escapeHTML(label)}</span>`).join('');
  personalizedSpots.innerHTML = recommendations.slice(0, 3).map(tour => `
    <button type="button" class="personalized-spot" onclick="openModal('${escapeHTML(tour.id)}')">
      <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" decoding="async" onerror="handleImageError(this)">
      <span><small>${escapeHTML(getRegionName(tour.regionId, tour.regionName))}</small><strong>${escapeHTML(getTourName(tour))}</strong><em>${escapeHTML(getPersonalizedReason(tour, profile))}</em></span>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `).join('');
}

function createPersonalizedPlan() {
  const profile = getTravelProfile();
  const tours = personalizedTourIds.map(findTourById).filter(Boolean);
  if (!profile || !tours.length) return;
  const duration = profile.journeyStatus === 'living_in_korea' ? 1 : 2;
  const regionIds = [...new Set(tours.map(tour => tour.regionId))].slice(0, 6);
  selectedPlannerRegions = new Set(regionIds);
  renderPlannerRegionOptions();
  const durationSelect = document.getElementById('plannerDuration');
  if (durationSelect) durationSelect.value = String(duration);
  const theme = PERSONALIZATION_RULES[profile.interests[0]]?.categories[0] || 'all';
  const themeSelect = document.getElementById('plannerTheme');
  if (themeSelect) themeSelect.value = theme;
  generateTravelPlan({
    duration,
    theme,
    pace: 3,
    tourIds: tours.slice(0, duration * 3).map(tour => tour.id),
    regionIds,
    title: currentLanguage === 'ko' ? '나를 위한 DAMDA 추천 여행' : 'Mi ruta recomendada por DAMDA'
  });
  trackEvent('personalized_plan_create', { interests: profile.interests.length, duration });
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
  return `<a href="${escapeHTML(buildGoogleMapsDirectionsUrl(destinationTour, mode, originTour))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(label)} · Google Maps" onclick="trackEvent('planner_route_mode_open', { mode: '${escapeHTML(mode)}', source: 'segment' })"><i class="${icon}"></i><span>${escapeHTML(label)}</span></a>`;
}

function t(key) {
  const currentDictionary = I18N[currentLanguage];
  if (currentDictionary && Object.prototype.hasOwnProperty.call(currentDictionary, key)) {
    return currentDictionary[key];
  }
  if (Object.prototype.hasOwnProperty.call(I18N.es, key)) {
    return I18N.es[key];
  }
  return key;
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
  return currentLanguage === 'ko' ? tour.name : (TOUR_NAMES_ES[tour.id] || localizeKoreanPlaceName(tour.name));
}

function getLocalizedAddress(tour) {
  if (!tour) return '';
  if (currentLanguage === 'ko') return tour.address || '';
  return `${getRegionName(tour.regionId, tour.regionName)}, Jeonbuk`;
}

function romanizeKorean(value = '') {
  const initials = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  const vowels = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  const finals = ['', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h'];
  const romanized = [...String(value)].map(character => {
    const code = character.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return character;
    const initial = Math.floor(code / 588);
    const vowel = Math.floor((code % 588) / 28);
    const final = code % 28;
    return `${initials[initial]}${vowels[vowel]}${finals[final]}`;
  }).join('');
  return romanized.replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

const KOREAN_PLACE_TYPES_ES = [
  { suffix: '호수공원', label: 'Parque del Lago' },
  { suffix: '국립공원', label: 'Parque Nacional' },
  { suffix: '도립공원', label: 'Parque Provincial' },
  { suffix: '군립공원', label: 'Parque Comarcal' },
  { suffix: '자연휴양림', label: 'Bosque Recreativo' },
  { suffix: '생태공원', label: 'Parque Ecológico' },
  { suffix: '테마공원', label: 'Parque Temático' },
  { suffix: '테마파크', label: 'Parque Temático' },
  { suffix: '해수욕장', label: 'Playa' },
  { suffix: '출렁다리', label: 'Puente Colgante' },
  { suffix: '전통시장', label: 'Mercado Tradicional' },
  { suffix: '한옥마을', label: 'Aldea Hanok' },
  { suffix: '문화예술촌', label: 'Aldea de Arte y Cultura' },
  { suffix: '박물관', label: 'Museo' },
  { suffix: '미술관', label: 'Museo de Arte' },
  { suffix: '문학관', label: 'Museo Literario' },
  { suffix: '기념관', label: 'Memorial' },
  { suffix: '문화관', label: 'Centro Cultural' },
  { suffix: '전시관', label: 'Centro de Exposiciones' },
  { suffix: '체험관', label: 'Centro de Experiencias' },
  { suffix: '수목원', label: 'Jardín Botánico' },
  { suffix: '식물원', label: 'Jardín Botánico' },
  { suffix: '동물원', label: 'Zoológico' },
  { suffix: '스키장', label: 'Estación de Esquí' },
  { suffix: '전망대', label: 'Mirador' },
  { suffix: '폭포', label: 'Cascada' },
  { suffix: '계곡', label: 'Valle' },
  { suffix: '저수지', label: 'Embalse' },
  { suffix: '호수', label: 'Lago' },
  { suffix: '정원', label: 'Jardín' },
  { suffix: '공원', label: 'Parque' },
  { suffix: '성당', label: 'Catedral' },
  { suffix: '향교', label: 'Escuela Confuciana' },
  { suffix: '서원', label: 'Academia Confuciana' },
  { suffix: '산성', label: 'Fortaleza de Montaña' },
  { suffix: '읍성', label: 'Fortaleza' },
  { suffix: '시장', label: 'Mercado' },
  { suffix: '마을', label: 'Aldea' },
  { suffix: '축제', label: 'Festival' },
  { suffix: '농장', label: 'Granja' },
  { suffix: '목장', label: 'Rancho' },
  { suffix: '온천', label: 'Termas' },
  { suffix: '캠핑장', label: 'Camping' },
  { suffix: '둘레길', label: 'Sendero Circular' },
  { suffix: '산책길', label: 'Paseo' },
  { suffix: '길', label: 'Sendero' }
];

function localizeKoreanPlaceName(value = '') {
  const cleanName = String(value).replace(/\s+/g, ' ').trim();
  if (!/[가-힣]/.test(cleanName)) return cleanName;

  const nationalMuseum = cleanName.match(/^국립(.+)박물관$/);
  if (nationalMuseum) return `Museo Nacional de ${romanizeKorean(nationalMuseum[1])}`;

  const matchedType = KOREAN_PLACE_TYPES_ES.find(type => cleanName.endsWith(type.suffix));
  if (matchedType) {
    const baseName = cleanName.slice(0, -matchedType.suffix.length).trim();
    return baseName ? `${matchedType.label} ${romanizeKorean(baseName)}` : matchedType.label;
  }

  if (/^[가-힣\s]{2,}사$/.test(cleanName)) return `Templo ${romanizeKorean(cleanName)}`;
  if (/^[가-힣\s]{2,}산$/.test(cleanName)) return `Monte ${romanizeKorean(cleanName)}`;
  return romanizeKorean(cleanName);
}

function getResolvedCategory(tour) {
  if (!tour || tour.category === 'festival' || tour.category === 'food') return tour?.category || 'culture';
  const value = `${tour.name || ''} ${tour.subCategory || ''}`;
  if (/박물관|미술관|문학관|기념관|문화관|전시관|성당|교회|사찰|향교|서원|사당|고택|생가|한옥|읍성|산성|유적|문화|예술|역사/.test(value)) return 'culture';
  if (/국립공원|도립공원|군립공원|자연휴양림|생태|수목원|식물원|동물원|해수욕장|계곡|폭포|호수|저수지|습지|숲|정원|둘레길|산책길|산$|섬$/.test(value)) return 'nature';
  if (/시장|장터|카페|커피|다방|빵|제과|베이커리|음식|식당/.test(value)) return 'food';
  return tour.category;
}

function getSpanishTypeDescription(tour) {
  const region = getRegionName(tour.regionId, tour.regionName);
  const value = `${tour.name || ''} ${tour.subCategory || ''}`;
  if (/박물관|미술관|문학관|기념관|문화관|전시관/.test(value)) return `Un espacio para conocer la historia, el arte y la identidad local de ${region}.`;
  if (/해수욕장|해변|바다|해안/.test(value)) return `Costa de ${region} para pasear junto al mar y disfrutar del paisaje.`;
  if (/자연휴양림|숲/.test(value)) return `Bosque y senderos para descansar y caminar al aire libre en ${region}.`;
  if (/국립공원|도립공원|군립공원|산$/.test(value)) return `Paisaje de montaña y rutas al aire libre para descubrir en ${region}.`;
  if (/계곡|폭포/.test(value)) return `Agua, bosque y senderos para una escapada de naturaleza en ${region}.`;
  if (/수목원|식물원|정원/.test(value)) return `Jardines y senderos para una pausa tranquila entre plantas y paisaje.`;
  if (/성당|교회/.test(value)) return `Arquitectura religiosa e historia local para conocer en ${region}.`;
  if (/사찰|^[가-힣\s]{2,}사$/.test(value)) return `Patrimonio budista y un entorno sereno para recorrer sin prisa.`;
  if (/시장|장터/.test(value)) return `Un mercado local para probar sabores y observar la vida cotidiana de ${region}.`;
  if (/카페|커피|다방|빵|제과|베이커리/.test(value)) return `Una parada local para descansar y descubrir los sabores de ${region}.`;
  if (/마을|한옥/.test(value)) return `Una aldea para acercarse al paisaje, los oficios y la cultura local de ${region}.`;
  if (/축제|행사/.test(value)) return `Una celebración local para vivir la cultura y el ambiente de ${region}.`;
  if (/공원|호수|저수지/.test(value)) return `Un espacio abierto para caminar, descansar y conocer el paisaje de ${region}.`;
  return {
    culture: `Historia y patrimonio para descubrir en ${region}.`,
    nature: `Naturaleza y paisajes para disfrutar en ${region}.`,
    food: `Una parada para conocer los sabores locales de ${region}.`,
    festival: `Una experiencia cultural para vivir en ${region}.`
  }[tour.category] || `Un lugar recomendado para conocer ${region}.`;
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

function getTourTrustMeta(tour) {
  const sourceUrl = tour?.sourceUrl || '';
  const officialSource = /tour\.jb\.go\.kr|visitkorea\.or\.kr|korean\.visitkorea\.or\.kr/i.test(sourceUrl);
  const damdaPick = DAMDA_COLLECTIONS.some(collection => collection.spotIds.includes(tour?.id));
  return {
    officialSource,
    damdaPick,
    label: currentLanguage === 'ko'
      ? `${damdaPick ? 'DAMDA Pick · ' : ''}${officialSource ? '공식 출처 확인' : '출처 확인 필요'}`
      : `${damdaPick ? 'DAMDA Pick · ' : ''}${officialSource ? 'fuente oficial revisada' : 'fuente por verificar'}`,
    reviewedAt: CATALOG_VERIFIED_AT
  };
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
  if (currentLanguage === 'ko') return tour.overview || tour.desc || tour.highlight || '';
  const curated = TOUR_DESCRIPTIONS_ES[tour.id];
  const fallback = getSpanishTypeDescription(tour);
  const practicalTip = {
    culture: 'Recórrelo sin prisa y presta atención a los detalles del lugar.',
    nature: 'La experiencia cambia con la estación y el clima; lleva calzado cómodo.',
    food: 'Comprueba el horario y los días de cierre antes de ir.',
    festival: 'Las fechas y el programa cambian cada año; revisa la edición vigente.'
  }[tour.category] || 'Comprueba el acceso y la información actualizada antes de ir.';
  return `${curated || fallback}\n\n${practicalTip}`;
}

function getCardDescription(tour) {
  if (currentLanguage === 'es') {
    if (TOUR_DESCRIPTIONS_ES[tour.id]) return TOUR_DESCRIPTIONS_ES[tour.id];
    return getSpanishTypeDescription(tour);
  }

  const source = String(tour.overview || tour.desc || tour.highlight || '').replace(/\s+/g, ' ').trim();
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
    if (value !== undefined && value !== null) element.textContent = value;
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
  if (savedHeaderBtn) {
    savedHeaderBtn.setAttribute('aria-label', currentLanguage === 'ko' ? '마이페이지 열기' : 'Abrir mi viaje');
  }
  document.querySelector('.brand-logo')?.setAttribute('aria-label', t('brandAria'));
  searchInput?.setAttribute('aria-label', t('searchAria'));
  searchClearBtn?.setAttribute('aria-label', t('clearSearchAria'));
  regionSelectMobile?.setAttribute('aria-label', t('regionSelectAria'));
  plannerRegionChips?.setAttribute('aria-label', t('plannerRegionsAria'));
  document.querySelector('.category-nav')?.setAttribute('aria-label', t('categoryNavAria'));
  document.querySelector('.results-toolbar')?.setAttribute('aria-label', t('resultsToolbarAria'));
  document.getElementById('backToTopBtn')?.setAttribute('aria-label', t('backToTopAria'));
  document.querySelector('.modal-snapshot')?.setAttribute('aria-label', t('modalSnapshotAria'));
  document.querySelector('#tourModal .modal-close-btn')?.setAttribute('aria-label', t('modalCloseAria'));
  document.querySelector('#reportModal .report-close-btn')?.setAttribute('aria-label', currentLanguage === 'ko' ? '정보 오류 신고 닫기' : 'Cerrar reporte');
  document.querySelector('#savedDrawer .drawer-close-btn')?.setAttribute('aria-label', t('drawerCloseAria'));
  document.querySelector('.mobile-bottom-nav')?.setAttribute('aria-label', t('mobileNavAria'));

  initRegionChips();
  initRegionSelect();
  renderPlannerRegionOptions();
  updatePlannerRegionPickerUI();
  renderRecommendedCourses();
  renderDamdaPicks();
  renderTravelProfileInvite();
  renderPersonalizedPanel();
  updateSavedUI();
  if (currentPlan.length) {
    renderTravelPlan(currentPlanContext.duration, currentPlanContext.title, currentPlanContext.regionIds);
  }
  updateUI();
  if (activeTourId && tourModal?.classList.contains('active')) {
    openModal(activeTourId, false);
  }
  if (activeTourId && reportModal?.classList.contains('active')) {
    const activeTour = findTourById(activeTourId);
    if (activeTour && reportPlaceName) reportPlaceName.textContent = getTourName(activeTour);
  }
}

function setLanguage(language) {
  const previousLanguage = currentLanguage;
  applyLanguage(language, true);
  if (previousLanguage !== currentLanguage) {
    trackEvent('language_change', { from: previousLanguage, to: currentLanguage });
  }
}

function handleLanguageButton(language) {
  const isCompactMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isCompactMobile && currentLanguage === language) {
    setLanguage(language === 'ko' ? 'es' : 'ko');
    return;
  }
  setLanguage(language);
}

function initTravelFunnel() {
  if (!travelFunnel || !travelFunnelForm) return;

  travelFunnelForm.addEventListener('submit', submitTravelFunnel);
  travelFunnelForm.querySelectorAll('input[name="interests"]').forEach(input => {
    input.addEventListener('change', event => {
      const selected = travelFunnelForm.querySelectorAll('input[name="interests"]:checked');
      if (selected.length > 3) {
        event.currentTarget.checked = false;
        showTravelFunnelError(currentLanguage === 'ko' ? '관심사는 최대 3개까지 선택할 수 있습니다.' : 'Puedes elegir hasta 3 intereses.');
      } else {
        clearTravelFunnelError();
      }
    });
  });

  funnelContactType?.addEventListener('change', updateTravelFunnelContactField);
  updateTravelFunnelContactField();

  renderTravelProfileInvite();
  scheduleAutomaticTravelFunnel();
}

function shouldOpenTravelFunnelAutomatically() {
  if (localStorage.getItem('damda_travel_profile_completed')) return false;
  const snoozedUntil = Number(localStorage.getItem('damda_travel_profile_snoozed_until') || 0);
  if (Number.isFinite(snoozedUntil) && snoozedUntil > Date.now()) return false;
  if (snoozedUntil) localStorage.removeItem('damda_travel_profile_snoozed_until');
  return true;
}

function scheduleAutomaticTravelFunnel() {
  if (!shouldOpenTravelFunnelAutomatically()) return;
  window.setTimeout(() => {
    if (!travelFunnel?.classList.contains('active')) openTravelFunnel(false);
  }, 450);
}

function openTravelFunnel(manual = false) {
  if (!travelFunnel || !travelFunnelForm) return;
  if (manual) resetTravelFunnel();
  travelFunnel.classList.add('active');
  travelFunnel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('funnel-open');
  travelFunnelStartedAt = Date.now();
  travelFunnelOpenedManually = manual;
  renderTravelFunnelStep();
  trackEvent('funnel_open', { manual });
  window.requestAnimationFrame(() => {
    travelFunnel.querySelector('.travel-funnel-step.active input')?.focus();
  });
}

function closeTravelFunnel() {
  if (!travelFunnel) return;
  travelFunnel.classList.remove('active');
  travelFunnel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('funnel-open');
}

function snoozeTravelFunnel() {
  trackEvent('funnel_skip', {
    step: travelFunnelStep,
    manual: travelFunnelOpenedManually,
    elapsedMs: Math.max(0, Date.now() - travelFunnelStartedAt)
  });
  if (!localStorage.getItem('damda_travel_profile_completed')) {
    localStorage.setItem('damda_travel_profile_snoozed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }
  closeTravelFunnel();
}

function resetTravelFunnel() {
  travelFunnelForm?.reset();
  travelFunnelStep = 1;
  travelFunnelCategory = 'all';
  if (travelFunnelForm) travelFunnelForm.hidden = false;
  if (travelFunnelSuccess) travelFunnelSuccess.hidden = true;
  clearTravelFunnelError();
  updateTravelFunnelContactField();
}

function renderTravelFunnelStep() {
  if (!travelFunnelForm) return;
  travelFunnelForm.querySelectorAll('[data-funnel-step]').forEach(section => {
    const active = Number(section.dataset.funnelStep) === travelFunnelStep;
    section.hidden = !active;
    section.classList.toggle('active', active);
  });
  if (funnelProgressBar) funnelProgressBar.style.width = `${travelFunnelStep * 25}%`;
  if (funnelStepLabel) funnelStepLabel.textContent = `${travelFunnelStep} / 4`;
  if (funnelBackBtn) funnelBackBtn.hidden = travelFunnelStep === 1;
  if (funnelNextBtn) funnelNextBtn.hidden = travelFunnelStep === 4;
  if (funnelSubmitBtn) funnelSubmitBtn.hidden = travelFunnelStep !== 4;
  clearTravelFunnelError();
}

function changeTravelFunnelStep(direction) {
  if (direction > 0 && !validateTravelFunnelStep(travelFunnelStep)) return;
  const previousStep = travelFunnelStep;
  travelFunnelStep = Math.max(1, Math.min(4, travelFunnelStep + direction));
  renderTravelFunnelStep();
  if (direction < 0) {
    trackEvent('funnel_back', { fromStep: previousStep, toStep: travelFunnelStep });
  }
  trackEvent('funnel_step', { step: travelFunnelStep });
  travelFunnelForm?.querySelector('.travel-funnel-step.active input, .travel-funnel-step.active select')?.focus();
}

function validateTravelFunnelStep(step) {
  if (!travelFunnelForm) return false;
  if (step === 1 && !travelFunnelForm.querySelector('input[name="journeyStatus"]:checked')) {
    trackFunnelValidationError('journey_status');
    showTravelFunnelError(currentLanguage === 'ko' ? '현재 상황을 한 가지 선택해주세요.' : 'Elige una opción para continuar.');
    return false;
  }
  if (step === 2) {
    const country = travelFunnelForm.elements.country.value.trim();
    if (country.length < 2) {
      trackFunnelValidationError('country');
      showTravelFunnelError(currentLanguage === 'ko' ? '국가를 입력해주세요.' : 'Escribe tu país para continuar.');
      return false;
    }
  }
  if (step === 3) {
    const interestCount = travelFunnelForm.querySelectorAll('input[name="interests"]:checked').length;
    if (!interestCount) {
      trackFunnelValidationError('interests');
      showTravelFunnelError(currentLanguage === 'ko' ? '원하는 여행을 한 가지 이상 선택해주세요.' : 'Elige al menos un tipo de viaje.');
      return false;
    }
  }
  if (step === 4) {
    const contact = funnelContactValue?.value.trim() || '';
    const consent = document.getElementById('funnelConsent')?.checked;
    if (contact && !consent) {
      trackFunnelValidationError('contact_consent');
      showTravelFunnelError(currentLanguage === 'ko' ? '연락처를 남기려면 정보 수신에 동의해주세요.' : 'Para dejar tu contacto, acepta recibir información de DAMDA.');
      return false;
    }
    if (contact && funnelContactType?.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      trackFunnelValidationError('contact_format');
      showTravelFunnelError(currentLanguage === 'ko' ? '이메일 주소를 확인해주세요.' : 'Revisa tu dirección de email.');
      return false;
    }
  }
  clearTravelFunnelError();
  return true;
}

function updateTravelFunnelContactField() {
  if (!funnelContactValue || !funnelContactType) return;
  const isEmail = funnelContactType.value === 'email';
  funnelContactValue.inputMode = isEmail ? 'email' : 'tel';
  funnelContactValue.autocomplete = isEmail ? 'email' : 'tel';
  funnelContactValue.placeholder = isEmail ? 'nombre@email.com' : '+52 55 0000 0000';
}

function showTravelFunnelError(message) {
  if (!funnelError) return;
  funnelError.textContent = message;
  funnelError.hidden = false;
}

function clearTravelFunnelError() {
  if (!funnelError) return;
  funnelError.textContent = '';
  funnelError.hidden = true;
}

async function submitTravelFunnel(event) {
  event.preventDefault();
  if (!travelFunnelForm || !validateTravelFunnelStep(4)) return;

  const submitButton = funnelSubmitBtn;
  const formData = new FormData(travelFunnelForm);
  const interests = formData.getAll('interests').map(String);
  const contactValue = String(formData.get('contactValue') || '').trim();
  const contactConsent = formData.get('contactConsent') === 'on';
  const categoryMap = { tradition: 'culture', food: 'food', festival: 'festival' };
  travelFunnelCategory = categoryMap[interests[0]] || 'nature';

  const payload = {
    journeyStatus: String(formData.get('journeyStatus') || ''),
    country: String(formData.get('country') || '').trim(),
    interests,
    contactType: contactValue ? String(formData.get('contactType') || '') : '',
    contactValue: contactConsent ? contactValue : '',
    contactConsent: Boolean(contactValue && contactConsent),
    language: currentLanguage,
    website: String(formData.get('website') || ''),
    elapsedMs: Math.max(0, Date.now() - travelFunnelStartedAt)
  };

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('loading');
  }

  try {
    const response = await fetch(TRAVEL_DEMAND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('submit_failed');
    localStorage.setItem(TRAVEL_PROFILE_STORAGE_KEY, JSON.stringify({
      journeyStatus: payload.journeyStatus,
      country: payload.country,
      interests: payload.interests,
      language: payload.language,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('damda_travel_profile_completed', new Date().toISOString());
    localStorage.removeItem('damda_travel_profile_snoozed_until');
    localStorage.removeItem(TRAVEL_PROFILE_DRAFT_KEY);
    travelFunnelForm.hidden = true;
    if (travelFunnelSuccess) travelFunnelSuccess.hidden = false;
    renderPersonalizedPanel();
    renderTravelProfileInvite();
    trackEvent('funnel_complete', { interests: interests.length, hasContact: payload.contactConsent });
  } catch {
    trackEvent('funnel_submit_error', {
      step: travelFunnelStep,
      hasContact: payload.contactConsent
    });
    showTravelFunnelError(currentLanguage === 'ko' ? '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' : 'No pudimos guardar tu respuesta. Inténtalo de nuevo en un momento.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }
}

function finishTravelFunnel() {
  closeTravelFunnel();
  const targetButton = document.querySelector(`.cat-btn[data-category="${travelFunnelCategory}"]`);
  setCategory(travelFunnelCategory, targetButton);
  renderPersonalizedPanel();
  requestAnimationFrame(() => personalizedPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
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

/**
 * TourAPI has operating hours and place details, but no standardized
 * recommended-stay field shared by every content type. Estimates stay
 * centralized here so generated values are never presented as official facts.
 */
function getRecommendedStay(tour) {
  const language = currentLanguage === 'ko' ? 'ko' : 'es';
  if (tour?.recommendedDuration && tour.recommendedDurationSource === 'official') {
    return {
      value: tour.recommendedDuration,
      minutes: parseDurationMinutes(tour.recommendedDuration, 90),
      estimated: false,
      label: I18N[language].officialLabel,
      note: language === 'ko'
        ? '관광지 공식 안내에서 확인한 체류시간입니다.'
        : 'Duración indicada por la fuente turística oficial.'
    };
  }

  const typeText = [
    tour?.name,
    tour?.subCategory,
    tour?.categoryName,
    ...(tour?.tags || [])
  ].filter(Boolean).join(' ');

  let koValue = '1–2시간';
  let esValue = '1–2 h';
  let minutes = 90;

  if (tour?.category === 'festival') {
    koValue = '2–4시간';
    esValue = '2–4 h';
    minutes = 180;
  } else if (/한옥마을|테마파크|동물원|수목원|자연휴양림/.test(typeText)) {
    koValue = '2–4시간';
    esValue = '2–4 h';
    minutes = 180;
  } else if (/시장|거리|마을/.test(typeText)) {
    koValue = '1시간 30분–3시간';
    esValue = '1,5–3 h';
    minutes = 120;
  } else if (tour?.category === 'food' || /카페|커피|다방|빵|제과|베이커리|맛집|식당|음식/.test(typeText)) {
    koValue = '45–90분';
    esValue = '45–90 min';
    minutes = 70;
  } else if (/동산|도시공원|정원|호수|저수지|수변/.test(typeText) && !/국립공원/.test(typeText)) {
    koValue = '1시간 30분–2시간 30분';
    esValue = '1,5–2,5 h';
    minutes = 120;
  } else if (/국립공원|계곡|해수욕장|해변|섬|둘레길|탐방로|트레킹|등산|산행|정상|봉우리/.test(typeText)) {
    koValue = '반나절 · 3–5시간';
    esValue = 'Medio día · 3–5 h';
    minutes = 240;
  } else if (/박물관|미술관|과학관|전시관|기념관/.test(typeText)) {
    koValue = '1–2시간';
    esValue = '1–2 h';
  } else if (/공원|정원|호수|저수지|수변/.test(typeText)) {
    koValue = '1시간 30분–2시간 30분';
    esValue = '1,5–2,5 h';
    minutes = 120;
  } else if (/사찰|절|성당|교회|향교|서원|사당|유적|고분|기념탑/.test(typeText)) {
    koValue = '45–90분';
    esValue = '45–90 min';
    minutes = 70;
  } else if (tour?.category === 'nature') {
    koValue = '2–3시간';
    esValue = '2–3 h';
    minutes = 150;
  }

  return {
    value: language === 'ko' ? koValue : esValue,
    minutes,
    estimated: true,
    label: I18N[language].estimateLabel,
    note: I18N[language].estimateNote
  };
}

function parseDurationMinutes(value = '', fallback = 90) {
  const normalized = String(value).replace(',', '.');
  const hourMatches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:시간|h)/gi)].map(match => Number(match[1]) * 60);
  const minuteMatches = [...normalized.matchAll(/(\d+)\s*(?:분|min)/gi)].map(match => Number(match[1]));
  const values = [...hourMatches, ...minuteMatches].filter(Number.isFinite);
  return values.length ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length) : fallback;
}

function ensureTourIndex() {
  if (tourIndexCache) return;

  const tours = [];
  const byId = new Map();
  const counts = { all: 0 };
  Object.entries(JEONBUK_REGIONS).forEach(([regionId, region]) => {
    region.tours.forEach(tour => {
      const category = getResolvedCategory(tour);
      const indexedTour = {
        ...tour,
        category,
        eventStatus: tour.eventPeriod ? getCurrentEventStatus(tour.eventPeriod) : tour.eventStatus,
        subCategory: getDisplaySubcategory({ ...tour, category }),
        regionId,
        regionName: region.name
      };
      tours.push(indexedTour);
      byId.set(indexedTour.id, indexedTour);
      counts[indexedTour.category] = (counts[indexedTour.category] || 0) + 1;
    });
  });
  counts.all = tours.length;
  tourIndexCache = { tours, byId };
  categoryCountsCache = counts;
}

function getAllTours() {
  ensureTourIndex();
  return tourIndexCache.tours;
}

function getCategoryCounts() {
  ensureTourIndex();
  return categoryCountsCache;
}

function findTourById(tourId) {
  const apiTour = currentLiveApiData.find(tour => tour.id === tourId);
  ensureTourIndex();
  return apiTour || tourIndexCache.byId.get(tourId) || null;
}

function getSharedTourId() {
  return String(new URLSearchParams(window.location.search).get(SHARED_PLACE_QUERY_KEY) || '')
    .trim()
    .slice(0, 120);
}

function openSharedTourFromUrl() {
  if (new URLSearchParams(window.location.search).has(SHARED_PLAN_QUERY_KEY)) return;
  const sharedTourId = getSharedTourId();
  if (!sharedTourId || !findTourById(sharedTourId)) return;
  window.setTimeout(() => openModal(sharedTourId), 0);
}

function getSharedPlanData() {
  const params = new URLSearchParams(window.location.search);
  const ids = String(params.get(SHARED_PLAN_QUERY_KEY) || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .slice(0, 12);
  const duration = Math.max(1, Math.min(4, Number.parseInt(params.get('days'), 10) || 1));
  const origin = ['seoul', 'jeonju', 'current'].includes(params.get('origin')) ? params.get('origin') : 'jeonju';
  const mode = ['transit', 'driving', 'walking'].includes(params.get('mode')) ? params.get('mode') : 'transit';
  const date = /^20\d{2}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : '';
  const startTime = /^\d{2}:\d{2}$/.test(params.get('start') || '') ? params.get('start') : '09:30';
  return { ids, duration, origin, mode, date, startTime };
}

function openSharedPlanFromUrl() {
  const { ids, duration, origin, mode, date, startTime } = getSharedPlanData();
  const tours = [...new Set(ids)].map(findTourById).filter(Boolean);
  if (!tours.length) return;
  currentPlan = tours;
  const regionIds = [...new Set(tours.map(tour => tour.regionId).filter(Boolean))];
  currentPlanContext = {
    duration: Math.min(4, Math.max(duration, Math.ceil(tours.length / 4))),
    title: currentLanguage === 'ko' ? '공유받은 DAMDA 여행' : 'Ruta DAMDA compartida',
    regionIds,
    origin,
    mode,
    date,
    startTime
  };
  const durationSelect = document.getElementById('plannerDuration');
  if (durationSelect) durationSelect.value = String(currentPlanContext.duration);
  if (plannerOrigin) plannerOrigin.value = origin;
  if (plannerTransport) plannerTransport.value = mode;
  if (plannerDate) plannerDate.value = date;
  if (plannerStartTime) plannerStartTime.value = startTime;
  selectedPlannerRegions = new Set(regionIds.slice(0, 6));
  renderPlannerRegionOptions();
  renderTravelPlan(currentPlanContext.duration, currentPlanContext.title, regionIds);
  trackEvent('shared_plan_open', { days: currentPlanContext.duration, stops: tours.length });
  window.setTimeout(() => plannerResult?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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

function initRegionSelect() {
  if (!regionSelectMobile) return;
  regionSelectMobile.innerHTML = [
    `<option value="all">${currentLanguage === 'ko' ? '전북 전체' : 'Todo Jeonbuk'}</option>`,
    ...Object.values(JEONBUK_REGIONS).map(region =>
      `<option value="${escapeHTML(region.id)}">${escapeHTML(getRegionName(region.id, region.name))}</option>`)
  ].join('');
  regionSelectMobile.value = currentSelectedRegion || 'all';
  regionSelectMobile.setAttribute('aria-label', t('regionSelectAria'));
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
    const regionNames = [...selectedPlannerRegions].map(regionId => getRegionName(regionId)).filter(Boolean);
    plannerRegionSummary.textContent = regionNames.join(' → ');
  }
}

function updatePlannerRegionPickerUI() {
  if (!plannerRegionsToggle || !plannerRegionChips) return;
  plannerRegionsToggle.setAttribute('aria-expanded', String(plannerRegionsExpanded));
  plannerRegionsToggle.querySelector('span').textContent = t(plannerRegionsExpanded ? 'hideRegions' : 'changeRegions');
  plannerRegionsToggle.querySelector('i').className = `fa-solid fa-chevron-${plannerRegionsExpanded ? 'up' : 'down'}`;
  plannerRegionChips.classList.toggle('expanded', plannerRegionsExpanded);
}

function togglePlannerRegionPicker() {
  plannerRegionsExpanded = !plannerRegionsExpanded;
  updatePlannerRegionPickerUI();
  trackEvent('planner_regions_toggle', { expanded: plannerRegionsExpanded });
}

function applyRoutePreset(presetId, announce = true) {
  const regions = ROUTE_PRESETS[presetId];
  if (!regions) return;
  activeRoutePreset = presetId;
  selectedPlannerRegions = new Set(regions);
  if (routePresetSelect) routePresetSelect.value = presetId;
  plannerRegionsExpanded = false;
  document.querySelectorAll('.route-preset').forEach(button => {
    const active = button.dataset.preset === presetId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderPlannerRegionOptions();
  updatePlannerRegionPickerUI();
  if (announce) {
    trackEvent('planner_preset_select', { preset: presetId, regions: selectedPlannerRegions.size });
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
  if (routePresetSelect) routePresetSelect.value = '';
  document.querySelectorAll('.route-preset').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
  renderPlannerRegionOptions();
  trackEvent('planner_region_toggle', {
    region: regionId,
    selected: selectedPlannerRegions.has(regionId),
    regions: selectedPlannerRegions.size
  });
}

function selectRegion(regionId) {
  currentSelectedRegion = JEONBUK_REGIONS[regionId] ? regionId : null;
  currentSearchQuery = '';
  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  if (regionSelectMobile) regionSelectMobile.value = currentSelectedRegion || 'all';
  updateUI();
  trackEvent('region_select', { region: currentSelectedRegion || 'all' });
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
  if (regionSelectMobile) regionSelectMobile.value = 'all';
  document.querySelectorAll('.cat-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.category === 'all');
  });
  updateUI();
  trackEvent('filter_reset');
}

function handleMobileRegionSelect(regionId) {
  if (regionId === 'all') {
    resetSelection();
    return;
  }
  selectRegion(regionId);
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
  trackEvent('category_select', { category: categoryKey });
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
  trackEvent('sort_change', { sort: currentSortOrder });
}

function toggleSavedOnly() {
  showSavedOnly = !showSavedOnly;
  updateUI();
  trackEvent('saved_filter_toggle', { enabled: showSavedOnly });
}

async function updateUI() {
  const requestId = ++uiRequestSequence;
  const allTours = getAllTours();
  const categoryCounts = getCategoryCounts();
  document.querySelectorAll('[data-count-category]').forEach(element => {
    const category = element.dataset.countCategory;
    element.textContent = (categoryCounts[category] || 0).toLocaleString(getLocale());
    if (category === 'all') element.hidden = true;
  });

  document.querySelectorAll('.chip-btn').forEach(chip => {
    const chipId = chip.dataset.id;
    const isActive = (chipId === 'all' && !currentSelectedRegion) || chipId === currentSelectedRegion;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });

  if (currentSelectedRegion && JEONBUK_REGIONS[currentSelectedRegion]) {
    const region = JEONBUK_REGIONS[currentSelectedRegion];
    bannerBadge.hidden = false;
    bannerBadge.textContent = currentLanguage === 'ko' ? (region.badge || '추천 관광지') : 'Región seleccionada';
    bannerTitle.textContent = currentLanguage === 'ko'
      ? `${region.name} 관광 안내`
      : `Qué ver en ${getRegionName(region.id, region.name)}`;
    bannerDesc.textContent = currentLanguage === 'ko'
      ? `${region.name}의 대표 명소와 여행 정보를 확인하세요.`
      : `Lugares y experiencias de ${getRegionName(region.id, region.name)}.`;
  } else {
    bannerBadge.hidden = !currentSearchQuery;
    bannerBadge.textContent = currentSearchQuery
      ? (currentLanguage === 'ko' ? '통합 검색' : 'Búsqueda')
      : (currentLanguage === 'ko' ? '전북 전체' : 'Todo Jeonbuk');
    bannerTitle.textContent = currentSearchQuery
      ? (currentLanguage === 'ko' ? `'${searchInput.value.trim()}' 검색 결과` : `Resultados para “${searchInput.value.trim()}”`)
      : (currentLanguage === 'ko' ? '전북 둘러보기' : 'Explora Jeonbuk');
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
  if (requestId !== uiRequestSequence) return;

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
  bannerCount.hidden = !hasActiveDiscoveryFilter;
  const heroTourCount = document.getElementById('heroTourCount');
  if (heroTourCount) heroTourCount.textContent = allTours.length.toLocaleString(getLocale());
  const heroRouteCount = document.getElementById('heroRouteCount');
  if (heroRouteCount) heroRouteCount.textContent = String(RECOMMENDED_COURSES.length);

  updateToolbarState(filteredTours.length);
  renderTourCards(filteredTours);

  const discoverySignature = `${resultSignature}|${filteredTours.length}`;
  if (hasActiveDiscoveryFilter && discoverySignature !== lastTrackedDiscoverySignature) {
    lastTrackedDiscoverySignature = discoverySignature;
    trackEvent('discovery_filter', {
      region: currentSelectedRegion || 'all',
      category: currentSelectedCategory,
      search: Boolean(currentSearchQuery),
      queryLength: currentSearchQuery.length,
      savedOnly: showSavedOnly,
      resultCount: filteredTours.length
    });
  }
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
  const hasActiveFilters = activeFilters.length > 0;
  if (filterResetBtn) filterResetBtn.hidden = !hasActiveFilters;
  if (regionResetBtn) regionResetBtn.hidden = !currentSelectedRegion;
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
      : '';
    const imageMarkup = tour.image
      ? `<img src="${escapeHTML(tour.image)}" alt="${escapeHTML(tourName)}" loading="lazy" decoding="async" onerror="handleImageError(this)">`
      : '';
    const eventMeta = tour.eventPeriod
      ? `<div class="card-event-meta">
          <span class="event-status ${tour.eventStatus === '진행 중' ? 'active' : ''}">${escapeHTML(getEventStatusLabel(tour.eventStatus))}</span>
          <span><i class="fa-regular fa-calendar"></i> ${escapeHTML(tour.eventPeriod)}</span>
        </div>`
      : '';
    const recommendedStay = getRecommendedStay(tour);
    const trustMeta = getTourTrustMeta(tour);
    const practicalItems = [
      `<span class="card-stay-meta" title="${escapeHTML(recommendedStay.note)}"><i class="fa-regular fa-clock"></i> ≈ ${escapeHTML(recommendedStay.value)}</span>`,
      tour.fee && String(tour.fee).length <= 32
        ? `<span><i class="fa-solid fa-ticket"></i> ${escapeHTML(tour.fee)}</span>`
        : ''
    ].filter(Boolean).join('');
    const practicalMeta = practicalItems ? `<div class="card-practical-meta">${practicalItems}</div>` : '';
    const cardDescription = getCardDescription(tour);

    return `
      <article class="tour-card">
        <button type="button" class="tour-card-main" onclick="openModal('${escapeHTML(tour.id)}')" aria-label="${escapeHTML(tourName)} · ${currentLanguage === 'ko' ? '상세 정보 보기' : 'ver detalles'}">
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
            <p class="card-address"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(getLocalizedAddress(tour))}</p>
            ${eventMeta}
            ${cardDescription ? `<p class="card-desc">${escapeHTML(cardDescription)}</p>` : ''}
            ${practicalMeta}
            ${trustMeta.damdaPick ? `<p class="card-trust-meta"><i class="fa-solid fa-circle-check"></i> ${escapeHTML(trustMeta.label)}</p>` : ''}
            ${tags ? `<div class="card-tags">${tags}</div>` : ''}
          </div>
        </button>
      </article>
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
  trackEvent('load_more', { visibleLimit: visibleResultLimit });
  updateUI();
}

function handleImageError(image) {
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.removeAttribute('src');
  image.alt = '';
  image.parentElement?.classList.add('image-unavailable');
}

async function getTourWithLazyDetails(tour) {
  if (!tour || tour.overview || !tour.id.startsWith('official-')) return tour;
  const regionId = tour.regionId;
  if (!catalogDetailPromises.has(regionId)) {
    const request = fetch(`data/catalog-details/${encodeURIComponent(regionId)}.json?v=1`, { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Catalog details HTTP ${response.status}`);
        return response.json();
      })
      .catch(error => {
        console.warn('DAMDA catalog details fallback:', error.message);
        return {};
      });
    catalogDetailPromises.set(regionId, request);
  }
  const regionDetails = await catalogDetailPromises.get(regionId);
  return { ...tour, ...(regionDetails[tour.id] || {}) };
}

function renderRecommendedCourses() {
  if (!courseGrid) return;
  courseGrid.innerHTML = RECOMMENDED_COURSES.map((course, index) => {
    const translated = currentLanguage === 'es' ? COURSE_ES[index] : null;
    const tags = course.tags.map(tag => `<span class="course-tag">#${escapeHTML(currentLanguage === 'ko' ? tag : (REGION_NAMES_ES[Object.keys(JEONBUK_REGIONS).find(id => JEONBUK_REGIONS[id].name.includes(tag))] || tag))}</span>`).join('');
    return `
      <button type="button" class="course-card course-card-${index + 1}" onclick="applyRecommendedCourse(${index})">
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

async function openModal(tourId, shouldTrack = true) {
  const requestId = ++modalRequestSequence;
  const indexedTour = findTourById(tourId);
  if (!indexedTour) return;
  const foundTour = await getTourWithLazyDetails(indexedTour);
  if (requestId !== modalRequestSequence) return;

  activeTourId = foundTour.id;
  lastFocusedElement = document.activeElement;
  const modalImageBox = modalImg.parentElement;
  modalImageBox?.classList.remove('image-unavailable');
  delete modalImg.dataset.fallbackApplied;
  if (foundTour.image) {
    if (modalImg.getAttribute('src') !== foundTour.image) {
      modalImg.src = foundTour.image;
    }
  } else {
    modalImg.removeAttribute('src');
    modalImageBox?.classList.add('image-unavailable');
  }
  modalImg.alt = getTourName(foundTour);
  modalCategory.textContent = `${getRegionName(foundTour.regionId, foundTour.regionName)} · ${getCategoryName(foundTour.category)}`;
  modalTitle.textContent = getTourName(foundTour);
  const localizedAddress = getLocalizedAddress(foundTour);
  modalAddress.innerHTML = `
    <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
    <span>
      <strong>${escapeHTML(localizedAddress)}</strong>
      ${currentLanguage === 'es' && foundTour.address
        ? `<small lang="ko">${escapeHTML(foundTour.address)}</small>`
        : ''}
    </span>
  `;
  const overviewText = decodeTextEntities(currentLanguage === 'ko'
    ? (foundTour.overview || foundTour.desc)
    : getTourDescription(foundTour));
  modalDesc.textContent = overviewText;
  modalDesc.classList.remove('expanded');
  modalDescToggle.hidden = true;
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
  const recommendedStay = getRecommendedStay(foundTour);
  const trustMeta = getTourTrustMeta(foundTour);
  modalDuration.textContent = recommendedStay.value;
  modalDurationSource.textContent = recommendedStay.label;
  modalDurationSource.classList.toggle('official', !recommendedStay.estimated);
  modalDurationNote.textContent = recommendedStay.note;
  modalRecommendedFor.textContent = currentLanguage === 'ko'
    ? (foundTour.recommendedFor || foundTour.categoryName || '전북 여행')
    : getCategoryName(foundTour.category);
  if (modalStatusLabel) {
    const modalStatusBadge = modalStatusLabel.closest('.modal-rating');
    const hasMeaningfulStatus = Boolean(foundTour.eventStatus);
    if (modalStatusBadge) modalStatusBadge.hidden = !hasMeaningfulStatus;
    modalStatusLabel.textContent = hasMeaningfulStatus
      ? (currentLanguage === 'ko' ? foundTour.eventStatus : getEventStatusLabel(foundTour.eventStatus))
      : '';
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
      value: `${trustMeta.label} · ${trustMeta.reviewedAt}`,
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
    button.onclick = () => trackEvent('maps_open', { tourId: foundTour.id, mode, source: 'place_detail' });
  });
  modalRouteSection.hidden = false;

  const navBtn = document.getElementById('modalNavBtn');
  navBtn.href = buildGoogleMapsDirectionsUrl(foundTour, 'transit');
  navBtn.onclick = () => trackEvent('maps_open', { tourId: foundTour.id, mode: 'transit', source: 'primary_cta' });

  const bookmarkBtn = document.getElementById('modalBookmarkBtn');
  bookmarkBtn.onclick = () => toggleBookmark(foundTour.id);
  updateModalBookmarkButton(foundTour.id);

  const shareBtn = document.getElementById('modalShareBtn');
  shareBtn.onclick = () => shareTour(foundTour);

  const planBtn = document.getElementById('modalPlanBtn');
  planBtn.onclick = () => toggleTourInPlan(foundTour.id);
  updateModalPlanButton(foundTour.id);

  const reportBtn = document.getElementById('modalReportBtn');
  reportBtn.onclick = () => openReportModal(foundTour.id);

  const officialUrl = foundTour.sourceUrl || (foundTour.isLiveApi
    ? 'https://korean.visitkorea.or.kr/main/cr_main.do'
    : 'https://tour.jb.go.kr/index.do');
  const sourceName = foundTour.imageSource || (foundTour.isLiveApi ? '한국관광공사 TourAPI' : '공식 관광정보');
  const photoSource = document.getElementById('modalPhotoSource');
  photoSource.href = officialUrl;
  photoSource.textContent = currentLanguage === 'ko' ? `사진 · ${sourceName}` : 'Fuente de la foto';
  photoSource.hidden = !foundTour.image;

  tourModal.querySelector('.modal-content')?.scrollTo({ top: 0, behavior: 'auto' });
  tourModal.classList.add('active');
  tourModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  if (shouldTrack) trackEvent('place_open', { tourId: foundTour.id, category: foundTour.category, region: foundTour.regionId });
  requestAnimationFrame(() => {
    modalDescToggle.hidden = modalDesc.scrollHeight <= modalDesc.clientHeight + 1;
    tourModal.querySelector('.modal-close-btn')?.focus();
  });
}

function closeModal(event) {
  if (event && event.target !== tourModal) return;
  modalRequestSequence += 1;
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
  trackEvent(isSaved ? 'place_unsave' : 'place_save', { tourId, category: tour.category, region: tour.regionId });
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
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = '';
  shareUrl.search = '';
  shareUrl.searchParams.set(SHARED_PLACE_QUERY_KEY, tour.id);
  const shareData = {
    title: `${getTourName(tour)} | ${currentLanguage === 'ko' ? '전북 관광 가이드' : 'Guía turística de Jeonbuk'}`,
    text: `${getTourName(tour)} · ${getLocalizedAddress(tour)}`,
    url: shareUrl.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      showToast(currentLanguage === 'ko' ? '장소 링크를 복사했습니다.' : 'Enlace del lugar copiado.');
    } else {
      showToast(currentLanguage === 'ko' ? '이 브라우저에서는 공유 기능을 지원하지 않습니다.' : 'Este navegador no permite compartir.');
    }
    trackEvent('place_share', { tourId: tour.id });
  } catch (error) {
    if (error.name !== 'AbortError') {
      showToast(currentLanguage === 'ko' ? '공유하지 못했습니다. 다시 시도해주세요.' : 'No se pudo compartir. Inténtalo de nuevo.');
    }
  }
}

function initPlaceReport() {
  reportForm?.addEventListener('submit', submitPlaceReport);
}

function openReportModal(tourId) {
  const tour = findTourById(tourId);
  if (!tour || !reportModal || !reportForm) return;
  activeTourId = tour.id;
  reportForm.reset();
  if (reportPlaceName) reportPlaceName.textContent = getTourName(tour);
  if (reportError) {
    reportError.hidden = true;
    reportError.textContent = '';
  }
  reportModal.classList.add('active');
  reportModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  trackEvent('place_report_open', { tourId: tour.id });
  requestAnimationFrame(() => reportIssueType?.focus());
}

function closeReportModal(event) {
  if (event && event.target !== reportModal) return;
  reportModal?.classList.remove('active');
  reportModal?.setAttribute('aria-hidden', 'true');
  if (!tourModal?.classList.contains('active')) document.body.classList.remove('modal-open');
}

async function submitPlaceReport(event) {
  event.preventDefault();
  const tour = findTourById(activeTourId);
  if (!tour || !reportIssueType || !reportSubmitBtn) return;
  reportSubmitBtn.disabled = true;
  reportSubmitBtn.classList.add('loading');
  if (reportError) reportError.hidden = true;
  try {
    const response = await fetch(PLACE_REPORT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: tour.id,
        issueType: reportIssueType.value,
        note: reportNote?.value.trim() || '',
        language: currentLanguage,
        elapsedMs: Math.max(1000, Date.now() - travelFunnelStartedAt)
      })
    });
    if (!response.ok) throw new Error('report_failed');
    closeReportModal();
    showToast(currentLanguage === 'ko' ? '신고가 접수되었습니다. 확인 후 정보를 고치겠습니다.' : 'Recibimos tu reporte. Revisaremos la información.');
    trackEvent('place_report_submit', { tourId: tour.id, issueType: reportIssueType.value });
  } catch {
    if (reportError) {
      reportError.textContent = currentLanguage === 'ko' ? '신고를 보내지 못했습니다. 잠시 후 다시 시도해주세요.' : 'No pudimos enviar el reporte. Inténtalo de nuevo.';
      reportError.hidden = false;
    }
  } finally {
    reportSubmitBtn.disabled = false;
    reportSubmitBtn.classList.remove('loading');
  }
}

function updateSavedUI() {
  const count = getSavedIds().length;
  if (savedCount) {
    savedCount.textContent = String(count);
    savedCount.hidden = count === 0;
  }
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
  trackEvent('saved_panel_open', {
    savedPlaces: getSavedIds().length,
    hasSavedPlan: Boolean(getSavedPlan())
  });
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
  renderSavedPlanSummary();
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

function getSavedPlan() {
  try {
    const savedPlan = JSON.parse(localStorage.getItem('jeonbuk_travel_plan') || 'null');
    return savedPlan && Array.isArray(savedPlan.tourIds) ? savedPlan : null;
  } catch {
    localStorage.removeItem('jeonbuk_travel_plan');
    return null;
  }
}

function renderSavedPlanSummary() {
  if (!savedPlanSummary) return;
  const savedPlan = getSavedPlan();
  if (!savedPlan) {
    savedPlanSummary.hidden = true;
    savedPlanSummary.innerHTML = '';
    return;
  }

  const tours = savedPlan.tourIds.map(findTourById).filter(Boolean);
  if (!tours.length) {
    localStorage.removeItem('jeonbuk_travel_plan');
    savedPlanSummary.hidden = true;
    return;
  }

  const regionNames = [...new Set(tours.map(tour => getRegionName(tour.regionId, tour.regionName)))].slice(0, 3);
  savedPlanSummary.hidden = false;
  savedPlanSummary.innerHTML = `
    <div class="saved-plan-heading">
      <span class="saved-plan-icon"><i class="fa-solid fa-route"></i></span>
      <div>
        <small>${currentLanguage === 'ko' ? '저장한 여행 일정' : 'Ruta guardada'}</small>
        <h3>${escapeHTML(savedPlan.title || (currentLanguage === 'ko' ? '전북 여행 일정' : 'Ruta por Jeonbuk'))}</h3>
      </div>
    </div>
    <p>${currentLanguage === 'ko'
      ? `${tours.length}개 장소 · ${regionNames.join(' · ')}`
      : `${tours.length} paradas · ${regionNames.join(' · ')}`}</p>
    <div class="saved-plan-actions">
      <button type="button" class="saved-plan-open" onclick="openSavedPlan()"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${currentLanguage === 'ko' ? '일정 보기' : 'Ver ruta'}</button>
      <button type="button" class="saved-plan-delete" onclick="deleteSavedPlan()">${currentLanguage === 'ko' ? '삭제' : 'Eliminar'}</button>
    </div>
  `;
}

function openSavedPlan() {
  closeSavedPanel();
  restoreSavedPlan();
  requestAnimationFrame(() => plannerResult?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function deleteSavedPlan() {
  localStorage.removeItem('jeonbuk_travel_plan');
  if (savedPlanSummary) {
    savedPlanSummary.hidden = true;
    savedPlanSummary.innerHTML = '';
  }
  showToast(currentLanguage === 'ko' ? '저장한 여행 일정을 삭제했습니다.' : 'La ruta guardada se eliminó.');
}

function openSavedTour(tourId) {
  closeSavedPanel();
  openModal(tourId);
}

const PLANNER_ORIGINS = {
  seoul: { id: 'origin-seoul', name: 'Seoul Station', lat: 37.5547, lng: 126.9707 },
  jeonju: { id: 'origin-jeonju', name: 'Jeonju Station', lat: 35.8499, lng: 127.1618 }
};

function getPlanOrigin(key = currentPlanContext.origin) {
  return PLANNER_ORIGINS[key] || null;
}

function optimizePlanOrder(tours, origin = null) {
  const remaining = [...tours];
  const ordered = [];
  let cursor = origin;
  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Infinity;
    remaining.forEach((tour, index) => {
      const distance = cursor ? getDirectDistanceKm(cursor, tour) : null;
      const regionPenalty = ordered.length && ordered.at(-1).regionId !== tour.regionId ? 8 : 0;
      const score = (distance ?? index * 0.01) + regionPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

function estimateRouteSegment(originTour, destinationTour, mode = 'transit') {
  const directKm = getDirectDistanceKm(originTour, destinationTour);
  if (directKm === null) return null;
  const distanceKm = directKm * (mode === 'walking' ? 1.18 : 1.28);
  let minutes;
  let costKrw = 0;
  if (mode === 'walking') {
    minutes = distanceKm / 4.5 * 60;
  } else if (mode === 'driving') {
    minutes = distanceKm / (distanceKm > 80 ? 75 : 48) * 60 + 10;
    costKrw = distanceKm * 185 + 3000;
  } else {
    minutes = distanceKm / (distanceKm > 80 ? 72 : 27) * 60 + (distanceKm > 80 ? 28 : 16);
    costKrw = distanceKm > 80 ? 18000 + distanceKm * 35 : 1450 + distanceKm * 115;
  }
  return {
    distanceKm,
    minutes: Math.max(5, Math.round(minutes / 5) * 5),
    costKrw: mode === 'walking' ? 0 : Math.max(0, Math.round(costKrw / 500) * 500),
    provider: 'damda_estimate'
  };
}

function formatPlanDuration(minutes) {
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 60) return currentLanguage === 'ko' ? `약 ${minutes}분` : `aprox. ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return currentLanguage === 'ko'
    ? `약 ${hours}시간${rest ? ` ${rest}분` : ''}`
    : `aprox. ${hours} h${rest ? ` ${rest} min` : ''}`;
}

function formatPlanCost(costKrw) {
  if (!Number.isFinite(costKrw)) return '';
  if (costKrw === 0) return currentLanguage === 'ko' ? '이동비 없음' : 'sin costo de transporte';
  return `≈ ₩${Math.round(costKrw).toLocaleString('ko-KR')}`;
}

function addMinutesToTime(time = '09:30', minutes = 0) {
  const [hours, mins] = String(time).split(':').map(Number);
  const total = Math.max(0, (Number.isFinite(hours) ? hours : 9) * 60 + (Number.isFinite(mins) ? mins : 30) + minutes);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function getPlanDateLabel(dayIndex = 0) {
  if (!currentPlanContext.date) return '';
  const date = new Date(`${currentPlanContext.date}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + dayIndex);
  return new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
}

function getRouteModeLabel(mode) {
  const labels = currentLanguage === 'ko'
    ? { transit: '대중교통', driving: '자동차', walking: '도보' }
    : { transit: 'Transporte público', driving: 'Auto', walking: 'A pie' };
  return labels[mode] || labels.transit;
}

function generateTravelPlan(options = {}) {
  const duration = Number(options.duration || document.getElementById('plannerDuration').value);
  const theme = options.theme || document.getElementById('plannerTheme').value;
  const pace = Number(options.pace || document.getElementById('plannerPace')?.value || 3);
  const origin = options.origin || plannerOrigin?.value || 'jeonju';
  const date = options.date || plannerDate?.value || '';
  const startTime = options.startTime || plannerStartTime?.value || '09:30';
  const mode = options.mode || plannerTransport?.value || 'transit';
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
  currentPlan = optimizePlanOrder(
    uniqueCandidates.slice(0, Math.min(targetCount, uniqueCandidates.length)),
    getPlanOrigin(origin)
  );
  currentPlanContext = {
    duration: Math.max(1, duration),
    title: options.title || null,
    regionIds: selectedRegionIds,
    origin,
    date,
    startTime,
    mode
  };
  renderTravelPlan(duration, options.title || null, selectedRegionIds);
  trackEvent('planner_generate', { duration, theme, pace, stops: currentPlan.length, regions: selectedRegionIds.length });
  requestAnimationFrame(() => plannerResult?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function renderPlanTransfer(originTour, destinationTour, segmentKey = '') {
  const mode = currentPlanContext.mode || 'transit';
  const estimate = estimateRouteSegment(originTour, destinationTour, mode);
  const originCoords = getTourCoordinates(originTour);
  const destinationCoords = getTourCoordinates(destinationTour);
  const labels = currentLanguage === 'ko'
    ? { title: '다음 장소로 이동', estimate: 'DAMDA 예상', walk: '도보', transit: '대중교통', drive: '자동차' }
    : { title: 'Siguiente trayecto', estimate: 'Estimación DAMDA', walk: 'A pie', transit: 'Transporte', drive: 'Auto' };
  return `
    <div class="plan-transfer" ${originCoords && destinationCoords ? `data-route-estimate="${escapeHTML(segmentKey)}" data-origin-lat="${originCoords.lat}" data-origin-lng="${originCoords.lng}" data-destination-lat="${destinationCoords.lat}" data-destination-lng="${destinationCoords.lng}" data-mode="${escapeHTML(mode)}"` : ''}>
      <div class="plan-transfer-copy">
        <span class="plan-transfer-icon"><i class="fa-solid fa-route"></i></span>
        <div>
          <strong>${labels.title}</strong>
          ${estimate ? `<small class="plan-transfer-metrics"><b>${labels.estimate}</b> · ${escapeHTML(formatPlanDuration(estimate.minutes))} · ${escapeHTML(formatPlanCost(estimate.costKrw))}</small>` : ''}
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

  const mode = currentPlanContext.mode || 'transit';
  const planOrigin = getPlanOrigin(currentPlanContext.origin);
  let estimatedTransportCost = 0;
  const daysHTML = dayGroups.map((stops, dayIndex) => {
    let currentTime = currentPlanContext.startTime || '09:30';
    const dayDate = getPlanDateLabel(dayIndex);
    const dayStopsHTML = stops.map((tour, stopIndex) => {
      const globalStopIndex = dayIndex * stopsPerDay + stopIndex;
      const incomingOrigin = stopIndex > 0 ? stops[stopIndex - 1] : (dayIndex === 0 ? planOrigin : null);
      const incomingEstimate = incomingOrigin ? estimateRouteSegment(incomingOrigin, tour, mode) : null;
      if (incomingEstimate) {
        currentTime = addMinutesToTime(currentTime, incomingEstimate.minutes);
        estimatedTransportCost += incomingEstimate.costKrw;
      }
      const arrivalTime = currentTime;
      const stay = getRecommendedStay(tour);
      const departureTime = addMinutesToTime(arrivalTime, stay.minutes || 90);
      currentTime = departureTime;
      const transferKey = `d${dayIndex + 1}-s${stopIndex + 1}`;
      return `
        <div class="plan-stop-group">
          ${incomingOrigin ? renderPlanTransfer(incomingOrigin, tour, transferKey) : `<div class="plan-day-start"><i class="fa-solid fa-bed"></i> ${currentLanguage === 'ko' ? '숙소 인근에서 출발하는 일정입니다.' : 'El día comienza cerca de tu alojamiento.'}</div>`}
          <div class="plan-stop-row">
            <button type="button" class="plan-stop" onclick="openModal('${escapeHTML(tour.id)}')">
              <span class="plan-stop-number">${stopIndex + 1}</span>
              <img src="${escapeHTML(tour.image)}" alt="" loading="lazy" decoding="async" onerror="handleImageError(this)">
              <span class="plan-stop-copy">
                <strong>${escapeHTML(getTourName(tour))}</strong>
                <small>${escapeHTML(getRegionName(tour.regionId, tour.regionName))} · ${escapeHTML(getCategoryName(tour.category))}</small>
                <span class="plan-stop-time"><i class="fa-regular fa-clock"></i> ${arrivalTime}–${departureTime} · ${currentLanguage === 'ko' ? '추천 체류' : 'estancia sugerida'} ${escapeHTML(stay.value)}</span>
                ${tour.hours ? `<span class="plan-stop-hours"><i class="fa-regular fa-calendar-check"></i> ${currentLanguage === 'ko' ? '공식 운영시간 있음 · 상세에서 확인' : 'Horario oficial disponible · ver detalle'}</span>` : `<span class="plan-stop-hours needs-check"><i class="fa-solid fa-triangle-exclamation"></i> ${currentLanguage === 'ko' ? '운영시간 확인 필요' : 'Horario por confirmar'}</span>`}
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <div class="plan-stop-controls" aria-label="${currentLanguage === 'ko' ? '일정 편집' : 'Editar parada'}">
              <button type="button" onclick="movePlanStop(${globalStopIndex}, -1)" ${globalStopIndex === 0 ? 'disabled' : ''} aria-label="${currentLanguage === 'ko' ? '앞으로 이동' : 'Mover antes'}"><i class="fa-solid fa-arrow-up"></i></button>
              <button type="button" onclick="movePlanStop(${globalStopIndex}, 1)" ${globalStopIndex === currentPlan.length - 1 ? 'disabled' : ''} aria-label="${currentLanguage === 'ko' ? '뒤로 이동' : 'Mover después'}"><i class="fa-solid fa-arrow-down"></i></button>
              <button type="button" class="plan-stop-remove" onclick="removePlanStop(${globalStopIndex})" aria-label="${currentLanguage === 'ko' ? '일정에서 삭제' : 'Quitar de la ruta'}"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
        </div>`;
    }).join('');
    return `
      <section class="plan-day">
        <div class="plan-day-label">
          <span>${currentLanguage === 'ko' ? `${dayIndex + 1}일차` : `Día ${dayIndex + 1}`} ${dayDate ? `<small>${escapeHTML(dayDate)}</small>` : ''}</span>
          <a href="${escapeHTML(buildGoogleMapsDayRouteUrl(stops, mode))}" target="_blank" rel="noopener noreferrer" onclick="trackEvent('day_route_open', { day: ${dayIndex + 1}, stops: ${stops.length} })"><i class="fa-brands fa-google"></i> ${currentLanguage === 'ko' ? '하루 동선 열기' : 'Abrir ruta del día'}</a>
        </div>
        <div class="plan-stops">${dayStopsHTML}</div>
      </section>`;
  }).join('');

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
        <button type="button" class="share-plan-btn" onclick="shareCurrentPlan()"><i class="fa-solid fa-share-nodes"></i> ${currentLanguage === 'ko' ? '일정 공유' : 'Compartir'}</button>
        <button type="button" class="save-plan-btn" onclick="saveCurrentPlan()"><i class="fa-regular fa-floppy-disk"></i> ${currentLanguage === 'ko' ? '일정 저장' : 'Guardar ruta'}</button>
      </div>
    </div>
    <div class="plan-practical-summary">
      <span><i class="fa-solid fa-location-arrow"></i><b>${currentLanguage === 'ko' ? '출발' : 'Salida'}</b>${escapeHTML(getPlanOrigin(currentPlanContext.origin)?.name || (currentLanguage === 'ko' ? '숙소 / 현재 위치' : 'Alojamiento / ubicación'))}</span>
      <span><i class="fa-regular fa-clock"></i><b>${currentLanguage === 'ko' ? '시작' : 'Inicio'}</b>${escapeHTML(currentPlanContext.startTime || '09:30')}</span>
      <span><i class="fa-solid fa-bus-simple"></i><b>${currentLanguage === 'ko' ? '이동' : 'Movilidad'}</b>${escapeHTML(getRouteModeLabel(mode))}</span>
      <span><i class="fa-solid fa-won-sign"></i><b>${currentLanguage === 'ko' ? '예상 교통비' : 'Costo estimado'}</b>${escapeHTML(formatPlanCost(estimatedTransportCost))}</span>
    </div>
    ${daysHTML}
    <p class="plan-disclaimer"><i class="fa-solid fa-circle-info"></i> ${currentLanguage === 'ko'
      ? 'DAMDA 예상 시간·교통비는 일정 비교를 위한 참고치입니다. 실제 경로·운임·운영시간은 Google Maps와 공식 페이지에서 확인해주세요.'
      : 'Los tiempos y costos DAMDA son orientativos. Confirma ruta, tarifa y horario actual en Google Maps y la fuente oficial.'}</p>
  `;
  hydratePlanRouteEstimates();
  if (activeTourId) updateModalPlanButton(activeTourId);
}

async function hydratePlanRouteEstimates() {
  const segments = [...plannerResult.querySelectorAll('[data-route-estimate]')];
  if (!segments.length) return;
  const departureTime = currentPlanContext.date && currentPlanContext.startTime
    ? new Date(`${currentPlanContext.date}T${currentPlanContext.startTime}:00+09:00`).toISOString()
    : '';
  await Promise.allSettled(segments.map(async element => {
    const response = await fetch(ROUTE_ESTIMATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: Number(element.dataset.originLat), lng: Number(element.dataset.originLng) },
        destination: { lat: Number(element.dataset.destinationLat), lng: Number(element.dataset.destinationLng) },
        mode: element.dataset.mode || 'transit',
        departureTime
      })
    });
    if (!response.ok) return;
    const data = await response.json();
    if (!data?.ok || data.provider !== 'google') return;
    const metrics = element.querySelector('.plan-transfer-metrics');
    if (!metrics) return;
    const cost = data.fare?.text || (Number.isFinite(data.costKrw) ? formatPlanCost(data.costKrw) : '');
    metrics.innerHTML = `<b>Google Maps</b> · ${escapeHTML(data.durationText || formatPlanDuration(data.durationMinutes))}${cost ? ` · ${escapeHTML(cost)}` : ''}`;
    element.classList.add('google-route-data');
  }));
}

function updateModalPlanButton(tourId) {
  const button = document.getElementById('modalPlanBtn');
  if (!button) return;
  const inPlan = currentPlan.some(tour => tour.id === tourId);
  button.classList.toggle('in-plan', inPlan);
  button.innerHTML = inPlan
    ? `<i class="fa-solid fa-circle-minus"></i> ${t('modalRemovePlan')}`
    : `<i class="fa-solid fa-circle-plus"></i> ${t('modalAddPlan')}`;
}

function rerenderCurrentPlan() {
  if (!currentPlan.length) {
    clearCurrentPlan(false);
    return;
  }
  currentPlanContext.duration = Math.max(
    1,
    Math.min(4, currentPlan.length, Math.max(currentPlanContext.duration || 1, Math.ceil(currentPlan.length / 4)))
  );
  currentPlanContext.regionIds = [...new Set(currentPlan.map(tour => tour.regionId).filter(Boolean))];
  renderTravelPlan(currentPlanContext.duration, currentPlanContext.title, currentPlanContext.regionIds);
}

function movePlanStop(index, direction) {
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || index >= currentPlan.length || nextIndex >= currentPlan.length) return;
  [currentPlan[index], currentPlan[nextIndex]] = [currentPlan[nextIndex], currentPlan[index]];
  rerenderCurrentPlan();
  trackEvent('plan_reorder', { direction: direction < 0 ? 'up' : 'down', stops: currentPlan.length });
}

function removePlanStop(index) {
  const removed = currentPlan[index];
  if (!removed) return;
  currentPlan.splice(index, 1);
  rerenderCurrentPlan();
  trackEvent('plan_stop_remove', { tourId: removed.id, stops: currentPlan.length });
  showToast(currentLanguage === 'ko' ? '일정에서 장소를 뺐습니다.' : 'Quitamos el lugar de tu ruta.');
}

function toggleTourInPlan(tourId) {
  const tour = findTourById(tourId);
  if (!tour) return;
  const existingIndex = currentPlan.findIndex(item => item.id === tourId);
  if (existingIndex >= 0) {
    currentPlan.splice(existingIndex, 1);
    trackEvent('plan_stop_remove', { tourId, source: 'place_detail', stops: currentPlan.length });
  } else {
    if (currentPlan.length >= 12) {
      showToast(currentLanguage === 'ko' ? '한 일정에는 최대 12곳까지 담을 수 있습니다.' : 'Puedes añadir hasta 12 lugares por ruta.');
      return;
    }
    currentPlan.push(tour);
    if (!currentPlanContext.duration) currentPlanContext.duration = 1;
    trackEvent('plan_stop_add', { tourId, source: 'place_detail', stops: currentPlan.length });
  }
  rerenderCurrentPlan();
  updateModalPlanButton(tourId);
  showToast(currentLanguage === 'ko'
    ? (existingIndex >= 0 ? '일정에서 장소를 뺐습니다.' : '현재 일정에 장소를 추가했습니다.')
    : (existingIndex >= 0 ? 'Quitamos el lugar de tu ruta.' : 'Añadimos el lugar a tu ruta.'));
}

async function shareCurrentPlan() {
  if (!currentPlan.length) return;
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = '';
  shareUrl.search = '';
  shareUrl.searchParams.set(SHARED_PLAN_QUERY_KEY, currentPlan.map(tour => tour.id).join(','));
  shareUrl.searchParams.set('days', String(currentPlanContext.duration || 1));
  shareUrl.searchParams.set('origin', currentPlanContext.origin || 'jeonju');
  shareUrl.searchParams.set('mode', currentPlanContext.mode || 'transit');
  if (currentPlanContext.date) shareUrl.searchParams.set('date', currentPlanContext.date);
  if (currentPlanContext.startTime) shareUrl.searchParams.set('start', currentPlanContext.startTime);
  const title = document.querySelector('.plan-result-header h3')?.textContent.trim() || 'DAMDA';
  const shareData = {
    title: `${title} | DAMDA`,
    text: currentLanguage === 'ko' ? 'DAMDA에서 만든 전북 여행 일정' : 'Mi ruta por Jeonbuk creada con DAMDA',
    url: shareUrl.href
  };
  try {
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(shareUrl.href);
    trackEvent('plan_share', { days: currentPlanContext.duration || 1, stops: currentPlan.length });
    showToast(currentLanguage === 'ko' ? '일정 공유 링크를 준비했습니다.' : 'El enlace de la ruta está listo para compartir.');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast(currentLanguage === 'ko' ? '공유 링크를 만들지 못했습니다.' : 'No pudimos crear el enlace.');
  }
}

function saveCurrentPlan() {
  if (!currentPlan.length) return;
  const title = document.querySelector('.plan-result-header h3')?.textContent.trim() || (currentLanguage === 'ko' ? '저장된 전북 여행' : 'Ruta guardada en Jeonbuk');
  const plan = {
    savedAt: new Date().toISOString(),
    title,
    tourIds: currentPlan.map(tour => tour.id),
    duration: currentPlanContext.duration || 1,
    regionIds: currentPlanContext.regionIds || [],
    origin: currentPlanContext.origin || 'jeonju',
    date: currentPlanContext.date || '',
    startTime: currentPlanContext.startTime || '09:30',
    mode: currentPlanContext.mode || 'transit'
  };
  localStorage.setItem('jeonbuk_travel_plan', JSON.stringify(plan));
  renderSavedPlanSummary();
  trackEvent('plan_save', { days: plan.duration, stops: plan.tourIds.length });
  showToast(currentLanguage === 'ko' ? '현재 여행 일정이 이 기기에 저장되었습니다.' : 'La ruta se guardó en este dispositivo.');
}

function restoreSavedPlan() {
  try {
    const savedPlan = getSavedPlan();
    if (!savedPlan) return;
    const restoredTours = savedPlan.tourIds.map(findTourById).filter(Boolean);
    if (!restoredTours.length) return;
    currentPlan = restoredTours;
    const duration = Math.max(
      1,
      Math.min(4, Math.max(Number(savedPlan.duration) || Math.ceil(restoredTours.length / 3), Math.ceil(restoredTours.length / 4)))
    );
    const regionIds = Array.isArray(savedPlan.regionIds) && savedPlan.regionIds.length
      ? savedPlan.regionIds.filter(regionId => JEONBUK_REGIONS[regionId])
      : [...new Set(restoredTours.map(tour => tour.regionId).filter(Boolean))];
    currentPlanContext = {
      duration,
      title: savedPlan.title || null,
      regionIds,
      origin: savedPlan.origin || 'jeonju',
      date: savedPlan.date || '',
      startTime: savedPlan.startTime || '09:30',
      mode: savedPlan.mode || 'transit'
    };
    const durationSelect = document.getElementById('plannerDuration');
    if (durationSelect) durationSelect.value = String(duration);
    if (plannerOrigin) plannerOrigin.value = currentPlanContext.origin;
    if (plannerDate) plannerDate.value = currentPlanContext.date;
    if (plannerStartTime) plannerStartTime.value = currentPlanContext.startTime;
    if (plannerTransport) plannerTransport.value = currentPlanContext.mode;
    renderTravelPlan(duration, currentPlanContext.title || (currentLanguage === 'ko' ? '저장된 전북 여행' : 'Ruta guardada en Jeonbuk'), regionIds);
  } catch {
    localStorage.removeItem('jeonbuk_travel_plan');
  }
}

function clearCurrentPlan(showMessage = true) {
  const previousStops = currentPlan.length;
  currentPlan = [];
  currentPlanContext = { duration: 2, title: null, regionIds: [], origin: 'jeonju', date: '', startTime: '09:30', mode: 'transit' };
  localStorage.removeItem('jeonbuk_travel_plan');
  plannerResult.innerHTML = '';
  plannerResult.hidden = true;
  renderSavedPlanSummary();
  if (activeTourId) updateModalPlanButton(activeTourId);
  if (showMessage) trackEvent('plan_clear', { stops: previousStops });
  if (showMessage) showToast(currentLanguage === 'ko' ? '저장된 여행 일정을 초기화했습니다.' : 'La ruta guardada se eliminó.');
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

function handleHeroCta(destination, sectionId) {
  trackEvent('hero_cta', { destination });
  scrollToSection(sectionId);
}

function handleMobileNav(destination, sectionId = '') {
  trackEvent('mobile_nav_select', { destination });
  if (destination === 'saved') {
    openSavedPanel();
    return;
  }
  scrollToSection(sectionId);
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
  const navSections = [
    { key: 'regions', element: document.getElementById('regionSelector') },
    { key: 'places', element: document.getElementById('tourCardList') },
    { key: 'planner', element: document.getElementById('plannerSection') }
  ]
    .filter(section => section.element)
    .sort((a, b) => documentTop(a.element) - documentTop(b.element));
  let active = navSections[0]?.key || 'regions';
  navSections.forEach(section => {
    if (probe >= documentTop(section.element)) active = section.key;
  });
  setMobileNavActive(active);
}

function initMobileNavigation() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  const footer = document.querySelector('.main-footer');
  let ticking = false;
  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      if (mobileNavButtons.length) updateMobileNavActive();
      const footerVisible = Boolean(footer && footer.getBoundingClientRect().top < window.innerHeight);
      document.body.classList.toggle('mobile-footer-visible', footerVisible);
      document.body.classList.toggle('mobile-nav-visible', window.scrollY > 420 && !footerVisible);
      backToTopBtn?.classList.toggle('visible', window.scrollY > 900);
      ticking = false;
    });
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  mobileNavButtons.forEach(button => {
    button.addEventListener('click', () => setMobileNavActive(button.dataset.mobileNav));
  });
  scheduleUpdate();
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

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

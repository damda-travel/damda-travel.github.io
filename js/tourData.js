// 전북 14개 시·군 핵심 추천 명소 기본 데이터셋

const JEONBUK_REGIONS = {
  "jeonju": {
    "id": "jeonju",
    "name": "전주시",
    "engName": "Jeonju-si",
    "slogan": "전통과 현대가 어우러진 맛과 멋의 고향",
    "badge": "대표 문화도시",
    "color": "#059669",
    "lat": 35.8242,
    "lng": 127.148,
    "zoom": 12,
    "description": "전통 한옥과 지역 미식, 도심 문화가 어우러진 전주의 대표 관광지를 만나보세요.",
    "tours": [
      {
        "regionId": "jeonju",
        "id": "jj-1",
        "name": "전주 한옥마을",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 3450,
        "lat": 35.8147,
        "lng": 127.1526,
        "address": "전북특별자치도 전주시 완산구 기린대로 99",
        "image": "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#전주한옥마을",
          "#기와지붕",
          "#경기전"
        ],
        "desc": "700여 동의 한국 전통 한옥 기와지붕이 이어진 대한민국 대표 문화유산 마을입니다."
      },
      {
        "regionId": "jeonju",
        "id": "jj-2",
        "name": "전주 경기전 & 어진박물관",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.8,
        "reviews": 1540,
        "lat": 35.8153,
        "lng": 127.1498,
        "address": "전북특별자치도 전주시 완산구 태조로 44",
        "image": "https://images.unsplash.com/photo-1503435824048-a799a3a84bf7?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#태조어진",
          "#대나무숲길",
          "#조선왕조"
        ],
        "desc": "태조 이성계의 어진을 모신 사적으로 푸른 대나무 숲길 포토존이 유명합니다."
      },
      {
        "regionId": "jeonju",
        "id": "jj-3",
        "name": "덕진공원 연화정 도서관",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.8,
        "reviews": 1290,
        "lat": 35.8471,
        "lng": 127.1264,
        "address": "전북특별자치도 전주시 덕진구 권삼득로 390",
        "image": "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#덕진호수",
          "#연꽃명소",
          "#한옥도서관"
        ],
        "desc": "호수 한가운데 세워진 연화정 한옥 도서관과 흐드러진 연꽃 자태가 장관입니다."
      },
      {
        "regionId": "jeonju",
        "id": "jj-4",
        "name": "전동성당",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.8,
        "reviews": 2890,
        "lat": 35.8138,
        "lng": 127.1492,
        "address": "전북특별자치도 전주시 완산구 태조로 51",
        "image": "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#전동성당",
          "#로마네스크",
          "#성지순례"
        ],
        "desc": "호남 지역 최초로 지어진 붉은 벽돌의 웅장하고 아름다운 로마네스크 성당입니다."
      },
      {
        "regionId": "jeonju",
        "id": "jj-5",
        "name": "전주 남부시장 & 청년몰",
        "category": "food",
        "categoryName": "맛집/카페",
        "rating": 4.7,
        "reviews": 1820,
        "lat": 35.8124,
        "lng": 127.1458,
        "address": "전북특별자치도 전주시 완산구 풍남문2길 63",
        "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#피순대",
          "#콩나물국밥",
          "#야시장"
        ],
        "desc": "백년 전통 시장의 명물 피순대와 콩나물국밥, 청년몰의 개성 넘치는 먹거리 거리입니다."
      }
    ]
  },
  "gunsan": {
    "id": "gunsan",
    "name": "군산시",
    "engName": "Gunsan-si",
    "slogan": "근대 시간여행과 탁 트인 고군산군도의 바다",
    "badge": "해양 관광도시",
    "color": "#0284C7",
    "lat": 35.9676,
    "lng": 126.7368,
    "zoom": 11,
    "description": "근대문화유산과 서해 섬 풍경, 오래된 미식 이야기가 있는 군산을 둘러보세요.",
    "tours": [
      {
        "regionId": "gunsan",
        "id": "gs-1",
        "name": "고군산군도 & 선유도",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2390,
        "lat": 35.8115,
        "lng": 126.4158,
        "address": "전북특별자치도 군산시 옥도면 선유도리",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#선유도해수욕장",
          "#고군산대교",
          "#명사십리"
        ],
        "desc": "신선이 놀다 간 서해 에메랄드빛 바다와 몽돌 해변이 펼쳐지는 명품 드라이브 코스입니다."
      },
      {
        "regionId": "gunsan",
        "id": "gs-2",
        "name": "군산 근대역사박물관",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.7,
        "reviews": 1640,
        "lat": 35.9904,
        "lng": 126.7118,
        "address": "전북특별자치도 군산시 해망로 240",
        "image": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#근대역사",
          "#시간여행",
          "#초원사진관"
        ],
        "desc": "근대 항구도시의 역사와 근대 건축물 유산이 보존되어 있는 시간여행 거리입니다."
      },
      {
        "regionId": "gunsan",
        "id": "gs-3",
        "name": "이성당 본점",
        "category": "food",
        "categoryName": "맛집/카페",
        "rating": 4.8,
        "reviews": 3480,
        "lat": 35.9868,
        "lng": 126.7105,
        "address": "전북특별자치도 군산시 중앙로 177",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#이성당",
          "#야채빵",
          "#대한민국1호"
        ],
        "desc": "1945년부터 이어져 온 대한민국 1호 빵집 이성당의 대표 시그니처 빵입니다."
      },
      {
        "regionId": "gunsan",
        "id": "gs-4",
        "name": "경암동 철길마을",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.6,
        "reviews": 1420,
        "lat": 35.9798,
        "lng": 126.7362,
        "address": "전북특별자치도 군산시 경촌4길 14",
        "image": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#경암동철길",
          "#교복체험",
          "#달고나"
        ],
        "desc": "마을 좁은 골목을 오가던 철길을 따라 7080 교복 체험과 추억을 즐기는 거리입니다."
      }
    ]
  },
  "iksan": {
    "id": "iksan",
    "name": "익산시",
    "engName": "Iksan-si",
    "slogan": "백제왕도 유네스코 세계유산과 보석의 도시",
    "badge": "세계유산 도시",
    "color": "#7C3AED",
    "lat": 35.9483,
    "lng": 126.9578,
    "zoom": 12,
    "description": "백제 왕도의 역사와 정원·숲길이 이어지는 익산의 대표 명소를 소개합니다.",
    "tours": [
      {
        "regionId": "iksan",
        "id": "is-1",
        "name": "익산 미륵사지 & 석탑",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 1820,
        "lat": 36.0121,
        "lng": 127.0264,
        "address": "전북특별자치도 익산시 금마면 기양리 97",
        "image": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#미륵사지석탑",
          "#세계문화유산",
          "#백제왕도"
        ],
        "desc": "백제 무왕의 서동요 설화와 국보 미륵사지 석탑이 자리한 유네스코 세계유산입니다."
      },
      {
        "regionId": "iksan",
        "id": "is-2",
        "name": "아가페 정원",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 1410,
        "lat": 36.0285,
        "lng": 126.9745,
        "address": "전북특별자치도 익산시 황등면 율촌길 9",
        "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#메타세쿼이아",
          "#비밀정원",
          "#힐링숲"
        ],
        "desc": "하늘을 가릴 듯 웅장하게 솟아오른 메타세쿼이아 숲길이 감탄을 부르는 정원입니다."
      }
    ]
  },
  "jeongeup": {
    "id": "jeongeup",
    "name": "정읍시",
    "engName": "Jeongeup-si",
    "slogan": "내장산 단풍과 동학농민혁명의 숭고한 숨결",
    "badge": "단풍 명소",
    "color": "#DC2626",
    "lat": 35.5699,
    "lng": 126.8577,
    "zoom": 11,
    "description": "내장산의 사계절과 쌍화차 골목의 정취를 함께 즐길 수 있는 정읍 여행입니다.",
    "tours": [
      {
        "regionId": "jeongeup",
        "id": "ju-1",
        "name": "내장산 국립공원 & 우화정",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2950,
        "lat": 35.4851,
        "lng": 126.8876,
        "address": "전북특별자치도 정읍시 내장산로 936",
        "image": "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#내장산단풍",
          "#우화정호수",
          "#단풍터널"
        ],
        "desc": "붉은 애기단풍 터널과 호수 위 정자 우화정이 한 편의 수묵화를 그려냅니다."
      },
      {
        "regionId": "jeongeup",
        "id": "ju-2",
        "name": "정읍 전설의 쌍화차거리",
        "category": "food",
        "categoryName": "맛집/카페",
        "rating": 4.8,
        "reviews": 1120,
        "lat": 35.5684,
        "lng": 126.8524,
        "address": "전북특별자치도 정읍시 수성동 527-1",
        "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#곱돌쌍화탕",
          "#정읍쌍화차",
          "#보양차"
        ],
        "desc": "뜨거운 곱돌 찻잔에 밤과 은행을 듬뿍 넣어 다려내는 전통 보양 쌍화차 거리입니다."
      }
    ]
  },
  "namwon": {
    "id": "namwon",
    "name": "남원시",
    "engName": "Namwon-si",
    "slogan": "성춘향과 이몽룡의 사랑이 피어나는 춘향의 고향",
    "badge": "사랑도시",
    "color": "#DB2777",
    "lat": 35.4164,
    "lng": 127.3904,
    "zoom": 12,
    "description": "춘향의 이야기와 지리산의 깊은 자연이 만나는 남원의 대표 명소를 소개합니다.",
    "tours": [
      {
        "regionId": "namwon",
        "id": "nw-1",
        "name": "남원 광한루원 & 오작교",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 2480,
        "lat": 35.4068,
        "lng": 127.3794,
        "address": "전북특별자치도 남원시 요천로 1447",
        "image": "https://images.unsplash.com/photo-1572978927063-4702f23cfc09?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#광한루원",
          "#오작교",
          "#춘향전"
        ],
        "desc": "성춘향과 이몽룡의 사랑이 깃든 오작교 다리와 완월정이 아름다운 고전 정원입니다."
      },
      {
        "regionId": "namwon",
        "id": "nw-2",
        "name": "지리산 뱀사골 계곡",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 1420,
        "lat": 35.3624,
        "lng": 127.5842,
        "address": "전북특별자치도 남원시 산내면 반선리",
        "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#뱀사골계곡",
          "#지리산",
          "#원시림"
        ],
        "desc": "지리산의 맑고 차가운 옥빛 물줄기와 원시림 암반이 만들어낸 여름 피서지입니다."
      }
    ]
  },
  "gimje": {
    "id": "gimje",
    "name": "김제시",
    "engName": "Gimje-si",
    "slogan": "지평선과 하늘이 맞닿는 아리랑 황금 들녘",
    "badge": "지평선 도시",
    "color": "#EAB308",
    "lat": 35.8036,
    "lng": 126.8808,
    "zoom": 12,
    "description": "넓은 지평선과 오래된 농경문화, 모악산의 역사를 품은 김제를 둘러보세요.",
    "tours": [
      {
        "regionId": "gimje",
        "id": "gj-1",
        "name": "김제 벽골제 & 황금들녘",
        "category": "festival",
        "categoryName": "축제/행사",
        "rating": 4.8,
        "reviews": 1220,
        "lat": 35.7578,
        "lng": 126.8378,
        "address": "전북특별자치도 김제시 부량면 벽골제로 442",
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#벽골제",
          "#지평선축제",
          "#황금들녘"
        ],
        "desc": "지평선과 하늘이 닿는 대한민국 최대 삼국시대 수리시설과 황금 들녘입니다."
      },
      {
        "regionId": "gimje",
        "id": "gj-2",
        "name": "모악산 금산사",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 1540,
        "lat": 35.7285,
        "lng": 127.0245,
        "address": "전북특별자치도 김제시 금산면 모악15길 1",
        "image": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#금산사",
          "#미륵전",
          "#모악산"
        ],
        "desc": "모악산 신령스러운 자락 아래 거대한 3층 목조 미륵전을 품은 천년 고찰입니다."
      }
    ]
  },
  "wanju": {
    "id": "wanju",
    "name": "완주군",
    "engName": "Wanju-gun",
    "slogan": "BTS가 사랑한 힐링 예술과 감성 여행지",
    "badge": "감성 감동도시",
    "color": "#10B981",
    "lat": 35.9046,
    "lng": 127.1625,
    "zoom": 11,
    "description": "한옥과 예술, 웅장한 산세가 조화를 이루는 완주의 대표 여행지를 만나보세요.",
    "tours": [
      {
        "regionId": "wanju",
        "id": "wj-1",
        "name": "아원고택 & 오성한옥마을",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 2250,
        "lat": 35.9042,
        "lng": 127.2514,
        "address": "전북특별자치도 완주군 소양면 송광수만로 516-7",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#아원고택",
          "#종남산뷰",
          "#BTS화보"
        ],
        "desc": "종남산 능선 차경과 현대 갤러리 미학이 만난 최고의 한옥 힐링 공간입니다."
      },
      {
        "regionId": "wanju",
        "id": "wj-2",
        "name": "대둔산 금강구름다리",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 1890,
        "lat": 36.1245,
        "lng": 127.3241,
        "address": "전북특별자치도 완주군 운주면 산북리 611-34",
        "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#대둔산",
          "#구름다리",
          "#삼선계단"
        ],
        "desc": "아찔한 깎아지른 암봉 절벽을 연결하는 붉은 구름다리와 호쾌한 산세입니다."
      }
    ]
  },
  "jinan": {
    "id": "jinan",
    "name": "진안군",
    "engName": "Jinan-gun",
    "slogan": "신비로운 마이산 탑사와 진안홍삼의 청정 에너지",
    "badge": "신비와 힐링",
    "color": "#2563EB",
    "lat": 35.7925,
    "lng": 127.4247,
    "zoom": 12,
    "description": "마이산의 신비로운 풍경과 편안한 휴식을 함께 누리는 진안 여행입니다.",
    "tours": [
      {
        "regionId": "jinan",
        "id": "ja-1",
        "name": "마이산 탑사",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 2310,
        "lat": 35.7621,
        "lng": 127.4285,
        "address": "전북특별자치도 진안군 마령면 마이산남로 367",
        "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#마이산탑사",
          "#신비의돌탑",
          "#암마이봉"
        ],
        "desc": "태풍에도 흔들리지 않는 80여 개 신비 석탑이 암마이봉 절벽 아래 펼쳐집니다."
      },
      {
        "regionId": "jinan",
        "id": "ja-2",
        "name": "진안홍삼스파",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.8,
        "reviews": 1450,
        "lat": 35.7984,
        "lng": 127.4282,
        "address": "전북특별자치도 진안군 진안읍 외사양길 16-10",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#홍삼스파",
          "#마이산뷰노천탕",
          "#한방스파"
        ],
        "desc": "마이산 쌍봉을 바라보며 홍삼 거품 스파와 야외 노천탕을 즐기는 한방 스파입니다."
      }
    ]
  },
  "muju": {
    "id": "muju",
    "name": "무주군",
    "engName": "Muju-gun",
    "slogan": "반딧불이가 숨쉬는 청정 자연과 덕유산 스키리조트",
    "badge": "청정 자연도시",
    "color": "#059669",
    "lat": 36.0068,
    "lng": 127.6608,
    "zoom": 11,
    "description": "덕유산의 사계절과 산머루 미식 체험이 기다리는 무주의 대표 명소를 소개합니다.",
    "tours": [
      {
        "regionId": "muju",
        "id": "mj-1",
        "name": "덕유산 향적봉 & 곤돌라",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2850,
        "lat": 35.8614,
        "lng": 127.7478,
        "address": "전북특별자치도 무주군 설천면 만선로 185",
        "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#덕유산곤돌라",
          "#향적봉눈꽃",
          "#덕유산국립공원"
        ],
        "desc": "관광 곤돌라를 타고 일대 장관 산능선과 겨울 눈꽃 상고대를 조망합니다."
      },
      {
        "regionId": "muju",
        "id": "mj-2",
        "name": "무주 머루와인동굴",
        "category": "food",
        "categoryName": "맛집/카페",
        "rating": 4.7,
        "reviews": 1540,
        "lat": 35.9984,
        "lng": 127.7125,
        "address": "전북특별자치도 무주군 적상면 산성로 359",
        "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#머루와인",
          "#동굴족욕",
          "#적상산"
        ],
        "desc": "적상산 터널 동굴 안에서 달콤한 산머루 와인 시음과 족욕 체험을 즐깁니다."
      }
    ]
  },
  "jangsu": {
    "id": "jangsu",
    "name": "장수군",
    "engName": "Jangsu-gun",
    "slogan": "논개의 절개와 빨간 사과, 한우의 고장",
    "badge": "청정 고원도시",
    "color": "#E11D48",
    "lat": 35.6472,
    "lng": 127.5214,
    "zoom": 12,
    "description": "청정한 숲과 계곡, 논개의 역사를 품은 장수의 대표 여행지를 둘러보세요.",
    "tours": [
      {
        "regionId": "jangsu",
        "id": "js-1",
        "name": "장수 의암사 (논개사당)",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.7,
        "reviews": 780,
        "lat": 35.6455,
        "lng": 127.5188,
        "address": "전북특별자치도 장수군 장수읍 논개사당길 41",
        "image": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#의암사",
          "#논개영정",
          "#의암호수"
        ],
        "desc": "호국영웅 논개의 영정을 모신 사당과 맑은 의암호수 산책로입니다."
      },
      {
        "regionId": "jangsu",
        "id": "js-2",
        "name": "방화동 자연휴양림",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 890,
        "lat": 35.5895,
        "lng": 127.5254,
        "address": "전북특별자치도 장수군 번암면 방화동로 778",
        "image": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#방화동캠핑",
          "#계곡휴양림",
          "#가족캠핑"
        ],
        "desc": "맑은 숲 그늘 계곡물 아래 캠핑과 산책을 조용히 누리는 힐링 휴양림입니다."
      }
    ]
  },
  "imsil": {
    "id": "imsil",
    "name": "임실군",
    "engName": "Imsil-gun",
    "slogan": "대한민국 치즈의 효시와 요산요수 옥정호 붕어섬",
    "badge": "치즈 & 힐링",
    "color": "#D97706",
    "lat": 35.6178,
    "lng": 127.2887,
    "zoom": 12,
    "description": "치즈 체험과 옥정호의 잔잔한 풍경을 함께 즐기는 임실 여행입니다.",
    "tours": [
      {
        "regionId": "imsil",
        "id": "im-1",
        "name": "임실 치즈테마파크",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.9,
        "reviews": 2650,
        "lat": 35.6121,
        "lng": 127.2814,
        "address": "전북특별자치도 임실군 성수면 도인2길 50",
        "image": "https://images.unsplash.com/photo-1552767059-ce182ead8c1b?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#임실치즈테마파크",
          "#유럽풍성",
          "#치즈피자체험"
        ],
        "desc": "동화 속 유럽풍 캐슬 건축물과 치즈 만들기 체험이 가득한 유럽형 테마파크입니다."
      },
      {
        "regionId": "imsil",
        "id": "im-2",
        "name": "옥정호 붕어섬 출렁다리",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2100,
        "lat": 35.5894,
        "lng": 127.1524,
        "address": "전북특별자치도 임실군 운암면 입석리 413-1",
        "image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#옥정호출렁다리",
          "#붕어섬생태공원",
          "#물안개"
        ],
        "desc": "옥정호 호수 위를 지나는 420m 출렁다리와 붕어섬 생태정원 꽃길입니다."
      }
    ]
  },
  "sunchang": {
    "id": "sunchang",
    "name": "순창군",
    "engName": "Sunchang-gun",
    "slogan": "장류의 깊은 손맛과 강천산 애기단풍의 절경",
    "badge": "장류 미식도시",
    "color": "#B91C1C",
    "lat": 35.3744,
    "lng": 127.1374,
    "zoom": 12,
    "description": "강천산의 자연과 발효 미식 문화를 함께 경험하는 순창의 대표 여행지입니다.",
    "tours": [
      {
        "regionId": "sunchang",
        "id": "sc-1",
        "name": "강천산 군립공원 & 병풍폭포",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2450,
        "lat": 35.3748,
        "lng": 127.0545,
        "address": "전북특별자치도 순창군 팔덕면 강천산길 97",
        "image": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#병풍폭포",
          "#강천산구름다리",
          "#맨발황토길"
        ],
        "desc": "시원한 병풍폭포 물줄기와 붉은 구름다리, 맨발 황토 힐링 산책로입니다."
      },
      {
        "regionId": "sunchang",
        "id": "sc-2",
        "name": "순창 고추장 민속마을",
        "category": "food",
        "categoryName": "맛집/카페",
        "rating": 4.8,
        "reviews": 1890,
        "lat": 35.3621,
        "lng": 127.1254,
        "address": "전북특별자치도 순창군 순창읍 민속마을길 55",
        "image": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#순창고추장",
          "#장독대마을",
          "#한정식"
        ],
        "desc": "장인들의 고풍스러운 한옥 집 앞 장독대가 빼곡한 고추장·장아찌 민속마을입니다."
      }
    ]
  },
  "gochang": {
    "id": "gochang",
    "name": "고창군",
    "engName": "Gochang-gun",
    "slogan": "유네스코 5관왕과 학원농장 초록 청보리밭",
    "badge": "유네스코 보물섬",
    "color": "#047857",
    "lat": 35.4358,
    "lng": 126.702,
    "zoom": 11,
    "description": "청보리 들판과 조선 읍성의 시간이 이어지는 고창의 대표 명소를 소개합니다.",
    "tours": [
      {
        "regionId": "gochang",
        "id": "gc-1",
        "name": "고창 청보리밭 학원농장",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2850,
        "lat": 35.3855,
        "lng": 126.5645,
        "address": "전북특별자치도 고창군 공음면 학원농장길 158-6",
        "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#청보리밭",
          "#학원농장",
          "#드라마도깨비"
        ],
        "desc": "30만 평 지평선 너머 파릇파릇한 초록 청보리와 메밀꽃이 나부끼는 경관농장입니다."
      },
      {
        "regionId": "gochang",
        "id": "gc-2",
        "name": "고창 모양성 (고창읍성)",
        "category": "culture",
        "categoryName": "역사/문화",
        "rating": 4.8,
        "reviews": 1680,
        "lat": 35.4324,
        "lng": 126.7042,
        "address": "전북특별자치도 고창군 고창읍 모양성로 1",
        "image": "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#고창읍성",
          "#성돌밟기",
          "#맹종죽림"
        ],
        "desc": "돌을 이고 성을 도는 성돌밟기 전설과 성안의 대나무 숲길이 신비로운 조선 읍성입니다."
      }
    ]
  },
  "buan": {
    "id": "buan",
    "name": "부안군",
    "engName": "Buan-gun",
    "slogan": "수억 년 해안 절경 채석강과 변산반도 국립공원",
    "badge": "변산 힐링해안",
    "color": "#0284C7",
    "lat": 35.7317,
    "lng": 126.7332,
    "zoom": 11,
    "description": "변산반도의 해안 절경과 깊은 숲길을 함께 만나는 부안 여행입니다.",
    "tours": [
      {
        "regionId": "buan",
        "id": "ba-1",
        "name": "채석강 & 적벽강",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 3120,
        "lat": 35.6264,
        "lng": 126.4715,
        "address": "전북특별자치도 부안군 변산면 격포리",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#채석강",
          "#해식동굴포토존",
          "#격포해수욕장"
        ],
        "desc": "수억 년 바닷물이 차곡차곡 쌓은 만 권의 책 모양 해식절벽과 동굴 포토존입니다."
      },
      {
        "regionId": "buan",
        "id": "ba-2",
        "name": "내소사 전나무 숲길",
        "category": "nature",
        "categoryName": "자연/힐링",
        "rating": 4.9,
        "reviews": 2350,
        "lat": 35.6184,
        "lng": 126.5842,
        "address": "전북특별자치도 부안군 진서면 내소사로 243",
        "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
        "tags": [
          "#내소사전나무숲",
          "#꽃창살",
          "#변산반도"
        ],
        "desc": "사찰 입구부터 깊은 울림을 주는 600m 전나무 숲길과 조선 시대 꽃창살 절집입니다."
      }
    ]
  }
};

const RECOMMENDED_COURSES = [
  {
    id: "course-1",
    title: "전북 핵심 힐링 & 역사 2박 3일",
    period: "2박 3일 코스",
    tags: ["전주", "완주", "익산", "군산"],
    spotIds: ["jj-1", "jj-5", "wj-1", "wj-2", "is-1", "is-2", "gs-2", "gs-1", "gs-3"],
    desc: "전주 한옥마을 감성 숙박 ➔ 완주 아원고택 갤러리 산책 ➔ 익산 미륵사지 세계유산 ➔ 군산 근대시간여행 & 선유도 바다",
    bg: "linear-gradient(135deg, #059669 0%, #0284C7 100%)"
  },
  {
    id: "course-2",
    title: "변산반도 & 미식 미향 힐링 드라이브",
    period: "1박 2일 코스",
    tags: ["부안", "고창", "순창"],
    spotIds: ["ba-1", "ba-2", "gc-1", "gc-2", "sc-2", "sc-1"],
    desc: "부안 채석강 해식동굴 탐방 ➔ 내소사 전나무 숲길 ➔ 고창 풍천장어 & 청보리밭 ➔ 순창 고추장 민속마을 미식",
    bg: "linear-gradient(135deg, #0D9488 0%, #10B981 100%)"
  },
  {
    id: "course-3",
    title: "산악 힐링 & 레저 단풍 힐링 코스",
    period: "당일/1박 코스",
    tags: ["정읍", "무주", "진안"],
    spotIds: ["ju-1", "ja-1", "mj-1"],
    desc: "정읍 내장산 단풍 우화정 ➔ 진안 마이산 신비 돌탑 ➔ 무주 덕유산 곤돌라 눈꽃/푸른 능선 조망 ➔ 머루와인 동굴",
    bg: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
  }
];

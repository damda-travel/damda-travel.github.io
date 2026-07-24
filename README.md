# 전북관광 정보지도

전북 14개 시·군의 관광지·맛집·카페·축제/행사를 공식 관광정보 기반 사진과 함께 탐색하고, 장소 저장과 여행 일정 만들기까지 이용할 수 있는 반응형 관광 정보 웹앱입니다.

## 주요 기능

- 전북 14개 시·군 지도 및 지역별 빠른 탐색
- 관광지명·지역·키워드 통합 검색
- 맛집/카페, 역사/문화, 자연/힐링, 축제/행사 필터
- 추천순·이름순·지역순 정렬
- 상세 정보, 카카오맵 길찾기, 공유, 장소 저장
- 장소별 공식 소개, 추천 체류 시간, 추천 여행 유형, 운영·휴무·요금·주차·문의 정보
- 긴 장소 소개 펼치기와 장소별 방문 팁
- 기간·테마·중심 지역 기반 여행 일정 초안 생성
- 검증된 추천 코스 3종
- 모바일 하단 메뉴와 반응형 레이아웃
- 한국관광공사 국문 관광정보 서비스 `KorService2` 선택 연동

## 사진과 지도

- `images/spots/`: 주요 전북 관광지의 공식 관광 페이지 기반 로컬 사진
- `js/tourCatalog.js`: 투어전북 공식 목록에서 동기화한 전체 관광 데이터
- `scripts/official_catalog_audit.json`: 수집 건수·출처·사진 연결 검수 기록
- `js/tourImages.js`: 관광지별 사진·출처·이용 조건 매핑
- `js/tourDetails.js`: 관광지별 공식 소개·연락처·홈페이지와 방문 정보 매핑
- `scripts/official_photo_audit.json`: 사진 매칭 감사 기록
- `scripts/sync_official_photos.js`: 공식 관광 페이지에서 사진을 다시 동기화하는 스크립트
- `scripts/official_detail_audit.json`: 공식 상세 정보 수집 감사 기록
- `scripts/sync_official_details.js`: 공식 관광 페이지에서 상세 정보를 다시 동기화하는 스크립트
- `images/jeonbuk_map_clean-v2.png`: 인터랙티브 핀을 위한 간결한 전북 지도 배경

사진 출처는 각 관광지 상세창에서 확인할 수 있습니다. 외부 공개 또는 상업 운영 전에는 각 출처의 최신 이용 조건을 다시 확인해야 합니다.

## 파일 구조

```text
jeonbuk-tour-map/
├─ index.html
├─ css/
│  └─ style.css
├─ images/
│  ├─ jeonbuk_map_clean-v2.png
│  └─ spots/
├─ js/
│  ├─ app.js
│  ├─ tourApi.js
│  ├─ tourData.js
│  ├─ tourDetails.js
│  └─ tourImages.js
└─ scripts/
   ├─ official_detail_audit.json
   ├─ official_photo_audit.json
   ├─ sync_official_details.js
   └─ sync_official_photos.js
```

## 로컬 실행

프로젝트 폴더에서 정적 웹 서버를 실행합니다.

```bash
npx http-server . -p 8085 -a 127.0.0.1 -c-1
```

접속 주소: `http://127.0.0.1:8085`

## 데이터 주의사항

- 기본 관광지 정보는 `js/tourData.js`에서 관리합니다.
- 운영시간, 휴무일, 입장료는 변경될 수 있으므로 방문 전 공식 관광정보에서 확인해야 합니다.
- TourAPI 키가 없으면 검수된 기본 데이터로 작동합니다.
- 브라우저에 API 키를 저장하는 기능은 개발·테스트용입니다. 공개 서비스에서는 서버를 통한 안전한 연동이 필요합니다.

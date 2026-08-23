# DAMDA

남미 여행자를 위한 스페인어 우선·한국어 보조 전북 관광 웹앱입니다. 전북 14개 시·군의 관광지, 음식점·카페, 자연 명소, 축제 정보를 탐색하고 장소 저장, Google Maps 길찾기, 다지역 여행 일정 만들기를 이용할 수 있습니다.

## 주요 기능

- 스페인어 기본, 한국어 보조 언어 전환
- 지역·테마·키워드 검색과 정렬
- 6개씩 불러오는 경량 관광 카드
- 장소별 상세 소개, 운영정보, 공식 출처, Google Maps 이동
- 장소 저장과 저장 목록 기반 일정 생성
- DAMDA 편집 컬렉션과 기간·테마·출발지·날짜·이동수단 기반 플래너
- 장소별 예상 도착·체류 시간, 구간 이동시간·교통비, 하루 Google Maps 동선
- 모바일 하단 내비게이션과 반응형 레이아웃
- 첫 방문 여행 성향 진단과 수요 데이터 수집
- 장소별 공유 링크로 해당 상세 화면 바로 열기
- 모바일 홈 화면 설치용 웹앱 매니페스트

## 여행 수요 퍼널

- 첫 화면에서는 여행 단계 한 가지만 묻고, 사용자가 맞춤 추천을 요청할 때 국가 → 관심 테마 → 선택 연락처를 이어서 질문합니다.
- 관심 테마는 최대 3개이며, 완료 후 관련 관광정보로 바로 연결합니다.
- 사용자는 언제든 건너뛸 수 있고, 푸터의 `Tu perfil de viaje`에서 다시 열 수 있습니다.
- 연락처는 선택 입력이며 명시적으로 동의한 경우에만 저장합니다.
- 응답은 Sites D1의 `travel_demand` 테이블에 저장합니다. 구조는 `drizzle/0000_travel_demand.sql`과 `db/schema.ts`에서 관리합니다.

## 데이터와 신뢰도

- `js/tourCatalog.js`: 투어전북 공식 목록을 기준으로 동기화한 전체 카탈로그
- `data/catalog-details/*.json`: 긴 소개·연락처·운영정보를 14개 지역별로 분리한 상세 데이터
- `js/tourDetails.js`: 공식 상세 소개·연락처·운영정보 보강 데이터
- `js/tourImages.js`: 장소별 사진과 출처 매핑
- `js/tourApi.js`: 한국관광공사 `KorService2` 개발·검수용 선택 연동
- 한국관광공사 서어 관광정보서비스 `SpnService2`는 스페인어 설명 보강에 사용할 수 있으나, 서비스 키를 공개 클라이언트에 넣지 않습니다.

추천 체류시간은 모든 장소에 공통으로 제공되는 공식 필드가 없습니다. 따라서:

- `recommendedDurationSource: 'official'`이 있는 값만 공식 안내로 표시합니다.
- 그 외에는 `js/app.js`의 `getRecommendedStay()`에서 장소 유형별 범위를 계산하고 `예상/Estimación`으로 표시합니다.
- 운영시간·휴무일·요금·행사일정은 변동될 수 있으므로 상세 화면의 공식 출처에서 재확인해야 합니다.
- `node scripts/audit_catalog_quality.mjs`로 이미지·주소·좌표·공식 출처·스페인어 편집 번역의 누락 현황을 `scripts/catalog_quality_audit.json`에 기록합니다.

## 경로·교통비 데이터

- API 키가 없을 때는 직선거리와 이동수단별 평균 속도를 바탕으로 계산한 값을 `DAMDA 예상/Estimación DAMDA`로 명확히 표시합니다.
- Sites 운영 환경에 `GOOGLE_MAPS_API_KEY`를 등록하면 `/api/route-estimate`가 Google Routes API의 실제 경로 시간·거리와 제공 가능한 대중교통 운임을 우선 사용합니다.
- Google 응답을 받을 수 없거나 운임이 제공되지 않으면 기존 DAMDA 예상값을 유지합니다. 키를 클라이언트 코드에 넣지 않습니다.

## 성능 구조

- 전체 관광 데이터는 처음 한 번만 색인하고 이후 검색·필터·상세 조회에서 재사용합니다.
- 초기 목록에는 카드에 필요한 필드만 포함하고, 긴 상세정보는 사용자가 공식 카드를 열 때 해당 지역 파일 하나만 지연 로딩합니다.
- 한국어 고유명은 스페인어 장소 유형(박물관·공원·해변·시장 등)과 로마자 고유명을 조합해 붙여쓰기식 기계 번역을 피합니다.
- 공식 목록의 테마가 명칭과 어긋나는 경우 박물관·성당·자연공원 등 장소 유형 규칙으로 화면 분류를 보정합니다.
- 초기 화면은 카드 6개만 렌더링하며 이미지는 WebP와 지연 로딩을 사용합니다.
- 비동기 검색에는 요청 순번을 적용해 늦게 도착한 이전 응답이 최신 화면을 덮어쓰지 못하게 합니다.
- 스크롤 기반 모바일 메뉴와 맨 위로 버튼은 하나의 `requestAnimationFrame` 루프로 처리합니다.
- 모바일에서는 고비용 배경 블러와 터치 호버 확대를 제거합니다.

## 파일 구조

```text
jeonbuk-tour-map/
├─ AGENTS.md
├─ README.md
├─ index.html
├─ css/
│  ├─ style.css
│  └─ polish.css
├─ js/
│  ├─ app.js
│  ├─ tourApi.js
│  ├─ tourCatalog.js
│  ├─ tourData.js
│  ├─ tourDetails.js
│  └─ tourImages.js
├─ data/
│  └─ catalog-details/
│     └─ {regionId}.json
├─ images/
│  ├─ catalog/
│  └─ spots/
├─ scripts/
│  ├─ sync_official_catalog.js
│  ├─ sync_official_details.js
│  ├─ sync_official_photos.js
│  └─ *_audit.json
└─ dist/
   ├─ client/
   └─ server/
```

루트의 `index.html`, `css/`, `js/`, `images/`가 편집 원본입니다. 배포 전 변경 파일을 `dist/client/`에 동일하게 동기화합니다.
기존 스타일 구조를 유지하고 최종 UX 보정은 `css/polish.css`에서만 관리합니다.

## 로컬 실행

프로젝트 폴더에서:

```powershell
npx http-server . -p 8085 -a 127.0.0.1 -c-1
```

접속 주소: `http://127.0.0.1:8085`

## 배포 전 점검

1. 모바일 390×844에서 스페인어·한국어 전환
2. 검색, 지역·테마 필터, 정렬, 더보기
3. 상세 모달, 설명 펼치기, 추천 체류시간의 예상 표기
4. 장소 저장, 마이페이지, 저장 목록 기반 일정
5. 플래너 생성, Google Maps 링크, 하단 메뉴 활성 상태
6. 새로고침 시 맨 위 이동과 가로 스크롤 없음
7. 데스크톱 1280px에서 카드·모달·섹션 배치
8. 브라우저 콘솔 오류 없음
9. 첫 방문 진단 ES/KR, 건너뛰기, 최대 3개 테마, 선택 연락처 동의, 완료 후 필터 연결
10. `node scripts/test_client_catalog.mjs`, `node scripts/audit_catalog_quality.mjs`, `node scripts/test_server.mjs`

공식 카탈로그를 다시 동기화하면 `scripts/sync_official_catalog.js`가 `scripts/split_catalog_details.mjs`를 이어서 실행해 목록과 지역별 상세 파일을 다시 분리합니다.

배포 프로젝트 ID는 `.openai/hosting.json`을 기준으로 재사용합니다. 공개 배포는 검증된 커밋으로만 진행합니다.

## 운영 배포

- 공개 프런트엔드: `https://damda-travel.github.io/`
- `main` 브랜치에 푸시하면 `.github/workflows/pages.yml`이 `dist/client/`를 GitHub Pages에 자동 배포합니다.
- 여행 수요 저장 API와 D1은 기존 Sites 서버 `https://damda.parkg9832.chatgpt.site/api/travel-demand`를 사용합니다.
- `dist/server/`가 변경되면 GitHub Pages 배포와 별도로 기존 Sites 프로젝트에도 서버를 재배포합니다.
- GitHub Pages는 정적 호스팅이므로 API 주소를 GitHub 프런트 코드와 같은 상대 경로로 바꾸지 않습니다.

# MOAMOA-87 — 공유 데이터, 상세방, 더미 입찰

## 범위

2단계에서 `/auction/[auctionId]`와 Public/Private 기본 방을 연결했다.
입찰 모달, 검증, 더미 제출과 채팅·자동 종료·결과 판정을 연결했다.
종료와 채팅의 최종 동작은 auction-results.md와 auction-chat.md를 참고한다. 자동 시작과 정산은 미구현이다.
목록·생성·상세는 공유 `auctionStore`에 연결한다. `AuctionSummary`, 기존 fixtures,
회원 저장소 및 API 타입은 유지한다. 저장소에서 경매 API 명세를 찾지 못했으므로
`auctionMock.ts`는 mock 전용 모델이며 추후 API DTO와 어댑터로 연결해야 한다.

## 수명과 데이터

- `auctionStore`는 클라이언트 모듈 단위의 메모리 singleton이다. 라우트 이동 시 재사용하며
  localStorage/sessionStorage에 저장하지 않는다. 전체 새로고침은 fixtures와 빈 기록으로 복원한다.
- `createAuctionStore`는 독립 테스트/새 세션용 factory다. 페이지 렌더 함수 안에서 호출하지 않는다.
- `auctions`가 목록과 상세의 단일 원본이다. `getAuction(id)`는 없는 ID에 undefined를 반환한다.
- 생성 액션은 기존 `createMockAuction` 검증을 재사용한다. ID 카운터는 store 수명에 속하고
  충돌도 검사한다. 생성 회원은 `mock-member-001`, fixture 판매자는 별도 안정된 ID를 사용한다.
- 회원은 hydration/소유 여부 확인을 위한 읽기 전용 입력이다. 잔액·인벤토리는 변경하지 않는다.
- `submitBid`는 최신 회원 snapshot getter를 호출하고 현재 경매와 재검증한 뒤 원자적으로 기록을 추가한다.
  세션 내 bidId 충돌 검사와 수락된 requestId 중복 차단을 제공한다. messages/results 전송 액션은 없다.
- 입찰 배열은 수락 순서의 기록이다. Private은 동일 사용자의 마지막 수락 기록만 유효하다.
  금액이 낮아져도 마지막 기록을 선택한다. 동일 시각의 제출도 배열 순서로 구분한다.
- `getRoomData(id, viewerId)`는 Private에서 본인 최신 입찰만 노출하고 최고가/최고 입찰자를 숨긴다.
  원본 store는 mock 엔진용이며 보안 경계가 아니다. 향후 서버에서도 비공개 필드를 제거해야 한다.
  Private 결과 공개 범위는 별도 확정 전까지 이 projection에서 숨긴다.
- React에서 전체 `getRoomData()` 결과를 그대로 Zustand selector로 반환하면 새 객체로 인해
  불필요한 구독 갱신이 발생할 수 있다. 원본 slice를 구독한 뒤 projection을 계산한다.

## 실제 시각과 데모 시각

- fixtures의 원래 날짜·상태·입장 가능 여부를 보존한다. `timeBasis: DEMO`로 구분한다.
- store 생성 시의 실제 시각을 anchor로 두고, 데모 시각은 2026-11-14 14:00 KST부터 흐른다.
  `getAuctionNow(id, realNow)`를 사용해야 하며 fixture의 endTime을 Date.now()와 직접 비교하지 않는다.
- 사용자가 생성한 경매는 `REAL`이다. 기존처럼 실제 오늘의 미래 10분 단위 시간을 검증한다.
- 5분은 **더미 데이터용 길이**일 뿐 운영 경매 기간 정책이 아니다. `endTime` 초기값을 제공하기 위한
  설정이며 운영 API에서는 서버의 종료 시각으로 대체한다.
- 2단계의 interval은 남은 시간 표시만 갱신한다. 시간이 지나도 status/canEnter는 자동 변경하지 않는다.
- `scheduledStartTime`과 기존 목록용 `startTime`은 생성 시 동일하다. 향후 일정 수정 시 함께 갱신한다.

## 정책 경계

- Public 반복 입찰, 현재 최고가 초과 비교를 표현한다. `exceedsPublicHighestBid`는 전체 검증 함수가 아니다.
- 향후 수락된 Public 입찰 시 남은 시간이 0초 초과/10초 이하이면 입찰 시각 + 10초로 연장한다.
  0초 또는 지난 시각은 경매를 되살리지 않는다. Private은 잠정적으로 연장하지 않는다.
- 연장 정책 함수는 Public 제출과 연결되어 있다. 진행 상태/마감/최신 잔액/최고가는 재검증한다.
  입장/판매자 참여 권한은 미확정이며 운영 서버 연결 전 확정해야 한다.
- Public 최초 입찰 및 Private 입찰은 시작가 이상을 임시 기준으로 사용한다.
  최소 단위, 동률, 화폐 정산, 아이템 이전은 별도 TODO 정책 함수가 UNRESOLVED를 반환한다.
  확정 전에는 성공 판정이나 회원 변경을 수행하는 데 사용하지 않는다.
- 2단계에서 생성 UI 안내도 Public 마감 직전 10초 갱신/Private 마지막 입찰 유효 정책으로 변경했다.

## 검증 명령

```text
npm run lint
npx tsc --noEmit
npm run build
node --test tests/*.test.mjs
node --import tsx --test tests/*.test.tsx
```

추가 테스트는 실제 AuctionList의 정적 렌더링, 필터/페이지별 카드, 생성 후 반영, ID 조회,
세션 수명, 시계 분리, Private 최신 입찰/노출 범위, Public 연장 경계를 검증한다.
2단계 테스트는 상세 라우트 params, ID별 렌더, Private HTML 비공개, Header/Viewport 1개,
입장 가능 경로, 비활성 카드, 타이머 표시와 에셋 원본 해시도 검증한다.

## 2단계 화면 구성과 에셋

- 두 최종 SVG를 1440px 너비로 실제 렌더링해 확인하고 SVG 좌표를 읽었다. 디자인 기준은 1920×1080.
- `room-scene.png`는 public SVG 내부 `image0_526_992`의 PNG 원본 바이트를 추출한 것이다.
  배경·펭귄·단상·좌석만 포함하며 Header·텍스트·아이템·말풍선·버튼은 포함하지 않는다.
  원본 SVG는 수정하지 않았다. `node scripts/extract-auction-room.mjs`로 재추출할 수 있다.
- SHA256: `4c60ebe8804b6fff58ac626f51185d172e3e0971b35e4ac0cd9d56e7b6ceeaa3`
- 주요 기준 좌표: 아이템 패널 (1013,379), 타이머 (1527,173), 입찰자 패널 (1527,285),
  말풍선 (318,316), 채팅 (50,779), 하단 버튼 (1370,976)/(1570,976).
- 공통 Header/Viewport는 MainShell에서 한 번만 렌더한다. 상세 장면은 transform stacking context
  내부의 음수 z-index 레이어이며, 목록 배경/공통 컴포넌트는 변경하지 않았다.
- 아이템·코인·본인 아바타는 기존 픽셀 에셋을 재사용한다. 참가자와 잠금/접기 아이콘은 단순 SVG 도형이다.
- 실제 데이터가 없으면 최고가/내 입찰가는 대시, 최고 입찰자는 '아직 입찰 없음'이다.
  다른 회원의 이름 데이터가 없으면 '참가자'로 표시하며 임의 닉네임/아바타를 만들지 않는다.
- 현재 사용자 닉네임은 memberStore에서 읽지만 회원 데이터는 변경하지 않는다.
- Private은 getRoomData의 본인 최신 기록만 UI에 전달한다. 다른 참가자의 금액이나 전체 기록을 표시하지 않는다.
- 시안과 달리 유형·상태·참가 인원 배지를 추가했다. Private 안내는 최신 입찰 유효 정책으로 바꿨다.
  채팅은 실제 메시지가 없으면 빈 내역, 전송 비활성/준비 중 안내를 표시한다. 접기/펼치기는 가능하다.
- 타이머 예시 1:15와 예시 최고가/대화는 하드코딩하지 않는다. 예약 경매는 진행 예정 시간 05:00을 표시한다.
  개발 모드에서만 표시되는 '데모 경매 시작'으로 startedAt과 endTime을 현재 경매 시각부터 5분으로 설정한다.
  기존 scheduledStartTime은 보존한다. 이 수동 시작은 생성한 REAL 경매에도 적용되는 mock 전용 동작이다.
  대기 중 입찰 버튼은 비활성이다. 마감 시 00:00과 종료 결과를 표시하고 제출을 차단한다.
- 존재하지 않는 ID는 클라이언트 준비 후 오류 안내와 목록 링크를 표시한다. 로딩 중에 오류를 먼저 표시하지 않는다.
- 입장 마감 차단은 기존 목록의 canEnter를 유지한다. 직접 URL로 조회한 유효 ID의 읽기 화면은 허용한다.
  실제 입장/판매자 권한 검증은 입찰 단계에서 별도 정책으로 확정해야 한다.

## 다음 단계 및 수동 검증

- 공통 native dialog Modal을 그대로 재사용해 Escape/닫기/뒤쪽 화면 차단을 제공한다.
  조건부 마운트로 재오픈 시 입력/요청 상태를 초기화한다. 회원 hydration 전 제출은 차단한다.
  성공 시 모달을 닫고 3초간 '입찰이 완료되었어요!'를 표시한다. Public 최고가/입찰자 또는 Private 내 최신가가 갱신된다.
- 6개 PNG를 직접 확인했다. 1920×1080 기준 폭 800, Public 높이 446/오류 534,
  Private 높이 472/오류 566으로 구성하고 viewportScale로 독립 배율을 적용한다.
  시안과 다른 점: Private 반복 입찰 안내, 시작가 이상 허용 문구, 실제 잔액/금액, 테스트용 시작 버튼,
  hydration/잘못된 숫자/마감 오류 상태 추가. 새 이미지 추출 없이 기존 코인과 디자인 토큰을 재사용한다.
- 시간 표시 hook은 status/결과/연장을 변경하지 않는다. 다음 단계의 경매 엔진과 별도로 유지한다.
- 브라우저 연결 도구가 `browser access host unavailable`, Windows 클릭이
  `coordinate input geometry is unavailable`로 실패했다. 실제 브라우저 클릭·픽셀 비교는 미검증이다.
- 수동 확인: `/auction`에서 002(Private), Public 필터의 004 입장, 나가기, 001/005 비활성,
  신규 경매 생성→입장→나가기→유지, 새로고침 초기화, `/auction/missing` 오류,
  데모 시작→입찰→성공 알림→재입찰, Escape/닫기→재오픈 초기화, 모달 뒤 버튼 차단,
  채팅 접기/펼치기, 1920×1080/1366×768/모바일 크기에서 배율·글자·버튼 확인.
- 3단계 자동 테스트는 최초/반복/하향 Private 입찰, 최신 최고가·잔액·hydration 검증,
  안전 정수, 중복·재진입 요청, 마감 제출 차단/연장 미실행, 대기 타이머와 진행자 안내를 포함한다.
  브라우저 조작과 실제 픽셀 비교는 연결 host 오류로 NOT TESTED이다.

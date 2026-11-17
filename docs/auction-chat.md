# MOAMOA-87 — 5단계 로컬 채팅

이 문서는 auction-data.md의 이전 단계 '채팅 전송 미구현' 설명을 대체한다.

- AuctionRoomChat의 위치, 너비 600px, 내역 높이 132px, 입력 높이 57px 및 접기 기능 유지.
- 기존 단일 행 input 유지. 버튼/Enter 전송, IME composition 및 keyCode 229에서는 전송 차단.
- 임시 AUCTION_CHAT_MAX_LENGTH=100. HTML maxLength와 동일한 UTF-16 길이이며 공백 제거 전 검증한다.
- 최신 memberStore.nickname을 전송 시 읽는다. senderId는 기존 mock-member-001로 닉네임과 독립적이다.
- store.sendChat은 유효한 방/종료 상태/결과 존재 여부/내용/요청 ID를 검증하고 메시지를 추가한다.
- 요청 ID로 중복 수락을 차단한다. 동일한 내용을 새 요청으로 다시 보내는 것은 허용한다.
- UI는 동기 ref로 실행을 잠그고 성공 직후 draft ref와 입력 상태를 초기화한다. 실패 시 입력은 보존한다.
- 메시지는 수락 순서로 추가한다. createdAt은 실제 시각이며 경매 데모 타이머와 독립적이다.
- getRoomData가 auctionId로 필터링한다. 라우트 이동/접기에서 유지되며 새로고침은 빈 초기 기록으로 복원한다.
- 내역 하단 32px 이내에서만 새 메시지를 따라간다. 이전 대화를 읽으면 위치를 유지하고 접었다 펼칠 때도 복원한다.
- SCHEDULED/IN_PROGRESS에서 전송 가능하며 ENDED 또는 결과 존재 시 store가 차단한다. 전송 직전에 종료 시각도 재검증한다.
- 입찰 및 결과 모달 중 채팅은 inert 및 disabled 상태로 조작을 차단한다.
- STOMP/광장/회원 저장소는 변경하지 않는다. WebSocket 연결이나 자동 응답 메시지도 없다.

## 검증

최종 PR 기준 전체 자동 테스트 81개, TypeScript, production build, lint 실행.
데이터 수명/방 분리/중복 요청/길이/종료 차단 및 IME·스크롤 판단 함수를 자동 검증한다.
실제 DOM 입력 초기화·연속 클릭·IME 이벤트 순서·접기 스크롤 복원·레이아웃은 브라우저 host 오류로 NOT TESTED.
수동으로 Public/Private 방에서 입력→버튼/Enter 전송, 한글 확정 Enter, 100자 붙여넣기,
빠른 클릭, 동일 내용 재입력, 내역 위로 스크롤 후 새 메시지, 접기 중 전송→펼치기를 확인한다.

## 향후 연결

sendChat 호출부를 경매 전용 transport 어댑터로 교체하고 서버 메시지를 auctionId별로 반영한다.
서버 messageId 및 client requestId의 매핑, ACK/실패/재시도, 순서와 이력 로딩 정책이 필요하다.
네트워크 비동기화 시 잠금은 ACK까지 유지하고 실패한 draft와 입력 중인 새 draft를 구분해야 한다.
광장 연결과 분리하고 경매 채널의 실제 DTO를 MockAuctionMessage로 직접 단언하지 않는다.

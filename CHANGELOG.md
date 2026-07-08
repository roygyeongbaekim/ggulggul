# 꿀꿀 저축챌린지 — 개발 변경 이력

---

## 2026-05-21

### UI 개선
- 탭 버튼(`.tap-button`) 크기 축소: `width:min(190px,60vw)`
- 저축 금액(`.money`) 표시 영역 디자인 개선 (핑크 그라데이션 배경, `color:#7b2845`)
- 업그레이드 섹션 헤더 "⚡ 빠른 업그레이드" 추가
- 인트로 화면 타이틀과 부제목 간격 확대

### 기능 추가
- 인트로 화면 이름 입력창 외부 클릭 시 키패드 자동 닫기
- 화면 더블클릭/더블탭 확대 방지 (`dblclick` preventDefault, `touchend` 300ms 간격 체크)
  - 단, 돼지저금통 버튼(`earnBtn`)은 빠른 클릭 허용 예외 처리
- 랭킹 1·2·3위 메달 아이콘 🥇🥈🥉 적용
- HTML 캐시 방지 메타태그 추가 + CSS/JS 버전 쿼리스트링 `?v=20260521`

### 퀴즈 시스템 개선
- 퀴즈 정답 시 컨페티 + 축하 모달 표시 (`#quizCorrectModal`)
- 퀴즈 오답 시 모달 유지 + 정답 초록색 강조 표시
- 오답 후 닫기 버튼 클릭 시 확인 팝업 없이 바로 닫기 처리

### 애니메이션
- 저축 금액 증가/감소 시 플로팅 텍스트 애니메이션 (`showMoneyFloat`)
  - 증가: 초록색 `+금액`, 감소: 빨간색 `-금액`
- 업그레이드 구매(금액 감소) 시 돼지 입에서 코인 튀어나오는 이젝트 애니메이션 (`triggerCoinEjectAnimations`, 3방향 fan-out)

### 데일리 시스템
- 하루 200번 클릭 완료 시 `tapDoneOverlay` 표시
  - "내일 또 만나요꿀~ 🐷" 문구 + 자정까지 남은 시간 카운트다운

### Firebase 마이그레이션
- Firestore → **Realtime Database** 전환
  - `databaseURL: https://ggulggul-default-rtdb.asia-southeast1.firebasedatabase.app`
  - SDK: `firebase-app-compat.js` + `firebase-database-compat.js` v10.7.1
- Firebase 키 안전 처리: `safeKey()` 함수 추가 (영숫자만 허용)
- `generatePlayerId()`: Firebase 허용 특수문자 포함 랜덤 32자리 ID 생성

### 랭킹 시스템
- 랭킹 탭 추가: 일일 / 주간 / 월간
- `fetchAndCacheRanking()`: Firebase 로드 완료까지 최대 5초 대기 후 전체 조회
- `saveRankingToFs()`: `playerId_date` 키로 저장 (중복 방지)
- `aggregateRanking()`: 주간·월간 플레이어별 점수 합산
- 인트로/게임 화면 cross-browser 랭킹 일관성 확보 (localStorage 폴백 제거)
- `database.rules.json` 배포

---

## 2026-05-22

### 콤보 시스템 개선
- 퀴즈 등장 또는 애니메이션 재생 중 콤보 타이머 일시정지
  - `pauseCombo()`: 타이머 중단 + 남은 시간 저장
  - `resumeCombo()`: 남은 시간으로 타이머 재개
  - `showEventModal()` 진입 시 `pauseCombo()`, `closeEventModal()` 시 `resumeCombo()` 호출

### 랭킹 시스템 개선
- `getWeekStart()` 수정: rolling 6일 → **이번 주 월요일** 기준
- `_allRankingItems` 전역 배열 도입: Firebase 전체 데이터 메모리 보관
- `rebuildRankingCache()` 신설: 일일/주간/월간 탭 정확한 재계산 단일 함수
- `saveRankingToFs()`: 저장 후 `_allRankingItems` 갱신 → `rebuildRankingCache()` 재계산
- `snap.forEach` → `Object.values(snap.val())` 변경 (forEach 조기 종료 버그 수정)
- 랭킹 로딩 상태 관리: `_rankingLoading` 플래그
  - 로딩 중: 스피너 + "랭킹 불러오는 중..." 표시
  - 로딩 완료 후 데이터 없을 때만: "아직 기록이 없어요" 표시

### 랭킹 UI 개선
- 인트로 화면 주간·월간 탭: 이름 옆에 최고 점수 달성 날짜 표기 `(YYYY.MM.DD)` 형식
- 랭킹 타이틀 왕관 아이콘 추가: "👑 명예의 저축왕"
- `#1 #2 #3` 등수 텍스트 제거 (메달 배지로 대체)

### 랭킹 저장 기능 수정
- 게임 화면 "현재 점수 저장" 버튼 제거
- 200번 클릭 전: 저장 버튼 계속 활성화, 클릭마다 Firebase 덮어쓰기 가능
- 200번 도달 후 저장 시: 버튼 비활성화 + "✅ 저장됨" 표시
- `isRankingSavedToday()` 단순화: `dailyData.rankingSaved`만 참조
- `database.rules.json`: ranking 쓰기 규칙 `"!data.exists()"` → `true` (덮어쓰기 허용)

---

## 2026-05-25

### 자동 로그인 (URL 파라미터)
- `?pid=<32자리UUID>` 파라미터로 접속 시 인트로 화면 건너뛰고 바로 게임 진입
  - Firebase `players/{safeKey(pid)}` 조회 → 플레이어 이름 확인 → `doLogin()` 호출
- `doLogin()` 함수 신설: 로그인 공통 로직 통합 (startBtn / URL 파라미터 공용)

### 마지막 접속일시 표시
- 게임 화면 상단 로고 우측에 이전 접속 일시 표시
  - 형식: `마지막 접속: YYYY.MM.DD HH:MM:SS`
  - 현재 접속 시각이 아닌 **이전** 접속 시각 표시 (로그인 전 Firebase에서 읽어옴)
- `fmtDatetime()` 유틸 함수 추가

### UUID 생성 방식 변경
- Java `UUID.randomUUID()` 스타일 기반 **32자리 소문자 hex** (하이픈 없음)
  - 예시: `550e8400e29b41d4a716446655440000`
  - UUID v4 규격 준수 (version bits, variant bits 설정)
  - Firebase 불허 문자(`.#$[]/`) 포함 시 재생성 루프

### 출석 캘린더 개선
- `checkinDates[]` 배열 도입: 실제 접속한 날짜 누적 저장
  - 연속 출석 여부와 무관하게 접속한 날에 ✓ 표시
  - 30일 이전 데이터 자동 정리
- 기존 `streak` 기반 백필: `checkinDates`가 비어있을 때 streak 일수만큼 과거 날짜 자동 복원
- 오늘 날짜가 `checkinDates`에 없는 경우 보완 추가 (기능 도입 전 접속 유저 대응)

---

## 2026-05-25 (추가)

### 버그 수정
- `startBtn.onclick`에서 `state.playerName` 세팅 전 `peekPlayerId()` 호출 → 잘못된 localStorage 키 참조로 플레이어 데이터 유실되던 문제 수정
  - `state.playerName = name` 을 `peekPlayerId()` 호출 전으로 이동
- `doLogin()` 내 `updateLastLoginDisplay` 중복 호출 제거 → `prevLogin` 파라미터로 통합
- URL 자동로그인 시 Firebase에서 플레이어 못 찾으면 세션 플래그 제거하도록 보완

### 세션 기반 자동 로그인 전환
- localStorage는 유지하되 `sessionStorage`에 `ggul-session-pid` 플래그 저장
  - **새로고침**: 세션 플래그 있음 → 자동 로그인 → 게임 화면 유지
  - **탭 닫기 / 브라우저 종료**: 세션 플래그 삭제 → 다음 접속 시 인트로 화면부터 시작
- URL `?pid=` 파라미터와 세션 플래그를 통합하여 자동 로그인 처리

### 출석 달력 모달 추가
- 게임 화면 상단 타이틀 우측에 📅 출석 버튼 추가
- 버튼 클릭 시 월별 달력 모달 표시
  - 기본: 이번 달 출석 현황
  - `‹` / `›` 버튼으로 이전/다음 달 이동 (미래 달 비활성)
  - 출석한 날: 핑크 배경 + ✓ 표시
  - 오늘: 핑크 테두리 강조
  - 미래 날짜: 흐리게 표시
  - 요일 헤더 월~일 표시

### 출석 캘린더 버그 수정
- `streak` 기반 연속 출석 표기 → `checkinDates` 기반 실제 접속일 표기로 전환
  - 연속 출석 안 해도 접속한 날만 정확히 표시
- `lastDate === today`이지만 `checkinDates`에 오늘이 없는 경우 보완 (기능 도입 전 접속 유저)

---

## 2026-05-26

### JS 파일 분리
- `index.html` 내 인라인 스크립트 전체를 기능별 별도 JS 파일로 분리
  - `js/state.js`: 전역 상태(`state`), DOM 참조, 공통 유틸(`formatMoney`, `getTodayStr`), 상수
  - `js/firebase-db.js`: Firebase 초기화, DB read/write 함수 (`flushPlayerStateToFs`, `loadPlayerStateFromFs` 등)
  - `js/ranking.js`: 랭킹 캐시 관리, 집계(`aggregateRanking`), 렌더링, 탭 이벤트
  - `js/player.js`: UUID 생성(`generatePlayerId`), 플레이어 상태 저장/복구
  - `js/daily.js`: 데일리 시스템, 목표, 팁, 출석체크 모달, 자정 초기화 타이머
  - `js/game.js`: 콤보 일시정지/재개, 퀴즈 로직, 클릭 처리, 업그레이드
  - `js/ui.js`: 토스트, 화면전환, 이름 검증, 컨페티, 출석 달력 모달
  - `js/app.js`: `doLogin()`, 자동 로그인 IIFE, 시작 버튼, 데이터 초기화 유틸
- `index.html`은 더블탭 방지 인라인 스크립트만 유지, 나머지는 `<script src>` 태그로 교체
- 로드 순서: Firebase SDK → `js/data.js` → `js/state.js` → `js/firebase-db.js` → `js/ranking.js` → `js/player.js` → `js/daily.js` → `js/game.js` → `js/ui.js` → `js/app.js`

### UI 개선
- 📅 출석 달력 버튼 위치 이동
  - 기존: 게임 화면 상단 바 (로고 우측)
  - 변경: 재무점수 섹션과 금융팁 버튼 사이 (재무점수/콤보 바 가운데)

---

## 2026-05-30

### 기능 개선
- 캐시 버스팅 버전 문자열을 `?v=YYYYMMDDHHmmss` 형식으로 변경 (모든 로컬 JS/CSS 파일 적용)
- `js/data.js`를 `js/` 폴더 하위로 이동 및 참조 경로 수정

### 랭킹 시스템 개선
- 게임 화면 "실시간 랭킹" 클릭 시 팝업 모달 표시
  - 인트로 화면과 동일한 일일/주간/월간 탭 제공
  - `openRankingModal()` / `renderRankingModal()` 신설
  - `rankingBoardTitle` 요소를 `<h3>` → `<button>`으로 교체 (iOS Safari 클릭 이벤트 미작동 수정)

### 로그인 플로우 개편
- `?uuid=` URL 파라미터 지원 추가
  - 파라미터 있음 + 기존 플레이어 → 자동 로그인
  - 파라미터 있음 + 신규 → 이름 입력 화면 대기 후 이름 중복 확인(`checkNameTaken`) 후 등록
  - 파라미터 없음 → 기존 이름 기반 로그인 유지
- `checkNameTaken(name, excludeUuid)` 함수 추가: 플레이어이름 1:1 uuid 매핑 강제
- `_pendingUuid` 전역 변수로 UUID 파라미터 흐름 상태 관리
- `sessionStorage` 기반 자동 로그인 제거

### 버그 수정
- 출석 달력에 오늘을 제외한 이전 출석일이 표시되지 않던 문제 수정
  - `initDailySystem()`에서 `saveDailyData(data)` 호출 전 `state.dailyData = data` 먼저 세팅하도록 순서 변경
  - `flushDailyDataToFs()`가 구 데이터를 Firebase에 저장하던 문제 해결

---

## 2026-07-02

### UI 개선
- 게임 화면 상단 로고(`gameScreenLogo`) 및 마지막 접속 표기(`lastLoginDisplay`) 제거
  - 로고를 "⚡ 빠른 업그레이드" 헤더 오른쪽에 flex 배치로 이동
- 빠른 업그레이드 항목 가독성 개선
  - 업그레이드명 폰트 크기: `.76rem` → `.9rem`
  - 비용 폰트 크기: `.78rem` → `.88rem`
  - 횟수 폰트 크기: `.68rem` → `.76rem`
  - 설명 텍스트(`up-desc`) 삭제
  - 횟수 표기에서 "회" 접미사 제거 (예: `3/5회` → `3/5`)
- 게임 화면 상단 레이아웃 재구성
  - 재무점수 박스를 저축금액 박스 왼쪽에 나란히 배치
  - 콤보 표시를 클릭 수익 오른쪽(`.meta` 줄)으로 이동
  - 금융팁 버튼(`tipIconBtn`)을 오늘의 저축 박스 우상단 절대 위치로 이동
  - 출석달력 버튼(`checkinCalBtn`)을 빠른업그레이드 헤더 우측으로 이동 (26px 소형 아이콘)
  - 기존 상단 노란 박스(재무점수/콤보/금융팁 묶음) 제거

---

## 2026-07-07

### 버그 수정
- 브라우저 뒤로가기 후 새 플레이어로 시작 시 이전 플레이어 데이터가 그대로 노출되는 문제 수정
  - **원인 1 (bfcache 미지원)**: 페이지 재실행 시 브라우저가 폼 필드 값을 자동 복원 → 이전 이름으로 이전 데이터 로드
  - **원인 2 (bfcache 작동)**: iOS Safari 등에서 JS 메모리 상태가 그대로 복원 → `state`에 이전 플레이어 데이터 잔존
  - `pageshow` 이벤트의 `persisted` 플래그로 bfcache 복원 감지 → `state` 초기화 후 인트로 화면으로 강제 전환
  - `switchScreen('#introScreen')` 호출 시 이름 입력창 값 초기화 및 에러 메시지 제거

---

## 2026-07-08

### 랭킹 시스템 개선
- 랭킹 종합점수 공식 도입: `저축금액 × (1 + 재무점수 / 1000)`
  - 재무점수가 높을수록 저축금액 증폭 효과 적용
  - 기존 재무점수 단독 정렬 → 복합점수 기준 정렬로 변경
  - `calcRankScore(item)` 함수 추가 (`js/ranking.js`)
- 랭킹 화면 종합점수 산정 방식 ? 툴팁 버튼 추가
  - 게임 화면 랭킹 보드 및 랭킹 팝업 모달 각 1개
  - 클릭 시 툴팁 토글, 외부 클릭 시 자동 닫힘

### 랭킹 이름 마스킹
- 본인 이름: 풀네임 표시
- 타인 이름: 첫·끝 글자만 표시, 중간은 `*`로 마스킹
  - 1자: `*`, 2자: `첫*`, 3자 이상: `첫***끝`

### 퀴즈 데이터 개편
- `v10-full.json` → `js/quizData.js`로 파일 이동 및 이름 변경
- `index.html` 스크립트 참조 경로 수정
- 퀴즈 30문항 정답 위치 재분배 (기존 전부 0번 → 0/1/2 골고루 분산)

### 로그인 플로우 개선
- Case 2 (uuid 없음): 이름 입력 시 DB에서 동일 이름 플레이어 조회
  - 기존 플레이어 존재 → 해당 플레이어 데이터로 게임 진입
  - 신규 플레이어 → 새 UUID 생성 후 등록
- `findOrCreatePlayer(name)` 함수 추가 (`js/firebase-db.js`)

### 이름 입력 검증 강화
- 최소 3자 / 최대 12자 제한 적용 (한글·영문·이모지 모두 실제 글자 수 기준)
- `[...name].length`로 유니코드 문자 정확한 길이 계산

### 빠른 업그레이드 UI 재구성
- 레이아웃: `3×2` 그리드 (기존 세로 목록 → 한눈에 보이는 격자형)
- 각 버튼 표시 정보: 아이콘 + 구매 현황 배지(1/5) + 가격만 표시
  - 업그레이드명·설명·게이지바 제거
- 구매 시 업그레이드명·결과 내용은 토스트 메시지로 표시
- 위험 업그레이드 항목: 주황 점(`.risk-dot`) 배지 표시
- 아이콘·글자 크기를 격자 크기에 맞게 확대

### 코치마크 시스템 추가
- 첫 접속 플레이어에게 게임 화면 기능 안내 (7단계)
  1. 환영 메시지
  2. 재무점수 & 오늘의 저축 (`scoreBox` 하이라이트)
  3. 돼지저금통 탭 안내 (`earnBtn`)
  4. 클릭 현황 (`clickLimitWrap`)
  5. 빠른 업그레이드 (`quickUpgradeList`)
  6. 오늘의 금융 팁 (`tipIconBtn`)
  7. 실시간 랭킹 (`rankingBoardTitle`)
- 대상 요소 하이라이트 + 말풍선(위/아래 자동 배치) + 화살표
- `localStorage` 키 `ggul-coach-done`으로 최초 1회만 표시
- 코치마크 재시작 버튼(`coachRestartBtn`, ?▶) 출석달력 버튼 옆에 추가
- 코치마크 활성 중 출석체크 모달 표시 보류 → 코치마크 종료 후 자동 표시 (`_pendingCheckinModal` 패턴)

### 애니메이션 개선
- 돼지저금통 클릭 시 입으로 코인 들어가는 애니메이션(`coin-entry`) 제거
- 돼지저금통 구멍에 코인 들어가는 애니메이션(`coinPop`) 유지

### 데일리 목표 난이도 상향
- 탭 횟수: 10/30/50 → 50/100/150
- 저축금액: 5k/10k/20k → 30k/80k/150k
- 재무점수: 30/60 → 100/200
- 퀴즈 정답 목표 항목 추가

### 꿀꿀 브랜딩 적용
- 게임 전반 안내 문구에 "꿀꿀" 표현 통일 적용
- 코치마크 문구: "알려주겠다꿀! 🐷" 스타일로 통일
- 토스트 메시지 줄바꿈(`\n`) 지원 (`innerHTML` + `<br>` 변환 방식)
- 빠른 업그레이드 토스트: 꿀꿀 문구 뒤 줄바꿈 후 내용 표시

---

## 2026-07-08 (추가)

### 버그 수정
- 인트로 화면이 스크롤된 상태에서 게임 화면 진입 시 스크롤 위치가 유지되어 코치마크 위치가 어긋나는 문제 수정
  - `switchScreen()` 에서 화면 전환 시 항상 최상단으로 스크롤 초기화
  - iOS Safari 대응: `document.documentElement.scrollTop`, `document.body.scrollTop`, `window.scrollTo({behavior:'instant'})` 병행 적용
  - `requestAnimationFrame` 내부에서 실행하여 `display` 전환 완료 후 스크롤 처리

### 랭킹 집계 방식 변경
- 주간·월간 랭킹 집계 방식: **합산** → **일별 최고점수** 기준으로 변경
  - 기존: 해당 기간 내 플레이어의 score·money를 날마다 더해 합산 집계
  - 변경: 해당 기간 내 플레이어의 일별 기록 중 종합점수(`calcRankScore`)가 가장 높은 날 하나를 채택
  - `aggregateRanking()` 함수 로직 수정 (`js/ranking.js`)

### 연속 출석 보너스 시스템 추가
- 연속 출석일 수에 따라 게임 시작 시 클릭 수익과 저축금액 보너스 지급
  - 1일: 클릭수익 ₩10 (기본) · 시작저축 ₩0
  - 2일: 클릭수익 ₩15 (+₩5) · 시작저축 +₩500
  - 3일: 클릭수익 ₩20 (+₩10) · 시작저축 +₩1,000
  - 4일: 클릭수익 ₩25 (+₩15) · 시작저축 +₩1,500
  - 5일 이상: 클릭수익 ₩30 (+₩20) · 시작저축 +₩2,000 (최대)
- `initDailySystem()` 내 하루 초기화 시 `streak` 기준으로 보너스 자동 적용 (`js/daily.js`)
- 출석 체크인 모달 하단에 현재 적용 중인 연속 보너스 안내 문구 표시
  - 1일차: 다음날 보너스 예고
  - 2~4일차: 현재 적용 중인 보너스 수치 표시
  - 5일 이상: 최대 보너스 달성 안내

---

## 파일별 변경 요약

| 파일 | 주요 변경 내용 |
|---|---|
| `index.html` | JS 인라인 스크립트 제거, `<script src>` 태그로 교체, 출석 버튼 위치 이동 |
| `js/state.js` | 전역 상태, DOM 참조, 공통 유틸 |
| `js/firebase-db.js` | Firebase 초기화 및 DB 함수 |
| `js/ranking.js` | 랭킹 캐시, 집계, 렌더링 |
| `js/player.js` | UUID 생성, 플레이어 상태 저장/복구 |
| `js/daily.js` | 데일리 시스템, 목표, 팁, 출석체크 |
| `js/game.js` | 게임 로직 (콤보, 퀴즈, 클릭, 업그레이드) |
| `js/ui.js` | 공통 UI (토스트, 컨페티, 달력 모달, 코치마크 시스템) |
| `js/app.js` | 앱 진입점, 로그인 플로우, bfcache 초기화 |
| `js/ranking.js` | 복합점수(`calcRankScore`) 정렬, 이름 마스킹, 종합점수 툴팁 |
| `js/game.js` | coin-entry 제거, coinPop 유지, 업그레이드 토스트 줄바꿈 |
| `style.css` | 코치마크 스타일, 빠른업그레이드 3×2 그리드, 토스트 개선, risk-dot |
| `database.rules.json` | ranking 쓰기 규칙 변경 (덮어쓰기 허용) |
| `js/quizData.js` | 금융 퀴즈 데이터 (구 v10-full.json, 정답 위치 재분배) |
| `js/data.js` | 금융 팁 200개+, 데일리 목표 풀 데이터 (난이도 상향) |

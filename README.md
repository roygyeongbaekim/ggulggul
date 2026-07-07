# 🐷 꿀꿀 저축챌린지

> 하루 200번의 클릭으로 저축 습관을 기르는 금융 클릭 게임

![게임 미리보기](pigbank.jpg)

---

## 소개

**꿀꿀 저축챌린지**는 돼지저금통을 클릭해 가상의 저축액을 쌓아가는 브라우저 기반 클릭 게임입니다.
단순한 클릭을 넘어 업그레이드·콤보·퀴즈를 조합해 효율을 높이고, 매일 도전하며 실제 금융 지식을 자연스럽게 익힐 수 있도록 설계했습니다.

---

## 어떻게 플레이하나요?

### 1. 시작하기
- 인트로 화면에서 **플레이어 이름(3~12자)** 을 입력하고 시작하기를 누릅니다.
- 같은 이름으로 접속하면 기존 데이터를 불러옵니다.
- `?uuid=<ID>` 파라미터가 URL에 포함된 경우 해당 플레이어로 자동 로그인됩니다.

### 2. 돼지저금통 클릭
- 화면 중앙의 돼지저금통을 클릭하면 **클릭 수익**만큼 저축액이 증가합니다.
- 하루 **200번** 클릭 제한이 있으며, 매일 자정에 초기화됩니다.
- 클릭 현황은 화면 하단 게이지로 실시간 확인할 수 있습니다.

### 3. 콤보
- 연속으로 빠르게 클릭하면 **콤보 배율(최대 ×3.5)** 이 올라 수익이 증폭됩니다.
- 콤보 배율은 클릭 수익 오른쪽에 실시간 표시됩니다.
- 퀴즈가 등장하거나 애니메이션이 재생되는 동안 콤보 타이머는 자동으로 멈춥니다.

### 4. 빠른 업그레이드
- 저축액을 소비해 **6종 업그레이드** 를 구매하면 클릭 수익이 증가합니다.
- 각 항목은 최대 **5회** 구매 가능하며, 구매할수록 비용이 오릅니다.
- 아이콘 옆 `1/5` 형태로 현황을 확인할 수 있습니다.
- **인덱스 투자**는 50% 확률로 수익이 오르거나 내리는 위험 항목입니다.

### 5. 금융 퀴즈
- 클릭 수가 특정 구간(30~180회)에 도달하면 **금융 퀴즈**가 등장합니다.
- 난이도는 기초 → 일반 → 심화 순서로 진행되며, 정답 시 보너스 저축액이 지급됩니다.
- 퀴즈 정답은 1~3번 중 어느 보기에나 위치할 수 있습니다.

### 6. 랭킹 저장
- 오늘의 저축 완료 후 **랭킹에 저장** 버튼으로 기록을 등록할 수 있습니다.
- 랭킹은 **종합점수** 기준으로 정렬됩니다.
  > 종합점수 = 저축금액 × (1 + 재무점수 ÷ 1000)
- 저축을 많이 해도, 퀴즈·업그레이드로 재무점수를 높여도 순위가 오릅니다.

---

## 주요 기능

### 데일리 시스템
- **연속 출석 보너스** — 매일 접속 시 연속 일수에 따라 최대 ₩30,000 보너스
- **출석 달력** — 실제 접속한 날짜를 기록하며 월별 달력으로 확인 가능 (📅 버튼)
- **오늘의 목표** — 매일 3개 랜덤 목표 제공, 달성 시 보너스 지급
- **오늘의 금융 팁** — 200개 이상의 팁 중 하루 1개 제공, 읽기 완료 시 보너스

### 랭킹
- **일일 / 주간 / 월간** 탭 제공
  - 주간: 이번 주 월요일 기준 누적 합산
  - 월간: 이번 달 기준 누적 합산
- Top 5 표시 — 메달 아이콘 🥇🥈🥉, 본인 기록 강조
- 타인 이름은 **첫·끝 글자만 표시** 마스킹 처리 (예: `홍*동`)
- 랭킹 화면의 **?** 아이콘으로 종합점수 산정 방식 확인 가능
- 게임 화면 "실시간 랭킹" 클릭 시 팝업 모달로 전체 랭킹 확인

### 플레이어 계정
- 이름(3~12자, 한글·영문·특수문자 무관)으로 개별 데이터 분리
- **UUID v4 기반 32자리 플레이어 ID** 자동 생성 (하이픈 없음)
- `?uuid=` 파라미터로 자동 로그인 지원
- 브라우저 뒤로가기 시 인트로 화면으로 자동 복귀, 이전 플레이어 데이터 초기화

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | HTML5 / CSS3 / Vanilla JS (ES2020+) |
| 백엔드 | Firebase Realtime Database (compat SDK v10.7.1) |
| 저장소 | Firebase RTDB + localStorage (캐시) |
| 폰트 | Google Fonts (Black Han Sans) |
| 외부 의존성 | Firebase SDK (CDN) |

---

## 파일 구조

```
finance-clicker-source/
├── index.html              # 마크업 + 스크립트 로드
├── style.css               # 전체 스타일시트
├── database.rules.json     # Firebase Realtime Database 보안 규칙
├── pigbank.jpg             # 인트로 돼지저금통 이미지
├── js/
│   ├── data.js             # 금융 팁 200개+, 데일리 목표 풀 데이터
│   ├── quizData.js         # 금융 퀴즈 문제 (기초/일반/심화 각 10문항)
│   ├── state.js            # 전역 상태, DOM 참조, 공통 유틸
│   ├── firebase-db.js      # Firebase 초기화, DB read/write
│   ├── ranking.js          # 랭킹 캐시, 집계, 렌더링
│   ├── player.js           # UUID 생성, 플레이어 상태 저장/복구
│   ├── daily.js            # 데일리 시스템, 목표, 팁, 출석체크
│   ├── game.js             # 게임 로직 (콤보, 퀴즈, 클릭, 업그레이드)
│   ├── ui.js               # 공통 UI (토스트, 컨페티, 달력 모달)
│   └── app.js              # 앱 진입점, 로그인, 초기화
├── CHANGELOG.md            # 개발 변경 이력
└── README.md
```

---

## Firebase 데이터 구조

```
ggulggul (Realtime Database)
├── players/
│   └── {safeKey(playerId)}/
│       ├── name, playerId, createdAt, lastLoginAt
├── playerState/
│   └── {safeKey(playerId)}/
│       ├── money, clickIncome, tapCount, score, bestCombo
│       ├── currentRound, completedRounds, usedQuizIndices
│       └── upgrades[]
├── dailyData/
│   └── {safeKey(playerId)}_{YYYY-MM-DD}/
│       ├── streak, lastDate, checkinDates[], dailyClicks
│       ├── goals[], tipClaimed, rankingSaved
└── ranking/
    └── {safeKey(playerId)}_{YYYY-MM-DD}/
        ├── playerId, name, score, money, date, savedAt
```

---

## localStorage 키 구조

| 키 | 내용 |
|---|---|
| `ggul-saving-ranking-v1` | 랭킹 캐시 |
| `ggul-pstate-{이름}` | 플레이어 게임 상태 |
| `ggul-daily-v2-{이름}` | 플레이어 일일 데이터 |

---

## 실행 방법

별도 빌드 과정 없이 HTTP 서버를 통해 실행합니다.

```bash
npx serve .
# 또는
python3 -m http.server 8080
```

> `quizData.js`는 `fetch()`로 로드하므로 `file://` 직접 열기는 동작하지 않습니다.

---

## 개발용 초기화

브라우저 콘솔에서 실행:

```js
clearAllGameData()           // 전체 삭제
clearAllGameData('ranking')  // 랭킹만
clearAllGameData('player')   // 플레이어 상태만
clearAllGameData('daily')    // 일일 데이터만
```

---

## 라이선스

MIT

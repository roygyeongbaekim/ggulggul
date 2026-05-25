# 🐷 꿀꿀 저축챌린지

> 하루 200번의 클릭으로 저축 습관을 기르는 금융 클릭 게임

![게임 미리보기](pigbank.jpg)

---

## 소개

**꿀꿀 저축챌린지**는 돼지저금통을 클릭해 가상의 저축액을 쌓아가는 브라우저 기반 클릭 게임입니다.
단순한 클릭 게임을 넘어, 실제 금융 지식을 자연스럽게 습득할 수 있도록 금융 퀴즈와 오늘의 금융 팁 기능을 담았습니다.

---

## 주요 기능

### 게임 핵심
- 하루 **200번** 클릭 제한 — 매일 자정 초기화
- **콤보 시스템** — 연속 클릭 시 최대 ×3.5 수익 배율
  - 퀴즈 등장·애니메이션 재생 중 콤보 타이머 자동 일시정지
- **업그레이드** — 6종 항목으로 클릭 수익 강화 (항목별 최대 5회)
  - 인덱스 투자는 ±₩450 랜덤 수익의 **위험 투자** 항목

### 데일리 시스템
- **연속 출석 보너스** — 연속 일수에 따라 최대 ₩30,000
- **출석 달력** — 실제 접속한 날짜 기록, 월별 달력으로 확인 가능
- **오늘의 목표** — 매일 3개 랜덤 목표 (달성 시 보너스)
- **오늘의 금융 팁** — 200개 이상의 금융 팁 중 하루 1개 제공 (읽기 완료 보너스)
- **금융 퀴즈** — 클릭 수 30~180 구간 랜덤 출몰, 3단계 난이도 (기초/일반/심화)

### 플레이어 / 계정
- 플레이어 이름으로 **개별 데이터 분리** 저장
- **UUID v4 기반 32자리 플레이어 ID** 자동 생성 (하이픈 없음, Firebase 안전 문자만 사용)
- **URL 파라미터 자동 로그인** — `?pid=<playerId>` 접속 시 인트로 스킵
- **세션 기반 자동 로그인** — 새로고침 시 게임 화면 유지, 탭 닫기 시 인트로로 복귀
- 마지막 접속 일시 표시 (`YYYY.MM.DD HH:MM:SS`)

### 랭킹
- **일일 / 주간 / 월간** 탭 랭킹 (주간: 이번 주 월요일 기준, 월간: 이번 달 기준)
- 랭킹 Top 5 표시 — 내 기록 강조, 메달 아이콘 🥇🥈🥉
- 200번 클릭 완료 전: 랭킹 저장 횟수 제한 없음 (덮어쓰기)
- 200번 완료 후 저장 시: 버튼 비활성화 + "✅ 저장됨" 표시
- 주간·월간 탭: 이름 옆 점수 달성 날짜 표기 `(YYYY.MM.DD)`

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | HTML5 / CSS3 / Vanilla JS (ES2020+) |
| 백엔드 | Firebase Realtime Database (compat SDK v10.7.1) |
| 저장소 | Firebase RTDB + localStorage (캐시) + sessionStorage (세션 플래그) |
| 폰트 | Google Fonts (Black Han Sans) |
| 외부 의존성 | Firebase SDK (CDN) |

---

## 파일 구조

```
finance-clicker-source/
├── index.html              # 마크업 + 스크립트 로드
├── style.css               # 전체 스타일시트
├── v10-full.json           # 금융 퀴즈 문제 (기초/일반/심화 각 10문항)
├── database.rules.json     # Firebase Realtime Database 보안 규칙
├── pigbank.jpg             # 인트로 돼지저금통 이미지
├── js/
│   ├── data.js             # 금융 팁 200개+, 데일리 목표 풀 데이터
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
├── ranking/
│   └── {safeKey(playerId)}_{YYYY-MM-DD}/
│       ├── playerId, name, score, money, date, savedAt
```

---

## localStorage / sessionStorage 키 구조

| 키 | 저장소 | 내용 |
|---|---|---|
| `ggul-saving-ranking-v1` | localStorage | 랭킹 캐시 |
| `ggul-pstate-{이름}` | localStorage | 플레이어 게임 상태 |
| `ggul-daily-v2-{이름}` | localStorage | 플레이어 일일 데이터 |
| `ggul-session-pid` | sessionStorage | 자동 로그인 세션 플래그 |

---

## 실행 방법

별도 빌드 과정 없이 HTTP 서버를 통해 실행합니다.

```bash
git clone https://github.com/roygyeongbaekim/ggulggul.git
cd ggulggul
npx serve .
# 또는
python3 -m http.server 8080
```

> `v10-full.json`은 `fetch()`로 로드하므로 `file://` 직접 열기는 동작하지 않습니다.

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

# ggulguul
# 🐷 꿀꿀 저축챌린지

> 하루 200번의 클릭으로 저축 습관을 기르는 금융 클릭 게임

![게임 미리보기](pigbank-clean22.jpg)

---

## 소개

**꿀꿀 저축챌린지**는 돼지저금통을 클릭해 가상의 저축액을 쌓아가는 브라우저 기반 클릭 게임입니다.
단순한 클릭 게임을 넘어, 실제 금융 지식을 자연스럽게 습득할 수 있도록 금융 퀴즈와 오늘의 금융 팁 기능을 담았습니다.

---

## 주요 기능

### 게임 핵심
- 하루 **200번** 클릭 제한 — 매일 자정 초기화
- **콤보 시스템** — 연속 클릭 시 최대 ×3.5 수익 배율
- **업그레이드** — 6종 항목으로 클릭 수익 강화 (항목별 최대 5회)
  - 인덱스 투자는 ±₩450 랜덤 수익의 **위험 투자** 항목

### 데일리 시스템
- **연속 출석 보너스** — 연속 일수에 따라 최대 ₩30,000
- **오늘의 목표** — 매일 3개 랜덤 목표 (달성 시 보너스)
- **오늘의 금융 팁** — 200개 이상의 금융 팁 중 하루 1개 제공 (읽기 완료 보너스)
- **금융 퀴즈** — 클릭 수 30~180 구간 랜덤 출몰, 3단계 난이도 (기초/일반/심화)

### 멀티 플레이어
- 플레이어 이름으로 **개별 데이터 분리** 저장
- 32자리 고유 플레이어 ID 자동 생성 (향후 DB 연동 대비)
- **실시간 랭킹** Top 5 (내 기록 강조 표시)
- 하루 1회 랭킹 저장 제한

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | HTML5 / CSS3 / Vanilla JS |
| 저장소 | localStorage |
| 폰트 | Google Fonts (Black Han Sans) |
| 외부 의존성 | 없음 (CDN 폰트 제외) |

---

## 파일 구조

```
finance-clicker-source/
├── index.html          # 메인 게임 파일
├── style.css           # 스타일시트
├── data.js             # 금융 팁 / 목표 풀 데이터
├── v10-full.json       # 금융 퀴즈 문제 (난이도별 12문항)
└── pigbank-clean333.jpg # 인트로 돼지저금통 이미지
```

---

## 실행 방법

별도 빌드 과정 없이 `index.html`을 브라우저에서 바로 열면 됩니다.

```bash
git clone https://github.com/roygyeongbaekim/ggulguul.git
cd ggulguul
open index.html   # macOS
# 또는 브라우저에서 index.html 파일 직접 열기
```

> 퀴즈 데이터(`v10-full.json`)는 fetch로 로드하므로 로컬 실행 시 간단한 HTTP 서버가 필요합니다.
>
> ```bash
> npx serve .
> # 또는
> python3 -m http.server 8080
> ```

---

## localStorage 키 구조

| 키 | 내용 |
|---|---|
| `ggul-saving-ranking-v1` | 전체 랭킹 (공용) |
| `ggul-pstate-{이름}` | 플레이어 게임 상태 |
| `ggul-daily-v2-{이름}` | 플레이어 일일 데이터 |

### 개발용 초기화

브라우저 콘솔에서 실행:

```js
clearAllGameData()          // 전체 삭제
clearAllGameData('ranking') // 랭킹만
clearAllGameData('player')  // 플레이어 상태만
clearAllGameData('daily')   // 일일 데이터만
```

---

## 향후 계획

- [ ] 백엔드 연동 (플레이어 ID 기반 DB 저장)
- [ ] 글로벌 랭킹
- [ ] 추가 업그레이드 항목
- [ ] 모바일 앱 패키징

---

## 라이선스

MIT

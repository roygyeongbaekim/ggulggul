// ===== 전역 상태 / 상수 / DOM 참조 / 공통 유틸 =====

const state = {
  money:0, clickIncome:10, tapCount:0, upgradeCount:0, score:0,
  combo:0, comboMult:1, comboTimer:null, bestCombo:0,
  quizData:null, currentRound:'easy', roundTriggered:false,
  completedRounds:{ easy:false, normal:false, hard:false },
  playerName:'플레이어', dailyData:null,
  upgrades:[
    { id:'coffee',  icon:'☕', name:'커피 대신 저축',   desc:'클릭 수익 +₩8',            cost:80,   type:'click',  value:8,   bought:0 },
    { id:'ledger',  icon:'📒', name:'가계부 작성 습관', desc:'클릭 수익 +₩18',           cost:200,  type:'click',  value:18,  bought:0 },
    { id:'study',   icon:'📚', name:'재테크 공부',      desc:'클릭 수익 +₩40',           cost:480,  type:'click',  value:40,  bought:0 },
    { id:'deposit', icon:'🏦', name:'정기예금 개설',    desc:'클릭 수익 +₩90',           cost:1100, type:'click',  value:90,  bought:0 },
    { id:'sidejob', icon:'💼', name:'부업 시작',        desc:'클릭 수익 +₩200',          cost:2800, type:'click',  value:200, bought:0 },
    { id:'fund',    icon:'📈', name:'인덱스 투자',      desc:'수익 ±₩450 (50% 확률)',    cost:7000, type:'risky',  value:450, bought:0 }
  ]
};

const roundLevels = { easy:{next:'normal'}, normal:{next:'hard'}, hard:{next:null} };
const roundRanges  = { easy:{min:30,max:60}, normal:{min:80,max:120}, hard:{min:150,max:180} };

function initRoundThresholds(){
  const r = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  state.roundThresholds = { easy:r(30,60), normal:r(80,120), hard:r(150,180) };
}

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const moneyEl        = $('#money');
const clickIncomeEl  = $('#clickIncome');
const comboDisplayEl = $('#comboDisplay');
const scoreEl        = $('#score');
const quickUpgradeList = $('#quickUpgradeList');
const toast          = $('#toast');
const earnBtn        = $('#earnBtn');
const piggyMouth     = $('#piggyMouth');
const coinPop        = $('#coinPop');
const pigTail        = $('#pigTail');
const rankingPreview = $('#rankingPreview');
const rankingBoard   = $('#rankingBoard');
const playerNameInput = $('#playerNameInput');

const formatMoney = v => `₩${Math.floor(v).toLocaleString('ko-KR')}`;

function getTodayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

const UPGRADE_MAX_COUNT = 5;
const DAILY_CLICK_LIMIT = 200;

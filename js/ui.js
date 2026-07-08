// ===== 공통 UI =====

const showToast=m=>{toast.innerHTML=m.replace(/\n/g,'<br>');toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1600)};
const switchScreen=id=>{ $$('.screen').forEach(el=>{ el.classList.remove('active','fade-in-screen'); el.style.display='none'; }); const target=$(id); target.style.display=''; target.classList.add('active'); requestAnimationFrame(()=>{ document.documentElement.scrollTop=0; document.body.scrollTop=0; window.scrollTo({top:0,left:0,behavior:'instant'}); target.classList.add('fade-in-screen'); }); if(id==='#introScreen'){ if(playerNameInput) playerNameInput.value=''; clearNameError(); } };

const BAD_WORDS = ['씨발','씨팔','시발','시팔','ㅅㅂ','개새끼','개세끼','개쉐끼','병신','빙신','ㅂㅅ','지랄','지럴','창녀','창년','보지','자지','좆','졷','존나','졌나','ㅈㄴ','씹','씹새','새끼','세끼','쉐끼','쌍년','쌍놈','느개비','느그','미친놈','미친년','미친새끼','등신','돌아이','ㄷㅇ','걸레','갈보','육시랄','육시럴','뒤져','뒤져라','뒤지겠','꺼져','닥쳐','fuck','shit','bitch','asshole','bastard','dick','pussy','cunt','nigger','faggot'];

function showNameError(msg){ const el=$('#nameError'); if(!el) return; el.textContent=msg; el.style.display='block'; playerNameInput.style.borderColor='#e53e3e'; playerNameInput.style.boxShadow='0 0 0 2px rgba(229,62,62,.25)'; }
function clearNameError(){ const el=$('#nameError'); if(el) el.style.display='none'; playerNameInput.style.borderColor=''; playerNameInput.style.boxShadow=''; }

function validatePlayerName(name){
  if(!name) return { ok:false, msg:'꿀꿀~ 이름을 입력해주세요 🐷' };
  const lower = name.toLowerCase().replace(/\s/g,'');
  for(const w of BAD_WORDS){ if(lower.includes(w)) return { ok:false, msg:'꿀꿀... 사용할 수 없는 단어가 포함되어 있어요 ⚠️' }; }
  if(/[<>"'`;&|\\\/]/.test(name)) return { ok:false, msg:'꿀꿀... 사용할 수 없는 특수문자가 포함되어 있어요' };
  const len = [...name].length;
  if(len < 3) return { ok:false, msg:'꿀꿀~ 이름은 최소 3자 이상 입력해주세요 🐷' };
  if(len > 12) return { ok:false, msg:'꿀꿀~ 이름은 최대 12자까지 입력할 수 있어요 🐷' };
  return { ok:true };
}

playerNameInput.oninput = () => clearNameError();

$('#introScreen').addEventListener('touchstart', e => { if(e.target !== playerNameInput) playerNameInput.blur(); }, { passive: true });
$('#introScreen').addEventListener('mousedown', e => { if(e.target !== playerNameInput) playerNameInput.blur(); });

function fmtDatetime(ts){
  if(!ts) return '';
  const d = new Date(typeof ts === 'number' ? ts : ts);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function updateLastLoginDisplay(ts){
  const el = document.getElementById('lastLoginDisplay');
  if(!el) return;
  el.textContent = ts ? '마지막 접속: ' + fmtDatetime(ts) : '';
}

function launchConfetti(){
  const ov=document.getElementById('confettiOverlay');
  if(!ov) return;
  ov.style.display='block'; ov.innerHTML='';
  const colors=['#ff9dbf','#ffd76b','#ff6b6b','#6fcf8a','#74b9ff','#fd79a8','#a29bfe','#ffeaa7','#55efc4'];
  for(let i=0;i<80;i++){
    const el=document.createElement('div');
    const size=5+Math.random()*11;
    const round=Math.random()>.45?'50%':'3px';
    el.style.cssText='position:absolute;width:'+size+'px;height:'+size+'px;background:'+colors[Math.floor(Math.random()*colors.length)]+';border-radius:'+round+';left:'+Math.random()*100+'%;top:-30px;animation:confettiFall '+(1.6+Math.random()*2.4)+'s ease-in '+(Math.random()*2)+'s forwards';
    ov.appendChild(el);
  }
  setTimeout(()=>{ ov.style.display='none'; ov.innerHTML=''; },5500);
}

// ===== 출석 달력 모달 =====
let _calViewYear = 0, _calViewMonth = 0;
const DAY_LABELS = ['월','화','수','목','금','토','일'];

function renderCheckinCalendar(){
  const checkinSet = new Set(state.dailyData?.checkinDates || []);
  const today = getTodayStr();
  const y = _calViewYear, m = _calViewMonth;
  const title = document.getElementById('checkinCalTitle');
  const grid = document.getElementById('checkinCalGrid');
  const nextBtn = document.getElementById('checkinCalNext');
  if(!grid) return;

  const now = new Date();
  title.textContent = `${y}년 ${m+1}월`;
  nextBtn.disabled = (y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth()));
  nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '';

  grid.innerHTML = '';
  DAY_LABELS.forEach(d => {
    const el = document.createElement('div');
    el.style.cssText = 'font-size:.7rem;font-weight:700;color:var(--muted);padding:4px 0';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(y, m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(y, m+1, 0).getDate();

  for(let i = 0; i < offset; i++){
    grid.appendChild(document.createElement('div'));
  }

  for(let d = 1; d <= daysInMonth; d++){
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const checked = checkinSet.has(dateStr);
    const isFuture = dateStr > today;
    const el = document.createElement('div');
    el.style.cssText = `
      aspect-ratio:1/1;border-radius:8px;display:grid;place-items:center;
      font-size:.8rem;font-weight:${isToday?'900':'700'};
      background:${checked?'#eb789b':isFuture?'transparent':'var(--surface2)'};
      color:${checked?'#fff':isFuture?'rgba(0,0,0,.18)':'var(--muted)'};
      border:${isToday?'2px solid #eb789b':'1px solid '+(isFuture?'transparent':'var(--border)')};
      position:relative;
    `;
    el.textContent = d;
    if(checked){
      const ck = document.createElement('span');
      ck.style.cssText = 'position:absolute;top:1px;right:2px;font-size:.55rem;line-height:1';
      ck.textContent = '✓';
      el.appendChild(ck);
    }
    grid.appendChild(el);
  }
}

// ===== 코치마크 =====
const COACH_DONE_KEY = 'ggul-coach-done';

const _coachSteps = [
  {
    targetId: null,
    title: '꿀꿀~ 저축챌린지에 오신걸 환영해요! 🐷',
    desc: '게임 화면을 알려주겠다꿀! 🐷\n(5초면 충분해요!)',
  },
  {
    targetId: 'scoreBox',
    targetPad: 8,
    title: '📊 재무 점수 & 💰 오늘의 저축',
    desc: '클릭·업그레이드·퀴즈 정답으로 재무 점수가 올라간다꿀! 🐷\n저축금액과 함께 랭킹 종합점수에 반영돼요.',
  },
  {
    targetId: 'earnBtn',
    targetPad: 8,
    title: '🐷 돼지저금통을 탭하세요!',
    desc: '탭할 때마다 저축액이 늘어난다꿀! 🐷\n빠르게 연속으로 탭하면 콤보 배율(최대 ×3.5)이 올라 수익이 폭발해요 🔥',
  },
  {
    targetId: 'clickLimitWrap',
    targetPad: 10,
    title: '🐾 클릭 현황',
    desc: '하루 200번 클릭할 수 있다꿀! 🐷\n매일 자정에 초기화되니 매일 도전해봐요!',
  },
  {
    targetId: 'quickUpgradeList',
    targetPad: 10,
    title: '⚡ 빠른 업그레이드',
    desc: '저축액으로 업그레이드하면 클릭 수익이 올라간다꿀! 🐷\n각 항목은 최대 5회 구매 가능해요.',
  },
  {
    targetId: 'tipIconBtn',
    targetPad: 8,
    title: '💡 오늘의 금융 팁',
    desc: '매일 새로운 금융 팁을 알려준다꿀! 🐷\n읽기 완료하면 보너스 저축액도 받아요!',
  },
  {
    targetId: 'rankingBoardTitle',
    targetPad: 12,
    title: '🏆 실시간 랭킹',
    desc: '기록을 랭킹에 저장하고 경쟁해본다꿀! 🐷\n재무점수가 높을수록 저축액이 더 크게 증폭돼요!',
  },
];

let _coachIdx = 0;

function _coachPosition(targetId, pad){
  const highlight = document.getElementById('coachHighlight');
  const bubble    = document.getElementById('coachBubble');
  const arrowEl   = document.getElementById('coachArrowEl');

  if(!targetId){
    // 첫 스텝: 타겟 없이 화면 중앙 팝업
    highlight.style.display = 'none';
    arrowEl.className = '';
    arrowEl.style.cssText = 'display:none';
    const bw = Math.min(300, window.innerWidth * 0.86);
    bubble.style.cssText = `left:${(window.innerWidth - bw) / 2}px;top:${(window.innerHeight - 200) / 2}px;width:${bw}px`;
    return;
  }

  const el = document.getElementById(targetId);
  if(!el) return;

  // 대상 영역 스크롤해서 보이게
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  // 약간 딜레이 후 위치 계산 (스크롤 완료 대기)
  setTimeout(() => {
    const r   = el.getBoundingClientRect();
    const p   = pad || 8;
    const ht  = r.top  - p;
    const hl  = r.left - p;
    const hw  = r.width  + p * 2;
    const hh  = r.height + p * 2;

    // 하이라이트 박스
    highlight.style.cssText = `display:block;top:${ht}px;left:${hl}px;width:${hw}px;height:${hh}px`;

    // 말풍선 가로 위치: 타겟 중앙 기준
    const bw      = Math.min(300, window.innerWidth * 0.86);
    const targetCx = hl + hw / 2;
    const bx      = Math.max(12, Math.min(targetCx - bw / 2, window.innerWidth - bw - 12));

    // 위/아래 공간 비교해서 말풍선 방향 결정
    const BUBBLE_H  = 200;
    const GAP       = 16;
    const spaceDown = window.innerHeight - (ht + hh);
    const spaceUp   = ht;
    let by, arrowDir;

    if(spaceDown >= BUBBLE_H + GAP || spaceDown >= spaceUp){
      // 아래 배치: 화살표는 위쪽(↑) → 타겟을 가리킴
      by       = ht + hh + GAP;
      arrowDir = 'up';
    } else {
      // 위 배치: 화살표는 아래쪽(↓) → 타겟을 가리킴
      by       = ht - BUBBLE_H - GAP;
      arrowDir = 'down';
    }
    by = Math.max(8, Math.min(by, window.innerHeight - BUBBLE_H - 8));

    bubble.style.cssText = `left:${bx}px;top:${by}px;width:${bw}px`;

    // 화살표 삼각형: 타겟 중앙에 정렬
    const arrowLeft = Math.max(16, Math.min(targetCx - bx - 12, bw - 40));
    arrowEl.className = `arrow-${arrowDir}`;
    arrowEl.style.cssText = `left:${arrowLeft}px`;
  }, 60);
}

function _coachRender(){
  const step = _coachSteps[_coachIdx];
  document.getElementById('coachStepIndicator').textContent = `${_coachIdx + 1} / ${_coachSteps.length}`;
  document.getElementById('coachTitle').textContent = step.title;
  document.getElementById('coachDesc').textContent = step.desc;
  document.getElementById('coachNextBtn').textContent = _coachIdx === _coachSteps.length - 1 ? '시작하기 🐷' : '다음 →';
  _coachPosition(step.targetId, step.targetPad);
}

function startCoachMark(){
  if(localStorage.getItem(COACH_DONE_KEY)) return;
  _coachIdx = 0;
  document.getElementById('coachMark').style.display = 'block';
  _coachRender();
}

function _coachFinish(){
  document.getElementById('coachMark').style.display = 'none';
  localStorage.setItem(COACH_DONE_KEY, '1');
  if(window._pendingCheckinModal){
    const modal = window._pendingCheckinModal;
    window._pendingCheckinModal = null;
    setTimeout(() => { modal.style.display = 'flex'; }, 300);
  }
}

document.getElementById('coachNextBtn').onclick = () => {
  _coachIdx++;
  if(_coachIdx >= _coachSteps.length){ _coachFinish(); return; }
  _coachRender();
};
document.getElementById('coachSkipBtn').onclick = _coachFinish;
document.getElementById('coachRestartBtn').onclick = () => {
  _coachIdx = 0;
  document.getElementById('coachMark').style.display = 'block';
  _coachRender();
};

document.getElementById('checkinCalBtn').onclick = () => {
  const now = new Date();
  _calViewYear = now.getFullYear();
  _calViewMonth = now.getMonth();
  renderCheckinCalendar();
  document.getElementById('checkinCalModal').style.display = 'flex';
};
document.getElementById('checkinCalPrev').onclick = () => {
  if(_calViewMonth === 0){ _calViewMonth = 11; _calViewYear--; }
  else _calViewMonth--;
  renderCheckinCalendar();
};
document.getElementById('checkinCalNext').onclick = () => {
  const now = new Date();
  if(_calViewYear === now.getFullYear() && _calViewMonth >= now.getMonth()) return;
  if(_calViewMonth === 11){ _calViewMonth = 0; _calViewYear++; }
  else _calViewMonth++;
  renderCheckinCalendar();
};
document.getElementById('checkinCalClose').onclick = () => {
  document.getElementById('checkinCalModal').style.display = 'none';
};

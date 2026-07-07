// ===== 공통 UI =====

const showToast=m=>{toast.textContent=m;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1600)};
const switchScreen=id=>{ $$('.screen').forEach(el=>{ el.classList.remove('active','fade-in-screen'); el.style.display='none'; }); const target=$(id); target.style.display=''; target.classList.add('active'); requestAnimationFrame(()=>target.classList.add('fade-in-screen')); if(id==='#introScreen'){ if(playerNameInput) playerNameInput.value=''; clearNameError(); } };

const BAD_WORDS = ['씨발','씨팔','시발','시팔','ㅅㅂ','개새끼','개세끼','개쉐끼','병신','빙신','ㅂㅅ','지랄','지럴','창녀','창년','보지','자지','좆','졷','존나','졌나','ㅈㄴ','씹','씹새','새끼','세끼','쉐끼','쌍년','쌍놈','느개비','느그','미친놈','미친년','미친새끼','등신','돌아이','ㄷㅇ','걸레','갈보','육시랄','육시럴','뒤져','뒤져라','뒤지겠','꺼져','닥쳐','fuck','shit','bitch','asshole','bastard','dick','pussy','cunt','nigger','faggot'];

function showNameError(msg){ const el=$('#nameError'); if(!el) return; el.textContent=msg; el.style.display='block'; playerNameInput.style.borderColor='#e53e3e'; playerNameInput.style.boxShadow='0 0 0 2px rgba(229,62,62,.25)'; }
function clearNameError(){ const el=$('#nameError'); if(el) el.style.display='none'; playerNameInput.style.borderColor=''; playerNameInput.style.boxShadow=''; }

function validatePlayerName(name){
  if(!name) return { ok:false, msg:'이름을 입력해주세요 🐷' };
  const lower = name.toLowerCase().replace(/\s/g,'');
  for(const w of BAD_WORDS){ if(lower.includes(w)) return { ok:false, msg:'사용할 수 없는 단어가 포함되어 있어요 ⚠️' }; }
  if(/[<>"'`;&|\\\/]/.test(name)) return { ok:false, msg:'사용할 수 없는 특수문자가 포함되어 있어요' };
  const len = [...name].length;
  if(len < 3) return { ok:false, msg:'이름은 최소 3자 이상 입력해주세요 🐷' };
  if(len > 12) return { ok:false, msg:'이름은 최대 12자까지 입력할 수 있어요 🐷' };
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

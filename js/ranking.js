// ===== 랭킹 시스템 =====

let _rankingCache = [];
let _rankingCacheByTab = { daily:[], weekly:[], monthly:[] };
let _allRankingItems = [];
let _rankingLoading = true;

function getWeekStart(){ const d=new Date(); const day=d.getDay(); const diff=day===0?6:day-1; d.setDate(d.getDate()-diff); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function getMonthPrefix(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

// 복합 랭킹 점수: 저축금액 × (1 + 재무점수 / 1000)
function calcRankScore(item){ return Math.floor((item.money||0) * (1 + (item.score||0) / 1000)); }

function aggregateRanking(items){
  const map={};
  items.forEach(i=>{
    const key=i.playerId||i.name;
    if(!map[key]){ map[key]={ name:i.name, playerId:i.playerId||'', score:0, money:0, date:'' }; }
    map[key].score += (i.score||0);
    map[key].money += (i.money||0);
    if(i.date && i.date > map[key].date) map[key].date = i.date;
  });
  return Object.values(map).sort((a,b)=>calcRankScore(b)-calcRankScore(a)).slice(0,5);
}

function fmtRankDate(d){ return d ? d.replace(/-/g,'.') : ''; }

function showRankingLoading(){
  if(rankingPreview) rankingPreview.innerHTML='<div class="ranking-loading"><div class="ranking-spinner"></div><div style="font-size:.82rem;color:var(--muted);font-weight:700">랭킹 불러오는 중...</div></div>';
}

function rebuildRankingCache(){
  const today=getTodayStr(); const weekStart=getWeekStart(); const monthPrefix=getMonthPrefix();
  const sortFn=(a,b)=>calcRankScore(b)-calcRankScore(a);
  _rankingCacheByTab.daily=_allRankingItems.filter(i=>i.date===today).sort(sortFn).slice(0,5);
  _rankingCacheByTab.weekly=aggregateRanking(_allRankingItems.filter(i=>i.date&&i.date>=weekStart));
  _rankingCacheByTab.monthly=aggregateRanking(_allRankingItems.filter(i=>i.date&&i.date.startsWith(monthPrefix)));
  _rankingCache=_rankingCacheByTab.daily;
}

async function fetchAndCacheRanking(showLoading=false){
  if(!db){
    let waited=0;
    await new Promise(res=>{ const t=setInterval(()=>{ waited+=200; if(db||waited>=5000){ clearInterval(t); res(); } },200); });
  }
  _rankingLoading=true;
  if(showLoading) showRankingLoading(); else renderRanking();
  if(!db){ _rankingLoading=false; renderRanking(); return; }
  try {
    const snap=await db.ref('ranking').get();
    _allRankingItems=snap.exists()?Object.values(snap.val()||{}).filter(v=>v&&v.date):[];
    console.log('[Ranking] 불러온 항목 수:', _allRankingItems.length, '오늘:', getTodayStr());
    rebuildRankingCache();
    console.log('[Ranking] 캐시 결과:', { daily:_rankingCacheByTab.daily.length, weekly:_rankingCacheByTab.weekly.length, monthly:_rankingCacheByTab.monthly.length });
  } catch(e){ console.warn('[DB] 랭킹 로드 실패:', e); }
  _rankingLoading=false;
  saveRanking(_rankingCache);
  renderRanking();
}

async function saveRankingToFs(entry){
  if(!db||!state.playerId) return;
  try {
    const key=safeKey(state.playerId)+'_'+getTodayStr();
    const fsEntry={ playerId:state.playerId, name:entry.name, score:entry.score, money:entry.money, date:getTodayStr(), savedAt:TS() };
    await db.ref('ranking/'+key).set(fsEntry);
    _allRankingItems=_allRankingItems.filter(i=>!(i.playerId===state.playerId&&i.date===getTodayStr()));
    _allRankingItems.push({ playerId:state.playerId, name:entry.name, score:entry.score, money:entry.money, date:getTodayStr() });
    rebuildRankingCache();
    saveRanking(_rankingCache);
    renderRanking();
  } catch(e){ console.warn('[DB] 랭킹 저장 실패:', e); showToast('꿀꿀... 저장에 실패했어요. 잠시 후 다시 시도해주세요 🐷'); }
}

const rankingKey = 'ggul-saving-ranking-v1';
function loadRanking(){ if(_rankingCache.length) return _rankingCache; try { return JSON.parse(localStorage.getItem(rankingKey) || '[]'); } catch(e){ return []; } }
function saveRanking(list){ localStorage.setItem(rankingKey, JSON.stringify(list)); }
function upsertRanking(){ const entry = { name: (state.playerName || '플레이어').trim() || '플레이어', score: state.score, money: state.money, savedAt: new Date().toISOString() }; saveRankingToFs(entry); showToast('꿀꿀~ 랭킹에 저장했어요! 🐷'); }

let _activeRankTab = 'daily';

function renderRankList(container, list, showMeBadge, showDate){
  if(!container) return;
  container.innerHTML = '';
  if(!list||!list.length){
    if(_rankingLoading){
      container.innerHTML = '<div class="ranking-loading"><div class="ranking-spinner"></div><div style="font-size:.82rem;color:var(--muted);font-weight:700">랭킹 불러오는 중...</div></div>';
    } else {
      container.innerHTML = '<div class="rank-row"><div class="rank-badge medal-n">🐷</div><div><div class="rank-name">꿀꿀~ 아직 기록이 없어요</div><div class="rank-meta">플레이 후 점수를 저장해봐요!</div></div><div class="rank-score">-</div></div>';
    }
    return;
  }
  const me=(state.playerName||'').trim();
  const maskName=name=>{ if(!name) return '?'; const chars=[...name]; if(chars.length===1) return '*'; if(chars.length===2) return chars[0]+'*'; return chars[0]+'*'.repeat(chars.length-2)+chars[chars.length-1]; };
  list.forEach((item,idx)=>{
    const isMe=showMeBadge&&me&&item.name===me;
    const displayName=isMe?item.name:maskName(item.name);
    const row=document.createElement('div');
    row.className='rank-row'+(isMe?' rank-row-me':'');
    const medals=['🥇','🥈','🥉'];
    const badgeClass=idx<3?`medal-${idx+1}`:'medal-n';
    const badgeContent=idx<3?medals[idx]:idx+1;
    const dateTag=(showDate&&item.date)?` <span style="font-size:.72rem;color:var(--muted);font-weight:600">(${fmtRankDate(item.date)})</span>`:'';
    const combined=calcRankScore(item);
    row.innerHTML=`<div class="rank-badge ${badgeClass}">${badgeContent}</div><div style="flex:1;min-width:0"><div class="rank-name">${displayName}${isMe?' <span class="rank-me-badge">나</span>':''}${dateTag}</div><div class="rank-meta">재무 ${item.score.toLocaleString('ko-KR')} · 저축 ${formatMoney(item.money)}</div></div><div style="text-align:right;flex-shrink:0"><div style="font-size:.8rem;font-weight:900;color:#7b2845">${combined.toLocaleString('ko-KR')}</div><div style="font-size:.65rem;color:var(--muted);font-weight:600">종합점수</div></div>`;
    container.appendChild(row);
  });
}

function renderRanking(){
  if(rankingBoard){
    renderRankList(rankingBoard,_rankingCacheByTab.daily,true);
  }
  if(rankingPreview){
    renderRankList(rankingPreview,_rankingCacheByTab[_activeRankTab],false,_activeRankTab!=='daily');
  }
}

$$('#rankingTabBtns .rank-tab').forEach(btn=>{
  btn.onclick=()=>{
    $$('#rankingTabBtns .rank-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    _activeRankTab=btn.dataset.tab;
    renderRanking();
  };
});

// ===== 랭킹 모달 =====
let _modalRankTab = 'daily';

function renderRankingModal(){
  const list = document.getElementById('rankingModalList');
  renderRankList(list, _rankingCacheByTab[_modalRankTab], true, _modalRankTab !== 'daily');
}

function openRankingModal(){
  _modalRankTab = 'daily';
  $$('#rankingModalTabBtns .rank-tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab === 'daily');
  });
  renderRankingModal();
  document.getElementById('rankingModal').style.display = 'flex';
}

document.getElementById('rankingBoardTitle').onclick = openRankingModal;

// 종합점수 산정방식 툴팁 토글
function setupScoreInfoBtn(btnId, tooltipId){
  const btn = document.getElementById(btnId);
  const tip = document.getElementById(tooltipId);
  if(!btn||!tip) return;
  btn.addEventListener('click', e => { e.stopPropagation(); tip.classList.toggle('show'); });
  document.addEventListener('click', () => tip.classList.remove('show'));
}
setupScoreInfoBtn('rankScoreInfoBtn', 'rankScoreTooltip');
setupScoreInfoBtn('rankScoreInfoBtnModal', 'rankScoreTooltipModal');

document.getElementById('rankingModalClose').onclick = () => {
  document.getElementById('rankingModal').style.display = 'none';
};

$$('#rankingModalTabBtns .rank-tab').forEach(btn=>{
  btn.onclick=()=>{
    $$('#rankingModalTabBtns .rank-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    _modalRankTab = btn.dataset.tab;
    renderRankingModal();
  };
});

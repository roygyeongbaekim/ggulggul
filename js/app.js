// ===== 앱 진입점 / 로그인 / 초기화 =====

async function doLogin(playerId, playerName, prevLogin=null){
  state.playerName = playerName;
  const [fsState, fsDailyData] = await Promise.all([loadPlayerStateFromFs(playerId), loadDailyDataFromFs(playerId)]);
  if(fsState) localStorage.setItem(getPlayerStateKey(), JSON.stringify({...fsState, playerId}));
  if(fsDailyData) localStorage.setItem(getDailyKey(), JSON.stringify(fsDailyData));
  restorePlayerState();
  state.playerId = playerId;
  savePlayerState();
  sessionStorage.setItem('ggul-session-pid', playerId);
  if(db) db.ref('players/'+safeKey(playerId)).update({name:playerName, playerId, lastLoginAt: TS()}).catch(()=>{});
  fetchAndCacheRanking();
  initRoundThresholds();
  switchScreen('#gameScreen');
  const logo = $('#gameScreenLogo');
  if(logo) logo.textContent = state.playerName + '의 저축';
  updateLastLoginDisplay(prevLogin);
  renderRanking();
  initDailySystem();
  updateUI();
}

// 세션 플래그 또는 URL 파라미터 ?pid= 로 자동 로그인
(async()=>{
  const params = new URLSearchParams(location.search);
  const pid = params.get('pid') || sessionStorage.getItem('ggul-session-pid');
  if(!pid || pid.length < 32) return;
  try {
    if(!db){
      let waited=0;
      await new Promise(res=>{ const t=setInterval(()=>{ waited+=200; if(db||waited>=5000){ clearInterval(t); res(); } },200); });
    }
    if(!db) return;
    const snap = await db.ref('players/'+safeKey(pid)).get();
    if(!snap.exists()){ sessionStorage.removeItem('ggul-session-pid'); return; }
    const playerData = snap.val();
    const name = playerData.name;
    if(!name){ sessionStorage.removeItem('ggul-session-pid'); return; }
    await doLogin(pid, name, playerData.lastLoginAt||null);
  } catch(e){ console.warn('[AutoLogin] 실패:', e); }
})();

$('#startBtn').onclick=async()=>{
  const name=(playerNameInput?.value||'').trim();
  const result=validatePlayerName(name);
  if(!result.ok){showNameError(result.msg);playerNameInput.focus();return;}
  clearNameError();
  state.playerName = name; // peekPlayerId()가 올바른 키를 참조하도록 먼저 세팅
  const btn=$('#startBtn'); btn.disabled=true; btn.textContent='꿀꿀~ 불러오는 중...';
  try {
    let playerId=peekPlayerId();
    if(!playerId) playerId=await findOrCreatePlayer(name)||generatePlayerId();
    let prevLogin=null;
    if(db){ try{ const ps=await db.ref('players/'+safeKey(playerId)).get(); if(ps.exists()) prevLogin=ps.val().lastLoginAt||null; }catch(e){} }
    await doLogin(playerId, name, prevLogin);
  } catch(e){
    console.warn('[FS] 로그인 처리 실패, localStorage 폴백:', e);
    restorePlayerState();
    if(!state.playerId){state.playerId=generatePlayerId();savePlayerState();}
    initRoundThresholds();
    switchScreen('#gameScreen');
    const logo=$('#gameScreenLogo'); if(logo) logo.textContent=(name||'플레이어')+'의 저축';
    renderRanking(); initDailySystem(); updateUI();
  }
  btn.disabled=false; btn.textContent='시작하기';
};

window.clearAllGameData = function(target){
  const t = target || 'all';
  const keys = Object.keys(localStorage).filter(k => k.startsWith('ggul-'));
  if(t === 'ranking'){
    localStorage.removeItem(rankingKey);
    console.log('[초기화] 랭킹 데이터 삭제');
  } else if(t === 'player'){
    keys.filter(k => k.startsWith('ggul-pstate-')).forEach(k => localStorage.removeItem(k));
    console.log('[초기화] 플레이어 상태 삭제:', keys.filter(k => k.startsWith('ggul-pstate-')));
  } else if(t === 'daily'){
    keys.filter(k => k.startsWith('ggul-daily-')).forEach(k => localStorage.removeItem(k));
    console.log('[초기화] 일일 데이터 삭제:', keys.filter(k => k.startsWith('ggul-daily-')));
  } else {
    keys.forEach(k => localStorage.removeItem(k));
    console.log('[초기화] 전체 게임 데이터 삭제:', keys);
  }
  console.log('[초기화] 완료. 페이지를 새로고침하면 반영됩니다.');
};

loadQuizData().then(()=>{ updateUI(); renderRanking(); });
fetchAndCacheRanking(true);

// ===== 앱 진입점 / 로그인 / 초기화 =====

async function doLogin(playerId, playerName, prevLogin=null){
  state.playerName = playerName;
  const [fsState, fsDailyData] = await Promise.all([loadPlayerStateFromFs(playerId), loadDailyDataFromFs(playerId)]);
  if(fsState) localStorage.setItem(getPlayerStateKey(), JSON.stringify({...fsState, playerId}));
  if(fsDailyData) localStorage.setItem(getDailyKey(), JSON.stringify(fsDailyData));
  restorePlayerState();
  state.playerId = playerId;
  savePlayerState();
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

// ?uuid= 파라미터로 자동 로그인 또는 신규 이름 등록 대기
let _pendingUuid = null;

(async()=>{
  const params = new URLSearchParams(location.search);
  const uuid = params.get('uuid');
  if(!uuid || uuid.length < 32) return;

  try {
    if(!db){
      let waited=0;
      await new Promise(res=>{ const t=setInterval(()=>{ waited+=200; if(db||waited>=5000){ clearInterval(t); res(); } },200); });
    }
    if(!db) return;

    const snap = await db.ref('players/'+safeKey(uuid)).get();
    if(snap.exists()){
      const playerData = snap.val();
      const name = playerData.name;
      if(name){
        // 기존 플레이어 → 바로 게임 진입
        await doLogin(uuid, name, playerData.lastLoginAt||null);
        return;
      }
    }
    // 신규 uuid → 이름 입력 대기
    _pendingUuid = uuid;
    if(playerNameInput) playerNameInput.focus();
  } catch(e){ console.warn('[UUID Login] 실패:', e); }
})();

$('#startBtn').onclick=async()=>{
  const name=(playerNameInput?.value||'').trim();
  const result=validatePlayerName(name);
  if(!result.ok){showNameError(result.msg);playerNameInput.focus();return;}
  clearNameError();

  const btn=$('#startBtn'); btn.disabled=true; btn.textContent='꿀꿀~ 불러오는 중...';

  try {
    if(_pendingUuid){
      // UUID 파라미터 있고 신규 플레이어 → 이름 중복 확인 후 등록
      const taken = await checkNameTaken(name, _pendingUuid);
      if(taken){
        showNameError('이미 사용 중인 이름이에요. 다른 이름을 입력해주세요 🐷');
        playerNameInput.focus();
        btn.disabled=false; btn.textContent='시작하기';
        return;
      }
      state.playerName = name;
      await db.ref('players/'+safeKey(_pendingUuid)).set({ name, playerId:_pendingUuid, createdAt:TS() });
      await doLogin(_pendingUuid, name, null);
    } else {
      // UUID 파라미터 없음 → 이름 기반 로그인 (기존 방식)
      state.playerName = name; // peekPlayerId()가 올바른 키를 참조하도록 먼저 세팅
      let playerId=peekPlayerId();
      if(!playerId) playerId=await findOrCreatePlayer(name)||generatePlayerId();
      let prevLogin=null;
      if(db){ try{ const ps=await db.ref('players/'+safeKey(playerId)).get(); if(ps.exists()) prevLogin=ps.val().lastLoginAt||null; }catch(e){} }
      await doLogin(playerId, name, prevLogin);
    }
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

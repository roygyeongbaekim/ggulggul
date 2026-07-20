// ===== 앱 진입점 / 로그인 / 초기화 =====

async function doLogin(playerId, playerName, prevLogin=null, isNewPlayer=false){
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
  // DB 기준 첫 접속 플레이어에게만 코치마크 표시
  if(isNewPlayer) requestAnimationFrame(() => requestAnimationFrame(() => startCoachMark()));
}

// ===== Case 1: ?uuid= 파라미터가 있을 때 =====
// - DB에 등록된 uuid → 해당 플레이어 정보로 게임화면 바로 진입
// - DB에 없는 uuid → 인트로 화면 유지, 이름 입력 대기
let _pendingUuid = null;

(async()=>{
  const params = new URLSearchParams(location.search);
  const uuid = params.get('uuid');
  if(!uuid || uuid.length < 32) return; // Case 2: uuid 없으면 인트로 화면 그대로

  try {
    if(!db){
      let waited=0;
      await new Promise(res=>{ const t=setInterval(()=>{ waited+=200; if(db||waited>=5000){ clearInterval(t); res(); } },200); });
    }
    if(!db) return;

    const snap = await db.ref('players/'+safeKey(uuid)).get();
    if(snap.exists() && snap.val().name){
      // DB에 등록된 uuid → 바로 게임 진입 (기존 플레이어)
      const playerData = snap.val();
      await doLogin(uuid, playerData.name, playerData.lastLoginAt||null, false);
      return;
    }
    // DB에 없는 uuid → 인트로 화면에서 이름 입력 대기
    _pendingUuid = uuid;
    if(playerNameInput) playerNameInput.focus();
  } catch(e){ console.warn('[UUID Login] 실패:', e); }
})();

// ===== 시작하기 버튼 =====
$('#startBtn').addEventListener('touchstart', () => { if(playerNameInput) playerNameInput.blur(); }, { passive: true });
$('#startBtn').onclick = async () => {
  const name = (playerNameInput?.value||'').trim();
  const result = validatePlayerName(name);
  if(!result.ok){ showNameError(result.msg); playerNameInput.blur(); return; }
  clearNameError();

  const btn = $('#startBtn'); btn.disabled=true; btn.textContent='꿀꿀~ 불러오는 중...';

  try {
    if(_pendingUuid){
      // Case 1 - 신규 uuid: 이름 중복 확인 후 등록
      const taken = await checkNameTaken(name, _pendingUuid);
      if(taken){
        showNameError('꿀꿀~ 이미 등록된 닉네임이에요. 다른 이름을 입력해주세요 🐷');
        playerNameInput.blur();
        btn.disabled=false; btn.textContent='시작하기';
        return;
      }
      await db.ref('players/'+safeKey(_pendingUuid)).set({ name, playerId:_pendingUuid, createdAt:TS() });
      await doLogin(_pendingUuid, name, null, true); // 신규 uuid 등록 → 첫 접속
    } else {
      // Case 2 - uuid 없음: 이름으로 기존 플레이어 조회 → 있으면 해당 정보로 진입, 없으면 신규 등록
      const existingId = await findOrCreatePlayer(name);
      let prevLogin = null;
      if(db && existingId){
        try { const ps = await db.ref('players/'+safeKey(existingId)).get(); if(ps.exists()) prevLogin = ps.val().lastLoginAt||null; } catch(e){}
      }
      const isNew = !prevLogin; // lastLoginAt 없음 = DB 기준 첫 접속
      await doLogin(existingId || generatePlayerId(), name, prevLogin, isNew);
    }
  } catch(e){
    console.warn('[FS] 로그인 처리 실패, localStorage 폴백:', e);
    restorePlayerState();
    if(!state.playerId){ state.playerId=generatePlayerId(); savePlayerState(); }
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

// bfcache 복원(브라우저 뒤로가기) 감지 → 인트로 화면으로 초기화
window.addEventListener('pageshow', e => {
  if(!e.persisted) return;
  state.playerName = '플레이어';
  state.playerId = null;
  state.money = 0; state.clickIncome = 10; state.tapCount = 0;
  state.upgradeCount = 0; state.score = 0; state.bestCombo = 0;
  state.combo = 0; state.comboMult = 1;
  state.dailyData = null;
  _pendingUuid = null;
  switchScreen('#introScreen');
});

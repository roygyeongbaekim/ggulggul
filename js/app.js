// ===== 앱 진입점 / 로그인 / 초기화 =====

async function doLogin(playerId, playerName, prevLogin=null, isNewPlayer=false){
  state.playerName = playerName;
  state.playerId = playerId;
  const [fsState, fsDailyData, fsCheckinDates] = await Promise.all([
    loadPlayerStateFromFs(playerId),
    loadDailyDataFromFs(playerId),
    loadCheckinDatesFromFs(playerId),
  ]);
  restorePlayerState();
  applyPlayerStateData(fsState);
  state.playerId = playerId;
  // daily 데이터: 오늘 날짜인 경우만 메모리에 적용 (날짜 바뀐 경우 initDailySystem이 새로 생성)
  state.dailyData = (fsDailyData && fsDailyData.lastDate === getTodayStr()) ? fsDailyData : null;
  if(fsCheckinDates) state._fsCheckinDates = fsCheckinDates;
  savePlayerState();
  if(db) db.ref('players/'+safeKey(playerId)).update({name:playerName, playerId, lastLoginAt: TS()}).catch(()=>{});
  fetchAndCacheRanking();
  initRoundThresholds();
  switchScreen('#gameScreen');
  const logo = $('#gameScreenLogo');
  if(logo) logo.textContent = state.playerName + '의 저축';
  updateLastLoginDisplay(prevLogin);
  renderRanking();
  if(isNewPlayer) window._coachWillStart = true; // showCheckinModal이 코치마크 종료 후 표시하도록 예약
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
  const uuid = params.get('uuid'); // null: 파라미터 없음, '': 빈값, 'xxx': 값 있음

  // uuid 파라미터 자체가 없으면 → 로딩 없이 인트로 화면 그대로
  if(uuid === null) return;

  // uuid 파라미터가 있으면 무조건 로딩 화면 표시
  const loadingEl = document.getElementById('uuidLoading');
  const loadingMsgEl = document.getElementById('uuidLoadingMsg');
  const _msgs = [
    '꿀꿀~ 저축챌린지 접속 중이에요! 🐷',
    '돼지저금통이 열심히 준비 중이에요 🐽',
    '꿀꿀꿀~ 저축 기록을 불러오는 중!',
    '잠깐만요! 돼지가 달려가고 있어요 🐷💨',
    '오늘도 저축 도전이다꿀! 🐷🪙',
  ];
  let _msgIdx = 0;
  if(loadingEl) loadingEl.style.display = 'flex';
  const _msgTimer = setInterval(() => {
    _msgIdx = (_msgIdx + 1) % _msgs.length;
    if(loadingMsgEl) loadingMsgEl.textContent = _msgs[_msgIdx];
  }, 1800);

  const _hideLoading = () => { clearInterval(_msgTimer); if(loadingEl) loadingEl.style.display = 'none'; };
  const _showIntro = () => { _hideLoading(); if(playerNameInput) playerNameInput.focus(); };

  // Case 1: uuid가 빈값이면 → 인트로 화면
  if(!uuid) { _showIntro(); return; }

  try {
    if(!db){
      let waited=0;
      await new Promise(res=>{ const t=setInterval(()=>{ waited+=200; if(db||waited>=5000){ clearInterval(t); res(); } },200); });
    }
    if(!db){ _showIntro(); return; }

    const snap = await db.ref('players/'+safeKey(uuid)).get();
    console.log('[UUID Login] 조회 결과:', { uuid, key: safeKey(uuid), exists: snap.exists(), val: snap.exists() ? snap.val() : null });
    if(snap.exists() && snap.val().name){
      // 기존 플레이어 → 게임 화면으로 이동
      const playerData = snap.val();
      await doLogin(uuid, playerData.name, playerData.lastLoginAt||null, false);
      _hideLoading();
      return;
    }
    if(snap.exists() && !snap.val().name){
      // 노드는 있지만 이름 미등록 → 이름 입력 화면
      console.warn('[UUID Login] 노드 존재하나 name 없음:', snap.val());
    }
    // Case 2: uuid가 처음 들어오는 값 → 인트로 화면에서 이름 입력
    _pendingUuid = uuid;
    _showIntro();
  } catch(e){ console.warn('[UUID Login] 실패:', e); _showIntro(); }
})();

// ===== 시작하기 버튼 =====
$('#startBtn').onclick = async () => {
  if(playerNameInput) playerNameInput.blur(); // click 발생 후 blur → 레이아웃 이동 없이 키패드 닫힘
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
    console.warn('[Login] 로그인 처리 실패, 기본값으로 진행:', e);
    restorePlayerState();
    if(!state.playerId){ state.playerId=generatePlayerId(); }
    state.playerName = name || '플레이어';
    initRoundThresholds();
    switchScreen('#gameScreen');
    const logo=$('#gameScreenLogo'); if(logo) logo.textContent=state.playerName+'의 저축';
    renderRanking(); initDailySystem(); updateUI();
  }
  btn.disabled=false; btn.textContent='시작하기';
};

window.clearAllGameData = function(){
  // 남아있을 수 있는 구버전 localStorage 키 일괄 정리
  const keys = Object.keys(localStorage).filter(k => k.startsWith('ggul-'));
  keys.forEach(k => localStorage.removeItem(k));
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

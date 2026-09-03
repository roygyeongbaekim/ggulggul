// ===== 플레이어 상태 =====

const FIREBASE_KEY_UNSAFE = /[.#$\[\]\/]/;

function generatePlayerId(){
  let id;
  do {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant bits
    id = Array.from(b).map(x => x.toString(16).padStart(2,'0')).join(''); // 32자리 hex, 하이픈 없음
  } while(FIREBASE_KEY_UNSAFE.test(id));
  return id;
}

function savePlayerState(){
  scheduleFsSave();
}

const UPGRADE_INIT = { coffee:{cost:80}, ledger:{cost:200}, study:{cost:480}, deposit:{cost:1100}, sidejob:{cost:2800}, fund:{cost:7000} };

function resetUpgrades(){
  state.upgrades.forEach(u => { u.bought = 0; u.cost = UPGRADE_INIT[u.id]?.cost ?? u.cost; });
}

function restorePlayerState(){
  resetUpgrades();
  state.money = 0; state.clickIncome = 10; state.tapCount = 0; state.upgradeCount = 0;
  state.score = 0; state.bestCombo = 0; state.currentRound = 'easy';
  state.completedRounds = { easy:false, normal:false, hard:false };
  state.usedQuizIndices = { easy:[], normal:[], hard:[] };
  state.rankingSavedDate = null; state.playerId = null;
}

function applyPlayerStateData(ps){
  if(!ps) return;
  state.money = ps.money || 0;
  state.clickIncome = ps.clickIncome || 10;
  state.tapCount = ps.tapCount || 0;
  state.upgradeCount = ps.upgradeCount || 0;
  state.score = ps.score || 0;
  state.bestCombo = ps.bestCombo || 0;
  state.currentRound = ps.currentRound || 'easy';
  state.completedRounds = ps.completedRounds || { easy:false, normal:false, hard:false };
  state.usedQuizIndices = ps.usedQuizIndices || { easy:[], normal:[], hard:[] };
  state.rankingSavedDate = ps.rankingSavedDate || null;
  if(ps.upgrades){ ps.upgrades.forEach(saved => { const u = state.upgrades.find(x => x.id === saved.id); if(u){ u.cost = saved.cost; u.bought = saved.bought; } }); }
}

function isRankingSavedToday(){
  return !!(state.dailyData?.rankingSaved);
}

function resetDailyQuizState(){
  state.currentRound = 'easy';
  state.completedRounds = { easy:false, normal:false, hard:false };
  state.roundTriggered = false;
  state.usedQuizIndices = { easy:[], normal:[], hard:[] };
  initRoundThresholds();
  savePlayerState();
}

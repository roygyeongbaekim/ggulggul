// ===== FIREBASE REALTIME DATABASE =====

let db = null;
try {
  firebase.initializeApp({
    apiKey:"AIzaSyDRAw32CTWGUc3SIH9F0rKSwajARJQsDcI",
    authDomain:"ggulggul.firebaseapp.com",
    databaseURL:"https://ggulggul-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:"ggulggul",
    storageBucket:"ggulggul.firebasestorage.app",
    messagingSenderId:"937013776932",
    appId:"1:937013776932:web:5786df7ad6973b51fd3eb1"
  });
  db = firebase.database();
} catch(e){ console.warn('[DB] Firebase 초기화 실패, localStorage 모드로 실행:', e); }

let _fsSaveTimer = null;
const TS = () => firebase.database.ServerValue.TIMESTAMP;

function safeKey(id){ return (id||'').replace(/[^A-Za-z0-9]/g,''); }
function scheduleFsSave(){ clearTimeout(_fsSaveTimer); _fsSaveTimer = setTimeout(flushPlayerStateToFs, 2000); }

async function flushPlayerStateToFs(){
  if(!db||!state.playerId) return;
  try {
    await db.ref('playerState/'+safeKey(state.playerId)).set({
      money:state.money, clickIncome:state.clickIncome, tapCount:state.tapCount,
      upgradeCount:state.upgradeCount, score:state.score, bestCombo:state.bestCombo,
      currentRound:state.currentRound, completedRounds:state.completedRounds,
      usedQuizIndices:state.usedQuizIndices||{easy:[],normal:[],hard:[]},
      rankingSavedDate:state.rankingSavedDate||null,
      playerId:state.playerId, playerName:state.playerName,
      upgrades:state.upgrades.map(u=>({id:u.id,cost:u.cost,bought:u.bought}))
    });
  } catch(e){ console.warn('[DB] playerState 저장 실패:', e); }
}

async function loadPlayerStateFromFs(playerId){
  if(!db) return null;
  try {
    const s = await db.ref('playerState/'+safeKey(playerId)).get();
    return s.exists() ? s.val() : null;
  } catch(e){ console.warn('[DB] playerState 로드 실패:', e); return null; }
}

async function flushDailyDataToFs(){
  if(!db||!state.playerId||!state.dailyData) return;
  try {
    const key = safeKey(state.playerId)+'_'+getTodayStr();
    await db.ref('dailyData/'+key).set({ playerId:state.playerId, playerName:state.playerName, date:getTodayStr(), ...state.dailyData });
  } catch(e){ console.warn('[DB] dailyData 저장 실패:', e); }
}

async function loadDailyDataFromFs(playerId){
  if(!db) return null;
  try {
    const key = safeKey(playerId)+'_'+getTodayStr();
    const s = await db.ref('dailyData/'+key).get();
    return s.exists() ? s.val() : null;
  } catch(e){ console.warn('[DB] dailyData 로드 실패:', e); return null; }
}

async function findOrCreatePlayer(name){
  if(!db) return null;
  try {
    const snap = await db.ref('players').orderByChild('name').equalTo(name).limitToFirst(1).get();
    if(snap.exists()){
      let foundId = null;
      snap.forEach(child=>{ foundId = child.val().playerId; });
      return foundId;
    }
    const newId = generatePlayerId();
    await db.ref('players/'+safeKey(newId)).set({ name, playerId:newId, createdAt:TS() });
    return newId;
  } catch(e){ console.warn('[DB] 플레이어 찾기/생성 실패:', e); return null; }
}

// 이름이 다른 uuid에 이미 사용 중인지 확인 (true = 사용 불가)
async function checkNameTaken(name, excludeUuid){
  if(!db) return false;
  try {
    const snap = await db.ref('players').orderByChild('name').equalTo(name).limitToFirst(1).get();
    if(!snap.exists()) return false;
    let takenByOther = false;
    snap.forEach(child => {
      const pid = child.val().playerId;
      if(pid && safeKey(pid) !== safeKey(excludeUuid)) takenByOther = true;
    });
    return takenByOther;
  } catch(e){ console.warn('[DB] 이름 중복 확인 실패:', e); return false; }
}

function peekPlayerId(){
  try {
    const ps = JSON.parse(localStorage.getItem('ggul-pstate-'+state.playerName)||'null');
    return ps?.playerId || null;
  } catch(e){ return null; }
}

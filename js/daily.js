// ===== 데일리 시스템 =====

function getDailyKey(){ return 'ggul-daily-v2-' + state.playerName; }

function getSecondsUntilMidnight(){ const now=new Date(),m=new Date(now); m.setHours(24,0,0,0); return Math.floor((m-now)/1000); }
function formatCountdown(s){ return String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor((s%3600)/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

function renderClickLimit(){
  const barEl=document.getElementById('clickLimitBar'), textEl=document.getElementById('clickLimitText'), cdEl=document.getElementById('clickCountdown');
  if(!barEl||!textEl) return;
  const used=state.dailyData?.dailyClicks||0;
  const pct=Math.min(100,Math.round((used/DAILY_CLICK_LIMIT)*100));
  barEl.style.width=pct+'%';
  barEl.style.background=pct>=100?'linear-gradient(90deg,#ff6b6b,#e53e3e)':pct>=70?'linear-gradient(90deg,#ffa94d,#ff6b1a)':'linear-gradient(90deg,#ff9dbf,#eb789b)';
  textEl.textContent=used+' / '+DAILY_CLICK_LIMIT;
  textEl.style.color=pct>=100?'#e53e3e':pct>=70?'#ff6b1a':'#7b2845';
  const over=used>=DAILY_CLICK_LIMIT;
  earnBtn.style.opacity=over?'0.45':''; earnBtn.style.filter=over?'grayscale(55%)':''; earnBtn.style.cursor=over?'not-allowed':'';
  if(cdEl) cdEl.style.display='none';
  const overlay=document.getElementById('tapDoneOverlay');
  const cdDone=document.getElementById('tapDoneCountdown');
  if(overlay){ overlay.style.display=over?'block':'none'; }
  if(cdDone&&over){ cdDone.textContent='⏰ '+formatCountdown(getSecondsUntilMidnight())+' 후 초기화'; }
  const completeCard=document.getElementById('dailyCompleteCard');
  if(completeCard){
    if(over){
      completeCard.style.display='block';
      const rm=document.getElementById('resultMoney'); if(rm) rm.textContent=formatMoney(state.money);
      const rc=document.getElementById('resultCombo'); if(rc){ const bm=parseFloat((1+((state.bestCombo||1)-1)*0.25).toFixed(2)); rc.textContent='×'+bm.toFixed(1); }
      const rs=document.getElementById('resultScore'); if(rs) rs.textContent=state.score.toLocaleString('ko-KR');
      applyRankingSavedState();
    } else {
      completeCard.style.display='none';
    }
  }
}

function applyRankingSavedState(){
  const saved = isRankingSavedToday();
  const btn = document.getElementById('resultSaveBtn');
  const msg = document.getElementById('resultSavedMsg');
  if(btn){ btn.disabled = saved; btn.style.opacity = saved ? '0.5' : ''; }
  if(msg) msg.style.display = saved ? 'block' : 'none';
}

function doSaveRanking(){
  const clicksDone = (state.dailyData?.dailyClicks||0) >= DAILY_CLICK_LIMIT;
  if(clicksDone && isRankingSavedToday()){ showToast('꿀꿀~ 이미 저장했어요! 🐷'); return; }
  upsertRanking();
  if(clicksDone){
    state.rankingSavedDate = getTodayStr();
    if(state.dailyData){ state.dailyData.rankingSaved = true; saveDailyData(state.dailyData); } else { savePlayerState(); }
  }
  applyRankingSavedState();
}

document.getElementById('resultSaveBtn').onclick = doSaveRanking;

function loadDailyData(){ try{ return JSON.parse(localStorage.getItem(getDailyKey())||'null'); }catch(e){ return null; } }
function saveDailyData(d){ localStorage.setItem(getDailyKey(), JSON.stringify(d)); savePlayerState(); flushDailyDataToFs(); }

function generateDailyGoals(dayIndex){
  const n = GOAL_POOL.length;
  const picks = new Set();
  let seed = dayIndex;
  while(picks.size < 3){
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    picks.add(seed % n);
  }
  return [...picks].map(i => ({ ...GOAL_POOL[i], current:0, done:false }));
}

function initDailySystem(){
  const today = getTodayStr();
  let data = loadDailyData();
  let isNewDay = false;

  if(!data){
    data = { streak:0, lastDate:null, goals:[], goalDate:null, tipClaimed:false, dailyClicks:0, goalsCelebrated:false, rankingSaved:false, checkinDates:[] };
  }
  if(!data.checkinDates) data.checkinDates = [];
  // 기존 streak 데이터로 checkinDates 백필 (처음 도입 시 과거 날짜 복원)
  if(data.checkinDates.length === 0 && data.streak > 0 && data.lastDate){
    for(let i = 0; i < data.streak; i++){
      const d = new Date(data.lastDate); d.setDate(d.getDate() - i);
      const ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      if(!data.checkinDates.includes(ds)) data.checkinDates.push(ds);
    }
  }
  // lastDate가 오늘이어도 checkinDates에 오늘이 없으면 추가
  if(data.lastDate === today && !data.checkinDates.includes(today)){
    data.checkinDates.push(today);
  }

  if(data.lastDate !== today){
    isNewDay = true;
    const yest = new Date(); yest.setDate(yest.getDate()-1);
    const yesterdayStr = yest.getFullYear()+'-'+String(yest.getMonth()+1).padStart(2,'0')+'-'+String(yest.getDate()).padStart(2,'0');
    data.streak = (data.lastDate === yesterdayStr) ? data.streak + 1 : 1;
    data.lastDate = today;
    if(!data.checkinDates.includes(today)) data.checkinDates.push(today);
    // 30일 이상 된 날짜는 정리
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
    const cutoffStr = cutoff.getFullYear()+'-'+String(cutoff.getMonth()+1).padStart(2,'0')+'-'+String(cutoff.getDate()).padStart(2,'0');
    data.checkinDates = data.checkinDates.filter(d=>d>=cutoffStr);
    data.tipClaimed = false;
    data.dailyClicks = 0;
    data.goalsCelebrated = false;
    data.rankingSaved = false;
    const dayIndex = Math.floor(Date.now() / 86400000);
    data.goals = generateDailyGoals(dayIndex);
    data.goalDate = today;
    resetDailyQuizState();
    state.money = 0; state.score = 0; state.tapCount = 0; state.bestCombo = 0;
    state.clickIncome = 10; state.combo = 0; state.comboMult = 1;
    resetUpgrades();
    savePlayerState();
  } else {
    if(!data.goals || data.goals.length === 0){
      const dayIndex = Math.floor(Date.now() / 86400000);
      data.goals = generateDailyGoals(dayIndex);
      data.goalDate = today;
    }
  }

  state.dailyData = data;
  saveDailyData(data);

  renderDailyTip();
  renderDailyGoals();
  updateStreakChip();
  renderClickLimit();

  if(isNewDay) showCheckinModal(data);
}

function getTodayTip(){
  const dayIndex = Math.floor(Date.now() / 86400000);
  return FINANCIAL_TIPS[dayIndex % FINANCIAL_TIPS.length];
}

function renderDailyTip(){
  const tip = getTodayTip();
  const tipText = document.getElementById('dailyTipText');
  const tipTag = document.getElementById('dailyTipTag');
  const tipBtn = document.getElementById('tipClaimBtn');
  const dot = document.getElementById('tipDotIndicator');
  if(!tipText) return;
  tipText.textContent = tip.tip;
  if(tipTag) tipTag.textContent = tip.tag;
  const claimed = state.dailyData?.tipClaimed;
  if(tipBtn){
    tipBtn.disabled = claimed;
    tipBtn.textContent = claimed ? '✅ 오늘 팁 보너스를 이미 받았어요' : '📖 읽기 완료 보너스 받기 (+₩300)';
  }
  if(dot) dot.style.display = claimed ? 'none' : 'block';
  const iconEmoji = document.getElementById('tipIconEmoji');
  const iconBtn = document.getElementById('tipIconBtn');
  if(iconEmoji) iconEmoji.textContent = claimed ? '🔦' : '💡';
  if(iconBtn){
    iconBtn.style.background = claimed ? 'linear-gradient(135deg,#e8e8e8,#d0d0d0)' : 'linear-gradient(135deg,#fff3c4,#ffe066)';
    iconBtn.style.borderColor = claimed ? 'rgba(0,0,0,.12)' : 'rgba(200,155,0,.3)';
    iconBtn.style.opacity = claimed ? '0.65' : '1';
  }
}

document.getElementById('tipClaimBtn').onclick = () => {
  if(!state.dailyData || state.dailyData.tipClaimed) return;
  state.dailyData.tipClaimed = true;
  state.money += 300;
  state.score += 3;
  saveDailyData(state.dailyData);
  renderDailyTip();
  updateUI();
  showToast('꿀꿀~ 금융 팁 읽기 완료! +₩300 🐷💡');
};

document.getElementById('tipIconBtn').onclick = () => {
  document.getElementById('tipModal').style.display = 'flex';
  renderDailyTip();
};
document.getElementById('tipModalClose').onclick = () => {
  document.getElementById('tipModal').style.display = 'none';
};

function renderDailyGoals(){
  const list = document.getElementById('dailyGoalsList');
  if(!list || !state.dailyData?.goals) return;
  list.innerHTML = '';
  state.dailyData.goals.forEach(goal => {
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
    const div = document.createElement('div');
    div.className = 'daily-goal-item' + (goal.done ? ' done' : '');
    div.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
        '<span style="font-weight:700;font-size:.9rem">' + goal.icon + ' ' + (goal.done ? '✅ ' : '') + goal.label + '</span>' +
        '<span style="font-size:.8rem;color:var(--primary);font-weight:800;white-space:nowrap">+' + formatMoney(goal.reward) + '</span>' +
      '</div>' +
      '<div class="goal-bar-bg"><div class="goal-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="font-size:.76rem;color:var(--muted);text-align:right">' + (goal.done ? '달성 완료! 🎉' : goal.current.toLocaleString('ko-KR') + ' / ' + goal.target.toLocaleString('ko-KR')) + '</div>';
    list.appendChild(div);
  });
}

function updateStreakChip(){
  const chip = document.getElementById('streakChip');
  if(!chip || !state.dailyData) return;
  const s = state.dailyData.streak;
  chip.textContent = '🔥 ' + s + '일 연속';
  if(s >= 7) chip.style.background = 'linear-gradient(135deg,#ff4500,#cc0000)';
  else if(s >= 3) chip.style.background = 'linear-gradient(135deg,#ff7b00,#ff4500)';
  else chip.style.background = 'linear-gradient(135deg,#ff9a3c,#ff6015)';
}

function updateGoalProgress(type, increment){
  if(!state.dailyData?.goals) return;
  let anyDone = false;
  state.dailyData.goals.forEach(goal => {
    if(goal.done) return;
    if(goal.type !== type) return;
    if(type === 'money' || type === 'score') return;
    goal.current = Math.min(goal.target, goal.current + increment);
    if(goal.current >= goal.target){
      goal.done = true;
      anyDone = true;
      state.money += goal.reward;
      state.score += Math.floor(goal.reward / 10);
      showToast('꿀꿀! 목표 달성! "' + goal.label + '" +' + formatMoney(goal.reward) + ' 🐷🎯');
    }
  });
  saveDailyData(state.dailyData);
  renderDailyGoals();
  if(anyDone){ updateUI(); showAllGoalsCelebration(); }
}

function checkAbsoluteGoals(){
  if(!state.dailyData?.goals) return;
  let anyDone = false;
  state.dailyData.goals.forEach(goal => {
    if(goal.done) return;
    let newVal = null;
    if(goal.type === 'money') newVal = Math.min(goal.target, state.money);
    else if(goal.type === 'score') newVal = Math.min(goal.target, state.score);
    if(newVal === null) return;
    goal.current = newVal;
    if(goal.current >= goal.target){
      goal.done = true;
      anyDone = true;
      state.money += goal.reward;
      state.score += Math.floor(goal.reward / 10);
      showToast('꿀꿀! 목표 달성! "' + goal.label + '" +' + formatMoney(goal.reward) + ' 🐷🎯');
    }
  });
  if(anyDone){ saveDailyData(state.dailyData); showAllGoalsCelebration(); }
  renderDailyGoals();
}

function showAllGoalsCelebration(){
  if(!state.dailyData||state.dailyData.goalsCelebrated) return;
  if(!state.dailyData.goals.length||!state.dailyData.goals.every(g=>g.done)) return;
  state.dailyData.goalsCelebrated=true;
  saveDailyData(state.dailyData);
  setTimeout(()=>{
    launchConfetti();
    document.getElementById('celebrationModal').style.display='flex';
  },700);
}

document.getElementById('celebrationCloseBtn').onclick=()=>{
  document.getElementById('celebrationModal').style.display='none';
};

function showCheckinModal(data){
  const modal = document.getElementById('checkinModal');
  const titleEl = document.getElementById('checkinTitle');
  const subtitleEl = document.getElementById('checkinSubtitle');
  const bonusAmountEl = document.getElementById('checkinBonusAmount');
  const bonusDescEl = document.getElementById('checkinBonusDesc');
  const calendarEl = document.getElementById('checkinCalendar');
  const emojiEl = document.getElementById('checkinEmoji');
  const nextTipEl = document.getElementById('checkinNextTip');

  const s = data.streak;
  let bonus = 500, msg = '', em = '🐷';
  if(s >= 30){ bonus = 30000; msg = '30일 연속 출석 달성! 황금 돼지 보너스!'; em = '🐽'; }
  else if(s >= 14){ bonus = 10000; msg = '2주 연속 출석! 대단해요!'; em = '🌟'; }
  else if(s >= 7){ bonus = 5000; msg = '1주일 연속! 멋진 저축 습관!'; em = '🏆'; }
  else if(s >= 3){ bonus = s * 300; msg = s + '일 연속! 습관이 만들어지고 있어요!'; em = '✨'; }
  else { bonus = 500; msg = '매일 출석하면 보너스가 쌓여요!'; }

  emojiEl.textContent = em;
  titleEl.textContent = s === 1 ? '오늘부터 시작! 반가워요 🐷' : s + '일째 출석! 잘하고 있어요';
  subtitleEl.textContent = msg;
  bonusAmountEl.textContent = '+' + formatMoney(bonus);
  bonusDescEl.textContent = s + '일 연속 출석 보너스';
  nextTipEl.textContent = s < 7 ? '💰 ' + (7 - s) + '일 더 연속 출석하면 ₩5,000 특별 보너스!' : '🎉 연속 출석을 계속 유지해 보세요!';

  const checkinSet = new Set(data.checkinDates||[]);
  calendarEl.innerHTML = '';
  for(let i = 6; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const slot = document.createElement('span');
    slot.className = 'cal-slot';
    const dayNum = d.getDate();
    const month = d.getMonth() + 1;
    if(i === 0){
      slot.classList.add('today-slot');
      slot.innerHTML = month + '/' + dayNum + '<br>오늘';
    } else if(checkinSet.has(dateStr)){
      slot.classList.add('filled');
      slot.innerHTML = month + '/' + dayNum + '<br>✓';
    } else {
      slot.classList.add('empty');
      slot.textContent = month + '/' + dayNum;
    }
    calendarEl.appendChild(slot);
  }

  modal.style.display = 'flex';

  document.getElementById('checkinCloseBtn').onclick = () => {
    modal.style.display = 'none';
    state.money += bonus;
    state.score += Math.floor(bonus / 100);
    saveDailyData(state.dailyData);
    updateUI();
    showToast('꿀꿀~ 출석 보너스 +' + formatMoney(bonus) + ' 받았어요! 🐷🎉');
  };
}

setInterval(()=>{
  if(state.dailyData && state.dailyData.lastDate && state.dailyData.lastDate !== getTodayStr()){
    state._completeCelebrated = false;
    initDailySystem();
    updateUI();
    return;
  }
  if((state.dailyData?.dailyClicks||0)>=DAILY_CLICK_LIMIT) renderClickLimit();
},1000);

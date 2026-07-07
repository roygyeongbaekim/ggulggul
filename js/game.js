// ===== 게임 로직 =====

function pauseCombo(){
  if(state.comboPaused) return;
  state.comboPaused=true;
  clearTimeout(state.comboTimer);
  state.comboTimer=null;
  state._comboPauseRemaining=state._comboTimerEnd?Math.max(0,state._comboTimerEnd-Date.now()):0;
}

function resumeCombo(){
  if(!state.comboPaused) return;
  state.comboPaused=false;
  if(state._comboPauseRemaining>0){
    state._comboTimerEnd=Date.now()+state._comboPauseRemaining;
    state.comboTimer=setTimeout(()=>{ state.combo=0; state.comboMult=1; state._comboTimerEnd=null; if(comboDisplayEl){comboDisplayEl.textContent='×1.0';comboDisplayEl.style.color='#7b2845';} },state._comboPauseRemaining);
  }
  state._comboPauseRemaining=0;
}

async function loadQuizData(){ try{ const res=await fetch('./js/quizData.js'); state.quizData=await res.json(); } catch(e){ state.quizData={easy:[],normal:[],hard:[]}; } }

function showEventModal(quiz, roundKey){
  pauseCombo();
  const announce=document.getElementById('quizAnnounce');
  if(announce){
    const wrap=announce.querySelector('.qz-announce-wrap');
    const flap=announce.querySelector('.qz-env-flap');
    const content=announce.querySelector('.qz-env-content');
    const label=announce.querySelector('.qz-announce-label');
    [wrap,flap,content,label].forEach(el=>{ if(el){ el.style.animation='none'; void el.offsetWidth; el.style.animation=''; } });
    announce.style.display='flex';
  }
  setTimeout(()=>{
    if(announce) announce.style.display='none';
    const modal=$('#eventModal'); const title=$('#eventModalTitle'); const question=$('#eventModalQuestion'); const options=$('#eventModalOptions');
    const labels={easy:'기초 · 비상금/예적금',normal:'일반 · 카드/대출',hard:'심화 · 투자/세금'};
    modal.style.display='flex'; title.textContent=`${quiz.title} [${labels[roundKey]||roundKey}]`; question.textContent=quiz.question; options.innerHTML='';
    quiz.options.forEach((opt,idx)=>{ const btn=document.createElement('button'); btn.className='qbtn'; btn.textContent=opt; btn.onclick=()=>{
      const correct=idx===quiz.answer;
      $$('#eventModalOptions .qbtn').forEach((b,i)=>{
        b.disabled=true;
        if(i===quiz.answer) b.classList.add('correct-answer');
        else if(i===idx&&!correct) b.classList.add('wrong');
      });
      if(correct){
        state.money+=quiz.bonus; state.score+=10; changePiggyMood('happy'); updateGoalProgress('quizCorrect',1); updateUI();
        showMoneyFloat(quiz.bonus,true);
        state.completedRounds[roundKey]=true; const next=roundLevels[roundKey]?.next; state.currentRound=next||null; state.roundTriggered=false;
        savePlayerState();
        setTimeout(()=>{
          closeEventModal();
          launchConfetti();
          $('#quizCorrectBonusAmt').textContent='+'+formatMoney(quiz.bonus)+' 획득!';
          $('#quizCorrectQuestion').textContent=quiz.question;
          $('#quizCorrectAnswer').textContent=quiz.options[quiz.answer];
          $('#quizCorrectModal').style.display='flex';
        }, 400);
      } else {
        changePiggyMood('sad');
        let wrongMsg=$('#quizWrongMsg');
        if(!wrongMsg){ wrongMsg=document.createElement('div'); wrongMsg.id='quizWrongMsg'; wrongMsg.style.cssText='margin-top:10px;padding:10px 14px;border-radius:14px;background:rgba(229,62,62,.08);color:#c0392b;font-weight:700;font-size:.88rem;text-align:center;line-height:1.5'; options.after(wrongMsg); }
        wrongMsg.textContent='꿀꿀... 아쉬워요 🐷 정답은 초록색으로 표시했어요!';
        const closeBtn=$('#eventModalClose'); if(closeBtn) closeBtn.textContent='확인하고 닫기';
        state.completedRounds[roundKey]=true; const next=roundLevels[roundKey]?.next; state.currentRound=next||null; state.roundTriggered=false;
        savePlayerState();
      }
    }; options.appendChild(btn); });
  }, 1700);
}

function closeEventModal(){ resumeCombo(); $('#eventModal').style.display='none'; const wm=$('#quizWrongMsg'); if(wm) wm.remove(); const cb=$('#eventModalClose'); if(cb) cb.textContent='닫기'; }

$('#eventModalClose').onclick=()=>{
  const isAnswered = !!$('#quizWrongMsg');
  if(isAnswered){ closeEventModal(); } else { $('#quizCloseConfirm').style.display='flex'; }
};
document.getElementById('quizCloseCancel').onclick=()=>{
  $('#quizCloseConfirm').style.display='none';
};
document.getElementById('quizCloseConfirmBtn').onclick=()=>{
  $('#quizCloseConfirm').style.display='none';
  closeEventModal();
};
document.getElementById('quizCorrectClose').onclick=()=>{
  document.getElementById('quizCorrectModal').style.display='none';
};

function pickQuiz(roundKey){
  const list = state.quizData[roundKey] || [];
  if(!list.length) return null;
  if(!state.usedQuizIndices) state.usedQuizIndices = {};
  if(!state.usedQuizIndices[roundKey]) state.usedQuizIndices[roundKey] = [];
  const used = state.usedQuizIndices[roundKey];
  let available = list.map((_,i) => i).filter(i => !used.includes(i));
  if(!available.length){
    state.usedQuizIndices[roundKey] = [];
    available = list.map((_,i) => i);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  state.usedQuizIndices[roundKey].push(idx);
  savePlayerState();
  return list[idx];
}

function triggerEventIfMet(){
  if(state.roundTriggered||!state.quizData) return;
  const roundKey=state.currentRound;
  if(!roundKey||state.completedRounds[roundKey]) return;
  const threshold=state.roundThresholds?.[roundKey];
  if(!threshold||state.tapCount<threshold) return;
  const quiz=pickQuiz(roundKey);
  if(!quiz) return;
  state.roundTriggered=true;
  showEventModal(quiz,roundKey);
}

function updateUI(){ moneyEl.textContent=formatMoney(state.money); clickIncomeEl.textContent=formatMoney(state.clickIncome); if(comboDisplayEl){ const cm=state.comboMult||1; comboDisplayEl.textContent='×'+cm.toFixed(1); comboDisplayEl.style.color=cm>=2.5?'#d43000':cm>=1.5?'#e86c00':'#7b2845'; } scoreEl.textContent=state.score.toLocaleString('ko-KR'); renderQuickUpgrades(); checkAbsoluteGoals(); }

earnBtn.onclick=()=>{ if(state.dailyData && state.dailyData.dailyClicks >= DAILY_CLICK_LIMIT){ showToast('꿀꿀... 오늘 클릭을 다 썼어요! 내일 또 봐요 🌙'); return; } state.combo=Math.min((state.combo||0)+1,10); state.comboMult=parseFloat((1+(state.combo-1)*0.25).toFixed(2)); if(state.combo>=(state.bestCombo||1)) state.bestCombo=state.combo; clearTimeout(state.comboTimer); state._comboTimerEnd=Date.now()+1800; state.comboTimer=setTimeout(()=>{ state.combo=0; state.comboMult=1; state._comboTimerEnd=null; if(comboDisplayEl){comboDisplayEl.textContent='×1.0';comboDisplayEl.style.color='#7b2845';} },1800); const earned=Math.floor(state.clickIncome*state.comboMult); state.money+=earned; state.tapCount+=1; state.score+=1; if(state.dailyData){ state.dailyData.dailyClicks=(state.dailyData.dailyClicks||0)+1; saveDailyData(state.dailyData); } earnBtn.classList.remove('popped'); void earnBtn.offsetWidth; earnBtn.classList.add('popped'); triggerCoinAnimations(); showMoneyFloat(earned,true); updateUI(); triggerEventIfMet(); updateGoalProgress('tap',1); const justFinished=state.dailyData&&state.dailyData.dailyClicks>=DAILY_CLICK_LIMIT&&!state._completeCelebrated; if(justFinished){ state._completeCelebrated=true; setTimeout(()=>{ launchConfetti(); showToast('꿀꿀꿀! 200번 달성했어요! 최고예요 🎊🐷'); },300); } renderClickLimit(); };

function showMoneyFloat(amount, positive=true){
  const el=document.createElement('div');
  el.className='money-float';
  el.textContent=(positive?'+':'-')+Math.floor(amount).toLocaleString('ko-KR');
  el.style.color=positive?'#2e7d32':'#e53e3e';
  const rect=moneyEl.getBoundingClientRect();
  el.style.left=(rect.left+rect.width/2)+'px';
  el.style.top=(rect.top+window.scrollY-10)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1000);
}

function triggerCoinAnimations(){ coinPop.classList.remove('drop'); void coinPop.offsetWidth; coinPop.classList.add('drop'); const coin=document.createElement('span'); coin.className='coin-entry'; piggyMouth.appendChild(coin); void coin.offsetWidth; coin.classList.add('fly'); pigTail.classList.remove('wiggle'); void pigTail.offsetWidth; pigTail.classList.add('wiggle'); setTimeout(()=>coin.remove(),700); }

function triggerCoinEjectAnimations(){
  const count = 3;
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      const coin=document.createElement('span');
      coin.className='coin-exit';
      const angle = -20 + i*20;
      const dist = 55 + i*15;
      coin.style.setProperty('--ex', `${Math.round(Math.cos((angle-90)*Math.PI/180)*dist)}px`);
      coin.style.setProperty('--ey', `${Math.round(Math.sin((angle-90)*Math.PI/180)*dist)-20}px`);
      piggyMouth.appendChild(coin);
      void coin.offsetWidth;
      coin.classList.add('eject');
      coin.style.animation='none';
      void coin.offsetWidth;
      coin.style.animation=`coinEjectVar${i} .65s ease-out forwards`;
      setTimeout(()=>coin.remove(),700);
    }, i*80);
  }
  pigTail.classList.remove('wiggle'); void pigTail.offsetWidth; pigTail.classList.add('wiggle');
}

function changePiggyMood(mood){ const ears=$$('.tap-button .ear'), eyes=$$('.tap-button .eye'); [...ears,...eyes].forEach(el=>el.classList.remove('happy','sad')); [...ears,...eyes].forEach(el=>el.classList.add(mood)); setTimeout(()=>[...ears,...eyes].forEach(el=>el.classList.remove('happy','sad')),1500); }

function buyUpgrade(index){
  const item = state.upgrades[index];
  if(state.dailyData && state.dailyData.dailyClicks >= DAILY_CLICK_LIMIT){ showToast('꿀꿀... 오늘 클릭을 다 썼어요! 내일 또 봐요 🌙'); return; }
  if(item.bought >= UPGRADE_MAX_COUNT){ showToast(`꿀꿀~ ${item.name}은 더 이상 못해요! 🐷`); return; }
  if(state.money < item.cost){ showToast('꿀꿀... 저축이 부족해요! 더 모아봐요 🐷'); return; }
  const costPaid = item.cost;
  state.money -= costPaid;
  showMoneyFloat(costPaid, false);
  state.upgradeCount += 1;
  state.score += 15;
  item.bought += 1;
  item.cost = Math.floor(item.cost * 1.75);
  if(item.type === 'risky'){
    const win = Math.random() < 0.5;
    if(win){
      state.clickIncome += item.value;
      changePiggyMood('happy');
      showToast(`꿀꿀! 📈 대박났어요! 수익 +₩${item.value} (${item.bought}/${UPGRADE_MAX_COUNT}회)`);
    } else {
      state.clickIncome = Math.max(10, state.clickIncome - item.value);
      changePiggyMood('sad');
      showToast(`꿀꿀... 📉 손실났어요ㅠ 수익 -₩${item.value} (${item.bought}/${UPGRADE_MAX_COUNT}회)`);
    }
  } else {
    state.clickIncome += item.value;
    showToast(`꿀꿀~ ${item.name} 완료! 수익 +₩${item.value} 🐷`);
  }
  triggerCoinEjectAnimations(); updateUI(); triggerEventIfMet(); updateGoalProgress('upgrade',1); savePlayerState();
}

function renderQuickUpgrades(){
  quickUpgradeList.innerHTML = '';
  state.upgrades.forEach((item, index) => {
    const maxed = item.bought >= UPGRADE_MAX_COUNT;
    const clickOver = !!(state.dailyData && state.dailyData.dailyClicks >= DAILY_CLICK_LIMIT);
    const canAfford = state.money >= item.cost;
    const isRisky = item.type === 'risky';
    const btn = document.createElement('button');
    btn.className = 'up' + (maxed ? ' maxed' : clickOver ? ' maxed' : isRisky ? ' risky' + (canAfford ? ' aff' : '') : canAfford ? ' aff' : '');
    btn.disabled = maxed || clickOver;
    btn.innerHTML = `
      <div class="up-icon-row">
        <div class="up-icon">${item.icon}${isRisky ? '<span class="risk-dot"></span>' : ''}</div>
        <div class="up-count-badge">${maxed ? '✓' : `${item.bought}/${UPGRADE_MAX_COUNT}`}</div>
      </div>
      <div class="up-cost">${maxed ? '완료' : formatMoney(item.cost)}</div>`;
    btn.onclick = () => buyUpgrade(index);
    quickUpgradeList.appendChild(btn);
  });
}

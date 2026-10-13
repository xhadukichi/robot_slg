(() => {
  const MAP_SIZE = 20;
  const TILE_SIZE = 64;
  const VIEW_WIDTH = 16;
  const VIEW_HEIGHT = 12;
  const VIEW_PIXEL_WIDTH = TILE_SIZE * VIEW_WIDTH;
  const VIEW_PIXEL_HEIGHT = TILE_SIZE * VIEW_HEIGHT;
  const canvas = document.querySelector('#map');
  const ctx = canvas.getContext('2d');
  const coordinates = document.querySelector('#coordinates');
  const unitCommand = document.querySelector('#unit-command');
  const unitStatus = document.querySelector('#unit-status');
  const emptyCommand = document.querySelector('#empty-command');
  const attackMessage = document.querySelector('#attack-message');
  const phaseAnnouncement = document.querySelector('#phase-announcement');
  const gameResult = document.querySelector('#game-result');
  const phaseLabel = document.querySelector('#phase-label');
  const turnConfirm = document.querySelector('#turn-confirm');
  const audioStartScreen = document.querySelector('#audio-start-screen');
  const titleScreen = document.querySelector('#title-screen');
  const introEvent = document.querySelector('#intro-event');
  const introEventImage = introEvent.querySelector('img');
  const introImageSource = introEventImage.getAttribute('src');
  const storyText = document.querySelector('#story-text');
  const storyStart = document.querySelector('#story-start');
  const gameShell = document.querySelector('.game-shell');
  const titleOptions = [...document.querySelectorAll('[data-title-action]')];
  const bgmAudio = new Audio();
  bgmAudio.loop = true;
  const bgmVolume = 0.45;
  bgmAudio.volume = bgmVolume;
  let currentBgm = '';
  let loadedBgm = '';
  let bgmTransitionId = 0;
  let audioUnlocked = false;
  let phaseInputLocked = false;
  let titleSelection = 1;
  let titleTransitioning = false;
  let titleOpening = false;
  let titleIntroComplete = false;
  let clearPromptReady = false;
  let clearTransitioning = false;
  let isClearStory = false;

  const startCursor = { x: 10, y: 10 };
  const cursor = { ...startCursor };
  const initialCamera = {
    x: Math.max(0, Math.min(MAP_SIZE - VIEW_WIDTH, startCursor.x - Math.floor(VIEW_WIDTH / 2))),
    y: Math.max(0, Math.min(MAP_SIZE - VIEW_HEIGHT, startCursor.y - Math.floor(VIEW_HEIGHT / 2))),
  };
  const camera = { ...initialCamera };
  const cameraTarget = { ...initialCamera };
  let cameraFrame = 0;
  const units = [
    { id: 'PC01', side: 'player', x: 3, y: 9, hp: 10, maxHp: 10, moveRange: 5, minAttackRange: 1, attackRange: 5, attackPower: 3, evasion: 5, hitBonus: 2, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'PC02', side: 'player', x: 3, y: 5, hp: 12, maxHp: 12, moveRange: 4, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 4, hitBonus: 1, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'PC03', side: 'player', x: 2, y: 12, hp: 25, maxHp: 25, moveRange: 4, minAttackRange: 2, attackRange: 6, attackPower: 6, evasion: 0, hitBonus: 1, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'EN01', side: 'enemy', x: 13, y: 10, hp: 15, maxHp: 15, moveRange: 5, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'EN02', side: 'enemy', x: 15, y: 12, hp: 13, maxHp: 13, moveRange: 4, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
  ];
  const obstacles = [
    { id: 'OBJ01', x: 8, y: 8, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ02', x: 7, y: 7, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ03', x: 10, y: 10, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ04', x: 12, y: 10, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ05', x: 5, y: 9, imageFile: 'obstacles_02.png', image: new Image() },
    { id: 'OBJ06', x: 5, y: 10, imageFile: 'obstacles_02.png', image: new Image() },
    { id: 'OBJ07', x: 8, y: 11, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ10', x: 13, y: 9, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ08', x: 6, y: 11, imageFile: 'obstacles_02.png', image: new Image() },
    { id: 'OBJ09', x: 8, y: 12, imageFile: 'obstacles_02.png', image: new Image() },
  ];
  let currentSide = 'player';
  const sideTurnCounts = { player: 1, enemy: 1 };
  let selectedUnit = null;
  let rangeMode = null;
  let enemyRangePreview = null;
  let isUnitMoving = false;
  let menuSelectionIndex = 0;
  let attackMessageTimer = 0;
  let phaseAnnouncementTimer = 0;
  let turnConfirmSelection = 0;
  let statusFromCommand = false;
  let isGameOver = false;
  let pendingGameResult = '';
  let isEnemyAiRunning = false;
  let isCombatResolving = false;
  let pendingMove = null;
  const explosionFrameDuration = 200;
  const explosionFrameCount = 8;
  const explosionImage = new Image();
  const explosionEffects = [];
  explosionImage.src = 'Unit/Bomb_out.png';
  explosionImage.addEventListener('load', draw);
  for (const unit of units) unit.image.src = `Unit/${unit.id}s.png`;
  units.forEach((unit) => unit.image.addEventListener('load', draw));
  for (const obstacle of obstacles) obstacle.image.src = `Unit/${obstacle.imageFile}`;
  obstacles.forEach((obstacle) => obstacle.image.addEventListener('load', draw));

  canvas.addEventListener('click', (event) => {
    if (isGameOver || isUnitMoving || isEnemyAiRunning || isCombatResolving || explosionEffects.length || phaseInputLocked || !turnConfirm.hidden) return;
    canvas.focus();
    emptyCommand.hidden = true;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const mapX = Math.floor(camera.x + ((event.clientX - bounds.left) * scaleX) / TILE_SIZE);
    const mapY = Math.floor(camera.y + ((event.clientY - bounds.top) * scaleY) / TILE_SIZE);

    const clickedUnit = units.find((unit) => unit.x === mapX && unit.y === mapY);
    const clickedObstacle = obstacles.find((obstacle) => obstacle.x === mapX && obstacle.y === mapY);
    const clickedDuringAction = rangeMode !== null;
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && clickedUnit === selectedUnit) {
        commitPendingMove();
        return;
      }
      cursor.x = Math.max(0, Math.min(MAP_SIZE - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_SIZE - 1, mapY));
      const distance = selectedUnit ? Math.abs(mapX - selectedUnit.x) + Math.abs(mapY - selectedUnit.y) : Infinity;
      if (!selectedUnit || !isWithinAttackRange(selectedUnit, distance)) {
        if (pendingMove?.unit === selectedUnit) rollbackPendingMove();
        else rangeMode = null;
      } else if (clickedUnit) {
        tryAttackTarget(clickedUnit);
      }
      scrollToCursor();
      return;
    }

    if (rangeMode === 'move') {
      const distance = selectedUnit ? getMoveDistances(selectedUnit).get(`${mapX},${mapY}`) : undefined;
      const occupied = isObstacleAt(mapX, mapY) || units.some((unit) => unit !== selectedUnit && unit.x === mapX && unit.y === mapY);
      if (clickedUnit || distance === undefined || distance > (selectedUnit?.moveRange ?? 0) || occupied) {
        rangeMode = null;
        unitCommand.hidden = true;
        cursor.x = Math.max(0, Math.min(MAP_SIZE - 1, mapX));
        cursor.y = Math.max(0, Math.min(MAP_SIZE - 1, mapY));
        scrollToCursor();
        return;
      }
      moveSelectedUnitTo(mapX, mapY);
    }

    if (clickedObstacle) {
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      emptyCommand.hidden = true;
      cursor.x = mapX;
      cursor.y = mapY;
      scrollToCursor();
      return;
    }

    if (clickedUnit) {
      openUnitMenu(clickedUnit);
    } else {
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      cursor.x = Math.max(0, Math.min(MAP_SIZE - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_SIZE - 1, mapY));
      if (!clickedDuringAction) emptyCommand.hidden = false;
    }
    scrollToCursor();
  });

  canvas.parentElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (isUnitMoving || isCombatResolving || explosionEffects.length) return;
    if (!turnConfirm.hidden) {
      answerTurnConfirmation(false);
    } else {
      cancelCurrentAction();
    }
  });

  unitCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    chooseUnitAction(event.target.closest('button')?.dataset.action);
  });

  turnConfirm.addEventListener('click', (event) => {
    if (isCombatResolving || explosionEffects.length) return;
    const choice = event.target.closest('button')?.dataset.choice;
    if (choice) answerTurnConfirmation(choice === 'yes');
  });
  emptyCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    if (event.target.closest('button')?.dataset.action !== 'confirm-turn') return;
    emptyCommand.hidden = true;
    openTurnConfirmation();
  });

  function openUnitMenu(unit) {
    selectedUnit = unit;
    cursor.x = unit.x;
    cursor.y = unit.y;
    rangeMode = null;
    if (currentSide === 'enemy' && unit.side === 'enemy') {
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      scrollToCursor();
      return;
    }
    if (unit.side !== currentSide) {
      unitCommand.hidden = true;
      showUnitStatus(unit, false);
      scrollToCursor();
      return;
    }
    statusFromCommand = false;
    unitStatus.hidden = true;
    menuSelectionIndex = 0;
    unitCommand.hidden = false;
    updateMenuSelection();
    scrollToCursor();
  }

  function chooseUnitAction(action) {
    if (!selectedUnit || isGameOver || isCombatResolving || explosionEffects.length) return;
    if (action === 'status') {
      showUnitStatus(selectedUnit, true);
      scrollToCursor();
      canvas.focus();
      return;
    }
    if (selectedUnit.side !== currentSide || selectedUnit.ended) return;
    if (action === 'end') {
      unitCommand.hidden = true;
      rangeMode = null;
      if (pendingMove?.unit === selectedUnit) pendingMove = null;
      selectedUnit.ended = true;
      checkUnitCompletion(selectedUnit);
      canvas.focus();
      return;
    }
    if (action === 'move' && selectedUnit.moveUsed) return;
    if (action === 'attack' && selectedUnit.attackUsed) return;
    if (action !== 'move' && action !== 'attack') return;
    emptyCommand.hidden = true;
    rangeMode = action;
    unitCommand.hidden = true;
    cursor.x = selectedUnit.x;
    cursor.y = selectedUnit.y;
    scrollToCursor();
    canvas.focus();
  }

  function updateMenuSelection() {
    const buttons = unitCommand.querySelectorAll('button');
    if (selectedUnit) {
      const canAct = selectedUnit.side === currentSide && !selectedUnit.ended;
      buttons[0].textContent = selectedUnit.moveUsed ? '移動済み' : selectedUnit.ended ? '移動せず終了' : '移動';
      buttons[1].textContent = selectedUnit.attackUsed ? '攻撃済み' : selectedUnit.ended ? '攻撃せず終了' : '攻撃';
      buttons[3].textContent = selectedUnit.ended ? '行動終了済み' : '行動終了';
      buttons[0].disabled = !canAct || selectedUnit.moveUsed;
      buttons[1].disabled = !canAct || selectedUnit.attackUsed;
      buttons[2].disabled = false;
      buttons[3].disabled = !canAct;
    }
    const available = [...buttons].map((button, index) => index).filter((index) => !buttons[index].disabled);
    if (!available.includes(menuSelectionIndex)) menuSelectionIndex = available[0] ?? 0;
    buttons.forEach((button, index) => {
      button.classList.toggle('selected', index === menuSelectionIndex && !button.disabled);
      button.setAttribute('aria-pressed', String(index === menuSelectionIndex));
    });
  }

  function showUnitStatus(unit, fromCommand) {
    statusFromCommand = fromCommand;
    unitCommand.hidden = true;
    unitStatus.innerHTML = `<div class="status-title">${unit.id} <span class="status-side">${unit.side === 'player' ? 'PC' : 'EN'}</span></div>
      <div>HP：${unit.hp} / ${unit.maxHp}</div>
      <div>移動力：${unit.moveRange}</div>
      <div>射程：${unit.minAttackRange === unit.attackRange ? unit.attackRange : `${unit.minAttackRange}～${unit.attackRange}`}</div>
      <div>攻撃力：${unit.attackPower}</div>
      <div>回避：${unit.evasion}</div>
      <div>命中補正：${unit.hitBonus}</div>`;
    unitStatus.hidden = false;
  }

  function updatePhaseLabel() {
    phaseLabel.textContent = `${currentSide === 'player' ? 'プレイヤー' : 'エネミー'}ターン：${toFullWidthNumber(sideTurnCounts[currentSide])}`;
  }

  function setBgm(filename) {
    if (currentBgm === filename) return;
    currentBgm = filename;
    if (phaseInputLocked) return;
    fadeOutBgm().then(() => {
      if (phaseInputLocked || currentBgm !== filename) return;
      startCurrentBgm();
    });
  }

  function fadeOutBgm(duration = 700) {
    const transitionId = ++bgmTransitionId;
    if (bgmAudio.paused || !loadedBgm) return Promise.resolve();
    const startVolume = bgmAudio.volume;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      function fadeFrame(now) {
        if (transitionId !== bgmTransitionId) {
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        bgmAudio.volume = startVolume * (1 - progress);
        if (progress >= 1) {
          bgmAudio.pause();
          bgmAudio.volume = bgmVolume;
          resolve();
          return;
        }
        requestAnimationFrame(fadeFrame);
      }
      requestAnimationFrame(fadeFrame);
    });
  }

  function startCurrentBgm() {
    if (!audioUnlocked || phaseInputLocked || !currentBgm) return;
    if (loadedBgm !== currentBgm) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      bgmAudio.src = `Sound/${currentBgm}`;
      loadedBgm = currentBgm;
    }
    bgmAudio.volume = bgmVolume;
    bgmAudio.play().catch(() => {});
  }

  function playPhaseBgm() {
    setBgm(currentSide === 'player' ? 'M002_PC_turn.mp3' : 'M003_EN_turn.mp3');
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    startCurrentBgm();
  }

  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  audioStartScreen.addEventListener('click', async () => {
    if (titleOpening) return;
    titleOpening = true;
    audioUnlocked = true;
    startCurrentBgm();
    audioStartScreen.classList.add('fade-text');
    await wait(1000);
    audioStartScreen.classList.add('reveal');
    await wait(2000);
    audioStartScreen.hidden = true;
    titleScreen.classList.add('menu-visible');
    titleOpening = false;
    titleIntroComplete = true;
  });

  titleScreen.addEventListener('click', (event) => {
    if (titleOpening || !titleIntroComplete) return;
    const button = event.target.closest('[data-title-action]');
    if (!button || titleTransitioning) return;
    titleSelection = titleOptions.indexOf(button);
    updateTitleSelection();
    if (button.dataset.titleAction === 'new') startNewGame();
  });

  gameResult.addEventListener('click', () => {
    if (clearPromptReady && !clearTransitioning) showClearStory();
  });

  window.addEventListener('keydown', (event) => {
    if (!clearPromptReady || clearTransitioning) return;
    event.preventDefault();
    showClearStory();
  });

  window.addEventListener('keydown', (event) => {
    if (titleScreen.hidden) return;
    if (titleOpening || !titleIntroComplete) {
      event.preventDefault();
      return;
    }
    if (titleTransitioning) {
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      titleSelection = 1 - titleSelection;
      updateTitleSelection();
      return;
    }
    const confirmKey = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'x';
    if (!confirmKey) return;
    event.preventDefault();
    if (titleOptions[titleSelection]?.dataset.titleAction === 'new') startNewGame();
  });

  function updateTitleSelection() {
    titleOptions.forEach((button, index) => {
      button.classList.toggle('selected', index === titleSelection);
      button.setAttribute('aria-current', index === titleSelection ? 'true' : 'false');
    });
  }

  async function startNewGame() {
    if (titleTransitioning) return;
    titleTransitioning = true;
    isClearStory = false;
    introEventImage.src = introImageSource;
    storyStart.textContent = '\u300aGame Start\u300b';
    titleScreen.classList.add('fade-out');
    fadeOutBgm();
    await Promise.all([playSe('shot_pc1.mp3'), wait(750)]);
    titleScreen.hidden = true;
    introEvent.hidden = false;
    playIntroStory();
  }

  async function playIntroStory() {
    const story = '『サンプル』\nレジスタンスに助けられたヒロイン。\n彼女はレジスタンスに加入し、人類の復権のために戦う。\n敵は人類に牙を剥いたロボット軍団。\n「弟…絶対に見つけ出すからね！\nそれまで、お姉ちゃんは負けないから！」\n\n●勝利条件　敵ロボットの全滅\n●敗北条件　味方の全滅';
    storyText.textContent = '';
    storyStart.disabled = true;
    for (const character of Array.from(story)) {
      storyText.textContent += character;
      storyText.scrollTop = storyText.scrollHeight;
      await wait(32);
    }
    storyStart.disabled = false;
  }

  async function playClearStory() {
    isClearStory = true;
    introEventImage.src = 'Unit/Event_01_ED.png';
    storyStart.textContent = '\u300aClick to Top\u300b';
    storyText.textContent = '';
    storyStart.disabled = true;
    const story = '\u300e\u30b5\u30f3\u30d7\u30eb\u300f\n\u30ed\u30dc\u30c3\u30c8\u8ecd\u56e3\u3092\u6483\u7834\u3057\u305f\u30d2\u30ed\u30a4\u30f3\u305f\u3061\u3002\n\u3057\u3070\u3057\u306e\u4f11\u606f\u3092\u3068\u308b\u3002\n\u3060\u304c\u30ed\u30dc\u30c3\u30c8\u8ecd\u56e3\u306e\u6b21\u306e\u9b54\u306e\u624b\u304c\u8feb\u3063\u3066\u3044\u305f\u2026\u2026';
    for (const character of Array.from(story)) {
      storyText.textContent += character;
      storyText.scrollTop = storyText.scrollHeight;
      await wait(32);
    }
    storyStart.disabled = false;
  }

  async function showClearStory() {
    clearTransitioning = true;
    gameResult.classList.add('fade-out');
    await wait(700);
    gameShell.hidden = true;
    gameResult.hidden = true;
    introEvent.hidden = false;
    playClearStory();
  }

  async function returnToTitle() {
    introEvent.classList.add('fade-out');
    await wait(700);
    introEvent.hidden = true;
    introEvent.classList.remove('fade-out');
    isClearStory = false;
    titleScreen.hidden = false;
    titleScreen.classList.remove('fade-out');
    titleScreen.classList.add('menu-visible');
    titleTransitioning = false;
    titleIntroComplete = true;
    clearTransitioning = false;
    clearPromptReady = false;
    setBgm('M001_Title.mp3');
  }

  storyStart.addEventListener('click', () => {
    if (isClearStory) returnToTitle();
    else enterStage();
  });

  function enterStage() {
    introEvent.hidden = true;
    gameShell.hidden = false;
    updatePhaseLabel();
    announceCurrentTurn();
    playPhaseBgm();
    draw();
    canvas.focus();
  }

  function announceCurrentTurn() {
    phaseInputLocked = true;
    fadeOutBgm();
    phaseAnnouncement.textContent = `${currentSide === 'player' ? 'プレイヤー' : 'エネミー'}ターン：${toFullWidthNumber(sideTurnCounts[currentSide])}`;
    phaseAnnouncement.hidden = false;
    window.clearTimeout(phaseAnnouncementTimer);
    phaseAnnouncementTimer = window.setTimeout(() => {
      phaseAnnouncement.hidden = true;
      phaseInputLocked = false;
      startCurrentBgm();
    }, 2000);
  }

  function toFullWidthNumber(number) {
    return String(number).replace(/[0-9]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) + 0xFEE0));
  }

  function checkUnitCompletion(unit) {
    if (isGameOver) return;
    if (unit.moveUsed && unit.attackUsed) unit.ended = true;
    updateMenuSelection();
    if (allCurrentUnitsEnded() && currentSide === 'player') openTurnConfirmation();
  }

  function allCurrentUnitsEnded() {
    const activeUnits = units.filter((candidate) => candidate.side === currentSide);
    return activeUnits.length > 0 && activeUnits.every((candidate) => candidate.ended);
  }

  function openTurnConfirmation() {
    if (isGameOver) return;
    turnConfirmSelection = 0;
    turnConfirm.hidden = false;
    emptyCommand.hidden = true;
    updateTurnConfirmSelection();
    canvas.focus();
  }

  function updateTurnConfirmSelection() {
    turnConfirm.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === turnConfirmSelection);
    });
  }

  function answerTurnConfirmation(yes) {
    turnConfirm.hidden = true;
    if (!yes) {
      canvas.focus();
      return;
    }

    sideTurnCounts[currentSide]++;
    currentSide = currentSide === 'player' ? 'enemy' : 'player';
    pendingMove = null;
    for (const unit of units) {
      if (unit.side === currentSide) {
        unit.moveUsed = false;
        unit.attackUsed = false;
        unit.ended = false;
      }
    }
    selectedUnit = null;
    rangeMode = null;
    statusFromCommand = false;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    updatePhaseLabel();
    announceCurrentTurn();
    playPhaseBgm();
    draw();
    canvas.focus();
    if (currentSide === 'enemy') runEnemyTurn();
  }

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  async function runEnemyTurn() {
    if (isGameOver || currentSide !== 'enemy' || isEnemyAiRunning) return;
    isEnemyAiRunning = true;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    await wait(700);

    for (const enemy of units.filter((unit) => unit.side === 'enemy' && !unit.ended)) {
      if (isGameOver || currentSide !== 'enemy') break;
      selectedUnit = enemy;
      cursor.x = enemy.x;
      cursor.y = enemy.y;
      scrollToCursor();
      await wait(400);

      const target = findNearestOpponent(enemy);
      if (target) {
        cursor.x = target.x;
        cursor.y = target.y;
        scrollToCursor();
        await wait(350);

        let attackTarget = findOpponentInRange(enemy);
        if (!attackTarget && !enemy.moveUsed) {
          const destination = chooseApproachTile(enemy, target);
          if (destination) {
            enemy.moveUsed = true;
            enemyRangePreview = { unit: enemy, mode: 'move' };
            draw();
            await wait(450);
            await new Promise((resolve) => animateUnitMove(enemy, getMovePath(enemy, destination.x, destination.y), resolve));
            enemyRangePreview = null;
            draw();
            cursor.x = target.x;
            cursor.y = target.y;
            scrollToCursor();
            await wait(250);
            attackTarget = findOpponentInRange(enemy);
          }
        }

        if (attackTarget && !enemy.attackUsed) {
          cursor.x = enemy.x;
          cursor.y = enemy.y;
          scrollToCursor();
          await wait(250);
          cursor.x = attackTarget.x;
          cursor.y = attackTarget.y;
          scrollToCursor();
          await wait(350);
          selectedUnit = enemy;
          rangeMode = 'attack';
          enemyRangePreview = { unit: enemy, mode: 'attack', target: attackTarget };
          draw();
          await wait(300);
          await tryAttackTarget(attackTarget);
          await wait(300);
        }
      }

      enemy.ended = true;
      checkUnitCompletion(enemy);
      if (!isGameOver) await wait(350);
    }

    if (!isGameOver && currentSide === 'enemy' && allCurrentUnitsEnded()) {
      phaseAnnouncement.textContent = 'エネミーターン終了！';
      phaseAnnouncement.hidden = false;
      fadeOutBgm();
      window.clearTimeout(phaseAnnouncementTimer);
      await wait(1000);

      sideTurnCounts.enemy++;
      currentSide = 'player';
      for (const unit of units) {
        if (unit.side === currentSide) {
          unit.moveUsed = false;
          unit.attackUsed = false;
          unit.ended = false;
        }
      }
      updatePhaseLabel();
      announceCurrentTurn();
      playPhaseBgm();
    }

    isEnemyAiRunning = false;
    selectedUnit = null;
    rangeMode = null;
    enemyRangePreview = null;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    draw();
  }

  function findNearestOpponent(unit) {
    return units
      .filter((candidate) => candidate.side !== unit.side)
      .sort((a, b) => manhattanDistance(unit, a) - manhattanDistance(unit, b))[0] ?? null;
  }

  function findOpponentInRange(unit) {
    return units
      .filter((candidate) => candidate.side !== unit.side && isWithinAttackRange(unit, manhattanDistance(unit, candidate)))
      .sort((a, b) => manhattanDistance(unit, a) - manhattanDistance(unit, b))[0] ?? null;
  }

  function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function isWithinAttackRange(unit, distance) {
    return distance >= unit.minAttackRange && distance <= unit.attackRange;
  }

  function chooseApproachTile(unit, target) {
    const distances = getMoveDistances(unit);
    const candidates = [...distances.entries()]
      .map(([key, distance]) => {
        const [x, y] = key.split(',').map(Number);
        const targetDistance = Math.abs(x - target.x) + Math.abs(y - target.y);
        const remaining = targetDistance < unit.minAttackRange
          ? unit.minAttackRange - targetDistance
          : targetDistance > unit.attackRange ? targetDistance - unit.attackRange : 0;
        return { x, y, distance, remaining };
      })
      .filter((tile) => tile.distance > 0 && tile.distance <= unit.moveRange &&
        !isObstacleAt(tile.x, tile.y) &&
        !units.some((occupant) => occupant !== unit && occupant.x === tile.x && occupant.y === tile.y))
      .sort((a, b) => a.remaining - b.remaining || a.distance - b.distance);
    const best = candidates[0];
    const currentDistance = manhattanDistance(unit, target);
    const currentRemaining = currentDistance < unit.minAttackRange
      ? unit.minAttackRange - currentDistance
      : currentDistance > unit.attackRange ? currentDistance - unit.attackRange : 0;
    if (!best || best.remaining >= currentRemaining) return null;
    return best;
  }

  function activateCurrentTile() {
    if (!emptyCommand.hidden) {
      emptyCommand.hidden = true;
      openTurnConfirmation();
      return;
    }
    emptyCommand.hidden = true;
    if (!unitCommand.hidden) {
      const action = unitCommand.querySelectorAll('button')[menuSelectionIndex]?.dataset.action;
      chooseUnitAction(action);
      return;
    }

    const unit = units.find((candidate) => candidate.x === cursor.x && candidate.y === cursor.y);
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && unit === selectedUnit) {
        commitPendingMove();
        return;
      }
      if (unit) tryAttackTarget(unit);
      return;
    }
    if (unit) {
      openUnitMenu(unit);
      return;
    }

    if (rangeMode === 'move' && selectedUnit) {
      moveSelectedUnitTo(cursor.x, cursor.y);
      return;
    }
  }

  async function tryAttackTarget(target) {
    if (!selectedUnit || rangeMode !== 'attack' || target.side === selectedUnit.side) return false;
    const distance = Math.abs(target.x - selectedUnit.x) + Math.abs(target.y - selectedUnit.y);
    if (!isWithinAttackRange(selectedUnit, distance)) return false;

    const attacker = selectedUnit;
    isCombatResolving = true;
    pendingMove = null;
    rangeMode = null;
    cursor.x = target.x;
    cursor.y = target.y;
    attacker.attackUsed = true;
    try {
      attackMessage.hidden = true;
      await jumpUnit(attacker);
      const attackSound = playSe(getAttackSe(attacker));
      if (attacker.side === 'enemy') {
        window.setTimeout(() => {
          if (enemyRangePreview?.unit === attacker && enemyRangePreview.mode === 'attack') {
            enemyRangePreview = null;
            draw();
          }
        }, 500);
      }
      await attackSound;

      const roll = Math.floor(Math.random() * 10);
      const hitMargin = roll - target.evasion + attacker.hitBonus;
      if (hitMargin >= 1) {
        target.hp -= attacker.attackPower;
        const defeated = target.hp <= 0;
        if (defeated) {
          target.hp = 0;
          showAttackMessage(`${attacker.id} → ${target.id}：撃破！`, 2400);
        } else {
          showAttackMessage(`${attacker.id} → ${target.id}：攻撃成功！ -${attacker.attackPower}`);
        }

        await shakeUnit(target);
        if (defeated) {
          const explosionDone = startExplosion(target);
          units.splice(units.indexOf(target), 1);
          const deathSe = target.side === 'player' ? 'dead_pc.mp3' : 'dead_en.mp3';
          await Promise.all([explosionDone, playSe(deathSe)]);
          checkGameEnd();
        }
      } else {
        showAttackMessage(`${attacker.id} → ${target.id}：回避！`);
      }

      checkUnitCompletion(attacker);
      scrollToCursor();
      return true;
    } finally {
      isCombatResolving = false;
    }
  }

  function getAttackSe(unit) {
    const seNames = {
      PC01: 'shot_pc1.mp3',
      PC02: 'shot_pc2.mp3',
      PC03: 'shot_pc3.mp3',
      EN01: 'shot_en1.mp3',
      EN02: 'shot_en1.mp3',
    };
    return seNames[unit.id];
  }

  function showAttackMessage(message, duration = 1200) {
    attackMessage.textContent = message;
    attackMessage.hidden = false;
    window.clearTimeout(attackMessageTimer);
    attackMessageTimer = window.setTimeout(() => {
      attackMessage.hidden = true;
    }, duration);
  }

  function shakeUnit(unit, duration = 700) {
    const startedAt = performance.now();
    return new Promise((resolve) => {
      function shakeFrame(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const amplitude = 4 * (1 - progress);
        unit.visualOffsetX = Math.sin(progress * Math.PI * 2 * 8) * amplitude;
        draw();
        if (progress >= 1) {
          delete unit.visualOffsetX;
          draw();
          resolve();
          return;
        }
        requestAnimationFrame(shakeFrame);
      }
      requestAnimationFrame(shakeFrame);
    });
  }

  function jumpUnit(unit, duration = 200) {
    const startedAt = performance.now();
    return new Promise((resolve) => {
      function jumpFrame(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        if (progress < 0.25) {
          unit.visualOffsetY = -5 * (progress / 0.25);
        } else if (progress < 0.7) {
          unit.visualOffsetY = -5 + 10 * ((progress - 0.25) / 0.45);
        } else {
          unit.visualOffsetY = 5 * (1 - (progress - 0.7) / 0.3);
        }
        draw();
        if (progress >= 1) {
          delete unit.visualOffsetY;
          draw();
          resolve();
          return;
        }
        requestAnimationFrame(jumpFrame);
      }
      requestAnimationFrame(jumpFrame);
    });
  }

  function playSe(filename) {
    if (!filename) return Promise.resolve();
    const audio = new Audio(`SE/${filename}`);
    audio.volume = 0.8;
    return new Promise((resolve) => {
      const finish = () => resolve();
      audio.addEventListener('ended', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      audio.play().catch(finish);
    });
  }

  function checkGameEnd() {
    const playerCount = units.filter((unit) => unit.side === 'player').length;
    const enemyCount = units.filter((unit) => unit.side === 'enemy').length;
    const result = enemyCount === 0 ? 'ステージクリア' : playerCount === 0 ? 'ゲームオーバー' : '';
    if (!result) return;
    if (explosionEffects.length) pendingGameResult = result;
    else finishGame(result);
  }

  function startExplosion(unit) {
    const effect = { unit, x: unit.x, y: unit.y, startedAt: performance.now() };
    explosionEffects.push(effect);

    return new Promise((resolve) => {
      function animate(now) {
        if (now - effect.startedAt >= explosionFrameDuration * explosionFrameCount) {
          explosionEffects.splice(explosionEffects.indexOf(effect), 1);
          draw();
          if (!explosionEffects.length && pendingGameResult) {
            const result = pendingGameResult;
            pendingGameResult = '';
            finishGame(result);
          }
          resolve();
          return;
        }
        draw();
        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  function finishGame(message) {
    isGameOver = true;
    setBgm(message === 'ステージクリア' ? 'M005_Result.mp3' : 'M006_Event.mp3');
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    turnConfirm.hidden = true;
    rangeMode = null;
    gameResult.textContent = message;
    gameResult.classList.remove('fade-out', 'show-next');
    gameResult.hidden = false;
    if (message === '\u30b9\u30c6\u30fc\u30b8\u30af\u30ea\u30a2') {
      clearPromptReady = false;
      window.setTimeout(() => {
        if (gameResult.hidden) return;
        clearPromptReady = true;
        gameResult.classList.add('show-next');
      }, 4000);
    }
  }

  function moveSelectedUnitTo(x, y) {
    if (!selectedUnit || rangeMode !== 'move') return;
    const distance = getMoveDistances(selectedUnit).get(`${x},${y}`);
    const occupied = isObstacleAt(x, y) || units.some((unit) => unit !== selectedUnit && unit.x === x && unit.y === y);
    if (distance === undefined || distance > selectedUnit.moveRange || occupied) return;
    const path = getMovePath(selectedUnit, x, y);
    if (path.length < 2) return;
    pendingMove = { unit: selectedUnit, x: selectedUnit.x, y: selectedUnit.y };
    selectedUnit.moveUsed = true;
    rangeMode = null;
    emptyCommand.hidden = true;
    animateUnitMove(selectedUnit, path);
    scrollToCursor();
  }

  function enterAttackModeIfTargetInRange(unit) {
    if (unit.side !== currentSide || unit.ended || unit.attackUsed) return false;
    const targetInRange = units.some((target) =>
      target.side !== unit.side &&
      isWithinAttackRange(unit, Math.abs(target.x - unit.x) + Math.abs(target.y - unit.y))
    );
    if (!targetInRange) return false;

    selectedUnit = unit;
    rangeMode = 'attack';
    emptyCommand.hidden = true;
    cursor.x = unit.x;
    cursor.y = unit.y;
    scrollToCursor();
    return true;
  }

  function cancelCurrentAction() {
    if (!emptyCommand.hidden) {
      emptyCommand.hidden = true;
      canvas.focus();
      return;
    }
    if (!unitStatus.hidden) {
      unitStatus.hidden = true;
      if (statusFromCommand && selectedUnit?.side === currentSide) {
        unitCommand.hidden = false;
        menuSelectionIndex = 0;
        updateMenuSelection();
      }
      statusFromCommand = false;
      scrollToCursor();
      canvas.focus();
      return;
    }
    if (!unitCommand.hidden) {
      unitCommand.hidden = true;
      rangeMode = null;
      scrollToCursor();
      canvas.focus();
      return;
    }
    if (rangeMode) {
      if (rangeMode === 'attack' && pendingMove?.unit === selectedUnit) {
        rollbackPendingMove();
        canvas.focus();
        return;
      }
      rangeMode = null;
      if (selectedUnit) {
        cursor.x = selectedUnit.x;
        cursor.y = selectedUnit.y;
      }
      scrollToCursor();
      canvas.focus();
    }
  }

  function rollbackPendingMove() {
    if (!pendingMove) return;
    const { unit, x, y } = pendingMove;
    unit.x = x;
    unit.y = y;
    delete unit.visualX;
    delete unit.visualY;
    unit.moveUsed = false;
    pendingMove = null;
    selectedUnit = unit;
    rangeMode = 'move';
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    cursor.x = x;
    cursor.y = y;
    scrollToCursor();
  }

  function commitPendingMove() {
    if (!pendingMove) return;
    const unit = pendingMove.unit;
    pendingMove = null;
    rangeMode = null;
    openUnitMenu(unit);
  }

  // Deterministic placeholder terrain: subtle patches make the grid easier to read.
  function tileColor(x, y) {
    const patch = (Math.floor(x / 4) + Math.floor(y / 4)) % 2;
    const variation = (x * 17 + y * 31) % 5;
    const greens = ['#34483a', '#374b3d', '#394d3f', '#3b4f41', '#3d5143'];
    return patch ? greens[variation] : ['#314538', '#34483b', '#364a3d', '#384c3f', '#3a4e41'][variation];
  }

  function getMoveDistances(movingUnit) {
    const distances = new Map();
    const key = (x, y) => `${x},${y}`;
    const queue = [{ x: movingUnit.x, y: movingUnit.y }];
    distances.set(key(movingUnit.x, movingUnit.y), 0);

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      const nextDistance = distances.get(key(current.x, current.y)) + 1;
      if (nextDistance > movingUnit.moveRange) continue;

      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = current.x + dx;
        const y = current.y + dy;
        const nextKey = key(x, y);
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || distances.has(nextKey)) continue;

        if (isObstacleAt(x, y)) continue;
        const occupant = units.find((unit) => unit.x === x && unit.y === y);
        // Opposing units block movement; allies can be crossed but not occupied as a destination.
        if (occupant && occupant.side !== movingUnit.side) continue;
        distances.set(nextKey, nextDistance);
        queue.push({ x, y });
      }
    }
    return distances;
  }

  function getMovePath(movingUnit, targetX, targetY) {
    const key = (x, y) => `${x},${y}`;
    const startKey = key(movingUnit.x, movingUnit.y);
    const targetKey = key(targetX, targetY);
    const previous = new Map([[startKey, null]]);
    const queue = [{ x: movingUnit.x, y: movingUnit.y }];

    for (let index = 0; index < queue.length && !previous.has(targetKey); index++) {
      const current = queue[index];
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = current.x + dx;
        const y = current.y + dy;
        const nextKey = key(x, y);
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || previous.has(nextKey)) continue;
        if (isObstacleAt(x, y)) continue;
        const occupant = units.find((unit) => unit.x === x && unit.y === y);
        if (occupant && occupant.side !== movingUnit.side) continue;
        previous.set(nextKey, key(current.x, current.y));
        queue.push({ x, y });
      }
    }

    if (!previous.has(targetKey)) return [];
    const path = [];
    let stepKey = targetKey;
    let remaining = MAP_SIZE * MAP_SIZE;
    while (stepKey !== null && remaining-- > 0) {
      if (!previous.has(stepKey)) return [];
      const [x, y] = stepKey.split(',').map(Number);
      path.unshift({ x, y });
      stepKey = previous.get(stepKey);
    }
    if (stepKey !== null || path[0]?.x !== movingUnit.x || path[0]?.y !== movingUnit.y) return [];
    return path;
  }

  function isObstacleAt(x, y) {
    return obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y);
  }

  function animateUnitMove(unit, path, onComplete = null) {
    if (path.length < 2) {
      onComplete?.();
      return;
    }
    isUnitMoving = true;
    let startedAt = null;
    const millisecondsPerTile = 150;

    function step(now) {
      if (startedAt === null) startedAt = now;
      const progress = (now - startedAt) / millisecondsPerTile;
      if (progress >= path.length - 1) {
        const destination = path[path.length - 1];
        unit.x = destination.x;
        unit.y = destination.y;
        delete unit.visualX;
        delete unit.visualY;
        isUnitMoving = false;
        if (onComplete) onComplete();
        else if (!enterAttackModeIfTargetInRange(unit)) checkUnitCompletion(unit);
        draw();
        return;
      }

      const segment = Math.floor(progress);
      const fraction = progress - segment;
      const from = path[segment];
      const to = path[segment + 1];
      unit.visualX = from.x + (to.x - from.x) * fraction;
      unit.visualY = from.y + (to.y - from.y) * fraction;
      draw();
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function scrollToCursor() {
    cameraTarget.x = Math.max(0, Math.min(MAP_SIZE - VIEW_WIDTH, cursor.x - Math.floor(VIEW_WIDTH / 2)));
    cameraTarget.y = Math.max(0, Math.min(MAP_SIZE - VIEW_HEIGHT, cursor.y - Math.floor(VIEW_HEIGHT / 2)));
    draw();
    if (!cameraFrame && (Math.abs(camera.x - cameraTarget.x) > 0.01 || Math.abs(camera.y - cameraTarget.y) > 0.01)) {
      cameraFrame = requestAnimationFrame(animateCamera);
    }
  }

  function animateCamera() {
    camera.x += (cameraTarget.x - camera.x) * 0.16;
    camera.y += (cameraTarget.y - camera.y) * 0.16;
    if (Math.abs(camera.x - cameraTarget.x) < 0.01) camera.x = cameraTarget.x;
    if (Math.abs(camera.y - cameraTarget.y) < 0.01) camera.y = cameraTarget.y;
    draw();
    if (camera.x !== cameraTarget.x || camera.y !== cameraTarget.y) {
      cameraFrame = requestAnimationFrame(animateCamera);
    } else {
      cameraFrame = 0;
    }
  }

  function draw() {
    const moveRangeUnit = enemyRangePreview?.mode === 'move'
      ? enemyRangePreview.unit
      : rangeMode === 'move' ? selectedUnit : null;
    const attackRangeUnit = enemyRangePreview?.mode === 'attack'
      ? enemyRangePreview.unit
      : rangeMode === 'attack' ? selectedUnit : null;
    const moveDistances = moveRangeUnit ? getMoveDistances(moveRangeUnit) : null;

    ctx.clearRect(0, 0, VIEW_PIXEL_WIDTH, VIEW_PIXEL_HEIGHT);
    const firstMapX = Math.floor(camera.x);
    const firstMapY = Math.floor(camera.y);
    for (let mapY = firstMapY; mapY < firstMapY + VIEW_HEIGHT + 1; mapY++) {
      for (let mapX = firstMapX; mapX < firstMapX + VIEW_WIDTH + 1; mapX++) {
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) continue;
        const screenX = (mapX - camera.x) * TILE_SIZE;
        const screenY = (mapY - camera.y) * TILE_SIZE;
        ctx.fillStyle = tileColor(mapX, mapY);
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        const occupiedByOther = isObstacleAt(mapX, mapY) || units.some((unit) => unit !== moveRangeUnit && unit.x === mapX && unit.y === mapY);
        const moveDistance = moveDistances?.get(`${mapX},${mapY}`);
        const inMoveRange = moveRangeUnit && moveDistance > 0 && !occupiedByOther;
        const attackDistance = attackRangeUnit ? Math.abs(mapX - attackRangeUnit.x) + Math.abs(mapY - attackRangeUnit.y) : 0;
        const inAttackRange = attackRangeUnit && isWithinAttackRange(attackRangeUnit, attackDistance);
        if (inMoveRange || inAttackRange) {
          ctx.fillStyle = inAttackRange
            ? 'rgba(237, 112, 91, 0.54)'
            : moveRangeUnit.side === 'enemy' ? 'rgba(108, 174, 244, 0.52)' : 'rgba(227, 231, 154, 0.48)';
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        ctx.strokeStyle = '#1d2c23';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    // Draw obstacles first so units remain visible if a tile is shared accidentally.
    for (const obstacle of obstacles) {
      if (obstacle.image.complete && obstacle.image.naturalWidth > 0 &&
          obstacle.x >= camera.x && obstacle.x < camera.x + VIEW_WIDTH &&
          obstacle.y >= camera.y && obstacle.y < camera.y + VIEW_HEIGHT) {
        ctx.drawImage(obstacle.image, (obstacle.x - camera.x) * TILE_SIZE, (obstacle.y - camera.y) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw units at their current map coordinates.
    for (const unit of units) {
      const unitX = unit.visualX ?? unit.x;
      const unitY = unit.visualY ?? unit.y;
      const screenX = (unitX - camera.x) * TILE_SIZE + (unit.visualOffsetX ?? 0);
      const screenY = (unitY - camera.y) * TILE_SIZE + (unit.visualOffsetY ?? 0);
      if (unit.image.complete && unit.image.naturalWidth > 0 &&
          unitX >= camera.x && unitX < camera.x + VIEW_WIDTH &&
          unitY >= camera.y && unitY < camera.y + VIEW_HEIGHT) {
        ctx.drawImage(unit.image, screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
      if (enemyRangePreview?.mode === 'attack' && unit === enemyRangePreview.target &&
          unitX >= camera.x && unitX < camera.x + VIEW_WIDTH &&
          unitY >= camera.y && unitY < camera.y + VIEW_HEIGHT) {
        ctx.save();
        ctx.strokeStyle = '#fff3a6';
        ctx.lineWidth = 4;
        ctx.strokeRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 7, screenY + 7, TILE_SIZE - 14, TILE_SIZE - 14);
        ctx.restore();
      }
    }

    for (const effect of explosionEffects) {
      const frame = Math.min(explosionFrameCount - 1, Math.floor((performance.now() - effect.startedAt) / explosionFrameDuration));
      const screenX = (effect.x - camera.x) * TILE_SIZE;
      const screenY = (effect.y - camera.y) * TILE_SIZE;
      if (screenX < -TILE_SIZE || screenX > VIEW_PIXEL_WIDTH || screenY < -TILE_SIZE || screenY > VIEW_PIXEL_HEIGHT) continue;

      // Keep the defeated unit visible beneath the first four explosion frames.
      if (frame < 4 && effect.unit.image.complete && effect.unit.image.naturalWidth > 0) {
        ctx.drawImage(effect.unit.image, screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
      if (explosionImage.complete && explosionImage.naturalWidth > 0) {
        const frameWidth = explosionImage.naturalWidth / 4;
        const frameHeight = explosionImage.naturalHeight / 2;
        const sourceX = (frame % 4) * frameWidth;
        const sourceY = Math.floor(frame / 4) * frameHeight;
        ctx.drawImage(explosionImage, sourceX, sourceY, frameWidth, frameHeight, screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    // Small coordinate marks along the top and left edges identify the visible map area.
    ctx.fillStyle = '#c0cdbf';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = firstMapX; x < firstMapX + VIEW_WIDTH + 1; x++) {
      const screenX = (x - camera.x) * TILE_SIZE;
      if (x >= 0 && x < MAP_SIZE && x % 2 === 0) ctx.fillText(String(x + 1), screenX + TILE_SIZE / 2, 6);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let y = firstMapY; y < firstMapY + VIEW_HEIGHT + 1; y++) {
      const screenY = (y - camera.y) * TILE_SIZE;
      if (y >= 0 && y < MAP_SIZE && y % 2 === 0) ctx.fillText(String(y + 1), 5, screenY + TILE_SIZE / 2);
    }

    const cursorX = (cursor.x - camera.x) * TILE_SIZE;
    const cursorY = (cursor.y - camera.y) * TILE_SIZE;
    const cursorColor = enemyRangePreview?.mode === 'attack' &&
      enemyRangePreview.target?.x === cursor.x && enemyRangePreview.target?.y === cursor.y
      ? '#f04444'
      : '#f1d978';
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(cursorX + 4, cursorY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = cursorColor;
    ctx.fillRect(cursorX + 4, cursorY + 4, 12, 4);
    ctx.fillRect(cursorX + 4, cursorY + 4, 4, 12);
    ctx.fillRect(cursorX + TILE_SIZE - 16, cursorY + 4, 12, 4);
    ctx.fillRect(cursorX + TILE_SIZE - 8, cursorY + 4, 4, 12);
    ctx.fillRect(cursorX + 4, cursorY + TILE_SIZE - 8, 12, 4);
    ctx.fillRect(cursorX + 4, cursorY + TILE_SIZE - 16, 4, 12);
    ctx.fillRect(cursorX + TILE_SIZE - 16, cursorY + TILE_SIZE - 8, 12, 4);
    ctx.fillRect(cursorX + TILE_SIZE - 8, cursorY + TILE_SIZE - 16, 4, 12);

    coordinates.textContent = `X ${cursor.x + 1}, Y ${cursor.y + 1}`;
    if (!unitCommand.hidden && selectedUnit) {
      positionPanel(unitCommand, selectedUnit);
    }
    if (!unitStatus.hidden && selectedUnit) positionPanel(unitStatus, selectedUnit);
    if (!emptyCommand.hidden) positionPanel(emptyCommand, cursor);
  }

  function positionPanel(panel, unit) {
    const bounds = canvas.getBoundingClientRect();
    const frameBounds = canvas.parentElement.getBoundingClientRect();
    panel.style.left = `${(bounds.left - frameBounds.left) + (unit.x - camera.x + 0.5) * bounds.width / VIEW_WIDTH}px`;
    panel.style.top = `${(bounds.top - frameBounds.top) + (unit.y - camera.y + 0.5) * bounds.height / VIEW_HEIGHT}px`;
  }

  const directions = {
    ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
  };

  canvas.addEventListener('keydown', (event) => {
    if (isGameOver || isEnemyAiRunning || isCombatResolving || explosionEffects.length || phaseInputLocked) return;
    if (isUnitMoving) return;

    if (!turnConfirm.hidden) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        turnConfirmSelection = 1 - turnConfirmSelection;
        updateTurnConfirmSelection();
        return;
      }
      const confirmKey = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'x';
      if (confirmKey) {
        event.preventDefault();
        answerTurnConfirmation(turnConfirmSelection === 0);
        return;
      }
      if (event.key === 'Escape' || event.key.toLowerCase() === 'z') {
        event.preventDefault();
        answerTurnConfirmation(false);
        return;
      }
    }

    const key = event.key.toLowerCase();
    if (event.key === 'Escape' || key === 'z') {
      event.preventDefault();
      cancelCurrentAction();
      return;
    }

    if (event.key === ' ' || event.key === 'Enter' || key === 'x') {
      event.preventDefault();
      activateCurrentTile();
      return;
    }

    if (!unitCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const change = event.key === 'ArrowDown' ? 1 : -1;
      const buttons = [...unitCommand.querySelectorAll('button')];
      let nextIndex = menuSelectionIndex;
      do {
        nextIndex = (nextIndex + change + buttons.length) % buttons.length;
      } while (buttons[nextIndex].disabled && nextIndex !== menuSelectionIndex);
      menuSelectionIndex = nextIndex;
      updateMenuSelection();
      return;
    }

    if (!unitCommand.hidden) return;
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    cursor.x = Math.max(0, Math.min(MAP_SIZE - 1, cursor.x + direction[0]));
    cursor.y = Math.max(0, Math.min(MAP_SIZE - 1, cursor.y + direction[1]));
    scrollToCursor();
  });

  updateTitleSelection();
  draw();
  setBgm('M001_Title.mp3');
})();

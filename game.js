(() => {
  const MAP_WIDTH = 20;
  const MAP_HEIGHT = 16;
  const TILE_SIZE = 64;
  const VIEW_WIDTH = 16;
  const VIEW_HEIGHT = 12;
  const VIEW_PIXEL_WIDTH = TILE_SIZE * VIEW_WIDTH;
  const VIEW_PIXEL_HEIGHT = TILE_SIZE * VIEW_HEIGHT;
  const canvas = document.querySelector('#map');
  const ctx = canvas.getContext('2d');
  const mapBackground = new Image();
  mapBackground.src = 'Unit/M001.png';
  const mapScrollbars = {
    x: document.querySelector('#map-scrollbar-x'),
    y: document.querySelector('#map-scrollbar-y'),
  };
  const passabilityLegend = document.querySelector('#passability-legend');
  const coordinates = document.querySelector('#coordinates');
  const unitCommand = document.querySelector('#unit-command');
  const moveConfirmCommand = document.querySelector('#move-confirm-command');
  const unitStatus = document.querySelector('#unit-status');
  const emptyCommand = document.querySelector('#empty-command');
  const attackMessage = document.querySelector('#attack-message');
  const phaseAnnouncement = document.querySelector('#phase-announcement');
  const gameResult = document.querySelector('#game-result');
  const gameResultMessage = document.querySelector('#game-result-message');
  const gameOverOptions = document.querySelector('#game-over-options');
  const touchControls = document.querySelector('#touch-controls');
  const cancelActionButton = document.querySelector('#cancel-action');
  const phaseLabel = document.querySelector('#phase-label');
  const turnConfirm = document.querySelector('#turn-confirm');
  const audioStartScreen = document.querySelector('#audio-start-screen');
  const titleScreen = document.querySelector('#title-screen');
  const introEvent = document.querySelector('#intro-event');
  const introEventImage = introEvent.querySelector('img');
  const introImageSource = introEventImage.getAttribute('src');
  const storyText = document.querySelector('#story-text');
  const storySpeaker = document.querySelector('#story-speaker');
  const storyWindow = introEvent.querySelector('.story-window');
  const storySkip = document.querySelector('#story-skip');
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
  let gameOverOptionsReady = false;
  let gameOverSelection = 0;
  let currentStoryText = '';
  let skipStoryReveal = false;
  let battleEventActive = false;
  let battleMessageResolve = null;
  let battleAttackEvents = new Map();
  const completedBattleEvents = new Set();

  const startCursor = { x: 9, y: 9 };
  const cursor = { ...startCursor };
  const initialCamera = {
    x: Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, startCursor.x - Math.floor(VIEW_WIDTH / 2))),
    y: Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, startCursor.y - Math.floor(VIEW_HEIGHT / 2))),
  };
  const camera = { ...initialCamera };
  const cameraTarget = { ...initialCamera };
  let cameraFrame = 0;
  let pointerGesture = null;
  let lastGestureDragged = false;
  const units = [
    { id: 'PC01', side: 'player', x: 2, y: 9, hp: 10, maxHp: 10, moveRange: 5, minAttackRange: 1, attackRange: 5, attackPower: 3, evasion: 5, hitBonus: 2, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'PC02', side: 'player', x: 3, y: 6, hp: 12, maxHp: 12, moveRange: 4, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 4, hitBonus: 1, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'PC03', side: 'player', x: 3, y: 12, hp: 25, maxHp: 25, moveRange: 4, minAttackRange: 2, attackRange: 6, attackPower: 6, evasion: 0, hitBonus: 1, moveUsed: false, attackUsed: false, ended: false, image: new Image() },
    { id: 'EN01', side: 'enemy', x: 14, y: 11, hp: 15, maxHp: 15, moveRange: 5, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, imageFile: 'EN02.png', spriteWidth: 128, spriteHeight: 128, image: new Image() },
    { id: 'EN02', side: 'enemy', x: 15, y: 13, hp: 13, maxHp: 13, moveRange: 4, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, imageFile: 'EN03.png', spriteWidth: 128, spriteHeight: 64, image: new Image() },
  ];
  const initialUnits = units.map((unit) => ({ ...unit }));
  const obstacles = [
    { id: 'OBJ01', x: 9, y: 15, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ02', x: 7, y: 10, imageFile: 'obstacles_01.png', image: new Image() },
    // { id: 'OBJ03', x: 10, y: 10, imageFile: 'obstacles_01.png', image: new Image() },
    // { id: 'OBJ04', x: 12, y: 10, imageFile: 'obstacles_01.png', image: new Image() },
    // { id: 'OBJ05', x: 5, y: 9, imageFile: 'obstacles_02.png', image: new Image() },
    // { id: 'OBJ06', x: 5, y: 10, imageFile: 'obstacles_02.png', image: new Image() },
    // { id: 'OBJ07', x: 8, y: 11, imageFile: 'obstacles_01.png', image: new Image() },
    // { id: 'OBJ10', x: 13, y: 9, imageFile: 'obstacles_01.png', image: new Image() },
    // { id: 'OBJ08', x: 6, y: 11, imageFile: 'obstacles_02.png', image: new Image() },
    // { id: 'OBJ09', x: 8, y: 12, imageFile: 'obstacles_02.png', image: new Image() },
  ];
  const initialObstacles = obstacles.map((obstacle) => ({ ...obstacle }));
  const impassableTiles = new Set([
    '9,6', '10,6', '11,6',
    '10,7', '11,7', '12,7',
    '10,8', '11,8', '12,8',
    '11,9', '12,9',
    '13,3', '14,3',
    '16,12', '17,12',
    '3,9', '4,9',
    '8,13', '12,13',
  ]);
  let currentSide = 'player';
  const sideTurnCounts = { player: 1, enemy: 1 };
  let selectedUnit = null;
  let combatTarget = null;
  let rangeMode = null;
  let enemyRangePreview = null;
  let isUnitMoving = false;
  let menuSelectionIndex = 0;
  let moveConfirmSelection = 0;
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
  for (const unit of units) {
    const imageFile = unit.imageFile ?? `${unit.id}s.png`;
    unit.image.src = `Unit/${imageFile}`;
  }
  units.forEach((unit) => unit.image.addEventListener('load', draw));
  for (const obstacle of obstacles) obstacle.image.src = `Unit/${obstacle.imageFile}`;
  obstacles.forEach((obstacle) => obstacle.image.addEventListener('load', draw));

  setupMapScrollbar(mapScrollbars.x, 'x');
  setupMapScrollbar(mapScrollbars.y, 'y');

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    lastGestureDragged = false;
    pointerGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
      dragging: false,
    };
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const deltaX = event.clientX - pointerGesture.startX;
    const deltaY = event.clientY - pointerGesture.startY;
    if (!pointerGesture.dragging && Math.hypot(deltaX, deltaY) >= 7) {
      pointerGesture.dragging = true;
      canvas.setPointerCapture(event.pointerId);
    }
    if (!pointerGesture.dragging) return;
    event.preventDefault();
    lastGestureDragged = true;
    setCameraPosition(
      pointerGesture.cameraX - deltaX * scaleX / TILE_SIZE,
      pointerGesture.cameraY - deltaY * scaleY / TILE_SIZE,
    );
  });

  function finishPointerGesture(event) {
    if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
    lastGestureDragged = pointerGesture.dragging;
    pointerGesture = null;
  }
  canvas.addEventListener('pointerup', finishPointerGesture);
  canvas.addEventListener('pointercancel', finishPointerGesture);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const shiftHorizontal = event.shiftKey && event.deltaX === 0;
    const horizontalDelta = shiftHorizontal ? event.deltaY : event.deltaX;
    setCameraPosition(
      camera.x + horizontalDelta * scaleX / TILE_SIZE,
      camera.y + (shiftHorizontal ? 0 : event.deltaY) * scaleY / TILE_SIZE,
    );
  }, { passive: false });

  canvas.addEventListener('click', (event) => {
    if (lastGestureDragged) {
      lastGestureDragged = false;
      event.preventDefault();
      return;
    }
    if (battleEventActive || isGameOver || isUnitMoving || isEnemyAiRunning || isCombatResolving || explosionEffects.length || phaseInputLocked || !turnConfirm.hidden) return;
    canvas.focus();
    emptyCommand.hidden = true;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const mapX = Math.floor(camera.x + ((event.clientX - bounds.left) * scaleX) / TILE_SIZE);
    const mapY = Math.floor(camera.y + ((event.clientY - bounds.top) * scaleY) / TILE_SIZE);

    const clickedUnit = [...units].reverse().find((unit) => {
      const widthInTiles = (unit.spriteWidth ?? TILE_SIZE) / TILE_SIZE;
      const heightInTiles = (unit.spriteHeight ?? TILE_SIZE) / TILE_SIZE;
      return mapX >= unit.x && mapX < unit.x + widthInTiles &&
        mapY >= unit.y && mapY < unit.y + heightInTiles;
    });
    const clickedObstacle = obstacles.find((obstacle) => obstacle.x === mapX && obstacle.y === mapY);
    if (rangeMode === 'move-confirm') return;
    const clickedDuringAction = rangeMode !== null;
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && clickedUnit === selectedUnit) {
        commitPendingMove();
        return;
      }
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
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
      const moveDistances = selectedUnit ? getMoveDistances(selectedUnit) : new Map();
      const destination = selectedUnit ? getMoveAnchorForCell(selectedUnit, mapX, mapY, moveDistances) : null;
      if (clickedUnit === selectedUnit && !destination) return;
      if ((clickedUnit && clickedUnit !== selectedUnit) || !destination) {
        rangeMode = null;
        unitCommand.hidden = true;
        cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
        cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
        scrollToCursor();
        return;
      }
      moveSelectedUnitTo(destination.x, destination.y);
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
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
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

  cancelActionButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (isUnitMoving || isEnemyAiRunning || isCombatResolving || explosionEffects.length || isGameOver) return;
    if (!turnConfirm.hidden) answerTurnConfirmation(false);
    else cancelCurrentAction();
    draw();
  });

  unitCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    chooseUnitAction(event.target.closest('button')?.dataset.action);
  });

  moveConfirmCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'commit-move') commitPendingMove();
    else if (action === 'cancel-move') rollbackPendingMove();
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
    moveConfirmCommand.hidden = true;
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
      moveConfirmCommand.hidden = true;
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
    moveConfirmCommand.hidden = true;
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

  gameResult.addEventListener('click', (event) => {
    const option = event.target.closest('[data-game-over-action]');
    if (option && gameOverOptionsReady && !clearTransitioning) {
      chooseGameOverAction(option.dataset.gameOverAction);
      return;
    }
    if (clearPromptReady && !clearTransitioning) showClearStory();
  });

  window.addEventListener('keydown', (event) => {
    if (gameOverOptionsReady && !clearTransitioning) {
      const buttons = [...gameOverOptions.querySelectorAll('button:not(:disabled)')];
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        gameOverSelection = (gameOverSelection + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        updateGameOverSelection();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'x') {
        event.preventDefault();
        chooseGameOverAction(buttons[gameOverSelection]?.dataset.gameOverAction);
        return;
      }
    }
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
    battleEventActive = false;
    completedBattleEvents.clear();
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
    storyText.textContent = '';
    storyStart.disabled = true;
    storyStart.textContent = '\u300aGame Start\u300b';
    storySkip.hidden = true;
    skipStoryReveal = false;
    introEvent.classList.add('fade-out');
    introEvent.hidden = false;

    try {
      const opening = parseEventSection(await loadEventScript('Event/Event_001.txt'), '\uff2f\uff30');
      if (!opening.message) throw new Error('Event_001.txt にOPのＭＥＳがありません。');
      introEventImage.src = `Unit/${opening.background || introImageSource.split('/').pop()}`;
      await waitForImage(introEventImage);
      if (opening.bgm) setBgm(opening.bgm);
      currentStoryText = opening.message;
    } catch (error) {
      console.error('OPイベントを読み込めませんでした。', error);
      currentStoryText = `OPイベントを読み込めませんでした。\n${error.message || error}\nEvent/Event_001.txt と素材を確認してください。`;
      introEventImage.src = introImageSource;
    }

    await wait(32);
    introEvent.classList.remove('fade-out');
    storySkip.hidden = false;
    for (const character of Array.from(currentStoryText)) {
      if (skipStoryReveal) break;
      storyText.textContent += character;
      storyText.scrollTop = storyText.scrollHeight;
      await wait(32);
    }
    storyText.textContent = currentStoryText;
    storyText.scrollTop = storyText.scrollHeight;
    storySkip.hidden = true;
    storyStart.disabled = false;
  }

  async function loadEventScript(path) {
    if (window.location.protocol === 'file:') {
      throw new Error('file:// からはイベントファイルを読み込めません。ローカルHTTPサーバー経由で開いてください。');
    }
    const response = await fetch(new URL(path, document.baseURI), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} の読み込みに失敗しました (${response.status})`);
    return response.text();
  }

  function parseEventSection(source, sectionName) {
    const lines = source.replace(/\r/g, '').split('\n');
    const sectionIndex = lines.findIndex((line) => line.replace(/\/\/.*$/, '').trim() === sectionName);
    if (sectionIndex < 0) throw new Error(`${sectionName} セクションがありません。`);

    let opened = false;
    let depth = 0;
    const sectionLines = [];
    for (let lineIndex = sectionIndex + 1; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].replace(/\/\/.*$/, '');
      for (const character of line) {
        if (character === '\uff5b') {
          opened = true;
          depth++;
        } else if (character === '\uff5d' && opened) {
          depth--;
          if (depth === 0) return parseEventCommands(sectionLines);
        }
      }
      if (opened && depth > 0) sectionLines.push(line);
    }
    throw new Error(`${sectionName} セクションの括弧が閉じていません。`);
  }

  function parseEventCommands(lines) {
    const event = { background: '', bgm: '', fadeIn: false, message: '' };
    let readingMessage = false;
    const messageLines = [];

    for (const line of lines) {
      const content = line.replace(/^[\t \u3000]+|[\t \u3000]+$/g, '');
      const trimmed = content.trim();
      if (!trimmed) {
        if (readingMessage) messageLines.push('');
        continue;
      }
      let match = trimmed.match(/^ＢＧ[：:]\s*(.+)$/);
      if (match) { event.background = match[1].trim(); readingMessage = false; continue; }
      match = trimmed.match(/^ＢＧＭ[：:]\s*(.+)$/);
      if (match) { event.bgm = match[1].trim(); readingMessage = false; continue; }
      if (trimmed === 'フェードイン') { event.fadeIn = true; readingMessage = false; continue; }
      if (trimmed === 'ＭＥＳ') { readingMessage = true; continue; }
      if (/^GOTO[：:]/i.test(trimmed) || /^ＧＯＴＯ[：:]/.test(trimmed)) break;
      if (readingMessage) messageLines.push(content);
    }

    event.message = messageLines.join('\n').trim();
    return event;
  }

  function waitForImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`${image.src} を読み込めません。`)), { once: true });
    });
  }

  async function playClearStory() {
    isClearStory = true;
    storyStart.textContent = '\u300aClick to Top\u300b';
    storyText.textContent = '';
    storyStart.disabled = true;
    skipStoryReveal = false;
    try {
      const epilogue = parseEventSection(await loadEventScript('Event/Event_001.txt'), '\uff25\uff30');
      if (!epilogue.message) throw new Error('Event_001.txt にＥＰのＭＥＳがありません。');
      introEventImage.src = 'Unit/' + (epilogue.background || 'Event_01_ED.png');
      await waitForImage(introEventImage);
      if (epilogue.bgm) setBgm(epilogue.bgm);
      currentStoryText = epilogue.message;
    } catch (error) {
      console.error('ＥＰイベントを読み込めませんでした。', error);
      currentStoryText = 'ＥＰイベントを読み込めませんでした。\n' + (error.message || error);
    }
    storySkip.hidden = false;
    await revealStoryText();
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

  function updateGameOverSelection() {
    [...gameOverOptions.querySelectorAll('button:not(:disabled)')].forEach((button, index) => {
      button.classList.toggle('selected', index === gameOverSelection);
    });
  }

  function chooseGameOverAction(action) {
    if (action === 'retry') retryStage();
    else if (action === 'top') returnToTopMenuFromGameOver();
  }

  async function retryStage() {
    if (!gameOverOptionsReady || clearTransitioning) return;
    clearTransitioning = true;
    gameResult.classList.add('fade-out');
    await wait(700);
    gameShell.hidden = true;
    gameResult.hidden = true;
    resetStageState();
    completedBattleEvents.clear();
    introEventImage.src = introImageSource;
    storyStart.textContent = '\u300aGame Start\u300b';
    introEvent.hidden = false;
    clearTransitioning = false;
    playIntroStory();
  }

  async function returnToTopMenuFromGameOver() {
    if (!gameOverOptionsReady || clearTransitioning) return;
    clearTransitioning = true;
    gameResult.classList.add('fade-out');
    await wait(700);
    gameShell.hidden = true;
    gameResult.hidden = true;
    resetStageState();
    showTitleMenu();
  }

  function showTitleMenu() {
    introEvent.hidden = true;
    introEvent.classList.remove('fade-out');
    titleScreen.hidden = false;
    titleScreen.classList.remove('fade-out');
    titleScreen.classList.add('menu-visible');
    titleSelection = 0;
    updateTitleSelection();
    titleTransitioning = false;
    titleIntroComplete = true;
    clearTransitioning = false;
    clearPromptReady = false;
    isClearStory = false;
    setBgm('M001_Title.mp3');
  }

  function resetStageState() {
    window.clearTimeout(attackMessageTimer);
    window.clearTimeout(phaseAnnouncementTimer);
    if (cameraFrame) cancelAnimationFrame(cameraFrame);
    cameraFrame = 0;
    units.splice(0, units.length, ...initialUnits.map((unit) => ({ ...unit })));
    obstacles.splice(0, obstacles.length, ...initialObstacles.map((obstacle) => ({ ...obstacle })));
    currentSide = 'player';
    sideTurnCounts.player = 1;
    sideTurnCounts.enemy = 1;
    selectedUnit = null;
    moveConfirmCommand.hidden = true;
    combatTarget = null;
    rangeMode = null;
    enemyRangePreview = null;
    isUnitMoving = false;
    menuSelectionIndex = 0;
    turnConfirmSelection = 0;
    statusFromCommand = false;
    isGameOver = false;
    pendingGameResult = '';
    isEnemyAiRunning = false;
    isCombatResolving = false;
    pendingMove = null;
    phaseInputLocked = false;
    clearPromptReady = false;
    clearTransitioning = false;
    gameOverOptionsReady = false;
    gameOverSelection = 0;
    explosionEffects.length = 0;
    cursor.x = startCursor.x;
    cursor.y = startCursor.y;
    camera.x = initialCamera.x;
    camera.y = initialCamera.y;
    cameraTarget.x = initialCamera.x;
    cameraTarget.y = initialCamera.y;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    turnConfirm.hidden = true;
    phaseAnnouncement.hidden = true;
    attackMessage.hidden = true;
    touchControls.hidden = true;
    gameResult.hidden = true;
    gameResultMessage.textContent = '';
    gameOverOptions.hidden = true;
    gameResult.classList.remove('fade-out', 'show-next', 'show-game-over-options');
    updatePhaseLabel();
    draw();
  }

  async function returnToTitle() {
    introEvent.classList.add('fade-out');
    await wait(700);
    introEvent.hidden = true;
    introEvent.classList.remove('fade-out');
    resetStageState();
    showTitleMenu();
  }

  storyStart.addEventListener('click', () => {
    if (isClearStory) returnToTitle();
    else if (battleEventActive) closeBattleMessage();
    else loadBattleOpening();
  });

  storyWindow.addEventListener('click', (event) => {
    if (!battleEventActive || storyStart.disabled || event.target.closest('button')) return;
    closeBattleMessage();
  });

  storySkip.addEventListener('click', () => {
    if (storySkip.hidden) return;
    skipStoryReveal = true;
    storyText.textContent = currentStoryText;
    storyText.scrollTop = storyText.scrollHeight;
    storySkip.hidden = true;
    storyStart.disabled = false;
  });

  async function loadBattleOpening() {
    storyStart.disabled = true;
    try {
      const battleScript = await loadEventScript('Event/Battle_001.txt');
      applyBattleSetup(battleScript);
      battleAttackEvents = parseBattleAttackRecords(battleScript);
      const turnZeroMessages = parseBattleMessageRecords(extractEventBlock(battleScript, 'ターン　０'));
      if (!turnZeroMessages.length) throw new Error('ターン　０にＭＥＳがありません。');
      enterStage();
      await playBattleMessages(turnZeroMessages);
      announceCurrentTurn();
      playPhaseBgm();
    } catch (error) {
      console.error('Battle_001を読み込めませんでした。', error);
      storyText.textContent = `Battle_001を読み込めませんでした。\n${error.message || error}`;
      storyStart.disabled = false;
      storySkip.hidden = true;
      introEvent.hidden = false;
    }
  }

  function showBattleMessage(message) {
    return new Promise((resolve) => {
      battleMessageResolve = resolve;
      battleEventActive = true;
      currentStoryText = message;
      storyText.textContent = '';
      storySpeaker.textContent = activeBattleSpeaker;
      storyStart.textContent = '\u300aContinue\u300b';
      storySkip.hidden = true;
      skipStoryReveal = false;
      introEvent.classList.add('battle-event');
      introEvent.hidden = false;
      canvas.focus();
      revealStoryText();
    });
  }

  function closeBattleMessage() {
    battleEventActive = false;
    introEvent.hidden = true;
    introEvent.classList.remove('battle-event');
    storySkip.hidden = true;
    storySpeaker.textContent = '';
    storyStart.textContent = '\u300aGame Start\u300b';
    canvas.focus();
    const resolveMessage = battleMessageResolve;
    battleMessageResolve = null;
    resolveMessage?.();
  }

  let activeBattleSpeaker = '';

  async function playBattleMessages(messages) {
    for (const message of messages) {
      if (message.followCursor) {
        const target = units.find((unit) => unit.id === message.unitId);
        if (target) {
          cursor.x = target.x;
          cursor.y = target.y;
          scrollToCursor();
          await waitForCameraToStop();
          draw();
        }
      }
      activeBattleSpeaker = message.speaker;
      await showBattleMessage(message.text);
    }
    activeBattleSpeaker = '';
    closeBattleMessage();
  }

  function parseBattleAttackEvents(source) {
    const events = new Map();
    const names = source.replace(/\r/g, '').split('\n')
      .map((line) => line.trim())
      .filter((line) => /^攻撃前[\t \u3000]+[\d０-９]+$/.test(line));
    for (const name of names) {
      const lines = extractEventBlock(source, name);
      const condition = lines.find((line) => /^PC\d+[\t \u3000]+ＶＳ[\t \u3000]+ＥＮ$/.test(line.trim()));
      const match = condition?.trim().match(/^PC(\d+)[\t \u3000]+ＶＳ[\t \u3000]+ＥＮ$/);
      const message = parseBattleMessages(lines);
      if (match && message) events.set('PC' + match[1].padStart(2, '0'), { name, message });
    }
    return events;
  }

  function parseBattleAttackRecords(source) {
    const events = new Map();
    const names = source.replace(/\r/g, '').split('\n')
      .map((line) => line.trim())
      .filter((line) => /^攻撃前[\t \u3000]+[\d０-９]+$/.test(line));
    for (const name of names) {
      const lines = extractEventBlock(source, name);
      const condition = lines.find((line) => /^PC\d+[\t \u3000]+ＶＳ[\t \u3000]+ＥＮ$/.test(line.trim()));
      const match = condition?.trim().match(/^PC(\d+)[\t \u3000]+ＶＳ[\t \u3000]+ＥＮ$/);
      const messages = parseBattleMessageRecords(lines);
      if (match && messages.length) events.set('PC' + match[1].padStart(2, '0'), { name, messages });
    }
    return events;
  }

  function enterStage() {
    introEvent.hidden = true;
    gameShell.hidden = false;
    updatePhaseLabel();
    draw();
    canvas.focus();
  }

  async function revealStoryText() {
    storyStart.disabled = true;
    for (const character of Array.from(currentStoryText)) {
      if (skipStoryReveal) break;
      storyText.textContent += character;
      storyText.scrollTop = storyText.scrollHeight;
      await wait(32);
    }
    storyText.textContent = currentStoryText;
    storyText.scrollTop = storyText.scrollHeight;
    storySkip.hidden = true;
    storyStart.disabled = false;
  }

  function parseBattleMessages(lines) {
    const messages = [];
    let speaker = '';
    let body = [];
    const saveMessage = () => {
      const text = body.join('\n').trim();
      if (speaker && text) messages.push(`${speaker}\n${text}`);
    };

    for (const line of lines) {
      const command = line.trim().match(/^ＭＥＳ[\t \u3000]+(.+?)[\t \u3000]+PC\d+[\t \u3000]+Y$/);
      if (command) {
        saveMessage();
        speaker = command[1].trim();
        body = [];
      } else if (speaker && line.trim() !== '｛' && line.trim() !== '｝') {
        body.push(line.trim());
      }
    }
    saveMessage();
    return messages.join('\n\n');
  }


  function parseBattleMessageRecords(lines) {
    const messages = [];
    let command = null;
    let body = [];
    const saveMessage = () => {
      const text = body.join('\n').trim();
      if (!command || !text) return;
      const number = command[2].match(/\d+/)[0].padStart(2, '0');
      messages.push({
        speaker: command[1].trim(),
        unitId: 'PC' + number,
        followCursor: command[3] === 'Y',
        text,
      });
    };

    for (const line of lines) {
      const nextCommand = line.trim().match(/^ＭＥＳ[\t \u3000]+(.+?)[\t \u3000]+(PC\d+)[\t \u3000]+([YN])$/);
      if (nextCommand) {
        saveMessage();
        command = nextCommand;
        body = [];
      } else if (command && line.trim() !== '｛' && line.trim() !== '｝') {
        body.push(line.trim());
      }
    }
    saveMessage();
    return messages;
  }

  function applyBattleSetup(source) {
    const setupLines = extractEventBlock(source, '初期配置');
    const coordinatePattern = /^\s*(PC\d+|EN\d+|OBJ\d+)\s*:\s*(.+?)\s*[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]\s*$/;
    const configuredObstacles = [];

    for (const line of setupLines) {
      const match = line.match(coordinatePattern);
      if (!match) continue;
      const [, id, imageFile, x, y] = match;
      const position = { x: Number(x) - 1, y: Number(y) - 1 };
      if (id.startsWith('OBJ')) {
        configuredObstacles.push({ id, ...position, imageFile: imageFile.trim(), image: new Image() });
        continue;
      }

      const unit = units.find((candidate) => candidate.id === id);
      if (!unit) continue;
      unit.x = position.x;
      unit.y = position.y;
      unit.imageFile = imageFile.trim();
      unit.moveUsed = false;
      unit.attackUsed = false;
      unit.ended = false;
    }

    if (configuredObstacles.length) {
      obstacles.splice(0, obstacles.length, ...configuredObstacles);
      for (const obstacle of obstacles) obstacle.image.src = `Unit/${obstacle.imageFile}`;
      initialObstacles.splice(0, initialObstacles.length, ...obstacles.map((obstacle) => ({ ...obstacle })));
    }
    for (const unit of units) {
      unit.image.src = `Unit/${unit.imageFile ?? `${unit.id}s.png`}`;
    }
    initialUnits.splice(0, initialUnits.length, ...units.map((unit) => ({ ...unit })));

    impassableTiles.clear();
    let readingTerrain = false;
    for (const line of setupLines) {
      const trimmed = line.trim();
      if (trimmed === '湖' || trimmed === '岩') { readingTerrain = true; continue; }
      if (trimmed.startsWith('開始カーソル') || coordinatePattern.test(line)) readingTerrain = false;
      if (!readingTerrain) continue;
      for (const match of line.matchAll(/[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]/g)) {
        impassableTiles.add(`${Number(match[1]) - 1},${Number(match[2]) - 1}`);
      }
    }

    const cursorLine = setupLines.find((line) => line.includes('開始カーソル'));
    const cursorMatch = cursorLine?.match(/[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]/);
    if (cursorMatch) {
      startCursor.x = Number(cursorMatch[1]) - 1;
      startCursor.y = Number(cursorMatch[2]) - 1;
      cursor.x = startCursor.x;
      cursor.y = startCursor.y;
    }
  }

  function extractEventBlock(source, blockName) {
    const lines = source.replace(/\r/g, '').split('\n');
    const blockIndex = lines.findIndex((line) => line.trim() === blockName);
    if (blockIndex < 0) throw new Error(`${blockName} ブロックがありません。`);

    let depth = 0;
    let opened = false;
    const blockLines = [];
    for (let index = blockIndex + 1; index < lines.length; index++) {
      const line = lines[index].replace(/\/\/.*$/, '');
      for (const character of line) {
        if (character === '\uff5b') { opened = true; depth++; }
        else if (character === '\uff5d' && opened) {
          depth--;
          if (depth === 0) return blockLines;
        }
      }
      if (opened && depth > 0) blockLines.push(line);
    }
    throw new Error(`${blockName} ブロックの括弧が閉じていません。`);
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
    moveConfirmCommand.hidden = true;
    updateTurnConfirmSelection();
    canvas.focus();
    draw();
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
      draw();
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
        !isUnitPositionBlocked(unit, tile.x, tile.y))
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

    const unit = getUnitAtPosition(cursor.x, cursor.y);
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && unit === selectedUnit) {
        commitPendingMove();
        return;
      }
      if (unit) tryAttackTarget(unit);
      return;
    }
    if (rangeMode === 'move-confirm') {
      if (moveConfirmSelection === 0) commitPendingMove();
      else rollbackPendingMove();
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
    const attackEvent = battleAttackEvents.get(attacker.id);
    if (attackEvent && !completedBattleEvents.has(attackEvent.name)) {
      completedBattleEvents.add(attackEvent.name);
      await playBattleMessages(attackEvent.messages);
    }
    isCombatResolving = true;
    combatTarget = target;
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
        const previousHp = target.hp;
        target.hp -= attacker.attackPower;
        const defeated = target.hp <= 0;
        if (defeated) {
          target.hp = 0;
          showAttackMessage(`${attacker.id} → ${target.id}：撃破！`, 2400);
        } else {
          showAttackMessage(`${attacker.id} → ${target.id}：攻撃成功！ -${attacker.attackPower}`);
        }

        await shakeUnit(target);
        await animateHpCountdown(target, previousHp, target.hp);
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
      combatTarget = null;
      draw();
    }
  }

  async function animateHpCountdown(unit, startingHp, finalHp) {
    unit.hpDisplayOverride = startingHp;
    draw();
    for (let hp = startingHp - 1; hp >= finalHp; hp--) {
      await wait(100);
      unit.hpDisplayOverride = hp;
      draw();
    }
    delete unit.hpDisplayOverride;
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
    moveConfirmCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    turnConfirm.hidden = true;
    rangeMode = null;
    gameResultMessage.textContent = message;
    gameOverOptions.hidden = true;
    gameOverOptionsReady = false;
    gameResult.classList.remove('fade-out', 'show-next', 'show-game-over-options');
    gameResult.hidden = false;
    if (message === '\u30b9\u30c6\u30fc\u30b8\u30af\u30ea\u30a2') {
      clearPromptReady = false;
      window.setTimeout(() => {
        if (gameResult.hidden) return;
        clearPromptReady = true;
        gameResult.classList.add('show-next');
      }, 4000);
    } else if (message === '\u30b2\u30fc\u30e0\u30aa\u30fc\u30d0\u30fc') {
      window.setTimeout(() => {
        if (gameResult.hidden || !isGameOver) return;
        gameOverOptionsReady = true;
        gameOverSelection = 0;
        gameOverOptions.hidden = false;
        gameResult.classList.add('show-game-over-options');
        updateGameOverSelection();
      }, 3500);
    }
  }

  function moveSelectedUnitTo(x, y) {
    if (!selectedUnit || rangeMode !== 'move') return;
    const distance = getMoveDistances(selectedUnit).get(`${x},${y}`);
    if (distance === undefined || distance > selectedUnit.moveRange || isUnitPositionBlocked(selectedUnit, x, y)) return;
    const path = getMovePath(selectedUnit, x, y);
    if (path.length < 2) return;
    pendingMove = { unit: selectedUnit, x: selectedUnit.x, y: selectedUnit.y };
    selectedUnit.moveUsed = true;
    rangeMode = null;
    moveConfirmCommand.hidden = true;
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
    moveConfirmCommand.hidden = true;
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
      draw();
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
      if (pendingMove?.unit === selectedUnit) {
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
    moveConfirmCommand.hidden = true;
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
    const needsConfirmation = rangeMode === 'move-confirm';
    pendingMove = null;
    rangeMode = null;
    moveConfirmCommand.hidden = true;
    if (needsConfirmation) {
      checkUnitCompletion(unit);
      draw();
      return;
    }
    openUnitMenu(unit);
  }

  function showMoveConfirmation(unit) {
    selectedUnit = unit;
    rangeMode = 'move-confirm';
    moveConfirmSelection = 0;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    moveConfirmCommand.hidden = false;
    cursor.x = unit.x;
    cursor.y = unit.y;
    updateMoveConfirmSelection();
    scrollToCursor();
  }

  function updateMoveConfirmSelection() {
    moveConfirmCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === moveConfirmSelection);
      button.setAttribute('aria-pressed', String(index === moveConfirmSelection));
    });
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
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT || distances.has(nextKey)) continue;

        if (isUnitPositionBlocked(movingUnit, x, y)) continue;
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
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT || previous.has(nextKey)) continue;
        if (isUnitPositionBlocked(movingUnit, x, y)) continue;
        previous.set(nextKey, key(current.x, current.y));
        queue.push({ x, y });
      }
    }

    if (!previous.has(targetKey)) return [];
    const path = [];
    let stepKey = targetKey;
    let remaining = MAP_WIDTH * MAP_HEIGHT;
    while (stepKey !== null && remaining-- > 0) {
      if (!previous.has(stepKey)) return [];
      const [x, y] = stepKey.split(',').map(Number);
      path.unshift({ x, y });
      stepKey = previous.get(stepKey);
    }
    if (stepKey !== null || path[0]?.x !== movingUnit.x || path[0]?.y !== movingUnit.y) return [];
    return path;
  }

  function getFootprintSize(unit) {
    return {
      width: Math.ceil((unit.spriteWidth ?? TILE_SIZE) / TILE_SIZE),
      height: Math.ceil((unit.spriteHeight ?? TILE_SIZE) / TILE_SIZE),
    };
  }

  function getUnitAtPosition(x, y) {
    return [...units].reverse().find((unit) => {
      const footprint = getFootprintSize(unit);
      return x >= unit.x && x < unit.x + footprint.width &&
        y >= unit.y && y < unit.y + footprint.height;
    }) ?? null;
  }

  function isUnitPositionBlocked(unit, x, y) {
    const { width, height } = getFootprintSize(unit);
    if (x < 0 || y < 0 || x + width > MAP_WIDTH || y + height > MAP_HEIGHT) return true;
    for (let tileY = y; tileY < y + height; tileY++) {
      for (let tileX = x; tileX < x + width; tileX++) {
        if (impassableTiles.has(`${tileX},${tileY}`)) return true;
      }
    }
    const overlaps = (otherX, otherY, otherWidth, otherHeight) =>
      x < otherX + otherWidth && x + width > otherX &&
      y < otherY + otherHeight && y + height > otherY;
    if (obstacles.some((obstacle) => overlaps(obstacle.x, obstacle.y, 1, 1))) return true;
    return units.some((other) => {
      if (other === unit) return false;
      const otherSize = getFootprintSize(other);
      return overlaps(other.x, other.y, otherSize.width, otherSize.height);
    });
  }

  function getMoveRangeTiles(unit, distances) {
    const tiles = new Set();
    const footprint = getFootprintSize(unit);
    for (const [position, distance] of distances) {
      if (distance === 0 || distance > unit.moveRange) continue;
      const [x, y] = position.split(',').map(Number);
      for (let offsetY = 0; offsetY < footprint.height; offsetY++) {
        for (let offsetX = 0; offsetX < footprint.width; offsetX++) {
          tiles.add(`${x + offsetX},${y + offsetY}`);
        }
      }
    }
    return tiles;
  }

  function getMoveAnchorForCell(unit, cellX, cellY, distances) {
    const clickedPosition = `${cellX},${cellY}`;
    const exactDistance = distances.get(clickedPosition);
    if (exactDistance > 0 && exactDistance <= unit.moveRange) return { x: cellX, y: cellY };

    const footprint = getFootprintSize(unit);
    const candidates = [];
    for (const [position, distance] of distances) {
      if (distance === 0 || distance > unit.moveRange) continue;
      const [x, y] = position.split(',').map(Number);
      if (cellX >= x && cellX < x + footprint.width && cellY >= y && cellY < y + footprint.height) {
        candidates.push({ x, y, distance, clickDistance: Math.abs(cellX - x) + Math.abs(cellY - y) });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance || a.clickDistance - b.clickDistance || a.y - b.y || a.x - b.x);
    return candidates[0] ?? null;
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
        else if (!enterAttackModeIfTargetInRange(unit)) {
          if (pendingMove?.unit === unit) showMoveConfirmation(unit);
          else checkUnitCompletion(unit);
        }
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

  function setCameraPosition(x, y) {
    if (cameraFrame) cancelAnimationFrame(cameraFrame);
    cameraFrame = 0;
    camera.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, y));
    cameraTarget.x = camera.x;
    cameraTarget.y = camera.y;
    draw();
  }

  function setupMapScrollbar(scrollbar, axis) {
    const thumb = scrollbar.querySelector('span');
    const isHorizontal = axis === 'x';
    const maximum = isHorizontal ? MAP_WIDTH - VIEW_WIDTH : MAP_HEIGHT - VIEW_HEIGHT;
    let drag = null;

    scrollbar.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const bounds = scrollbar.getBoundingClientRect();
      const thumbBounds = thumb.getBoundingClientRect();
      const trackStart = isHorizontal ? bounds.left : bounds.top;
      const thumbStart = isHorizontal ? thumbBounds.left : thumbBounds.top;
      const thumbLength = isHorizontal ? thumbBounds.width : thumbBounds.height;
      const pointer = isHorizontal ? event.clientX : event.clientY;
      const offset = event.target === thumb
        ? pointer - thumbStart
        : thumbLength / 2;
      drag = { pointerId: event.pointerId, offset };
      scrollbar.setPointerCapture(event.pointerId);
      if (event.target !== thumb) moveThumb(pointer, bounds, thumbLength, offset, trackStart);
    });

    scrollbar.addEventListener('pointermove', (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const bounds = scrollbar.getBoundingClientRect();
      const thumbBounds = thumb.getBoundingClientRect();
      moveThumb(
        isHorizontal ? event.clientX : event.clientY,
        bounds,
        isHorizontal ? thumbBounds.width : thumbBounds.height,
        drag.offset,
        isHorizontal ? bounds.left : bounds.top,
      );
    });
    const endDrag = (event) => {
      if (drag?.pointerId === event.pointerId) drag = null;
    };
    scrollbar.addEventListener('pointerup', endDrag);
    scrollbar.addEventListener('pointercancel', endDrag);

    scrollbar.addEventListener('keydown', (event) => {
      const current = isHorizontal ? camera.x : camera.y;
      let next = current;
      const previousKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      if (event.key === previousKey) next -= 1;
      else if (event.key === nextKey) next += 1;
      else if (event.key === 'PageUp') next -= isHorizontal ? VIEW_WIDTH : VIEW_HEIGHT;
      else if (event.key === 'PageDown') next += isHorizontal ? VIEW_WIDTH : VIEW_HEIGHT;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = maximum;
      else return;
      event.preventDefault();
      setCameraPosition(isHorizontal ? next : camera.x, isHorizontal ? camera.y : next);
    });

    function moveThumb(pointer, bounds, thumbLength, offset, trackStart) {
      const trackLength = isHorizontal ? bounds.width : bounds.height;
      const travel = trackLength - thumbLength;
      if (travel <= 0) return;
      const position = Math.max(0, Math.min(travel, pointer - trackStart - offset));
      const cameraPosition = (position / travel) * maximum;
      setCameraPosition(isHorizontal ? cameraPosition : camera.x, isHorizontal ? camera.y : cameraPosition);
    }
  }

  function scrollToCursor() {
    cameraTarget.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, cursor.x - Math.floor(VIEW_WIDTH / 2)));
    cameraTarget.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, cursor.y - Math.floor(VIEW_HEIGHT / 2)));
    draw();
    if (!cameraFrame && (Math.abs(camera.x - cameraTarget.x) > 0.01 || Math.abs(camera.y - cameraTarget.y) > 0.01)) {
      cameraFrame = requestAnimationFrame(animateCamera);
    }
  }

  function waitForCameraToStop() {
    return new Promise((resolve) => {
      function checkCamera() {
        if (!cameraFrame) {
          resolve();
          return;
        }
        requestAnimationFrame(checkCamera);
      }
      checkCamera();
    });
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
    const showPassability = !emptyCommand.hidden;
    passabilityLegend.hidden = !showPassability;
    const moveRangeUnit = enemyRangePreview?.mode === 'move'
      ? enemyRangePreview.unit
      : rangeMode === 'move' ? selectedUnit : null;
    const attackRangeUnit = enemyRangePreview?.mode === 'attack'
      ? enemyRangePreview.unit
      : rangeMode === 'attack' ? selectedUnit : null;
    const moveDistances = moveRangeUnit ? getMoveDistances(moveRangeUnit) : null;
    const moveRangeTiles = moveRangeUnit ? getMoveRangeTiles(moveRangeUnit, moveDistances) : null;

    ctx.clearRect(0, 0, VIEW_PIXEL_WIDTH, VIEW_PIXEL_HEIGHT);
    const firstMapX = Math.floor(camera.x);
    const firstMapY = Math.floor(camera.y);
    for (let mapY = firstMapY; mapY < firstMapY + VIEW_HEIGHT + 1; mapY++) {
      for (let mapX = firstMapX; mapX < firstMapX + VIEW_WIDTH + 1; mapX++) {
        if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) continue;
        const screenX = (mapX - camera.x) * TILE_SIZE;
        const screenY = (mapY - camera.y) * TILE_SIZE;
        if (mapBackground.complete && mapBackground.naturalWidth > 0) {
          const sourceX = mapX * mapBackground.naturalWidth / MAP_WIDTH;
          const sourceY = mapY * mapBackground.naturalHeight / MAP_HEIGHT;
          ctx.drawImage(
            mapBackground,
            sourceX,
            sourceY,
            mapBackground.naturalWidth / MAP_WIDTH,
            mapBackground.naturalHeight / MAP_HEIGHT,
            screenX,
            screenY,
            TILE_SIZE,
            TILE_SIZE,
          );
        } else {
          ctx.fillStyle = tileColor(mapX, mapY);
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
        const inMoveRange = moveRangeTiles?.has(`${mapX},${mapY}`);
        const attackDistance = attackRangeUnit ? Math.abs(mapX - attackRangeUnit.x) + Math.abs(mapY - attackRangeUnit.y) : 0;
        const inAttackRange = attackRangeUnit && isWithinAttackRange(attackRangeUnit, attackDistance);
        if (inMoveRange || inAttackRange) {
          ctx.fillStyle = inAttackRange
            ? 'rgba(237, 112, 91, 0.54)'
            : moveRangeUnit.side === 'enemy' ? 'rgba(108, 174, 244, 0.52)' : 'rgba(227, 231, 154, 0.48)';
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        if (showPassability) {
          const impassable = impassableTiles.has(`${mapX},${mapY}`) || isObstacleAt(mapX, mapY);
          ctx.fillStyle = impassable ? 'rgba(240, 68, 68, 0.62)' : 'rgba(73, 220, 115, 0.2)';
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

    // Draw ground shadows before unit sprites so each unit feels grounded on the map.
    for (const unit of units) {
      const unitX = unit.visualX ?? unit.x;
      const unitY = unit.visualY ?? unit.y;
      const spriteWidth = unit.spriteWidth ?? TILE_SIZE;
      const spriteHeight = unit.spriteHeight ?? TILE_SIZE;
      if (unitX + spriteWidth / TILE_SIZE <= camera.x || unitX >= camera.x + VIEW_WIDTH ||
          unitY + spriteHeight / TILE_SIZE <= camera.y || unitY >= camera.y + VIEW_HEIGHT) continue;
      const footprint = getFootprintSize(unit);
      const screenX = (unitX - camera.x) * TILE_SIZE + (unit.visualOffsetX ?? 0);
      const screenY = (unitY - camera.y) * TILE_SIZE;
      const shadowWidth = footprint.width * TILE_SIZE * 0.78;
      const shadowHeightScale = Math.max(footprint.width, footprint.height) > 1 ? 1.5 : 1;
      const shadowHeight = TILE_SIZE * 0.22 * shadowHeightScale;
      const shadowOffsetY = shadowHeightScale > 1 ? 10 : 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(
        screenX + spriteWidth / 2,
        screenY + spriteHeight - 5 - shadowOffsetY,
        shadowWidth / 2,
        shadowHeight / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Draw units at their current map coordinates.
    for (const unit of units) {
      const unitX = unit.visualX ?? unit.x;
      const unitY = unit.visualY ?? unit.y;
      const spriteWidth = unit.spriteWidth ?? TILE_SIZE;
      const spriteHeight = unit.spriteHeight ?? TILE_SIZE;
      const screenX = (unitX - camera.x) * TILE_SIZE + (unit.visualOffsetX ?? 0);
      const screenY = (unitY - camera.y) * TILE_SIZE + (unit.visualOffsetY ?? 0);
      if (unit.image.complete && unit.image.naturalWidth > 0 &&
          unitX + spriteWidth / TILE_SIZE > camera.x && unitX < camera.x + VIEW_WIDTH &&
          unitY + spriteHeight / TILE_SIZE > camera.y && unitY < camera.y + VIEW_HEIGHT) {
        ctx.drawImage(unit.image, screenX, screenY, spriteWidth, spriteHeight);
      }
      if (!isUnitMoving && (!isCombatResolving || unit.hpDisplayOverride !== undefined) &&
          unitX + spriteWidth / TILE_SIZE > camera.x && unitX < camera.x + VIEW_WIDTH &&
          unitY + spriteHeight / TILE_SIZE > camera.y && unitY < camera.y + VIEW_HEIGHT) {
        const hpBadgeX = screenX + spriteWidth / 2 - 16;
        const hpBadgeY = screenY + spriteHeight - 20;
        const visibleHp = unit.hpDisplayOverride ?? unit.hp;
        ctx.save();
        ctx.fillStyle = '#101510e8';
        ctx.fillRect(hpBadgeX, hpBadgeY, 32, 17);
        ctx.strokeStyle = '#d6d2a4';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBadgeX + 0.5, hpBadgeY + 0.5, 31, 16);
        ctx.fillStyle = visibleHp / unit.maxHp <= 0.3 ? '#ff7770' : '#fff4d0';
        ctx.font = 'bold 13px Arial, "Yu Gothic UI", Meiryo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.max(0, Math.ceil(visibleHp))), screenX + spriteWidth / 2, hpBadgeY + 8.5);
        ctx.restore();
      }
      if (enemyRangePreview?.mode === 'attack' && unit === enemyRangePreview.target &&
          unitX + spriteWidth / TILE_SIZE > camera.x && unitX < camera.x + VIEW_WIDTH &&
          unitY + spriteHeight / TILE_SIZE > camera.y && unitY < camera.y + VIEW_HEIGHT) {
        ctx.save();
        ctx.strokeStyle = '#fff3a6';
        ctx.lineWidth = 4;
        ctx.strokeRect(screenX + 3, screenY + 3, spriteWidth - 6, spriteHeight - 6);
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 7, screenY + 7, spriteWidth - 14, spriteHeight - 14);
        ctx.restore();
      }
    }

    for (const effect of explosionEffects) {
      const frame = Math.min(explosionFrameCount - 1, Math.floor((performance.now() - effect.startedAt) / explosionFrameDuration));
      const screenX = (effect.x - camera.x) * TILE_SIZE;
      const screenY = (effect.y - camera.y) * TILE_SIZE;
      const effectWidth = effect.unit.spriteWidth ?? TILE_SIZE;
      const effectHeight = effect.unit.spriteHeight ?? TILE_SIZE;
      if (screenX < -effectWidth || screenX > VIEW_PIXEL_WIDTH || screenY < -effectHeight || screenY > VIEW_PIXEL_HEIGHT) continue;

      // Keep the defeated unit visible beneath the first four explosion frames.
      if (frame < 4 && effect.unit.image.complete && effect.unit.image.naturalWidth > 0) {
        ctx.drawImage(effect.unit.image, screenX, screenY, effectWidth, effectHeight);
      }
      if (explosionImage.complete && explosionImage.naturalWidth > 0) {
        const frameWidth = explosionImage.naturalWidth / 4;
        const frameHeight = explosionImage.naturalHeight / 2;
        const sourceX = (frame % 4) * frameWidth;
        const sourceY = Math.floor(frame / 4) * frameHeight;
        ctx.drawImage(explosionImage, sourceX, sourceY, frameWidth, frameHeight, screenX, screenY, effectWidth, effectHeight);
      }
    }

    // Small coordinate marks along the top and left edges identify the visible map area.
    ctx.fillStyle = '#c0cdbf';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = firstMapX; x < firstMapX + VIEW_WIDTH + 1; x++) {
      const screenX = (x - camera.x) * TILE_SIZE;
      if (x >= 0 && x < MAP_WIDTH && x % 2 === 0) ctx.fillText(String(x + 1), screenX + TILE_SIZE / 2, 6);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let y = firstMapY; y < firstMapY + VIEW_HEIGHT + 1; y++) {
      const screenY = (y - camera.y) * TILE_SIZE;
      if (y >= 0 && y < MAP_HEIGHT && y % 2 === 0) ctx.fillText(String(y + 1), 5, screenY + TILE_SIZE / 2);
    }

    const cursorUnit = combatTarget ?? getUnitAtPosition(cursor.x, cursor.y);
    const cursorFootprint = cursorUnit ? getFootprintSize(cursorUnit) : { width: 1, height: 1 };
    const cursorMapX = cursorUnit?.x ?? cursor.x;
    const cursorMapY = cursorUnit?.y ?? cursor.y;
    const cursorX = (cursorMapX - camera.x) * TILE_SIZE;
    const cursorY = (cursorMapY - camera.y) * TILE_SIZE;
    const cursorWidth = cursorFootprint.width * TILE_SIZE;
    const cursorHeight = cursorFootprint.height * TILE_SIZE;
    const cursorIsAttackTarget = cursorUnit && (
      combatTarget === cursorUnit ||
      (rangeMode === 'attack' && selectedUnit && cursorUnit.side !== selectedUnit.side &&
        isWithinAttackRange(selectedUnit, Math.abs(cursorUnit.x - selectedUnit.x) + Math.abs(cursorUnit.y - selectedUnit.y))) ||
      (enemyRangePreview?.mode === 'attack' && enemyRangePreview.target === cursorUnit)
    );
    const cursorColor = cursorIsAttackTarget ? '#f04444' : '#f1d978';
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(cursorX + 4, cursorY + 4, cursorWidth - 8, cursorHeight - 8);
    ctx.fillStyle = cursorColor;
    ctx.fillRect(cursorX + 4, cursorY + 4, 12, 4);
    ctx.fillRect(cursorX + 4, cursorY + 4, 4, 12);
    ctx.fillRect(cursorX + cursorWidth - 16, cursorY + 4, 12, 4);
    ctx.fillRect(cursorX + cursorWidth - 8, cursorY + 4, 4, 12);
    ctx.fillRect(cursorX + 4, cursorY + cursorHeight - 8, 12, 4);
    ctx.fillRect(cursorX + 4, cursorY + cursorHeight - 16, 4, 12);
    ctx.fillRect(cursorX + cursorWidth - 16, cursorY + cursorHeight - 8, 12, 4);
    ctx.fillRect(cursorX + cursorWidth - 8, cursorY + cursorHeight - 16, 4, 12);

    coordinates.textContent = `X ${cursor.x + 1}, Y ${cursor.y + 1}`;
    if (!unitCommand.hidden && selectedUnit) {
      positionPanel(unitCommand, selectedUnit);
    }
    if (!moveConfirmCommand.hidden && selectedUnit) positionPanel(moveConfirmCommand, selectedUnit);
    if (!unitStatus.hidden && selectedUnit) positionPanel(unitStatus, selectedUnit);
    if (!emptyCommand.hidden) positionPanel(emptyCommand, cursor);
    const horizontalThumb = mapScrollbars.x.querySelector('span');
    const verticalThumb = mapScrollbars.y.querySelector('span');
    const horizontalSize = VIEW_WIDTH / MAP_WIDTH;
    const verticalSize = VIEW_HEIGHT / MAP_HEIGHT;
    horizontalThumb.style.width = `${horizontalSize * 100}%`;
    horizontalThumb.style.left = `${(camera.x / (MAP_WIDTH - VIEW_WIDTH)) * (1 - horizontalSize) * 100}%`;
    verticalThumb.style.height = `${verticalSize * 100}%`;
    verticalThumb.style.top = `${(camera.y / (MAP_HEIGHT - VIEW_HEIGHT)) * (1 - verticalSize) * 100}%`;
    mapScrollbars.x.setAttribute('aria-valuenow', String(Math.round(camera.x) + 1));
    mapScrollbars.y.setAttribute('aria-valuenow', String(Math.round(camera.y) + 1));
    mapScrollbars.x.setAttribute('aria-valuetext', `左端のマス ${Math.round(camera.x) + 1}`);
    mapScrollbars.y.setAttribute('aria-valuetext', `上端のマス ${Math.round(camera.y) + 1}`);
    touchControls.hidden = isGameOver ||
      (emptyCommand.hidden && unitCommand.hidden && unitStatus.hidden && turnConfirm.hidden && !rangeMode);
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
    if (battleEventActive) {
      const confirmKey = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'x';
      if (confirmKey && !storyStart.disabled) closeBattleMessage();
      event.preventDefault();
      return;
    }
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

    if (!moveConfirmCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      moveConfirmSelection = 1 - moveConfirmSelection;
      updateMoveConfirmSelection();
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
    cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, cursor.x + direction[0]));
    cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, cursor.y + direction[1]));
    scrollToCursor();
  });

  updateTitleSelection();
  draw();
  setBgm('M001_Title.mp3');
})();

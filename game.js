(() => {
  let MAP_WIDTH = 20;
  let MAP_HEIGHT = 16;
  const TILE_SIZE = 64;
  const STAGE_ID = '000';
  let currentStageId = STAGE_ID;
  const SAVE_FORMAT_VERSION = 1;
  const SAVE_INDEX_STORAGE_KEY = 'robot-slg-save-index-v1';
  const SAVE_DATA_STORAGE_KEY = 'robot-slg-save-data-v1';
  const MAX_VIEW_WIDTH = 16;
  const MAX_VIEW_HEIGHT = 12;
  let VIEW_WIDTH = Math.min(MAX_VIEW_WIDTH, MAP_WIDTH);
  let VIEW_HEIGHT = Math.min(MAX_VIEW_HEIGHT, MAP_HEIGHT);
  let VIEW_PIXEL_WIDTH = TILE_SIZE * VIEW_WIDTH;
  let VIEW_PIXEL_HEIGHT = TILE_SIZE * VIEW_HEIGHT;
  const canvas = document.querySelector('#map');
  const mapFrame = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const mapBackground = new Image();
  mapBackground.src = 'Unit/M001.png';
  const mapSizeLabel = document.querySelector('.map-size');
  const mapScrollbars = {
    x: document.querySelector('#map-scrollbar-x'),
    y: document.querySelector('#map-scrollbar-y'),
  };
  const passabilityLegend = document.querySelector('#passability-legend');
  const coordinates = document.querySelector('#coordinates');
  const unitCommand = document.querySelector('#unit-command');
  const attackChoiceCommand = document.querySelector('#attack-choice-command');
  const itemChoiceCommand = document.querySelector('#item-choice-command');
  const itemConfirmCommand = document.querySelector('#item-confirm-command');
  const itemConfirmMessage = document.querySelector('#item-confirm-message');
  const precisionConfirmCommand = document.querySelector('#precision-confirm-command');
  const hateConfirmCommand = document.querySelector('#hate-confirm-command');
  const moveConfirmCommand = document.querySelector('#move-confirm-command');
  const unitStatus = document.querySelector('#unit-status');
  const debugPanel = document.querySelector('#debug-panel');
  const debugUnitSelect = document.querySelector('#debug-unit');
  const emptyCommand = document.querySelector('#empty-command');
  const gameRuleDialog = document.querySelector('#game-rule-dialog');
  const gameRuleContent = document.querySelector('#game-rule-content');
  const saveSlotDialog = document.querySelector('#save-slot-dialog');
  const saveSlotDialogParent = saveSlotDialog.parentElement;
  const saveSlotTitle = document.querySelector('#save-slot-title');
  const saveSlotList = document.querySelector('#save-slot-list');
  const saveSlotStatus = document.querySelector('#save-slot-status');
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
  const stageDebugMenu = document.querySelector('#stage-debug-menu');
  const stageDebugStatus = document.querySelector('#stage-debug-status');
  const stageDebugButtons = [...stageDebugMenu.querySelectorAll('[data-stage-id]')];
  const stagePreviewBanner = document.querySelector('#stage-preview-banner');
  const stagePreviewLabel = document.querySelector('#stage-preview-label');
  const stagePreviewExit = document.querySelector('#stage-preview-exit');
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
  let rulesReturnToTitle = false;
  let titleTransitioning = false;
  let titleOpening = false;
  let titleIntroComplete = false;
  let stageDebugSelection = 0;
  let stagePreviewMode = false;
  let stagePreviewPreviousStageId = STAGE_ID;
  let stagePreviewPreviousRoster = [];
  let clearPromptReady = false;
  let battleEndContinueResolve = null;
  let clearTransitioning = false;
  let isClearStory = false;
  let currentStorySection = '';
  let currentEventSaveList = false;
  let saveListReturnToStory = false;
  let gameOverOptionsReady = false;
  let gameOverSelection = 0;
  let currentStoryText = '';
  let currentEventGoto = '';
  let skipStoryReveal = false;
  let battleEventActive = false;
  let battleMessageResolve = null;
  let battleAttackEvents = new Map();
  let battleDefenseEvents = new Map();
  let battleDefeatEvents = new Map();
  let battleObjectDefeatEvent = null;
  let battleEndEvent = null;
  let npcDefinitions = new Map();
  const eventFlags = new Set();
  const completedBattleEvents = new Set();

  const startCursor = { x: 9, y: 9 };
  const cursor = { ...startCursor };
  const initialCamera = {
    x: 0,
    y: 0,
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
    { id: 'EN03', side: 'enemy', x: 14, y: 11, hp: 15, maxHp: 15, moveRange: 5, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, spriteWidth: 64, spriteHeight: 64, image: new Image() },
    { id: 'EN04', side: 'enemy', x: 15, y: 13, hp: 13, maxHp: 13, moveRange: 4, minAttackRange: 1, attackRange: 4, attackPower: 5, evasion: 3, hitBonus: 0, moveUsed: false, attackUsed: false, ended: false, spriteWidth: 64, spriteHeight: 64, image: new Image() },
  ];
  const unitTemplates = units.map((unit) => ({ ...unit }));
  const initialUnits = unitTemplates.map((unit) => ({ ...unit }));
  let debugMode = false;
  function getDebuggableUnits() {
    return units;
  }

  function loadDebugUnit(unit) {
    if (!unit) return;
    for (const name of ['hp', 'moveRange', 'evasion', 'hitBonus', 'attackRange', 'attackPower']) {
      debugPanel.querySelector(`[name="${name}"]`).value = unit[name];
    }
  }

  function refreshDebugUnitList(selectedId = debugUnitSelect.value) {
    const availableUnits = getDebuggableUnits();
    debugUnitSelect.replaceChildren(...availableUnits.map((unit) => {
      const option = document.createElement('option');
      option.value = unit.id;
      option.textContent = `${unit.id}（${unit.side === 'player' ? 'PC' : 'EN'}）`;
      return option;
    }));
    const selected = availableUnits.find((unit) => unit.id === selectedId) ?? availableUnits[0];
    if (selected) {
      debugUnitSelect.value = selected.id;
      loadDebugUnit(selected);
    }
  }

  function toggleDebugMode() {
    if (gameShell.hidden || stagePreviewMode || isGameOver || battleEventActive) return;
    debugMode = !debugMode;
    debugPanel.hidden = !debugMode;
    if (debugMode) {
      refreshDebugUnitList(selectedUnit?.id);
      for (const unit of units.filter((candidate) => candidate.side === 'enemy')) {
        unit.ended = false;
        unit.moveUsed = false;
        unit.moveRemaining = unit.moveRange;
        unit.attackUsed = false;
      }
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      attackChoiceCommand.hidden = true;
      itemChoiceCommand.hidden = true;
      itemConfirmCommand.hidden = true;
      precisionConfirmCommand.hidden = true;
      hateConfirmCommand.hidden = true;
      moveConfirmCommand.hidden = true;
      turnConfirm.hidden = true;
      emptyCommand.hidden = true;
      debugUnitSelect.focus();
    } else {
      debugPanel.querySelector('[data-debug-action="cancel"]').click();
      canvas.focus();
      if (currentSide === 'enemy' && !isEnemyAiRunning) runEnemyTurn();
    }
    draw();
  }

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'q') {
      event.preventDefault();
      if (!titleScreen.hidden) {
        if (titleIntroComplete && !titleOpening && !titleTransitioning) toggleStageDebugMenu();
      } else if (!stagePreviewMode) {
        toggleDebugMode();
      }
    }
  });

  debugUnitSelect.addEventListener('change', () => {
    loadDebugUnit(getDebuggableUnits().find((unit) => unit.id === debugUnitSelect.value));
  });
  const debugPanelDragHandle = debugPanel.querySelector('.debug-panel-drag-handle');
  let debugPanelDrag = null;
  debugPanelDragHandle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const frameBounds = debugPanel.parentElement.getBoundingClientRect();
    const panelBounds = debugPanel.getBoundingClientRect();
    debugPanel.style.transform = 'none';
    debugPanel.style.left = `${panelBounds.left - frameBounds.left}px`;
    debugPanel.style.top = `${panelBounds.top - frameBounds.top}px`;
    debugPanelDrag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - panelBounds.left,
      offsetY: event.clientY - panelBounds.top,
    };
    debugPanelDragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  debugPanelDragHandle.addEventListener('pointermove', (event) => {
    if (!debugPanelDrag || debugPanelDrag.pointerId !== event.pointerId) return;
    const frameBounds = debugPanel.parentElement.getBoundingClientRect();
    const maxLeft = Math.max(0, frameBounds.width - debugPanel.offsetWidth);
    const maxTop = Math.max(0, frameBounds.height - debugPanel.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, event.clientX - frameBounds.left - debugPanelDrag.offsetX));
    const top = Math.max(0, Math.min(maxTop, event.clientY - frameBounds.top - debugPanelDrag.offsetY));
    debugPanel.style.left = `${left}px`;
    debugPanel.style.top = `${top}px`;
  });
  const finishDebugPanelDrag = (event) => {
    if (debugPanelDrag?.pointerId === event.pointerId) debugPanelDrag = null;
  };
  debugPanelDragHandle.addEventListener('pointerup', finishDebugPanelDrag);
  debugPanelDragHandle.addEventListener('pointercancel', finishDebugPanelDrag);
  debugPanel.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = event.target.closest('[data-debug-action]')?.dataset.debugAction;
    if (action === 'cancel') {
      refreshDebugUnitList();
      return;
    }
    if (action !== 'apply') return;
    const unit = getDebuggableUnits().find((candidate) => candidate.id === debugUnitSelect.value);
    if (!unit) return;
    const values = Object.fromEntries(['hp', 'moveRange', 'evasion', 'hitBonus', 'attackRange', 'attackPower']
      .map((name) => [name, Number(debugPanel.querySelector(`[name="${name}"]`).value)]));
    if (Object.values(values).some((value) => !Number.isFinite(value) || !Number.isInteger(value)) ||
        values.hp < 0 || values.hp > unit.maxHp || values.moveRange < 0 ||
        values.attackRange < unit.minAttackRange || values.attackPower < 0) return;
    const spentMove = unit.moveRange - (unit.moveRemaining ?? unit.moveRange);
    unit.hp = values.hp;
    unit.moveRange = values.moveRange;
    unit.moveRemaining = Math.max(0, values.moveRange - spentMove);
    unit.moveUsed = unit.moveRemaining <= 0;
    unit.evasion = values.evasion;
    unit.hitBonus = values.hitBonus;
    unit.attackRange = values.attackRange;
    unit.attackPower = values.attackPower;
    if (selectedUnit === unit) updateMenuSelection();
    if (!unitStatus.hidden && selectedUnit === unit) showUnitStatus(unit, statusFromCommand);
    draw();
  });
  const obstacles = [
    { id: 'OBJ01', x: 9, y: 15, hp: 5, maxHp: 5, destructible: true, imageFile: 'obstacles_01.png', image: new Image() },
    { id: 'OBJ02', x: 7, y: 10, hp: 5, maxHp: 5, destructible: true, imageFile: 'obstacles_01.png', image: new Image() },
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
  const lineOfSightBlockedTiles = new Set();
  let currentSide = 'player';
  const sideTurnCounts = { player: 1, enemy: 1 };
  let selectedUnit = null;
  let combatTarget = null;
  let rangeMode = null;
  let enemyRangePreview = null;
  let cursorEnemyPreview = null;
  let cursorEnemyPreviewFrame = 0;
  let isUnitMoving = false;
  let menuSelectionIndex = 0;
  let attackChoiceSelection = 0;
  let precisionConfirmSelection = 0;
  let hateConfirmSelection = 0;
  let itemChoiceSelection = 0;
  let itemConfirmSelection = 0;
  let pendingPrecisionTarget = null;
  let moveConfirmSelection = 0;
  let attackMessageTimer = 0;
  let phaseAnnouncementTimer = 0;
  let turnConfirmSelection = 0;
  let emptyCommandSelection = 0;
  let saveSlotMode = 'save';
  let saveListReturnToTitle = false;
  let customPoints = 0;
  let playerRoster = [];
  let statusFromCommand = false;
  let isGameOver = false;
  let isEnemyAiRunning = false;
  let isCombatResolving = false;
  let pendingMove = null;
  const explosionFrameDuration = 200;
  const explosionFrameCount = 8;
  const hitEffectFrameDuration = 100;
  const hitEffectFrameCount = 8;
  const explosionImage = new Image();
  const explosionEffects = [];
  const hitEffectImages = new Map();
  const hitEffects = [];
  let unitBaseParameters = new Map();
  let npcBaseParameters = new Map();
  let weaponParameters = new Map();
  let armorParameters = new Map();
  let itemParameters = new Map();
  let phaseBgmFiles = { player: 'M002_PC_turn.mp3', enemy: 'M003_EN_turn.mp3' };
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

  canvas.addEventListener('pointermove', (event) => {
    if (pointerGesture?.dragging || rangeMode || isUnitMoving || isEnemyAiRunning || isCombatResolving) return;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const mapX = Math.floor(camera.x + ((event.clientX - bounds.left) * scaleX) / TILE_SIZE);
    const mapY = Math.floor(camera.y + ((event.clientY - bounds.top) * scaleY) / TILE_SIZE);
    updateCursorEnemyPreview(getUnitAtPosition(mapX, mapY));
  });

  canvas.addEventListener('pointerleave', () => updateCursorEnemyPreview(null));

  canvas.addEventListener('click', (event) => {
    if (lastGestureDragged) {
      lastGestureDragged = false;
      event.preventDefault();
      return;
    }
    if (stagePreviewMode) {
      canvas.focus();
      const bounds = canvas.getBoundingClientRect();
      const scaleX = canvas.width / bounds.width;
      const scaleY = canvas.height / bounds.height;
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(camera.x + ((event.clientX - bounds.left) * scaleX) / TILE_SIZE)));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(camera.y + ((event.clientY - bounds.top) * scaleY) / TILE_SIZE)));
      scrollToCursor();
      return;
    }
    if (battleEventActive || isGameOver || isUnitMoving || isEnemyAiRunning || isCombatResolving || explosionEffects.length || phaseInputLocked || !turnConfirm.hidden || !saveSlotDialog.hidden || !attackChoiceCommand.hidden || !itemChoiceCommand.hidden || !itemConfirmCommand.hidden || !precisionConfirmCommand.hidden || !hateConfirmCommand.hidden) return;
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
    if (rangeMode === 'precision-target') {
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
      if (clickedUnit?.side === 'enemy' && canAttackUnitTarget(selectedUnit, clickedUnit)) {
        showPrecisionConfirmation(clickedUnit);
      } else if (clickedObstacle?.destructible && canAttackObstacleTarget(selectedUnit, clickedObstacle)) {
        showPrecisionConfirmation(clickedObstacle);
      }
      scrollToCursor();
      return;
    }
    if (rangeMode === 'hate') {
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
      if (clickedUnit) tryHateTarget(clickedUnit);
      scrollToCursor();
      return;
    }
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && clickedUnit === selectedUnit) {
        commitPendingMove();
        return;
      }
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, mapX));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, mapY));
      if (clickedObstacle?.destructible) {
        if (isWithinAttackRange(selectedUnit, distanceFromUnitToTile(selectedUnit, mapX, mapY)) &&
            hasLineOfSight(selectedUnit, clickedObstacle, clickedObstacle)) {
          void tryAttackObstacle(clickedObstacle);
        }
        scrollToCursor();
        return;
      }
      const targetInRange = clickedUnit && clickedUnit !== selectedUnit
        ? canAttackUnitTarget(selectedUnit, clickedUnit)
        : selectedUnit && isWithinAttackRange(selectedUnit, distanceFromUnitToTile(selectedUnit, mapX, mapY));
      if (!selectedUnit || !targetInRange) {
        if (pendingMove?.unit === selectedUnit) rollbackPendingMove();
        else rangeMode = null;
      } else if (clickedUnit && clickedUnit !== selectedUnit) {
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
      saveSlotDialog.hidden = true;
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
      if (!clickedDuringAction) {
        emptyCommandSelection = 0;
        updateEmptyCommandSelection();
        emptyCommand.hidden = false;
      }
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

  attackChoiceCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'normal-attack') startAttackSelection();
    else if (action === 'precision-attack') startPrecisionTargetSelection();
    else if (action === 'hate') showHateConfirmation();
  });

  itemChoiceCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'select-item') showSpecialEquipmentConfirmation();
    else if (action === 'cancel-item-choice') {
      itemChoiceCommand.hidden = true;
      unitCommand.hidden = false;
      updateMenuSelection();
      canvas.focus();
      draw();
    }
  });

  itemConfirmCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'confirm-item') {
      itemConfirmCommand.hidden = true;
      useSpecialEquipment(selectedUnit);
    } else if (action === 'cancel-item-confirm') {
      itemConfirmCommand.hidden = true;
      itemChoiceCommand.hidden = false;
      updateItemChoiceSelection();
      canvas.focus();
      draw();
    }
  });

  precisionConfirmCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'confirm-precision') confirmPrecisionAttack();
    else if (action === 'cancel-precision') {
      precisionConfirmCommand.hidden = true;
      pendingPrecisionTarget = null;
      rangeMode = 'precision-target';
      canvas.focus();
      draw();
    }
  });

  hateConfirmCommand.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isCombatResolving || explosionEffects.length) return;
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'confirm-hate') startHateTargetSelection();
    else if (action === 'cancel-hate') {
      hateConfirmCommand.hidden = true;
      attackChoiceCommand.hidden = false;
      canvas.focus();
      draw();
    }
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
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'confirm-turn') {
      emptyCommand.hidden = true;
      openTurnConfirmation();
    } else if (action === 'rules') {
      openGameRules(false);
    } else if (action === 'save' || action === 'load') {
      openSaveSlotList(action);
    }
  });

  gameRuleDialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="close-game-rules"]') || event.target === gameRuleDialog) {
      closeGameRules();
    }
  });
  gameRuleDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'z') {
      event.preventDefault();
      closeGameRules();
    }
  });

  saveSlotDialog.addEventListener('click', (event) => {
    event.stopPropagation();
    const closeButton = event.target.closest('[data-action="close-save-slots"]');
    const slotButton = event.target.closest('[data-slot-index]');
    if (closeButton) {
      saveSlotDialog.hidden = true;
      if (saveListReturnToTitle) {
        saveListReturnToTitle = false;
        restoreSaveSlotDialogParent();
        titleScreen.classList.remove('title-load-open');
        titleOptions[1]?.focus();
      } else if (saveListReturnToStory) {
        saveListReturnToStory = false;
        restoreSaveSlotDialogParent();
      } else {
        emptyCommand.hidden = false;
      }
      canvas.focus();
      draw();
    } else if (slotButton && saveSlotMode === 'save') {
      const slotIndex = Number(slotButton.dataset.slotIndex);
      if (readSaveContents()[slotIndex] &&
          !window.confirm(`データ${String(slotIndex + 1).padStart(2, '0')}を上書きしますか？`)) return;
      if (writeSaveGame(slotIndex)) {
        saveSlotStatus.textContent = `データ ${String(slotIndex + 1).padStart(2, '0')} にセーブしました。`;
        renderSaveSlots();
      } else {
        saveSlotStatus.textContent = 'セーブ情報を保存できませんでした。';
      }
    } else if (slotButton && saveSlotMode === 'load') {
      loadSaveGame(Number(slotButton.dataset.slotIndex));
    }
  });

  function openUnitMenu(unit) {
    selectedUnit = unit;
    pendingPrecisionTarget = null;
    attackChoiceCommand.hidden = true;
    itemChoiceCommand.hidden = true;
    itemConfirmCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    moveConfirmCommand.hidden = true;
    cursor.x = unit.x;
    cursor.y = unit.y;
    rangeMode = null;
    if (currentSide === 'enemy' && unit.side === 'enemy' && !debugMode) {
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      scrollToCursor();
      return;
    }
    if (unit.side !== currentSide && !(debugMode && unit.side === 'enemy')) {
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
    if ((selectedUnit.side !== currentSide && !(debugMode && selectedUnit.side === 'enemy')) || selectedUnit.ended) return;
    if (action === 'item') {
      showSpecialEquipmentChoice();
      return;
    }
    if (action === 'end') {
      unitCommand.hidden = true;
      attackChoiceCommand.hidden = true;
      itemChoiceCommand.hidden = true;
      itemConfirmCommand.hidden = true;
      precisionConfirmCommand.hidden = true;
      hateConfirmCommand.hidden = true;
      moveConfirmCommand.hidden = true;
      rangeMode = null;
      if (pendingMove?.unit === selectedUnit) pendingMove = null;
      selectedUnit.ended = true;
      checkUnitCompletion(selectedUnit);
      canvas.focus();
      return;
    }
    if (action === 'move' && (selectedUnit.moveRemaining ?? selectedUnit.moveRange) <= 0) return;
    if (action === 'attack' && selectedUnit.attackUsed) return;
    if (action !== 'move' && action !== 'attack') return;
    emptyCommand.hidden = true;
    if (action === 'attack') {
      unitCommand.hidden = true;
      attackChoiceSelection = 0;
      updateAttackChoiceSelection();
      attackChoiceCommand.hidden = false;
      canvas.focus();
      draw();
      return;
    }
    attackChoiceCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    rangeMode = action;
    unitCommand.hidden = true;
    itemChoiceCommand.hidden = true;
    itemConfirmCommand.hidden = true;
    moveConfirmCommand.hidden = true;
    cursor.x = selectedUnit.x;
    cursor.y = selectedUnit.y;
    scrollToCursor();
    canvas.focus();
  }

  function startAttackSelection() {
    if (!selectedUnit || selectedUnit.attackUsed) return;
    attackChoiceCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    rangeMode = 'attack';
    unitCommand.hidden = true;
    moveConfirmCommand.hidden = true;
    cursor.x = selectedUnit.x;
    cursor.y = selectedUnit.y;
    scrollToCursor();
    canvas.focus();
  }

  function startPrecisionTargetSelection() {
    if (!selectedUnit || selectedUnit.attackUsed || selectedUnit.moveUsed ||
        (selectedUnit.moveRemaining ?? selectedUnit.moveRange) < selectedUnit.moveRange) return;
    attackChoiceCommand.hidden = true;
    rangeMode = 'precision-target';
    unitCommand.hidden = true;
    cursor.x = selectedUnit.x;
    cursor.y = selectedUnit.y;
    scrollToCursor();
    canvas.focus();
  }

  function showPrecisionConfirmation(target) {
    if (!selectedUnit || !target || selectedUnit.attackUsed || selectedUnit.moveUsed ||
        (selectedUnit.moveRemaining ?? selectedUnit.moveRange) < selectedUnit.moveRange ||
        !(target.side === 'enemy' ? canAttackUnitTarget(selectedUnit, target) :
          target.destructible && canAttackObstacleTarget(selectedUnit, target))) return;
    pendingPrecisionTarget = target;
    precisionConfirmSelection = 0;
    updatePrecisionConfirmSelection();
    precisionConfirmCommand.hidden = false;
    canvas.focus();
    draw();
  }

  function showHateConfirmation() {
    if (!selectedUnit || selectedUnit.attackUsed) return;
    attackChoiceCommand.hidden = true;
    hateConfirmSelection = 0;
    updateHateConfirmSelection();
    hateConfirmCommand.hidden = false;
    canvas.focus();
    draw();
  }

  function updateHateConfirmSelection() {
    hateConfirmCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === hateConfirmSelection);
      button.setAttribute('aria-pressed', String(index === hateConfirmSelection));
    });
  }

  function startHateTargetSelection() {
    if (!selectedUnit || selectedUnit.attackUsed) return;
    hateConfirmCommand.hidden = true;
    rangeMode = 'hate';
    unitCommand.hidden = true;
    attackChoiceCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    cursor.x = selectedUnit.x;
    cursor.y = selectedUnit.y;
    scrollToCursor();
    canvas.focus();
  }

  async function tryHateTarget(target) {
    if (!selectedUnit || rangeMode !== 'hate' || target.side !== 'enemy' || unitDistance(selectedUnit, target) > 8) return false;
    isCombatResolving = true;
    target.hateTargetId = selectedUnit.id;
    selectedUnit.attackUsed = true;
    rangeMode = null;
    try {
      await playSe('whistle.mp3');
      showAttackMessage('ヘイト成功！');
      checkUnitCompletion(selectedUnit);
      return true;
    } finally {
      isCombatResolving = false;
      draw();
    }
  }

  function confirmPrecisionAttack() {
    const target = pendingPrecisionTarget;
    const isEnemyUnit = target?.side === 'enemy' && units.includes(target);
    const isDestructibleObstacle = target?.destructible && obstacles.includes(target);
    if (!selectedUnit || !target || (!isEnemyUnit && !isDestructibleObstacle) || selectedUnit.attackUsed || selectedUnit.moveUsed ||
        !(isEnemyUnit ? canAttackUnitTarget(selectedUnit, target) : canAttackObstacleTarget(selectedUnit, target)) ||
        (selectedUnit.moveRemaining ?? selectedUnit.moveRange) < selectedUnit.moveRange) return;
    selectedUnit.moveRemaining = 0;
    selectedUnit.moveUsed = true;
    selectedUnit.precisionAttackBonus = 2;
    updateMenuSelection();
    pendingPrecisionTarget = null;
    precisionConfirmCommand.hidden = true;
    rangeMode = 'attack';
    if (isDestructibleObstacle) void tryAttackObstacle(target);
    else void tryAttackTarget(target);
  }

  function updateAttackChoiceSelection() {
    const buttons = attackChoiceCommand.querySelectorAll('button');
    const preciseUnavailable = selectedUnit &&
      (selectedUnit.moveUsed || (selectedUnit.moveRemaining ?? selectedUnit.moveRange) < selectedUnit.moveRange);
    if (preciseUnavailable && attackChoiceSelection === 1) attackChoiceSelection = 0;
    buttons.forEach((button, index) => {
      const unavailable = index === 1 && preciseUnavailable;
      button.disabled = Boolean(unavailable);
      button.classList.toggle('selected', index === attackChoiceSelection && !button.disabled);
      button.setAttribute('aria-pressed', String(index === attackChoiceSelection));
    });
  }

  function updatePrecisionConfirmSelection() {
    precisionConfirmCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === precisionConfirmSelection);
      button.setAttribute('aria-pressed', String(index === precisionConfirmSelection));
    });
  }

  function updateMenuSelection() {
    const buttons = unitCommand.querySelectorAll('button');
    if (selectedUnit) {
      const canAct = (selectedUnit.side === currentSide || (debugMode && selectedUnit.side === 'enemy')) && !selectedUnit.ended;
      const remainingMove = selectedUnit.moveRemaining ?? selectedUnit.moveRange;
      const item = itemParameters.get(selectedUnit.itemTypeId);
      const itemUsesRemaining = selectedUnit.itemUsesRemaining ?? 0;
      buttons[0].textContent = `移動(${remainingMove})`;
      buttons[1].textContent = selectedUnit.attackUsed ? '攻撃済み' : selectedUnit.ended ? '攻撃せず終了' : '攻撃';
      buttons[2].textContent = !item ? '特殊装備' : itemUsesRemaining > 0 ? `特殊装備(${itemUsesRemaining})` : '特殊装備済み';
      buttons[3].textContent = 'ステータス';
      buttons[4].textContent = selectedUnit.ended ? '行動終了済み' : '行動終了';
      buttons[0].disabled = !canAct || remainingMove <= 0;
      buttons[1].disabled = !canAct || selectedUnit.attackUsed;
      buttons[2].disabled = !canAct || hasMovedOrAttacked(selectedUnit) || !item || itemUsesRemaining <= 0 ||
        !Number.isFinite(item.hpRestore) || item.hpRestore <= 0;
      buttons[3].disabled = false;
      buttons[4].disabled = !canAct;
    }
    const available = [...buttons].map((button, index) => index).filter((index) => !buttons[index].disabled);
    if (!available.includes(menuSelectionIndex)) menuSelectionIndex = available[0] ?? 0;
    buttons.forEach((button, index) => {
      button.classList.toggle('selected', index === menuSelectionIndex && !button.disabled);
      button.setAttribute('aria-pressed', String(index === menuSelectionIndex));
    });
  }

  function hasMovedOrAttacked(unit) {
    return !unit || unit.attackUsed || unit.moveUsed ||
      (unit.moveRemaining ?? unit.moveRange) < unit.moveRange;
  }

  function showSpecialEquipmentChoice() {
    const item = itemParameters.get(selectedUnit?.itemTypeId);
    if (!selectedUnit || selectedUnit.ended || hasMovedOrAttacked(selectedUnit) || !item || selectedUnit.itemUsesRemaining <= 0 ||
        !Number.isFinite(item.hpRestore) || item.hpRestore <= 0) return;
    emptyCommand.hidden = true;
    unitCommand.hidden = true;
    itemChoiceCommand.querySelector('[data-action="select-item"]').textContent = item.name ?? selectedUnit.itemTypeId;
    itemChoiceSelection = 0;
    updateItemChoiceSelection();
    itemChoiceCommand.hidden = false;
    canvas.focus();
    draw();
  }

  function updateItemChoiceSelection() {
    itemChoiceCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === itemChoiceSelection);
      button.setAttribute('aria-pressed', String(index === itemChoiceSelection));
    });
  }

  function showSpecialEquipmentConfirmation() {
    const item = itemParameters.get(selectedUnit?.itemTypeId);
    if (!selectedUnit || selectedUnit.ended || hasMovedOrAttacked(selectedUnit) || !item || selectedUnit.itemUsesRemaining <= 0) return;
    itemConfirmMessage.textContent = `${item.name ?? selectedUnit.itemTypeId}（HP+${item.hpRestore}）を使用しますか？`;
    itemChoiceCommand.hidden = true;
    itemConfirmSelection = 0;
    updateItemConfirmSelection();
    itemConfirmCommand.hidden = false;
    canvas.focus();
    draw();
  }

  function updateItemConfirmSelection() {
    itemConfirmCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === itemConfirmSelection);
      button.setAttribute('aria-pressed', String(index === itemConfirmSelection));
    });
  }

  function useSpecialEquipment(unit) {
    if (!unit) return;
    const item = itemParameters.get(unit.itemTypeId);
    const hpRestore = item?.hpRestore;
    if (unit.ended || hasMovedOrAttacked(unit) || !item || unit.itemUsesRemaining <= 0 ||
        !Number.isFinite(hpRestore) || hpRestore <= 0) return;

    const restoredHp = Math.min(hpRestore, Math.max(0, unit.maxHp - unit.hp));
    unit.hp += restoredHp;
    unit.itemUsesRemaining -= 1;
    unit.itemUsed = true;
    unit.ended = true;
    pendingMove = null;
    rangeMode = null;
    unitCommand.hidden = true;
    attackChoiceCommand.hidden = true;
    itemChoiceCommand.hidden = true;
    itemConfirmCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    moveConfirmCommand.hidden = true;
    unitStatus.hidden = true;
    showAttackMessage(`${unit.id}：特殊装備を使用。HP +${restoredHp}`, 1800);
    checkUnitCompletion(unit);
    canvas.focus();
    draw();
  }

  function showUnitStatus(unit, fromCommand) {
    statusFromCommand = fromCommand;
    unitCommand.hidden = true;
    const weapon = weaponParameters.get(unit.weaponTypeId);
    const armor = armorParameters.get(unit.armorTypeId);
    const item = itemParameters.get(unit.itemTypeId);
    const formatNumber = (value) => toFullWidthNumber(value ?? 0);
    const minRange = weapon?.minAttackRange ?? unit.minAttackRange ?? 1;
    const maxRange = weapon?.attackRange ?? unit.attackRange;
    const rangeText = minRange === maxRange
      ? formatNumber(maxRange)
      : `${formatNumber(minRange)}～${formatNumber(maxRange)}`;
    unitStatus.innerHTML = `<div class="status-title">${unit.id} <span class="status-side">${unit.side === 'player' ? 'PC' : 'EN'}</span></div>
      <div>●HP：${formatNumber(unit.hp)}/${formatNumber(unit.maxHp)}</div>
      <div>●移動力：${formatNumber(unit.moveRange)}</div>
      <div>●回避：${formatNumber(unit.evasion)}</div>
      <div>●命中補正：${formatNumber(unit.hitBonus)}</div>
      <div>●武器：${weapon?.name ?? unit.weaponTypeId ?? 'なし'}</div>
      <div class="status-detail">射程：${rangeText}</div>
      <div class="status-detail">攻撃力：${formatNumber(weapon?.attackPower ?? unit.attackPower)}</div>
      <div>●装備：${armor?.name ?? unit.armorTypeId ?? 'なし'}</div>
      <div>●特殊：${item ? `${item.name ?? unit.itemTypeId}（${formatNumber(unit.itemUsesRemaining)}）` : 'なし'}</div>`;
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
    setBgm(currentSide === 'player' ? phaseBgmFiles.player : phaseBgmFiles.enemy);
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
    else if (button.dataset.titleAction === 'load') openTitleLoadList();
    else if (button.dataset.titleAction === 'rules') openGameRules(true);
  });

  stageDebugMenu.addEventListener('click', (event) => {
    const stageButton = event.target.closest('[data-stage-id]');
    if (stageButton) {
      openStagePreview(stageButton.dataset.stageId);
      return;
    }
    if (event.target.closest('[data-stage-debug-close]')) toggleStageDebugMenu(false);
  });
  stagePreviewExit.addEventListener('click', exitStagePreview);

  gameResult.addEventListener('click', (event) => {
    const option = event.target.closest('[data-game-over-action]');
    if (option && gameOverOptionsReady && !clearTransitioning) {
      chooseGameOverAction(option.dataset.gameOverAction);
      return;
    }
    if (clearPromptReady && !clearTransitioning) {
      if (battleEndContinueResolve) {
        const resolve = battleEndContinueResolve;
        battleEndContinueResolve = null;
        resolve();
      } else {
        showClearStory();
      }
    }
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
    if (battleEndContinueResolve) {
      const resolve = battleEndContinueResolve;
      battleEndContinueResolve = null;
      resolve();
    } else {
      showClearStory();
    }
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
    if (!stageDebugMenu.hidden) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        stageDebugSelection = (stageDebugSelection + (event.key === 'ArrowDown' ? 1 : -1) + stageDebugButtons.length) % stageDebugButtons.length;
        updateStageDebugSelection();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        toggleStageDebugMenu(false);
      } else if (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'x') {
        event.preventDefault();
        stageDebugButtons[stageDebugSelection]?.click();
      }
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      titleSelection = (titleSelection + direction + titleOptions.length) % titleOptions.length;
      updateTitleSelection();
      return;
    }
    const confirmKey = event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'x';
    if (!confirmKey) return;
    event.preventDefault();
    if (titleOptions[titleSelection]?.dataset.titleAction === 'new') startNewGame();
    else if (titleOptions[titleSelection]?.dataset.titleAction === 'load') openTitleLoadList();
    else if (titleOptions[titleSelection]?.dataset.titleAction === 'rules') openGameRules(true);
  });

  async function openGameRules(fromTitle) {
    rulesReturnToTitle = fromTitle;
    if (fromTitle) titleScreen.classList.add('title-rule-open');
    else emptyCommand.hidden = true;
    gameRuleDialog.hidden = false;
    gameRuleContent.textContent = '読み込み中…';
    gameRuleDialog.querySelector('[data-action="close-game-rules"]')?.focus();
    try {
      renderGameRules(await loadEventScript('Data/Rule.txt'));
    } catch (error) {
      gameRuleContent.textContent = `ルールを読み込めませんでした。Data/Rule.txt を確認してください。\n${error.message || error}`;
    }
  }

  function closeGameRules() {
    gameRuleDialog.hidden = true;
    if (rulesReturnToTitle) {
      titleScreen.classList.remove('title-rule-open');
      titleOptions[titleSelection]?.focus();
    } else {
      emptyCommand.hidden = false;
      emptyCommand.querySelector('[data-action="rules"]')?.focus();
      draw();
    }
    rulesReturnToTitle = false;
  }

  function renderGameRules(source) {
    gameRuleContent.replaceChildren();
    let paragraph = [];
    let list = null;
    const flushParagraph = () => {
      if (!paragraph.length) return;
      const element = document.createElement('p');
      element.textContent = paragraph.join('');
      gameRuleContent.append(element);
      paragraph = [];
    };
    const closeList = () => { list = null; };

    for (const rawLine of source.replace(/\r/g, '').split('\n')) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        closeList();
      } else if (line.startsWith('●')) {
        flushParagraph();
        closeList();
        const heading = document.createElement('h3');
        heading.textContent = line.slice(1).trim();
        gameRuleContent.append(heading);
      } else if (line.startsWith('【') && line.endsWith('】')) {
        flushParagraph();
        closeList();
        const heading = document.createElement('h4');
        heading.textContent = line.slice(1, -1);
        gameRuleContent.append(heading);
      } else if (line.startsWith('《') && line.endsWith('》')) {
        flushParagraph();
        closeList();
        const heading = document.createElement('h5');
        heading.textContent = line;
        gameRuleContent.append(heading);
      } else if (line.startsWith('〇')) {
        flushParagraph();
        if (!list) {
          list = document.createElement('ul');
          gameRuleContent.append(list);
        }
        const item = document.createElement('li');
        item.textContent = line.slice(1).trim();
        list.append(item);
      } else {
        closeList();
        paragraph.push(line);
      }
    }
    flushParagraph();
  }

  function updateTitleSelection() {
    titleOptions.forEach((button, index) => {
      button.classList.toggle('selected', index === titleSelection);
      button.setAttribute('aria-current', index === titleSelection ? 'true' : 'false');
    });
  }

  function updateStageDebugSelection() {
    stageDebugButtons.forEach((button, index) => {
      button.classList.toggle('selected', index === stageDebugSelection);
      button.setAttribute('aria-current', index === stageDebugSelection ? 'true' : 'false');
    });
  }

  function toggleStageDebugMenu(forceOpen = stageDebugMenu.hidden) {
    const open = Boolean(forceOpen);
    stageDebugMenu.hidden = !open;
    stageDebugStatus.textContent = '';
    if (open) {
      stageDebugSelection = 0;
      updateStageDebugSelection();
      stageDebugButtons[0]?.focus();
    } else {
      titleOptions[titleSelection]?.focus();
    }
  }

  async function openStagePreview(stageId) {
    if (titleTransitioning) return;
    titleTransitioning = true;
    stageDebugMenu.hidden = true;
    stagePreviewPreviousStageId = currentStageId;
    stagePreviewPreviousRoster = playerRoster.map((unit) => ({ ...unit }));
    titleScreen.classList.add('fade-out');
    fadeOutBgm();
    await wait(700);
    titleScreen.hidden = true;
    introEvent.hidden = true;
    stagePreviewMode = true;
    currentStageId = String(stageId).padStart(3, '0');
    playerRoster = [];
    stagePreviewBanner.hidden = false;
    stagePreviewLabel.textContent = `マップ配置確認：Battle_${currentStageId}`;
    try {
      resetStageState();
      const battleScript = await loadEventScript(`Event/Battle_${currentStageId}.txt`);
      await applyBattleSetup(battleScript);
      prepareBattleEventData(battleScript);
      currentSide = 'player';
      sideTurnCounts.player = 1;
      sideTurnCounts.enemy = 1;
      unitCommand.hidden = true;
      attackChoiceCommand.hidden = true;
      itemChoiceCommand.hidden = true;
      itemConfirmCommand.hidden = true;
      precisionConfirmCommand.hidden = true;
      hateConfirmCommand.hidden = true;
      moveConfirmCommand.hidden = true;
      unitStatus.hidden = true;
      emptyCommand.hidden = true;
      updatePhaseLabel();
      const maxCameraX = Math.max(0, MAP_WIDTH - VIEW_WIDTH);
      const maxCameraY = Math.max(0, MAP_HEIGHT - VIEW_HEIGHT);
      camera.x = Math.max(0, Math.min(maxCameraX, startCursor.x - Math.floor(VIEW_WIDTH / 2)));
      camera.y = Math.max(0, Math.min(maxCameraY, startCursor.y - Math.floor(VIEW_HEIGHT / 2)));
      cameraTarget.x = camera.x;
      cameraTarget.y = camera.y;
      gameShell.hidden = false;
      draw();
      canvas.focus();
    } catch (error) {
      console.error(`Battle_${currentStageId}.txt のプレビューを読み込めませんでした。`, error);
      stagePreviewMode = false;
      stagePreviewBanner.hidden = true;
      gameShell.hidden = true;
      titleScreen.hidden = false;
      titleScreen.classList.remove('fade-out');
      stageDebugMenu.hidden = false;
      stageDebugStatus.textContent = `読み込み失敗：${error.message || error}`;
      playerRoster = stagePreviewPreviousRoster;
      currentStageId = stagePreviewPreviousStageId;
      setBgm('M001_Title.mp3');
    }
    titleTransitioning = false;
  }

  function exitStagePreview() {
    if (!stagePreviewMode) return;
    stagePreviewMode = false;
    stagePreviewBanner.hidden = true;
    gameShell.hidden = true;
    playerRoster = stagePreviewPreviousRoster;
    currentStageId = stagePreviewPreviousStageId;
    showTitleMenu();
  }

  async function startNewGame() {
    if (titleTransitioning) return;
    titleTransitioning = true;
    isClearStory = false;
    currentStageId = STAGE_ID;
    currentEventGoto = '';
    battleEventActive = false;
    completedBattleEvents.clear();
    eventFlags.clear();
    customPoints = 0;
    playerRoster = [];
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
      const eventPath = `Event/Event_${currentStageId}.txt`;
      const opening = parseEventSection(await loadEventScript(eventPath), '\uff2f\uff30');
      currentEventGoto = opening.goto || '';
      if (!opening.message) throw new Error(`${eventPath} にOPのＭＥＳがありません。`);
      introEventImage.src = `Unit/${opening.background || introImageSource.split('/').pop()}`;
      await waitForImage(introEventImage);
      if (opening.bgm) setBgm(opening.bgm);
      currentStoryText = opening.message;
    } catch (error) {
      console.error('OPイベントを読み込めませんでした。', error);
      currentStoryText = `OPイベントを読み込めませんでした。\n${error.message || error}\nEvent/Event_${currentStageId}.txt と素材を確認してください。`;
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
    const normalizedSectionName = sectionName.normalize('NFKC').trim();
    const sectionIndex = lines.findIndex((line) => line.replace(/\/\/.*$/, '').normalize('NFKC').trim() === normalizedSectionName);
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
    const event = { background: '', bgm: '', fadeIn: false, message: '', saveList: false };
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
      const normalizedCommand = trimmed.normalize('NFKC');
      if (/^SAVE(?:\s|[_-]|[^\x00-\x7f])/i.test(normalizedCommand)) {
        event.saveList = true;
        readingMessage = false;
        continue;
      }
      const gotoMatch = normalizedCommand.match(/^GOTO\s*:\s*(.+)$/i);
      if (gotoMatch) { event.goto = gotoMatch[1].trim(); break; }
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

  async function playClearStory(stageId = currentStageId, sectionName = '\uff25\uff30') {
    isClearStory = true;
    currentStorySection = sectionName.normalize('NFKC').trim();
    currentEventGoto = '';
    currentEventSaveList = false;
    currentStageId = String(stageId).padStart(3, '0');
    storyStart.textContent = '\u300aContinue\u300b';
    storyText.textContent = '';
    storyStart.disabled = true;
    skipStoryReveal = false;
    try {
      const eventPath = `Event/Event_${currentStageId}.txt`;
      const epilogue = parseEventSection(await loadEventScript(eventPath), sectionName);
      currentEventGoto = epilogue.goto || '';
      currentEventSaveList = epilogue.saveList;
      if (!epilogue.message) throw new Error(`${eventPath} に${sectionName}のＭＥＳがありません。`);
      const defaultBackground = sectionName.normalize('NFKC').toUpperCase() === 'OP' ? 'Event_01.png' : 'Event_01_ED.png';
      introEventImage.src = 'Unit/' + (epilogue.background || defaultBackground);
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

  async function followEventGoto(target) {
    const normalized = target.normalize('NFKC').trim();
    const eventTarget = normalized.match(/^EVENT_(\d+)\s+(.+)$/i);
    if (eventTarget) {
      await playClearStory(eventTarget[1], eventTarget[2]);
      return;
    }
    const battleTarget = normalized.match(/^BATTLE_(\d+)$/i);
    if (battleTarget) {
      currentStageId = battleTarget[1].padStart(3, '0');
      isClearStory = false;
      await loadBattleOpening(currentStageId);
      return;
    }
    currentEventGoto = '';
    storyText.textContent = `未対応のGOTO先です: ${target}`;
    storyStart.textContent = '\u300aClick to Top\u300b';
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
    pendingPrecisionTarget = null;
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
    isEnemyAiRunning = false;
    isCombatResolving = false;
    pendingMove = null;
    phaseInputLocked = false;
    clearPromptReady = false;
    clearTransitioning = false;
    gameOverOptionsReady = false;
    gameOverSelection = 0;
    explosionEffects.length = 0;
    hitEffects.length = 0;
    cursor.x = startCursor.x;
    cursor.y = startCursor.y;
    camera.x = initialCamera.x;
    camera.y = initialCamera.y;
    cameraTarget.x = initialCamera.x;
    cameraTarget.y = initialCamera.y;
    unitCommand.hidden = true;
    attackChoiceCommand.hidden = true;
    itemChoiceCommand.hidden = true;
    itemConfirmCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    saveSlotDialog.hidden = true;
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
    if (battleEventActive) closeBattleMessage();
    else if (currentEventSaveList) {
      currentEventSaveList = false;
      saveListReturnToStory = true;
      saveSlotDialog.classList.add('floating-save-dialog');
      document.body.append(saveSlotDialog);
      openSaveSlotList('save');
      saveSlotDialog.querySelector('[data-action="close-save-slots"]')?.focus();
    } else if (currentEventGoto) {
      const next = currentEventGoto;
      currentEventGoto = '';
      followEventGoto(next);
    } else if (isClearStory) returnToTitle();
    else loadBattleOpening(currentStageId);
  });

  storyWindow.addEventListener('click', (event) => {
    if (battleEventActive || event.target.closest('button')) return;
    if (!storySkip.hidden) {
      revealStoryImmediately();
    } else if (!storyStart.disabled) {
      storyStart.click();
    }
  });

  introEvent.addEventListener('click', () => {
    if (!battleEventActive) return;
    if (storyStart.disabled) revealStoryImmediately();
    else closeBattleMessage();
  });

  storySkip.addEventListener('click', () => {
    if (storySkip.hidden) return;
    revealStoryImmediately();
  });

  function revealStoryImmediately() {
    skipStoryReveal = true;
    storyText.textContent = currentStoryText;
    storyText.scrollTop = storyText.scrollHeight;
    storySkip.hidden = true;
    storyStart.disabled = false;
  }

  async function loadBattleOpening(stageId = currentStageId) {
    currentStageId = String(stageId).padStart(3, '0');
    window.clearTimeout(phaseAnnouncementTimer);
    phaseAnnouncement.hidden = true;
    phaseInputLocked = false;
    clearTransitioning = false;
    clearPromptReady = false;
    isGameOver = false;
    isEnemyAiRunning = false;
    isCombatResolving = false;
    isUnitMoving = false;
    pendingMove = null;
    pendingPrecisionTarget = null;
    selectedUnit = null;
    combatTarget = null;
    rangeMode = null;
    turnConfirm.hidden = true;
    completedBattleEvents.clear();
    eventFlags.clear();
    currentSide = 'player';
    sideTurnCounts.player = 1;
    sideTurnCounts.enemy = 1;
    currentEventGoto = '';
    const battlePath = `Event/Battle_${currentStageId}.txt`;
    storyStart.disabled = true;
    try {
      const battleScript = await loadEventScript(battlePath);
      await applyBattleSetup(battleScript);
      prepareBattleEventData(battleScript);
      const turnZeroMessages = parseBattleMessageRecords(extractEventBlock(battleScript, 'ターン　０'));
      if (!turnZeroMessages.length) throw new Error('ターン　０にＭＥＳがありません。');
      await enterStage();
      await playBattleMessages(turnZeroMessages);
      announceCurrentTurn();
      playPhaseBgm();
    } catch (error) {
      console.error(`${battlePath} を読み込めませんでした。`, error);
      storyText.textContent = `${battlePath} を読み込めませんでした。\n${error.message || error}`;
      storyStart.disabled = false;
      storySkip.hidden = true;
      introEvent.hidden = false;
    }
  }

  function prepareBattleEventData(battleScript) {
    const battleEvents = parseBattleTriggerRecords(battleScript);
    battleAttackEvents = battleEvents.attacks;
    battleDefenseEvents = battleEvents.defenses;
    battleDefeatEvents = battleEvents.defeats;
    battleObjectDefeatEvent = battleEvents.objectDefeat;
    battleEndEvent = battleEvents.end;
    npcDefinitions = parseNpcDefinitions(battleScript);
  }

  function showBattleMessage(message) {
    return new Promise((resolve) => {
      battleMessageResolve = resolve;
      battleEventActive = true;
      currentStoryText = message;
      storyText.textContent = '';
      storySpeaker.textContent = activeBattleSpeaker;
      storyWindow.classList.toggle('system-message', activeBattleSystemMessage);
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
    storyWindow.classList.remove('system-message');
    storyStart.textContent = '\u300aGame Start\u300b';
    canvas.focus();
    const resolveMessage = battleMessageResolve;
    battleMessageResolve = null;
    resolveMessage?.();
  }

  let activeBattleSpeaker = '';
  let activeBattleSystemMessage = false;

  async function playBattleMessages(messages) {
    for (const message of messages) {
      // MESのユニットIDはカーソル移動先。発話者名とは独立して扱う。
      if (message.followCursor) {
        const targetId = normalizeUnitId(message.unitId);
        const target = units.find((unit) => normalizeUnitId(unit.id) === targetId);
        if (target) {
          cursor.x = target.x;
          cursor.y = target.y;
          scrollToCursor();
          await waitForCameraToStop();
          draw();
        } else {
          console.warn(`MESのカーソル移動先 ${targetId} が配置されていません。`);
        }
      }
      activeBattleSpeaker = message.speaker;
      activeBattleSystemMessage = message.systemMessage;
      await showBattleMessage(message.text);
    }
    activeBattleSpeaker = '';
    activeBattleSystemMessage = false;
    closeBattleMessage();
  }

  function normalizeBattleLine(line) {
    return line.normalize('NFKC').trim();
  }

  function parseBattleTriggerRecords(source) {
    const attacks = new Map();
    const defenses = new Map();
    const defeats = new Map();
    let objectDefeat = null;
    let end = null;
    const names = source.replace(/\r/g, '').split('\n')
      .map((line) => line.trim())
      .filter((line) => /^(?:攻撃前|撃破)[\t \u3000]+[\d０-９]+$/.test(line));

    for (const name of names) {
      const normalizedName = normalizeBattleLine(name);
      const lines = extractEventBlock(source, name);
      const messages = parseBattleMessageRecords(lines);
      const attackName = normalizedName.match(/^攻撃前\s+(\d+)$/);
      if (attackName) {
        const condition = lines.map(normalizeBattleLine).find((line) => /^(?:PC\d+\s+VS\s+EN|EN\s+VS\s+PC\d+)$/.test(line));
        const outgoing = condition?.match(/^PC(\d+)\s+VS\s+EN$/);
        const incoming = condition?.match(/^EN\s+VS\s+PC(\d+)$/);
        if (messages.length && outgoing) {
          attacks.set(`PC${outgoing[1].padStart(2, '0')}`, { name, messages });
        } else if (messages.length && incoming) {
          defenses.set(`PC${incoming[1].padStart(2, '0')}`, { name, messages });
        }
        continue;
      }

      const defeatName = normalizedName.match(/^撃破\s+(\d+)$/);
      if (defeatName?.[1] === '100') {
        end = { name, lines };
      } else if (defeatName) {
        const objectCondition = lines.map(normalizeBattleLine).find((line) => line === 'OBJ');
        const condition = lines.map(normalizeBattleLine).find((line) => /^PC\d+$/.test(line));
        const match = condition?.match(/^PC(\d+)$/);
        if (objectCondition && messages.length) objectDefeat = { name, messages };
        else if (match) defeats.set(`PC${match[1].padStart(2, '0')}`, { name, messages });
      }
    }

    return { attacks, defenses, defeats, objectDefeat, end };
  }

  async function enterStage() {
    gameShell.hidden = false;
    updatePhaseLabel();
    draw();
    introEvent.classList.remove('fade-out');
    await wait(32);
    introEvent.classList.add('fade-out');
    await wait(700);
    introEvent.hidden = true;
    introEvent.classList.remove('fade-out');
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
      const rawText = body.join('\n').trim();
      const text = rawText.startsWith('「') && rawText.endsWith('」')
        ? rawText.slice(1, -1).trim()
        : rawText;
      if (!command || !text) return;
      messages.push({
        speaker: normalizeBattleLine(command.speaker) === 'システムメッセージ' ? '' : command.speaker,
        systemMessage: normalizeBattleLine(command.speaker) === 'システムメッセージ',
        unitId: command.unitId,
        followCursor: command.followCursor,
        text,
      });
    };

    for (const line of lines) {
      const normalizedLine = normalizeBattleLine(line);
      const targetedCommand = normalizedLine.match(/^MES\s+(.+?)\s+((?:PC|EN|NPC)\d+)\s+([YN])$/i);
      const untargetedCommand = targetedCommand ? null : normalizedLine.match(/^MES\s+(.+)$/i);
      const nextCommand = targetedCommand
        ? {
          speaker: targetedCommand[1].trim(),
          unitId: normalizeUnitId(targetedCommand[2]),
          followCursor: targetedCommand[3] === 'Y',
        }
        : untargetedCommand
          ? { speaker: untargetedCommand[1].trim(), unitId: null, followCursor: false }
          : null;
      if (nextCommand) {
        saveMessage();
        command = nextCommand;
        body = [];
      } else if (command && normalizedLine !== '{' && normalizedLine !== '}' && !isBattleDirective(normalizedLine)) {
        body.push(line.trim());
      } else if (command && isBattleDirective(normalizedLine)) {
        saveMessage();
        command = null;
        body = [];
      }
    }
    saveMessage();
    return messages;
  }

  function isBattleDirective(line) {
    return /^(?:IF\s+PC\d+|IF\s+座標\s+PC\d+|ELSE|ゲームオーバー|ステージクリア|クリアボーナス(?:\s|$)|フラグ\s|GOTO(?:\s|:|：)|ＧＯＴＯ(?:\s|:|：))$/i.test(line) ||
      /^(?:ゲームオーバー|ステージクリア|クリアボーナス\s+\d+|フラグ\s+ON\s+.+|GOTO(?:\s|:|：).+|ＧＯＴＯ(?:\s|:|：).+)$/i.test(line);
  }

  function extractBattleBraceBlock(lines, startIndex) {
    let depth = 0;
    const blockLines = [];
    for (let index = startIndex; index < lines.length; index++) {
      const line = normalizeBattleLine(lines[index]);
      let content = '';
      for (let characterIndex = 0; characterIndex < line.length; characterIndex++) {
        const character = line[characterIndex];
        if (character === '{') {
          if (depth > 0) content += character;
          depth++;
        } else if (character === '}') {
          depth--;
          if (depth === 0) {
            if (content.trim()) blockLines.push(content.trim());
            return { lines: blockLines, endIndex: index, tail: line.slice(characterIndex + 1).trim() };
          }
          content += character;
        } else if (depth > 0) {
          content += character;
        }
      }
      if (depth > 0 && content.trim()) blockLines.push(content.trim());
    }
    return null;
  }

  function findBattleConditionBlock(lines, condition) {
    const index = lines.findIndex((line) => normalizeBattleLine(line) === condition);
    return index < 0 ? null : extractBattleBraceBlock(lines, index + 1);
  }

  function selectBattleIfBranches(lines) {
    const selectedLines = [];
    for (let index = 0; index < lines.length; index++) {
      const normalizedLine = normalizeBattleLine(lines[index]);
      const aliveCondition = normalizedLine.match(/^IF\s+(PC\d+)$/i);
      const coordinateCondition = normalizedLine.match(/^IF\s+座標\s+(PC\d+)\s*\((\d+)\s*,\s*(\d+)\)\s*\((\d+)\s*,\s*(\d+)\)$/i);
      if (!aliveCondition && !coordinateCondition) {
        selectedLines.push(lines[index]);
        continue;
      }

      const thenBlock = extractBattleBraceBlock(lines, index + 1);
      if (!thenBlock) continue;
      let elseIndex = thenBlock.endIndex + 1;
      let hasElse = /^else$/i.test(thenBlock.tail);
      if (!hasElse && normalizeBattleLine(lines[elseIndex] ?? '').toLowerCase() === 'else') {
        hasElse = true;
        elseIndex++;
      }
      const elseBlock = hasElse ? extractBattleBraceBlock(lines, elseIndex) : null;
      let conditionMet;
      if (coordinateCondition) {
        const unit = units.find((candidate) => candidate.id === normalizeUnitId(coordinateCondition[1]));
        if (unit) {
          const x1 = Number(coordinateCondition[2]);
          const y1 = Number(coordinateCondition[3]);
          const x2 = Number(coordinateCondition[4]);
          const y2 = Number(coordinateCondition[5]);
          const minX = Math.min(x1, x2);
          const maxX = Math.max(x1, x2);
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          const mapX = unit.x + 1;
          const mapY = unit.y + 1;
          conditionMet = mapX >= minX && mapX <= maxX && mapY >= minY && mapY <= maxY;
        } else {
          conditionMet = false;
        }
      } else {
        conditionMet = units.some((unit) => unit.id === normalizeUnitId(aliveCondition[1]));
      }
      const chosen = conditionMet ? thenBlock : elseBlock;
      if (chosen) selectedLines.push(...selectBattleIfBranches(chosen.lines));
      index = (elseBlock ?? thenBlock).endIndex;
    }
    return selectedLines;
  }

  async function playBattleEndCommands(lines) {
    const selectedLines = selectBattleIfBranches(lines);
    let pendingMessageLines = [];
    let reachedEpilogue = false;
    const flushMessages = async () => {
      const messages = parseBattleMessageRecords(pendingMessageLines);
      pendingMessageLines = [];
      if (messages.length) await playBattleMessages(messages);
    };

    for (const rawLine of selectedLines) {
      const line = normalizeBattleLine(rawLine);
      const reinforcement = line.match(/^援軍配置\s+(NPC\d+)\s*:\s*\((\d+)\s*,\s*(\d+)\)$/i);
      const cursorCommand = line.match(/^カーソル\s*\((\d+)\s*,\s*(\d+)\)$/);
      const gotoEpilogue = new RegExp(`^GOTO\\s*:\\s*EVENT_${currentStageId}\\s+EP$`, 'i').test(line.normalize('NFKC'));
      if (!reinforcement && !cursorCommand && line !== 'ステージクリア' && !gotoEpilogue) {
        pendingMessageLines.push(rawLine);
        continue;
      }

      await flushMessages();
      if (line === 'ステージクリア') {
        finishGame('ステージクリア');
        await new Promise((resolve) => { battleEndContinueResolve = resolve; });
        clearTransitioning = true;
        gameResult.classList.add('fade-out');
        await wait(700);
        gameResult.hidden = true;
        gameResult.classList.remove('fade-out', 'show-next');
        clearPromptReady = false;
        isGameOver = false;
        clearTransitioning = false;
      } else if (gotoEpilogue) {
        clearTransitioning = true;
        isGameOver = true;
        gameShell.hidden = true;
        introEvent.hidden = false;
        await playClearStory();
        reachedEpilogue = true;
        break;
      } else if (reinforcement) {
        await deployBattleNpc(reinforcement[1], Number(reinforcement[2]), Number(reinforcement[3]));
      } else {
        cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, Number(cursorCommand[1]) - 1));
        cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(cursorCommand[2]) - 1));
        scrollToCursor();
        await waitForCameraToStop();
        draw();
      }
    }

    await flushMessages();
    return reachedEpilogue;
  }

  async function deployBattleNpc(rawId, mapX, mapY) {
    const id = normalizeUnitId(rawId);
    const definition = npcDefinitions.get(id);
    if (!definition?.imageFile) throw new Error(`NPC_Paramに${id}の画像指定がありません。`);
    const existing = units.find((unit) => unit.id === id);
    if (existing) units.splice(units.indexOf(existing), 1);
    const unit = createBattleNpc(id, mapX - 1, mapY - 1, definition);
    unit.image.src = `Unit/${unit.imageFile}`;
    await waitForImage(unit.image);
    units.push(unit);
    draw();
  }

  function createBattleNpc(id, x, y, definition) {
    const parameters = npcBaseParameters.get(definition.unitTypeId) ?? {};
    const size = parameters.size ?? 1;
    const widthInTiles = size === 2 || size === 4 ? 2 : 1;
    const heightInTiles = size === 4 ? 2 : 1;
    return {
      id,
      side: 'npc',
      x: Math.max(0, Math.min(MAP_WIDTH - widthInTiles, x)),
      y: Math.max(0, Math.min(MAP_HEIGHT - heightInTiles, y)),
      hp: parameters.hp ?? 1,
      maxHp: parameters.hp ?? 1,
      moveRange: parameters.moveRange ?? 0,
      moveRemaining: 0,
      minAttackRange: 1,
      attackRange: 0,
      attackPower: 0,
      evasion: parameters.evasion ?? 0,
      hitBonus: parameters.hitBonus ?? 0,
      moveUsed: true,
      attackUsed: true,
      ended: true,
      unitTypeId: definition.unitTypeId ?? '',
      imageFile: definition.imageFile,
      spriteWidth: widthInTiles * TILE_SIZE,
      spriteHeight: heightInTiles * TILE_SIZE,
      image: new Image(),
    };
  }

  async function runBattleAttackEvent(attacker, target) {
    const event = attacker.side === 'player'
      ? battleAttackEvents.get(attacker.id)
      : battleDefenseEvents.get(target.id);
    if (!event || completedBattleEvents.has(event.name)) return;
    completedBattleEvents.add(event.name);
    await playBattleMessages(event.messages);
  }

  async function runBattleDefeatEvent(unit) {
    const event = battleDefeatEvents.get(unit.id);
    if (!event || completedBattleEvents.has(event.name)) return;
    completedBattleEvents.add(event.name);
    await playBattleMessages(event.messages);
  }

  async function runBattleObjectDefeatEvent() {
    const event = battleObjectDefeatEvent;
    if (!event || completedBattleEvents.has(event.name)) return false;
    completedBattleEvents.add(event.name);
    await playBattleMessages(event.messages);
    return true;
  }

  async function resolveBattleEndEvent() {
    const playersRemaining = units.some((unit) => unit.side === 'player');
    const enemiesRemaining = units.some((unit) => unit.side === 'enemy');
    if (playersRemaining && enemiesRemaining) return;

    if (battleEndEvent && completedBattleEvents.has(battleEndEvent.name)) return;
    if (battleEndEvent) completedBattleEvents.add(battleEndEvent.name);

    if (!playersRemaining) {
      finishGame('ゲームオーバー');
      return;
    }

    if (!enemiesRemaining) {
      const clearBlock = battleEndEvent && findBattleConditionBlock(battleEndEvent.lines, 'ALL EN');
      eventFlags.add(`Battle_${currentStageId}`);
      const reachedEpilogue = clearBlock ? await playBattleEndCommands(clearBlock.lines) : false;
      if (!reachedEpilogue) finishGame('ステージクリア');
    }
  }

  async function applyBattleSetup(source) {
    const parameterTable = parseParameterTable(await loadEventScript('Data/Param_table.txt'));
    unitBaseParameters = parameterTable.units;
    npcBaseParameters = parameterTable.npcs;
    weaponParameters = parameterTable.weapons;
    armorParameters = parameterTable.armors;
    itemParameters = parameterTable.items;
    const carriedPlayerLoadouts = new Map(playerRoster.map((unit) => [normalizeUnitId(unit.id), {
      imageFile: unit.imageFile,
      unitTypeId: unit.unitTypeId,
      weaponTypeId: unit.weaponTypeId,
      armorTypeId: unit.armorTypeId,
      itemTypeId: unit.itemTypeId,
    }]));
    const stagePlayerLoadouts = parseUnitLoadouts(source, 'ADD_Param');
    for (const [id, loadout] of stagePlayerLoadouts) carriedPlayerLoadouts.set(id, {
      ...carriedPlayerLoadouts.get(id),
      ...loadout,
    });
    const stageEnemyLoadouts = parseUnitLoadouts(source, 'EN_Param');
    validateUnitLoadouts(carriedPlayerLoadouts, 'ADD_Param');
    validateUnitLoadouts(stageEnemyLoadouts, 'EN_Param');
    const unitLoadouts = new Map([
      ...carriedPlayerLoadouts,
      ...stageEnemyLoadouts,
    ]);
    phaseBgmFiles = parsePhaseBgm(source);
    const setupLines = extractEventBlock(source, '初期配置');
    npcDefinitions = parseNpcDefinitions(source);
    const npcMovementGoals = parseNpcMovementGoals(source);
    const mapLine = setupLines.map((line) => line.normalize('NFKC').trim()).find((line) => /^MAP\s*:/i.test(line));
    const mapConfig = mapLine?.match(/^MAP\s*:\s*(\S+)\s+(\d+)\s*\*\s*(\d+)$/i);
    if (!mapConfig) throw new Error('初期配置に「MAP:画像名 横*縦」を指定してください。');
    const [, mapFile, widthText, heightText] = mapConfig;
    const nextMapWidth = Number(widthText);
    const nextMapHeight = Number(heightText);
    if (!Number.isInteger(nextMapWidth) || nextMapWidth < 1 || !Number.isInteger(nextMapHeight) || nextMapHeight < 1) {
      throw new Error(`MAPのサイズ指定が不正です: ${mapLine}`);
    }
    MAP_WIDTH = nextMapWidth;
    MAP_HEIGHT = nextMapHeight;
    VIEW_WIDTH = Math.min(MAX_VIEW_WIDTH, MAP_WIDTH);
    VIEW_HEIGHT = Math.min(MAX_VIEW_HEIGHT, MAP_HEIGHT);
    VIEW_PIXEL_WIDTH = TILE_SIZE * VIEW_WIDTH;
    VIEW_PIXEL_HEIGHT = TILE_SIZE * VIEW_HEIGHT;
    canvas.width = VIEW_PIXEL_WIDTH;
    canvas.height = VIEW_PIXEL_HEIGHT;
    mapSizeLabel.textContent = `MAP ${MAP_WIDTH} × ${MAP_HEIGHT} · VIEW ${VIEW_WIDTH} × ${VIEW_HEIGHT}`;
    mapFrame.setAttribute('aria-label', `マップ ${MAP_WIDTH}マス×${MAP_HEIGHT}マス`);
    startCursor.x = Math.floor(MAP_WIDTH / 2);
    startCursor.y = Math.floor(MAP_HEIGHT / 2);
    const mapPath = mapFile.replace(/^Unit[\\/]/i, '');
    const mapUrl = new URL(`Unit/${mapPath}`, document.baseURI).href;
    if (mapBackground.src !== mapUrl) {
      const imageLoaded = new Promise((resolve, reject) => {
        const onLoad = () => {
          mapBackground.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          mapBackground.removeEventListener('load', onLoad);
          reject(new Error(`マップ画像を読み込めません: ${mapFile}`));
        };
        mapBackground.addEventListener('load', onLoad, { once: true });
        mapBackground.addEventListener('error', onError, { once: true });
      });
      mapBackground.src = mapUrl;
      await imageLoaded;
    } else if (!mapBackground.naturalWidth) {
      throw new Error(`マップ画像を読み込めません: ${mapFile}`);
    }
    const coordinatePattern = /^\s*(PC\d+|EN\d+|OBJ\d+)\s*:\s*(.+?)(?:\s*:\s*(type_[\w-]+))?\s*[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]\s*(?::\s*HP\s*(\d+)|\s+HP\s*(\d+))?\s*$/i;
    units.splice(0, units.length, ...unitTemplates.map((unit) => ({ ...unit, image: new Image() })));
    const playerTemplate = unitTemplates.find((unit) => unit.side === 'player');
    if (stagePlayerLoadouts.size && !playerTemplate) throw new Error('プレイヤーユニットの初期テンプレートがありません。');
    for (const id of stagePlayerLoadouts.keys()) {
      if (units.some((unit) => unit.id === id)) continue;
      units.push({ ...playerTemplate, id, image: new Image() });
    }
    const enemyTemplate = unitTemplates.find((unit) => unit.side === 'enemy');
    if (stageEnemyLoadouts.size && !enemyTemplate) throw new Error('敵ユニットの初期テンプレートがありません。');
    for (const id of stageEnemyLoadouts.keys()) {
      if (units.some((unit) => unit.id === id)) continue;
      units.push({ ...enemyTemplate, id, image: new Image() });
    }
    const configuredObstacles = [];
    const configuredUnitIds = new Set();
    const configureUnit = (unit, id, position, fallbackImageFile = '') => {
      const loadout = unitLoadouts.get(id);
      const unitTypeId = loadout?.unitTypeId ?? getDefaultUnitType(unit);
      const baseParameters = unitBaseParameters.get(unitTypeId);
      if (!baseParameters) throw new Error(`Param_table.txt に ${unitTypeId} の定義がありません。`);
      unit.unitTypeId = unitTypeId;
      unit.hp = baseParameters.hp ?? unit.hp;
      unit.maxHp = baseParameters.maxHp ?? baseParameters.hp ?? unit.maxHp;
      unit.moveRange = baseParameters.moveRange ?? unit.moveRange;
      unit.evasion = baseParameters.evasion ?? unit.evasion;
      unit.hitBonus = baseParameters.hitBonus ?? unit.hitBonus;
      unit.strength = baseParameters.strength ?? unit.strength;
      unit.spriteWidth = baseParameters.spriteWidth ?? unit.spriteWidth ?? TILE_SIZE;
      unit.spriteHeight = baseParameters.spriteHeight ?? unit.spriteHeight ?? TILE_SIZE;
      unit.weaponTypeId = loadout?.weaponTypeId ?? getDefaultWeaponType(unit);
      unit.armorTypeId = loadout?.armorTypeId ?? unit.armorTypeId ?? '';
      unit.itemTypeId = loadout?.itemTypeId ?? '';
      const item = unit.itemTypeId ? itemParameters.get(unit.itemTypeId) : null;
      if (unit.itemTypeId && !item) throw new Error(`Param_table.txt に ${unit.itemTypeId} の定義がありません。`);
      unit.itemUsesRemaining = item?.uses ?? 0;
      unit.itemUsed = false;
      const weapon = weaponParameters.get(unit.weaponTypeId);
      if (!weapon) throw new Error(`Param_table.txt に ${unit.weaponTypeId} の定義がありません。`);
      unit.attackRange = weapon.attackRange ?? unit.attackRange;
      unit.minAttackRange = weapon.minAttackRange ?? 1;
      unit.attackPower = weapon.attackPower ?? unit.attackPower;
      unit.weaponAccuracy = weapon.accuracy;
      unit.x = position.x;
      unit.y = position.y;
      unit.imageFile = loadout?.imageFile ?? fallbackImageFile;
      unit.moveUsed = false;
      unit.moveRemaining = unit.moveRange;
      unit.precisionAttackBonus = 0;
      unit.attackUsed = false;
      unit.ended = false;
    };

    for (const line of setupLines) {
      const match = line.normalize('NFKC').match(coordinatePattern);
      if (!match) continue;
      const [, id, imageFile, parameterTypeId, x, y, hpWithColon, hpWithSpace] = match;
      const position = { x: Number(x) - 1, y: Number(y) - 1 };
      if (id.startsWith('OBJ')) {
        const objectHp = hpWithColon ?? hpWithSpace;
        const destructible = objectHp !== undefined;
        configuredObstacles.push({
          id,
          ...position,
          ...(destructible ? { hp: Number(objectHp), maxHp: Number(objectHp), destructible: true } : {}),
          imageFile: imageFile.trim(),
          image: new Image(),
        });
        continue;
      }

      const unit = units.find((candidate) => candidate.id === id);
      if (!unit) continue;
      configuredUnitIds.add(id);
      configureUnit(unit, id.toUpperCase(), position, imageFile.trim());
    }

    const placementLines = tryExtractEventBlock(source, '\u914d\u7f6e');
    for (const line of placementLines) {
      const match = line.normalize('NFKC').match(/^\s*(PC\d+|EN\d+|NPC\d+)\s*:\s*[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]\s*$/i);
      if (!match) continue;
      const [, rawId, x, y] = match;
      const id = normalizeUnitId(rawId);
      if (id.startsWith('NPC')) {
        const definition = npcDefinitions.get(id);
        if (!definition?.imageFile) throw new Error(`NPC_Paramに${id}の画像指定がありません。`);
        units.push(createBattleNpc(id, Number(x) - 1, Number(y) - 1, definition));
        configuredUnitIds.add(id);
        continue;
      }
      const unit = units.find((candidate) => candidate.id === id);
      const loadout = unitLoadouts.get(id);
      if (!unit || (!loadout?.imageFile && !stagePreviewMode)) continue;
      configuredUnitIds.add(id);
      configureUnit(unit, id, { x: Number(x) - 1, y: Number(y) - 1 }, loadout?.imageFile ?? `${id}s.png`);
    }

    for (const [id, goal] of npcMovementGoals) {
      const npc = units.find((unit) => unit.id === id && unit.side === 'npc');
      if (!npc) throw new Error(`NPC movement goal target ${id} is not in the placement block.`);
      if (goal.x < 0 || goal.x >= MAP_WIDTH || goal.y < 0 || goal.y >= MAP_HEIGHT) {
        throw new Error(`NPC movement goal for ${id} (${goal.x + 1},${goal.y + 1}) is outside the map.`);
      }
      npc.movementGoal = goal;
    }

    units.splice(0, units.length, ...units.filter((unit) => configuredUnitIds.has(unit.id)));
    obstacles.splice(0, obstacles.length, ...configuredObstacles);
    for (const obstacle of obstacles) obstacle.image.src = `Unit/${obstacle.imageFile}`;
    initialObstacles.splice(0, initialObstacles.length, ...obstacles.map((obstacle) => ({ ...obstacle })));
    for (const unit of units) {
      unit.image.src = `Unit/${unit.imageFile ?? `${unit.id}s.png`}`;
    }
    initialUnits.splice(0, initialUnits.length, ...units.map((unit) => ({ ...unit })));
    const updatedPlayerRoster = new Map(playerRoster.map((unit) => [normalizeUnitId(unit.id), unit]));
    for (const unit of units.filter((candidate) => candidate.side === 'player')) {
      const record = serializeEntity(unit);
      delete record.x;
      delete record.y;
      delete record.moveRemaining;
      delete record.moveUsed;
      delete record.attackUsed;
      delete record.ended;
      delete record.hateTargetId;
      updatedPlayerRoster.set(normalizeUnitId(unit.id), record);
    }
    for (const [id, loadout] of stagePlayerLoadouts) {
      updatedPlayerRoster.set(id, { ...updatedPlayerRoster.get(id), id, side: 'player', ...loadout });
    }
    playerRoster = [...updatedPlayerRoster.values()];
    await Promise.all([...units, ...obstacles].map((entity) => waitForImage(entity.image)));

    impassableTiles.clear();
    lineOfSightBlockedTiles.clear();
    let readingTerrain = false;
    let terrainBlocksLineOfSight = false;
    for (const line of setupLines) {
      const trimmed = normalizeBattleLine(line.replace(/\/\/.*$/, ''));
      if (trimmed === 'Type_A') { readingTerrain = true; terrainBlocksLineOfSight = false; continue; }
      if (trimmed === 'Type_B') { readingTerrain = true; terrainBlocksLineOfSight = true; continue; }
      if (trimmed === '岩' || trimmed === '壁') { readingTerrain = true; terrainBlocksLineOfSight = true; }
      else if (trimmed === '湖' || trimmed === '木' || trimmed === '壊れ壁') {
        readingTerrain = true;
        terrainBlocksLineOfSight = false;
      }
      if (trimmed.startsWith('開始カーソル')) readingTerrain = false;
      if (!readingTerrain) continue;
      for (const match of line.matchAll(/[（(]\s*(\d+)\s*[,，]\s*(\d+)\s*[）)]/g)) {
        const tile = `${Number(match[1]) - 1},${Number(match[2]) - 1}`;
        impassableTiles.add(tile);
        if (terrainBlocksLineOfSight) lineOfSightBlockedTiles.add(tile);
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
    startCursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, startCursor.x));
    startCursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, startCursor.y));
    cursor.x = startCursor.x;
    cursor.y = startCursor.y;
    initialCamera.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, startCursor.x - Math.floor(VIEW_WIDTH / 2)));
    initialCamera.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, startCursor.y - Math.floor(VIEW_HEIGHT / 2)));
    camera.x = initialCamera.x;
    camera.y = initialCamera.y;
    cameraTarget.x = camera.x;
    cameraTarget.y = camera.y;
    draw();
  }

  function parseParameterTable(source) {
    const units = new Map();
    const npcs = new Map();
    const weapons = new Map();
    const armors = new Map();
    const items = new Map();
    const unitFields = new Map([
      ['HP', 'hp'], ['\u79fb\u52d5\u529b', 'moveRange'], ['\u56de\u907f', 'evasion'],
      ['\u547d\u4e2d\u88dc\u6b63', 'hitBonus'], ['\u529b', 'strength'], ['\u30b5\u30a4\u30ba', 'size'],
    ]);
    const weaponFields = new Map([
      ['\u5c04\u7a0b', 'attackRange'], ['\u30c0\u30e1\u30fc\u30b8', 'attackPower'], ['\u547d\u4e2d\u7387', 'accuracy'],
      ['SE', 'se'], ['HIT', 'hitEffect'],
    ]);
    const armorFields = new Map([['\u88c5\u7532\u88dc\u6b63', 'armorCorrection']]);
    const itemFields = new Map([['効果', 'effect'], ['使用回数', 'uses']]);
    let section = '';
    let currentType = null;
    let currentFields = null;
    for (const rawLine of source.replace(/\r/g, '').split('\n')) {
      const line = rawLine.replace(/\/\/.*$/, '').normalize('NFKC').trim();
      if (!line) continue;

      if (['PC', 'EN', 'NPC', '\u30a6\u30a7\u30dd\u30f3', '\u30a2\u30fc\u30de\u30fc', '\u7279\u6b8a\u88c5\u5099'].includes(line)) {
        section = line;
        currentType = null;
        currentFields = null;
        continue;
      }

      const typeMatch = line.match(/^(Type_(PC|EN|NPC|WEP|ARM|ITEM)_[\w-]+)$/i);
      if (typeMatch) {
        const [, typeId] = typeMatch;
        const kind = typeId.match(/^Type_([A-Z]+)/i)?.[1]?.toUpperCase() ?? '';
        const isUnitType = (section === 'PC' && kind.toUpperCase() === 'PC') ||
          (section === 'EN' && kind.toUpperCase() === 'EN');
        const isNpcType = section === 'NPC' && kind === 'NPC';
        const isWeaponType = section === '\u30a6\u30a7\u30dd\u30f3' && kind.toUpperCase() === 'WEP';
        const isArmorType = section === '\u30a2\u30fc\u30de\u30fc' && kind.toUpperCase() === 'ARM';
        const isItemType = section === '特殊装備' && kind.toUpperCase() === 'ITEM';
        if (!isUnitType && !isNpcType && !isWeaponType && !isArmorType && !isItemType) {
          currentType = null;
          currentFields = null;
          continue;
        }
        const table = isUnitType ? units : isNpcType ? npcs : isWeaponType ? weapons : isArmorType ? armors : items;
        if (table.has(typeId)) throw new Error(`Param_table.txt のタイプIDが重複しています: ${typeId}`);
        currentType = {};
        table.set(typeId, currentType);
        currentFields = isUnitType || isNpcType ? unitFields : isWeaponType ? weaponFields : isArmorType ? armorFields : itemFields;
        continue;
      }

      if (/^Type_/i.test(line)) {
        currentType = null;
        currentFields = null;
        continue;
      }
      if (!currentType) continue;
      const nameMatch = line.match(/^●\s*(.+)$/);
      if (nameMatch) {
        currentType.name = nameMatch[1];
        continue;
      }
      const fieldMatch = line.match(/^([^:\s]+)\s*(?::\s*|\s+)(.+)$/);
      if (!fieldMatch) continue;
      const fieldName = fieldMatch[1].toUpperCase() === 'SE' || fieldMatch[1].toUpperCase() === 'HIT'
        ? fieldMatch[1].toUpperCase()
        : fieldMatch[1];
      const value = fieldMatch[2].trim();
      const outputField = currentFields?.get(fieldName);
      if (!outputField) continue;
      if (outputField === 'se' || outputField === 'hitEffect' || outputField === 'effect') currentType[outputField] = value;
      else if (outputField === 'attackRange') {
        const rangeMatch = value.match(/^(\d+)(?:\s*[~〜-]\s*(\d+))?$/);
        if (rangeMatch) {
          currentType.minAttackRange = rangeMatch[2] ? Number(rangeMatch[1]) : 1;
          currentType.attackRange = Number(rangeMatch[2] ?? rangeMatch[1]);
        }
      }
      else {
        const numericValue = Number(value.replace(/^\+/, ''));
        if (Number.isFinite(numericValue)) currentType[outputField] = numericValue;
      }
    }

    const sizeDimensions = new Map([[1, [TILE_SIZE, TILE_SIZE]], [2, [TILE_SIZE * 2, TILE_SIZE]], [4, [TILE_SIZE * 2, TILE_SIZE * 2]]]);
    for (const parameters of units.values()) {
      if (parameters.hp !== undefined) parameters.maxHp = parameters.hp;
      const dimensions = sizeDimensions.get(parameters.size);
      if (dimensions) [parameters.spriteWidth, parameters.spriteHeight] = dimensions;
    }
    for (const parameters of items.values()) {
      const hpEffect = parameters.effect?.match(/^HP\s*\+\s*(\d+)$/i);
      if (hpEffect) parameters.hpRestore = Number(hpEffect[1]);
    }
    return { units, npcs, weapons, armors, items };
  }

  function tryExtractEventBlock(source, blockName) {
    const found = source.replace(/\r/g, '').split('\n')
      .some((line) => line.trim() === blockName);
    return found ? extractEventBlock(source, blockName) : [];
  }

  function parseUnitLoadouts(source, blockName) {
    const loadouts = new Map();
    let current = null;
    let currentId = '';
    for (const rawLine of tryExtractEventBlock(source, blockName)) {
      const line = rawLine.replace(/\/\/.*$/, '').normalize('NFKC').trim();
      if (!line || line === '{' || line === '}') continue;
      const unitMatch = line.match(/^(PC\d+|EN\d+)$/i);
      if (unitMatch) {
        currentId = normalizeUnitId(unitMatch[1]);
        const expectedPrefix = blockName === 'ADD_Param' ? 'PC' : 'EN';
        if (!currentId.startsWith(expectedPrefix)) {
          throw new Error(`${blockName}: ${currentId} はこのブロックに書けません（${expectedPrefix}ユニットを指定してください）。`);
        }
        if (loadouts.has(currentId)) throw new Error(`${blockName}: ${currentId} が重複しています。`);
        current = {};
        loadouts.set(currentId, current);
        continue;
      }
      if (!current) throw new Error(`${blockName}: ユニットIDより前に不明な記述があります: ${line}`);
      if (/^[\w.-]+\.png$/i.test(line)) {
        if (current.imageFile) throw new Error(`${blockName}: ${currentId} に画像が複数指定されています。`);
        current.imageFile = line;
        continue;
      }
      const unitTypeMatch = line.match(/^(Type_(?:PC|EN)_\d+)$/i);
      if (unitTypeMatch) {
        if (current.unitTypeId) throw new Error(`${blockName}: ${currentId} に基本パラメータが複数指定されています。`);
        current.unitTypeId = unitTypeMatch[1];
        continue;
      }
      const weaponMatch = line.match(/^(Type_WEP_\d+)$/i);
      if (weaponMatch) {
        if (current.weaponTypeId) throw new Error(`${blockName}: ${currentId} に武器が複数指定されています。`);
        current.weaponTypeId = weaponMatch[1];
        continue;
      }
      const armorMatch = line.match(/^(Type_ARM_\d+)$/i);
      if (armorMatch) {
        if (current.armorTypeId) throw new Error(`${blockName}: ${currentId} にアーマーが複数指定されています。`);
        current.armorTypeId = armorMatch[1];
        continue;
      }
      const itemMatch = line.match(/^(Type_ITEM_\d+)$/i);
      if (itemMatch) {
        if (current.itemTypeId) throw new Error(`${blockName}: ${currentId} に特殊装備が複数指定されています。`);
        current.itemTypeId = itemMatch[1];
        continue;
      }
      throw new Error(`${blockName}: ${currentId} の記述を解析できません: ${line}`);
    }
    return loadouts;
  }

  function validateUnitLoadouts(loadouts, blockName) {
    for (const [id, loadout] of loadouts) {
      const faction = id.startsWith('PC') ? 'PC' : 'EN';
      if (!loadout.imageFile) throw new Error(`${blockName}: ${id} に画像ファイル（例: ${id}s.png）がありません。`);
      if (!loadout.unitTypeId) throw new Error(`${blockName}: ${id} に基本パラメータ Type_${faction}_*** がありません。`);
      if (!unitBaseParameters.has(loadout.unitTypeId)) {
        throw new Error(`${blockName}: ${id} が参照する ${loadout.unitTypeId} は Data/Param_table.txt にありません。`);
      }
      if (!loadout.weaponTypeId) throw new Error(`${blockName}: ${id} に武器パラメータ Type_WEP_*** がありません。`);
      if (!weaponParameters.has(loadout.weaponTypeId)) {
        throw new Error(`${blockName}: ${id} が参照する ${loadout.weaponTypeId} は Data/Param_table.txt にありません。`);
      }
      if (loadout.armorTypeId && !armorParameters.has(loadout.armorTypeId)) {
        throw new Error(`${blockName}: ${id} が参照する ${loadout.armorTypeId} は Data/Param_table.txt にありません。`);
      }
      if (loadout.itemTypeId && !itemParameters.has(loadout.itemTypeId)) {
        throw new Error(`${blockName}: ${id} が参照する ${loadout.itemTypeId} は Data/Param_table.txt にありません。`);
      }
    }
  }

  function parseNpcDefinitions(source) {
    const definitions = new Map();
    let currentId = null;
    for (const rawLine of tryExtractEventBlock(source, 'NPC_Param')) {
      const line = rawLine.replace(/\/\/.*$/, '').normalize('NFKC').trim();
      const idMatch = line.match(/^(NPC\d+)$/i);
      if (idMatch) {
        currentId = normalizeUnitId(idMatch[1]);
        definitions.set(currentId, {});
        continue;
      }
      if (!currentId) continue;
      const imageMatch = line.match(/^([\w.-]+\.png)$/i);
      if (imageMatch) definitions.get(currentId).imageFile = imageMatch[1];
      const unitTypeMatch = line.match(/^(Type_NPC_[\w-]+)$/i);
      if (unitTypeMatch) definitions.get(currentId).unitTypeId = unitTypeMatch[1];
    }
    return definitions;
  }

  function parseNpcMovementGoals(source) {
    const goals = new Map();
    const commandName = '\u79fb\u52d5\u76ee\u6a19';
    for (const rawLine of source.replace(/\r/g, '').split('\n')) {
      const line = rawLine.replace(/\/\/.*$/, '').normalize('NFKC').trim();
      if (!line.startsWith(commandName)) continue;
      const match = line.match(/^\u79fb\u52d5\u76ee\u6a19\s+(NPC\d+)\s*\(\s*(\d+)\s*\x2c\s*(\d+)\s*\)$/i);
      if (!match) throw new Error(`\u79fb\u52d5\u76ee\u6a19\u306e\u66f8\u5f0f\u3092\u89e3\u6790\u3067\u304d\u307e\u305b\u3093: ${line}`);
      const id = normalizeUnitId(match[1]);
      if (goals.has(id)) throw new Error(`\u79fb\u52d5\u76ee\u6a19\u304c\u91cd\u8907\u3057\u3066\u3044\u307e\u3059: ${id}`);
      goals.set(id, { x: Number(match[2]) - 1, y: Number(match[3]) - 1 });
    }
    return goals;
  }

  function normalizeUnitId(id) {
    const match = id.match(/^(PC|EN|NPC)0*(\d+)$/i);
    return match ? `${match[1].toUpperCase()}${match[2].padStart(2, '0')}` : id.toUpperCase();
  }

  function getDefaultUnitType(unit) {
    const match = unit.id.match(/^(PC|EN)0*(\d+)$/i);
    if (!match) return '';
    const [, faction, number] = match;
    return `Type_${faction.toUpperCase()}_${number.padStart(3, '0')}`;
  }

  function parsePhaseBgm(source) {
    const result = { player: 'M002_PC_turn.mp3', enemy: 'M003_EN_turn.mp3' };
    for (const rawLine of tryExtractEventBlock(source, '\uff22\uff27\uff2d')) {
      const match = rawLine.normalize('NFKC').trim().match(/^(PC|EN)\s*:\s*(\S+)$/i);
      if (!match) continue;
      result[match[1].toUpperCase() === 'PC' ? 'player' : 'enemy'] = match[2];
    }
    return result;
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

  function openSaveSlotList(mode) {
    saveSlotMode = mode;
    saveSlotTitle.textContent = mode === 'save' ? 'セーブ箇所一覧' : 'ロード箇所一覧';
    saveSlotStatus.textContent = mode === 'save' ? '枠を選ぶとセーブデータを記録します。' : '読み込むデータを選択してください。';
    renderSaveSlots();
    emptyCommand.hidden = true;
    saveSlotDialog.hidden = false;
    canvas.focus();
    draw();
  }

  async function openTitleLoadList() {
    if (titleTransitioning) return;
    titleTransitioning = true;
    await playSe('sword.mp3');
    saveListReturnToTitle = true;
    titleScreen.classList.add('title-load-open');
    saveSlotDialog.classList.add('floating-save-dialog');
    document.body.append(saveSlotDialog);
    openSaveSlotList('load');
    saveSlotDialog.querySelector('[data-action="close-save-slots"]')?.focus();
    titleTransitioning = false;
  }

  function restoreSaveSlotDialogParent() {
    saveSlotDialog.classList.remove('floating-save-dialog');
    if (saveSlotDialog.parentElement !== saveSlotDialogParent) saveSlotDialogParent.append(saveSlotDialog);
  }

  function readSaveIndexes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_INDEX_STORAGE_KEY) || '[]');
      return Array.from({ length: 10 }, (_, index) => parsed[index] ?? null);
    } catch (error) {
      console.warn('セーブインデックスを読み込めませんでした。', error);
      return Array(10).fill(null);
    }
  }

  function readSaveContents() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_DATA_STORAGE_KEY) || '[]');
      return Array.from({ length: 10 }, (_, index) => parsed[index] ?? null);
    } catch (error) {
      console.warn('セーブ本体を読み込めませんでした。', error);
      return Array(10).fill(null);
    }
  }

  function serializeEntity(entity) {
    const record = Object.fromEntries(Object.entries(entity).filter(([key, value]) =>
      key !== 'image' && (value === null || ['string', 'number', 'boolean'].includes(typeof value))
    ));
    if (entity.movementGoal) record.movementGoal = { ...entity.movementGoal };
    return record;
  }

  function createSaveSnapshot(savedAt) {
    return {
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt,
      common: {
        playerRoster: playerRoster.map((unit) => ({ ...unit })),
        flags: [...eventFlags],
        customPoints,
        stageNo: currentStageId,
        eventNo: currentStageId,
      },
      battle: {
        stageNo: currentStageId,
        eventPosition: saveListReturnToStory ? 'story' : 'player-input',
        storySection: saveListReturnToStory ? currentStorySection : '',
        units: units.map(serializeEntity),
        obstacles: obstacles.map(serializeEntity),
        impassableTiles: [...impassableTiles],
        lineOfSightBlockedTiles: [...lineOfSightBlockedTiles],
        phase: currentSide,
        turnCounts: { ...sideTurnCounts },
        completedEvents: [...completedBattleEvents],
        cursor: { ...cursor },
        camera: { ...camera },
        bgm: { filename: currentBgm, time: loadedBgm === currentBgm ? bgmAudio.currentTime : 0 },
        phaseBgmFiles: { ...phaseBgmFiles },
      },
    };
  }

  function writeSaveGame(slotIndex) {
    const isStorySave = isClearStory && saveListReturnToStory;
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= 10 || debugMode ||
        (!isStorySave && (currentSide !== 'player' || isGameOver || isEnemyAiRunning || isCombatResolving ||
          isUnitMoving || battleEventActive || phaseInputLocked || pendingMove || rangeMode))) return false;
    const savedAt = new Date().toISOString();
    const indexes = readSaveIndexes();
    const contents = readSaveContents();
    indexes[slotIndex] = {
      version: SAVE_FORMAT_VERSION,
      stageNo: currentStageId,
      ...(isStorySave ? { cleared: true } : { turnCount: sideTurnCounts.player }),
      savedAt,
    };
    contents[slotIndex] = createSaveSnapshot(savedAt);
    try {
      localStorage.setItem(SAVE_DATA_STORAGE_KEY, JSON.stringify(contents));
      localStorage.setItem(SAVE_INDEX_STORAGE_KEY, JSON.stringify(indexes));
      return true;
    } catch (error) {
      console.warn('セーブデータを書き込めませんでした。', error);
      return false;
    }
  }

  async function loadSaveGame(slotIndex) {
    const snapshot = readSaveContents()[slotIndex];
    if (!snapshot) return;
    if (snapshot.formatVersion !== SAVE_FORMAT_VERSION) {
      saveSlotStatus.textContent = 'このセーブデータの形式には対応していません。';
      return;
    }
    const stageId = String(snapshot.battle?.stageNo ?? '').padStart(3, '0');
    const resumeStory = snapshot.battle?.eventPosition === 'story';
    if (!/^\d{3}$/.test(stageId)) {
      saveSlotStatus.textContent = 'ステージNoが正しくありません。';
      return;
    }
    saveSlotStatus.textContent = 'セーブデータを読み込んでいます…';
    try {
      currentStageId = stageId;
      const battleScript = await loadEventScript(`Event/Battle_${currentStageId}.txt`);
      await applyBattleSetup(battleScript);
      prepareBattleEventData(battleScript);

      const restoredUnits = snapshot.battle.units.map((record) => {
        const image = new Image();
        image.src = `Unit/${record.imageFile ?? `${record.id}s.png`}`;
        return { ...record, image };
      });
      const restoredObstacles = snapshot.battle.obstacles.map((record) => {
        const image = new Image();
        image.src = `Unit/${record.imageFile}`;
        return { ...record, image };
      });
      await Promise.all([...restoredUnits, ...restoredObstacles].map((entity) => waitForImage(entity.image)));
      units.splice(0, units.length, ...restoredUnits);
      obstacles.splice(0, obstacles.length, ...restoredObstacles);
      impassableTiles.clear();
      for (const tile of snapshot.battle.impassableTiles ?? []) impassableTiles.add(tile);
      lineOfSightBlockedTiles.clear();
      for (const tile of snapshot.battle.lineOfSightBlockedTiles ?? []) lineOfSightBlockedTiles.add(tile);
      eventFlags.clear();
      for (const flag of snapshot.common.flags ?? []) eventFlags.add(flag);
      completedBattleEvents.clear();
      for (const eventName of snapshot.battle.completedEvents ?? []) completedBattleEvents.add(eventName);
      playerRoster = snapshot.common.playerRoster ?? [];
      customPoints = Number.isFinite(snapshot.common.customPoints) ? snapshot.common.customPoints : 0;
      currentSide = snapshot.battle.phase === 'enemy' ? 'enemy' : 'player';
      sideTurnCounts.player = Math.max(1, Number(snapshot.battle.turnCounts?.player) || 1);
      sideTurnCounts.enemy = Math.max(1, Number(snapshot.battle.turnCounts?.enemy) || 1);
      phaseBgmFiles = snapshot.battle.phaseBgmFiles ?? phaseBgmFiles;
      cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, Number(snapshot.battle.cursor?.x) || 0));
      cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, Number(snapshot.battle.cursor?.y) || 0));
      const maxCameraX = Math.max(0, MAP_WIDTH - VIEW_WIDTH);
      const maxCameraY = Math.max(0, MAP_HEIGHT - VIEW_HEIGHT);
      camera.x = Math.max(0, Math.min(maxCameraX, Number(snapshot.battle.camera?.x) || 0));
      camera.y = Math.max(0, Math.min(maxCameraY, Number(snapshot.battle.camera?.y) || 0));
      cameraTarget.x = camera.x;
      cameraTarget.y = camera.y;

      selectedUnit = null;
      combatTarget = null;
      rangeMode = null;
      pendingMove = null;
      pendingPrecisionTarget = null;
      debugMode = false;
      isGameOver = false;
      isEnemyAiRunning = false;
      isCombatResolving = false;
      isUnitMoving = false;
      phaseInputLocked = false;
      explosionEffects.length = 0;
      hitEffects.length = 0;
      gameResult.hidden = true;
      unitCommand.hidden = true;
      unitStatus.hidden = true;
      emptyCommand.hidden = true;
      saveSlotDialog.hidden = true;
      saveListReturnToTitle = false;
      restoreSaveSlotDialogParent();
      titleScreen.classList.remove('title-load-open');
      turnConfirm.hidden = true;
      titleScreen.hidden = true;
      introEvent.hidden = !resumeStory;
      gameShell.hidden = resumeStory;
      saveListReturnToStory = false;
      updatePhaseLabel();
      draw();
      canvas.focus();
      if (resumeStory) {
        isClearStory = true;
        await playClearStory(stageId, snapshot.battle.storySection || 'EP');
      } else {
        isClearStory = false;
        await restoreBgm(snapshot.battle.bgm);
        if (currentSide === 'enemy') runEnemyTurn();
      }
    } catch (error) {
      console.error('セーブデータを読み込めませんでした。', error);
      saveSlotStatus.textContent = `読み込みに失敗しました: ${error.message || error}`;
    }
  }

  async function restoreBgm(savedBgm) {
    const filename = savedBgm?.filename || phaseBgmFiles[currentSide];
    await fadeOutBgm();
    currentBgm = filename;
    loadedBgm = '';
    startCurrentBgm();
    const seek = () => {
      if (loadedBgm !== filename || !Number.isFinite(savedBgm?.time) || savedBgm.time <= 0) return;
      try {
        bgmAudio.currentTime = Math.min(savedBgm.time, Math.max(0, bgmAudio.duration - 0.1));
      } catch { /* Track may not be seekable. */ }
    };
    if (bgmAudio.readyState >= 1) seek();
    else bgmAudio.addEventListener('loadedmetadata', seek, { once: true });
  }

  function renderSaveSlots() {
    const saveIndexes = readSaveIndexes();
    const saveContents = readSaveContents();
    saveSlotList.replaceChildren();
    for (let index = 1; index <= 10; index += 1) {
      const snapshot = saveContents[index - 1];
      const record = saveIndexes[index - 1] ?? (snapshot ? {
        stageNo: snapshot.common?.stageNo,
        turnCount: snapshot.battle?.turnCounts?.player,
        savedAt: snapshot.savedAt,
      } : null);
      const slot = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.slotIndex = String(index - 1);
      button.disabled = saveSlotMode === 'load' && !snapshot;
      if (record) {
        const stage = document.createElement('strong');
        stage.textContent = `【データ${toFullWidthNumber(String(index).padStart(2, '0'))}】`;
        const date = document.createElement('span');
        date.className = 'save-slot-date';
        const parsedDate = new Date(record.savedAt);
        date.textContent = Number.isNaN(parsedDate.getTime()) ? '日時不明' : formatSaveDate(parsedDate);
        const details = document.createElement('span');
        details.className = 'save-slot-details';
        details.textContent = record.cleared || snapshot?.battle?.eventPosition === 'story'
          ? `ステージ${record.stageNo}　クリア`
          : `ステージ${record.stageNo}　ターン${toFullWidthNumber(record.turnCount)}`;
        button.append(stage, date, details);
      } else {
        const slotName = document.createElement('strong');
        slotName.textContent = `【データ${toFullWidthNumber(String(index).padStart(2, '0'))}】`;
        const emptyLabel = document.createElement('span');
        emptyLabel.className = 'save-slot-empty';
        emptyLabel.textContent = '　　空き';
        button.append(slotName, emptyLabel);
      }
      slot.append(button);
      saveSlotList.append(slot);
    }
  }

  function formatSaveDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function updateEmptyCommandSelection() {
    emptyCommand.querySelectorAll('button').forEach((button, index) => {
      button.classList.toggle('selected', index === emptyCommandSelection);
      button.setAttribute('aria-pressed', String(index === emptyCommandSelection));
    });
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
        unit.moveRemaining = unit.moveRange;
        unit.precisionAttackBonus = 0;
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
    if (currentSide === 'enemy' && !debugMode) runEnemyTurn();
  }

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  async function runEnemyTurn() {
    if (debugMode || isGameOver || currentSide !== 'enemy' || isEnemyAiRunning) return;
    isEnemyAiRunning = true;
    unitCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    await wait(700);

    for (const enemy of units.filter((unit) => unit.side === 'enemy' && !unit.ended)) {
      if (debugMode || isGameOver || currentSide !== 'enemy') break;
      selectedUnit = enemy;
      cursor.x = enemy.x;
      cursor.y = enemy.y;
      scrollToCursor();
      await wait(400);

      let preferredHateTarget = null;
      if (enemy.hateTargetId) {
        preferredHateTarget = units.find((candidate) => candidate.id === enemy.hateTargetId && candidate.side === 'player') ?? null;
        if (!preferredHateTarget || unitDistance(enemy, preferredHateTarget) > 8) {
          enemy.hateTargetId = null;
          preferredHateTarget = null;
          showAttackMessage('ヘイト対象を見失った！', 1800);
          await wait(900);
        }
      }
      const target = preferredHateTarget ?? findNearestOpponent(enemy);
      if (target) {
        cursor.x = target.x;
        cursor.y = target.y;
        scrollToCursor();
        await wait(350);

        let attackTarget = findOpponentInRange(enemy, preferredHateTarget);
        let obstacleTarget = null;
        let approachTarget = target;
        const firstBlocker = attackTarget ||
          !isWithinAttackRange(enemy, unitDistance(enemy, target))
          ? null
          : getBlockingObstacle(enemy, target);
        if (firstBlocker?.destructible) {
          if (isWithinAttackRange(enemy, distanceFromUnitToTile(enemy, firstBlocker.x, firstBlocker.y))) {
            obstacleTarget = firstBlocker;
          } else {
            approachTarget = firstBlocker;
          }
        }
        if (!attackTarget && !obstacleTarget && !enemy.moveUsed) {
          const destination = chooseApproachTileByPath(enemy, approachTarget, preferredHateTarget);
          if (destination) {
            const path = getMovePath(enemy, destination.x, destination.y);
            enemyRangePreview = { unit: enemy, mode: 'move' };
            draw();
            await wait(450);
            await new Promise((resolve) => animateUnitMove(enemy, path, resolve));
            enemy.moveRemaining = Math.max(0, (enemy.moveRemaining ?? enemy.moveRange) - Math.max(0, path.length - 1));
            enemy.moveUsed = enemy.moveRemaining <= 0;
            enemyRangePreview = null;
            draw();
            cursor.x = target.x;
            cursor.y = target.y;
            scrollToCursor();
            await wait(250);
            attackTarget = findOpponentInRange(enemy, preferredHateTarget);
            const blockerAfterMove = attackTarget ||
              !isWithinAttackRange(enemy, unitDistance(enemy, target))
              ? null
              : getBlockingObstacle(enemy, target);
            if (blockerAfterMove?.destructible &&
                isWithinAttackRange(enemy, distanceFromUnitToTile(enemy, blockerAfterMove.x, blockerAfterMove.y))) {
              obstacleTarget = blockerAfterMove;
            }
          }
        }

        if ((attackTarget || obstacleTarget) && !enemy.attackUsed) {
          cursor.x = enemy.x;
          cursor.y = enemy.y;
          scrollToCursor();
          await wait(250);
          cursor.x = (obstacleTarget ?? attackTarget).x;
          cursor.y = (obstacleTarget ?? attackTarget).y;
          scrollToCursor();
          await wait(350);
          selectedUnit = enemy;
          rangeMode = 'attack';
          enemyRangePreview = { unit: enemy, mode: 'attack', target: attackTarget };
          draw();
          await wait(300);
          if (obstacleTarget) await tryAttackObstacle(obstacleTarget);
          else await tryAttackTarget(attackTarget);
          await wait(300);
        }
      }

      enemy.ended = true;
      checkUnitCompletion(enemy);
      if (!isGameOver) await wait(350);
    }

    if (!debugMode && !isGameOver && currentSide === 'enemy') await runNpcMovementGoals();

    if (!debugMode && !isGameOver && currentSide === 'enemy' && allCurrentUnitsEnded()) {
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
          unit.moveRemaining = unit.moveRange;
          unit.precisionAttackBonus = 0;
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

  async function runNpcMovementGoals() {
    const movers = units.filter((unit) => unit.side === 'npc' && unit.movementGoal);
    for (const npc of movers) {
      if (isGameOver || currentSide !== 'enemy') break;
      const goal = npc.movementGoal;
      if (unitOccupiesTile(npc, goal.x, goal.y)) continue;
      const path = getNpcGoalPath(npc, goal);
      const moveSteps = Math.max(0, Math.floor(npc.moveRange ?? 0));
      const movementPath = path.slice(0, moveSteps + 1);
      let safeStopIndex = 0;
      for (let index = 1; index < movementPath.length; index++) {
        const position = movementPath[index];
        if (!isUnitPositionBlocked(npc, position.x, position.y)) safeStopIndex = index;
      }
      if (safeStopIndex < 1) continue;
      movementPath.length = safeStopIndex + 1;

      cursor.x = goal.x;
      cursor.y = goal.y;
      scrollToCursor();
      await waitForCameraToStop();
      cursor.x = npc.x;
      cursor.y = npc.y;
      enemyRangePreview = { unit: npc, mode: 'move' };
      draw();
      await wait(250);
      await new Promise((resolve) => animateUnitMove(npc, movementPath, resolve));
      enemyRangePreview = null;
      draw();
      await wait(250);
    }
    enemyRangePreview = null;
  }

  function getNpcGoalPath(unit, goal) {
    const findPath = (allowDestructibleObjects) => {
      const key = (x, y) => `${x},${y}`;
      const startKey = key(unit.x, unit.y);
      const footprint = getFootprintSize(unit);
      const goalKeys = new Set();
      for (let offsetY = 0; offsetY < footprint.height; offsetY++) {
        for (let offsetX = 0; offsetX < footprint.width; offsetX++) {
          const x = goal.x - offsetX;
          const y = goal.y - offsetY;
          if (x >= 0 && y >= 0 && x + footprint.width <= MAP_WIDTH && y + footprint.height <= MAP_HEIGHT) {
            goalKeys.add(key(x, y));
          }
        }
      }
      if (!goalKeys.size) return [];
      const previous = new Map([[startKey, null]]);
      const queue = [{ x: unit.x, y: unit.y }];
      const reachedGoal = () => [...goalKeys].find((goalKey) => previous.has(goalKey));
      const isBlocked = (x, y) => {
        if (x < 0 || y < 0 || x + footprint.width > MAP_WIDTH || y + footprint.height > MAP_HEIGHT) return true;
        for (let tileY = y; tileY < y + footprint.height; tileY++) {
          for (let tileX = x; tileX < x + footprint.width; tileX++) {
            if (impassableTiles.has(`${tileX},${tileY}`)) return true;
          }
        }
        const overlaps = (otherX, otherY, otherWidth, otherHeight) =>
          x < otherX + otherWidth && x + footprint.width > otherX &&
          y < otherY + otherHeight && y + footprint.height > otherY;
        if (obstacles.some((obstacle) => overlaps(obstacle.x, obstacle.y, 1, 1) &&
            !(allowDestructibleObjects && obstacle.destructible))) return true;
        return units.some((other) => {
          if (other === unit) return false;
          if (areAlliedUnits(unit, other)) return false;
          const otherSize = getFootprintSize(other);
          return overlaps(other.x, other.y, otherSize.width, otherSize.height);
        });
      };

      for (let index = 0; index < queue.length && !reachedGoal(); index++) {
        const current = queue[index];
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const x = current.x + dx;
          const y = current.y + dy;
          const nextKey = key(x, y);
          if (previous.has(nextKey) || isBlocked(x, y)) continue;
          previous.set(nextKey, key(current.x, current.y));
          queue.push({ x, y });
        }
      }
      const goalKey = reachedGoal();
      if (!goalKey) return [];
      const path = [];
      let stepKey = goalKey;
      while (stepKey !== null) {
        const [x, y] = stepKey.split(',').map(Number);
        path.unshift({ x, y });
        stepKey = previous.get(stepKey);
      }
      return path;
    };

    const openPath = findPath(false);
    if (openPath.length) return openPath;
    const plannedPath = findPath(true);
    if (!plannedPath.length) return [];
    const footprint = getFootprintSize(unit);
    const firstObjectStep = plannedPath.findIndex((position, index) => index > 0 &&
      obstacles.some((obstacle) => obstacle.destructible &&
        position.x < obstacle.x + 1 && position.x + footprint.width > obstacle.x &&
        position.y < obstacle.y + 1 && position.y + footprint.height > obstacle.y));
    return firstObjectStep > 0 ? plannedPath.slice(0, firstObjectStep) : [];
  }

  function findNearestOpponent(unit) {
    return units
      .filter((candidate) => candidate.side !== unit.side)
      .sort((a, b) => manhattanDistance(unit, a) - manhattanDistance(unit, b))[0] ?? null;
  }

  function findOpponentInRange(unit, preferredTarget = null) {
    return units
      .filter((candidate) => candidate.side !== unit.side && (!preferredTarget || candidate === preferredTarget) &&
        canAttackUnitTarget(unit, candidate))
      .sort((a, b) => unitDistance(unit, a) - unitDistance(unit, b))[0] ?? null;
  }

  function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function distanceFromUnitToTile(unit, x, y) {
    const { width, height } = getFootprintSize(unit);
    const dx = Math.max(unit.x - x, 0, x - (unit.x + width - 1));
    const dy = Math.max(unit.y - y, 0, y - (unit.y + height - 1));
    return dx + dy;
  }

  function unitDistance(a, b) {
    const footprint = getFootprintSize(b);
    let minimum = Infinity;
    for (let row = 0; row < footprint.height; row++) {
      for (let column = 0; column < footprint.width; column++) {
        minimum = Math.min(minimum, distanceFromUnitToTile(a, b.x + column, b.y + row));
      }
    }
    return minimum;
  }

  function canAttackUnitTarget(attacker, target) {
    const footprint = getFootprintSize(target);
    for (let row = 0; row < footprint.height; row++) {
      for (let column = 0; column < footprint.width; column++) {
        const tile = { x: target.x + column, y: target.y + row };
        const distance = distanceFromUnitToTile(attacker, tile.x, tile.y);
        if (isWithinAttackRange(attacker, distance) && hasLineOfSight(attacker, tile)) return true;
      }
    }
    return false;
  }

  function canAttackObstacleTarget(attacker, obstacle) {
    return Boolean(attacker && obstacle?.destructible && obstacles.includes(obstacle) &&
      isWithinAttackRange(attacker, distanceFromUnitToTile(attacker, obstacle.x, obstacle.y)) &&
      hasLineOfSight(attacker, obstacle, obstacle));
  }

  function unitOccupiesTile(unit, x, y) {
    const footprint = getFootprintSize(unit);
    return x >= unit.x && x < unit.x + footprint.width && y >= unit.y && y < unit.y + footprint.height;
  }

  function getLineTiles(from, to) {
    const reverse = from.x > to.x || (from.x === to.x && from.y > to.y);
    let x = reverse ? to.x : from.x;
    let y = reverse ? to.y : from.y;
    const endX = reverse ? from.x : to.x;
    const endY = reverse ? from.y : to.y;
    const dx = Math.abs(endX - x);
    const dy = Math.abs(endY - y);
    const sx = Math.sign(endX - x);
    const sy = Math.sign(endY - y);
    let crossedX = 0;
    let crossedY = 0;
    const tiles = [{ x, y }];
    while (crossedX < dx || crossedY < dy) {
      const nextCrossing = (1 + 2 * crossedX) * dy - (1 + 2 * crossedY) * dx;
      if (nextCrossing === 0) {
        // At an exact diagonal, only the diagonal tile is crossed; corner-adjacent tiles do not block the ray.
        x += sx;
        y += sy;
        crossedX++;
        crossedY++;
      } else if (nextCrossing < 0) {
        x += sx;
        crossedX++;
      } else {
        y += sy;
        crossedY++;
      }
      tiles.push({ x, y });
    }
    return reverse ? tiles.reverse() : tiles;
  }

  function getLineBlocker(from, to, targetObstacle = null) {
    for (const { x, y } of getLineTiles(from, to)) {
      // Neither unit's occupied endpoint tile is between the shooter and target.
      if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) continue;
      // OBJ is drawn over the base terrain, so its rule takes precedence until it is destroyed.
      const obstacle = obstacles.find((candidate) =>
        candidate.x === x && candidate.y === y && candidate !== targetObstacle
      );
      if (obstacle) return obstacle;
      if (lineOfSightBlockedTiles.has(`${x},${y}`)) return { x, y, destructible: false, terrain: 'rock' };
    }
    return null;
  }

  function getBlockingObstacle(attacker, target, targetObstacle = null) {
    const attackerSize = getFootprintSize(attacker);
    const targetSize = getFootprintSize(target);
    let firstBlocker = null;
    for (let attackerY = 0; attackerY < attackerSize.height; attackerY++) {
      for (let attackerX = 0; attackerX < attackerSize.width; attackerX++) {
        const from = { x: attacker.x + attackerX, y: attacker.y + attackerY };
        for (let targetY = 0; targetY < targetSize.height; targetY++) {
          for (let targetX = 0; targetX < targetSize.width; targetX++) {
            const to = { x: target.x + targetX, y: target.y + targetY };
            const blocker = getLineBlocker(from, to, targetObstacle);
            if (!blocker) return null;
            firstBlocker ??= blocker;
          }
        }
      }
    }
    return firstBlocker;
  }

  function hasLineOfSight(attacker, target, targetObstacle = null) {
    return !getBlockingObstacle(attacker, target, targetObstacle);
  }

  function isWithinAttackRange(unit, distance) {
    return distance >= unit.minAttackRange && distance <= unit.attackRange;
  }

  function chooseApproachTileByPath(unit, target, leashTarget = null) {
    const remainingMove = unit.moveRemaining ?? unit.moveRange;
    const staysWithinHateRange = leashTarget
      ? (x, y) => unitDistance({ ...unit, x, y }, leashTarget) <= 8
      : null;
    const distances = getMoveDistances(unit, MAP_WIDTH * MAP_HEIGHT, staysWithinHateRange);
    const candidates = [...distances.entries()]
      .map(([key, distance]) => {
        const [x, y] = key.split(',').map(Number);
        const targetDistance = unitDistance({ ...unit, x, y }, target);
        const rangeGap = targetDistance < unit.minAttackRange
          ? unit.minAttackRange - targetDistance
          : targetDistance > unit.attackRange ? targetDistance - unit.attackRange : 0;
        const lineClear = hasLineOfSight({ ...unit, x, y }, target);
        return { x, y, distance, rangeGap, lineClear };
      })
      .filter((tile) => tile.distance > 0 && !isUnitPositionBlocked(unit, tile.x, tile.y));
    candidates.sort((a, b) => Number(b.lineClear) - Number(a.lineClear) || a.rangeGap - b.rangeGap || a.distance - b.distance);
    const destinationGoal = candidates.find((tile) => tile.rangeGap === 0) ?? candidates[0];
    if (!destinationGoal) return null;

    const path = getMovePath(unit, destinationGoal.x, destinationGoal.y, staysWithinHateRange);
    if (path.length < 2) return null;
    const step = path[Math.min(remainingMove, path.length - 1)];
    return { x: step.x, y: step.y };
  }

  function activateCurrentTile() {
    if (stagePreviewMode) return;
    if (!saveSlotDialog.hidden) {
      saveSlotDialog.querySelector('[data-action="close-save-slots"]').click();
      return;
    }
    if (!emptyCommand.hidden) {
      emptyCommand.querySelectorAll('button')[emptyCommandSelection]?.click();
      return;
    }
    emptyCommand.hidden = true;
    if (!unitCommand.hidden) {
      const action = unitCommand.querySelectorAll('button')[menuSelectionIndex]?.dataset.action;
      chooseUnitAction(action);
      return;
    }
    if (!attackChoiceCommand.hidden) {
      attackChoiceCommand.querySelectorAll('button')[attackChoiceSelection]?.click();
      return;
    }
    if (!itemConfirmCommand.hidden) {
      itemConfirmCommand.querySelectorAll('button')[itemConfirmSelection]?.click();
      return;
    }
    if (!itemChoiceCommand.hidden) {
      itemChoiceCommand.querySelectorAll('button')[itemChoiceSelection]?.click();
      return;
    }
    if (!hateConfirmCommand.hidden) {
      hateConfirmCommand.querySelectorAll('button')[hateConfirmSelection]?.click();
      return;
    }
    if (!precisionConfirmCommand.hidden) {
      precisionConfirmCommand.querySelectorAll('button')[precisionConfirmSelection]?.click();
      return;
    }

    const unit = getUnitAtPosition(cursor.x, cursor.y);
    if (rangeMode === 'precision-target') {
      if (unit?.side === 'enemy' && canAttackUnitTarget(selectedUnit, unit)) {
        showPrecisionConfirmation(unit);
      } else {
        const obstacle = obstacles.find((candidate) => candidate.x === cursor.x && candidate.y === cursor.y);
        if (canAttackObstacleTarget(selectedUnit, obstacle)) showPrecisionConfirmation(obstacle);
      }
      return;
    }
    if (rangeMode === 'hate') {
      if (unit) tryHateTarget(unit);
      return;
    }
    if (rangeMode === 'attack') {
      if (pendingMove?.unit === selectedUnit && unit === selectedUnit) {
        commitPendingMove();
        return;
      }
      const obstacle = obstacles.find((candidate) => candidate.x === cursor.x && candidate.y === cursor.y);
      if (obstacle?.destructible &&
          isWithinAttackRange(selectedUnit, distanceFromUnitToTile(selectedUnit, obstacle.x, obstacle.y)) &&
          hasLineOfSight(selectedUnit, obstacle, obstacle)) {
        void tryAttackObstacle(obstacle);
      } else if (unit) tryAttackTarget(unit);
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
    if (!canAttackUnitTarget(selectedUnit, target)) return false;

    const attacker = selectedUnit;
    isCombatResolving = true;
    combatTarget = target;
    pendingMove = null;
    rangeMode = null;
    cursor.x = target.x;
    cursor.y = target.y;
    try {
      await runBattleAttackEvent(attacker, target);
      if (isGameOver) return false;
      attacker.attackUsed = true;
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
      await startHitEffect(attacker, target);

      const roll = Math.floor(Math.random() * 10);
      const hitMargin = roll - target.evasion + attacker.hitBonus + (attacker.precisionAttackBonus ?? 0);
      attacker.precisionAttackBonus = 0;
      if (hitMargin >= 1) {
        const damage = calculateDamage(attacker, target);
        const previousHp = target.hp;
        const nextHp = Math.max(0, target.hp - damage.amount);
        const defeated = nextHp <= 0;
        if (damage.critical) {
          showAttackMessage('クリティカル！', 700);
          await wait(700);
        }
        target.hp = nextHp;
        if (defeated) {
          showAttackMessage(`${attacker.id} → ${target.id}：撃破！`, 2400);
        } else {
          showAttackMessage(`${attacker.id} → ${target.id}：攻撃成功！ -${damage.amount}`);
        }

        await shakeUnit(target);
        await animateHpCountdown(target, previousHp, target.hp);
        if (defeated) {
          await runBattleDefeatEvent(target);
          const explosionDone = startExplosion(target);
          units.splice(units.indexOf(target), 1);
          const deathSe = target.side === 'player' ? 'dead_pc.mp3' : 'dead_en.mp3';
          await Promise.all([explosionDone, playSe(deathSe)]);
          await resolveBattleEndEvent();
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

  async function tryAttackObstacle(obstacle) {
    if (!selectedUnit || rangeMode !== 'attack' || !obstacle.destructible ||
        !obstacles.includes(obstacle) ||
        !isWithinAttackRange(selectedUnit, distanceFromUnitToTile(selectedUnit, obstacle.x, obstacle.y)) ||
        !hasLineOfSight(selectedUnit, obstacle, obstacle)) return false;

    const attacker = selectedUnit;
    isCombatResolving = true;
    combatTarget = obstacle;
    pendingMove = null;
    rangeMode = null;
    cursor.x = obstacle.x;
    cursor.y = obstacle.y;
    try {
      attacker.attackUsed = true;
      await jumpUnit(attacker);
      await playSe(getAttackSe(attacker));
      await startHitEffect(attacker, obstacle);

      const hitMargin = Math.floor(Math.random() * 10) + attacker.hitBonus +
        (attacker.precisionAttackBonus ?? 0) - (obstacle.evasion ?? 0);
      attacker.precisionAttackBonus = 0;
      if (hitMargin >= 1) {
        const damage = calculateDamage(attacker, obstacle);
        const previousHp = obstacle.hp;
        const nextHp = Math.max(0, obstacle.hp - damage.amount);
        if (damage.critical) {
          showAttackMessage('クリティカル！', 700);
          await wait(700);
        }
        obstacle.hp = nextHp;
        if (obstacle.hp === 0) attackMessage.hidden = true;
        else showAttackMessage(`${attacker.id} → ${obstacle.id}：命中！ -${damage.amount}`);
        await shakeUnit(obstacle);
        await animateHpCountdown(obstacle, previousHp, obstacle.hp);
        if (obstacle.hp <= 0) {
          obstacles.splice(obstacles.indexOf(obstacle), 1);
          await Promise.all([startExplosion(obstacle), playSe('BreakObj.mp3')]);
          const eventPlayed = await runBattleObjectDefeatEvent();
          if (!eventPlayed) showAttackMessage('障害物が破壊された！', 1800);
        }
      } else {
        showAttackMessage(`${attacker.id} → ${obstacle.id}：回避！`);
      }
      checkUnitCompletion(attacker);
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

  function calculateDamage(attacker, target) {
    const damageRoll = Math.floor(Math.random() * 6) + 1;
    const damageBonus = damageRoll === 1 ? -1 : damageRoll === 6 ? 1 : 0;
    const armorCorrection = target.armorCorrection ??
      (target.armorTypeId ? armorParameters.get(target.armorTypeId)?.armorCorrection : 0) ?? 0;
    return {
      amount: Math.max(0, (attacker.attackPower ?? 0) - armorCorrection + damageBonus),
      critical: damageBonus === 1,
      damageRoll,
      damageBonus,
      armorCorrection,
    };
  }

  function getDefaultWeaponType(unit) {
    if (unit.side === 'enemy') return 'Type_WEP_101';
    return ({
      PC01: 'Type_WEP_001',
      PC02: 'Type_WEP_006',
      PC03: 'Type_WEP_005',
    })[unit.id] ?? '';
  }

  function getAttackSe(unit) {
    return weaponParameters.get(unit.weaponTypeId)?.se ?? '';
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

  function getHitEffectImage(attacker) {
    const filename = weaponParameters.get(attacker.weaponTypeId)?.hitEffect;
    if (!filename) return null;
    let image = hitEffectImages.get(filename);
    if (!image) {
      image = new Image();
      image.src = `Unit/${filename}`;
      image.addEventListener('load', draw, { once: true });
      hitEffectImages.set(filename, image);
    }
    return image;
  }

  async function startHitEffect(attacker, target) {
    const image = getHitEffectImage(attacker);
    if (!image) return;
    if (!image.complete) {
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }
    if (!image.naturalWidth || !image.naturalHeight) return;

    const targetWidth = target.spriteWidth ?? TILE_SIZE;
    const targetHeight = target.spriteHeight ?? TILE_SIZE;
    const effectSize = Math.max(TILE_SIZE, targetWidth, targetHeight);
    const effect = {
      image,
      x: target.x + targetWidth / TILE_SIZE / 2,
      y: target.y + targetHeight / TILE_SIZE / 2,
      width: effectSize,
      height: effectSize,
      startedAt: performance.now(),
    };
    hitEffects.push(effect);

    return new Promise((resolve) => {
      function animate(now) {
        if (now - effect.startedAt >= hitEffectFrameDuration * hitEffectFrameCount) {
          hitEffects.splice(hitEffects.indexOf(effect), 1);
          draw();
          resolve();
          return;
        }
        draw();
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    });
  }

  function startExplosion(unit) {
    const effect = { unit, x: unit.x, y: unit.y, startedAt: performance.now() };
    explosionEffects.push(effect);

    return new Promise((resolve) => {
      function animate(now) {
        if (now - effect.startedAt >= explosionFrameDuration * explosionFrameCount) {
          explosionEffects.splice(explosionEffects.indexOf(effect), 1);
          draw();
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
    attackChoiceCommand.hidden = true;
    itemChoiceCommand.hidden = true;
    itemConfirmCommand.hidden = true;
    precisionConfirmCommand.hidden = true;
    hateConfirmCommand.hidden = true;
    unitStatus.hidden = true;
    emptyCommand.hidden = true;
    saveSlotDialog.hidden = true;
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
    const remainingMove = selectedUnit.moveRemaining ?? selectedUnit.moveRange;
    if (distance === undefined || distance > remainingMove || isUnitPositionBlocked(selectedUnit, x, y)) return;
    const path = getMovePath(selectedUnit, x, y);
    if (path.length < 2) return;
    pendingMove = {
      unit: selectedUnit,
      x: selectedUnit.x,
      y: selectedUnit.y,
      moveRemaining: remainingMove,
      moveUsed: selectedUnit.moveUsed,
    };
    selectedUnit.moveRemaining = Math.max(0, remainingMove - (path.length - 1));
    selectedUnit.moveUsed = selectedUnit.moveRemaining <= 0;
    rangeMode = null;
    moveConfirmCommand.hidden = true;
    emptyCommand.hidden = true;
    animateUnitMove(selectedUnit, path);
    scrollToCursor();
  }

  function enterAttackModeIfTargetInRange(unit) {
    if ((unit.side !== currentSide && !(debugMode && unit.side === 'enemy')) || unit.ended || unit.attackUsed) return false;
    const targetInRange = units.some((target) =>
      target.side !== unit.side && canAttackUnitTarget(unit, target)
    ) || obstacles.some((obstacle) => canAttackObstacleTarget(unit, obstacle));
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
    if (!saveSlotDialog.hidden) {
      saveSlotDialog.querySelector('[data-action="close-save-slots"]').click();
      return;
    }
    if (!emptyCommand.hidden) {
      emptyCommand.hidden = true;
      canvas.focus();
      draw();
      return;
    }
    if (!itemConfirmCommand.hidden) {
      itemConfirmCommand.hidden = true;
      itemChoiceCommand.hidden = false;
      updateItemChoiceSelection();
      canvas.focus();
      draw();
      return;
    }
    if (!itemChoiceCommand.hidden) {
      itemChoiceCommand.hidden = true;
      unitCommand.hidden = false;
      updateMenuSelection();
      canvas.focus();
      draw();
      return;
    }
    if (!hateConfirmCommand.hidden) {
      hateConfirmCommand.hidden = true;
      attackChoiceCommand.hidden = false;
      canvas.focus();
      draw();
      return;
    }
    if (!precisionConfirmCommand.hidden) {
      precisionConfirmCommand.hidden = true;
      pendingPrecisionTarget = null;
      rangeMode = 'precision-target';
      canvas.focus();
      draw();
      return;
    }
    if (!attackChoiceCommand.hidden) {
      attackChoiceCommand.hidden = true;
      unitCommand.hidden = false;
      updateMenuSelection();
      canvas.focus();
      draw();
      return;
    }
    if (!unitStatus.hidden) {
      unitStatus.hidden = true;
      if (statusFromCommand && (selectedUnit?.side === currentSide || (debugMode && selectedUnit?.side === 'enemy'))) {
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
      if (rangeMode === 'precision-target') pendingPrecisionTarget = null;
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
    const { unit, x, y, moveRemaining } = pendingMove;
    unit.x = x;
    unit.y = y;
    delete unit.visualX;
    delete unit.visualY;
    unit.moveRemaining = moveRemaining ?? unit.moveRange;
    unit.moveUsed = unit.moveRemaining <= 0;
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

  function getMoveDistances(movingUnit, maxDistance = movingUnit.moveRemaining ?? movingUnit.moveRange, isPositionAllowed = null) {
    const distances = new Map();
    const key = (x, y) => `${x},${y}`;
    const queue = [{ x: movingUnit.x, y: movingUnit.y }];
    distances.set(key(movingUnit.x, movingUnit.y), 0);

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      const nextDistance = distances.get(key(current.x, current.y)) + 1;
      if (nextDistance > maxDistance) continue;

      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const x = current.x + dx;
        const y = current.y + dy;
        const nextKey = key(x, y);
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT || distances.has(nextKey)) continue;
        if (isPositionAllowed && !isPositionAllowed(x, y)) continue;

        if (isUnitPositionBlocked(movingUnit, x, y, true)) continue;
        distances.set(nextKey, nextDistance);
        queue.push({ x, y });
      }
    }
    return distances;
  }

  function getMovePath(movingUnit, targetX, targetY, isPositionAllowed = null) {
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
        if (isPositionAllowed && !isPositionAllowed(x, y)) continue;
        if (isUnitPositionBlocked(movingUnit, x, y, true)) continue;
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

  function updateCursorEnemyPreview(unit) {
    if (stagePreviewMode) {
      cursorEnemyPreview = null;
      if (cursorEnemyPreviewFrame) cancelAnimationFrame(cursorEnemyPreviewFrame);
      cursorEnemyPreviewFrame = 0;
      return;
    }
    const nextId = unit?.side === 'enemy' ? unit.id : null;
    if (cursorEnemyPreview?.unitId === nextId) return;
    if (!nextId) {
      cursorEnemyPreview = null;
      if (cursorEnemyPreviewFrame) cancelAnimationFrame(cursorEnemyPreviewFrame);
      cursorEnemyPreviewFrame = 0;
      return;
    }
    cursorEnemyPreview = { unitId: nextId, startedAt: performance.now() };
    if (!cursorEnemyPreviewFrame) {
      const animatePreview = () => {
        cursorEnemyPreviewFrame = 0;
        if (!cursorEnemyPreview || isGameOver) return;
        draw();
        cursorEnemyPreviewFrame = requestAnimationFrame(animatePreview);
      };
      cursorEnemyPreviewFrame = requestAnimationFrame(animatePreview);
    }
  }

  function isUnitPositionBlocked(unit, x, y, allowFriendlyTransit = false) {
    const { width, height } = getFootprintSize(unit);
    if (x < 0 || y < 0 || x + width > MAP_WIDTH || y + height > MAP_HEIGHT) return true;
    for (let tileY = y; tileY < y + height; tileY++) {
      for (let tileX = x; tileX < x + width; tileX++) {
        // An intact OBJ also blocks entry; after removal, only the terrain rule remains.
        if (impassableTiles.has(`${tileX},${tileY}`)) return true;
      }
    }
    const overlaps = (otherX, otherY, otherWidth, otherHeight) =>
      x < otherX + otherWidth && x + width > otherX &&
      y < otherY + otherHeight && y + height > otherY;
    if (obstacles.some((obstacle) => overlaps(obstacle.x, obstacle.y, 1, 1))) return true;
    return units.some((other) => {
      if (other === unit) return false;
      if (allowFriendlyTransit && areAlliedUnits(unit, other)) return false;
      const otherSize = getFootprintSize(other);
      return overlaps(other.x, other.y, otherSize.width, otherSize.height);
    });
  }

  function areAlliedUnits(first, second) {
    const alliedSides = new Set(['player', 'npc']);
    return first.side === second.side || (alliedSides.has(first.side) && alliedSides.has(second.side));
  }

  function getMoveRangeTiles(unit, distances, maxDistance = unit.moveRemaining ?? unit.moveRange) {
    const tiles = new Set();
    const footprint = getFootprintSize(unit);
    for (const [position, distance] of distances) {
      if (distance === 0 || distance > maxDistance) continue;
      const [x, y] = position.split(',').map(Number);
      if (isUnitPositionBlocked(unit, x, y)) continue;
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
    if (exactDistance > 0 && exactDistance <= (unit.moveRemaining ?? unit.moveRange) &&
        !isUnitPositionBlocked(unit, cellX, cellY)) return { x: cellX, y: cellY };

    const footprint = getFootprintSize(unit);
    const candidates = [];
    for (const [position, distance] of distances) {
      if (distance === 0 || distance > (unit.moveRemaining ?? unit.moveRange)) continue;
      const [x, y] = position.split(',').map(Number);
      if (isUnitPositionBlocked(unit, x, y)) continue;
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
          if (pendingMove?.unit === unit && unit.moveRemaining > 0) commitPendingMove();
          else if (pendingMove?.unit === unit) showMoveConfirmation(unit);
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
    const getMaximum = () => Math.max(0, isHorizontal ? MAP_WIDTH - VIEW_WIDTH : MAP_HEIGHT - VIEW_HEIGHT);
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
      else if (event.key === 'End') next = getMaximum();
      else return;
      event.preventDefault();
      setCameraPosition(isHorizontal ? next : camera.x, isHorizontal ? camera.y : next);
    });

    function moveThumb(pointer, bounds, thumbLength, offset, trackStart) {
      const trackLength = isHorizontal ? bounds.width : bounds.height;
      const travel = trackLength - thumbLength;
      if (travel <= 0) return;
      const position = Math.max(0, Math.min(travel, pointer - trackStart - offset));
      const cameraPosition = (position / travel) * getMaximum();
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
    const showPassability = stagePreviewMode || !emptyCommand.hidden;
    passabilityLegend.hidden = !showPassability;
    const canShowCursorEnemyPreview = cursorEnemyPreview && !rangeMode &&
      unitCommand.hidden && attackChoiceCommand.hidden && precisionConfirmCommand.hidden &&
      hateConfirmCommand.hidden && moveConfirmCommand.hidden && !isEnemyAiRunning &&
      !isCombatResolving && !battleEventActive;
    const cursorPreviewUnit = canShowCursorEnemyPreview
      ? units.find((unit) => unit.id === cursorEnemyPreview.unitId) ?? null
      : null;
    const cursorPreviewHateTarget = cursorPreviewUnit?.hateTargetId
      ? units.find((unit) => unit.id === cursorPreviewUnit.hateTargetId && unit.side === 'player')
      : null;
    const cursorPreviewHasHate = Boolean(cursorPreviewUnit && cursorPreviewHateTarget &&
      unitDistance(cursorPreviewUnit, cursorPreviewHateTarget) <= 8);
    const cursorPreviewCycleLength = cursorPreviewHasHate ? 3000 : 2000;
    const cursorPreviewElapsed = cursorEnemyPreview
      ? (performance.now() - cursorEnemyPreview.startedAt) % cursorPreviewCycleLength
      : 0;
    const cursorPreviewStage = Math.floor(cursorPreviewElapsed / 1000) % (cursorPreviewHasHate ? 3 : 2);
    const cursorPreviewPhase = cursorPreviewElapsed % 1000;
    const cursorPreviewAlpha = cursorPreviewPhase < 300
      ? cursorPreviewPhase / 300
      : cursorPreviewPhase < 600 ? 1
      : cursorPreviewPhase < 900 ? (900 - cursorPreviewPhase) / 300 : 0;
    const cursorPreviewMode = cursorPreviewStage === 0 ? 'move'
      : cursorPreviewStage === 1 ? 'attack'
      : 'hate';
    const cursorPreviewActive = cursorPreviewUnit && cursorPreviewAlpha > 0;
    const moveRangeUnit = cursorPreviewActive && cursorPreviewMode === 'move'
      ? cursorPreviewUnit
      : enemyRangePreview?.mode === 'move'
      ? enemyRangePreview.unit
      : rangeMode === 'move' ? selectedUnit : null;
    const attackRangeUnit = cursorPreviewActive && cursorPreviewMode === 'attack'
      ? cursorPreviewUnit
      : enemyRangePreview?.mode === 'attack'
      ? enemyRangePreview.unit
      : rangeMode === 'attack' || rangeMode === 'precision-target' ? selectedUnit : null;
    const hateRangeUnit = cursorPreviewActive && cursorPreviewMode === 'hate'
      ? cursorPreviewUnit
      : rangeMode === 'hate' ? selectedUnit : null;
    const previewAlpha = cursorPreviewActive ? cursorPreviewAlpha : 1;
    const previewingEnemyMovement = cursorPreviewActive && cursorPreviewMode === 'move';
    const moveDistances = moveRangeUnit
      ? getMoveDistances(moveRangeUnit, previewingEnemyMovement ? moveRangeUnit.moveRange : undefined)
      : null;
    const moveRangeTiles = moveRangeUnit
      ? getMoveRangeTiles(moveRangeUnit, moveDistances, previewingEnemyMovement ? moveRangeUnit.moveRange : undefined)
      : null;

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
        const attackDistance = attackRangeUnit ? distanceFromUnitToTile(attackRangeUnit, mapX, mapY) : 0;
        const blockingTerrainTarget = lineOfSightBlockedTiles.has(`${mapX},${mapY}`) &&
          !obstacles.some((obstacle) => obstacle.x === mapX && obstacle.y === mapY);
        const inAttackRange = attackRangeUnit && isWithinAttackRange(attackRangeUnit, attackDistance) &&
          !blockingTerrainTarget &&
          hasLineOfSight(attackRangeUnit, { x: mapX, y: mapY });
        const inHateRange = hateRangeUnit && distanceFromUnitToTile(hateRangeUnit, mapX, mapY) <= 8;
        if (inMoveRange || inAttackRange || inHateRange) {
          ctx.globalAlpha = previewAlpha;
          ctx.fillStyle = inAttackRange
            ? 'rgba(237, 112, 91, 0.54)'
            : inHateRange ? 'rgba(78, 206, 199, 0.42)'
            : moveRangeUnit.side === 'enemy' ? 'rgba(108, 174, 244, 0.52)' : 'rgba(227, 231, 154, 0.48)';
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.globalAlpha = 1;
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
        const screenX = (obstacle.x - camera.x) * TILE_SIZE + (obstacle.visualOffsetX ?? 0);
        const screenY = (obstacle.y - camera.y) * TILE_SIZE;
        ctx.drawImage(obstacle.image, screenX, screenY, TILE_SIZE, TILE_SIZE);
        if (obstacle.destructible) {
          ctx.fillStyle = '#101510e8';
          ctx.fillRect(screenX + TILE_SIZE - 30, screenY + TILE_SIZE - 19, 28, 16);
          ctx.strokeStyle = '#d6d2a4';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + TILE_SIZE - 30, screenY + TILE_SIZE - 19, 28, 16);
          ctx.fillStyle = '#f0f2dc';
          ctx.font = '11px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(obstacle.hpDisplayOverride ?? obstacle.hp), screenX + TILE_SIZE - 16, screenY + TILE_SIZE - 11);
        }
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

    for (const effect of hitEffects) {
      const frame = Math.min(hitEffectFrameCount - 1, Math.floor((performance.now() - effect.startedAt) / hitEffectFrameDuration));
      const frameWidth = effect.image.naturalWidth / 4;
      const frameHeight = effect.image.naturalHeight / 2;
      const sourceX = (frame % 4) * frameWidth;
      const sourceY = Math.floor(frame / 4) * frameHeight;
      const screenX = (effect.x - camera.x) * TILE_SIZE - effect.width / 2;
      const screenY = (effect.y - camera.y) * TILE_SIZE - effect.height / 2;
      if (screenX < -effect.width || screenX > VIEW_PIXEL_WIDTH || screenY < -effect.height || screenY > VIEW_PIXEL_HEIGHT) continue;

      ctx.save();
      // The supplied sheets number each frame in the upper-left; hide these guide labels.
      ctx.beginPath();
      ctx.rect(screenX, screenY, effect.width, effect.height);
      ctx.rect(screenX + effect.width * 0.07, screenY + effect.height * 0.04, effect.width * 0.16, effect.height * 0.16);
      ctx.clip('evenodd');
      ctx.drawImage(effect.image, sourceX, sourceY, frameWidth, frameHeight, screenX, screenY, effect.width, effect.height);
      ctx.restore();
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

    const cursorUnit = getUnitAtPosition(cursor.x, cursor.y);
    const cursorFootprint = cursorUnit ? getFootprintSize(cursorUnit) : { width: 1, height: 1 };
    const cursorMapX = cursorUnit?.x ?? cursor.x;
    const cursorMapY = cursorUnit?.y ?? cursor.y;
    const cursorX = (cursorMapX - camera.x) * TILE_SIZE;
    const cursorY = (cursorMapY - camera.y) * TILE_SIZE;
    const cursorWidth = cursorFootprint.width * TILE_SIZE;
    const cursorHeight = cursorFootprint.height * TILE_SIZE;
    const cursorIsAttackTarget = cursorUnit && (
      combatTarget === cursorUnit ||
      ((rangeMode === 'attack' || rangeMode === 'precision-target') && selectedUnit && cursorUnit.side !== selectedUnit.side &&
        canAttackUnitTarget(selectedUnit, cursorUnit)) ||
      (enemyRangePreview?.mode === 'attack' && enemyRangePreview.target === cursorUnit)
    );
    const cursorIsHateTarget = cursorUnit && rangeMode === 'hate' && cursorUnit.side === 'enemy' &&
      unitDistance(selectedUnit, cursorUnit) <= 8;
    const cursorColor = cursorIsAttackTarget ? '#f04444' : cursorIsHateTarget ? '#4ecec7' : '#f1d978';
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
    if (!attackChoiceCommand.hidden && selectedUnit) positionPanel(attackChoiceCommand, selectedUnit);
    if (!itemChoiceCommand.hidden && selectedUnit) positionPanel(itemChoiceCommand, selectedUnit);
    if (!itemConfirmCommand.hidden && selectedUnit) positionPanel(itemConfirmCommand, selectedUnit);
    if (!precisionConfirmCommand.hidden && selectedUnit) positionPanel(precisionConfirmCommand, selectedUnit);
    if (!hateConfirmCommand.hidden && selectedUnit) positionPanel(hateConfirmCommand, selectedUnit);
    if (!moveConfirmCommand.hidden && selectedUnit) positionPanel(moveConfirmCommand, selectedUnit);
    if (!unitStatus.hidden && selectedUnit) positionPanel(unitStatus, selectedUnit);
    if (!emptyCommand.hidden) positionPanel(emptyCommand, cursor);
    const horizontalThumb = mapScrollbars.x.querySelector('span');
    const verticalThumb = mapScrollbars.y.querySelector('span');
    const horizontalMaximum = Math.max(0, MAP_WIDTH - VIEW_WIDTH);
    const verticalMaximum = Math.max(0, MAP_HEIGHT - VIEW_HEIGHT);
    const horizontalSize = Math.min(1, VIEW_WIDTH / MAP_WIDTH);
    const verticalSize = Math.min(1, VIEW_HEIGHT / MAP_HEIGHT);
    horizontalThumb.style.width = `${horizontalSize * 100}%`;
    horizontalThumb.style.left = `${horizontalMaximum ? (camera.x / horizontalMaximum) * (1 - horizontalSize) * 100 : 0}%`;
    verticalThumb.style.height = `${verticalSize * 100}%`;
    verticalThumb.style.top = `${verticalMaximum ? (camera.y / verticalMaximum) * (1 - verticalSize) * 100 : 0}%`;
    mapScrollbars.x.hidden = horizontalMaximum === 0;
    mapScrollbars.y.hidden = verticalMaximum === 0;
    mapScrollbars.x.setAttribute('aria-valuemax', String(horizontalMaximum + 1));
    mapScrollbars.y.setAttribute('aria-valuemax', String(verticalMaximum + 1));
    mapScrollbars.x.setAttribute('aria-valuenow', String(Math.round(camera.x) + 1));
    mapScrollbars.y.setAttribute('aria-valuenow', String(Math.round(camera.y) + 1));
    mapScrollbars.x.setAttribute('aria-valuetext', `左端のマス ${Math.round(camera.x) + 1}`);
    mapScrollbars.y.setAttribute('aria-valuetext', `上端のマス ${Math.round(camera.y) + 1}`);
    touchControls.hidden = isGameOver ||
      (emptyCommand.hidden && saveSlotDialog.hidden && unitCommand.hidden && attackChoiceCommand.hidden && itemChoiceCommand.hidden && itemConfirmCommand.hidden && precisionConfirmCommand.hidden && hateConfirmCommand.hidden && unitStatus.hidden && turnConfirm.hidden && !rangeMode);
  }

  function positionPanel(panel, unit) {
    const bounds = canvas.getBoundingClientRect();
    const frameBounds = canvas.parentElement.getBoundingClientRect();
    const desiredLeft = (bounds.left - frameBounds.left) + (unit.x - camera.x + 0.5) * bounds.width / VIEW_WIDTH;
    const desiredTop = (bounds.top - frameBounds.top) + (unit.y - camera.y + 0.5) * bounds.height / VIEW_HEIGHT;
    const maxLeft = Math.max(0, frameBounds.width - panel.offsetWidth);
    const maxTop = Math.max(0, frameBounds.height - panel.offsetHeight);
    panel.style.left = `${Math.max(0, Math.min(maxLeft, desiredLeft))}px`;
    panel.style.top = `${Math.max(0, Math.min(maxTop, desiredTop))}px`;
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
      if (confirmKey) {
        if (storyStart.disabled) revealStoryImmediately();
        else closeBattleMessage();
      }
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

    if (!emptyCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const buttonCount = emptyCommand.querySelectorAll('button').length;
      emptyCommandSelection = (emptyCommandSelection + (event.key === 'ArrowDown' ? 1 : buttonCount - 1)) % buttonCount;
      updateEmptyCommandSelection();
      return;
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

    if (!attackChoiceCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const change = event.key === 'ArrowDown' ? 1 : -1;
      const buttons = [...attackChoiceCommand.querySelectorAll('button')];
      let nextIndex = attackChoiceSelection;
      do {
        nextIndex = (nextIndex + change + buttons.length) % buttons.length;
      } while (buttons[nextIndex].disabled && nextIndex !== attackChoiceSelection);
      attackChoiceSelection = nextIndex;
      updateAttackChoiceSelection();
      return;
    }

    if (!itemChoiceCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      itemChoiceSelection = 1 - itemChoiceSelection;
      updateItemChoiceSelection();
      return;
    }

    if (!itemConfirmCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      itemConfirmSelection = 1 - itemConfirmSelection;
      updateItemConfirmSelection();
      return;
    }

    if (!hateConfirmCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      hateConfirmSelection = 1 - hateConfirmSelection;
      updateHateConfirmSelection();
      return;
    }

    if (!precisionConfirmCommand.hidden && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      precisionConfirmSelection = 1 - precisionConfirmSelection;
      updatePrecisionConfirmSelection();
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

    if (!unitCommand.hidden || !attackChoiceCommand.hidden || !itemChoiceCommand.hidden || !itemConfirmCommand.hidden || !precisionConfirmCommand.hidden || !hateConfirmCommand.hidden) return;
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    cursor.x = Math.max(0, Math.min(MAP_WIDTH - 1, cursor.x + direction[0]));
    cursor.y = Math.max(0, Math.min(MAP_HEIGHT - 1, cursor.y + direction[1]));
    updateCursorEnemyPreview(getUnitAtPosition(cursor.x, cursor.y));
    scrollToCursor();
  });

  updateTitleSelection();
  draw();
  setBgm('M001_Title.mp3');
})();

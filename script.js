(() => {
  "use strict";

  // Central konfiguration för spelmotor, input och leaderboard-API.
  const CONSTANTS = {
    gridSize: 22,
    baseStepMs: 145,
    minStepMs: 78,
    speedRampPerPoint: 2.6,
    maxAccumulatorMs: 240,
    particleBurstCount: 14,
    trailMax: 22,
    swipeThreshold: 26,
    leaderboardEndpoint: "/api/leaderboard",
    maxPlayerName: 16,
  };

  const GAME_MODE = {
    idle: "idle",
    running: "running",
    paused: "paused",
    gameover: "gameover",
  };

  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const speedEl = document.getElementById("speed");
  const liveStatusEl = document.getElementById("sr-status");

  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const restartBtn = document.getElementById("restart-btn");
  const soundToggle = document.getElementById("sound-toggle");
  const effectsToggle = document.getElementById("effects-toggle");

  const leaderboardListEl = document.getElementById("leaderboard-list");
  const leaderboardStateEl = document.getElementById("leaderboard-state");
  const leaderboardNoticeEl = document.getElementById("leaderboard-notice");

  const modalEl = document.getElementById("name-modal");
  const nameFormEl = document.getElementById("name-form");
  const nameInputEl = document.getElementById("player-name");
  const nameErrorEl = document.getElementById("name-error");
  const saveNameBtnEl = document.getElementById("save-name-btn");
  const cancelNameBtnEl = document.getElementById("cancel-name-btn");

  const dpadButtons = Array.from(document.querySelectorAll(".dpad-btn"));

  const offscreenCanvas = document.createElement("canvas");
  const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false });

  // Runtime-state för hela appen. Hålls i minnet och återställs per omgång.
  const state = {
    mode: GAME_MODE.idle,
    snake: [],
    prevSnake: [],
    direction: { ...DIRECTIONS.right },
    inputBuffer: [],
    food: { x: 0, y: 0 },
    score: 0,
    highScore: readHighScore(),
    stepMs: CONSTANTS.baseStepMs,
    accumulatorMs: 0,
    lastFrameTime: 0,
    tileSizePx: 0,
    particles: [],
    shakeAmount: 0,
    trail: [],
    soundEnabled: true,
    effectsEnabled: true,
    audioUnlocked: false,
    touchStart: null,
    noticeTimer: 0,
  };

  const audio = createAudio();
  highScoreEl.textContent = String(state.highScore);

  init();

  // Initierar appens startflöde och första render.
  function init() {
    wireEvents();
    resetRound();
    resizeCanvas();
    updateHud();
    updateControlStates();
    announce("Tryck Enter för att starta");
    fetchAndRenderLeaderboard();
    requestAnimationFrame(loop);

    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
  }

  // Kopplar alla användarinteraktioner: tangentbord, touch, knappar och modal.
  function wireEvents() {
    document.addEventListener("keydown", onKeyDown);

    startBtn.addEventListener("click", () => {
      unlockAudioFromGesture();
      startGame();
    });

    pauseBtn.addEventListener("click", () => {
      unlockAudioFromGesture();
      togglePause();
    });

    restartBtn.addEventListener("click", () => {
      unlockAudioFromGesture();
      restartGame();
    });

    soundToggle.addEventListener("change", () => {
      state.soundEnabled = soundToggle.checked;
      if (state.soundEnabled) {
        unlockAudioFromGesture();
      }
    });

    effectsToggle.addEventListener("change", () => {
      state.effectsEnabled = effectsToggle.checked;
      if (!state.effectsEnabled) {
        state.particles.length = 0;
        state.trail.length = 0;
        state.shakeAmount = 0;
      }
    });

    dpadButtons.forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        unlockAudioFromGesture();
        queueDirection(fromDirName(button.dataset.dir));
      });
    });

    canvas.addEventListener(
      "touchstart",
      (event) => {
        unlockAudioFromGesture();
        if (event.touches.length !== 1) {
          return;
        }
        const touch = event.touches[0];
        state.touchStart = {
          x: touch.clientX,
          y: touch.clientY,
          time: performance.now(),
        };
      },
      { passive: true }
    );

    canvas.addEventListener(
      "touchend",
      (event) => {
        if (!state.touchStart || event.changedTouches.length !== 1) {
          state.touchStart = null;
          return;
        }
        const touch = event.changedTouches[0];
        const dx = touch.clientX - state.touchStart.x;
        const dy = touch.clientY - state.touchStart.y;
        const elapsed = performance.now() - state.touchStart.time;
        state.touchStart = null;

        if (elapsed > 460) {
          return;
        }

        if (Math.abs(dx) < CONSTANTS.swipeThreshold && Math.abs(dy) < CONSTANTS.swipeThreshold) {
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          queueDirection(dx > 0 ? DIRECTIONS.right : DIRECTIONS.left);
        } else {
          queueDirection(dy > 0 ? DIRECTIONS.down : DIRECTIONS.up);
        }
      },
      { passive: true }
    );

    modalEl.addEventListener("click", (event) => {
      if (event.target === modalEl) {
        closeNameModal();
      }
    });

    nameFormEl.addEventListener("submit", submitScore);

    cancelNameBtnEl.addEventListener("click", () => {
      closeNameModal();
    });
  }

  // Huvudhantering för tangentbord. Prioriterar modal-logik före spelinput.
  function onKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === "escape" && modalEl.classList.contains("is-open")) {
      closeNameModal();
      return;
    }

    if (key === "enter" && modalEl.classList.contains("is-open") && state.mode === GAME_MODE.gameover) {
      event.preventDefault();
      startGame();
      return;
    }

    if (
      key === "arrowup" ||
      key === "arrowdown" ||
      key === "arrowleft" ||
      key === "arrowright" ||
      key === " "
    ) {
      event.preventDefault();
    }

    if (modalEl.classList.contains("is-open")) {
      return;
    }

    unlockAudioFromGesture();

    if (key === "enter") {
      if (state.mode === GAME_MODE.idle || state.mode === GAME_MODE.gameover) {
        startGame();
      } else if (state.mode === GAME_MODE.paused) {
        setMode(GAME_MODE.running);
        announce("Fortsatt");
      }
      return;
    }

    if (key === " ") {
      togglePause();
      return;
    }

    if (key === "r") {
      restartGame();
      return;
    }

    switch (key) {
      case "arrowup":
      case "w":
        queueDirection(DIRECTIONS.up);
        break;
      case "arrowdown":
      case "s":
        queueDirection(DIRECTIONS.down);
        break;
      case "arrowleft":
      case "a":
        queueDirection(DIRECTIONS.left);
        break;
      case "arrowright":
      case "d":
        queueDirection(DIRECTIONS.right);
        break;
      default:
        break;
    }
  }

  function startGame() {
    if (state.mode === GAME_MODE.running) {
      return;
    }

    if (state.mode === GAME_MODE.idle || state.mode === GAME_MODE.gameover) {
      resetRound();
    }

    closeNameModal();
    setMode(GAME_MODE.running);
    announce("Spelet startat");
  }

  function togglePause() {
    if (state.mode === GAME_MODE.running) {
      setMode(GAME_MODE.paused);
      announce("Pausad");
      return;
    }

    if (state.mode === GAME_MODE.paused) {
      setMode(GAME_MODE.running);
      announce("Fortsatt");
    }
  }

  function restartGame() {
    closeNameModal();
    resetRound();
    setMode(GAME_MODE.running);
    announce("Spelet startat om");
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode !== GAME_MODE.running) {
      state.accumulatorMs = 0;
      state.inputBuffer.length = 0;
    }
    document.body.classList.toggle("is-playing", mode === GAME_MODE.running || mode === GAME_MODE.paused);
    updateControlStates();
  }

  function resetRound() {
    const center = Math.floor(CONSTANTS.gridSize / 2);
    state.snake = [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center },
    ];
    state.prevSnake = state.snake.map(cloneCell);
    state.direction = { ...DIRECTIONS.right };
    state.inputBuffer.length = 0;
    state.particles.length = 0;
    state.trail.length = 0;
    state.shakeAmount = 0;
    state.score = 0;
    state.stepMs = CONSTANTS.baseStepMs;
    spawnFood();
    updateHud();
  }

  function queueDirection(nextDirection) {
    if (!nextDirection) {
      return;
    }

    const reference =
      state.inputBuffer.length > 0
        ? state.inputBuffer[state.inputBuffer.length - 1]
        : state.direction;

    if (isSameDirection(nextDirection, reference) || isOppositeDirection(nextDirection, reference)) {
      return;
    }

    if (state.inputBuffer.length < 2) {
      state.inputBuffer.push({ ...nextDirection });
    }
  }

  // requestAnimationFrame-loop med fixed timestep för logik och interpolerad render.
  function loop(timeStamp) {
    if (!state.lastFrameTime) {
      state.lastFrameTime = timeStamp;
    }

    let frameDeltaMs = timeStamp - state.lastFrameTime;
    state.lastFrameTime = timeStamp;
    frameDeltaMs = Math.min(frameDeltaMs, CONSTANTS.maxAccumulatorMs);

    if (state.mode === GAME_MODE.running) {
      state.accumulatorMs += frameDeltaMs;
      while (state.accumulatorMs >= state.stepMs) {
        fixedStep();
        state.accumulatorMs -= state.stepMs;
        if (state.mode !== GAME_MODE.running) {
          break;
        }
      }
    }

    const alpha = state.mode === GAME_MODE.running ? state.accumulatorMs / state.stepMs : 1;
    const deltaSeconds = frameDeltaMs / 1000;

    updateParticles(deltaSeconds);
    updateShake(deltaSeconds);
    draw(alpha, deltaSeconds);

    requestAnimationFrame(loop);
  }

  // En logisk tick: riktning, kollision, mat, score och game over.
  function fixedStep() {
    applyBufferedTurn();

    state.prevSnake = state.snake.map(cloneCell);

    const currentHead = state.snake[0];
    const head = {
      x: currentHead.x + state.direction.x,
      y: currentHead.y + state.direction.y,
    };

    const willEat = head.x === state.food.x && head.y === state.food.y;
    const collisionBody = willEat ? state.snake : state.snake.slice(0, -1);

    const hitsWall =
      head.x < 0 ||
      head.y < 0 ||
      head.x >= CONSTANTS.gridSize ||
      head.y >= CONSTANTS.gridSize;

    const hitsBody = collisionBody.some((segment) => segment.x === head.x && segment.y === head.y);

    if (hitsWall || hitsBody) {
      setMode(GAME_MODE.gameover);
      addShake(10);
      audio.gameOver();
      announce(`Spelet är slut. Poäng: ${state.score}. Tryck Enter för att spela igen`);
      openNameModal();
      return;
    }

    state.snake.unshift(head);

    if (willEat) {
      state.score += 1;
      if (state.score > state.highScore) {
        state.highScore = state.score;
        saveHighScore(state.highScore);
      }

      state.stepMs = Math.max(
        CONSTANTS.minStepMs,
        CONSTANTS.baseStepMs - state.score * CONSTANTS.speedRampPerPoint
      );

      spawnFood();
      spawnParticles(head.x, head.y, CONSTANTS.particleBurstCount);
      addShake(4);
      audio.eat();
      updateHud();
    } else {
      state.snake.pop();
    }
  }

  function applyBufferedTurn() {
    if (state.inputBuffer.length === 0) {
      return;
    }

    const nextDirection = state.inputBuffer.shift();
    if (!isOppositeDirection(nextDirection, state.direction)) {
      state.direction = nextDirection;
      audio.turn();
    }
  }

  function spawnFood() {
    const occupied = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));

    let candidate;
    do {
      candidate = {
        x: Math.floor(Math.random() * CONSTANTS.gridSize),
        y: Math.floor(Math.random() * CONSTANTS.gridSize),
      };
    } while (occupied.has(`${candidate.x},${candidate.y}`));

    state.food = candidate;
  }

  function spawnParticles(cellX, cellY, count) {
    if (!state.effectsEnabled) {
      return;
    }

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.1 + Math.random() * 2.1;
      state.particles.push({
        x: cellX + 0.5,
        y: cellY + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.45 + Math.random() * 0.3,
        size: 0.08 + Math.random() * 0.12,
      });
    }
  }

  function updateParticles(dt) {
    if (!state.effectsEnabled) {
      state.particles.length = 0;
      return;
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;

      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function addShake(amount) {
    if (!state.effectsEnabled) {
      return;
    }
    state.shakeAmount = Math.min(16, state.shakeAmount + amount);
  }

  function updateShake(dt) {
    if (!state.effectsEnabled) {
      state.shakeAmount = 0;
      return;
    }
    state.shakeAmount = Math.max(0, state.shakeAmount - dt * 24);
  }

  // Topnivå-rendering av en frame.
  function draw(alpha, dt) {
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }

    ctx.save();

    if (state.effectsEnabled && state.shakeAmount > 0.01) {
      const jitter = state.shakeAmount;
      const offsetX = (Math.random() * 2 - 1) * jitter;
      const offsetY = (Math.random() * 2 - 1) * jitter;
      ctx.translate(offsetX, offsetY);
    }

    ctx.drawImage(offscreenCanvas, 0, 0);
    drawFood();
    drawSnake(alpha, dt);
    drawParticles();
    drawOverlay();

    ctx.restore();
  }

  function drawFood() {
    const tile = state.tileSizePx;
    const size = tile * 0.72;
    const offset = (tile - size) * 0.5;
    const x = state.food.x * tile + offset;
    const y = state.food.y * tile + offset;

    if (state.effectsEnabled) {
      ctx.shadowColor = "rgba(255, 122, 176, 0.8)";
      ctx.shadowBlur = tile * 0.22;
    }

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, "#ff7cab");
    gradient.addColorStop(1, "#ff4f73");
    ctx.fillStyle = gradient;
    roundRectFill(ctx, x, y, size, size, tile * 0.2);

    ctx.shadowBlur = 0;
  }

  function drawSnake(alpha, dt) {
    const tile = state.tileSizePx;
    const headPos = interpolateCell(0, alpha);

    if (state.effectsEnabled) {
      state.trail.unshift({ x: headPos.x, y: headPos.y, life: 1 });
      if (state.trail.length > CONSTANTS.trailMax) {
        state.trail.length = CONSTANTS.trailMax;
      }
      for (let i = state.trail.length - 1; i >= 0; i -= 1) {
        const trailSegment = state.trail[i];
        trailSegment.life -= dt * 3.2;
        if (trailSegment.life <= 0) {
          state.trail.splice(i, 1);
        }
      }

      for (let i = 0; i < state.trail.length; i += 1) {
        const trailSegment = state.trail[i];
        const px = trailSegment.x * tile + tile / 2;
        const py = trailSegment.y * tile + tile / 2;
        const radius = tile * (0.26 + (1 - i / state.trail.length) * 0.12);
        ctx.globalAlpha = 0.12 * trailSegment.life;
        ctx.fillStyle = "#63e8bc";
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      state.trail.length = 0;
    }

    const bodySize = tile * 0.84;
    const bodyOffset = (tile - bodySize) * 0.5;

    for (let i = state.snake.length - 1; i >= 0; i -= 1) {
      const segment = interpolateCell(i, alpha);
      const x = segment.x * tile + bodyOffset;
      const y = segment.y * tile + bodyOffset;

      if (i === 0 && state.effectsEnabled) {
        ctx.shadowColor = "rgba(83, 228, 183, 0.8)";
        ctx.shadowBlur = tile * 0.24;
      }

      const tone = 1 - i / Math.max(1, state.snake.length - 1);
      const color = i === 0 ? "rgb(98 245 196)" : `rgb(${48 + tone * 45} ${164 + tone * 50} ${132 + tone * 28})`;
      ctx.fillStyle = color;
      roundRectFill(ctx, x, y, bodySize, bodySize, tile * 0.24);
      ctx.shadowBlur = 0;
    }
  }

  function drawParticles() {
    const tile = state.tileSizePx;
    for (let i = 0; i < state.particles.length; i += 1) {
      const particle = state.particles[i];
      const lifeRatio = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = lifeRatio;
      ctx.fillStyle = "#9fffe0";
      ctx.beginPath();
      ctx.arc(
        particle.x * tile,
        particle.y * tile,
        Math.max(1, particle.size * tile),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    if (state.mode === GAME_MODE.running) {
      return;
    }

    ctx.fillStyle = "rgba(3, 7, 16, 0.56)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#eef5ff";
    ctx.font = `700 ${Math.max(26, canvas.width * 0.056)}px Segoe UI`;

    if (state.mode === GAME_MODE.gameover) {
      ctx.fillText("Spelet är slut", canvas.width / 2, canvas.height * 0.42);
      ctx.font = `600 ${Math.max(18, canvas.width * 0.036)}px Segoe UI`;
      ctx.fillStyle = "#ff9ab3";
      ctx.fillText(`Poäng: ${state.score}`, canvas.width / 2, canvas.height * 0.51);
      ctx.fillStyle = "#dae6ff";
      ctx.fillText("Tryck Enter för att spela igen", canvas.width / 2, canvas.height * 0.58);
      return;
    }

    if (state.mode === GAME_MODE.paused) {
      ctx.fillText("Pausad", canvas.width / 2, canvas.height * 0.5);
      return;
    }

    ctx.fillText("Tryck Enter för att starta", canvas.width / 2, canvas.height * 0.5);
  }

  function interpolateCell(index, alpha) {
    const current = state.snake[index] || state.snake[state.snake.length - 1];
    const previous = state.prevSnake[index] || current;
    return {
      x: lerp(previous.x, current.x, alpha),
      y: lerp(previous.y, current.y, alpha),
    };
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    highScoreEl.textContent = String(state.highScore);
    const speed = CONSTANTS.baseStepMs / state.stepMs;
    speedEl.textContent = `${speed.toFixed(1)}x`;
  }

  function updateControlStates() {
    startBtn.disabled = state.mode === GAME_MODE.running;
    pauseBtn.disabled = state.mode === GAME_MODE.idle || state.mode === GAME_MODE.gameover;
    pauseBtn.textContent = state.mode === GAME_MODE.paused ? "Fortsätt" : "Pausa";
  }

  function announce(message) {
    liveStatusEl.textContent = message;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    const displaySize = Math.round(Math.min(rect.width, rect.height));
    const pixelSize = Math.max(1, Math.round(displaySize * dpr));

    if (canvas.width === pixelSize && canvas.height === pixelSize) {
      return;
    }

    canvas.width = pixelSize;
    canvas.height = pixelSize;
    offscreenCanvas.width = pixelSize;
    offscreenCanvas.height = pixelSize;

    state.tileSizePx = pixelSize / CONSTANTS.gridSize;

    drawStaticBackground();
  }

  function drawStaticBackground() {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const gradient = offscreenCtx.createLinearGradient(0, 0, 0, offscreenCanvas.height);
    gradient.addColorStop(0, "#13274d");
    gradient.addColorStop(1, "#0a1630");
    offscreenCtx.fillStyle = gradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const tile = state.tileSizePx;
    offscreenCtx.strokeStyle = "rgba(175, 202, 255, 0.08)";
    offscreenCtx.lineWidth = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    for (let i = 1; i < CONSTANTS.gridSize; i += 1) {
      const p = i * tile;
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(p, 0);
      offscreenCtx.lineTo(p, offscreenCanvas.height);
      offscreenCtx.stroke();

      offscreenCtx.beginPath();
      offscreenCtx.moveTo(0, p);
      offscreenCtx.lineTo(offscreenCanvas.width, p);
      offscreenCtx.stroke();
    }
  }

  // Öppnar modal för att kunna spara score till global topplista.
  function openNameModal() {
    nameErrorEl.textContent = "";
    saveNameBtnEl.disabled = false;
    cancelNameBtnEl.disabled = false;
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    setTimeout(() => {
      nameInputEl.focus();
      nameInputEl.select();
    }, 0);
  }

  function closeNameModal() {
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    nameErrorEl.textContent = "";
  }

  // Skickar score till backend efter validering.
  async function submitScore(event) {
    event.preventDefault();

    const sanitizedName = sanitizePlayerName(nameInputEl.value);
    if (!sanitizedName) {
      nameErrorEl.textContent = "Skriv ett namn mellan 1 och 16 tecken.";
      return;
    }

    nameErrorEl.textContent = "";
    saveNameBtnEl.disabled = true;
    cancelNameBtnEl.disabled = true;

    try {
      await postScore(sanitizedName, state.score);
      localStorage.setItem("snake-last-player-name", sanitizedName);
      showNotice("Poängen är sparad.");
      closeNameModal();
      await fetchAndRenderLeaderboard();
    } catch (_error) {
      showNotice("Kunde inte spara score just nu.");
      nameErrorEl.textContent = "Det gick inte att spara. Försök igen.";
    } finally {
      saveNameBtnEl.disabled = false;
      cancelNameBtnEl.disabled = false;
    }
  }

  // Hämtar topplistan från backend och uppdaterar UI.
  async function fetchAndRenderLeaderboard() {
    leaderboardStateEl.textContent = "Laddar topplista...";

    try {
      const response = await fetch(CONSTANTS.leaderboardEndpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Kunde inte hämta topplistan");
      }

      const data = await response.json();
      const top = Array.isArray(data.top) ? data.top : [];
      renderLeaderboard(top);
      leaderboardStateEl.textContent = top.length > 0 ? "" : "Topplistan är tom ännu.";
    } catch (_error) {
      leaderboardListEl.innerHTML = "";
      leaderboardStateEl.textContent = "Kunde inte hämta topplistan just nu.";
    }
  }

  function renderLeaderboard(top) {
    leaderboardListEl.innerHTML = "";

    for (let i = 0; i < Math.min(5, top.length); i += 1) {
      const row = top[i];
      const item = document.createElement("li");
      item.className = "leaderboard-item";

      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = `#${i + 1}`;

      const name = document.createElement("span");
      name.className = "player-name";
      name.textContent = row.name;

      const score = document.createElement("span");
      score.className = "player-score";
      score.textContent = String(row.score);

      item.append(rank, name, score);
      leaderboardListEl.appendChild(item);
    }
  }

  async function postScore(name, score) {
    const response = await fetch(CONSTANTS.leaderboardEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, score }),
    });

    if (!response.ok) {
      throw new Error("Kunde inte spara poängen");
    }

    const data = await response.json();
    const top = Array.isArray(data.top) ? data.top : [];
    renderLeaderboard(top);
    leaderboardStateEl.textContent = top.length > 0 ? "" : "Topplistan är tom ännu.";
  }

  function sanitizePlayerName(value) {
    const withoutBreaks = String(value || "").replace(/[\r\n]+/g, " ");
    const trimmed = withoutBreaks.trim();
    if (!trimmed) {
      return "";
    }
    return trimmed.slice(0, CONSTANTS.maxPlayerName);
  }

  function showNotice(message) {
    leaderboardNoticeEl.textContent = message;
    clearTimeout(state.noticeTimer);
    state.noticeTimer = setTimeout(() => {
      leaderboardNoticeEl.textContent = "";
    }, 3000);
  }

  function roundRectFill(context, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
    context.fill();
  }

  // Ljudmotor med Web Audio API, aktiveras först efter användargesture.
  function createAudio() {
    let audioContext = null;

    function ensureContext() {
      if (!state.soundEnabled || state.audioUnlocked) {
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        state.audioUnlocked = true;
        return;
      }

      audioContext = audioContext || new AudioContextClass();
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      state.audioUnlocked = true;
    }

    function playTone(type, frequency, duration, volume, sweepTo) {
      if (!state.soundEnabled || !audioContext || audioContext.state !== "running") {
        return;
      }

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (typeof sweepTo === "number") {
        oscillator.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
      }

      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + duration + 0.015);
    }

    return {
      unlock() {
        ensureContext();
      },
      eat() {
        playTone("triangle", 480, 0.08, 0.09, 680);
      },
      turn() {
        playTone("square", 260, 0.03, 0.03, 310);
      },
      gameOver() {
        playTone("sine", 135, 0.22, 0.12, 55);
      },
    };
  }

  function unlockAudioFromGesture() {
    if (state.soundEnabled) {
      audio.unlock();
    }
  }

  function fromDirName(name) {
    if (!name || !DIRECTIONS[name]) {
      return null;
    }
    return DIRECTIONS[name];
  }

  function isSameDirection(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function isOppositeDirection(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function cloneCell(cell) {
    return { x: cell.x, y: cell.y };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function readHighScore() {
    try {
      const value = Number(localStorage.getItem("snake-high-score") || 0);
      if (!nameInputEl.value) {
        const lastName = localStorage.getItem("snake-last-player-name") || "";
        nameInputEl.value = lastName.slice(0, CONSTANTS.maxPlayerName);
      }
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    } catch (_error) {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem("snake-high-score", String(value));
    } catch (_error) {
      // Ignore storage failures.
    }
  }
})();

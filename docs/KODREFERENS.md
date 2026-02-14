# Kodreferens

Denna fil dokumenterar all exekverbar kod i projektet.

## Frontend

### `index.html`

- Bygger appens semantiska struktur.
- `main.layout` innehåller två kolumner: spelkort + topplista.
- `#name-modal` är dialog för att spara namn efter game over.

### `style.css`

- Definierar design tokens i `:root`.
- Hanterar responsiv layout med media queries för bredd och höjd.
- Säkrar kvadratisk canvas med `aspect-ratio: 1 / 1`.

### `script.js`

#### Konstanter och state

- `CONSTANTS`: centrala spel- och API-konstanter.
- `GAME_MODE`: state machine (`idle`, `running`, `paused`, `gameover`).
- `DIRECTIONS`: riktningsvektorer.
- `state`: runtime-state för spel, UI-effekter och topplistenotiser.

#### Funktioner

- `init()`
- `wireEvents()`
- `onKeyDown(event)`
- `startGame()`
- `togglePause()`
- `restartGame()`
- `setMode(mode)`
- `resetRound()`
- `queueDirection(nextDirection)`
- `loop(timeStamp)`
- `fixedStep()`
- `applyBufferedTurn()`
- `spawnFood()`
- `spawnParticles(cellX, cellY, count)`
- `updateParticles(dt)`
- `addShake(amount)`
- `updateShake(dt)`
- `draw(alpha, dt)`
- `drawFood()`
- `drawSnake(alpha, dt)`
- `drawParticles()`
- `drawOverlay()`
- `interpolateCell(index, alpha)`
- `updateHud()`
- `updateControlStates()`
- `announce(message)`
- `resizeCanvas()`
- `drawStaticBackground()`
- `openNameModal()`
- `closeNameModal()`
- `submitScore(event)`
- `fetchAndRenderLeaderboard()`
- `renderLeaderboard(top)`
- `postScore(name, score)`
- `sanitizePlayerName(value)`
- `showNotice(message)`
- `roundRectFill(context, x, y, width, height, radius)`
- `createAudio()`
- `unlockAudioFromGesture()`
- `fromDirName(name)`
- `isSameDirection(a, b)`
- `isOppositeDirection(a, b)`
- `cloneCell(cell)`
- `lerp(a, b, t)`
- `readHighScore()`
- `saveHighScore(value)`

Se `script.js` för full implementation och `docs/ARKITEKTUR.md` för designbeslut.

## Backend

### `functions/api/leaderboard.js`

- `corsHeaders()`
- `json(data, status)`
- `sanitizeName(value)`
- `readTop(db)`
- `onRequest(context)`

## Databas

### `db/schema.sql`

- Skapar tabell `scores` vid behov.
- Skapar index `scores_score_idx` för sortering på score.

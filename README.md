# Snake

Statisk Snake-webapp utan build tools eller externa bibliotek.

## Kör lokalt

1. Öppna terminal i projektmappen.
2. Starta server:

```bash
python -m http.server 8000
```

3. Öppna `http://localhost:8000`.

Du kan också öppna `index.html` direkt, men localhost rekommenderas för debugging.

## Testa layoutkravet

Verifiera i webbläsarens responsiva läge:

- Viewport: `1366 x 768`
- Zoom: `100%`
- Förväntat: hela UI:t syns utan vertikal scroll.

## Kontroller

- Pilar eller `WASD`: styr ormen
- `Enter`: starta
- `Space`: pausa eller fortsätt
- `R`: starta om

## Debug i VS Code

1. Kör servern med `python -m http.server 8000`.
2. Öppna Run and Debug.
3. Välj `Launch Snake`.
4. Starta debug-sessionen.

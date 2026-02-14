# Snake med global topplista

Snake är ett statiskt webspel med global topplista byggd på Cloudflare Pages Functions och D1.

## Dokumentation

- Arkitektur: `docs/ARKITEKTUR.md`
- API: `docs/API.md`
- Kodreferens: `docs/KODREFERENS.md`
- Bidragsguide: `CONTRIBUTING.md`
- Best practice 2026: `docs/BEST_PRACTICE_2026.md`

## Snabbstart lokalt

1. Öppna terminal i projektmappen.
2. Kör:

```bash
python -m http.server 8000
```

3. Öppna `http://localhost:8000`.

## Kvalitetskontroll UI

Verifiera i browser:
- Viewport: `1366 x 768`
- Zoom: `100%`
- Förväntat: spelpanel och topplista syns utan att användaren måste zooma ut.

## Kontroller

- Pilar eller `WASD`: styr ormen
- `Enter`: starta eller spela igen
- `Space`: pausa eller fortsätt
- `R`: starta om

## Setup på Cloudflare Pages och D1

1. Skapa Pages-projekt från GitHub
- Öppna [Cloudflare Dashboard](https://dash.cloudflare.com/) -> `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`.
- Välj ditt repo.
- Build command: tomt.
- Build output directory: `/`.
- Klicka `Save and Deploy`.

2. Skapa D1-databas
- Gå till `Workers & Pages` -> `D1` -> `Create database`.
- Exempel på namn: `snake-leaderboard`.

3. Kör databasschema
- Öppna databasen -> `Console`.
- Klistra in innehållet från `db/schema.sql`.
- Kör SQL.

4. Lägg till D1-binding i Pages-projektet
- Gå till `Workers & Pages` -> projektet -> `Settings` -> `Functions` -> `D1 bindings`.
- Klicka `Add binding`.
- Variable name: `DB`.
- Välj databasen du skapade.
- Spara.

5. Deploya om och hämta URL
- Gå till `Workers & Pages` -> projektet -> `Deployments`.
- Klicka `Retry deployment` eller pusha till `main`.
- URL visas högst upp, till exempel `https://<projekt>.pages.dev`.

## API

- `GET /api/leaderboard`
- `POST /api/leaderboard`

Exempel:

```json
{
  "name": "Spelare",
  "score": 12
}
```


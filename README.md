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

## Global topplista (Cloudflare Pages + D1)

1. Skapa Cloudflare Pages-projekt från GitHub-repot
- Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/) -> `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`.
- Välj detta GitHub-repo.
- Build command: lämna tomt.
- Build output directory: `/`.
- Klicka `Save and Deploy`.

2. Skapa D1-databas
- Gå till `Workers & Pages` -> `D1` -> `Create database`.
- Ge databasen ett namn, till exempel `snake-leaderboard`.

3. Kör schema i D1 Console
- Öppna databasen -> `Console`.
- Kopiera innehållet från `db/schema.sql`.
- Kör SQL i konsolen.

4. Bind D1 till Pages-projektet
- Gå till `Workers & Pages` -> ditt Pages-projekt -> `Settings` -> `Functions` -> `D1 bindings`.
- Klicka `Add binding`.
- Binding name: `DB`.
- Database: välj databasen du skapade.
- Spara.

5. Deploya och testa
- Gå till `Workers & Pages` -> ditt projekt -> `Deployments`.
- Klicka `Retry deployment` eller pusha en ny commit till `main`.
- Öppna `https://<ditt-projekt>.pages.dev/api/health`.
- Förväntat svar: JSON med `ok: true` och `db: \"ok\"`.
- Öppna spelet och spara en score i namnmodalen.

## API

- `GET /api/health`
- `GET /api/leaderboard`
- `POST /api/leaderboard`

## GitHub Pages

- Spelet fungerar på GitHub Pages.
- Spara till global topplista är avstängt där eftersom `/api` saknas på statisk hosting.
- För global topplista, använd Cloudflare Pages med Functions + D1 enligt stegen ovan.

Exempel:

```json
{
  "name": "Spelare",
  "score": 12
}
```


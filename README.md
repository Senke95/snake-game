# Snake med global topplista

Detta projekt är ett statiskt Snake-spel med global topplista via Cloudflare Pages Functions och D1.

## Kör lokalt

1. Öppna terminal i projektmappen.
2. Kör:

```bash
python -m http.server 8000
```

3. Öppna: `http://localhost:8000`

## Testa layout

- Viewport: `1366 x 768`
- Zoom: `100%`
- Förväntat: spel och topplista syns utan att du behöver zooma ut.

## Kontroller

- Pilar eller `WASD`: styr ormen
- `Enter`: starta
- `Space`: pausa eller fortsätt
- `R`: starta om

## Publicera med Cloudflare Pages och D1

1. **Skapa Pages-projekt från GitHub-repot**
   - Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/) -> `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`.
   - Välj ditt GitHub-repo.
   - Build command: lämna tomt.
   - Build output directory: `/`.
   - Klicka `Save and Deploy`.

2. **Skapa D1-databas**
   - Gå till `Workers & Pages` -> `D1` -> `Create database`.
   - Välj namn, till exempel `snake-leaderboard`.

3. **Kör SQL-schema i D1 Console**
   - Öppna din nya D1-databas.
   - Gå till fliken `Console`.
   - Öppna filen `db/schema.sql` i repot och kopiera innehållet.
   - Klistra in i D1 Console och kör.

4. **Lägg till D1-binding i Pages-projektet**
   - Gå till `Workers & Pages` -> ditt Pages-projekt -> `Settings` -> `Functions` -> `D1 bindings`.
   - Klicka `Add binding`.
   - Variable name: `DB`.
   - D1 database: välj databasen du skapade.
   - Spara.

5. **Deploya igen och hämta slutlig URL**
   - Gå till `Workers & Pages` -> ditt projekt -> `Deployments`.
   - Klicka `Retry deployment` eller pusha en ny commit till `main`.
   - Din slutliga URL finns högst upp på projektsidan, till exempel `https://<projekt>.pages.dev`.

## API-endpoint

- `GET /api/leaderboard`
- `POST /api/leaderboard` med body:

```json
{
  "name": "Spelare",
  "score": 12
}
```

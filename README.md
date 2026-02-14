# Snake

Ett statiskt Snake-spel med global topplista.

## Kör lokalt

```bash
python -m http.server 8000
```

Öppna `http://localhost:8000`.

## Kontroller

- Pilar eller `WASD`: styr ormen.
- `Enter`: starta eller spela igen.
- `Space`: pausa eller fortsätt.
- `R`: starta om.

## Supabase för global topplista

1. Kör SQL i `supabase/schema.sql` via Supabase `SQL Editor`.
2. Sätt `SUPABASE_URL` och `SUPABASE_ANON_KEY` i `config.js`.
3. Deploya till GitHub Pages.
4. Verifiera status i UI.

Status i UI:
- `API: live`: topplistan är ansluten.
- `API: fel`: anslutning finns men något blockerar.
- `API: lokal`: Supabase är inte konfigurerat.

## Nätverksanrop

- `GET /rest/v1/scores?select=id&limit=1` för health check.
- `GET /rest/v1/scores?...limit=5` för topplista.
- `POST /rest/v1/scores` för att spara score.

## Projektfiler

- `index.html`: struktur och UI.
- `style.css`: design och responsiv layout.
- `script.js`: spelmotor, rendering, topplista och status.
- `config.js`: publik Supabase-konfiguration.

## Mer dokumentation

- `docs/ARKITEKTUR.md`
- `docs/API.md`
- `docs/KODREFERENS.md`
- `docs/BEST_PRACTICE_2026.md`

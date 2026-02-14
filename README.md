# Snake med global topplista

Snake är ett statiskt webspel med global topplista. Spelet kan köras på GitHub Pages med Supabase, eller på Cloudflare Pages med Functions + D1.

## Snabbstart lokalt

1. Öppna terminal i projektmappen.
2. Kör:

```bash
python -m http.server 8000
```

3. Öppna `http://localhost:8000`.

## Kontroller

- Pilar eller `WASD`: styr ormen
- `Enter`: starta eller spela igen
- `Space`: pausa eller fortsätt
- `R`: starta om

## Global topplista med Supabase (rekommenderat för GitHub Pages)

1. Skapa tabell och policies
- Öppna Supabase Dashboard -> `SQL Editor`.
- Kör hela filen `supabase/schema.sql`.

2. Hämta projektets API-inställningar
- Gå till `Project Settings` -> `API`.
- Kopiera:
  - Project URL
  - `anon` public key

3. Konfigurera frontend
- Öppna `config.js` i repot.
- Sätt:
  - `SUPABASE_URL` till din Project URL.
  - `SUPABASE_ANON_KEY` till din `anon` key.

4. Deploya till GitHub Pages
- Pusha till `main`.
- Öppna GitHub Pages-länken.
- Verifiera att UI visar `API: OK`.

5. Testa spara score
- Spela tills game over.
- Skriv namn och klicka `Spara`.
- Topplistan ska uppdateras globalt.

## Alternativ: Cloudflare Pages + D1

1. Skapa Cloudflare Pages-projekt från repot.
2. Skapa D1-databas.
3. Kör `db/schema.sql` i D1 Console.
4. Lägg D1 binding med namn `DB` i Pages-projektet.
5. Deploya och verifiera `/api/health`.

## API-endpoints

- `GET /api/health` (Cloudflare Functions)
- `GET /api/leaderboard` (Cloudflare Functions)
- `POST /api/leaderboard` (Cloudflare Functions)

Supabase-läget använder direktanrop mot `https://<project-ref>.supabase.co/rest/v1/scores`.

## Felsökning

- `API: saknas` på GitHub Pages: kontrollera `config.js` och att `SUPABASE_ANON_KEY` är satt.
- `HTTP 401/403` vid spara: kontrollera `anon` key och att policies i `supabase/schema.sql` är körda.
- `HTTP 404` i Cloudflare-läge: kontrollera att Functions är deployade.
- `API: lokal`: backend saknas, topplistan sparas lokalt i webbläsaren på denna enhet.

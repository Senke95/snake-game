# Arkitektur

## Översikt
Projektet består av tre lager:

1. **Frontend (statisk)**
- `index.html`
- `style.css`
- `script.js`

2. **API (Cloudflare Pages Functions)**
- `functions/api/leaderboard.js`

3. **Databas (Cloudflare D1 / SQLite)**
- `db/schema.sql`

Flöde:
- Spelaren spelar lokalt i browsern.
- Vid game over kan poäng skickas till `POST /api/leaderboard`.
- Topplistan hämtas med `GET /api/leaderboard`.
- API läser och skriver i D1-tabellen `scores` via binding `DB`.

## Designprinciper

- **Enkel drift**: ingen build-step krävs för spelkoden.
- **Ingen hemlighetslagring i klient**: frontend använder endast publik endpoint.
- **Responsiv layout**: spel + topplista fungerar på laptop och mobil.
- **Deterministisk spel-loop**: fixed timestep för spel-logik, interpolerad rendering för flyt.
- **Fail-soft API**: UI fortsätter fungera även om topplistan är nere.

## Runtime-kontrakt

### Frontend
- Körs i modern browser med Canvas 2D och `requestAnimationFrame`.
- Förväntar att `/api/leaderboard` finns i samma origin vid produktion.

### API
- Förväntar D1 binding med namnet `DB`.
- Returnerar JSON i alla svar.

### Databas
- Tabell: `scores(id, name, score, created_at)`.
- Top 5 hämtas sorterat på `score DESC, created_at ASC`.

## Prestanda

- Grid-bakgrund för-renderas till offscreen canvas och blitas varje frame.
- Spel-logik körs med timestep i millisekunder, render körs i browserns frame-rate.
- Partikeleffekter och skakning kan stängas av i UI.

## Tillgänglighet

- Statusrad med `aria-live` för spelstatus.
- Modal använder `role="dialog"` och valideringsmeddelanden i text.

## Säkerhet

- Endast `name` och `score` accepteras av API.
- Namn saneras och begränsas till 16 tecken.
- Score valideras som icke-negativ heltalspoäng.
- Inga tokens eller nycklar i koden.

## Begränsningar i nuvarande version

- Score skickas från klienten och kan manipuleras av avancerade användare.
- Ingen rate-limiting i API ännu.

Rekommenderad nästa nivå:
- Lägg till enkel anti-spam (IP-baserad begränsning per tidsfönster).
- Lägg till server-sidig rimlighetskontroll för score.

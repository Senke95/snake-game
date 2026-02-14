# Arkitektur

## Lager

1. Frontend: `index.html`, `style.css`, `script.js`.
2. Data: Supabase `scores` via REST.
3. Fallback: lokalt läge utan global topplista.

## Flöde

1. Spelet körs helt i klienten.
2. Topplistan läses vid laddning.
3. Vid game over kan score sparas.
4. UI visar alltid status: `API: live`, `API: fel`, `API: lokal`.

## Principer

- Enkel drift utan build tools.
- Gameplay-logik frikopplad från backend.
- Fail-soft UI om API inte svarar.

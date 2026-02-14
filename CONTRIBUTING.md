# Bidra

## Kodstandard

- Håll allt enkelt och läsbart.
- Ingen hemlig data i kod, commits eller issues.
- Svensk UI-text i frontend.
- UTF-8 i alla textfiler.

## Branch och commits

1. Skapa branch från `main`.
2. Gör små, tydliga commits.
3. Använd commit-meddelanden som beskriver syftet.

## Checklista före PR

- Spelet startar lokalt via `python -m http.server 8000`.
- Inga konsolfel i browsern.
- Layout fungerar i `1366x768`, zoom `100%`.
- API fungerar för `GET /api/leaderboard` och `POST /api/leaderboard`.
- Dokumentation uppdaterad om beteende ändrats.

## Säkerhet

- Lägg aldrig in API-nycklar, tokens eller lösenord.
- Servervalidering ska alltid finnas för indata.

## PR-innehåll

- Beskriv vad som ändrats.
- Beskriv varför.
- Lista manuella teststeg.

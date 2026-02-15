# API

Supabase används från frontend via REST.

## Läs topplista

`GET /rest/v1/scores?select=name,score,created_at&order=score.desc,created_at.asc&limit=50`

## Spara score

`POST /rest/v1/scores`

Body:

```json
{ "name": "Spelare", "score": 42 }
```

## Health check

`GET /rest/v1/scores?select=id&limit=1`

## Krav

- Tabell `scores` skapad via `supabase/schema.sql`.
- RLS tillåter `SELECT` och `INSERT` för publishable key.

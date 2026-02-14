# API-dokumentation

Bas-URL i produktion: samma origin som Pages-sajten.

## GET /api/leaderboard

Hämtar topplista.

### Svar 200

```json
{
  "top": [
    {
      "name": "Spelare",
      "score": 42,
      "created_at": "2026-02-14 12:34:56"
    }
  ]
}
```

### Fel

- `500` om DB-binding saknas.

## POST /api/leaderboard

Sparar en poäng och returnerar uppdaterad topp 5.

### Request body

```json
{
  "name": "Spelare",
  "score": 42
}
```

### Regler

- `name`: trimmas, radbrytningar tas bort, max 16 tecken, får inte vara tomt.
- `score`: heltal, `0 <= score <= 1000000`.

### Svar 201

```json
{
  "top": [
    {
      "name": "Spelare",
      "score": 42,
      "created_at": "2026-02-14 12:34:56"
    }
  ]
}
```

### Fel

- `400` ogiltig JSON.
- `400` tomt namn.
- `400` ogiltig poäng.
- `500` DB-binding saknas.

## OPTIONS /api/leaderboard

Preflight för CORS.

## Headers

API returnerar bland annat:
- `Content-Type: application/json; charset=utf-8`
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- `Cache-Control: no-store`

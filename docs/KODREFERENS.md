# Kodreferens

## Frontend

- `index.html`: layout med spelpanel, topplista och modal.
- `style.css`: premium mörk UI, responsiv desktop och mobil.
- `script.js`: spel-loop, input, rendering, ljud, topplista, API-status.
- `config.js`: `SUPABASE_URL` och `SUPABASE_ANON_KEY`.

## Data

- `supabase/schema.sql`: schema och policies för global topplista.
- `db/schema.sql`: schema för Cloudflare D1-läge.
- `functions/api/*`: Cloudflare Functions om det läget används.

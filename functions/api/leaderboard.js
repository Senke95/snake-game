function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

function sanitizeName(value) {
  const withoutBreaks = String(value || "").replace(/[\r\n]+/g, " ");
  const trimmed = withoutBreaks.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.slice(0, 16);
}

async function readTop(db) {
  const result = await db
    .prepare(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 5"
    )
    .all();

  return Array.isArray(result.results) ? result.results : [];
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const db = env.DB;
  if (!db) {
    return json({ error: "DB binding saknas" }, 500);
  }

  if (request.method === "GET") {
    const top = await readTop(db);
    return json({ top });
  }

  if (request.method === "POST") {
    let payload;
    try {
      payload = await request.json();
    } catch (_error) {
      return json({ error: "Ogiltig JSON" }, 400);
    }

    const name = sanitizeName(payload?.name);
    const score = Number(payload?.score);

    if (!name) {
      return json({ error: "Namn måste fyllas i" }, 400);
    }

    if (!Number.isInteger(score) || score < 0 || score > 1000000) {
      return json({ error: "Ogiltig poäng" }, 400);
    }

    await db
      .prepare("INSERT INTO scores (name, score) VALUES (?1, ?2)")
      .bind(name, score)
      .run();

    const top = await readTop(db);
    return json({ top }, 201);
  }

  return json({ error: "Metod stöds inte" }, 405);
}

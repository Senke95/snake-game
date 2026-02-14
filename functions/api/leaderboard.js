function headers() {
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
    headers: headers(),
  });
}

function sanitizeName(value) {
  const noBreaks = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (!noBreaks) {
    return "";
  }
  return noBreaks.slice(0, 16);
}

async function top5(db) {
  const result = await db
    .prepare("SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 5")
    .all();

  return Array.isArray(result.results) ? result.results : [];
}

function dbMissingError() {
  return json(
    {
      error: "D1 binding DB saknas",
      hint: "Koppla DB i Cloudflare Pages Settings -> Bindings",
    },
    500
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers() });
  }

  if (!env.DB) {
    return dbMissingError();
  }

  if (request.method === "GET") {
    const top = await top5(env.DB);
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
      return json({ error: "Namn måste vara 1 till 16 tecken" }, 400);
    }

    if (!Number.isInteger(score) || score < 0 || score > 99999) {
      return json({ error: "Ogiltig poäng" }, 400);
    }

    await env.DB.prepare("INSERT INTO scores (name, score) VALUES (?1, ?2)").bind(name, score).run();

    const top = await top5(env.DB);
    return json({ top }, 201);
  }

  return json({ error: "Metod stöds inte" }, 405);
}

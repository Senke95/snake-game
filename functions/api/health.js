function headers() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: headers(),
  });
}

export async function onRequest(context) {
  const db = context.env.DB;

  if (!db) {
    return json({ ok: false, db: "missing" }, 500);
  }

  try {
    await db.prepare("SELECT 1").first();
    return json({ ok: true, db: "ok" });
  } catch (_error) {
    return json({ ok: false, db: "error" }, 500);
  }
}

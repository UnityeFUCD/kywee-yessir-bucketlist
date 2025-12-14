// netlify/functions/room.js
// Stores/loads the shared state in Supabase (server-side key stays secret in Netlify env)

const TABLE = "bucket_rooms";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: "missing SUPABASE env vars" });
  }

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    if (event.httpMethod === "GET") {
      const room = (event.queryStringParameters?.room || "").trim();
      if (!room) return json(400, { error: "room required" });

      const url =
        `${SUPABASE_URL}/rest/v1/${TABLE}` +
        `?select=payload,updated_at&room=eq.${encodeURIComponent(room)}&limit=1`;

      const r = await fetch(url, { headers });
      if (!r.ok) return json(500, { error: "supabase read failed" });

      const rows = await r.json();
      const first = rows?.[0] || null;

      return json(200, {
        payload: first?.payload || {},
        updated_at: first?.updated_at || null,
      });
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const room = (body.room || "").trim();
      const payload = body.payload || {};

      if (!room) return json(400, { error: "room required" });

      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=room`;

      const r = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          room,
          payload,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!r.ok) return json(500, { error: "supabase write failed" });

      return json(200, { ok: true });
    }

    return json(405, { error: "method not allowed" });
  } catch (e) {
    return json(500, { error: "server error" });
  }
};

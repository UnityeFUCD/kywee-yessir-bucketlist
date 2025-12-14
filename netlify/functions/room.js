export async function handler(event) {
  // CORS (same-origin Netlify is fine, but this keeps it safe)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const TABLE = process.env.SUPABASE_TABLE || "bucket_rooms";

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars" }),
    };
  }

  const restBase = `${SUPABASE_URL}/rest/v1/${TABLE}`;

  try {
    if (event.httpMethod === "GET") {
      const room = (event.queryStringParameters?.room || "").trim();
      if (!room) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "room required" }) };
      }

      const url = `${restBase}?room=eq.${encodeURIComponent(room)}&select=payload`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });

      if (!res.ok) {
        const t = await res.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase GET failed", detail: t }) };
      }

      const data = await res.json();
      const payload = data?.[0]?.payload ?? null;
      return { statusCode: 200, headers, body: JSON.stringify({ payload }) };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const room = (body.room || "").trim();
      const payload = body.payload;

      if (!room || !payload) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "room and payload required" }) };
      }

      // upsert
      const url = `${restBase}?on_conflict=room`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          room,
          payload,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase UPSERT failed", detail: t }) };
      }

      const data = await res.json();
      const savedPayload = data?.[0]?.payload ?? payload;
      return { statusCode: 200, headers, body: JSON.stringify({ payload: savedPayload }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error", detail: String(err) }) };
  }
}

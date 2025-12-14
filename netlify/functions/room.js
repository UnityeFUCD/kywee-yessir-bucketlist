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

function normUser(name) {
  const n = String(name || "").trim().toLowerCase();
  if (n === "yasir") return "yasir";
  if (n === "kylee") return "kylee";
  return "";
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

      const payload = first?.payload || {};
      const presence = payload?.presence || {};

      return json(200, {
        payload,
        presence,
        updated_at: first?.updated_at || null,
      });
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const room = (body.room || "").trim();
      const payloadIn = body.payload || null;
      const presenceIn = body.presence || null;

      if (!room) return json(400, { error: "room required" });

      // Read existing row so presence-patch doesn't overwrite data
      const getUrl =
        `${SUPABASE_URL}/rest/v1/${TABLE}` +
        `?select=payload&room=eq.${encodeURIComponent(room)}&limit=1`;

      let existingPayload = {};
      const getR = await fetch(getUrl, { headers });
      if (getR.ok) {
        const rows = await getR.json();
        existingPayload = rows?.[0]?.payload || {};
      }

      let merged = { ...(existingPayload || {}) };

      // Merge main payload if provided
      if (payloadIn && typeof payloadIn === "object") {
        merged = { ...merged, ...payloadIn };
      }

      // Presence patch (stores last seen for yasir/kylee)
      if (presenceIn && typeof presenceIn === "object" && presenceIn.user) {
        const key = normUser(presenceIn.user);
        if (key) {
          const pres = { ...(merged.presence || {}) };
          pres[key] = new Date().toISOString();
          merged.presence = pres;
        }
      }

      const upsertUrl = `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=room`;

      const r = await fetch(upsertUrl, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          room,
          payload: merged,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!r.ok) return json(500, { error: "supabase write failed" });

      return json(200, { ok: true, payload: merged, presence: merged.presence || {} });
    }

    return json(405, { error: "method not allowed" });
  } catch (e) {
    return json(500, { error: "server error" });
  }
};

// netlify/functions/room.js


const TABLE = "bucket_rooms";
const DEVICE_TTL_MS = 10000; // [FIX v1.4.4] 10 seconds TTL (was 3s, too aggressive)

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
      let activeDevices = { ...(payload?.activeDevices || {}) };
      let presenceVersion = payload?.presenceVersion || 0;

      // Prune stale devices on READ
      const now = Date.now();
      let pruned = false;
      for (const u of Object.keys(activeDevices)) {
        const rec = activeDevices[u] || {};
        const last = Number(rec.lastActive || 0);
        if (!Number.isFinite(last) || (now - last) > DEVICE_TTL_MS) {
          delete activeDevices[u];
          pruned = true;
        }
      }

      // Write back pruned state
      if (pruned) {
        const merged = { ...payload, activeDevices };
        merged.presenceVersion = (merged.presenceVersion || 0) + 1;
        presenceVersion = merged.presenceVersion;
        
        const upsertUrl = `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=room`;
        await fetch(upsertUrl, {
          method: "POST",
          headers: { ...headers, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({
            room,
            payload: merged,
            updated_at: first?.updated_at || new Date().toISOString(),
          }),
        });
      }

      return json(200, {
        payload: { ...payload, activeDevices },
        presence,
        activeDevices,
        presenceVersion,
        updated_at: first?.updated_at || null,
        serverTime: now,
      });
    }

    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        body = {};
      }

      const room = (body.room || "").trim();
      const payloadIn = body.payload || null;
      const presenceIn = body.presence || null;
      const removeDevice = body.removeDevice || null;

      if (!room) return json(400, { error: "room required" });

      const getUrl =
        `${SUPABASE_URL}/rest/v1/${TABLE}` +
        `?select=payload,updated_at&room=eq.${encodeURIComponent(room)}&limit=1`;

      let existingPayload = {};
      let existingUpdatedAt = null;

      const getR = await fetch(getUrl, { headers });
      if (getR.ok) {
        const rows = await getR.json();
        existingPayload = rows?.[0]?.payload || {};
        existingUpdatedAt = rows?.[0]?.updated_at || null;
      }

      let merged = { ...(existingPayload || {}) };

      const isPayloadWrite = !!(payloadIn && typeof payloadIn === "object");
      let presenceChanged = false;

      if (isPayloadWrite) {
        // [FIX v1.4.4] Deep merge activeDevices instead of overwriting
        if (payloadIn.activeDevices && typeof payloadIn.activeDevices === "object") {
          merged.activeDevices = merged.activeDevices || {};
          for (const [user, deviceInfo] of Object.entries(payloadIn.activeDevices)) {
            merged.activeDevices[user] = deviceInfo;
          }
          presenceChanged = true;
          // Remove activeDevices from payloadIn so it doesn't overwrite in shallow merge
          const { activeDevices, ...restPayload } = payloadIn;
          merged = { ...merged, ...restPayload };
        } else {
          merged = { ...merged, ...payloadIn };
          if (payloadIn.activeDevices !== undefined) {
            presenceChanged = true;
          }
        }
      }

      // Handle explicit device removal
      if (removeDevice && typeof removeDevice === "object") {
        const user = normUser(removeDevice.user);
        const deviceId = removeDevice.deviceId;
        if (user && merged.activeDevices?.[user]) {
          if (!deviceId || merged.activeDevices[user].deviceId === deviceId) {
            delete merged.activeDevices[user];
            presenceChanged = true;
          }
        }
      }

      if (presenceIn && typeof presenceIn === "object" && presenceIn.user) {
        const key = normUser(presenceIn.user);
        if (key) {
          const pres = { ...(merged.presence || {}) };
          pres[key] = new Date().toISOString();
          merged.presence = pres;
          presenceChanged = true;
        }
      }

      if (presenceChanged) {
        merged.presenceVersion = (merged.presenceVersion || 0) + 1;
      }

      let nextUpdatedAt = existingUpdatedAt;
      if (isPayloadWrite) nextUpdatedAt = new Date().toISOString();
      if (!nextUpdatedAt) nextUpdatedAt = new Date().toISOString();

      // Prune stale devices
      const now = Date.now();
      if (merged.activeDevices && typeof merged.activeDevices === "object") {
        for (const u of Object.keys(merged.activeDevices)) {
          const rec = merged.activeDevices[u] || {};
          const last = Number(rec.lastActive || 0);
          if (!Number.isFinite(last) || (now - last) > DEVICE_TTL_MS) {
            delete merged.activeDevices[u];
            presenceChanged = true;
          }
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
          updated_at: nextUpdatedAt,
        }),
      });

      if (!r.ok) return json(500, { error: "supabase write failed" });

      return json(200, {
        ok: true,
        payload: merged,
        presence: merged.presence || {},
        activeDevices: merged.activeDevices || {},
        presenceVersion: merged.presenceVersion || 0,
        updated_at: nextUpdatedAt,
        serverTime: now,
      });
    }

    return json(405, { error: "method not allowed" });
  } catch (e) {
    console.error("Room function error:", e);
    return json(500, { error: "server error" });
  }
};
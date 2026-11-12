// api/community.js - NO @upstash/redis needed, uses fetch only

function getUpstash() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url, token };
}

async function upstash({ url, token }, path, method = "GET", body) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { result: null, raw: text }; }
}

async function redisGet(cfg, key) {
  const j = await upstash(cfg, `/get/${encodeURIComponent(key)}`);
  const raw = j.result;
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function redisSet(cfg, key, value) {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  await upstash(cfg, `/set/${encodeURIComponent(key)}/${encodeURIComponent(str)}`, "POST");
}

async function redisKeys(cfg, pattern) {
  const j = await upstash(cfg, `/keys/${encodeURIComponent(pattern)}`);
  if (Array.isArray(j.result)) return j.result;
  return [];
}

async function redisIncr(cfg, key) {
  const j = await upstash(cfg, `/incr/${encodeURIComponent(key)}`, "POST");
  return Number(j.result) || 0;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const cfg = getUpstash();
    if (!cfg) return res.status(500).json({ error: "Missing UPSTASH_REDIS_REST_URL / TOKEN" });

    const body = parseBody(req);
    const type = req.query.type || body.type;

    // ---------- MARKET PRICES ----------
    if (type === "market-prices") {
      if (req.method === "GET") {
        const location = req.query.location || "lagos";
        const keys = await redisKeys(cfg, `didi:price:${location}:*`);
        const prices = {};
        const counts = {};
        for (const k of keys) {
          const item = k.split(":").slice(3).join(":");
          const v = await redisGet(cfg, k);
          if (v && typeof v === "object") {
            prices[item] = Math.round(v.sum / Math.max(1, v.count));
            counts[item] = v.count;
          } else if (typeof v === "number") {
            prices[item] = v;
            counts[item] = 1;
          }
        }
        return res.status(200).json({ prices, counts, location });
      }

      if (req.method === "POST") {
        const { location = "lagos", item, price, email = "guest" } = body;
        if (!item || !price) return res.status(400).json({ error: "item + price required" });

        const cleanItem = String(item).toLowerCase().trim()
          .replace(/^\d+\s*(g|kg|ml|tbsp|tsp|cup|medium|large|small)?\s*/i, "")
          .split("(")[0].trim()
          .slice(0, 60);
        const amount = parseInt(String(price).replace(/[^0-9]/g, ""), 10);
        if (!amount || amount <= 0) return res.status(400).json({ error: "invalid price" });

        const key = `didi:price:${location}:${cleanItem}`;
        const existing = await redisGet(cfg, key);
        let sum = amount, count = 1;
        if (existing && typeof existing === "object") {
          sum = (existing.sum || 0) + amount;
          count = (existing.count || 0) + 1;
        } else if (typeof existing === "number") {
          sum = existing + amount;
          count = 2;
        }
        const average = Math.round(sum / count);
        await redisSet(cfg, key, { sum, count, avg: average, lastBy: email, updatedAt: new Date().toISOString() });

        return res.status(200).json({ ok: true, item: cleanItem, price: amount, average, count, location });
      }
      return res.status(405).json({ error: "method not allowed" });
    }

    // ---------- QUESTS ----------
    if (type === "quests") {
      if (req.method === "GET") {
        const location = req.query.location || "lagos";
        const keys = await redisKeys(cfg, `didi:quest:*:${location}`);
        const counts = {};
        for (const k of keys) {
          const questId = k.split(":")[2];
          const v = await redisGet(cfg, k);
          counts[questId] = Number(v) || 0;
        }
        const joinKeys = await redisKeys(cfg, `didi:quest_join:*:${location}`);
        const joined = {};
        for (const k of joinKeys) {
          const questId = k.split(":")[2];
          const v = await redisGet(cfg, k);
          joined[questId] = Number(v) || 0;
        }
        return res.status(200).json({ counts, joined });
      }
      if (req.method === "POST") {
        const { action = "complete", questId, location = "lagos", email = "guest" } = body;
        if (!questId) return res.status(400).json({ error: "questId required" });
        if (action === "join") {
          const joinedTotal = await redisIncr(cfg, `didi:quest_join:${questId}:${location}`);
          const userKey = `didi:user_quests:${email.toLowerCase()}`;
          const existing = (await redisGet(cfg, userKey)) || [];
          const arr = Array.isArray(existing) ? existing : [];
          if (!arr.find(q => q.id === questId)) {
            arr.push({ id: questId, progress: 0, total: 2, completed: false, joinedAt: new Date().toISOString() });
            await redisSet(cfg, userKey, arr);
          }
          return res.status(200).json({ ok: true, joinedTotal });
        }
        const total = await redisIncr(cfg, `didi:quest:${questId}:${location}`);
        return res.status(200).json({ ok: true, totalCompletions: total });
      }
      return res.status(405).json({ error: "method not allowed" });
    }

    return res.status(400).json({ error: "unknown type: " + type });
  } catch (e) {
    console.error("community error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

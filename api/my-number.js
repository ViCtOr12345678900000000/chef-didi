// api/my-number.js — Chef Didi Admin API
// GET = dashboard data, POST = new review/visitor/user, DELETE = delete one item
// NEVER returns 500 — returns empty arrays if Upstash is missing/down

import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

const KEYS = {
  visitors: "chef-didi:visitors",
  users: "chef-didi:users",
  reviews: "chef-didi:reviews",
};

async function readList(redis, key) {
  if (!redis) return [];
  try {
    const raw = await redis.lrange(key, 0, -1);
    if (!raw || !raw.length) return [];
    return raw.map((item) => {
      if (typeof item === "string") {
        try { return JSON.parse(item); } catch { return { raw: item }; }
      }
      return item;
    });
  } catch (e) {
    console.error("readList error", key, e);
    return [];
  }
}

function matches(item, body) {
  if (!item) return false;
  // 1. Prefer id if both have it
  if (body.id && item.id) return String(item.id) === String(body.id);
  // 2. Reviews: createdAt + email + comment
  if (body.comment !== undefined && body.comment !== null) {
    return String(item.createdAt || item.time || "") === String(body.createdAt || "") &&
      String(item.email || "") === String(body.email || "") &&
      String(item.comment || "") === String(body.comment || "");
  }
  // 3. Users: createdAt + email
  if (body.email && body.createdAt) {
    return String(item.createdAt || item.time || "") === String(body.createdAt) &&
      String(item.email || "") === String(body.email);
  }
  // 4. Visitors: time + city + device
  if (body.city) {
    return String(item.time || item.createdAt || "") === String(body.createdAt || "") &&
      String(item.city || "") === String(body.city);
  }
  // 5. Fallback: id only
  if (body.id) return String(item.id) === String(body.id);
  return false;
}

export default async function handler(req, res) {
  // Allow CORS for admin page
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const redis = getRedis();

  try {
    // ---------- GET ----------
    if (req.method === "GET") {
      if (!redis) {
        // Don't 500 — return empty so dashboard loads and shows "Nothing here yet"
        return res.status(200).json({
          visitors: [], users: [], reviews: [],
          _warning: "Upstash env vars missing — check Vercel Settings > Environment Variables",
        });
      }
      const [visitors, users, reviews] = await Promise.all([
        readList(redis, KEYS.visitors),
        readList(redis, KEYS.users),
        readList(redis, KEYS.reviews),
      ]);
      return res.status(200).json({ visitors, users, reviews });
    }

    // ---------- POST ----------
    // Used by Footer (review) + tracking (visitor/user)
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      // Detect type: review has comment+rating, user has name+email, visitor has city
      let key = KEYS.reviews;
      let item = { ...body, id: body.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: body.createdAt || body.time || new Date().toISOString() };

      if (body.type === "visitors" || (body.city && !body.comment)) {
        key = KEYS.visitors;
        item.time = item.createdAt;
      } else if (body.type === "users" || (body.name && body.email && !body.comment)) {
        key = KEYS.users;
      } else {
        key = KEYS.reviews;
      }

      if (!redis) {
        // Still return success so Footer doesn't break, even if Upstash is missing
        return res.status(200).json({ ok: true, saved: false, warning: "Upstash missing" });
      }
      await redis.lpush(key, JSON.stringify(item));
      return res.status(200).json({ ok: true, saved: true, item });
    }

    // ---------- DELETE ----------
    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const type = body.type; // "visitors" | "users" | "reviews"
      if (!type || !KEYS[type]) {
        return res.status(400).json({ error: "Missing valid type: visitors, users, or reviews" });
      }
      if (!redis) {
        return res.status(200).json({ ok: true, deleted: false, warning: "Upstash missing" });
      }

      const key = KEYS[type];
      const list = await readList(redis, key);
      const toDelete = list.find((x) => matches(x, body));

      if (!toDelete) {
        return res.status(404).json({ error: "Item not found — already deleted?" });
      }

      // Remove exact JSON string from list
      await redis.lrem(key, 1, JSON.stringify(toDelete));
      // Fallback: if stored differently (object vs string), try raw object string
      // Upstash stores what we pushed, so above should work. If not, rebuild list:
      // const remaining = list.filter((x) => !matches(x, body));
      // await redis.del(key); for (const r of remaining.reverse()) await redis.lpush(key, JSON.stringify(r));

      return res.status(200).json({ ok: true, deleted: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("my-number API error:", e);
    // CRITICAL: Never 500 on GET — dashboard must load
    if (req.method === "GET") {
      return res.status(200).json({ visitors: [], users: [], reviews: [], _error: String(e.message || e) });
    }
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
}

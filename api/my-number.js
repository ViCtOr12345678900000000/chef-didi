// api/my-number.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function parseMaybeJSON(v) {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function toArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(parseMaybeJSON).filter(Boolean);
  const parsed = parseMaybeJSON(raw);
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 1. VISITORS - try list first, then old counter format
    let visitors = [];
    try {
      const list = await redis.lrange("didi:visitors_list", 0, -1);
      if (list?.length) visitors = list.map(parseMaybeJSON).filter(Boolean);
    } catch {}
    if (!visitors.length) {
      try {
        const list2 = await redis.lrange("didi:visits", 0, -1);
        if (list2?.length) visitors = list2.map(parseMaybeJSON).filter(Boolean);
      } catch {}
    }
    if (!visitors.length) {
      try {
        const raw = await redis.get("didi:visitors");
        const arr = toArray(raw);
        if (arr.length) visitors = arr;
      } catch {}
    }

    // 2. USERS - try list first, then stored JSON
    let users = [];
    try {
      const list = await redis.lrange("didi:users_list", 0, -1);
      if (list?.length) users = list.map(parseMaybeJSON).filter(Boolean);
    } catch {}
    if (!users.length) {
      try {
        const raw = await redis.get("didi:users");
        users = toArray(raw);
      } catch {}
    }

    // 3. REVIEWS - same key as api/reviews.js uses
    let reviews = [];
    try {
      const raw = await redis.lrange("didi:reviews", 0, -1);
      reviews = (raw || []).map(parseMaybeJSON).filter(Boolean).reverse();
    } catch {}

    return res.status(200).json({
      visitors, // <-- ARRAY for MyNumber.jsx
      users,    // <-- ARRAY for MyNumber.jsx
      reviews,  // <-- ARRAY for MyNumber.jsx
      totalUsers: users.length,
      totalVisits: visitors.length,
    });
  } catch (err) {
    console.error("my-number error", err);
    return res.status(500).json({ error: "Failed to load stats" });
  }
}

// api/my-number.js - INTEGRATED: dashboard + reviews (no extra function)
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- REVIEWS: POST - from Footer review box ---
    if (req.method === "POST") {
      const { name, email, rating, comment } = req.body || {};
      if (!comment?.trim() || !name?.trim()) {
        return res.status(400).json({ error: "Name + comment required" });
      }
      const review = {
        id: Date.now().toString(),
        name: name.trim().slice(0, 50),
        email: (email || "").trim().slice(0, 100),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: comment.trim().slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      await redis.lpush("didi:reviews", JSON.stringify(review));
      return res.status(200).json({ ok: true, review });
    }

    // --- REVIEWS: DELETE - from MyNumber dashboard ---
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const all = await redis.lrange("didi:reviews", 0, -1);
      const kept = all.filter((s) => {
        try { return parseMaybeJSON(s)?.id !== String(id); } catch { return true; }
      });
      await redis.del("didi:reviews");
      if (kept.length) await redis.rpush("didi:reviews", ...kept);
      return res.status(200).json({ ok: true });
    }

    // --- DASHBOARD: GET - your original code, untouched ---
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
      visitors,
      users,
      reviews,
      totalUsers: users.length,
      totalVisits: visitors.length,
    });
  } catch (err) {
    console.error("my-number error", err);
    return res.status(500).json({ error: "Failed to load stats" });
  }
}

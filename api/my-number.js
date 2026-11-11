// api/my-number.js - BULLETPROOFED JSON PARSING
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null; // prevents bad strings from crashing the app
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { name, email, rating, comment } = req.body || {};
      if (!comment?.trim() || !name?.trim()) return res.status(400).json({ error: "Name + comment required" });
      const review = { id: Date.now().toString(), name: name.trim().slice(0, 50), email: (email || "").trim().slice(0, 100), rating: Math.min(5, Math.max(1, Number(rating) || 5)), comment: comment.trim().slice(0, 500), createdAt: new Date().toISOString() };
      await redis.lpush("didi:reviews", JSON.stringify(review));
      return res.status(200).json({ ok: true, review });
    }

    if (req.method === "DELETE") {
      const { type, id } = req.body || {};
      if (!id) return res.status(400).json({ error: "Missing id" });
      const key = type === "visitors" ? "didi:visitors_list" : type === "users" ? "didi:users_list" : "didi:reviews";
      const all = await redis.lrange(key, 0, -1);
      const kept = (all || []).filter(s => { const p = safeParse(s); return p && String(p.id) !== String(id); });
      await redis.del(key);
      if (kept.length) await redis.rpush(key, ...kept);
      return res.status(200).json({ ok: true });
    }

    // Safe GET fetching with zero risk of parsing exceptions
    const [vList, uList, rList] = await Promise.all([
      redis.lrange("didi:visitors_list", 0, -1).catch(() => []),
      redis.lrange("didi:users_list", 0, -1).catch(() => []),
      redis.lrange("didi:reviews", 0, -1).catch(() => []),
    ]);

    const visitors = (vList || []).map(safeParse).filter(Boolean);
    const users = (uList || []).map(safeParse).filter(Boolean);
    const reviews = (rList || []).map(safeParse).filter(Boolean).reverse();

    return res.status(200).json({ visitors, users, reviews, totalUsers: users.length, totalVisits: visitors.length });
  } catch (err) {
    console.error("my-number error:", err);
    return res.status(500).json({ error: err.message || "Failed to load stats" });
  }
}

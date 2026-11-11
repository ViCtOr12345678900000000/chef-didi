// api/reviews.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET - list all reviews for MyNumber + Footer
    if (req.method === "GET") {
      const raw = await redis.lrange("didi:reviews", 0, -1);
      const reviews = (raw || []).map((r) => {
        try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; }
      }).filter(Boolean).reverse(); // newest first
      return res.status(200).json({ reviews });
    }

    // POST - save new review from Footer
    if (req.method === "POST") {
      const { name, email, rating, comment } = req.body || {};
      if (!name?.trim() || !comment?.trim()) {
        return res.status(400).json({ error: "Name and comment required" });
      }
      const review = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        name: String(name).trim().slice(0, 50),
        email: String(email || "guest").trim().slice(0, 100),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: String(comment).trim().slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      await redis.lpush("didi:reviews", JSON.stringify(review));
      return res.status(200).json({ ok: true, review });
    }

    // DELETE - delete from MyNumber dashboard
    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "id required" });
      const raw = await redis.lrange("didi:reviews", 0, -1);
      const kept = (raw || []).filter((r) => {
        try {
          const obj = typeof r === "string" ? JSON.parse(r) : r;
          return obj.id !== id;
        } catch { return true; }
      });
      await redis.del("didi:reviews");
      if (kept.length) await redis.rpush("didi:reviews", ...kept);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("reviews error", e);
    return res.status(500).json({ error: "Failed" });
  }
}

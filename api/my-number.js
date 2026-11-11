// api/my-number.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 1. Visitors - from Upstash counter
    const visitors = (await redis.get("didi:visitors")) || 0;

    // 2. Users - from your users list
    const usersRaw = await redis.get("didi:users");
    const users = Array.isArray(usersRaw) ? usersRaw : usersRaw ? JSON.parse(usersRaw) : [];
    const totalUsers = users.length;

    // 3. Reviews - from didi:reviews list
    let reviews = [];
    try {
      const rawReviews = await redis.lrange("didi:reviews", 0, -1);
      reviews = (rawReviews || []).map((r) => {
        try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; }
      }).filter(Boolean).reverse(); // newest first
    } catch (e) {
      console.log("reviews fetch failed", e);
      reviews = [];
    }

    // 4. Recipes cooked - optional, if you track it
    const recipesCooked = (await redis.get("didi:recipes_cooked")) || 0;

    return res.status(200).json({
      visitors: Number(visitors),
      totalUsers,
      recipesCooked: Number(recipesCooked),
      reviews, // <-- this is what MyNumber.jsx reads
    });
  } catch (err) {
    console.error("my-number error", err);
    return res.status(500).json({ error: "Failed to load stats" });
  }
}

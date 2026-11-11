// api/my-number.js - INTEGRATED: dashboard + reviews + delete for visitors/users/reviews
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function parseMaybeJSON(v) {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
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
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim().slice(0, 50),
        email: (email || "").trim().slice(0, 100),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: comment.trim().slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      await redis.lpush("didi:reviews", JSON.stringify(review));
      return res.status(200).json({ ok: true, review });
    }

    // --- UNIVERSAL DELETE: remove visitor, user, or review ---
    if (req.method === "DELETE") {
      const body = req.body || {};
      const type = body.type || req.query.type || "reviews";
      const id = body.id || req.query.id;
      const { email, createdAt, comment, city, name } = body;

      // Determine Redis key dynamically based on target type
      let redisKey = "didi:reviews";
      if (type === "visitors") {
        // Check which list key exists for visitors
        const list1 = await redis.lrange("didi:visitors_list", 0, 0).catch(() => []);
        redisKey = list1.length ? "didi:visitors_list" : "didi:visits";
      } else if (type === "users") {
        redisKey = "didi:users_list";
      }

      const allRaw = await redis.lrange(redisKey, 0, -1);
      if (!allRaw || !allRaw.length) {
        return res.status(404).json({ error: "No records found to delete" });
      }

      let removed = false;
      const kept = allRaw.filter((itemStr) => {
        if (removed) return true; // match only one entry per delete click
        const item = parseMaybeJSON(itemStr);
        if (!item) return true;

        // 1. Primary match by explicit ID
        if (id && String(item.id) === String(id)) {
          removed = true;
          return false;
        }

        // 2. Fallback composite key matching if no ID exists
        if (type === "reviews") {
          const matchComment = item.comment === comment;
          const matchTimeOrEmail = item.createdAt === createdAt || item.email === email;
          if (matchComment && matchTimeOrEmail) {
            removed = true;
            return false;
          }
        } else if (type === "users") {
          const matchEmail = email && item.email === email;
          const matchName = name && item.name === name;
          if (matchEmail || (matchName && item.createdAt === createdAt)) {
            removed = true;
            return false;
          }
        } else if (type === "visitors") {
          const matchTime = createdAt && (item.time === createdAt || item.createdAt === createdAt);
          const matchCity = city && item.city === city;
          if (matchTime && matchCity) {
            removed = true;
            return false;
          }
        }

        return true;
      });

      if (!removed) {
        return res.status(404).json({ error: "Item match not found in Upstash" });
      }

      // Atomically overwrite Upstash list key with remaining filtered items
      await redis.del(redisKey);
      if (kept.length) {
        await redis.rpush(redisKey, ...kept);
      }

      return res.status(200).json({ ok: true, deletedType: type });
    }

    // --- DASHBOARD: GET ---
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
    return res.status(500).json({ error: "Failed to process request" });
  }
}

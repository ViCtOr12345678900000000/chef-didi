// api/my-number.js  OR  pages/api/my-number.js
// Works with Upstash Redis
// Needs in Vercel Env Vars:
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const KEYS = {
  visitors: "chef-didi:visitors",
  users: "chef-didi:users",
  reviews: "chef-didi:reviews",
};

// Helper: Redis can return string or object - normalize to array
async function getList(key) {
  try {
    const raw = await redis.get(key);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  } catch (e) {
    console.error("getList error", key, e);
    return [];
  }
}

async function saveList(key, list) {
  // Keep only last 2000 to avoid Upstash size issues
  const trimmed = list.slice(-2000);
  await redis.set(key, JSON.stringify(trimmed));
  return trimmed;
}

function isMatch(item, body, type) {
  // 1. If both have id, match by id - most reliable
  if (body.id && item.id && String(body.id) === String(item.id)) return true;
  if (body.id && !item.id) return false;

  // 2. Composite match for old data without id
  if (type === "reviews") {
    return (
      String(item.createdAt || "") === String(body.createdAt || "") &&
      String(item.email || "") === String(body.email || "") &&
      String(item.comment || "") === String(body.comment || "")
    );
  }
  if (type === "users") {
    return (
      String(item.createdAt || "") === String(body.createdAt || "") &&
      String(item.email || "") === String(body.email || "")
    );
  }
  // visitors
  return (
    String(item.time || item.createdAt || "") === String(body.createdAt || body.time || "") &&
    String(item.city || "") === String(body.city || "") &&
    String(item.device || "") === String(body.device || "")
  );
}

export default async function handler(req, res) {
  // Allow CORS for safety
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET - Dashboard loads this ----------
    if (req.method === "GET") {
      const [visitors, users, reviews] = await Promise.all([
        getList(KEYS.visitors),
        getList(KEYS.users),
        getList(KEYS.reviews),
      ]);
      // Newest first
      return res.status(200).json({
        visitors: [...visitors].reverse(),
        users: [...users].reverse(),
        reviews: [...reviews].reverse(),
      });
    }

    // ---------- POST - Footer review + track visitor/user ----------
    if (req.method === "POST") {
      const body = req.body || {};
      const now = new Date().toISOString();

      // If it's a review (has comment + rating or name+comment)
      if (body.comment || body.rating) {
        const list = await getList(KEYS.reviews);
        const newReview = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: body.name || "Anonymous",
          email: body.email || "",
          rating: Number(body.rating) || 5,
          comment: body.comment || "",
          createdAt: body.createdAt || now,
        };
        await saveList(KEYS.reviews, [...list, newReview]);
        return res.status(200).json({ ok: true, review: newReview });
      }

      // If it's a user signup
      if (body.type === "user" || (body.name && body.email && !body.city)) {
        const list = await getList(KEYS.users);
        const newUser = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: body.name || "",
          email: body.email || "",
          createdAt: body.createdAt || now,
        };
        await saveList(KEYS.users, [...list, newUser]);
        return res.status(200).json({ ok: true, user: newUser });
      }

      // Otherwise it's a visitor
      const list = await getList(KEYS.visitors);
      const newVisitor = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        city: body.city || "Unknown",
        country: body.country || "Unknown",
        device: body.device || "Other",
        time: body.time || now,
      };
      await saveList(KEYS.visitors, [...list, newVisitor]);
      return res.status(200).json({ ok: true, visitor: newVisitor });
    }

    // ---------- DELETE - This is what your 🗑️ button calls ----------
    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const type = body.type; // "reviews" | "users" | "visitors"

      if (!type || !KEYS[type]) {
        return res.status(400).json({ error: "Missing valid type: reviews/users/visitors" });
      }

      const list = await getList(KEYS[type]);
      const before = list.length;
      const after = list.filter((item) => !isMatch(item, body, type));

      if (after.length === before) {
        return res.status(404).json({ error: "Item not found - already deleted or key mismatch" });
      }

      await saveList(KEYS[type], after);
      return res.status(200).json({ ok: true, deleted: before - after.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("my-number API error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

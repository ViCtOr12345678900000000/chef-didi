// pages/api/my-number.js
// Last working version - uses Upstash REST, no extra package needed
// Keys: visitors / users / reviews
// GET returns { visitors, users, reviews }
// POST saves a visitor OR user OR review
// DELETE removes one entry

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd, ...args) {
  const res = await fetch(`${URL}/${cmd}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const j = await res.json();
  return j.result;
}

async function getList(key) {
  try {
    const raw = await redis("GET", key);
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveList(key, list) {
  await redis("SET", key, JSON.stringify(list));
}

export default async function handler(req, res) {
  // Allow CORS / preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET ----------
    if (req.method === "GET") {
      const visitors = await getList("visitors");
      const users = await getList("users");
      const reviews = await getList("reviews");
      return res.status(200).json({ visitors, users, reviews });
    }

    // ---------- POST ----------
    if (req.method === "POST") {
      const body = req.body || {};
      // Review from footer form: { name, comment, rating } or { type: "reviews", ... }
      // Visitor: { type: "visitors", city, country, device }
      // User: { type: "users", name, email }

      // If it looks like a review (has comment, no type), treat as review
      let type = body.type;
      if (!type) {
        if (body.comment) type = "reviews";
        else if (body.email && body.name) type = "users";
        else type = "visitors";
      }

      const list = await getList(type);
      const entry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        ...body,
        createdAt: body.createdAt || body.time || new Date().toISOString(),
        time: body.time || body.createdAt || new Date().toISOString(),
      };
      // Remove duplicate type field inside entry so frontend stays clean
      delete entry.type;
      list.unshift(entry);
      await saveList(type, list.slice(0, 1000));
      return res.status(200).json({ ok: true, saved: entry });
    }

    // ---------- DELETE ----------
    if (req.method === "DELETE") {
      const body = req.body || {};
      const type = body.type || "reviews";
      const list = await getList(type);
      const filtered = list.filter((x) => {
        if (body.id && x.id) return x.id !== body.id;
        // fallback match for old entries without id
        if (type === "reviews")
          return !(x.createdAt === body.createdAt && x.email === body.email && x.comment === body.comment);
        if (type === "users")
          return !(x.createdAt === body.createdAt && x.email === body.email);
        return !(x.time === body.time && x.city === body.city);
      });
      await saveList(type, filtered);
      return res.status(200).json({ ok: true, deleted: list.length - filtered.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("my-number api error:", e);
    // Never 500 with empty body - always return empty arrays so page renders 0s instead of crashing
    return res.status(200).json({ visitors: [], users: [], reviews: [], error: e.message });
  }
}

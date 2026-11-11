// pages/api/my-number.js
// Just a regular page API, not in the UI.
// Uses Upstash REST directly - no extra package needed.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// All the key names your data could be under - we check them all
const KEY_VARIANTS = {
  visitors: ["visitors", "chef-didi:visitors", "my-number:visitors", "chef_didi_visitors", "visits"],
  users: ["users", "chef-didi:users", "my-number:users", "chef_didi_users", "registered-users"],
  reviews: ["reviews", "chef-didi:reviews", "my-number:reviews", "chef_didi_reviews", "footer-reviews"],
};

async function redis(cmd, ...args) {
  if (!URL || !TOKEN) return null;
  const res = await fetch(`${URL}/${cmd}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const j = await res.json().catch(() => ({}));
  return j.result ?? null;
}

function parseValue(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
      if (p && Array.isArray(p.items)) return p.items;
      return [];
    } catch { return []; }
  }
  return [];
}

async function getList(type) {
  for (const key of KEY_VARIANTS[type]) {
    // Try as a LIST (LRANGE) first - this is how most old code saved it
    const list = await redis("lrange", key, "0", "-1");
    if (Array.isArray(list) && list.length > 0) {
      return list.map((s) => {
        try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
      }).filter(Boolean);
    }
    // Try as a single JSON STRING (GET)
    const str = await redis("get", key);
    const parsed = parseValue(str);
    if (parsed.length > 0) return parsed;
  }
  return [];
}

async function saveList(type, arr) {
  // Save to the FIRST / canonical key, keep it simple
  const key = KEY_VARIANTS[type][0];
  await redis("del", key);
  if (arr.length === 0) return;
  // Save as JSON strings in a list
  for (const item of arr) {
    await redis("rpush", key, JSON.stringify(item));
  }
}

function matches(item, body) {
  if (body.id && item.id) return item.id === body.id;
  // Fallback: match on createdAt/time + email/comment/city
  if (body.createdAt && item.createdAt && item.createdAt !== body.createdAt) return false;
  if (body.createdAt && item.time && item.time !== body.createdAt) return false;
  if (body.email && item.email && item.email !== body.email) return false;
  if (body.comment && item.comment && item.comment !== body.comment) return false;
  if (body.city && item.city && item.city !== body.city) return false;
  // If we got here and at least one field matched, it's a match
  return !!(body.createdAt || body.email || body.comment);
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const [visitors, users, reviews] = await Promise.all([
        getList("visitors"),
        getList("users"),
        getList("reviews"),
      ]);
      // ALWAYS return arrays, never null / undefined
      return res.status(200).json({ visitors, users, reviews });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      // Footer review box sends: { name, email, comment, rating }
      // Visitor tracker sends: { city, country, device }
      // Signup sends: { name, email }
      let type = body.type;
      if (!type) {
        if (body.comment != null) type = "reviews";
        else if (body.city != null || body.device != null) type = "visitors";
        else if (body.email != null) type = "users";
        else type = "reviews";
      }
      const list = await getList(type);
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        time: new Date().toISOString(),
        ...body,
      };
      delete newItem.type;
      list.unshift(newItem);
      await saveList(type, list);
      return res.status(200).json({ ok: true, item: newItem });
    }

    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const type = body.type || "reviews";
      const list = await getList(type);
      const filtered = list.filter((item) => !matches(item, body));
      await saveList(type, filtered);
      return res.status(200).json({ ok: true, deleted: list.length - filtered.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("my-number error:", e);
    // Never 500 with empty body - always return arrays so page shows Retry / 0 instead of crashing
    return res.status(200).json({ visitors: [], users: [], reviews: [], error: String(e.message || e) });
  }
}

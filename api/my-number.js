// api/my-number.js
// No npm package needed - uses Upstash REST with fetch
// NEVER returns 500 - returns empty arrays if Upstash is missing

const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_TOKEN;

const KEYS = {
  visitors: "my-number:visitors",
  users: "my-number:users",
  reviews: "my-number:reviews",
};

// --- Upstash helpers using fetch ---
async function upstash(command, ...args) {
  if (!URL || !TOKEN) return null;
  try {
    const res = await fetch(`${URL}/${command}/${args.map(a => encodeURIComponent(String(a))).join("/")}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const j = await res.json().catch(() => ({}));
    return j.result ?? null;
  } catch (e) {
    console.error("upstash error", e);
    return null;
  }
}

async function getList(key) {
  const raw = await upstash("GET", key);
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setList(key, arr) {
  if (!URL || !TOKEN) return;
  await fetch(`${URL}/SET/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(arr))}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).catch(() => {});
}

export default async function handler(req, res) {
  // Allow CORS for safety
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET: Dashboard loads this ----------
    if (req.method === "GET") {
      const [visitors, users, reviews] = await Promise.all([
        getList(KEYS.visitors),
        getList(KEYS.users),
        getList(KEYS.reviews),
      ]);
      // ALWAYS 200, never 500 - even if Upstash is down
      return res.status(200).json({ visitors, users, reviews });
    }

    // ---------- POST: Footer review + Visitor tracking + User signup ----------
    // Footer sends: { name, email, rating, comment }
    // Visitor sends: { city, country, device } or { type: "visitor", ... }
    // User sends: { type: "user", name, email }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

      // 1) REVIEW - this is what you want to show
      if (body.comment || body.rating) {
        const reviews = await getList(KEYS.reviews);
        const newReview = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          name: body.name || "Anonymous",
          email: body.email || "",
          rating: Number(body.rating) || 5,
          comment: body.comment || "",
          createdAt: new Date().toISOString(),
        };
        reviews.unshift(newReview);
        await setList(KEYS.reviews, reviews);
        return res.status(200).json({ ok: true, review: newReview });
      }

      // 2) USER
      if (body.type === "user" || (body.name && body.email && !body.city)) {
        const users = await getList(KEYS.users);
        const newUser = {
          id: Date.now().toString(),
          name: body.name,
          email: body.email,
          createdAt: new Date().toISOString(),
        };
        // avoid duplicate emails
        if (!users.some(u => u.email === newUser.email)) {
          users.unshift(newUser);
          await setList(KEYS.users, users);
        }
        return res.status(200).json({ ok: true });
      }

      // 3) VISITOR (default)
      const visitors = await getList(KEYS.visitors);
      const newVisitor = {
        id: Date.now().toString(),
        city: body.city || "Unknown",
        country: body.country || "Unknown",
        device: body.device || "Other",
        time: new Date().toISOString(),
      };
      visitors.unshift(newVisitor);
      // keep last 500 only
      await setList(KEYS.visitors, visitors.slice(0, 500));
      return res.status(200).json({ ok: true });
    }

    // ---------- DELETE: Dashboard delete button ----------
    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const type = body.type; // "visitors" | "users" | "reviews"
      if (!type || !KEYS[type]) return res.status(200).json({ ok: false, error: "bad type" });

      const list = await getList(KEYS[type]);
      const filtered = list.filter((x) => {
        if (body.id && x.id) return x.id !== body.id;
        if (type === "reviews") return !(x.createdAt === body.createdAt && x.email === body.email && x.comment === body.comment);
        if (type === "users") return !(x.createdAt === body.createdAt && x.email === body.email);
        return !(x.time === body.createdAt && x.city === body.city);
      });
      await setList(KEYS[type], filtered);
      return res.status(200).json({ ok: true, deleted: list.length - filtered.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("my-number api error", e);
    // STILL return 200 with empty data so dashboard never shows 500
    return res.status(200).json({ visitors: [], users: [], reviews: [], warning: e.message });
  }
}

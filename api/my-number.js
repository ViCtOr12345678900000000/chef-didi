const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const VALID_TYPES = ["visitors", "users", "reviews"];

async function redis(cmd, ...args) {
  if (!URL || !TOKEN) {
    throw new Error("Upstash environment variables are missing.");
  }
  const baseURL = URL.replace(/\/$/, "");
  const endpoint = `${baseURL}/${cmd}/${args.map((arg) => encodeURIComponent(String(arg))).join("/")}`;
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || "Redis request failed.");
  }
  return json.result;
}

async function getList(key) {
  try {
    const rawList = await redis("LRANGE", key, "0", "-1");
    if (Array.isArray(rawList) && rawList.length > 0) {
      const out = [];
      for (const item of rawList) {
        try {
          if (typeof item === "object" && item !== null) { out.push(item); continue; }
          let s = String(item);
          if (s.startsWith("%7B") || s.startsWith("%7b")) {
            try { s = decodeURIComponent(s); } catch {}
          }
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) out.push(...parsed);
          else if (parsed && typeof parsed === "object") out.push(parsed);
        } catch (e) {
          console.error("Skipped bad entry in", key, String(item).slice(0, 100));
        }
      }
      return out;
    }
  } catch {}

  try {
    const raw = await redis("GET", key);
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAsRedisList(key, list) {
  await redis("DEL", key);
  for (const item of list) {
    await redis("RPUSH", key, JSON.stringify(item));
  }
}

const sortNewestFirst = (a, b) =>
  new Date(b.time || b.createdAt || 0) - new Date(a.time || a.createdAt || 0);

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      const [visitors, allUsers, reviews] = await Promise.all([
        getList("visitors"),
        getList("users"),
        getList("reviews"),
      ]);

      const visibleUsers = allUsers.filter((u) => !u.deletedFromAdmin);
      const hiddenUsersCount = allUsers.length - visibleUsers.length;

      return res.status(200).json({
        visitors: visitors.sort(sortNewestFirst),
        users: visibleUsers.sort(sortNewestFirst),
        reviews: reviews.sort(sortNewestFirst),
        totalRegisteredInUpstash: allUsers.length,
        hiddenUsersCount,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};

      if (body.action === "restore-users") {
        const allUsers = await getList("users");
        const restored = allUsers.map((u) => ({ ...u, deletedFromAdmin: false }));
        await saveAsRedisList("users", restored);
        return res.status(200).json({ ok: true, restoredCount: restored.length });
      }

      let type = body.type;
      if (!type) {
        if (body.comment) type = "reviews";
        else if (body.email && body.name) type = "users";
        else type = "visitors";
      }

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid record type." });
      }

      const list = await getList(type);
      const now = new Date().toISOString();

      const entry = {
        ...body,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
        createdAt: body.createdAt || body.time || now,
        time: body.time || body.createdAt || now,
      };

      delete entry.type;
      list.unshift(entry);
      await saveAsRedisList(type, list.slice(0, 1000));

      return res.status(200).json({ ok: true, saved: entry });
    }

    if (req.method === "DELETE") {
      const body = req.body || {};
      const type = body.type || "reviews";

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid record type." });
      }

      const list = await getList(type);

      if (type === "users") {
        const cleanEmail = String(body.email || "").toLowerCase().trim();
        let found = false;

        const updated = list.map((u) => {
          if (
            (body.id && String(u.id) === String(body.id)) ||
            (cleanEmail && u.email?.toLowerCase().trim() === cleanEmail)
          ) {
            found = true;
            return { ...u, deletedFromAdmin: true };
          }
          return u;
        });

        if (!found) return res.status(404).json({ ok: false, error: "User not found." });
        await saveAsRedisList("users", updated);
        return res.status(200).json({ ok: true, hidden: 1 });
      }

      const filtered = list.filter((item) => {
        if (body.id) return String(item.id) !== String(body.id);
        if (type === "reviews") {
          return !(item.createdAt === body.createdAt && item.comment === body.comment);
        }
        return !(item.time === body.time && item.city === body.city);
      });

      const deleted = list.length - filtered.length;
      if (deleted === 0) {
        return res.status(404).json({ ok: false, error: "Record not found." });
      }

      await saveAsRedisList(type, filtered);
      return res.status(200).json({ ok: true, deleted });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong.", details: error.message });
  }
}

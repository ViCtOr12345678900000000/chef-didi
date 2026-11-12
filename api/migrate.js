const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const VALID_TYPES = ["visitors", "users", "reviews"];

async function redis(cmd, ...args) {
  if (!URL || !TOKEN) {
    throw new Error("Upstash environment variables are missing.");
  }
  const baseURL = URL.replace(/\/$/, "");
  const endpoint = `${baseURL}/${cmd}/${args.map(arg => encodeURIComponent(String(arg))).join("/")}`;

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
    if (Array.isArray(rawList)) {
      const parsedItems = [];
      for (const item of rawList) {
        try {
          let s = typeof item === "string" ? item : JSON.stringify(item);
          try { s = decodeURIComponent(s); } catch {}
          try { s = decodeURIComponent(s); } catch {}
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) parsedItems.push(...parsed);
          else parsedItems.push(parsed);
        } catch {
          parsedItems.push(item);
        }
      }
      return parsedItems;
    }
  } catch {}

  try {
    const raw = await redis("GET", key);
    if (!raw) return [];
    let s = typeof raw === "string" ? raw : JSON.stringify(raw);
    try { s = decodeURIComponent(s); } catch {}
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveList(key, list) {
  // For 'users', always maintain a Redis List so login.js & migrate.js stay compatible
  if (key === "users") {
    await redis("DEL", "users");
    for (const item of list) {
      await redis("RPUSH", "users", JSON.stringify(item));
    }
    return true;
  }
  return redis("SET", key, JSON.stringify(list));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const [visitors, rawUsers, reviews] = await Promise.all([
        getList("visitors"),
        getList("users"),
        getList("reviews"),
      ]);

      // Only show users not soft-deleted from the dashboard, plus count total in Upstash
      const activeUsers = rawUsers.filter(u => !u?.deletedFromAdmin);
      const hiddenUsersCount = rawUsers.length - activeUsers.length;

      return res.status(200).json({
        visitors,
        users: activeUsers,
        totalRegisteredInUpstash: rawUsers.length,
        hiddenUsersCount,
        reviews,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};

      // Restore all accidentally deleted registered users from Upstash back to AdminDashboard
      if (body.action === "restore-users") {
        const rawUsers = await getList("users");
        const restored = rawUsers.map(u => ({ ...u, deletedFromAdmin: false }));
        await saveList("users", restored);
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
      await saveList(type, list.slice(0, 1000));

      return res.status(200).json({ ok: true, saved: entry });
    }

    if (req.method === "DELETE") {
      const body = req.body || {};
      const type = body.type || "reviews";

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid record type." });
      }

      const list = await getList(type);

      // Soft-delete users so they remain safely stored in Upstash
      if (type === "users") {
        let updated = false;
        const softDeletedList = list.map(item => {
          const isMatch = (body.id && String(item.id) === String(body.id)) || (body.email && item.email === body.email);
          if (isMatch) {
            updated = true;
            return { ...item, deletedFromAdmin: true };
          }
          return item;
        });

        if (!updated) return res.status(404).json({ ok: false, error: "User not found." });
        await saveList("users", softDeletedList);
        return res.status(200).json({ ok: true, softDeleted: true });
      }

      const filtered = list.filter(item => {
        if (body.id) return String(item.id) !== String(body.id);
        if (type === "reviews") return !(item.createdAt === body.createdAt && item.comment === body.comment);
        return !(item.time === body.time && item.city === body.city);
      });

      const deleted = list.length - filtered.length;
      if (deleted === 0) return res.status(404).json({ ok: false, error: "Record not found." });

      await saveList(type, filtered);
      return res.status(200).json({ ok: true, deleted });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong.", details: error.message });
  }
}

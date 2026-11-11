// pages/api/my-number.js
// Chef Didi - Upstash REST API
// Keys: visitors / users / reviews

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const VALID_TYPES = ["visitors", "users", "reviews"];

async function redis(cmd, ...args) {
  if (!URL || !TOKEN) {
    throw new Error("Upstash environment variables are missing.");
  }

  const baseURL = URL.replace(/\/$/, "");

  const endpoint = `${baseURL}/${cmd}/${args
    .map(arg => encodeURIComponent(String(arg)))
    .join("/")}`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || "Redis request failed.");
  }

  return json.result;
}

async function getList(key) {
  const raw = await redis("GET", key);

  if (!raw) return [];

  const parsed =
    typeof raw === "string" ? JSON.parse(raw) : raw;

  return Array.isArray(parsed) ? parsed : [];
}

async function saveList(key, list) {
  return redis("SET", key, JSON.stringify(list));
}

export default async function handler(req, res) {

  // ---------- OPTIONS ----------

  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,DELETE,OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    return res.status(200).end();
  }

  try {

    // ---------- GET ----------

    if (req.method === "GET") {

      const [visitors, users, reviews] = await Promise.all([
        getList("visitors"),
        getList("users"),
        getList("reviews"),
      ]);

      return res.status(200).json({
        visitors,
        users,
        reviews,
      });
    }

    // ---------- POST ----------

    if (req.method === "POST") {

      const body = req.body || {};

      let type = body.type;

      if (!type) {
        if (body.comment) {
          type = "reviews";
        } else if (body.email && body.name) {
          type = "users";
        } else {
          type = "visitors";
        }
      }

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          error: "Invalid record type.",
        });
      }

      const list = await getList(type);

      const now = new Date().toISOString();

      const entry = {
        ...body,

        id:
          Date.now().toString() +
          Math.random().toString(36).slice(2, 10),

        createdAt: body.createdAt || body.time || now,

        time: body.time || body.createdAt || now,
      };

      delete entry.type;

      list.unshift(entry);

      await saveList(type, list.slice(0, 1000));

      return res.status(200).json({
        ok: true,
        saved: entry,
      });
    }

    // ---------- DELETE ----------

    if (req.method === "DELETE") {

      const body = req.body || {};

      const type = body.type || "reviews";

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          error: "Invalid record type.",
        });
      }

      const list = await getList(type);

      if (!body.id) {

        // Legacy records without IDs require identifying fields.

        if (type === "reviews") {
          if (
            !body.createdAt ||
            !body.comment
          ) {
            return res.status(400).json({
              error: "Insufficient information to identify review.",
            });
          }
        }

        if (type === "users") {
          if (!body.createdAt || !body.email) {
            return res.status(400).json({
              error: "Insufficient information to identify user.",
            });
          }
        }

        if (type === "visitors") {
          if (!body.time || !body.city) {
            return res.status(400).json({
              error: "Insufficient information to identify visitor.",
            });
          }
        }
      }

      const filtered = list.filter(item => {

        // Preferred method: unique ID.

        if (body.id) {
          return String(item.id) !== String(body.id);
        }

        // Fallback for old records.

        if (type === "reviews") {
          return !(
            item.createdAt === body.createdAt &&
            item.comment === body.comment &&
            (body.email == null || item.email === body.email)
          );
        }

        if (type === "users") {
          return !(
            item.createdAt === body.createdAt &&
            item.email === body.email
          );
        }

        return !(
          item.time === body.time &&
          item.city === body.city &&
          (body.device == null || item.device === body.device) &&
          (body.country == null || item.country === body.country)
        );
      });

      const deleted = list.length - filtered.length;

      if (deleted === 0) {
        return res.status(404).json({
          ok: false,
          error: "Record not found.",
        });
      }

      await saveList(type, filtered);

      return res.status(200).json({
        ok: true,
        deleted,
      });
    }

    return res.status(405).json({
      error: "Method not allowed.",
    });

  } catch (error) {

    console.error("my-number API error:", error);

    return res.status(500).json({
      error: "Something went wrong.",
      details: error.message,
    });
  }
}

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const type = req.query.type || req.body?.type;
  if (type !== "quests") return res.status(400).json({ error: "unknown type" });

  try {
    if (req.method === "GET") {
      const location = req.query.location || "lagos";
      const keys = await redis.keys(`didi:quest:*:${location}`);
      const counts = {};
      for (const k of keys) {
        const questId = k.split(":")[2];
        const v = await redis.get(k);
        counts[questId] = Number(v) || 0;
      }

      const joinKeys = await redis.keys(`didi:quest_join:*:${location}`);
      const joined = {};
      for (const k of joinKeys) {
        const questId = k.split(":")[2];
        const v = await redis.get(k);
        joined[questId] = Number(v) || 0;
      }
      return res.status(200).json({ counts, joined });
    }

    if (req.method === "POST") {
      const { action = "complete", questId, location = "lagos", email = "guest" } = req.body || {};
      if (!questId) return res.status(400).json({ error: "questId required" });

      if (action === "join") {
        const joinKey = `didi:quest_join:${questId}:${location}`;
        const joinedTotal = await redis.incr(joinKey);
        const userKey = `didi:user_quests:${email.toLowerCase()}`;
        const existing = (await redis.get(userKey)) || [];
        const arr = Array.isArray(existing) ? existing : [];
        if (!arr.find(q => q.id === questId)) {
          arr.push({ id: questId, progress: 0, total: 2, completed: false, joinedAt: new Date().toISOString() });
          await redis.set(userKey, arr);
        }
        return res.status(200).json({ ok: true, joinedTotal });
      }

      const key = `didi:quest:${questId}:${location}`;
      const total = await redis.incr(key);
      return res.status(200).json({ ok: true, totalCompletions: total });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

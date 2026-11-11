export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  // GET /api/quests?location=lagos -> leaderboard counts
  if (req.method === 'GET') {
    const location = String(req.query.location || 'lagos').toLowerCase().trim();
    const questIds = ["jollof-week", "zero-waste-3", "no-spend-sunday", "pantry-pro", "soup-sunday"];
    const counts = {};
    for (const id of questIds) {
      try {
        const r = await fetch(`${url}/get/quest:${location}:${id}`, { headers });
        const j = await r.json();
        counts[id] = j.result ? parseInt(j.result) : 0;
      } catch { counts[id] = 0; }
    }
    return res.status(200).json({ location, counts });
  }

  // POST { questId, location, email } -> someone completed a quest, increment counter
  if (req.method === 'POST') {
    const { questId, location, email } = req.body || {};
    if (!questId) return res.status(400).json({ error: 'questId required' });
    const loc = String(location || 'lagos').toLowerCase().trim();
    const key = `quest:${loc}:${questId}`;
    try {
      const r = await fetch(`${url}/incr/${key}`, { headers });
      const j = await r.json();
      return res.status(200).json({ ok: true, questId, location: loc, totalCompletions: j.result });
    } catch {
      return res.status(500).json({ error: 'Failed to record quest' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

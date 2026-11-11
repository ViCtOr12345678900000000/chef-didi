export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };
  const type = String(req.query.type || "").toLowerCase();

  // ---------- MARKET PRICES ----------
  if (type === "market-prices") {
    if (req.method === 'GET') {
      const location = String(req.query.location || 'lagos').toLowerCase().trim();
      const items = ["rice","chicken","tomato","pepper","onion","yam","beans","plantain","eggs","beef","oil","garri","egusi","crayfish","palm oil","maggi","stockfish","ugu","potato","butter"];
      const prices = {}; const counts = {};
      for (const item of items) {
        try {
          const r = await fetch(`${url}/get/market:${location}:${item}`, { headers });
          const j = await r.json();
          if (j.result) {
            let arr = JSON.parse(decodeURIComponent(j.result));
            if (Array.isArray(arr) && arr.length) {
              const sorted = [...arr].sort((a,b) => a-b);
              const median = sorted[Math.floor(sorted.length / 2)];
              const filtered = arr.filter(p => p > median * 0.4 && p < median * 2.5);
              const avg = Math.round(filtered.reduce((s,v) => s+v, 0) / filtered.length);
              prices[item] = avg; counts[item] = filtered.length;
            }
          }
        } catch {}
      }
      return res.status(200).json({ location, prices, counts });
    }
    if (req.method === 'POST') {
      const { location, item, price } = req.body || {};
      if (!location || !item || !price) return res.status(400).json({ error: 'location + item + price required' });
      const loc = String(location).toLowerCase().trim();
      const keyItem = String(item).toLowerCase().trim();
      const p = parseInt(price);
      if (!p || p < 10 || p > 500000) return res.status(400).json({ error: 'Invalid price' });
      const redisKey = `market:${loc}:${keyItem}`;
      try {
        const r = await fetch(`${url}/get/${redisKey}`, { headers });
        const j = await r.json();
        let arr = [];
        if (j.result) { try { arr = JSON.parse(decodeURIComponent(j.result)); } catch { arr = []; } }
        if (!Array.isArray(arr)) arr = [];
        arr.push(p); if (arr.length > 100) arr = arr.slice(-100);
        await fetch(`${url}/set/${redisKey}/${encodeURIComponent(JSON.stringify(arr))}`, { headers });
        const avg = Math.round(arr.reduce((s,v) => s+v, 0) / arr.length);
        return res.status(200).json({ ok: true, item: keyItem, location: loc, average: avg, reports: arr.length });
      } catch { return res.status(500).json({ error: 'Failed to save price' }); }
    }
  }

  // ---------- QUESTS ----------
  if (type === "quests") {
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
    if (req.method === 'POST') {
      const { questId, location } = req.body || {};
      if (!questId) return res.status(400).json({ error: 'questId required' });
      const loc = String(location || 'lagos').toLowerCase().trim();
      const key = `quest:${loc}:${questId}`;
      try {
        const r = await fetch(`${url}/incr/${key}`, { headers });
        const j = await r.json();
        return res.status(200).json({ ok: true, questId, location: loc, totalCompletions: j.result });
      } catch { return res.status(500).json({ error: 'Failed to record quest' }); }
    }
  }

  return res.status(400).json({ error: 'Missing ?type=market-prices or ?type=quests' });
}

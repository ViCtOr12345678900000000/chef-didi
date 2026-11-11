export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  if (req.method === 'GET') {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'email required' });
    const r = await fetch(`${url}/get/profile:${email}`, { headers });
    const j = await r.json();
    if (!j.result) return res.status(200).json({ data: null });
    try {
      let s = j.result;
      try { s = decodeURIComponent(s); } catch {}
      try { s = decodeURIComponent(s); } catch {}
      return res.status(200).json({ data: JSON.parse(s) });
    } catch { return res.status(200).json({ data: null }); }
  }

  if (req.method === 'POST') {
    const { email, data } = req.body || {};
    if (!email || !data) return res.status(400).json({ error: 'email + data required' });
    const clean = String(email).toLowerCase().trim();
    await fetch(`${url}/set/profile:${clean}/${encodeURIComponent(JSON.stringify(data))}`, { headers });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

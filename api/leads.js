// api/leads.js
export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Upstash not connected' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  if (req.method === 'GET') {
    const r = await fetch(`${url}/lrange/didi_leads/0/99`, { headers });
    const data = await r.json();
    const leads = (data.result || []).map((s) => { try { return JSON.parse(s); } catch { return { raw: s }; } });
    return res.status(200).json({ leads });
  }

  if (req.method === 'POST') {
    const { name, brand, want, budget, contact, about } = req.body || {};
    if (!name || !brand || !want || !contact) return res.status(400).json({ error: 'Missing fields' });
    const lead = { name, brand, want, budget: budget || '', contact, about: about || '', at: new Date().toISOString() };
    await fetch(`${url}/lpush/didi_leads/${encodeURIComponent(JSON.stringify(lead))}`, { headers });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

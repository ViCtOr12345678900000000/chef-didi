export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  const rawList = data.result || [];

  let allUsers = [];
  for (const item of rawList) {
    try {
      let s = typeof item === 'string' ? item : JSON.stringify(item);
      try { s = decodeURIComponent(s); } catch {}
      try { s = decodeURIComponent(s); } catch {}
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) allUsers.push(...parsed);
      else allUsers.push(parsed);
    } catch {}
  }

  const cleanEmail = email.toLowerCase().trim();
  const found = allUsers.find(u => u?.email?.toLowerCase().trim() === cleanEmail);
  if (!found) return res.status(404).json({ ok: false, error: 'No account with this email. Please register first.' });
  if (found.password !== password) return res.status(401).json({ ok: false, error: 'Wrong password. Try again.' });

  const { password: _, ...safe } = found;
  return res.status(200).json({ ok: true, user: safe });
}

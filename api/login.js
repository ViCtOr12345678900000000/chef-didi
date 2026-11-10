export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const r = await fetch(`${url}/lrange/users/0/-1`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  const rawList = data.result || [];

  // Handle both formats: single user per item AND old giant-array item
  let allUsers = [];
  for (const item of rawList) {
    try {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) allUsers.push(...parsed);
      else allUsers.push(parsed);
    } catch {}
  }

  const found = allUsers.find(u => u?.email?.toLowerCase() === email?.toLowerCase());
  if (!found) return res.status(404).json({ error: 'No account' });
  if (found.password !== password) return res.status(401).json({ error: 'Wrong password' });

  const { password: _, ...safe } = found;
  return res.status(200).json({ user: safe });
}

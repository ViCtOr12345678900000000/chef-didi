export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { users } = req.body || {};
  if (!Array.isArray(users)) return res.status(400).json({ error: 'users must be array' });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  for (const u of users) {
    if (!u?.email) continue;
    const email = u.email.toLowerCase().trim();
    // Save each user individually, not as one giant array
    await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify({ ...u, email }))}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetch(`${url}/set/migrated:${encodeURIComponent(email)}/1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  return res.status(200).json({ ok: true });
}

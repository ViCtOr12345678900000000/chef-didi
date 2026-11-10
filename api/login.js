export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };
  const { email, password } = req.body;
  const clean = email.trim().toLowerCase();

  // Get all users, find this one
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers }).then(r => r.json());
  const users = (r.result || []).map(u => { try { return JSON.parse(u); } catch { return null; } }).filter(Boolean);
  const found = users.find(u => u.email === clean);
  if (!found) return res.status(404).json({ ok: false, error: "No account with this email. Please register first." });
  if (found.password !== password) return res.status(401).json({ ok: false, error: "Wrong password. Try again." });
  return res.status(200).json({ ok: true, user: { name: found.name, email: found.email, prefs: found.prefs || {} } });
}

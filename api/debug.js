export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(200).json({ error: "NO ENV VARS", hasUrl: !!url, hasToken: !!token });

  const r = await fetch(`${url}/lrange/users/0/-1`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  const raw = data.result || [];
  const emails = raw.map((item) => {
    try {
      const p = typeof item === 'string' ? JSON.parse(item) : item;
      if (Array.isArray(p)) return p.map(x => x.email);
      return p.email;
    } catch {
      return "UNPARSEABLE: " + String(item).slice(0, 100);
    }
  });
  return res.status(200).json({ countItems: raw.length, emails, rawLength: raw[0]?.length || 0 });
}

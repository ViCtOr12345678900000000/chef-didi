export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  await fetch(`${url}/incr/total_visitors`, { headers });

  const ua = req.headers['user-agent'] || '';
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop';
  // Vercel gives us city/country for free
  const city = decodeURIComponent(req.headers['x-vercel-ip-city'] || 'Unknown');
  const country = req.headers['x-vercel-ip-country'] || '';

  const visit = JSON.stringify({ city, country, device, time: new Date().toISOString() });
  await fetch(`${url}/rpush/visitors/${encodeURIComponent(visit)}`, { headers });

  return res.status(200).json({ ok: true });
}

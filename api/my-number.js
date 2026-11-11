export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  const get = async (path) => {
    const r = await fetch(`${url}/${path}`, { headers });
    const j = await r.json();
    return j.result;
  };

  // 1. Total visitors - MyNumber expects "count"
  const totalRaw = await get('get/total_visitors');
  const count = parseInt(totalRaw || '0', 10);

  // 2. Visitors - MyNumber expects [{city, country, device, time}]
  const visitorsRaw = await get('lrange/visitors/0/-1') || [];
  let visitors = [];
  for (const item of visitorsRaw) {
    try {
      const p = typeof item === 'string' ? JSON.parse(item) : item;
      if (Array.isArray(p)) visitors.push(...p);
      else visitors.push(p);
    } catch { visitors.push(item); }
  }
  // Normalize old visits (at/ip/ua) to new shape (time/city/country/device)
  visitors = visitors.map((v) => {
    if (typeof v === 'string') return { city: 'Unknown', country: '', device: 'Unknown', time: new Date().toISOString() };
    return {
      city: v.city || 'Unknown',
      country: v.country || '',
      device: v.device || (v.ua?.includes('Mobile') ? 'Mobile' : v.ua ? 'Desktop' : 'Unknown'),
      time: v.time || v.at || new Date().toISOString(),
    };
  }).reverse(); // newest first

  // 3. Users - dedupe + hide passwords
  const usersRaw = await get('lrange/users/0/-1') || [];
  let users = [];
  for (const item of usersRaw) {
    try {
      const p = typeof item === 'string' ? JSON.parse(item) : item;
      if (Array.isArray(p)) users.push(...p);
      else users.push(p);
    } catch {}
  }
  const seen = new Set();
  const cleanUsers = [];
  for (const u of users) {
    if (!u?.email) continue;
    const email = u.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const { password, ...safe } = u;
    cleanUsers.push({ ...safe, createdAt: safe.createdAt || new Date().toISOString() });
  }

  return res.status(200).json({ count, totalVisitors: count, visitors, users: cleanUsers });
};

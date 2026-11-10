export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  const get = async (path) => {
    const r = await fetch(`${url}/${path}`, { headers });
    const j = await r.json();
    return j.result;
  };

  // 1. Total visitors
  const totalRaw = await get('get/total_visitors');
  const totalVisitors = parseInt(totalRaw || '0', 10);

  // 2. Visitors list - flatten in case it's stored as one giant array string
  const visitorsRaw = await get('lrange/visitors/0/-1') || [];
  let visitors = [];
  for (const item of visitorsRaw) {
    try {
      const p = JSON.parse(item);
      if (Array.isArray(p)) visitors.push(...p);
      else visitors.push(p);
    } catch { visitors.push(item); }
  }

  // 3. Users list - same fix, plus dedupe by email
  const usersRaw = await get('lrange/users/0/-1') || [];
  let users = [];
  for (const item of usersRaw) {
    try {
      const p = JSON.parse(item);
      if (Array.isArray(p)) users.push(...p);
      else users.push(p);
    } catch {}
  }
  // Remove duplicates and hide passwords
  const seen = new Set();
  const cleanUsers = [];
  for (const u of users) {
    if (!u?.email) continue;
    const email = u.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const { password, ...safe } = u;
    cleanUsers.push(safe);
  }

  return res.status(200).json({
    totalVisitors,
    visitors,
    users: cleanUsers
  });
};

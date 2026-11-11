export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  const get = async (path) => {
    const r = await fetch(`${url}/${path}`, { headers });
    const j = await r.json();
    return j.result;
  };

  const parseItem = (item) => {
    try {
      let s = typeof item === 'string' ? item : JSON.stringify(item);
      try { s = decodeURIComponent(s); } catch {}
      try { s = decodeURIComponent(s); } catch {}
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [p];
    } catch { return []; }
  };

  // --- VISITORS ---
  const totalRaw = await get('get/total_visitors');
  const count = parseInt(totalRaw || '0', 10);

  const visitorsRaw = await get('lrange/visitors/0/-1') || [];
  let visitors = [];
  for (const item of visitorsRaw) visitors.push(...parseItem(item));
  visitors = visitors.map((v) => ({
    city: v.city || 'Unknown',
    country: v.country || '',
    device: v.device || (v.ua?.includes('Mobile') ? 'Mobile' : 'Unknown'),
    time: v.time || v.at || new Date().toISOString(),
  })).reverse();

  // --- USERS ---
  const usersRaw = await get('lrange/users/0/-1') || [];
  let users = [];
  for (const item of usersRaw) users.push(...parseItem(item));
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

  // --- REVIEWS (NEW) - from ReviewBox in footer ---
  // ReviewBox saves to "didi:reviews" via /api/community?type=reviews
  // We try both keys so old + new reviews both show
  let reviewsRaw = await get('lrange/didi:reviews/0/-1') || [];
  if (!reviewsRaw.length) {
    reviewsRaw = await get('lrange/reviews/0/-1') || [];
  }
  let reviews = [];
  for (const item of reviewsRaw) reviews.push(...parseItem(item));
  reviews = reviews.map((r) => ({
    name: r.name || 'Anonymous',
    rating: r.rating || 5,
    comment: r.comment || r.text || '',
    email: r.email || 'guest',
    createdAt: r.createdAt || r.time || new Date().toISOString(),
  })).reverse();

  return res.status(200).json({
    count,
    totalVisitors: count,
    visitors,
    users: cleanUsers,
    reviews, // <-- MyNumber.jsx reads this
    reviewsCount: reviews.length,
  });
};

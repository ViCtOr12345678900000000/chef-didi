import { getLivePrices } from '../lib/gemini-prices.js'; 

export default async function handler(req, res) {
  // ===== NEW JOB: Get Current Price button =====
  // Uses debug.js so we stay at 12 api files - no new file needed
  // Called from Testing.jsx as: /api/debug?action=prices-refresh
  if (req.query.action === 'prices-refresh' && req.method === 'POST') {
    try {
      const data = await getLivePrices();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ===== YOUR OLD DEBUG.JS - UNCHANGED BELOW =====
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(200).json({ error: "NO ENV VARS", hasUrl: !!url, hasToken: !!token });
  const headers = { Authorization: `Bearer ${token}` };

  const parseOne = (item) => {
    try {
      let s = typeof item === "string" ? item : JSON.stringify(item);
      try { s = decodeURIComponent(s); } catch {}
      try { s = decodeURIComponent(s); } catch {}
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
      return p;
    } catch {
      return null;
    }
  };

  const readUsers = async () => {
    const r = await fetch(`${url}/lrange/users/0/-1`, { headers });
    const data = await r.json();
    const raw = data.result || [];
    let users = [];
    for (const item of raw) {
      const parsed = parseOne(item);
      if (Array.isArray(parsed)) users.push(...parsed);
      else if (parsed) users.push(parsed);
    }
    return { raw, users };
  };

  const saveUsers = async (users) => {
    await fetch(`${url}/del/users`, { headers });
    for (const u of users) {
      await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
    }
  };

  let { raw, users } = await readUsers();

  // Restore: /api/debug?restore=email@gmail.com
  if (req.query.restore) {
    const email = String(req.query.restore).toLowerCase().trim();
    users = users.map((u) => u.email?.toLowerCase().trim() === email ? { ...u, deletedFromAdmin: false } : u);
    await saveUsers(users);
    return res.status(200).json({ ok: true, message: `Restored ${email}` });
  }

  // Hide: /api/debug?hide=email@gmail.com
  if (req.query.hide) {
    const email = String(req.query.hide).toLowerCase().trim();
    users = users.map((u) => u.email?.toLowerCase().trim() === email ? { ...u, deletedFromAdmin: true } : u);
    await saveUsers(users);
    return res.status(200).json({ ok: true, message: `Hidden ${email}` });
  }

  // Your original debug output - kept
  const emails = users.map((u) => u.email);
  const totalRegisteredInUpstash = users.length;
  const hiddenUsers = users.filter((u) => u.deletedFromAdmin);
  const visibleUsers = users.filter((u) => !u.deletedFromAdmin);

  // Never send passwords to frontend
  const safe = (list) => list.map((u) => {
    const { password, securityAnswerHash, ...rest } = u;
    return rest;
  });

  return res.status(200).json({
    ok: true,
    countItems: raw.length,
    emails,
    rawLength: raw[0]?.length || 0,
    // New admin fields
    totalRegisteredInUpstash,
    hiddenUsersCount: hiddenUsers.length,
    visibleCount: visibleUsers.length,
    users: safe(visibleUsers),
    hiddenUsers: safe(hiddenUsers),
  });
}

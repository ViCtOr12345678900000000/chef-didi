// api/debug.js - SELF-CONTAINED, no import from lib/
async function getLivePrices() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (!apiKey) throw new Error('No GEMINI_KEY in Vercel - add GEMINI_API_KEY in Settings > Env Vars');

  const prompt = `
You are a Lagos market price researcher for Chef Didi.
Today is ${new Date().toISOString().slice(0,10)}.
Get MOST RECENT Lagos prices from foodprices.ng, Lagos Ministry of Agriculture, BusinessDay / Nairametrics / NAN, Ola of North Mile 12.
Return ONLY valid JSON:
{
  "updated": "13 Nov 2026",
  "source": "FoodPrices.ng + Mile 12 via Ola of North",
  "market": "Mile 12",
  "items": [
    { "id": "tomato", "name": "Tomato", "unit": "1kg", "price": 1650, "emoji": "🍅" },
    { "id": "rodo", "name": "Rodo Pepper", "unit": "1kg", "price": 1794, "emoji": "🌶️" },
    { "id": "tatashe", "name": "Tatashe", "unit": "1kg", "price": 2130, "emoji": "🫑" },
    { "id": "shombo", "name": "Shombo", "unit": "1kg", "price": 2000, "emoji": "🌶️" },
    { "id": "onion", "name": "Onion", "unit": "1kg", "price": 1728, "emoji": "🧅" },
    { "id": "rice_foreign", "name": "Foreign Rice", "unit": "1 derica", "price": 1100, "emoji": "🍚" },
    { "id": "rice_local", "name": "Local Rice", "unit": "1 derica", "price": 1000, "emoji": "🍚" },
    { "id": "garri_ijebu", "name": "Garri Ijebu", "unit": "1 paint", "price": 1200, "emoji": "🥣" },
    { "id": "yam", "name": "Yam (medium)", "unit": "1 tuber", "price": 2350, "emoji": "🍠" },
    { "id": "crayfish", "name": "Crayfish", "unit": "small plate", "price": 500, "emoji": "🦐" },
    { "id": "seasoning", "name": "Seasoning (2 cubes)", "unit": "pack", "price": 200, "emoji": "🧂" },
    { "id": "palm_oil", "name": "Palm Oil", "unit": "1 bottle 75cl", "price": 2800, "emoji": "🫙" }
  ],
  "notes": "Onion expensive this week",
  "confidence": "high"
}
Rules: If no price from last 14 days, set price to null. DO NOT INVENT. Retail / per-kg prices only.
`;

  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
  let lastError = '';
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      const data = await r.json();
      if (!r.ok) { lastError = data?.error?.message || `Google ${r.status} for ${model}`; continue; }
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) { lastError = `Empty from ${model}`; continue; }
      text = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!parsed.items) throw new Error('No items');
      return parsed;
    } catch (e) { lastError = e.message; continue; }
  }
  throw new Error(`Gemini failed: ${lastError}`);
}

export default async function handler(req, res) {
  // ===== Get Current Price =====
  if (req.query.action === 'prices-refresh' && req.method === 'POST') {
    try {
      const data = await getLivePrices();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ error: e.message, stack: String(e.stack || '').slice(0, 500) });
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
    } catch { return null; }
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

  if (req.query.restore) {
    const email = String(req.query.restore).toLowerCase().trim();
    users = users.map((u) => u.email?.toLowerCase().trim() === email ? { ...u, deletedFromAdmin: false } : u);
    await saveUsers(users);
    return res.status(200).json({ ok: true, message: `Restored ${email}` });
  }

  if (req.query.hide) {
    const email = String(req.query.hide).toLowerCase().trim();
    users = users.map((u) => u.email?.toLowerCase().trim() === email ? { ...u, deletedFromAdmin: true } : u);
    await saveUsers(users);
    return res.status(200).json({ ok: true, message: `Hidden ${email}` });
  }

  const emails = users.map((u) => u.email);
  const totalRegisteredInUpstash = users.length;
  const hiddenUsers = users.filter((u) => u.deletedFromAdmin);
  const visibleUsers = users.filter((u) => !u.deletedFromAdmin);
  const safe = (list) => list.map((u) => {
    const { password, securityAnswerHash, ...rest } = u;
    return rest;
  });

  return res.status(200).json({
    ok: true,
    countItems: raw.length,
    emails,
    rawLength: raw[0]?.length || 0,
    totalRegisteredInUpstash,
    hiddenUsersCount: hiddenUsers.length,
    visibleCount: visibleUsers.length,
    users: safe(visibleUsers),
    hiddenUsers: safe(hiddenUsers),
  });
}

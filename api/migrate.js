export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { users } = req.body || {};
  if (!Array.isArray(users)) return res.status(400).json({ error: "users must be array" });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  let existing = [];
  const existingRes = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const existingData = await existingRes.json();

  if (Array.isArray(existingData.result)) {
    for (const item of existingData.result) {
      try {
        let s = typeof item === "string" ? item : JSON.stringify(item);
        try { s = decodeURIComponent(s); } catch {}
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) existing.push(...parsed);
        else if (parsed) existing.push(parsed);
      } catch {}
    }
  } else {
    // Recover if key was previously a string
    const getRes = await fetch(`${url}/get/users`, { headers });
    const getData = await getRes.json();
    if (getData.result) {
      try {
        const parsed = JSON.parse(getData.result);
        if (Array.isArray(parsed)) existing = parsed;
      } catch {}
    }
    await fetch(`${url}/del/users`, { headers });
    for (const u of existing) {
      await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
    }
  }

  const existingEmails = new Set(existing.map(u => u.email?.toLowerCase().trim()));

  for (const u of users) {
    if (!u?.email) continue;
    const email = u.email.toLowerCase().trim();
    if (existingEmails.has(email)) continue;

    const record = {
      ...u,
      email,
      visitCount: u.visitCount || 1,
      deletedFromAdmin: false,
    };
    await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(record))}`, { headers });
    existingEmails.add(email);
  }

  return res.status(200).json({ ok: true });
}

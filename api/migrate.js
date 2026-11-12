export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { users } = req.body || {};
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: "users must be array" });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  const existingRes = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const existingData = await existingRes.json();
  const existing = (existingData.result || [])
    .map((item) => {
      try {
        let s = typeof item === "string" ? item : JSON.stringify(item);
        try { s = decodeURIComponent(s); } catch {}
        try { s = decodeURIComponent(s); } catch {}
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const existingEmails = new Set(existing.map((u) => u.email?.toLowerCase().trim()));

  for (const u of users) {
    if (!u?.email) continue;
    const email = u.email.toLowerCase().trim();
    if (existingEmails.has(email)) continue; // Do NOT overwrite password / security question

    await fetch(
      `${url}/rpush/users/${encodeURIComponent(
        JSON.stringify({ ...u, email, visitCount: u.visitCount || 0, deletedFromAdmin: false })
      )}`,
      { headers }
    );
    existingEmails.add(email);
  }

  return res.status(200).json({ ok: true });
}

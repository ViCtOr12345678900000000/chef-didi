import crypto from "crypto";

async function readAllUsers(url, headers) {
  let allUsers = [];

  // 1. Try LRANGE (Redis List)
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const data = await r.json();

  if (Array.isArray(data.result)) {
    for (const item of data.result) {
      try {
        let s = typeof item === "string" ? item : JSON.stringify(item);
        try { s = decodeURIComponent(s); } catch {}
        try { s = decodeURIComponent(s); } catch {}
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) allUsers.push(...parsed);
        else if (parsed && typeof parsed === "object") allUsers.push(parsed);
      } catch {}
    }
    return allUsers;
  }

  // 2. Fallback if key was overwritten as a JSON String
  const getRes = await fetch(`${url}/get/users`, { headers });
  const getData = await getRes.json();
  if (getData.result) {
    try {
      let s = typeof getData.result === "string" ? getData.result : JSON.stringify(getData.result);
      try { s = decodeURIComponent(s); } catch {}
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

async function saveAllUsersAsList(url, headers, users) {
  await fetch(`${url}/del/users`, { headers });
  for (const u of users) {
    await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email, password, localUser } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password required" });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  // Get or create the vid cookie so this user's future visits are tracked
  const cookieHeader = String(req.headers.cookie || "");
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)vid=(v_[a-f0-9]{10})/);
  const visitorHash = cookieMatch
    ? cookieMatch[1]
    : "v_" + crypto.createHash("sha256").update(`${email}-${Date.now()}`).digest("hex").slice(0, 10);

  res.setHeader(
    "Set-Cookie",
    `vid=${visitorHash}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
  );

  let allUsers = await readAllUsers(url, headers);
  const cleanEmail = email.toLowerCase().trim();

  // Find ALL entries for this email, not just the first one
  // This fixes the bug where an old duplicate with an old password blocked login
  const matches = allUsers.filter(
    (u) => u?.email?.toLowerCase().trim() === cleanEmail
  );

  // If account existed only in localStorage, auto-migrate it to Upstash
  if (matches.length === 0 && localUser && localUser.password === password) {
    const migratedUser = {
      ...localUser,
      email: cleanEmail,
      visitorHash,
      visitCount: (localUser.visitCount || 0) + 1,
      deletedFromAdmin: false,
      lastSeen: new Date().toISOString(),
    };
    allUsers.push(migratedUser);
    await saveAllUsersAsList(url, headers, allUsers);
    const { password: _, ...safe } = migratedUser;
    return res.status(200).json({ ok: true, user: safe });
  }

  if (matches.length === 0) {
    return res.status(404).json({ ok: false, error: "No account with this email. Please register first." });
  }

  // Try every duplicate — if ANY matches the password, log them in
  const found = matches.find((u) => u.password === password);

  if (!found) {
    return res.status(401).json({ ok: false, error: "Wrong password. Try again." });
  }

  // Every login = 1 return visit. Also restore if accidentally deleted from Admin.
  const updatedUser = {
    ...found,
    visitorHash,
    visitCount: (found.visitCount || 0) + 1,
    deletedFromAdmin: false,
    lastSeen: new Date().toISOString(),
  };

  // Clean up: keep only the matching entry, remove old duplicates for this email
  const cleaned = allUsers.filter(
    (u) => u?.email?.toLowerCase().trim() !== cleanEmail
  );
  cleaned.push(updatedUser);

  await saveAllUsersAsList(url, headers, cleaned);

  const { password: _, ...safe } = updatedUser;
  return res.status(200).json({ ok: true, user: safe });
}

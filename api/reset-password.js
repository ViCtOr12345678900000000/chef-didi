import crypto from "crypto";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const headers = { Authorization: `Bearer ${token}` };

async function getAllUsers() {
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const j = await r.json();
  const list = [];

  if (Array.isArray(j.result)) {
    for (const item of j.result) {
      try {
        let s = typeof item === "string" ? item : JSON.stringify(item);
        try { s = decodeURIComponent(s); } catch {}
        try { s = decodeURIComponent(s); } catch {}
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) list.push(...parsed);
        else if (parsed && typeof parsed === "object") list.push(parsed);
      } catch {}
    }
    return list;
  }

  // Fallback if users was stored as a JSON string
  const getRes = await fetch(`${url}/get/users`, { headers });
  const getData = await getRes.json();
  if (getData.result) {
    try {
      const parsed = JSON.parse(getData.result);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

async function saveAllUsers(users) {
  await fetch(`${url}/del/users`, { headers });
  for (const u of users) {
    await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
  }
}

export default async function handler(req, res) {
  try {
    // GET ?action=get-question / has-question
    if (req.method === "GET") {
      const email = String(req.query.email || "").toLowerCase().trim();
      const action = String(req.query.action || "");
      if (!email) return res.status(400).json({ error: "email required" });

      const users = await getAllUsers();
      const found = users.find(u => u.email?.toLowerCase().trim() === email);

      if (action === "has-question") {
        return res.status(200).json({ hasQuestion: !!found?.securityQuestion && !!found?.securityAnswerHash });
      }
      if (action === "get-question") {
        if (!found) return res.status(404).json({ error: "No account with this email." });
        if (!found.securityQuestion) {
          return res.status(400).json({ error: "No security question set. Please create a new account or contact Didi." });
        }
        return res.status(200).json({ question: found.securityQuestion });
      }
      return res.status(400).json({ error: "Unknown action" });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { action, email, question, answerHash, newPassword, localUser, name, password } = req.body || {};
    const clean = String(email || "").toLowerCase().trim();
    if (!clean) return res.status(400).json({ error: "email required" });

    // Grab or generate vid cookie so visits stay linked
    const cookieHeader = String(req.headers.cookie || "");
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)vid=(v_[a-f0-9]{10})/);
    const visitorHash = cookieMatch
      ? cookieMatch[1]
      : "v_" + crypto.createHash("sha256").update(`${clean}-${Date.now()}`).digest("hex").slice(0, 10);

    res.setHeader(
      "Set-Cookie",
      `vid=${visitorHash}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
    );

    const users = await getAllUsers();
    const idx = users.findIndex(u => u.email?.toLowerCase().trim() === clean);

    // Auto-migrate / restore missing local account into Upstash during set-question
    if (action === "set-question") {
      if (!question || !answerHash) return res.status(400).json({ error: "Question + answer required" });

      if (idx === -1) {
        const baseUser = localUser && typeof localUser === "object" ? localUser : {};
        const restoredAccount = {
          ...baseUser,
          email: clean,
          name: baseUser.name || name || clean.split("@")[0],
          password: baseUser.password || password || "",
          securityQuestion: question,
          securityAnswerHash: answerHash,
          visitorHash,
          visitCount: (baseUser.visitCount || 0) + 1,
          deletedFromAdmin: false,
          createdAt: baseUser.createdAt || new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        };
        users.push(restoredAccount);
        await saveAllUsers(users);
        return res.status(200).json({ ok: true, restored: true });
      }

      users[idx] = {
        ...users[idx],
        securityQuestion: question,
        securityAnswerHash: answerHash,
        visitorHash,
        deletedFromAdmin: false,
        lastSeen: new Date().toISOString(),
      };
      await saveAllUsers(users);
      return res.status(200).json({ ok: true });
    }

    if (idx === -1) return res.status(404).json({ error: "No account with this email." });

    if (action === "verify") {
      if (!answerHash) return res.status(400).json({ error: "Answer required" });
      if (users[idx].securityAnswerHash !== answerHash) return res.status(401).json({ error: "Wrong answer. Try again." });
      return res.status(200).json({ ok: true });
    }

    if (action === "reset") {
      if (!answerHash || !newPassword) return res.status(400).json({ error: "Answer + new password required" });
      if (users[idx].securityAnswerHash !== answerHash) return res.status(401).json({ error: "Wrong answer." });
      if (String(newPassword).length < 4) return res.status(400).json({ error: "Password must be at least 4 characters." });
      users[idx] = { ...users[idx], password: newPassword, deletedFromAdmin: false };
      await saveAllUsers(users);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

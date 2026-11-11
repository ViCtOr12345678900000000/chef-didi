const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const headers = { Authorization: `Bearer ${token}` };

async function getAllUsers() {
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const j = await r.json();
  return (j.result || []).map((item) => {
    try {
      let s = typeof item === 'string' ? item : JSON.stringify(item);
      try { s = decodeURIComponent(s); } catch {}
      try { s = decodeURIComponent(s); } catch {}
      return JSON.parse(s);
    } catch { return null; }
  }).filter(Boolean);
}

// Users list in Upstash is append-only, so to update password we
// rebuild the list. This is safe for a small app.
async function saveAllUsers(users) {
  await fetch(`${url}/del/users`, { headers });
  for (const u of users) {
    await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
  }
}

export default async function handler(req, res) {
  try {
    // GET ?action=get-question / has-question
    if (req.method === 'GET') {
      const email = String(req.query.email || '').toLowerCase().trim();
      const action = String(req.query.action || '');
      if (!email) return res.status(400).json({ error: 'email required' });
      const users = await getAllUsers();
      const found = users.find(u => u.email?.toLowerCase() === email);
      if (action === 'has-question') {
        return res.status(200).json({ hasQuestion: !!found?.securityQuestion && !!found?.securityAnswerHash });
      }
      if (action === 'get-question') {
        if (!found) return res.status(404).json({ error: 'No account with this email.' });
        if (!found.securityQuestion) return res.status(400).json({ error: 'No security question set. Please create a new account or contact Didi.' });
        return res.status(200).json({ question: found.securityQuestion });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { action, email, question, answerHash, newPassword } = req.body || {};
    const clean = String(email || '').toLowerCase().trim();
    if (!clean) return res.status(400).json({ error: 'email required' });
    const users = await getAllUsers();
    const idx = users.findIndex(u => u.email?.toLowerCase() === clean);
    if (idx === -1) return res.status(404).json({ error: 'No account with this email.' });

    if (action === 'set-question') {
      if (!question || !answerHash) return res.status(400).json({ error: 'Question + answer required' });
      users[idx] = { ...users[idx], securityQuestion: question, securityAnswerHash: answerHash };
      await saveAllUsers(users);
      return res.status(200).json({ ok: true });
    }

    if (action === 'verify') {
      if (!answerHash) return res.status(400).json({ error: 'Answer required' });
      if (users[idx].securityAnswerHash !== answerHash) return res.status(401).json({ error: 'Wrong answer. Try again.' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'reset') {
      if (!answerHash || !newPassword) return res.status(400).json({ error: 'Answer + new password required' });
      if (users[idx].securityAnswerHash !== answerHash) return res.status(401).json({ error: 'Wrong answer.' });
      if (String(newPassword).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });
      users[idx] = { ...users[idx], password: newPassword };
      await saveAllUsers(users);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

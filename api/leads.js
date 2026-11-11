// api/leads.js
export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (req.method === 'GET') {
    if (!url || !token) return res.status(500).json({ error: 'Upstash not connected' });
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const r = await fetch(`${url}/lrange/didi_leads/0/99`, { headers });
    const data = await r.json();
    const leads = (data.result || []).map((s) => { try { return JSON.parse(s); } catch { return { raw: s }; } });
    return res.status(200).json({ leads });
  }

  if (req.method === 'POST') {
    const { name, brand, want, budget, contact, about } = req.body || {};
    if (!name || !brand || !want || !contact) return res.status(400).json({ error: 'Missing fields' });

    const lead = { name, brand, want, budget: budget || '', contact, about: about || '', at: new Date().toISOString() };

    // 1. Save to Upstash
    if (url && token) {
      try {
        await fetch(`${url}/lpush/didi_leads/${encodeURIComponent(JSON.stringify(lead))}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      } catch {}
    }

    // 2. Send you email - SAME as Advertise.jsx
    // Needs RESEND_API_KEY in Vercel
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Chef Didi <onboarding@resend.dev>',
            to: process.env.EMAIL_TO || 'you@gmail.com', // <- put your email in Vercel as EMAIL_TO
            subject: `New Lead: ${brand} wants ${want}`,
            html: `
              <h2>New Brand Lead - Chef Didi</h2>
              <p><b>Name:</b> ${name}</p>
              <p><b>Brand:</b> ${brand}</p>
              <p><b>Wants:</b> ${want}</p>
              <p><b>Budget:</b> ${budget || 'Not given'}</p>
              <p><b>Contact:</b> ${contact}</p>
              <p><b>About brand:</b> ${about || '-'}</p>
              <p><b>Time:</b> ${lead.at}</p>
              <hr/>
              <p>Reply to them, then send them your #advertise link with prices.</p>
            `,
          }),
        });
      } catch (e) { console.log('Email failed', e); }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

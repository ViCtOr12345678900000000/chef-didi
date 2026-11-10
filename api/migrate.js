export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const bundle = req.body;
  if (!bundle.email) {
    return res.status(400).json({ ok: false });
  }

  // Check if already migrated
  const check = await fetch(
    `${url}/get/migrated:${bundle.email}`,
    { headers }
  ).then((r) => r.json());

  if (check.result === "1") {
    return res.status(200).json({ ok: true, already: true });
  }

  const encoded = encodeURIComponent(
    JSON.stringify(bundle)
  );

  await fetch(`${url}/lpush/users/${encoded}`, {
    headers,
  });

  await fetch(
    `${url}/set/migrated:${bundle.email}/1`,
    { headers }
  );

  return res.status(200).json({ ok: true });
}

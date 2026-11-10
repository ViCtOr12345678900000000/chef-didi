export default async function handler(req, res) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const ip = (req.headers["x-forwarded-for"] || "")
      .split(",")[0] || "unknown";

    const ua = req.headers["user-agent"] || "";
    let device = "Desktop";
    if (ua.includes("iPhone")) device = "iPhone";
    else if (ua.includes("Android")) device = "Android";
    else if (ua.includes("Mobile")) device = "Mobile";

    let country = "Unknown";
    let city = "Unknown";
    try {
      const geo = await fetch(
        `http://ip-api.com/json/${ip}?fields=country,city`
      ).then((r) => r.json());
      if (geo.country) country = geo.country;
      if (geo.city) city = geo.city;
    } catch (e) {}

    const visitor = {
      time: new Date().toISOString(),
      country,
      city,
      device,
      ip,
    };

    const encoded = encodeURIComponent(
      JSON.stringify(visitor)
    );

    await fetch(`${url}/lpush/visitors/${encoded}`, {
      headers,
    });

    await fetch(`${url}/incr/total_visitors`, {
      headers,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
}

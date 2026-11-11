export default async function handler(req, res) {
  try {
    const ua = String(req.headers["user-agent"] || "").toLowerCase();
    // Only real crawlers / monitors — NOT real people, NOT by location
    const isBotUA = /bot|crawler|spider|vercel|uptimerobot|pingdom|headless|preview|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot/i.test(ua);
    if (isBotUA) return res.status(200).json({ ok: true, skipped: "bot" });

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };

    const city = req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown";
    const country = req.headers["x-vercel-ip-country"] ? decodeURIComponent(req.headers["x-vercel-ip-country"]) : "Unknown";
    // Vercel gives country code (NG, US) — expand it for display
    const countryName = country === "NG" ? "Nigeria" : country === "US" ? "United States" : country;

    const entry = JSON.stringify({
      city, country: countryName,
      device: ua.includes("iphone") ? "iPhone" : ua.includes("android") ? "Android" : ua.includes("windows") ? "Windows" : ua.includes("mac") ? "Mac" : "Other",
      time: new Date().toISOString(),
    });

    await fetch(`${url}/incr/count`, { headers });
    await fetch(`${url}/rpush/visitors/${encodeURIComponent(entry)}`, { headers });
    // Keep last 1000 only
    await fetch(`${url}/ltrim/visitors/0/999`, { headers });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}

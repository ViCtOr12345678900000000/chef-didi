export default async function handler(req, res) {
  try {
    const ua = String(req.headers["user-agent"] || "");
    const uaLow = ua.toLowerCase();

    // 1. Filter bot user-agents
    const isBotUA = /bot|crawler|spider|vercel|uptimerobot|pingdom|headless|preview|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|amazonbot|applebot|yandex|baidu/i.test(uaLow);
    if (isBotUA) return res.status(200).json({ ok: true, skipped: "bot-ua" });

    // 2. Reject non-browser agents
    if (!ua || ua.length < 20 || !uaLow.includes("mozilla")) {
      return res.status(200).json({ ok: true, skipped: "no-browser" });
    }

    // 3. Filter Vercel datacenter IPs
    const rawCity = req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown";
    const datacenterCities = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner"];
    const isDatacenter = datacenterCities.some(c => rawCity.toLowerCase().includes(c));
    const looksLikeRealBrowser = /iphone|android|windows|macintosh|ipad/.test(uaLow);
    if (isDatacenter && !looksLikeRealBrowser) {
      return res.status(200).json({ ok: true, skipped: "datacenter" });
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };

    const rawCountry = req.headers["x-vercel-ip-country"] ? decodeURIComponent(req.headers["x-vercel-ip-country"]) : "Unknown";
    const COUNTRY_MAP = { NG: "Nigeria", US: "United States", GB: "United Kingdom", UK: "United Kingdom", GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada", AU: "Australia" };
    const country = COUNTRY_MAP[rawCountry] || COUNTRY_MAP[rawCountry.toUpperCase()] || rawCountry;
    const city = rawCity === "Unknown" ? "Unknown" : rawCity;

    const entry = JSON.stringify({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      city, 
      country,
      device: uaLow.includes("iphone") ? "iPhone" : uaLow.includes("android") ? "Android" : uaLow.includes("windows") ? "Windows" : uaLow.includes("mac") ? "Mac" : "Other",
      time: new Date().toISOString(),
    });

    await fetch(`${url}/incr/count`, { headers });
    await fetch(`${url}/rpush/visitors/${encodeURIComponent(entry)}`, { headers });
    await fetch(`${url}/ltrim/visitors/0/999`, { headers });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}

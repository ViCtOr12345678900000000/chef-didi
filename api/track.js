import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const ua = String(req.headers["user-agent"] || "");
    const uaLow = ua.toLowerCase();

    // FIX 1: Only block REAL crawlers, not in-app browsers.
    // Real crawlers don't have Mozilla + iphone/android/windows in them.
    // WhatsApp / Instagram / Facebook in-app browsers DO, so let them through.
    const isRealBrowser = uaLow.includes("mozilla") && /iphone|android|windows|macintosh|ipad/.test(uaLow);
    
    const isBotUA =
      /googlebot|bingbot|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|amazonbot|applebot|yandex|baidu|headless|uptimerobot|pingdom/i.test(uaLow);

    // Block only if it's a bot AND not a real browser
    if (isBotUA && !isRealBrowser) {
      return res.status(200).json({ ok: true, skipped: "bot-ua" });
    }

    // Reject non-browser agents (pure crawlers, curl, etc)
    if (!ua || ua.length < 20 || !uaLow.includes("mozilla")) {
      return res.status(200).json({ ok: true, skipped: "no-browser" });
    }

    // FIX 2: Don't block datacenter cities if it's a real phone
    const rawCity = req.headers["x-vercel-ip-city"]
      ? decodeURIComponent(req.headers["x-vercel-ip-city"])
      : "Unknown";
    const datacenterCities = [
      "san jose",
      "ashburn",
      "boardman",
      "dulles",
      "prineville",
      "hillsboro",
      "quincy",
      "the dalles",
      "council bluffs",
      "moncks corner",
      "frankfurt am main",
    ];
    const isDatacenter = datacenterCities.some((c) => rawCity.toLowerCase().includes(c));
    if (isDatacenter && !isRealBrowser) {
      return res.status(200).json({ ok: true, skipped: "datacenter" });
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };

    const cookieHeader = String(req.headers.cookie || "");
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)vid=(v_[a-f0-9]{10})/);

    let visitorHash;
    if (cookieMatch) {
      visitorHash = cookieMatch[1];
    } else {
      const ip = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown-ip")
        .split(",")[0]
        .trim();
      // FIX 3: Don't use Date.now() here - same person without cookie
      // would get a new ID every single time. Use IP + UA only.
      visitorHash =
        "v_" +
        crypto
          .createHash("sha256")
          .update(`${ip}-${ua}`)
          .digest("hex")
          .slice(0, 10);
    }

    res.setHeader(
      "Set-Cookie",
      `vid=${visitorHash}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
    );

    const countRes = await fetch(`${url}/hincrby/visitor_hits/${visitorHash}/1`, { headers });
    const countData = await countRes.json();
    const visitNumber = countData.result || 1;

    const rawCountry = req.headers["x-vercel-ip-country"]
      ? decodeURIComponent(req.headers["x-vercel-ip-country"])
      : "Unknown";
    const COUNTRY_MAP = {
      NG: "Nigeria",
      US: "United States",
      GB: "United Kingdom",
      UK: "United Kingdom",
      GH: "Ghana",
      KE: "Kenya",
      ZA: "South Africa",
      CA: "Canada",
      AU: "Australia",
      DE: "Germany",
    };
    const country = COUNTRY_MAP[rawCountry] || COUNTRY_MAP[rawCountry.toUpperCase()] || rawCountry;
    const city = rawCity === "Unknown" ? "Unknown" : rawCity;

    const entry = JSON.stringify({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      visitorHash,
      visitNumber,
      city,
      country,
      device: uaLow.includes("iphone")
        ? "iPhone"
        : uaLow.includes("android")
        ? "Android"
        : uaLow.includes("windows")
        ? "Windows"
        : uaLow.includes("mac")
        ? "Mac"
        : "Other",
      time: new Date().toISOString(),
    });

    await fetch(`${url}/incr/count`, { headers });
    await fetch(`${url}/rpush/visitors/${encodeURIComponent(entry)}`, { headers });
    await fetch(`${url}/ltrim/visitors/-1000/-1`, { headers });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}

import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const ua = String(req.headers["user-agent"] || "");
    const uaLow = ua.toLowerCase();

    const isRealBrowser = uaLow.includes("mozilla") && /iphone|android|windows|macintosh|ipad/.test(uaLow);
    const isBotUA = /googlebot|bingbot|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|amazonbot|applebot|yandex|baidu|headless|uptimerobot|pingdom/i.test(uaLow);

    if (isBotUA && !isRealBrowser) {
      return res.status(200).json({ ok: true, skipped: "bot-ua" });
    }
    if (!ua || ua.length < 20 || !uaLow.includes("mozilla")) {
      return res.status(200).json({ ok: true, skipped: "no-browser" });
    }

    const url = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return res.status(200).json({ ok: false, error: "missing-upstash-env" });
    }
    const headers = { Authorization: `Bearer ${token}` };

    const cookieHeader = String(req.headers.cookie || "");
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)vid=(v_[a-f0-9]{10})/);

    let visitorHash;
    if (cookieMatch) {
      visitorHash = cookieMatch[1];
    } else {
      const ip = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown-ip").split(",")[0].trim();
      visitorHash = "v_" + crypto.createHash("sha256").update(`${ip}-${ua}`).digest("hex").slice(0, 10);
    }

    res.setHeader("Set-Cookie", `vid=${visitorHash}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`);

    const countRes = await fetch(`${url}/hincrby/visitor_hits/${visitorHash}/1`, { headers });
    const countData = await countRes.json();
    if (countData.error) {
      return res.status(200).json({ ok: false, error: countData.error });
    }
    const visitNumber = countData.result || 1;

    const rawCity = req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown";
    const rawCountry = req.headers["x-vercel-ip-country"] ? decodeURIComponent(req.headers["x-vercel-ip-country"]) : "Unknown";
    const COUNTRY_MAP = { NG: "Nigeria", US: "United States", GB: "United Kingdom", UK: "United Kingdom", GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada", AU: "Australia", DE: "Germany" };
    const country = COUNTRY_MAP[rawCountry] || COUNTRY_MAP[rawCountry.toUpperCase()] || rawCountry;

    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      visitorHash,
      visitNumber,
      city: rawCity,
      country,
      device: uaLow.includes("iphone") ? "iPhone" : uaLow.includes("android") ? "Android" : uaLow.includes("windows") ? "Windows" : uaLow.includes("mac") ? "Mac" : "Other",
      time: new Date().toISOString(),
    };

    // SAME method as my-number.js — no pipeline
    const pushRes = await fetch(`${url}/rpush/visitors/${encodeURIComponent(JSON.stringify(entry))}`, { headers });
    const pushData = await pushRes.json();
    if (pushData.error) {
      return res.status(200).json({ ok: false, error: "rpush-failed: " + pushData.error });
    }

    // Keep only last 1000
    await fetch(`${url}/ltrim/visitors/-1000/-1`, { headers }).catch(() => {});

    // Verify it actually landed — return real list length
    const lenRes = await fetch(`${url}/llen/visitors`, { headers });
    const lenData = await lenRes.json();

    return res.status(200).json({ ok: true, saved: true, visitNumber, listLength: lenData.result });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
}

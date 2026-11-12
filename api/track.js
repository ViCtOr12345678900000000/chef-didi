import crypto from "crypto";

async function readUsersList(url, headers) {
  const r = await fetch(`${url}/lrange/users/0/-1`, { headers });
  const data = await r.json();
  const users = [];
  if (Array.isArray(data.result)) {
    for (const item of data.result) {
      try {
        let s = typeof item === "string" ? item : JSON.stringify(item);
        try { s = decodeURIComponent(s); } catch {}
        try { s = decodeURIComponent(s); } catch {}
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) users.push(...parsed);
        else if (parsed && typeof parsed === "object") users.push(parsed);
      } catch {}
    }
  }
  return users;
}

export default async function handler(req, res) {
  try {
    const ua = String(req.headers["user-agent"] || "");
    const uaLow = ua.toLowerCase();

    const isBotUA = /bot|crawler|spider|vercel|uptimerobot|pingdom|headless|preview|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|amazonbot|applebot|yandex|baidu/i.test(uaLow);
    if (isBotUA) return res.status(200).json({ ok: true, skipped: "bot-ua" });

    if (!ua || ua.length < 20 || !uaLow.includes("mozilla")) {
      return res.status(200).json({ ok: true, skipped: "no-browser" });
    }

    const rawCity = req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown";
    const datacenterCities = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner", "frankfurt am main"];
    const isDatacenter = datacenterCities.some(c => rawCity.toLowerCase().includes(c));
    const looksLikeRealBrowser = /iphone|android|windows|macintosh|ipad/.test(uaLow);
    if (isDatacenter && !looksLikeRealBrowser) {
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
      const ip = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown-ip").split(",")[0].trim();
      visitorHash = "v_" + crypto
        .createHash("sha256")
        .update(`${ip}-${ua}-${Date.now()}`)
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

    // Increment registered user's visitCount if their vid cookie matches
    const usersList = await readUsersList(url, headers);
    let userUpdated = false;
    const updatedUsers = usersList.map(u => {
      if (u.visitorHash === visitorHash || (u.cookieId && u.cookieId === visitorHash)) {
        userUpdated = true;
        return {
          ...u,
          visitCount: (u.visitCount || 0) + 1,
          lastSeen: new Date().toISOString(),
        };
      }
      return u;
    });

    if (userUpdated) {
      await fetch(`${url}/del/users`, { headers });
      for (const u of updatedUsers) {
        await fetch(`${url}/rpush/users/${encodeURIComponent(JSON.stringify(u))}`, { headers });
      }
    }

    const rawCountry = req.headers["x-vercel-ip-country"] ? decodeURIComponent(req.headers["x-vercel-ip-country"]) : "Unknown";
    const COUNTRY_MAP = { NG: "Nigeria", US: "United States", GB: "United Kingdom", UK: "United Kingdom", GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada", AU: "Australia", DE: "Germany" };
    const country = COUNTRY_MAP[rawCountry] || COUNTRY_MAP[rawCountry.toUpperCase()] || rawCountry;
    const city = rawCity === "Unknown" ? "Unknown" : rawCity;

    const entry = JSON.stringify({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      visitorHash,
      visitNumber,
      city, 
      country,
      device: uaLow.includes("iphone") ? "iPhone" : uaLow.includes("android") ? "Android" : uaLow.includes("windows") ? "Windows" : uaLow.includes("mac") ? "Mac" : "Other",
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

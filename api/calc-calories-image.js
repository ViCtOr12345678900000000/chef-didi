export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Please try again." });
  }

  const { image, goal } = req.body || {};

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Please snap your food photo again." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Didi is resting right now. Please try again in a bit." });
  }

  // Stop oversized images early - Gemini go reject am
  if (image.length > 7_000_000) {
    return res.status(400).json({ error: "This photo is too big. Please snap a smaller one and try again." });
  }

  try {
    let mimeType = "image/jpeg";
    let base64 = image;

    if (image.includes(",")) {
      const firstComma = image.indexOf(",");
      const meta = image.slice(0, firstComma);
      base64 = image.slice(firstComma + 1);
      // Safe match - no crash if format no match
      const m = meta.match(/data:([^;]+);/);
      if (m && m[1]) mimeType = m[1];
    }

    if (!base64 || base64.length < 100) {
      return res.status(400).json({ error: "I can't see this photo. Please snap it again." });
    }

    // Only allow image types Gemini fit accept
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      mimeType = "image/jpeg";
    }

    const safeGoal = ["weight loss", "weight gain", "stay fit", "normal"].includes(goal) ? goal : "normal";

    const prompt = `
You are Didi, a friendly Nigerian nutrition expert with eyes. Look at this food photo carefully.
Return ONLY valid JSON. No markdown, no backticks.

Goal: ${safeGoal}

Identify EVERY food you can see. Estimate portion: small plate, normal plate, big plate, 1 piece, etc.
Use Nigerian portions: 1 plate Jollof = 450, White Rice + Stew = 520, Beans = 400, Grilled Chicken 1 piece = 250, Fried Chicken = 380, Eba + Soup = 600, Pounded Yam + Egusi = 650, Indomie = 380, Pasta = 420, Coke 50cl = 210, Malt = 170, Water = 0.

Return JSON:
{"items":[{"name":"Jollof Rice","qty":1,"unit":"plate","kcalPerOne":450,"totalKcal":450}],"totalKcal":450,"note":"1 short tip from Didi","whatYouSee":"1 plate of jollof rice with 1 grilled chicken"}
If photo is not food, return: {"items":[],"totalKcal":0,"note":"This does not look like food. Snap your plate again.","whatYouSee":"No food detected"}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeout));

    const raw = await geminiRes.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "I couldn't see the food clearly. Please try again." });
    }

    if (!geminiRes.ok) {
      console.error("Gemini error:", data?.error?.message);
      return res.status(500).json({ error: "Didi couldn't check this photo. Please try again." });
    }

    let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Remove markdown if Gemini still add am
    txt = txt.replace(/```json|```/g, "").trim();

    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return res.status(200).json({
        items: [],
        totalKcal: 0,
        note: "I can't identify the food in this photo. Please try again with better light.",
        whatYouSee: "No food detected",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(txt.slice(start, end + 1));
    } catch {
      return res.status(200).json({
        items: [],
        totalKcal: 0,
        note: "I can't identify the food in this photo. Please try again.",
        whatYouSee: "No food detected",
      });
    }

    // Validate shape - no crash for frontend
    if (!parsed || !Array.isArray(parsed.items)) {
      return res.status(200).json({
        items: [],
        totalKcal: 0,
        note: "I can't identify the food in this photo. Please try again.",
        whatYouSee: "No food detected",
      });
    }

    // If no food, return friendly message, not error
    if (parsed.items.length === 0) {
      return res.status(200).json({
        items: [],
        totalKcal: 0,
        note: "This does not look like food. Please snap your plate again.",
        whatYouSee: parsed.whatYouSee || "No food detected",
      });
    }

    // Make sure numbers no be NaN
    parsed.items = parsed.items.map((it) => ({
      name: String(it?.name || "Food"),
      qty: Number(it?.qty) || 1,
      unit: String(it?.unit || "plate"),
      kcalPerOne: Number(it?.kcalPerOne) || 0,
      totalKcal: Number(it?.totalKcal) || 0,
    }));
    parsed.totalKcal = parsed.items.reduce((sum, it) => sum + it.totalKcal, 0);

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Vision handler error:", e);
    if (e.name === "AbortError") {
      return res.status(500).json({ error: "This one take too long. Please try again." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

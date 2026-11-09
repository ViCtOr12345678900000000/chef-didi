export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { image, goal } = req.body;
  if (!image) return res.status(400).json({ error: "No image" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel" });

  try {
    let mimeType = "image/jpeg";
    let base64 = image;
    if (image.includes(",")) {
      const [meta, b64] = image.split(",");
      const m = meta.match(/data:(.*?);/);
      if (m) mimeType = m[1];
      base64 = b64;
    }

    const prompt = `
You are Didi, a friendly Nigerian nutrition expert with eyes. Look at this food photo carefully.
Return ONLY valid JSON. No markdown, no backticks.

Goal: ${goal || "normal"}

Identify EVERY food you can see. Estimate portion: small plate, normal plate, big plate, 1 piece, etc.
Use Nigerian portions: 1 plate Jollof = 450, White Rice + Stew = 520, Beans = 400, Grilled Chicken 1 piece = 250, Fried Chicken = 380, Eba + Soup = 600, Pounded Yam + Egusi = 650, Indomie = 380, Pasta = 420, Coke 50cl = 210, Malt = 170, Water = 0.

Return JSON:
{"items":[{"name":"Jollof Rice","qty":1,"unit":"plate","kcalPerOne":450,"totalKcal":450}],"totalKcal":450,"note":"1 short tip from Didi","whatYouSee":"1 plate of jollof rice with 1 grilled chicken"}
If photo is not food, return: {"items":[],"totalKcal":0,"note":"This does not look like food. Snap your plate again.","whatYouSee":"No food detected"}
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const raw = await geminiRes.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(500).json({ error: "Didi could not read vision response." }); }
    if (!geminiRes.ok) return res.status(500).json({ error: data.error?.message || "Didi vision failed" });

    let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1) return res.status(500).json({ error: "Didi saw no food. Snap again with better light." });
    const parsed = JSON.parse(txt.slice(start, end + 1));
    return res.status(200).json(parsed);
  } catch (e) { return res.status(500).json({ error: "Didi error: " + (e.message || "Failed") }); }
}
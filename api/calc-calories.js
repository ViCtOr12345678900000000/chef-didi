export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { text, goal } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "No food text" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel. Add it in Settings > Environment Variables" });

  try {
    const prompt = `
You are Didi, a friendly Nigerian nutrition expert. Estimate calories HONESTLY. Return ONLY valid JSON. No markdown, no backticks, no explanation outside JSON.

User ate: "${text}"
Goal: ${goal || "normal"}

Break it into separate items. Be realistic for Nigerian portions:
- 1 plate Jollof Rice = 450 kcal, White Rice + Stew = 520, Fried Rice = 480
- 1 plate Beans = 400, Beans + Plantain = 550
- 1 piece Grilled Chicken = 250, Fried Chicken = 380, Beef = 280
- 1 wrap Eba + Soup = 600, Pounded Yam + Egusi = 650, Amala = 550
- 1 pack Indomie = 380, 1 plate Pasta = 420, 2 slices Yam = 220 boiled / 380 fried
- 1 Fried Plantain (2 pieces) = 280, Boiled Plantain = 180
- 1 Boiled Egg = 70, Fried Egg = 120, 2 slices Bread = 160
- 1 bottle Coke 50cl = 210, Malt = 170, Water = 0
- If food is unknown, estimate from similar food. Never say 0 unless it's water / black tea.
- Quantity matters: "2 plates" = 2x, "half plate" = 0.5x, "a full plate" = 1x, "a full plate of beans" = 1 plate beans.

Return JSON in this exact shape:
{"items":[{"name":"Beans","qty":1,"unit":"plate","kcalPerOne":400,"totalKcal":400}],"totalKcal":400,"note":"1 short tip from Didi for this goal"}
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } })
    });

    const raw = await geminiRes.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(500).json({ error: "Didi could not read Gemini response. Check API key." }); }
    if (!geminiRes.ok) return res.status(500).json({ error: data.error?.message || "Didi failed to calculate" });

    let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Extract JSON safely - find first { to last }
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1) return res.status(500).json({ error: "Didi returned no calories. Try again." });
    txt = txt.slice(start, end + 1);

    let parsed;
    try { parsed = JSON.parse(txt); } catch { return res.status(500).json({ error: "Didi's answer was unclear. Try again." }); }
    return res.status(200).json({ items: parsed.items || [], totalKcal: parsed.totalKcal || 0, note: parsed.note || "" });
  } catch (e) { return res.status(500).json({ error: "Didi error: " + (e.message || "Failed") }); }
}
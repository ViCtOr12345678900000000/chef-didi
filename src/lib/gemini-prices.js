// lib/gemini-prices.js - NOT a Vercel function, just helper code
export async function getLivePrices() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (!apiKey) throw new Error('No GEMINI_KEY');

  const prompt = `
You are a Lagos market price researcher for Chef Didi.
Today is ${new Date().toISOString().slice(0,10)}.
Get MOST RECENT Lagos prices from foodprices.ng, Lagos Ministry of Agriculture, BusinessDay / Nairametrics / NAN, Ola of North Mile 12.
Return ONLY valid JSON:
{
  "updated": "13 Nov 2026",
  "source": "FoodPrices.ng + Mile 12 via Ola of North",
  "market": "Mile 12",
  "items": [
    { "id": "tomato", "name": "Tomato", "unit": "1kg", "price": 1650, "emoji": "🍅" },
    { "id": "rodo", "name": "Rodo Pepper", "unit": "1kg", "price": 1794, "emoji": "🌶️" },
    { "id": "tatashe", "name": "Tatashe", "unit": "1kg", "price": 2130, "emoji": "🫑" },
    { "id": "shombo", "name": "Shombo", "unit": "1kg", "price": 2000, "emoji": "🌶️" },
    { "id": "onion", "name": "Onion", "unit": "1kg", "price": 1728, "emoji": "🧅" },
    { "id": "rice_foreign", "name": "Foreign Rice", "unit": "1 derica", "price": 1100, "emoji": "🍚" },
    { "id": "rice_local", "name": "Local Rice", "unit": "1 derica", "price": 1000, "emoji": "🍚" },
    { "id": "garri_ijebu", "name": "Garri Ijebu", "unit": "1 paint", "price": 1200, "emoji": "🥣" },
    { "id": "yam", "name": "Yam (medium)", "unit": "1 tuber", "price": 2350, "emoji": "🍠" },
    { "id": "crayfish", "name": "Crayfish", "unit": "small plate", "price": 500, "emoji": "🦐" },
    { "id": "seasoning", "name": "Seasoning (2 cubes)", "unit": "pack", "price": 200, "emoji": "🧂" },
    { "id": "palm_oil", "name": "Palm Oil", "unit": "1 bottle 75cl", "price": 2800, "emoji": "🫙" }
  ],
  "notes": "Onion expensive this week",
  "confidence": "high"
}
Rules: If no price from last 14 days, set price to null. DO NOT INVENT. Retail / per-kg prices only.
`;

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    })
  });
  const data = await r.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  text = text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

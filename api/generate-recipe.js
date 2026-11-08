// api/generate-recipe.js - FREE Gemini version
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { ingredients, exclude } = req.body;
  if (!ingredients?.length) return res.status(400).json({ error: "No ingredients" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on server" });
  }

  try {
   const prompt = `
You are Chef Didi, a Nigerian home cook. Return ONLY valid JSON. No markdown.

Ingredients available: ${ingredients.join(", ")}
${exclude ? `Do NOT make: ${exclude}. Make something different.` : ""}

Create ONE recipe using ONLY / mostly these ingredients. You can assume Salt, Oil, Water, Pepper are available.

BE HONEST ABOUT TIME - DO NOT LIE TO SAVE TIME:
- Nigerian cooking is slow. Never give a fake fast time.
- If recipe has Rice: minimum 55 mins. Concoction rice / Jollof rice = 60-75 mins.
- If recipe has Beans: minimum 90 mins.
- If recipe has Yam / Plantain + stew: minimum 50 mins.
- If recipe has Chicken + Rice + Eggs: minimum 65 mins.
- Add up ALL steps: prep + boiling + frying + simmering. Your time must equal the total of your steps.
- If your steps would take 70 mins to do in real life, your time must be "70 mins", not "30 mins".

BE HONEST ABOUT DIFFICULTY - USE THIS RULE, NO EXCEPTIONS:
- Easy = ONLY if time is 30 mins or less AND 5 steps or less AND no frying/blending.
- Medium = time 31-60 mins OR 6-8 steps OR needs frying/blending.
- Hard = time 61 mins or more OR 9+ steps OR needs multiple pots / frying + boiling + simmering.
- Most Nigerian rice + chicken recipes are Medium or Hard, NOT Easy. Do not say Easy just to be nice.

Return JSON in this exact shape:
{
  "id": "unique-string",
  "title": "Recipe Name",
  "time": "65 mins",
  "servings": "2-3 servings",
  "difficulty": "Medium",
  "description": "1 sentence",
  "youHave": ["Chicken", "Onion"],
  "youMightNeed": ["Oil", "Salt"],
  "ingredients": ["1 cup Rice", "2 Eggs"],
  "steps": ["Step 1...", "Step 2..."],
  "tip": "One helpful tip",
  "variation": 1
}
youHave = ingredients from the user list that you used.
youMightNeed = pantry staples only.
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error(geminiData);
      return res.status(500).json({ error: geminiData.error?.message || "Gemini failed" });
    }

    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Remove ```json ... ``` if Gemini adds it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const recipe = JSON.parse(text);

    const safeRecipe = {
      id: recipe.id || Date.now().toString(),
      title: recipe.title || "Chef Didi Recipe",
      time: recipe.time || "25 mins",
      servings: recipe.servings || "2 servings",
      difficulty: recipe.difficulty || "Easy",
      description: recipe.description || "",
      youHave: recipe.youHave || ingredients,
      youMightNeed: recipe.youMightNeed || ["Oil", "Salt"],
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      tip: recipe.tip || "Taste and adjust seasoning.",
      variation: recipe.variation || 1,
    };

    return res.status(200).json({ recipe: safeRecipe });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Failed to generate recipe" });
  }
}
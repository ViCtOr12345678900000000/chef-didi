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
Return JSON in this exact shape:
{
  "id": "unique-string",
  "title": "Recipe Name",
  "time": "25 mins",
  "servings": "2-3 servings",
  "difficulty": "Easy",
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
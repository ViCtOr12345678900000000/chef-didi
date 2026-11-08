// api/generate-recipe.js - FREE Gemini version
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { ingredients, exclude, mode } = req.body;
  if (!ingredients?.length) return res.status(400).json({ error: "No ingredients" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on server" });
  }

  const isWeightLoss = mode === "weightloss";

  try {
   const prompt = `
You are Chef Didi, a Nigerian home cook. Return ONLY valid JSON. No markdown.

Ingredients available: ${ingredients.join(", ")}
${exclude ? `Do NOT make: ${exclude}. Make something different.` : ""}
${isWeightLoss ? `MODE: WEIGHT LOSS FRIENDLY - THIS IS VERY IMPORTANT` : `MODE: NORMAL - Cook the normal delicious Nigerian way`}

Create ONE recipe using ONLY / mostly these ingredients. You can assume Salt, Oil, Water, Pepper are available.

${isWeightLoss ? `
WEIGHT LOSS RULES - FOLLOW ALL OF THESE, NO EXCEPTIONS:
- Use VERY little oil: max 1 tablespoon total. Never deep fry. Grill, boil, steam, or air-fry instead of frying.
- No sugar, no extra Maggi cubes, no butter, no mayonnaise, no heavy stew with lots of palm oil. Use 1 tsp palm oil max if you must.
- Make it HIGH PROTEIN + HIGH FIBRE: more Chicken, Eggs, Beans, Fish, Vegetables. Less Rice, Yam, Pasta, Plantain. If you must use Rice/Yam, use SMALL portion: 1/2 cup cooked max.
- Add vegetables to EVERY recipe: Cabbage, Carrots, Spinach, Cucumber, Pepper, Onion.
- Portion control: Servings must be small. 1 serving = 1 plate, not 2.
- No sugary drinks, no fried snacks.
- In "description", say why it is good for weight loss in 1 sentence.
- In "tip", give 1 weight loss tip (e.g. drink water, eat slowly, don't add extra oil).
- Be honest: if the user picked mostly Rice + Oil + Plantain, still make the lightest possible version and warn them to eat a small portion.
` : `
NORMAL MODE RULES:
- Cook the normal, delicious Nigerian way. Use normal oil, normal portions.
- Frying is allowed if the recipe needs it.
- Make it tasty and filling.
`}

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
  "steps": ["Soak the stockfish...", "Wash the periwinkles..."],
  "tip": "One helpful tip",
  "variation": 1,
  "calories": "380 kcal per serving",
  "mode": "${isWeightLoss ? "weightloss" : "normal"}"
}
youHave = ingredients from the user list that you used.
youMightNeed = pantry staples only.
DO NOT write "Step 1:" inside steps. Just the action.
${isWeightLoss ? `calories = estimate honestly. Weight loss recipes should be 300-500 kcal per serving. If it is higher, explain why.` : `calories = estimate honestly.`}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      const msg = geminiData.error?.message || "Gemini failed";
      if (msg.includes("Quota") || msg.includes("exceeded") || msg.includes("limit")) {
        return res.status(429).json({ error: "QUOTA: " + msg });
      }
      if (msg.includes("overloaded") || msg.includes("high demand") || msg.includes("503") || geminiRes.status === 503) {
        return res.status(503).json({ error: "OVERLOADED: " + msg });
      }
      return res.status(500).json({ error: "GEMINI: " + msg });
    }

    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
      steps: (recipe.steps || []).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim()),
      tip: recipe.tip || "Taste and adjust seasoning.",
      variation: recipe.variation || 1,
      calories: recipe.calories || "",
      mode: recipe.mode || (isWeightLoss ? "weightloss" : "normal"),
    };

    return res.status(200).json({ recipe: safeRecipe });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Failed to generate recipe" });
  }
}
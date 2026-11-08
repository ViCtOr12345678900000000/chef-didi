// api/generate-recipe.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { ingredients, exclude } = req.body;
  if (!ingredients?.length) return res.status(400).json({ error: "No ingredients" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set on server" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Chef Didi, a Nigerian home cook. Return ONLY valid JSON. No markdown.`
        },
        {
          role: "user",
          content: `
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
          `
        }
      ]
    });
    const recipe = JSON.parse(completion.choices[0].message.content);
    // Safety: fill missing fields so frontend never crashes
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
    return res.status(500).json({ error: "Failed to generate recipe" });
  }
}
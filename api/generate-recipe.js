export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { ingredients, exclude, mode, sittings, caloriesPerSitting, totalCalories, lang, cuisine, location } = req.body;

    const cuisineMode = cuisine || "auto";
    const locationMode = location || "nigeria";

    let cuisineInstruction = "";
    if (cuisineMode === "nigerian") cuisineInstruction = "You MUST create a NIGERIAN dish. Use Nigerian cooking methods, local names, seasonings.";
    else if (cuisineMode === "italian") cuisineInstruction = "You MUST create an ITALIAN dish. Use Italian cooking methods.";
    else if (cuisineMode === "continental") cuisineInstruction = "You MUST create a CONTINENTAL / WESTERN dish.";
    else if (cuisineMode === "asian") cuisineInstruction = "You MUST create an ASIAN dish.";
    else if (cuisineMode === "mexican") cuisineInstruction = "You MUST create a MEXICAN dish.";
    else cuisineInstruction = `
      AUTO-DETECT THE DISH FROM INGREDIENTS. DO NOT FORCE NIGERIAN.
      - Fettuccine + Heavy Cream + Parmesan + Chicken + Garlic + Butter = Chicken Alfredo Pasta. Return Alfredo.
      - Rice + Tomato + Pepper + Onion = Jollof Rice. Return Jollof.
      - Tortilla + Chicken + Cheese = Quesadilla / Tacos.
      - Noodles + Soy Sauce + Veg = Stir-fry Noodles.
      - If ingredients match a famous world dish, return THAT dish by its real name.
      - Only make it Nigerian if ingredients are clearly Nigerian (Egusi, Ogbono, Yam + Palm Oil, etc.) or no world dish matches.
    `;

    let locationInstruction = "";
    if (locationMode === "abroad" && cuisineMode === "nigerian") {
      locationInstruction = `
      USER IS NIGERIAN ABROAD (UK/US/Canada).
      - Keep dish 100% AUTHENTIC NIGERIAN. Do NOT turn it continental.
      - For every hard-to-find ingredient, give a SWAP in brackets. Example: Ugu (swap: baby spinach from Tesco/Walmart), Crayfish (swap: dried shrimp from Asian store), Scotch Bonnet (swap: habanero), Palm Oil (African store / Amazon).
      - Add "Where to buy abroad": African store, Tesco World Food aisle, Walmart International aisle, Amazon.
      - Use grams, cups, tbsp, oven °C and °F. No derica/mudu. Keep taste same as home.
      `;
    } else if (locationMode === "abroad") {
      locationInstruction = `USER IS ABROAD. Use ingredients easily found in UK/US supermarkets (Tesco, Sainsbury's, Walmart, Kroger). Use grams/cups, °C/°F.`;
    } else {
      locationInstruction = `USER IS IN NIGERIA. Use local market ingredients, local names, Naira-friendly quantities. You can use derica, mudu, local measurements.`;
    }

    const prompt = `
    You are Chef Didi.
    ${cuisineInstruction}
    ${locationInstruction}
    Goal: ${mode}, Sittings: ${sittings}, Calories per sitting: ${caloriesPerSitting}, Total: ${totalCalories}, Language: ${lang}
    ${exclude ? `Do NOT return this dish again: ${exclude}` : ""}
    Ingredients user has: ${ingredients.join(", ")}
    Return a real recipe.
    Always return valid JSON ONLY, no markdown, no explanation, in this format:
    { "title": "", "time": "25 mins", "servings": "${sittings} sittings", "difficulty": "Easy", "description": "", "youHave": [], "youMightNeed": ["Oil","Salt"], "ingredients": [], "steps": [], "tip": "", "variation": 1, "calories": "${caloriesPerSitting} kcal", "caloriesPerSitting": "${caloriesPerSitting} kcal", "totalCalories": ${totalCalories}, "mode": "${mode}" }
    `;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } })
    });

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return res.status(500).json({ error: geminiData.error?.message || "Gemini failed" });

    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Gemini sometimes wraps in { recipe: {...} } - handle both
    let parsed = JSON.parse(text);
    const recipe = parsed.recipe || parsed;

    const safeRecipe = {
      id: recipe.id || Date.now().toString(),
      title: recipe.title || "Chef Didi Recipe",
      time: recipe.time || "25 mins",
      servings: recipe.servings || `${sittings} sittings`,
      difficulty: recipe.difficulty || "Easy",
      description: recipe.description || "",
      youHave: recipe.youHave || ingredients,
      youMightNeed: recipe.youMightNeed || ["Oil", "Salt"],
      ingredients: recipe.ingredients || [],
      steps: (recipe.steps || []).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim()),
      tip: recipe.tip || "Taste and adjust.",
      variation: recipe.variation || 1,
      calories: recipe.calories || `${caloriesPerSitting} kcal`,
      caloriesPerSitting: recipe.caloriesPerSitting || `${caloriesPerSitting} kcal`,
      totalCalories: recipe.totalCalories || totalCalories,
      mode: recipe.mode || mode
    };

    return res.status(200).json({ recipe: safeRecipe });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed" });
  }
}
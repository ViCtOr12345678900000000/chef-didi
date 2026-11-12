export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Please try again." });

  try {
    const { ingredients, exclude, mode, sittings, caloriesPerSitting, totalCalories, lang, cuisine, location } = req.body;
    const cuisineMode = cuisine || "auto";
    const locationMode = location || "nigeria";
    const isSurprise = req.body.surprise === true;
    const mood = req.body.mood || "light";
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
    const isLeftover = req.body.leftover === true || req.body.isLeftover === true;
    const isPlan = req.body.planMode === true;
    const planDays = req.body.planDays || 3;

    const LAZY_MAP = {
      weightloss: { light: 350, heavy: 500 },
      normal: { light: 450, heavy: 650 },
      fit: { light: 450, heavy: 650 },
      weightgain: { light: 550, heavy: 800 },
    };
    let finalPerSitting = caloriesPerSitting;
    let finalTotal = totalCalories;
    if (isSurprise) {
      const expected = LAZY_MAP[mode]?.[mood];
      if (expected) { finalPerSitting = expected; finalTotal = expected * (sittings || 2); }
    }

    let cuisineInstruction = "";
    if (cuisineMode === "nigerian") cuisineInstruction = "You MUST create a NIGERIAN dish. Use Nigerian cooking methods, local names, seasonings.";
    else if (cuisineMode === "italian") cuisineInstruction = "You MUST create an ITALIAN dish.";
    else if (cuisineMode === "continental") cuisineInstruction = "You MUST create a CONTINENTAL / WESTERN dish.";
    else if (cuisineMode === "asian") cuisineInstruction = "You MUST create an ASIAN dish.";
    else if (cuisineMode === "mexican") cuisineInstruction = "You MUST create a MEXICAN dish.";
    else cuisineInstruction = `
      AUTO-DETECT THE DISH FROM INGREDIENTS. DO NOT FORCE NIGERIAN.
      - Fettuccine + Heavy Cream + Parmesan + Chicken + Garlic + Butter = Chicken Alfredo Pasta.
      - Rice + Tomato + Pepper + Onion = Jollof Rice.
      - Tortilla + Chicken + Cheese = Quesadilla / Tacos.
      - Noodles + Soy Sauce + Veg = Stir-fry Noodles.
      - Only make it Nigerian if ingredients are clearly Nigerian or no world dish matches.
    `;

    let locationInstruction = "";
    if (locationMode === "abroad" && cuisineMode === "nigerian") {
      locationInstruction = `USER IS NIGERIAN ABROAD. Keep dish 100% AUTHENTIC NIGERIAN. For every hard-to-find ingredient, give a SWAP in brackets. Use grams, cups, tbsp, °C and °F. No derica/mudu.`;
    } else if (locationMode === "abroad") {
      locationInstruction = `USER IS ABROAD. Use ingredients easily found in UK/US supermarkets. Use grams/cups, °C/°F.`;
    } else {
      locationInstruction = `USER IS IN NIGERIA. Use local market ingredients, local names, Naira-friendly quantities. You can use derica, mudu.`;
    }

    let leftoverInstruction = "";
    if (isLeftover) {
      leftoverInstruction = `
      *** LEFTOVER RESCUE MODE ***
      - The user gave LEFTOVERS, not fresh ingredients: ${safeIngredients.join(", ")}
      - You MUST use the leftovers as the MAIN ingredient. Do NOT ignore them.
      - Do NOT ask user to buy the same thing fresh. Reheat / transform / fry / remix the leftover.
      - If leftover is Jollof + Eggs = Jollof Fried Rice with Egg, or Jollof Fritters.
      - If leftover is Rice + Chicken = Chicken Fried Rice, or Rice Balls.
      - Add a field "leftoverUsed": true and in description say "Made from your leftovers ♻️"
      - Keep it safe: if leftover is >2 days old, say "reheat well".
      `;
    }

    // --- PLAN MODE: 3 days, reuse same pantry ---
    if (isPlan) {
      const planPrompt = `
      You are Chef Didi. Build a ${planDays}-DAY MEAL PLAN that reuses the SAME pantry ingredients.
      ${cuisineInstruction}
      ${locationInstruction}
      Goal: ${mode}, Sittings: ${sittings}, Calories per sitting: ${caloriesPerSitting}, Total per day: ${totalCalories}, Language: ${lang}
      Pantry / Ingredients user already has: ${safeIngredients.join(", ")}
      RULES:
      - Day 1 uses the main protein. Day 2 reuses leftover Day 1. Day 3 uses what is left.
      - Do NOT invent 10 new expensive ingredients. Max 2 new items per day, all from Oil/Salt list if possible.
      - Each day: different dish, same base ingredients.
      Return valid JSON ONLY, no markdown, in this format:
      { "plan": [ { "day": "Day 1", "title": "", "time": "25 mins", "servings": "${sittings} sittings", "difficulty": "Easy", "description": "", "youHave": [], "youMightNeed": ["Oil","Salt"], "ingredients": [], "steps": [], "tip": "", "calories": "${caloriesPerSitting} kcal", "caloriesPerSitting": "${caloriesPerSitting} kcal", "totalCalories": ${totalCalories}, "mode": "${mode}", "reuseFrom": "" } ] }
      `;
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: planPrompt }] }], generationConfig: { temperature: 0.9 } })
      });
      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) return res.status(500).json({ error: "I couldn't create a recipe right now. Please try again." });
      let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsed = JSON.parse(text);
      const plan = parsed.plan || parsed.recipes || [];
      const safePlan = plan.map((r, i) => ({
        id: r.id || `plan-${Date.now()}-${i}`, day: r.day || `Day ${i+1}`, title: r.title || "Chef Didi Recipe",
        time: r.time || "25 mins", servings: r.servings || `${sittings} sittings`, difficulty: r.difficulty || "Easy",
        description: r.description || "", youHave: r.youHave || safeIngredients, youMightNeed: r.youMightNeed || ["Oil","Salt"],
        ingredients: r.ingredients || [], steps: (r.steps || []).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim()),
        tip: r.tip || "Taste and adjust.", calories: r.calories || `${caloriesPerSitting} kcal`,
        caloriesPerSitting: r.caloriesPerSitting || `${caloriesPerSitting} kcal`, totalCalories: r.totalCalories || totalCalories,
        mode: r.mode || mode, reuseFrom: r.reuseFrom || "", isPlan: true
      }));
      return res.status(200).json({ plan: safePlan });
    }

    const normalPrompt = `
    You are Chef Didi.
    ${cuisineInstruction}
    ${locationInstruction}
    ${leftoverInstruction}
    Goal: ${mode}, Sittings: ${sittings}, Calories per sitting: ${caloriesPerSitting}, Total: ${totalCalories}, Language: ${lang}
    ${exclude ? `Do NOT return this dish again: ${exclude}` : ""}
    Ingredients user has: ${safeIngredients.join(", ")}
    Return a real recipe.
    Always return valid JSON ONLY, no markdown, no explanation, in this format:
    { "title": "", "time": "25 mins", "servings": "${sittings} sittings", "difficulty": "Easy", "description": "", "youHave": [], "youMightNeed": ["Oil","Salt"], "ingredients": [], "steps": [], "tip": "", "variation": 1, "calories": "${caloriesPerSitting} kcal", "caloriesPerSitting": "${caloriesPerSitting} kcal", "totalCalories": ${totalCalories}, "mode": "${mode}", "leftoverUsed": ${isLeftover} }
    `;

    const surprisePrompt = `
    You are Chef Didi. User is LAZY and said "Cook For Me".
    Pick ONE RANDOM surprise dish. Do NOT ask questions. Do NOT use user's ingredients.
    STRICT CALORIE RULE:
    - Goal: ${mode}, Mood: ${mood}
    - Calories per sitting MUST BE EXACTLY ${finalPerSitting} kcal. Total MUST BE EXACTLY ${finalTotal} kcal.
    - If dish is normally higher, shrink portion: less yam/rice/oil, more veg/soup.
    ${cuisineInstruction}
    ${locationInstruction}
    Goal: ${mode}, Sittings: ${sittings}, Language: ${lang}
    ${exclude ? `Do NOT return this dish again: ${exclude}` : ""}
    Return valid JSON ONLY, no markdown, in this format:
    { "title": "", "time": "25 mins", "servings": "${sittings} sittings", "difficulty": "Easy", "description": "", "youHave": [], "youMightNeed": ["Oil","Salt"], "ingredients": [], "steps": [], "tip": "", "variation": 1, "calories": "${finalPerSitting} kcal", "caloriesPerSitting": "${finalPerSitting} kcal", "totalCalories": ${finalTotal}, "mode": "${mode}" }
    `;

    const prompt = isSurprise ? surprisePrompt : normalPrompt;
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9 } })
    });
    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return res.status(500).json({ error: "I couldn't create a recipe right now. Please try again." });
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let parsed = JSON.parse(text);
    const recipe = parsed.recipe || parsed;
    const safeRecipe = {
      id: recipe.id || Date.now().toString(), title: recipe.title || "Chef Didi Recipe",
      time: recipe.time || "25 mins", servings: recipe.servings || `${sittings} sittings`, difficulty: recipe.difficulty || "Easy",
      description: recipe.description || "", youHave: recipe.youHave || safeIngredients, youMightNeed: recipe.youMightNeed || ["Oil", "Salt"],
      ingredients: recipe.ingredients || [], steps: (recipe.steps || []).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim()),
      tip: recipe.tip || "Taste and adjust.", variation: recipe.variation || 1,
      calories: isSurprise ? `${finalPerSitting} kcal` : (recipe.calories || `${caloriesPerSitting} kcal`),
      caloriesPerSitting: isSurprise ? `${finalPerSitting} kcal` : (recipe.caloriesPerSitting || `${caloriesPerSitting} kcal`),
      totalCalories: isSurprise ? finalTotal : (recipe.totalCalories || totalCalories),
      mode: recipe.mode || mode, leftoverUsed: isLeftover || !!recipe.leftoverUsed
    };
    return res.status(200).json({ recipe: safeRecipe });
  } catch (e) { return res.status(500).json({ error: "Something went wrong. Please try again." }); }
}

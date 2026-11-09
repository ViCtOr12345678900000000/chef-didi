export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { ingredients, exclude, mode, sittings=3, caloriesPerSitting, totalCalories, lang='en' } = req.body;
  if (!ingredients?.length) return res.status(400).json({ error: "No ingredients" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
  const goal = mode || "normal";
  const LANG_NAMES = { en:'English', yo:'Yoruba', ha:'Hausa', ig:'Igbo', pcm:'Nigerian Pidgin', fr:'French', es:'Spanish', pt:'Portuguese', de:'German', it:'Italian', ar:'Arabic', zh:'Chinese', hi:'Hindi', sw:'Swahili', tr:'Turkish', ru:'Russian' };
  const GOAL_RULES = {
    normal: `NORMAL: Normal oil, normal portions. Frying allowed. Tasty and filling.`,
    weightloss: `WEIGHT LOSS: Max 1 tbsp oil. Never deep fry. Grill/boil/steam. No sugar, no butter, no mayo, max 1 tsp palm oil. HIGH PROTEIN + HIGH FIBRE. Small portion: 1/2 cup cooked rice/yam max. Add vegetables to EVERY recipe. 300-500 kcal per sitting.`,
    weightgain: `WEIGHT GAIN: Bigger portions, more carbs + protein. Add healthy fats: groundnut, avocado, eggs, milk, cheese, palm oil in moderation. 2-3 protein sources if possible. 700-900 kcal per sitting. Gain clean weight, no junk.`,
    fit: `FIT / MUSCLE: High protein 30-40g per sitting. Lean chicken, fish, eggs, beans. Clean carbs: sweet potato, brown rice. Low sugar, low fried food. Lots of vegetables. 500-700 kcal per sitting.`,
  };
  try {
    const prompt = `
You are Chef Didi, Nigerian home cook. Return ONLY valid JSON. No markdown.
Ingredients: ${ingredients.join(", ")}
${exclude ? `Do NOT make: ${exclude}. Make different.` : ""}
GOAL: ${goal.toUpperCase()} - ${GOAL_RULES[goal]}
SITTINGS: User will eat this in ${sittings} sittings. Total: ${totalCalories||2000} kcal. Each sitting ~${caloriesPerSitting||600} kcal. Divide evenly. Servings = "${sittings} sittings".
LANGUAGE: Write title, description, steps, tip in ${LANG_NAMES[lang]||'English'}. If language is Yoruba/Hausa/Igbo/Pidgin, use that language naturally.
You can assume Salt, Oil, Water, Pepper available.
BE HONEST ABOUT TIME: Rice min 55 mins, Jollof 60-75, Beans 90+, Yam+stew 50+. Time must equal total of steps.
DIFFICULTY: Easy = <=30 mins + <=5 steps + no frying. Medium = 31-60 mins or 6-8 steps or frying. Hard = 61+ mins or 9+ steps.
Return JSON: { "id":"", "title":"", "time":"65 mins", "servings":"${sittings} sittings", "difficulty":"Medium", "description":"1 sentence + why it fits ${goal}", "youHave":[], "youMightNeed":[], "ingredients":[], "steps":[], "tip":"", "variation":1, "calories":"${caloriesPerSitting||600} kcal per sitting", "caloriesPerSitting":"${caloriesPerSitting||600} kcal", "totalCalories":${totalCalories||2000}, "mode":"${goal}" }
`;
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7} }) });
    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return res.status(500).json({ error: geminiData.error?.message || "Gemini failed" });
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g,"").replace(/```/g,"").trim();
    const recipe = JSON.parse(text);
    const safeRecipe = { id: recipe.id||Date.now().toString(), title: recipe.title||"Chef Didi Recipe", time: recipe.time||"25 mins", servings: recipe.servings||`${sittings} sittings`, difficulty: recipe.difficulty||"Easy", description: recipe.description||"", youHave: recipe.youHave||ingredients, youMightNeed: recipe.youMightNeed||["Oil","Salt"], ingredients: recipe.ingredients||[], steps: (recipe.steps||[]).map(s=>String(s).replace(/^Step\s*\d+\s*:\s*/i,"").trim()), tip: recipe.tip||"Taste and adjust.", variation: recipe.variation||1, calories: recipe.calories||`${caloriesPerSitting} kcal`, caloriesPerSitting: recipe.caloriesPerSitting||`${caloriesPerSitting} kcal`, totalCalories: recipe.totalCalories||totalCalories, mode: recipe.mode||goal };
    return res.status(200).json({ recipe: safeRecipe });
  } catch(e){ return res.status(500).json({ error: e.message||"Failed" }); }
}
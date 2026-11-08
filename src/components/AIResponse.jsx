export default function AIResponse({ recipe, onGenerateAnother, onClear }) {
  if (!recipe) return null;

  // Safety - never crash if Gemini forgets a field
  const youHave = recipe.youHave || [];
  const youMightNeed = recipe.youMightNeed || [];
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const isWeightLoss = recipe.mode === "weightloss";

  // FIX DUPLICATE: remove "Step 1:" if Gemini already added it
  const cleanSteps = steps.map((s) => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim());

  return (
    <div className="bg-white/95 border border-[#EDE6D6] rounded-[28px] p-5 md:p-6 shadow-[0_10px_35px_rgba(28,25,23,0.06)] overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-[14px] font-semibold flex items-center justify-center shadow-md shrink-0">3</span>
        <h2 className="font-display font-light text-[21px] text-[#1C1917]"> <span className="italic text-[#1B4332]">Didi's</span> Response</h2>
        <span className="ml-auto text-[10px] font-bold tracking-wider bg-[#E9EFEA] text-[#1B4332] px-2.5 py-1 rounded-full shrink-0">ONE RECIPE</span>
      </div>

      {/* TITLE CARD - green for normal, light green for weight loss */}
      <div className={`text-white rounded-2xl p-4 mb-4 ${isWeightLoss ? "bg-gradient-to-br from-[#2D6A4F] to-[#74C69D]" : "bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]"}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold tracking-[0.15em] text-white/80">YOUR ONE RECIPE</p>
          {isWeightLoss && (
            <span className="text-[10px] font-bold bg-white text-[#1B4332] px-2.5 py-1 rounded-full shrink-0 shadow-sm">🥗 WEIGHT LOSS</span>
          )}
        </div>
        <h3 className="font-display font-light text-[22px] md:text-[24px] leading-tight mb-3">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">🕐 {recipe.time || "25 mins"}</span>
          <span className="text-[11px] font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">🍽 {recipe.servings || "2 servings"}</span>
          <span className="text-[11px] font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">✦ {recipe.difficulty || "Easy"}</span>
          {recipe.calories && (
            <span className="text-[11px] font-bold bg-white text-[#1B4332] px-2.5 py-1 rounded-full">🔥 {recipe.calories}</span>
          )}
        </div>
        {isWeightLoss && (
          <p className="text-[11px] text-white/85 mt-3 leading-relaxed">✦ Light mode: little oil • grilled / boiled • small portion • high protein</p>
        )}
      </div>

      {recipe.description && <p className="text-[13px] md:text-[14px] text-stone-600 leading-relaxed mb-4">{recipe.description}</p>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#FFFBF5] border border-[#F5EEDD] rounded-2xl p-3">
          <p className="text-[13px] font-bold text-[#1C1917] mb-1.5">✓ You have</p>
          {youHave.length === 0 ? <p className="text-[12px] text-stone-400">—</p> : youHave.map((item) => (
            <p key={item} className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed">• {item}</p>
          ))}
        </div>
        <div className="bg-[#FFFBF5] border border-[#F5EEDD] rounded-2xl p-3">
          <p className="text-[13px] font-bold text-[#1C1917] mb-1.5">You might need</p>
          {youMightNeed.length === 0 ? <p className="text-[12px] text-stone-400">—</p> : youMightNeed.map((item) => (
            <p key={item} className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed">• {item} <span className="text-stone-400">(pantry)</span></p>
          ))}
        </div>
      </div>

      <p className="text-[13px] font-bold text-[#1C1917] mb-2">Ingredients</p>
      <div className="mb-5">
        {ingredients.map((item) => (
          <p key={item} className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed">• {item}</p>
        ))}
      </div>

      <p className="text-[13px] font-bold text-[#1C1917] mb-2">Steps</p>
      <div className="space-y-3 mb-4">
        {cleanSteps.map((step, index) => (
          <div key={index} className="flex gap-2.5">
            <span className={`shrink-0 w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center mt-0.5 shadow-sm ${isWeightLoss ? "bg-[#2D6A4F]" : "bg-[#1B4332]"}`}>{index + 1}</span>
            <p className="text-[13px] md:text-[14px] text-stone-700 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl p-3.5 mb-4 ${isWeightLoss ? "bg-[#E9F5EC] border border-[#B7E4C7]" : "bg-[#FEF9E7] border border-amber-100"}`}>
        <p className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed">💡 <span className="font-bold text-[#1C1917]">Tip:</span> {recipe.tip || "Taste and adjust."}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={onGenerateAnother} className={`flex-1 h-11 text-white text-[14px] font-medium rounded-full transition active:scale-95 shadow-md ${isWeightLoss ? "bg-gradient-to-r from-[#2D6A4F] to-[#74C69D] hover:shadow-lg" : "bg-[#1B4332] hover:bg-[#143325]"}`}>
          Generate Another
        </button>
        <button onClick={onClear} className="flex-1 h-11 bg-white border border-stone-200 text-[#1C1917] text-[14px] font-medium rounded-full transition active:scale-95 hover:border-stone-300">
          Clear
        </button>
      </div>

      <p className="text-center text-[11px] text-stone-400 mt-3">
        Variation {recipe.variation || 1} • Made from exactly what you entered {isWeightLoss ? "• 🥗 Weight Loss Mode" : ""}
      </p>
    </div>
  );
}

// MOCK DATA - kept for safety
export const MOCK_RECIPES = [
  {
    id: 1,
    title: "One-Pot Stir Fry with Garlic",
    time: "25 mins",
    servings: "2-3 servings",
    difficulty: "Easy",
    youHave: ["Garlic"],
    youMightNeed: ["Oil", "Salt", "Pepper", "Onion"],
    ingredients: ["2 cloves Garlic"],
    steps: ["Wash and prepare everything.", "Heat oil, cook longest ingredient first.", "Add rest, season, cover 10-12 mins.", "Serve hot."],
    tip: "Start with the ingredient that takes longest to cook.",
    variation: 1,
    calories: "320 kcal per serving",
    mode: "normal"
  }
];
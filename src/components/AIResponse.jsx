export default function AIResponse({ recipe, onGenerateAnother, onClear }) {
  if (!recipe) return null;

  // Safety - never crash if OpenAI forgets a field
  const youHave = recipe.youHave || [];
  const youMightNeed = recipe.youMightNeed || [];
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-display w-7 h-7 rounded-full bg-[#E9EFEA] text-[#1B4332] text-[13px] font-semibold flex items-center justify-center">3</span>
        <h2 className="font-display font-light text-[19px] text-[#1C1917] md:text-[13px] lg:text-[22px]"> <span className="italic font-light text-[#1B4332]">Didi's</span> Response</h2>
        <span className="ml-auto text-[10px] font-bold tracking-wider bg-[#E9EFEA] text-[#1B4332] px-2 py-1 rounded-full md:text-[5px]">ONE RECIPE</span>
      </div>

      <div className="bg-[#1B4332] text-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-200/80 mb-1 md:text-[6px]">YOUR ONE RECIPE</p>
        <h3 className="font-display font-light text-[22px] leading-tight mb-3 md:text-[14px]">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">🕐 {recipe.time || "25 mins"}</span>
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">🍽 {recipe.servings || "2 servings"}</span>
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">✦ {recipe.difficulty || "Easy"}</span>
        </div>
      </div>

      {recipe.description && <p className="text-[13px] text-stone-600 mb-4">{recipe.description}</p>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[13px] font-bold text-[#1C1917] mb-1">✓ You have</p>
          {youHave.map((item) => (
            <p key={item} className="text-[12px] text-stone-600">• {item}</p>
          ))}
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#1C1917] mb-1">You might need</p>
          {youMightNeed.map((item) => (
            <p key={item} className="text-[12px] text-stone-600">• {item} <span className="text-stone-400">(pantry staple)</span></p>
          ))}
        </div>
      </div>

      <p className="text-[13px] font-bold text-[#1C1917] mb-1">Ingredients</p>
      <div className="mb-4">
        {ingredients.map((item) => (
          <p key={item} className="text-[12px] text-stone-600">• {item}</p>
        ))}
      </div>

      <p className="text-[13px] font-bold text-[#1C1917] mb-2">Steps</p>
      <div className="space-y-3 mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2.5">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#1B4332] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{index + 1}</span>
            <p className="text-[12px] text-stone-600 leading-relaxed"><span className="font-bold text-[#1C1917]">Step {index + 1}:</span> {step}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#FEF9E7] border border-amber-100 rounded-2xl p-3 mb-4">
        <p className="text-[12px] text-stone-600">💡 <span className="font-bold text-[#1C1917]">Tip:</span> {recipe.tip || "Taste and adjust."}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={onGenerateAnother} className="flex-1 md:text-[9px] h-11 bg-[#1B4332] hover:bg-[#143325] text-white text-[14px] font-light rounded-full transition active:scale-95">
          Generate Another
        </button>
        <button onClick={onClear} className="flex-1 h-11 md:text-[9px] bg-white border border-stone-200 text-[#1C1917] text-[14px] font-light rounded-full transition active:scale-95">
          Clear
        </button>
      </div>

      <p className="text-center text-[11px] text-stone-400 mt-3">Variation {recipe.variation || 1} - Made from exactly what you entered.</p>
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
    variation: 1
  }
];
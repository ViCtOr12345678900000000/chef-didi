// AIResponse.jsx
export default function AIResponse({ recipe, onGenerateAnother, onClear }) {
  if (!recipe) return null;

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-display w-7 h-7 rounded-full bg-[#E9EFEA] text-[#1B4332] text-[13px] font-semibold flex items-center justify-center">3</span>
        <h2 className="font-display font-light text-[19px] text-[#1C1917] md:text-[13px] lg:text-[22px]">AI Response</h2>
        <span className="ml-auto text-[10px] font-bold tracking-wider bg-[#E9EFEA] text-[#1B4332] px-2 py-1 rounded-full md:text-[5px]">ONE RECIPE</span>
      </div>

      {/* Green Recipe Card */}
      <div className="bg-[#1B4332] text-white rounded-2xl p-4 mb-4">
        <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-200/80 mb-1 md:text-[6px]">YOUR ONE RECIPE</p>
        <h3 className="font-display font-light text-[22px] leading-tight mb-3 md:text-[14px]">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">🕐 {recipe.time}</span>
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">🍽 {recipe.servings}</span>
          <span className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full">✦ {recipe.difficulty}</span>
        </div>
      </div>

      {/* You have / You might need */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[13px] font-bold text-[#1C1917] mb-1">✓ You have</p>
          {recipe.youHave.map((item) => (
            <p key={item} className="text-[12px] text-stone-600">• {item}</p>
          ))}
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#1C1917] mb-1">You might need</p>
          {recipe.youMightNeed.map((item) => (
            <p key={item} className="text-[12px] text-stone-600">• {item} <span className="text-stone-400">(pantry staple)</span></p>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <p className="text-[13px] font-bold text-[#1C1917] mb-1">Ingredients</p>
      <div className="mb-4">
        {recipe.ingredients.map((item) => (
          <p key={item} className="text-[12px] text-stone-600">• {item}</p>
        ))}
      </div>

      {/* Steps */}
      <p className="text-[13px] font-bold text-[#1C1917] mb-2">Steps</p>
      <div className="space-y-3 mb-4">
        {recipe.steps.map((step, index) => (
          <div key={index} className="flex gap-2.5">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#1B4332] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{index + 1}</span>
            <p className="text-[12px] text-stone-600 leading-relaxed"><span className="font-bold text-[#1C1917]">Step {index + 1}:</span> {step}</p>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="bg-[#FEF9E7] border border-amber-100 rounded-2xl p-3 mb-4">
        <p className="text-[12px] text-stone-600">💡 <span className="font-bold text-[#1C1917]">Tip:</span> {recipe.tip}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={onGenerateAnother} className="flex-1 md:text-[9px] h-11 bg-[#1B4332] hover:bg-[#143325] text-white text-[14px] font-light rounded-full transition active:scale-95">
          Generate Another
        </button>
        <button onClick={onClear} className="flex-1 h-11 md:text-[9px] bg-white border border-stone-200 text-[#1C1917] text-[14px] font-light rounded-full transition active:scale-95">
          Clear
        </button>
      </div>

      <p className="text-center text-[11px] text-stone-400 mt-3">Variation {recipe.variation} - Made from exactly what you entered.</p>
    </div>
  );
}

// MOCK DATA - This is what "passes" the screenshot
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
    steps: [
      "Wash and prepare everything: chop the garlic, and keep the rest close by.",
      "Heat the oil in a large pot or pan on medium-high heat.",
      "Add the longest-cooking ingredient first and cook for 5-7 minutes, stirring often.",
      "Add the remaining ingredients, season with salt and pepper, and stir well.",
      "Cover and cook on low heat for 10-12 minutes until everything is tender.",
      "Taste, adjust the seasoning, rest for 3 minutes, and serve hot."
    ],
    tip: "Start with the ingredient that takes longest to cook, then add the quick ones last.",
    variation: 1
  },
  {
    id: 2,
    title: "Garlic Fried Rice",
    time: "20 mins",
    servings: "2 servings",
    difficulty: "Easy",
    youHave: ["Garlic"],
    youMightNeed: ["Rice", "Oil", "Salt", "Eggs"],
    ingredients: ["2 cloves Garlic", "2 cups Cooked Rice"],
    steps: [
      "Heat oil in a pan on high heat.",
      "Add garlic and fry until golden and fragrant.",
      "Add cold rice and break up any clumps.",
      "Push rice aside, scramble in the eggs, then mix together.",
      "Season with salt, toss well, and serve hot."
    ],
    tip: "Use cold, day-old rice — it fries up crispier and won't go mushy.",
    variation: 2
  }
];
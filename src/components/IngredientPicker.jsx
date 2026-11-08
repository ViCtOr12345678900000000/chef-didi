import { Search, PlusCircleIcon, Delete, Clock, CookingPot, Salad, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import AIResponse, { MOCK_RECIPES } from "./AIResponse";

export default function IngredientPicker() {
  const [ingPicker, setIngPicker] = useState([])
  const [dietMode, setDietMode] = useState("normal") // "normal" | "weightloss"

  const handleAdd = (ing) => {
    setIngPicker((prev) => {
      if (prev.includes(ing)) return prev;
      return [...prev, ing];
    });
  }

  const [inputValue, setInputValue] = useState("")

  const addBtn = () => {
    if (!inputValue.trim()) return
    handleAdd(inputValue.trim())
    setInputValue("")
  }

  const clearBtn = () => {
    setIngPicker([])
  }

  const handleDelete = (ingToDelete) => {
    setIngPicker(prev => prev.filter(item => item !== ingToDelete))
  }

  const [isLoading, setIsLoading] = useState(false)
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState("")

const handleFindMeal = async () => {
  if (ingPicker.length === 0) return;
  setRecipe(null);
  setError("");
  setIsLoading(true);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingPicker, mode: dietMode }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRecipe(data.recipe);
      setIsLoading(false);
      return;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === 2) {
        if (err.name === "AbortError") {
          setError("Didi timed out after 25s. Google is slow right now.");
        } else {
          setError(err.message);
        }
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  setIsLoading(false);
};

const handleGenerateAnother = async () => {
  setError("");
  setIsLoading(true);
  try {
    const res = await fetch("/api/generate-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ingredients: ingPicker, 
        exclude: recipe?.title,
        mode: dietMode
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setRecipe(data.recipe);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleClearRecipe = () => {
    setRecipe(null);
    setIngPicker([]);
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF9F0] bg-[radial-gradient(#EDE6D6_1px,transparent_1px)] [background-size:24px_24px]">
      
      {/* HEADER */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-10 pb-2 text-center">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#1B4332] uppercase bg-[#E9EFEA] border border-[#D6E4D6] rounded-full px-4 py-1.5 shadow-sm">✦ No waste • Use what you have</p>
        <h1 className="font-display text-[34px] md:text-[46px] lg:text-[52px] leading-[1.05] text-[#1C1917] mt-4">
          What’s in your kitchen? <br className="md:hidden" /><span className="italic font-light text-[#1B4332]">Didi will cook it.</span>
        </h1>
        <p className="text-[14px] md:text-[15px] text-stone-500 mt-3 max-w-[620px] mx-auto leading-relaxed">
          Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real Nigerian recipe with real cooking times. No more “what will I eat today?”
        </p>
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <span className="text-[12px] font-semibold bg-white border border-stone-200/80 shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><CookingPot size={12} className="text-[#1B4332]" /> 120+ Recipes</span>
          <span className="text-[12px] font-semibold bg-white border border-stone-200/80 shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><Clock size={12} className="text-[#B7791F]" /> Real Times</span>
          <span className="text-[12px] font-semibold bg-[#1B4332] text-white shadow-md rounded-full px-3.5 py-1.5">🇳🇬 Nigerian First</span>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">

        {/* 1. Add Ingredients */}
        <div className="w-full bg-white/90 backdrop-blur border border-[#EDE6D6] rounded-[28px] p-5 md:p-6 lg:p-7 shadow-[0_10px_35px_rgba(28,25,23,0.06)]">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="font-display w-9 h-9 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-[14px] font-semibold flex items-center justify-center shadow-md">1</span>
            <h2 className="font-display font-light text-[21px] lg:text-[23px] text-[#1C1917]">Add Ingredients</h2>
            <span className="ml-auto text-[10px] font-bold tracking-wider text-[#B7791F] bg-[#FFF3D6] border border-[#F5E0A0] px-2 py-1 rounded-full">FRESH</span>
          </div>

          <div className="flex gap-2 mb-5">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addBtn() }}
              placeholder="e.g. Chicken, Rice, Tomato..."
              className="flex-1 min-w-0 h-12 px-4 bg-[#FFFBF5] border border-stone-200 rounded-full text-[14px] font-medium outline-none placeholder:text-stone-400 placeholder:font-light focus:border-[#1B4332] focus:ring-4 focus:ring-[#1B4332]/10 focus:bg-white transition"
            />
            <button
              onClick={addBtn}
              className="shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] active:scale-95 transition text-white rounded-full shadow-lg shadow-emerald-900/25">
              <PlusCircleIcon size={22} />
            </button>
          </div>

          <p className="text-[11px] md:text-[12px] font-bold tracking-wider text-stone-400 uppercase mb-3">Quick add — tap to add</p>
          <div className="flex flex-wrap gap-2">
            {['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt'].map((item) => (
              <button onClick={() => handleAdd(item)} key={item} className="text-[13px] font-semibold px-3.5 md:px-4 py-1.5 md:py-2 rounded-full border transition active:scale-95 bg-[#FFFBF5] text-stone-700 border-stone-200 hover:border-[#1B4332] hover:bg-[#1B4332] hover:text-white">
                + {item}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Your Ingredients + DIET TOGGLE */}
        <div className="w-full bg-white/90 backdrop-blur border border-[#EDE6D6] rounded-[28px] p-5 md:p-6 lg:p-7 shadow-[0_10px_35px_rgba(28,25,23,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="font-display w-9 h-9 rounded-full bg-gradient-to-br from-[#B7791F] to-[#D99A2B] text-white text-[14px] font-semibold flex items-center justify-center shadow-md">2</span>
              <h2 className="font-display font-light text-[21px] lg:text-[23px] text-[#1C1917]">Your Ingredients</h2>
            </div>
            {ingPicker.length > 0 && (
              <span className="text-[11px] font-bold bg-[#1B4332] text-white px-2.5 py-1 rounded-full">{ingPicker.length} picked</span>
            )}
          </div>

          {ingPicker.length === 0 ? (
            <div className="bg-[#FFFBF5] border border-dashed border-stone-200 rounded-2xl py-6 px-3 text-center mb-4">
              <p className="text-[22px] mb-1">🧺</p>
              <p className="text-[13px] font-medium text-stone-500">No ingredients yet.</p>
              <p className="text-[12px] text-stone-400">Add one above, or tap a quick chip.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {ingPicker.map((i) => (
                <div key={i} className="text-[13px] font-semibold px-3 py-1.5 rounded-full bg-[#E9EFEA] text-[#1B4332] border border-[#D6E4D6] gap-1.5 items-center flex shadow-sm">
                  <button onClick={() => handleDelete(i)} className="rounded-full text-[10px] font-bold bg-white hover:bg-red-500 hover:text-white text-stone-500 w-5 h-5 flex items-center justify-center shadow-sm transition">✕</button> {i}
                </div>
              ))}
            </div>
          )}

          {/* --- NEW: NORMAL / WEIGHT LOSS TOGGLE --- */}
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">How do you want Didi to cook?</p>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FFFBF5] border border-stone-200 rounded-full mb-4">
            <button
              onClick={() => setDietMode("normal")}
              className={`h-11 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${dietMode === "normal" ? "bg-[#1B4332] text-white shadow-md shadow-emerald-900/25" : "text-stone-500 hover:text-[#1C1917]"}`}
            >
              <UtensilsCrossed size={15} /> Normal
            </button>
            <button
              onClick={() => setDietMode("weightloss")}
              className={`h-11 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${dietMode === "weightloss" ? "bg-gradient-to-r from-[#2D6A4F] to-[#74C69D] text-white shadow-md shadow-emerald-900/25" : "text-stone-500 hover:text-[#1C1917]"}`}
            >
              <Salad size={16} /> Weight Loss
            </button>
          </div>
          <p className="text-[12px] text-center text-stone-400 mb-4 -mt-1">
            {dietMode === "weightloss" ? "🥗 Less oil • Grilled/boiled • Small portion • High protein" : "🍲 Normal oil • Normal portion • Full Nigerian flavour"}
          </p>

          <button
            onClick={handleFindMeal}
            disabled={isLoading || ingPicker.length === 0}
            className={`font-display w-full h-[52px] lg:h-14 rounded-full font-medium text-[16px] flex items-center justify-center gap-2 transition tracking-wide ${ingPicker.length === 0 || isLoading ? "bg-stone-100 text-stone-400" : dietMode === "weightloss" ? "bg-gradient-to-r from-[#2D6A4F] to-[#74C69D] text-white hover:shadow-xl hover:shadow-emerald-900/25 active:scale-[0.98] shadow-lg" : "bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white hover:shadow-xl hover:shadow-emerald-900/25 active:scale-[0.98] shadow-lg"}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding your meal...</span>
            ) : <><Search size={18} /> Find Meal {dietMode === "weightloss" ? "🥗" : ""}</>}
          </button>

          <div className="flex items-center justify-between mt-4">
            <button onClick={clearBtn} className="text-[12px] font-semibold text-stone-400 hover:text-red-500 flex items-center gap-1 transition"><Delete size={14} /> Clear all</button>
            <p className="text-[12px] text-[#1B4332] font-semibold">{ingPicker.length === 0 ? "Your basket is empty" : dietMode === "weightloss" ? "Light mode on 🥗" : "Ready to cook 🍲"}</p>
          </div>
        </div>

        {/* 3. AI Response */}
        <div className="w-full space-y-4 md:max-h-[560px] md:overflow-y-auto md:pr-1 md:pb-1">
          {isLoading && (
            <div className="bg-white border border-[#EDE6D6] rounded-[28px] p-5 md:p-6 shadow-md animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-full bg-[#E9EFEA] flex items-center justify-center text-[14px] font-semibold text-[#1B4332]">3</span>
                <h2 className="font-display font-light text-[21px]"> <span className="italic text-[#1B4332]">Didi's</span> Response</h2>
              </div>
              <div className="bg-gradient-to-r from-[#E9EFEA] to-[#FFF3D6] rounded-2xl h-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-stone-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-stone-100 rounded-full w-full"></div>
                <div className="h-3 bg-stone-100 rounded-full w-1/2"></div>
              </div>
              <p className="text-center text-[12px] text-stone-400 font-bold mt-4">👩🏾‍🍳 Cooking up your recipe...</p>
            </div>
          )}

          {recipe && !isLoading && (
            <AIResponse
              recipe={recipe}
              onGenerateAnother={handleGenerateAnother}
              onClear={handleClearRecipe}
            />
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-[24px] p-5 text-center text-[13px] text-red-600 font-semibold shadow-sm">
              {error}
            </div>
          )}

          {!recipe && !isLoading && (
            <div className="bg-white/90 border border-[#EDE6D6] rounded-[28px] p-5 md:p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-full bg-[#E9EFEA] flex items-center justify-center text-[14px] font-semibold text-[#1B4332]">3</span>
                <h2 className="font-display font-light text-[21px]"> <span className="italic text-[#1B4332]">Didi's</span> Response</h2>
              </div>
              <div className="bg-[#FFFBF5] border border-dashed border-stone-200 rounded-2xl py-8 px-3 text-center">
                <p className="text-[28px] mb-1">🍲</p>
                <p className="text-[14px] font-semibold text-stone-600">Your recipe will appear here.</p>
                <p className="text-[12px] text-stone-400 mt-1">Pick ingredients → Choose mode → Find Meal</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM INFO */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white border border-[#EDE6D6] rounded-[24px] p-5 shadow-sm hover:-translate-y-1 transition">
          <p className="text-[22px]">👩🏾‍🍳</p>
          <h3 className="font-display text-[17px] mt-2">How Didi Works</h3>
          <p className="text-[13px] md:text-[14px] text-stone-500 mt-1.5 leading-relaxed">1. Add ingredients you already have. 2. Pick Normal or Weight Loss. 3. You get a recipe with honest time + steps.</p>
        </div>
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-[24px] p-5 text-white shadow-lg hover:-translate-y-1 transition">
          <p className="text-[22px]">💡</p>
          <h3 className="font-display text-[17px] mt-2">Didi’s Tip of the Day</h3>
          <p className="text-[13px] md:text-[14px] text-white/85 mt-1.5 leading-relaxed">Always parboil your rice for concoction rice — it stops it from getting soggy and sticking together.</p>
        </div>
        <div className="bg-white border border-[#EDE6D6] rounded-[24px] p-5 shadow-sm hover:-translate-y-1 transition">
          <p className="text-[22px]">🔥</p>
          <h3 className="font-display text-[17px] mt-2">Popular Right Now</h3>
          <p className="text-[13px] md:text-[14px] text-stone-500 mt-1.5 leading-relaxed">Chicken + Rice • Yam + Eggs • Beans + Plantain • Pasta + Chicken. Tap the chips above to try one fast.</p>
        </div>
      </div>

    </div>
  );
}
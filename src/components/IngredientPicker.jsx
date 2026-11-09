import { Search, PlusCircleIcon, Delete, Clock, CookingPot, Salad, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import AIResponse, { MOCK_RECIPES } from "./AIResponse";

export default function IngredientPicker() {
  const [ingPicker, setIngPicker] = useState([])
  const [dietMode, setDietMode] = useState("normal")
  const handleAdd = (ing) => { setIngPicker((prev) => prev.includes(ing) ? prev : [...prev, ing]); }
  const [inputValue, setInputValue] = useState("")
  const addBtn = () => { if (!inputValue.trim()) return; handleAdd(inputValue.trim()); setInputValue(""); }
  const clearBtn = () => { setIngPicker([]) }
  const handleDelete = (ingToDelete) => { setIngPicker(prev => prev.filter(item => item !== ingToDelete)) }
  const [isLoading, setIsLoading] = useState(false)
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState("")

const handleFindMeal = async () => {
  if (ingPicker.length === 0) return;
  setRecipe(null); setError(""); setIsLoading(true);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch("/api/generate-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: ingPicker, mode: dietMode }), signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRecipe(data.recipe); setIsLoading(false); return;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === 2) setError(err.name === "AbortError" ? "Didi timed out after 25s. Google is slow right now." : err.message);
      else await new Promise(r => setTimeout(r, 2000));
    }
  }
  setIsLoading(false);
};
const handleGenerateAnother = async () => {
  setError(""); setIsLoading(true);
  try {
    const res = await fetch("/api/generate-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: ingPicker, exclude: recipe?.title, mode: dietMode }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setRecipe(data.recipe);
  } catch (err) { setError(err.message); } finally { setIsLoading(false); }
};
  const handleClearRecipe = () => { setRecipe(null); setIngPicker([]); setIsLoading(false); };

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-2 pb-2 text-center">
        <h1 className="font-display text-[34px] md:text-[48px] lg:text-[52px] leading-[1.05] text-[#1A1A2E]">
          What’s in your kitchen? <br /><span className="italic font-light bg-gradient-to-r from-[#7B61FF] via-[#9B8CFF] to-[#C9B8FF] bg-clip-text text-transparent">Didi will cook it.</span>
        </h1>
        <p className="text-[14px] md:text-[15px] text-stone-500 mt-3 max-w-[620px] mx-auto leading-relaxed">
          Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real Nigerian recipe with real cooking times. No more “what will I eat today?”
        </p>
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <span className="text-[12px] font-semibold bg-white border border-[#E6E0FF] shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><CookingPot size={12} className="text-[#7B61FF]" /> 120+ Recipes</span>
          <span className="text-[12px] font-semibold bg-white border border-[#E6E0FF] shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><Clock size={12} className="text-[#9B8CFF]" /> Real Times</span>
          <span className="text-[12px] font-semibold bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white shadow-md shadow-violet-300/40 rounded-full px-3.5 py-1.5">🇳🇬 Nigerian First</span>
        </div>
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">

        {/* 1 */}
        <div className="w-full bg-white border border-[#EDEAFF] rounded-[28px] p-5 md:p-6 lg:p-7 shadow-[0_10px_35px_rgba(123,97,255,0.08)]">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#C9B8FF] text-white text-[14px] font-semibold flex items-center justify-center shadow-md shadow-violet-300/40">1</span>
            <h2 className="font-display font-light text-[21px] lg:text-[23px] text-[#1A1A2E]">Add Ingredients</h2>
            <span className="ml-auto text-[10px] font-bold tracking-wider text-[#5A3EC8] bg-[#F5F0FF] border border-[#E6E0FF] px-2 py-1 rounded-full">FRESH</span>
          </div>
          <div className="flex gap-2 mb-5">
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addBtn() }} placeholder="e.g. Chicken, Rice, Tomato..." className="flex-1 min-w-0 h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] font-medium outline-none placeholder:text-stone-400 placeholder:font-light focus:border-[#7B61FF] focus:ring-4 focus:ring-[#7B61FF]/10 focus:bg-white transition" />
            <button onClick={addBtn} className="shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br from-[#7B61FF] to-[#9B8CFF] hover:opacity-90 active:scale-95 transition text-white rounded-full shadow-lg shadow-violet-300/40"><PlusCircleIcon size={22} /></button>
          </div>
          <p className="text-[11px] md:text-[12px] font-bold tracking-wider text-stone-400 uppercase mb-3">Quick add — tap to add</p>
          <div className="flex flex-wrap gap-2">
            {['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt'].map((item) => (
              <button onClick={() => handleAdd(item)} key={item} className="text-[13px] font-semibold px-3.5 md:px-4 py-1.5 md:py-2 rounded-full border transition active:scale-95 bg-[#FBFAFF] text-stone-700 border-[#EDEAFF] hover:border-[#7B61FF] hover:bg-[#F5F0FF] hover:text-[#5A3EC8]">+ {item}</button>
            ))}
          </div>
          <div className="mt-5 bg-[#F5F0FF] border border-[#EDEAFF] rounded-2xl p-3 flex items-center gap-2">
            <span className="text-[16px]">💡</span>
            <p className="text-[12px] text-stone-500 leading-snug">Tip: Add <b className="text-[#1A1A2E]">3-5 ingredients</b> for the best recipe. Didi loves combos.</p>
          </div>
        </div>

        {/* 2 */}
        <div className="w-full bg-white border border-[#EDEAFF] rounded-[28px] p-5 md:p-6 lg:p-7 shadow-[0_10px_35px_rgba(123,97,255,0.08)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9B8CFF] to-[#C9B8FF] text-white text-[14px] font-semibold flex items-center justify-center shadow-md shadow-violet-300/40">2</span>
              <h2 className="font-display font-light text-[21px] lg:text-[23px] text-[#1A1A2E]">Your Ingredients</h2>
            </div>
            {ingPicker.length > 0 && <span className="text-[11px] font-bold bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white px-2.5 py-1 rounded-full">{ingPicker.length} picked</span>}
          </div>
          {ingPicker.length === 0 ? (
            <div className="bg-[#FBFAFF] border border-dashed border-[#EDEAFF] rounded-2xl py-6 px-3 text-center mb-4">
              <p className="text-[22px] mb-1">🧺</p>
              <p className="text-[13px] font-medium text-stone-500">No ingredients yet.</p>
              <p className="text-[12px] text-stone-400">Add one above, or tap a quick chip.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {ingPicker.map((i) => (
                <div key={i} className="text-[13px] font-semibold px-3 py-1.5 rounded-full bg-[#F5F0FF] text-[#5A3EC8] border border-[#E6E0FF] gap-1.5 items-center flex shadow-sm">
                  <button onClick={() => handleDelete(i)} className="rounded-full text-[10px] font-bold bg-white hover:bg-[#7B61FF] hover:text-white text-stone-500 w-5 h-5 flex items-center justify-center transition">✕</button> {i}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">How do you want Didi to cook?</p>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full mb-4">
            <button onClick={() => setDietMode("normal")} className={`h-11 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${dietMode === "normal" ? "bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white shadow-md shadow-violet-300/40" : "text-stone-500 hover:text-[#1A1A2E]"}`}><UtensilsCrossed size={15} /> Normal</button>
            <button onClick={() => setDietMode("weightloss")} className={`h-11 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${dietMode === "weightloss" ? "bg-gradient-to-r from-[#2EBD7A] to-[#A8E6C5] text-white shadow-md shadow-emerald-300/40" : "text-stone-500 hover:text-[#1A1A2E]"}`}><Salad size={16} /> Weight Loss</button>
          </div>
          <p className="text-[12px] text-center text-stone-400 mb-4 -mt-1">{dietMode === "weightloss" ? "🥗 Less oil • Grilled/boiled • Small portion • High protein" : "🍵 Normal oil • Normal portion • Full Nigerian flavour"}</p>
          <button onClick={handleFindMeal} disabled={isLoading || ingPicker.length === 0} className={`w-full h-[52px] lg:h-14 rounded-full font-medium text-[16px] flex items-center justify-center gap-2 transition tracking-wide ${ingPicker.length === 0 || isLoading ? "bg-stone-100 text-stone-400" : dietMode === "weightloss" ? "bg-gradient-to-r from-[#2EBD7A] to-[#A8E6C5] text-white hover:shadow-xl active:scale-[0.98] shadow-lg" : "bg-gradient-to-r from-[#7B61FF] via-[#9B8CFF] to-[#C9B8FF] text-white hover:shadow-xl hover:shadow-violet-300/40 active:scale-[0.98] shadow-lg"}`}>
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding your meal...</span> : <><Search size={18} /> Find Meal {dietMode === "weightloss" ? "🥗" : ""}</>}
          </button>
          <div className="flex items-center justify-between mt-4">
            <button onClick={clearBtn} className="text-[12px] font-semibold text-stone-400 hover:text-[#7B61FF] flex items-center gap-1 transition"><Delete size={14} /> Clear all</button>
            <p className="text-[12px] text-[#1A1A2E] font-semibold">{ingPicker.length === 0 ? "Your basket is empty" : dietMode === "weightloss" ? "Light mode on 🥗" : "Ready to cook 🍵"}</p>
          </div>
        </div>

        {/* 3 */}
        <div className="w-full space-y-4 md:max-h-[560px] md:overflow-y-auto md:pr-1 md:pb-1">
          {isLoading && (
            <div className="bg-white border border-[#EDEAFF] rounded-[28px] p-5 md:p-6 shadow-md animate-pulse">
              <div className="flex items-center gap-2 mb-4"><span className="w-9 h-9 rounded-full bg-[#F5F0FF] flex items-center justify-center text-[14px] font-semibold text-[#5A3EC8]">3</span><h2 className="font-display font-light text-[21px]"> <span className="italic text-[#5A3EC8]">Didi's</span> Response</h2></div>
              <div className="bg-gradient-to-r from-[#EDEAFF] to-[#F5F0FF] rounded-2xl h-32 mb-4"></div>
              <div className="space-y-2"><div className="h-3 bg-stone-100 rounded-full w-3/4"></div><div className="h-3 bg-stone-100 rounded-full w-full"></div><div className="h-3 bg-stone-100 rounded-full w-1/2"></div></div>
              <p className="text-center text-[12px] text-stone-400 font-bold mt-4">👩🏾‍🍳 Cooking up your recipe...</p>
            </div>
          )}
          {recipe && !isLoading && <AIResponse recipe={recipe} onGenerateAnother={handleGenerateAnother} onClear={handleClearRecipe} />}
          {error && !isLoading && <div className="bg-red-50 border border-red-200 rounded-[24px] p-5 text-center text-[13px] text-red-600 font-semibold shadow-sm">{error}</div>}
          {!recipe && !isLoading && (
            <div className="bg-white border border-[#EDEAFF] rounded-[28px] p-5 md:p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4"><span className="w-9 h-9 rounded-full bg-[#F5F0FF] flex items-center justify-center text-[14px] font-semibold text-[#5A3EC8]">3</span><h2 className="font-display font-light text-[21px]"> <span className="italic text-[#5A3EC8]">Didi's</span> Response</h2></div>
              <div className="bg-[#FBFAFF] border border-dashed border-[#EDEAFF] rounded-2xl py-8 px-3 text-center"><p className="text-[28px] mb-1">🍵</p><p className="text-[14px] font-semibold text-stone-600">Your recipe will appear here.</p><p className="text-[12px] text-stone-400 mt-1">Pick ingredients → Choose mode → Find Meal</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-6 pb-12 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white border border-[#EDEAFF] rounded-[24px] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition"><p className="text-[22px]">👩🏾‍🍳</p><h3 className="font-display text-[17px] mt-2 text-[#1A1A2E]">How Didi Works</h3><p className="text-[13px] md:text-[14px] text-stone-500 mt-1.5 leading-relaxed">1. Add ingredients you already have. 2. Pick Normal or Weight Loss. 3. You get a recipe with honest time + steps.</p></div>
        <div className="bg-gradient-to-br from-[#7B61FF] via-[#9B8CFF] to-[#C9B8FF] rounded-[24px] p-5 text-white shadow-lg shadow-violet-300/40 hover:-translate-y-1 transition"><p className="text-[22px]">💡</p><h3 className="font-display text-[17px] mt-2">Didi’s Tip of the Day</h3><p className="text-[13px] md:text-[14px] text-white/90 mt-1.5 leading-relaxed">Always parboil your rice for concoction rice — it stops it from getting soggy and sticking together.</p></div>
        <div className="bg-[#F5F0FF] border border-[#EDEAFF] rounded-[24px] p-5 hover:-translate-y-1 transition"><p className="text-[22px]">🔥</p><h3 className="font-display text-[17px] mt-2 text-[#1A1A2E]">Popular Right Now</h3><p className="text-[13px] md:text-[14px] text-stone-500 mt-1.5 leading-relaxed">Chicken + Rice • Yam + Eggs • Beans + Plantain • Pasta + Chicken. Tap the chips above to try one fast.</p></div>
      </div>
    </div>
  );
}
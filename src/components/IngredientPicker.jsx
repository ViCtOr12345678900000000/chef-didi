import { Search, PlusCircleIcon, Delete } from "lucide-react";
import { useState } from "react";
import AIResponse, { MOCK_RECIPES } from "./AIResponse";

export default function IngredientPicker() {
  const [ingPicker, setIngPicker] = useState([])
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleFindMeal = async () => {
  if (ingPicker.length === 0) return;
  setRecipe(null);
  setError("");
  setIsLoading(true);

  // Try up to 2 times, max 25 seconds per try
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingPicker }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRecipe(data.recipe);
      setIsLoading(false);
      return; // success, stop trying
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === 2) {
        if (err.name === "AbortError") {
          setError("Didi is taking too long — Google is busy right now. Please try again in 30 seconds.");
        } else {
          setError("Didi is busy. Please wait 30 seconds and try again.");
        }
      } else {
        // First try failed, wait 2 seconds and try again automatically
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
        exclude: recipe?.title
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setRecipe(data.recipe);
  } catch (err) {
    setError("Couldn't cook another one. Try again.");
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
    <div className="w-full flex flex-col items-center px-4 bg-inherit bg-[radial-gradient(#E9EFEA_1px,transparent_1px)] [background-size:22px_22px]">
      
      {/* HEADER */}
      <div className="w-full max-w-[1250px] mx-auto pt-8 pb-2 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B4332] uppercase">No waste • Use what you have</p>
        <h1 className="font-display text-[32px] md:text-[42px] leading-tight text-[#1C1917] mt-2">
          What’s in your kitchen? <span className="italic text-[#1B4332]">Didi will cook it.</span>
        </h1>
        <p className="text-[14px] text-stone-500 mt-2 max-w-[600px] mx-auto">
          Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real Nigerian recipe with real cooking times. No more “what will I eat today?”
        </p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <span className="text-[12px] bg-white border border-stone-200 rounded-full px-3 py-1.5">🍚 120+ Recipes</span>
          <span className="text-[12px] bg-white border border-stone-200 rounded-full px-3 py-1.5">⏱️ Real Times</span>
          <span className="text-[12px] bg-white border border-stone-200 rounded-full px-3 py-1.5">🇳🇬 Nigerian First</span>
        </div>
      </div>

      <div className="w-full flex justify-center px-4">
      <div className="w-full max-w-[1250px] mx-auto py-6 grid grid-cols-1 gap-4 md:flex md:w-500  md:flex-row md:items-start md:justify-center md:gap-4 lg:gap-6">

        {/* 1. Add Ingredients */}
        <div className="w-full  min-w-0 md:flex-1 lg:flex-none  lg:w-[400px] lg:shrink-0 bg-white border border-stone-200 rounded-3xl p-5 md:p-6 lg:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <span className="font-display w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E9EFEA] text-[#1B4332] text-[13px] md:text-[14px] font-semibold flex items-center justify-center">1</span>
            <h2 className="font-display font-light text-[19px] md:text-[14px] lg:text-[22px] text-[#1C1917]  ">Add Ingredients</h2>
          </div>

          <div className="flex gap-2 mb-4 md:mb-5">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addBtn() }}
              placeholder="e.g. Chicken, Rice, Tomato..."
              className="flex-1 min-w-0 h-11 md:h-12 px-4 bg-[#FAF9F7] border border-stone-200 rounded-full text-[14px] md:text-[px] font-semibold outline-none placeholder:text-stone-400 placeholder:font-light focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10"
            />
            <button
              onClick={addBtn}
              className="font-display shrink-0 h-11 md:h-12 px-5 bg-[#1B4332] hover:bg-[#143325] active:scale-95 transition text-white font-light text-[15px]  rounded-full shadow-md shadow-emerald-900/20">
              <PlusCircleIcon size={20} />
            </button>
          </div>

          <p className="text-[12px] md:text-[13px] font-bold text-stone-500 mb-2 md:mb-3">Quick add</p>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt'].map((item) => (
              <button onClick={() => handleAdd(item)} key={item} className="text-[13px] md:text-[9px] font-bold px-3.5 md:px-4 py-1.5 md:py-2 rounded-full border transition active:scale-95 bg-white text-stone-700 border-stone-200 hover:border-[#1B4332] hover:bg-[#F2F5F3] font-light">
                + {item}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Your Ingredients */}
        <div className="w-full min-w-0 md:flex-1 lg:flex-none md:w-[100px] lg:w-[380px] lg:shrink-0 bg-white border border-stone-200 rounded-3xl p-5 md:p-6 lg:p-7 h-90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-2">
              <span className="font-display w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E9EFEA] text-[#1B4332] text-[13px] md:text-[14px] font-semibold flex items-center justify-center">2</span>
              <h2 className="font-display font-light text-[19px] md:text-[14px] lg:text-[22px] text-[#1C1917]">Your Ingredients</h2>
            </div>

            {ingPicker.length > 0 && (
              <button
                onClick={clearBtn}
                className="text-[12px] font-bold px-3 py-1.5 bg-[#E9EFEA] text-[#1B4332] rounded-full hover:bg-[#DDE8DE] text-[15px] transition active:scale-95"
              >
                <Delete size={20} />
              </button>
            )}
          </div>

          {ingPicker.length === 0 ? (
            <div className="bg-[#FAF9F7] border border-stone-100 rounded-2xl py-4 md:py-5 px-3 text-center mb-4">
              <p className="text-[13px] md:text-[9px] font-semibold text-stone-500">No ingredients yet. Add one above, or tap a quick chip.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 md:gap-2.5 mb-4">
              {ingPicker.map((i) => (
                <div key={i} className="text-[13px] md:text-[9px] font-bold px-3.5 py-1.5 rounded-full bg-[#E9EFEA] text-[#1B4332] gap-1 font-light items-center flex">
                  <button onClick={() => handleDelete(i)} className="border rounded-full text-[9px] bg-emerald-50 hover:bg-red-400 hover:text-white hover:border-red-400 text-stone-600 border-stone-600 w-4 h-4 items-center">
                    x
                  </button> {i}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleFindMeal}
            disabled={isLoading || ingPicker.length === 0}
            className={`font-display w-full h-12 lg:h-14 rounded-full font-light text-[16px] md:text-[9px] flex items-center justify-center gap-2 transition tracking-wide ${ingPicker.length === 0 || isLoading ? "bg-stone-100 text-stone-400" : "bg-[#1B4332] text-white hover:bg-[#143325] active:scale-95"}`}
          >
            {isLoading ? "Finding your meal..." : <><Search size={18} /> Find Meal</>}
          </button>

          {ingPicker.length === 0 && (
            <p className="text-center text-[12px] md:text-[9px] text-[#1B4332] font-bold mt-3">
              Your ingredients are cleared.
            </p>
          )}
        </div>

        {/* 3. AI Response */}
        <div className="w-full min-w-0 md:flex-1 lg:flex-none lg:w-[430px] lg:shrink-0 md:max-h-[520px] md:w-[350px] md:overflow-y-auto md:pr-1 md:pb-1 space-y-4 rounded-2xl">
          {isLoading && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-6 lg:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E9EFEA] flex items-center justify-center text-[13px] md:text-[14px] font-semibold text-[#1B4332]">3</span>
                <h2 className="font-display font-light text-[19px] md:text-[14px] lg:text-[22px]"> <span className="italic font-light text-[#1B4332]">Didi's</span> Response</h2>
              </div>
              <div className="bg-[#E9EFEA] rounded-2xl h-28 md:h-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-stone-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-stone-100 rounded-full w-full"></div>
                <div className="h-3 bg-stone-100 rounded-full w-1/2"></div>
              </div>
              <p className="text-center text-[12px] md:text-[13px] text-stone-400 font-bold mt-4">Cooking up your recipe...</p>
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
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-center text-[13px] text-red-600 font-bold">
              {error}
            </div>
          )}

          {!recipe && !isLoading && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-6 lg:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E9EFEA] flex items-center justify-center text-[13px] md:text-[14px] font-semibold text-[#1B4332]">3</span>
                <h2 className="font-display font-light text-[19px] md:text-[21px] lg:text-[22px]"> <span className="italic font-light text-[#1B4332]">Didi's</span> Response</h2>
              </div>
              <div className="bg-[#FAF9F7] border border-stone-100 rounded-2xl py-6 md:py-8 px-3 text-center">
                <p className="text-[13px] md:text-[14px] font-semibold text-stone-500">Your recipe will appear here.</p>
              </div>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* BOTTOM INFO */}
      <div className="w-full max-w-[1250px] mx-auto pb-10 grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
        <div className="bg-white border border-stone-200 rounded-3xl p-5">
          <p className="text-[20px]">👩🏾‍🍳</p>
          <h3 className="font-display text-[17px] mt-1">How Didi Works</h3>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">1. Add ingredients you already have. 2. Didi checks what’s possible. 3. You get a recipe with honest time + steps. No fancy ingredients.</p>
        </div>
        <div className="bg-[#1B4332] rounded-3xl p-5 text-white">
          <p className="text-[20px]">💡</p>
          <h3 className="font-display text-[17px] mt-1">Didi’s Tip of the Day</h3>
          <p className="text-[13px] text-white/80 mt-1 leading-relaxed">Always parboil your rice for concoction rice — it stops it from getting soggy and sticking together.</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-3xl p-5">
          <p className="text-[20px]">🔥</p>
          <h3 className="font-display text-[17px] mt-1">Popular Right Now</h3>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">Chicken + Rice • Yam + Eggs • Beans + Plantain • Pasta + Chicken. Tap the chips above to try one fast.</p>
        </div>
      </div>

    </div>
  );
}
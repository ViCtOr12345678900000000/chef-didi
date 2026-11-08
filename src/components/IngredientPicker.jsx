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
  try {
    const res = await fetch("/api/generate-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingPicker }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setRecipe(data.recipe);
  } catch (err) {
    setError("Couldn't cook that up. Try again. " + (err.message || ""));
  } finally {
    setIsLoading(false);
  }
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
    <div className="w-full flex justify-center px-4">
      {/* FIXED FOR MD:
          mobile: stacked
          md: 3 across BUT flexible, fits 768px - no cut off
          lg: 3 across with your big widths */}
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

        {/* 3. AI Response - scrolls inside on md + lg, full height on mobile */}
        <div className="w-full min-w-0 md:flex-1 lg:flex-none lg:w-[430px] lg:shrink-0 md:max-h-[520px] md:w-[350px] md:overflow-y-auto md:pr-1 md:pb-1 space-y-4 rounded-2xl">
          {isLoading && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-6 lg:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E9EFEA] flex items-center justify-center text-[13px] md:text-[14px] font-semibold text-[#1B4332]">3</span>
                <h2 className="font-display font-light text-[19px] md:text-[14px] lg:text-[22px]">AI Response</h2>
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
  );
}
import { Search, PlusCircleIcon, Delete, Clock, CookingPot, UtensilsCrossed, TrendingDown, TrendingUp, Dumbbell } from "lucide-react";
import { useState, useEffect } from "react";
import AIResponse from "./AIResponse";
import Footer from "./Footer";
import SettingsBar from "./SettingsBar";
import CalorieCalculator from "./CalorieCalculator";
import { THEMES, GOALS, CUISINES, LOCATIONS, t, getPrefs, savePrefs, caloriesFor } from "../lib/didi";

const GOAL_ICONS = { normal: <UtensilsCrossed size={15} />, weightloss: <TrendingDown size={16} />, weightgain: <TrendingUp size={16} />, fit: <Dumbbell size={16} /> };

export default function IngredientPicker({ user, themeId, setThemeId, lang, setLang }) {
  const [goal, setGoal] = useState("normal");
  const [sittings, setSittings] = useState(3);
  const [customCalories, setCustomCalories] = useState(null);
  const [cuisine, setCuisine] = useState("auto");
  const [location, setLocation] = useState("nigeria");

  useEffect(() => {
    if (user?.email) {
      const p = getPrefs(user.email);
      setGoal(p.goal || "normal"); setThemeId(p.theme || "purple"); setLang(p.lang || "en");
      setSittings(p.sittings || 3); setCustomCalories(p.customCalories || null);
      setCuisine(p.cuisine || "auto"); setLocation(p.location || "nigeria");
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) savePrefs(user.email, { goal, theme: themeId, lang, sittings, customCalories, cuisine, location });
  }, [goal, themeId, lang, sittings, customCalories, cuisine, location, user?.email]);

  const theme = THEMES[themeId] || THEMES.purple;
  const cal = caloriesFor(goal, sittings, customCalories);
  const [ingPicker, setIngPicker] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");

  const handleAdd = (ing) => setIngPicker(prev => prev.includes(ing) ? prev : [...prev, ing]);
  const addBtn = () => { if (!inputValue.trim()) return; handleAdd(inputValue.trim()); setInputValue(""); };

  const callAPI = async (exclude) => {
    const res = await fetch("/api/generate-recipe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingPicker, exclude, mode: goal, sittings, caloriesPerSitting: cal.perSitting, totalCalories: cal.total, lang, customCalories: cal.total, cuisine, location }),
    });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed"); return data.recipe;
  };

  const handleFindMeal = async () => { if (!ingPicker.length) return; setRecipe(null); setError(""); setIsLoading(true); try { setRecipe(await callAPI()); } catch (e) { setError(e.message); } finally { setIsLoading(false); } };
  const handleGenerateAnother = async () => { setError(""); setIsLoading(true); try { setRecipe(await callAPI(recipe?.title)); } catch (e) { setError(e.message); } finally { setIsLoading(false); } };
  const handleAddRecipeToKcal = () => {
    if (!recipe) return; const today = new Date().toISOString().slice(0, 10);
    const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`;
    const kcalNum = parseInt(String(recipe.caloriesPerSitting || recipe.calories || "0").replace(/[^0-9]/g, "")) || 0;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, { id: Date.now(), name: recipe.title, qty: 1, unit: "serving", kcal: kcalNum, totalKcal: kcalNum }]));
    window.dispatchEvent(new Event("didi-kcal-updated")); alert(`Added ${recipe.title} • ${kcalNum} kcal to today's calculator 🔥`);
  };

  return (
    <div className={`w-full bg-gradient-to-b ${theme.page} rounded-[32px] mx-auto max-w-[1400px] relative overflow-hidden`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-white/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 pt-8 pb-2 text-center">
        <h1 className="font-display text-[34px] md:text-[48px] leading-[1.05] text-white">{t(lang, 'kitchen1')}<br /><span className="italic font-light text-white/95">{t(lang, 'kitchen2')}</span></h1>
        <p className="text-[14px] text-white/80 mt-3 max-w-[620px] mx-auto">Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real recipe.</p>
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <span className={`text-[12px] font-semibold bg-white ${theme.accent} shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5`}><CookingPot size={12} /> 120+ Recipes</span>
          <span className="text-[12px] font-semibold bg-white/15 border border-white/30 text-white rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><Clock size={12} /> Real Times</span>
          <span className={`text-[12px] font-semibold bg-white ${theme.accent} rounded-full px-3.5 py-1.5`}>🌍 World + Nigerian</span>
        </div>
      </div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 mt-5"><SettingsBar goal={goal} setGoal={setGoal} sittings={sittings} setSittings={setSittings} themeId={themeId} setThemeId={setThemeId} lang={lang} setLang={setLang} user={user} customCalories={customCalories} setCustomCalories={setCustomCalories} /></div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 mt-4"><CalorieCalculator user={user} goal={goal} themeId={themeId} lang={lang} customCalories={customCalories} /></div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className={`bg-white rounded-[28px] p-5 md:p-6 shadow-xl ${theme.shadow}`}>
          <div className="flex items-center gap-2.5 mb-5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center shadow-md`}>1</span><h2 className="font-display font-light text-[21px]">{t(lang, 'add')}</h2><span className={`ml-auto text-[10px] font-bold bg-gradient-to-r ${theme.btn} text-white px-2 py-1 rounded-full`}>FRESH</span></div>
          <div className="flex gap-2 mb-5"><input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBtn()} placeholder="e.g. Chicken, Rice, Tomato..." className={`flex-1 min-w-0 h-12 px-4 ${theme.softBg} border ${theme.softBorder} rounded-full text-[14px] outline-none ${theme.focus}`} /><button onClick={addBtn} className={`shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br ${theme.btn} text-white rounded-full shadow-lg`}><PlusCircleIcon size={22} /></button></div>
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-3">Quick add</p>
          <div className="flex flex-wrap gap-2">{['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt', 'Fettuccine', 'Heavy Cream', 'Parmesan', 'Butter'].map(item => (<button key={item} onClick={() => handleAdd(item)} className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition ${theme.soft} ${theme.hover} hover:text-white`}>+ {item}</button>))}</div>
          <div className={`mt-5 bg-gradient-to-r ${theme.btn} rounded-2xl p-3 flex gap-2`}><span>💡</span><p className="text-[12px] text-white/90">Tip: Add <b>3-5 ingredients</b> • {CUISINES[cuisine]?.emoji} {CUISINES[cuisine]?.label} • {LOCATIONS[location]?.emoji} {LOCATIONS[location]?.label} • {cal.perSitting} kcal / sitting</p></div>
        </div>
        <div className={`bg-white rounded-[28px] p-5 md:p-6 shadow-xl ${theme.shadow}`}>
          <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2.5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center`}>2</span><h2 className="font-display font-light text-[21px]">{t(lang, 'yours')}</h2></div>{ingPicker.length > 0 && <span className={`text-[11px] font-bold bg-gradient-to-r ${theme.btn} text-white px-2.5 py-1 rounded-full`}>{ingPicker.length} picked</span>}</div>
          {ingPicker.length === 0 ? (<div className={`${theme.softBg} border border-dashed ${theme.softBorder} rounded-2xl py-6 text-center mb-4`}><p className="text-[22px]">🧺</p><p className="text-[13px] text-stone-500">No ingredients yet.</p></div>) : (<div className="flex flex-wrap gap-2 mb-4">{ingPicker.map(i => (<div key={i} className={`text-[13px] font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${theme.btn} text-white flex items-center gap-1.5 shadow-md`}><button onClick={() => setIngPicker(p => p.filter(x => x !== i))} className={`w-5 h-5 bg-white/20 hover:bg-white ${theme.accent} rounded-full text-[10px] font-bold flex items-center justify-center`}>✕</button>{i}</div>))}</div>)}
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">{t(lang, 'how')}</p>
          <div className={`grid grid-cols-4 gap-1.5 p-1.5 ${theme.softBg} border ${theme.softBorder} rounded-full mb-3`}>{Object.values(GOALS).map(g => (<button key={g.id} onClick={() => setGoal(g.id)} title={g.label} className={`h-10 rounded-full text-[11px] md:text-[12px] font-bold flex items-center justify-center gap-1 transition ${goal === g.id ? `bg-gradient-to-r ${theme.btn} text-white shadow-md` : 'text-stone-500'}`}>{GOAL_ICONS[g.id]} <span className="hidden lg:inline">{g.label.split(' ')[0]}</span></button>))}</div>
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2 mt-4">{t(lang, 'cuisine')}</p>
          <div className="flex flex-wrap gap-2 mb-2">{Object.values(CUISINES).map(c => (<button key={c.id} onClick={() => setCuisine(c.id)} title={c.desc} className={`text-[12px] font-bold px-3.5 py-2 rounded-full border transition ${cuisine === c.id ? `bg-gradient-to-r ${theme.btn} text-white border-transparent shadow-md` : `${theme.softBg} ${theme.softText} ${theme.softBorder}`}`}>{c.emoji} {c.label}</button>))}</div>
          <p className="text-[12px] text-center text-stone-400 mb-2">{CUISINES[cuisine]?.emoji} {CUISINES[cuisine]?.desc}</p>
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2 mt-4">{t(lang, 'location')}</p>
          <div className={`grid grid-cols-2 gap-2 p-1.5 ${theme.softBg} border ${theme.softBorder} rounded-full mb-2`}>{Object.values(LOCATIONS).map(l => (<button key={l.id} onClick={() => setLocation(l.id)} className={`h-10 rounded-full text-[12px] font-bold transition ${location === l.id ? `bg-gradient-to-r ${theme.btn} text-white shadow-md` : 'text-stone-500'}`}>{l.emoji} {l.label}</button>))}</div>
          <p className="text-[12px] text-center text-stone-400 mb-4">{LOCATIONS[location]?.desc} • 🔥 {cal.perSitting} kcal × {sittings} = {cal.total} kcal {cal.isCustom ? '(Custom)' : ''}</p>
          <button onClick={handleFindMeal} disabled={isLoading || !ingPicker.length} className={`w-full h-14 rounded-full font-medium text-[16px] flex items-center justify-center gap-2 transition ${!ingPicker.length || isLoading ? 'bg-stone-100 text-stone-400' : `bg-gradient-to-r ${theme.btn} text-white shadow-lg active:scale-[0.98]`}`}>{isLoading ? 'Finding your meal...' : <><Search size={18} /> {t(lang, 'find')} {GOALS[goal]?.emoji}</>}</button>
          <div className="flex justify-between mt-4"><button onClick={() => setIngPicker([])} className={`text-[12px] font-semibold text-stone-400 ${theme.accent} flex gap-1 items-center`}><Delete size={14} /> Clear all</button><p className="text-[12px] font-semibold">{ingPicker.length === 0 ? 'Your basket is empty' : `${GOALS[goal]?.label} • ${cal.perSitting} kcal/sitting`}</p></div>
        </div>
        <div className="space-y-4 md:max-h-[560px] md:overflow-y-auto md:pr-1">
          {isLoading && <div className="bg-white rounded-[28px] p-6 shadow-xl animate-pulse"><p className="text-center text-[12px] font-bold text-stone-400">👩🏾‍🍳 Cooking up your recipe...</p></div>}
          {recipe && !isLoading && <AIResponse recipe={recipe} onGenerateAnother={handleGenerateAnother} onClear={() => { setRecipe(null); setIngPicker([]); }} goal={goal} sittings={sittings} lang={lang} themeId={themeId} onAddToKcal={handleAddRecipeToKcal} />}
          {error && !isLoading && <div className="bg-white rounded-[24px] p-5 text-center text-[13px] text-red-600 font-semibold">{error}</div>}
          {!recipe && !isLoading && (<div className="bg-white rounded-[28px] p-6 shadow-xl"><div className={`${theme.softBg} border border-dashed ${theme.softBorder} rounded-2xl py-8 text-center`}><p className="text-[28px]">🍲</p><p className="text-[14px] font-semibold text-stone-600">Your recipe will appear here.</p><p className="text-[12px] text-stone-400">Pick ingredients → Choose goal → Find Meal</p></div></div>)}
        </div>
      </div>
      <Footer lang={lang} themeId={themeId} />
    </div>
  );
}
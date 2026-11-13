import { Search, PlusCircleIcon, Delete, Clock, CookingPot, Sparkles, X, MoonStar, Salad, Soup, Flag, Plane, Dices, Globe, Check, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AIResponse from "./AIResponse";
import Footer from "./Footer";
import { THEMES, GOALS, CUISINES, LOCATIONS, t, getPrefs, caloriesFor, addHistory, progressQuests } from "../lib/didi";

export default function IngredientPicker({ user, themeId, lang, goal, setGoal, sittings, customCalories, cuisine, setCuisine, location, setLocation, onRequireAuth, initialRecipe, onClearInitial }) {
  const isGuest = !user?.email;
  const [showLazy, setShowLazy] = useState(false);
  const [lazyMood, setLazyMood] = useState("light");
  const [lazyPlace, setLazyPlace] = useState("nigerian");
  const [lazyGoal, setLazyGoal] = useState("normal");
  const [lastSurprise, setLastSurprise] = useState(null);
  const [guestCount, setGuestCount] = useState(() => parseInt(localStorage.getItem("didi_guest_count") || "0"));
  const syncTimer = useRef(null);

  const needAuth = () => { if (isGuest) { onRequireAuth?.(); return true; } return false; };
  const trackQuestProgress = (recipeTitle) => {
    if (!recipeTitle) return;
    try {
      const { newlyCompleted } = progressQuests(user, recipeTitle);
      if (newlyCompleted.length) { newlyCompleted.forEach(id => { fetch("/api/community?type=quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questId: id, location: location === "abroad" ? "abroad" : "lagos", email: user?.email || "guest" }) }).catch(() => {}); }); setTimeout(() => alert(`🎉 Quest Completed!`), 500); syncCloud(); }
    } catch {}
  };
  const syncCloud = () => {
    if (!user?.email) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const email = user.email.toLowerCase().trim();
        const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
        const found = users.find((u) => u.email === email);
        const kcal = {}; const water = {};
        for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); const day = d.toISOString().slice(0, 10); const v = localStorage.getItem(`didi_kcal_${email}_${day}`); if (v) kcal[day] = JSON.parse(v); const w = localStorage.getItem(`didi_water_${email}_${day}`); if (w) water[day] = JSON.parse(w); }
        const bundle = { email, name: user.name || found?.name || "", password: found?.password || "", prefs: getPrefs(email), fav: JSON.parse(localStorage.getItem(`didi_fav_${email}`) || "[]"), history: JSON.parse(localStorage.getItem(`didi_history_${email}`) || "[]"), shopping: JSON.parse(localStorage.getItem(`didi_shopping_${email}`) || "[]"), pantry: JSON.parse(localStorage.getItem(`didi_pantry_${email}`) || "[]"), weights: JSON.parse(localStorage.getItem(`didi_weights_${email}`) || "[]"), kcal, water, marketPrices: JSON.parse(localStorage.getItem("didi_market_prices") || "{}"), quests: JSON.parse(localStorage.getItem(`didi_quests_${email}`) || "[]"), createdAt: new Date().toISOString(), migrated: true };
        await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, data: bundle }) });
      } catch {}
    }, 800);
  };
  const bumpGuestCount = () => { if (!isGuest) return; const next = guestCount + 1; setGuestCount(next); localStorage.setItem("didi_guest_count", String(next)); };

  const theme = THEMES[themeId] || THEMES.purple;
  const cal = caloriesFor(goal, sittings, customCalories);
  const [ingPicker, setIngPicker] = useState(() => { try { return JSON.parse(localStorage.getItem("didi_active_ingredients") || "[]"); } catch { return []; } });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState(() => { try { return JSON.parse(localStorage.getItem("didi_persisted_recipe") || "null"); } catch { return null; } });
  const [error, setError] = useState("");
  useEffect(() => { if (initialRecipe) { setRecipe(initialRecipe); onClearInitial?.(); } }, [initialRecipe]);
  useEffect(() => { if (recipe?.title && user?.email) addHistory(user, recipe); }, [recipe?.title]);
  useEffect(() => { try { if (recipe) localStorage.setItem("didi_persisted_recipe", JSON.stringify(recipe)); localStorage.setItem("didi_active_ingredients", JSON.stringify(ingPicker)); } catch {} }, [recipe, ingPicker]);

  const handleAdd = (ing) => setIngPicker(prev => prev.includes(ing) ? prev : [...prev, ing]);
  const addBtn = () => { if (!inputValue.trim()) return; handleAdd(inputValue.trim()); setInputValue(""); };
  const callAPI = async (exclude, extra = {}) => {
    const res = await fetch("/api/generate-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: ingPicker, exclude, mode: goal, sittings, caloriesPerSitting: cal.perSitting, totalCalories: cal.total, lang, customCalories: cal.total, cuisine, location, ...extra }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed"); return data.recipe;
  };
  const scrollToRecipe = () => { if (window.innerWidth > 768) return; setTimeout(() => { document.getElementById("ai-response-box")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100); };
  const handleFindMeal = async () => {
    if (!ingPicker.length) return;
    if (isGuest && guestCount >= 2) { setError("You've used your 2 free recipes. Login / Register to keep cooking — it's free."); onRequireAuth?.(); return; }
    setError(""); setLastSurprise(null); setIsLoading(true); scrollToRecipe();
    try { const r = await callAPI(); setRecipe(r); bumpGuestCount(); trackQuestProgress(r?.title); syncCloud(); } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };
  const lazyCaloriesFor = (lazyGoalValue, lazyMoodValue) => { const MAP = { weightloss: { light: 350, heavy: 500 }, normal: { light: 450, heavy: 650 }, fit: { light: 450, heavy: 650 }, weightgain: { light: 550, heavy: 800 } }; const perSitting = MAP[lazyGoalValue]?.[lazyMoodValue] ?? 450; return { perSitting, total: perSitting * sittings }; };
  const handleGenerateAnother = async () => {
    if (isGuest && guestCount >= 2) { onRequireAuth?.(); return; }
    setError(""); setIsLoading(true); scrollToRecipe();
    try { if (lastSurprise) { const lazyCal = lazyCaloriesFor(lastSurprise.mode, lastSurprise.mood); const r = await callAPI(recipe?.title, { ...lastSurprise, caloriesPerSitting: lazyCal.perSitting, totalCalories: lazyCal.total, customCalories: lazyCal.total, ingredients: [] }); setRecipe(r); trackQuestProgress(r?.title); } else { const r = await callAPI(recipe?.title); setRecipe(r); trackQuestProgress(r?.title); } bumpGuestCount(); syncCloud(); } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };
  const handleSurprise = async () => {
    if (needAuth()) return; setShowLazy(false); setError(""); setIsLoading(true);
    try {
      const surpriseCuisine = lazyPlace === "nigerian" ? "nigerian" : "auto";
      const surpriseLocation = lazyPlace === "nigerian" ? "nigeria" : "abroad";
      const lazyCal = lazyCaloriesFor(lazyGoal, lazyMood);
      const surprisePayload = { surprise: true, mood: lazyMood, mode: lazyGoal, cuisine: surpriseCuisine, location: surpriseLocation, caloriesPerSitting: lazyCal.perSitting, totalCalories: lazyCal.total, customCalories: lazyCal.total, ingredients: [] };
      setLastSurprise(surprisePayload); setGoal(lazyGoal);
      const r = await callAPI(null, surprisePayload); setRecipe(r); trackQuestProgress(r?.title); syncCloud();
    } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };
  const handleAddRecipeToKcal = () => {
    if (needAuth()) return; if (!recipe) return;
    const today = new Date().toISOString().slice(0, 10); const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`;
    const kcalNum = parseInt(String(recipe.caloriesPerSitting || recipe.calories || "0").replace(/[^0-9]/g, "")) || 0;
    const existing = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify([...existing, { id: Date.now(), name: recipe.title, qty: 1, unit: "serving", kcal: kcalNum, totalKcal: kcalNum }])); window.dispatchEvent(new Event("didi-kcal-updated")); syncCloud(); alert(`Added ${recipe.title} • ${kcalNum} kcal to today's calculator 🔥`);
  };
  const handleClearAll = () => { setRecipe(null); setIngPicker([]); setLastSurprise(null); try { localStorage.removeItem("didi_persisted_recipe"); localStorage.removeItem("didi_active_ingredients"); } catch {} };

  return (
    <div className="w-full bg-[#FAF9F6] mx-auto max-w-[1400px] relative overflow-hidden">
      <div className={`relative mx-4 md:mx-6 rounded-[32px] overflow-hidden bg-gradient-to-br ${theme.page} px-5 md:px-8 pt-9 pb-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-white/10 blur-[80px] rounded-full pointer-events-none" />
        <p className="relative text-[11px] font-bold tracking-[0.28em] uppercase text-white/60">Chef Didi • No Waste</p>
        <h1 className="relative font-display text-[34px] md:text-[48px] leading-[1.05] text-white mt-2">{t(lang, 'kitchen1')}<br /><span className="italic font-light text-white/90">{t(lang, 'kitchen2')}</span></h1>
        <p className="relative text-[14px] text-white/70 mt-3 max-w-[620px] mx-auto font-light">Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real recipe.</p>
        {isGuest && (<button onClick={() => onRequireAuth?.()} className="relative mt-5 inline-flex items-center gap-2 bg-white text-[#1A1A2E] text-[12px] font-semibold px-4 py-2.5 rounded-full shadow-md"><Lock size={13} /> Guest Mode • {Math.max(0, 2 - guestCount)} free recipes left — Login to unlock all</button>)}
        <div className="relative flex justify-center gap-2 mt-5 flex-wrap"><span className="text-[12px] font-medium bg-white/10 border border-white/20 text-white rounded-full px-3.5 py-1.5 flex items-center gap-1.5 backdrop-blur"><CookingPot size={12} /> 120+ Recipes</span><span className="text-[12px] font-medium bg-white/10 border border-white/20 text-white rounded-full px-3.5 py-1.5 flex items-center gap-1.5 backdrop-blur"><Clock size={12} /> Real Times</span><span className="text-[12px] font-medium bg-white/10 border border-white/20 text-white rounded-full px-3.5 py-1.5 flex items-center gap-1.5 backdrop-blur"><Globe size={12} /> World + Nigerian</span></div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100 h-full flex flex-col">
          <div className="flex items-center gap-2.5 mb-5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center shadow-md text-[13px] font-bold`}>1</span><h2 className="font-display font-medium text-[21px] tracking-tight">{t(lang, 'add')}</h2><span className="ml-auto text-[10px] font-bold tracking-widest bg-[#FAF9F6] border border-stone-200 text-stone-500 px-2.5 py-1 rounded-full">FRESH</span></div>
          <div className="flex gap-2 mb-5"><input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBtn()} placeholder="e.g. Chicken, Rice, Tomato..." className="flex-1 min-w-0 h-12 px-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl text-[14px] outline-none focus:border-[#1A1A2E] focus:bg-white transition placeholder:text-stone-400" /><button onClick={addBtn} className={`shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br ${theme.btn} text-white rounded-2xl shadow-md`}><PlusCircleIcon size={20} /></button></div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-3">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt', 'Fettuccine', 'Heavy Cream', 'Parmesan', 'Butter'].map(item => {
              const selected = ingPicker.includes(item);
              return (<button key={item} onClick={() => handleAdd(item)} className={`text-[13px] font-medium px-3.5 py-2 rounded-full border transition flex items-center gap-1.5 ${selected ? "bg-[#1A1A2E] border-[#1A1A2E] text-white" : "bg-[#FAF9F6] border-stone-200 text-stone-600 hover:border-[#1A1A2E]"}`}>{selected ? <Check size={13} /> : "+"} {item}</button>);
            })}
          </div>
          <button onClick={() => { if (needAuth()) return; setLazyGoal(goal); setShowLazy(true); }} className={`w-full mt-5 h-12 rounded-full bg-gradient-to-r ${theme.btn} text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition`}><MoonStar size={16} /> Cook For Me {isGuest && <Lock size={13} />} <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={11} /> Lazy Mode</span></button>
          <p className="text-[11px] text-center text-stone-400 mt-2 font-light">{isGuest ? "Login to unlock Cook For Me" : "Too lazy to think? Didi picks for you."}</p>
          <div className="flex-1" />
          <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3.5 flex gap-2 mt-4"><span>💡</span><p className="text-[12px] text-stone-600 leading-relaxed">Tip: Add <b>3-5 ingredients</b> • {CUISINES[cuisine]?.emoji} {CUISINES[cuisine]?.label} • {LOCATIONS[location]?.emoji} {LOCATIONS[location]?.label} • {cal.perSitting} kcal / sitting</p></div>
        </div>

        <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2.5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center text-[13px] font-bold`}>2</span><h2 className="font-display font-medium text-[21px] tracking-tight">{t(lang, 'yours')}</h2></div>{ingPicker.length > 0 && <span className="text-[11px] font-semibold bg-[#1A1A2E] text-white px-2.5 py-1 rounded-full">{ingPicker.length} picked</span>}</div>
          {ingPicker.length === 0 ? (<div className="bg-[#FAF9F6] border border-dashed border-stone-200 rounded-2xl py-6 text-center mb-4"><p className="text-[22px]">🧺</p><p className="text-[13px] text-stone-500 font-light">No ingredients yet.</p></div>) : (<div className="flex flex-wrap gap-2 mb-4">{ingPicker.map(i => (<div key={i} className="text-[13px] font-medium px-3 py-1.5 rounded-full bg-[#1A1A2E] text-white flex items-center gap-1.5"><button onClick={() => setIngPicker(p => p.filter(x => x !== i))} className="w-5 h-5 bg-white/20 hover:bg-white hover:text-black rounded-full text-[10px] font-bold flex items-center justify-center">✕</button>{i}</div>))}</div>)}
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-2 mt-2">{t(lang, 'cuisine')}</p>
          <div className="flex flex-wrap gap-2 mb-2">{Object.values(CUISINES).map(c => (<button key={c.id} onClick={() => setCuisine(c.id)} title={c.desc} className={`text-[12px] font-medium px-3.5 py-2 rounded-full border transition ${cuisine === c.id ? `bg-gradient-to-r ${theme.btn} text-white border-transparent shadow-md` : `bg-[#FAF9F6] border-stone-200 text-stone-600`}`}>{c.emoji} {c.label}</button>))}</div>
          <p className="text-[12px] text-center text-stone-400 mb-2 font-light">{CUISINES[cuisine]?.emoji} {CUISINES[cuisine]?.desc}</p>
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-2 mt-4">{t(lang, 'location')}</p>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF9F6] border border-stone-200 rounded-full mb-2">{Object.values(LOCATIONS).map(l => (<button key={l.id} onClick={() => setLocation(l.id)} className={`h-10 rounded-full text-[12px] font-semibold transition ${location === l.id ? `bg-gradient-to-r ${theme.btn} text-white shadow-md` : 'text-stone-500'}`}>{l.emoji} {l.label}</button>))}</div>
          <p className="text-[12px] text-center text-stone-400 mb-4 font-light">{LOCATIONS[location]?.desc} • 🔥 {cal.perSitting} kcal × {sittings} = {cal.total} kcal {cal.isCustom ? '(Custom)' : ''}</p>
          <p className="text-[12px] text-center text-stone-400 mb-3 font-light">Goal: <b className="text-[#1A1A2E]">{GOALS[goal]?.label}</b> — change it in Settings above ☝️</p>
          <button id="find-meal-btn" onClick={handleFindMeal} disabled={isLoading || !ingPicker.length} className={`w-full h-14 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition ${!ingPicker.length || isLoading ? 'bg-stone-100 text-stone-400' : `bg-gradient-to-r ${theme.btn} text-white shadow-md active:scale-[0.98]`}`}>{isLoading ? 'Finding your meal...' : <><Search size={18} /> {isGuest && guestCount >= 2 ? "Login to Continue 🔒" : `${t(lang, 'find')} ${GOALS[goal]?.emoji}`} </>}</button>
          {isGuest && <p className="text-[11px] text-center text-stone-400 mt-2 font-light">{Math.max(0, 2 - guestCount)} free recipes left. After that, login is free.</p>}
          <div className="flex justify-between mt-auto pt-4"><button onClick={() => setIngPicker([])} className="text-[12px] font-medium text-stone-400 hover:text-red-500 flex gap-1 items-center transition"><Delete size={14} /> Clear all</button><p className="text-[12px] font-medium">{ingPicker.length === 0 ? 'Your basket is empty' : `${GOALS[goal]?.label} • ${cal.perSitting} kcal/sitting`}</p></div>
        </div>

        <div id="ai-response-box" className="space-y-4 md:max-h-[560px] md:overflow-y-auto md:pr-1 scroll-mt-4">
          {isLoading && <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100 animate-pulse"><p className="text-center text-[12px] font-semibold text-stone-400">👩🏾‍🍳 Cooking up your recipe...</p></div>}
          {recipe && !isLoading && <AIResponse recipe={recipe} onGenerateAnother={handleGenerateAnother} onClear={handleClearAll} goal={goal} sittings={sittings} lang={lang} themeId={themeId} onAddToKcal={handleAddRecipeToKcal} user={user} location={location} />}
          {error && !isLoading && <div className="bg-white rounded-[24px] p-5 text-center text-[13px] text-red-600 font-semibold border border-red-100">{error}</div>}
          {!recipe && !isLoading && (<div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100"><div className="bg-[#FAF9F6] border border-dashed border-stone-200 rounded-2xl py-8 text-center"><p className="text-[28px]">🍲</p><p className="text-[14px] font-semibold text-stone-600">Your recipe will appear here.</p><p className="text-[12px] text-stone-400 font-light">Pick ingredients → Choose goal → Find Meal</p></div></div>)}
        </div>
      </div>

      {showLazy && !isGuest && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowLazy(false)}>
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[440px] shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start"><div><h3 className="font-display text-[22px] leading-none flex items-center gap-2"><MoonStar size={20} className={theme.accent} /> Cook For Me</h3><p className="text-[12px] text-stone-400 mt-1 font-light">Didi picks a random meal. You just cook.</p></div><button onClick={() => setShowLazy(false)} className="w-8 h-8 bg-stone-100 rounded-full font-bold"><X size={16} className="mx-auto" /></button></div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-5 mb-2">1. How are you feeling?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLazyMood("light")} className={`h-16 rounded-2xl border text-left p-3 transition ${lazyMood === "light" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-[#FAF9F6] border-stone-200`}`}><Salad size={16} /><p className="text-[13px] font-semibold mt-1">Light</p><p className={`text-[11px] ${lazyMood === "light" ? 'text-white/80' : 'text-stone-400'}`}>Salad, soup, grilled</p></button>
              <button onClick={() => setLazyMood("heavy")} className={`h-16 rounded-2xl border text-left p-3 transition ${lazyMood === "heavy" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-[#FAF9F6] border-stone-200`}`}><Soup size={16} /><p className="text-[13px] font-semibold mt-1">Heavy</p><p className={`text-[11px] ${lazyMood === "heavy" ? 'text-white/80' : 'text-stone-400'}`}>Swallow, rice, pasta</p></button>
            </div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-4 mb-2">2. Nigerian or Abroad?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLazyPlace("nigerian")} className={`h-16 rounded-2xl border text-left p-3 transition ${lazyPlace === "nigerian" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-[#FAF9F6] border-stone-200`}`}><Flag size={16} /><p className="text-[13px] font-semibold mt-1">Nigerian 🇳🇬</p><p className={`text-[11px] ${lazyPlace === "nigerian" ? 'text-white/80' : 'text-stone-400'}`}>Jollof, Egusi, Ofada</p></button>
              <button onClick={() => setLazyPlace("abroad")} className={`h-16 rounded-2xl border text-left p-3 transition ${lazyPlace === "abroad" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-[#FAF9F6] border-stone-200`}`}><Plane size={16} /><p className="text-[13px] font-semibold mt-1">Abroad ✈️</p><p className={`text-[11px] ${lazyPlace === "abroad" ? 'text-white/80' : 'text-stone-400'}`}>Diaspora + world dishes</p></button>
            </div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-4 mb-2">3. What&apos;s your goal?</p>
            <div className="grid grid-cols-2 gap-2">{Object.values(GOALS).map(g => (<button key={g.id} onClick={() => setLazyGoal(g.id)} className={`h-14 rounded-2xl border text-left px-3 flex items-center gap-2.5 transition ${lazyGoal === g.id ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-[#FAF9F6] border-stone-200`}`}>{g.label}<span className={`block text-[11px] mt-0.5 ${lazyGoal === g.id ? 'text-white/80' : 'text-stone-400'}`}>{g.calories} kcal / day</span></button>))}</div>
            <button onClick={handleSurprise} className={`w-full mt-6 h-14 rounded-full bg-gradient-to-r ${theme.btn} text-white font-semibold text-[15px] shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2`}><Dices size={18} /> Surprise Me — {lazyMood === "light" ? "Light" : "Heavy"} • {lazyPlace === "nigerian" ? "Nigerian" : "Abroad"} • {GOALS[lazyGoal]?.label}</button>
            <p className="text-[11px] text-center text-stone-400 mt-2 font-light">No ingredients needed. Didi chooses everything.</p>
          </div>
        </div>
      )}
      <Footer lang={lang} themeId={themeId} />
    </div>
  );
}

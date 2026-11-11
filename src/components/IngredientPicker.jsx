import { Search, PlusCircleIcon, Delete, Clock, CookingPot, UtensilsCrossed, TrendingDown, TrendingUp, Dumbbell, Sparkles, X, MoonStar, Salad, Soup, Flag, Plane, Dices, Globe, Heart, History, ShoppingCart, Check, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AIResponse from "./AIResponse";
import Footer from "./Footer";
import SettingsBar from "./SettingsBar";
import CalorieCalculator from "./CalorieCalculator";
import { THEMES, GOALS, CUISINES, LOCATIONS, t, getPrefs, savePrefs, caloriesFor, getFavourites, getHistory, getShopping, toggleShopping, clearShopping, getPantry, savePantry, addHistory } from "../lib/didi";
const GOAL_ICONS = { normal: <UtensilsCrossed size={15} />, weightloss: <TrendingDown size={16} />, weightgain: <TrendingUp size={16} />, fit: <Dumbbell size={16} /> };

export default function IngredientPicker({ user, themeId, setThemeId, lang, setLang, onRequireAuth }) {
  const isGuest = !user?.email;
  const [goal, setGoal] = useState("normal");
  const [sittings, setSittings] = useState(3);
  const [customCalories, setCustomCalories] = useState(null);
  const [cuisine, setCuisine] = useState("auto");
  const [location, setLocation] = useState("nigeria");
  const [showLazy, setShowLazy] = useState(false);
  const [lazyMood, setLazyMood] = useState("light");
  const [lazyPlace, setLazyPlace] = useState("nigerian");
  const [lazyGoal, setLazyGoal] = useState("normal");
  const [lastSurprise, setLastSurprise] = useState(null);
  const [favList, setFavList] = useState(() => getFavourites(user));
  const [histList, setHistList] = useState(() => getHistory(user));
  const [shopList, setShopList] = useState(() => getShopping(user));
  const [showFav, setShowFav] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [pantry, setPantry] = useState(() => getPantry(user));
  const [pantryInput, setPantryInput] = useState("");
  const [guestCount, setGuestCount] = useState(() => parseInt(localStorage.getItem("didi_guest_count") || "0"));
  const [cloudVersion, setCloudVersion] = useState(0);
  const syncTimer = useRef(null);

  const needAuth = () => {
    if (isGuest) {
      onRequireAuth?.();
      return true;
    }
    return false;
  };

  // ---------- AUTO-SYNC TO CLOUD (debounced) ----------
  const syncCloud = () => {
    if (!user?.email) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const email = user.email.toLowerCase().trim();
        const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
        const found = users.find((u) => u.email === email);
        const kcal = {};
        const water = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const day = d.toISOString().slice(0, 10);
          const v = localStorage.getItem(`didi_kcal_${email}_${day}`);
          if (v) kcal[day] = JSON.parse(v);
          const w = localStorage.getItem(`didi_water_${email}_${day}`);
          if (w) water[day] = JSON.parse(w);
        }
        const bundle = {
          email, name: user.name || found?.name || "", password: found?.password || "",
          prefs: getPrefs(email),
          fav: JSON.parse(localStorage.getItem(`didi_fav_${email}`) || "[]"),
          history: JSON.parse(localStorage.getItem(`didi_history_${email}`) || "[]"),
          shopping: JSON.parse(localStorage.getItem(`didi_shopping_${email}`) || "[]"),
          pantry: JSON.parse(localStorage.getItem(`didi_pantry_${email}`) || "[]"),
          weights: JSON.parse(localStorage.getItem(`didi_weights_${email}`) || "[]"),
          kcal, water, createdAt: new Date().toISOString(), migrated: true,
        };
        await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, data: bundle }) });
      } catch {}
    }, 800);
  };

  // LOCKED CUSTOM KCAL: guests cannot set it
  const handleCustomCalories = (val) => {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setCustomCalories(val);
  };

  const bumpGuestCount = () => {
    if (!isGuest) return;
    const next = guestCount + 1;
    setGuestCount(next);
    localStorage.setItem("didi_guest_count", String(next));
  };

  // ---------- SYNC LISTS + PREFS WHEN USER CHANGES OR CLOUD RESTORES ----------
  useEffect(() => {
    const sync = () => {
      setFavList(getFavourites(user));
      setHistList(getHistory(user));
      setShopList(getShopping(user));
      setPantry(getPantry(user));
      if (user?.email) {
        const p = getPrefs(user.email);
        if (p.goal) setGoal(p.goal);
        if (p.sittings) setSittings(p.sittings);
        if (p.customCalories !== undefined) setCustomCalories(p.customCalories);
        if (p.cuisine) setCuisine(p.cuisine);
        if (p.location) setLocation(p.location);
      }
    };
    sync();
    const onRestored = () => { sync(); setCloudVersion((v) => v + 1); };
    const onKcal = () => { setCloudVersion((v) => v + 1); syncCloud(); };
    window.addEventListener("didi-fav-updated", sync);
    window.addEventListener("didi-history-updated", sync);
    window.addEventListener("didi-shopping-updated", sync);
    window.addEventListener("didi-pantry-updated", sync);
    window.addEventListener("didi-data-restored", onRestored);
    window.addEventListener("didi-kcal-updated", onKcal);
    return () => {
      window.removeEventListener("didi-fav-updated", sync);
      window.removeEventListener("didi-history-updated", sync);
      window.removeEventListener("didi-shopping-updated", sync);
      window.removeEventListener("didi-pantry-updated", sync);
      window.removeEventListener("didi-data-restored", onRestored);
      window.removeEventListener("didi-kcal-updated", onKcal);
    };
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      savePrefs(user.email, { goal, theme: themeId, lang, sittings, customCalories, cuisine, location });
      syncCloud();
    }
  }, [goal, themeId, lang, sittings, customCalories, cuisine, location, user?.email]);

  const theme = THEMES[themeId] || THEMES.purple;
  const cal = caloriesFor(goal, sittings, customCalories);
  const [ingPicker, setIngPicker] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (recipe?.title && user?.email) addHistory(user, recipe); }, [recipe?.title]);
  const handleAdd = (ing) => setIngPicker(prev => prev.includes(ing) ? prev : [...prev, ing]);
  const addBtn = () => { if (!inputValue.trim()) return; handleAdd(inputValue.trim()); setInputValue(""); };
  const callAPI = async (exclude, extra = {}) => {
    const res = await fetch("/api/generate-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: ingPicker, exclude, mode: goal, sittings, caloriesPerSitting: cal.perSitting, totalCalories: cal.total, lang, customCalories: cal.total, cuisine, location, ...extra }), });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed"); return data.recipe;
  };

  const handleFindMeal = async () => {
    if (!ingPicker.length) return;
    if (isGuest && guestCount >= 2) {
      setError("You've used your 2 free recipes. Login / Register to keep cooking — it's free.");
      onRequireAuth?.();
      return;
    }
    setRecipe(null); setError(""); setLastSurprise(null); setIsLoading(true);
    try { const r = await callAPI(); setRecipe(r); bumpGuestCount(); } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };

  const lazyCaloriesFor = (lazyGoalValue, lazyMoodValue) => { const MAP = { weightloss: { light: 350, heavy: 500 }, normal: { light: 450, heavy: 650 }, fit: { light: 450, heavy: 650 }, weightgain: { light: 550, heavy: 800 } }; const perSitting = MAP[lazyGoalValue]?.[lazyMoodValue] ?? 450; return { perSitting, total: perSitting * sittings }; };

  const handleGenerateAnother = async () => {
    if (isGuest && guestCount >= 2) { onRequireAuth?.(); return; }
    setError(""); setIsLoading(true);
    try { if (lastSurprise) { const lazyCal = lazyCaloriesFor(lastSurprise.mode, lastSurprise.mood); setRecipe(await callAPI(recipe?.title, { ...lastSurprise, caloriesPerSitting: lazyCal.perSitting, totalCalories: lazyCal.total, customCalories: lazyCal.total, ingredients: [] })); } else { setRecipe(await callAPI(recipe?.title)); } bumpGuestCount(); } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };

  const handleSurprise = async () => {
    if (needAuth()) return;
    setShowLazy(false); setRecipe(null); setError(""); setIsLoading(true);
    try { const surpriseCuisine = lazyPlace === "nigerian" ? "nigerian" : "auto"; const surpriseLocation = lazyPlace === "nigerian" ? "nigeria" : "abroad"; const lazyCal = lazyCaloriesFor(lazyGoal, lazyMood); const surprisePayload = { surprise: true, mood: lazyMood, mode: lazyGoal, cuisine: surpriseCuisine, location: surpriseLocation, caloriesPerSitting: lazyCal.perSitting, totalCalories: lazyCal.total, customCalories: lazyCal.total, ingredients: [] }; setLastSurprise(surprisePayload); setGoal(lazyGoal); const r = await callAPI(null, surprisePayload); setRecipe(r); } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };

  const handleAddRecipeToKcal = () => {
    if (needAuth()) return;
    if (!recipe) return; const today = new Date().toISOString().slice(0, 10); const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`; const kcalNum = parseInt(String(recipe.caloriesPerSitting || recipe.calories || "0").replace(/[^0-9]/g, "")) || 0; const existing = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify([...existing, { id: Date.now(), name: recipe.title, qty: 1, unit: "serving", kcal: kcalNum, totalKcal: kcalNum }])); window.dispatchEvent(new Event("didi-kcal-updated")); syncCloud(); alert(`Added ${recipe.title} • ${kcalNum} kcal to today's calculator 🔥`);
  };

  const addPantryItem = () => {
    if (needAuth()) return;
    if (!pantryInput.trim()) return;
    const n = [...pantry, pantryInput.trim()]; setPantry(n); savePantry(user, n); setPantryInput(""); syncCloud();
  };

  return (
    <div className={`w-full bg-gradient-to-b ${theme.page} rounded-[32px] mx-auto max-w-[1400px] relative overflow-hidden`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-white/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 pt-8 pb-2 text-center">
        <h1 className="font-display text-[34px] md:text-[48px] leading-[1.05] text-white">{t(lang, 'kitchen1')}<br /><span className="italic font-light text-white/95">{t(lang, 'kitchen2')}</span></h1>
        <p className="text-[14px] text-white/80 mt-3 max-w-[620px] mx-auto">Add what you have — Rice, Chicken, Yam, Beans — and Didi makes a real recipe.</p>
        {isGuest && (
          <button onClick={() => onRequireAuth?.()} className="mt-4 inline-flex items-center gap-2 bg-white text-[#4A2C8A] text-[12px] font-bold px-4 py-2 rounded-full shadow-md">
            <Lock size={13} /> Guest Mode • {Math.max(0, 2 - guestCount)} free recipes left — Login to unlock all
          </button>
        )}
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <span className={`text-[12px] font-semibold bg-white ${theme.accent} shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5`}><CookingPot size={12} /> 120+ Recipes</span>
          <span className="text-[12px] font-semibold bg-white/15 border border-white/30 text-white rounded-full px-3.5 py-1.5 flex items-center gap-1.5"><Clock size={12} /> Real Times</span>
          <span className={`text-[12px] font-semibold bg-white ${theme.accent} rounded-full px-3.5 py-1.5 flex items-center gap-1.5`}><Globe size={12} /> World + Nigerian</span>
        </div>
      </div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 mt-5"><SettingsBar goal={goal} setGoal={setGoal} sittings={sittings} setSittings={setSittings} themeId={themeId} setThemeId={setThemeId} lang={lang} setLang={setLang} user={user} customCalories={customCalories} setCustomCalories={handleCustomCalories} /></div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 mt-4">
        {isGuest ? (
          <div className="bg-white rounded-[24px] p-4 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Lock size={16} className={theme.accent} /><p className="text-[13px] font-bold">Kcal Calculator, Weight & Water are locked</p></div>
            <button onClick={() => onRequireAuth?.()} className={`shrink-0 h-9 px-4 rounded-full bg-gradient-to-r ${theme.btn} text-white text-[12px] font-bold`}>Login to Unlock →</button>
          </div>
        ) : (
          <CalorieCalculator key={cloudVersion} user={user} goal={goal} themeId={themeId} lang={lang} customCalories={customCalories} />
        )}
      </div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className={`bg-white rounded-[28px] p-5 md:p-6 shadow-xl ${theme.shadow} h-full flex flex-col`}>
          <div className="flex items-center gap-2.5 mb-5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center shadow-md`}>1</span><h2 className="font-display font-light text-[21px]">{t(lang, 'add')}</h2><span className={`ml-auto text-[10px] font-bold bg-gradient-to-r ${theme.btn} text-white px-2 py-1 rounded-full`}>FRESH</span></div>
          <div className="flex gap-2 mb-5"><input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBtn()} placeholder="e.g. Chicken, Rice, Tomato..." className={`flex-1 min-w-0 h-12 px-4 ${theme.softBg} border ${theme.softBorder} rounded-full text-[14px] outline-none ${theme.focus}`} /><button onClick={addBtn} className={`shrink-0 h-12 w-12 flex items-center justify-center bg-gradient-to-br ${theme.btn} text-white rounded-full shadow-lg`}><PlusCircleIcon size={22} /></button></div>
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-3">Quick add</p>
          <div className="flex flex-wrap gap-2">{['Rice', 'Chicken', 'Eggs', 'Tomato', 'Onion', 'Garlic', 'Pasta', 'Cheese', 'Beans', 'Plantain', 'Yam', 'Pepper', 'Potato', 'Beef', 'Oil', 'Salt', 'Fettuccine', 'Heavy Cream', 'Parmesan', 'Butter'].map(item => (<button key={item} onClick={() => handleAdd(item)} className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition ${theme.soft} ${theme.hover} hover:text-white`}>+ {item}</button>))}</div>
          <div className="mt-4">
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">My Pantry — always at home {isGuest && "🔒"}</p>
            <div className="flex flex-wrap gap-1.5">{pantry.map(p => (<button key={p} onClick={() => handleAdd(p)} className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">+ {p}</button>))}</div>
            <div className="flex gap-1.5 mt-2"><input value={pantryInput} onChange={e => setPantryInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addPantryItem(); }} placeholder={isGuest ? "Login to add to pantry 🔒" : "Add to pantry e.g. Maggi"} className="flex-1 h-9 px-3 bg-stone-50 border rounded-full text-[12px] outline-none" /><button onClick={addPantryItem} className="h-9 px-3 bg-green-600 text-white rounded-full text-[12px] font-bold">Add</button></div>
          </div>
          <button onClick={() => { if (needAuth()) return; setLazyGoal(goal); setShowLazy(true); }} className={`w-full mt-5 h-12 rounded-full bg-gradient-to-r ${theme.btn} text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition`}><MoonStar size={16} /> Cook For Me {isGuest && <Lock size={13} />} <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={11} /> Lazy Mode</span></button>
          <p className="text-[11px] text-center text-stone-400 mt-2">{isGuest ? "Login to unlock Cook For Me" : "Too lazy to think? Didi picks for you."}</p>
          <div className="flex-1" />
          <div className={`bg-gradient-to-r ${theme.btn} rounded-2xl p-3 flex gap-2`}><span>💡</span><p className="text-[12px] text-white/90">Tip: Add <b>3-5 ingredients</b> • {CUISINES[cuisine]?.emoji} {CUISINES[cuisine]?.label} • {LOCATIONS[location]?.emoji} {LOCATIONS[location]?.label} • {cal.perSitting} kcal / sitting</p></div>
        </div>
        <div className={`bg-white rounded-[28px] p-5 md:p-6 shadow-xl ${theme.shadow} h-full flex flex-col`}>
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
          <button onClick={handleFindMeal} disabled={isLoading || !ingPicker.length} className={`w-full h-14 rounded-full font-medium text-[16px] flex items-center justify-center gap-2 transition ${!ingPicker.length || isLoading ? 'bg-stone-100 text-stone-400' : `bg-gradient-to-r ${theme.btn} text-white shadow-lg active:scale-[0.98]`}`}>{isLoading ? 'Finding your meal...' : <><Search size={18} /> {isGuest && guestCount >= 2 ? "Login to Continue 🔒" : `${t(lang, 'find')} ${GOALS[goal]?.emoji}`} </>}</button>
          {isGuest && <p className="text-[11px] text-center text-stone-400 mt-2">{Math.max(0, 2 - guestCount)} free recipes left. After that, login is free.</p>}
          <div className="flex justify-between mt-auto pt-4"><button onClick={() => setIngPicker([])} className={`text-[12px] font-semibold text-stone-400 ${theme.accent} flex gap-1 items-center`}><Delete size={14} /> Clear all</button><p className="text-[12px] font-semibold">{ingPicker.length === 0 ? 'Your basket is empty' : `${GOALS[goal]?.label} • ${cal.perSitting} kcal/sitting`}</p></div>
        </div>
        <div className="space-y-4 md:max-h-[560px] md:overflow-y-auto md:pr-1">
          {isLoading && <div className="bg-white rounded-[28px] p-6 shadow-xl animate-pulse"><p className="text-center text-[12px] font-bold text-stone-400">👩🏾‍🍳 Cooking up your recipe...</p></div>}
          {recipe && !isLoading && <AIResponse recipe={recipe} onGenerateAnother={handleGenerateAnother} onClear={() => { setRecipe(null); setIngPicker([]); setLastSurprise(null); }} goal={goal} sittings={sittings} lang={lang} themeId={themeId} onAddToKcal={handleAddRecipeToKcal} user={user} />}
          {error && !isLoading && <div className="bg-white rounded-[24px] p-5 text-center text-[13px] text-red-600 font-semibold">{error}</div>}
          {!recipe && !isLoading && (<div className="bg-white rounded-[28px] p-6 shadow-xl"><div className={`${theme.softBg} border border-dashed ${theme.softBorder} rounded-2xl py-8 text-center`}><p className="text-[28px]">🍲</p><p className="text-[14px] font-semibold text-stone-600">Your recipe will appear here.</p><p className="text-[12px] text-stone-400">Pick ingredients → Choose goal → Find Meal</p></div></div>)}
        </div>
      </div>
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-[24px] p-4 shadow-xl flex flex-wrap gap-2">
          <button onClick={() => { if (needAuth()) return; setShowFav(!showFav); setShowHist(false); setShowShop(false); }} className={`h-10 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${showFav ? `bg-gradient-to-r ${theme.btn} text-white` : "bg-stone-100"}`}>{isGuest ? <Lock size={13} /> : <Heart size={14} />} Favourites {isGuest ? "🔒" : `(${favList.length})`}</button>
          <button onClick={() => { if (needAuth()) return; setShowHist(!showHist); setShowFav(false); setShowShop(false); }} className={`h-10 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${showHist ? `bg-gradient-to-r ${theme.btn} text-white` : "bg-stone-100"}`}>{isGuest ? <Lock size={13} /> : <History size={14} />} History {isGuest ? "🔒" : `(${histList.length})`}</button>
          <button onClick={() => { if (needAuth()) return; setShowShop(!showShop); setShowFav(false); setShowHist(false); }} className={`h-10 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${showShop ? `bg-gradient-to-r ${theme.btn} text-white` : "bg-stone-100"}`}>{isGuest ? <Lock size={13} /> : <ShoppingCart size={14} />} Shopping {isGuest ? "🔒" : `(${shopList.filter(i => !i.done).length} left)`}</button>
          {!isGuest && shopList.length > 0 && <button onClick={() => setShopList(clearShopping(user, true))} className="h-10 px-3 rounded-full text-[12px] font-bold text-red-500">Clear ticked</button>}
        </div>
        {(showFav || showHist) && !isGuest && (
          <div className="bg-white rounded-[24px] p-4 shadow-xl mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(showFav ? favList : histList).length === 0 ? <p className="text-[12px] text-stone-400 col-span-2 text-center py-3">Nothing here yet. Generate a recipe and ❤️ it.</p> : (showFav ? favList : histList).map(r => (<button key={r.title + (r.savedAt || r.viewedAt || "")} onClick={() => setRecipe(r)} className="text-left border rounded-2xl p-3 flex justify-between items-center"><span><span className="block text-[13px] font-bold">{r.title}</span><span className="block text-[11px] text-stone-400">{r.time} • {r.caloriesPerSitting || r.calories}</span></span><span className="text-[12px]">→</span></button>))}
          </div>
        )}
        {showShop && !isGuest && (
          <div className="bg-white rounded-[24px] p-4 shadow-xl mt-2">
            {shopList.length === 0 ? <p className="text-[12px] text-stone-400 text-center py-3">Shopping list empty. Open a recipe → Shopping List.</p> : shopList.map(i => (<button key={i.id} onClick={() => setShopList(toggleShopping(user, i.id))} className="w-full flex items-center gap-2 py-2 border-b last:border-0 text-left"><span className={`w-5 h-5 rounded-full border flex items-center justify-center ${i.done ? "bg-green-500 text-white border-green-500" : ""}`}>{i.done && <Check size={12} />}</span><span className={`text-[13px] ${i.done ? "line-through text-stone-400" : "font-semibold"}`}>{i.name}</span></button>))}
          </div>
        )}
      </div>
      {showLazy && !isGuest && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setShowLazy(false)}>
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[440px] shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start"><div><h3 className="font-display text-[22px] leading-none flex items-center gap-2"><MoonStar size={20} className={theme.accent} /> Cook For Me</h3><p className="text-[12px] text-stone-400 mt-1">Didi picks a random meal. You just cook.</p></div><button onClick={() => setShowLazy(false)} className="w-8 h-8 bg-stone-100 rounded-full font-bold"><X size={16} className="mx-auto" /></button></div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-5 mb-2">1. How are you feeling?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLazyMood("light")} className={`h-16 rounded-2xl border-2 text-left p-3 transition ${lazyMood === "light" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `${theme.softBg} border ${theme.softBorder}`}`}><Salad size={9} /><p className="text-[13px] font-bold mt-1">Light</p><p className={`text-[11px] ${lazyMood === "light" ? 'text-white/80' : 'text-stone-400'}`}>Salad, soup, grilled</p></button>
              <button onClick={() => setLazyMood("heavy")} className={`h-16 rounded-2xl border-2 text-left p-3 transition ${lazyMood === "heavy" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `${theme.softBg} border ${theme.softBorder}`}`}><Soup size={9} /><p className="text-[13px] font-bold mt-1">Heavy</p><p className={`text-[11px] ${lazyMood === "heavy" ? 'text-white/80' : 'text-stone-400'}`}>Swallow, rice, pasta</p></button>
            </div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-4 mb-2">2. Nigerian or Abroad?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLazyPlace("nigerian")} className={`h-16 rounded-2xl border-2 text-left p-3 transition ${lazyPlace === "nigerian" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `${theme.softBg} border ${theme.softBorder}`}`}><Flag size={9} /><p className="text-[13px] font-bold mt-1">Nigerian 🇳🇬</p><p className={`text-[11px] ${lazyPlace === "nigerian" ? 'text-white/80' : 'text-stone-400'}`}>Jollof, Egusi, Ofada</p></button>
              <button onClick={() => setLazyPlace("abroad")} className={`h-16 rounded-2xl border-2 text-left p-3 transition ${lazyPlace === "abroad" ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `${theme.softBg} border ${theme.softBorder}`}`}><Plane size={9} /><p className="text-[13px] font-bold mt-1">Abroad ✈️</p><p className={`text-[11px] ${lazyPlace === "abroad" ? 'text-white/80' : 'text-stone-400'}`}>Diaspora + world dishes</p></button>
            </div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-4 mb-2">3. What&apos;s your goal?</p>
            <div className="grid grid-cols-2 gap-2">{Object.values(GOALS).map(g => (<button key={g.id} onClick={() => setLazyGoal(g.id)} className={`h-14 rounded-2xl border-2 text-left px-3 flex items-center gap-2.5 transition ${lazyGoal === g.id ? `border-transparent bg-gradient-to-r ${theme.btn} text-white shadow-md` : `${theme.softBg} border ${theme.softBorder}`}`}>{GOAL_ICONS[g.id]}<span><span className="block text-[13px] font-bold leading-none">{g.label}</span><span className={`block text-[11px] mt-0.5 ${lazyGoal === g.id ? 'text-white/80' : 'text-stone-400'}`}>{g.calories} kcal / day</span></span></button>))}</div>
            <button onClick={handleSurprise} className={`w-full mt-6 h-14 rounded-full bg-gradient-to-r ${theme.btn} text-white font-bold text-[15px] shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2`}><Dices size={18} /> Surprise Me — {lazyMood === "light" ? "Light" : "Heavy"} • {lazyPlace === "nigerian" ? "Nigerian" : "Abroad"} • {GOALS[lazyGoal]?.label}</button>
            <p className="text-[11px] text-center text-stone-400 mt-2">No ingredients needed. Didi chooses everything.</p>
          </div>
        </div>
      )}
      <Footer lang={lang} themeId={themeId} />
    </div>
  );
}

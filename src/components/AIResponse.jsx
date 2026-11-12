import { useState, useEffect } from "react";
import { Heart, Share2, ShoppingCart, ChefHat, Timer, RefreshCw, Flame, X, Check, Copy, MessageCircle, Pause, Play, Sparkles } from "lucide-react";
import { GOALS, THEMES, isFavourite, toggleFavourite, addToShopping, getSwaps } from "../lib/didi";
import { getDiasporaSwap } from "../lib/translator";
import CostEstimator from "./CostEstimator";
import DiasporaTranslator from "./DiasporaTranslator";

export default function AIResponse({ recipe, onGenerateAnother, onClear, goal, sittings, lang = 'en', themeId = 'purple', onAddToKcal, user, location = "nigeria" }) {
  const [fav, setFav] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timers, setTimers] = useState({});
  const [paused, setPaused] = useState({});
  const [swapped, setSwapped] = useState({});
  const [showSwapFor, setShowSwapFor] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedShop, setAddedShop] = useState(false);

  useEffect(() => {
    if (recipe) {
      try {
        localStorage.setItem("didi_persisted_recipe", JSON.stringify(recipe));
      } catch {}
    }
  }, [recipe]);

  useEffect(() => { 
    setFav(isFavourite(user, recipe?.title)); 
    setStepIdx(0); 
    setSwapped({}); 
    setAddedShop(false); 
    setPaused({}); 
  }, [recipe?.title, user?.email]);

  useEffect(() => {
    const t = setInterval(() => setTimers(prev => {
      const next = { ...prev }; let changed = false;
      Object.keys(next).forEach(k => { if (paused[k]) return; if (next[k] > 0) { next[k]--; changed = true; } });
      return changed ? next : prev;
    }), 1000);
    return () => clearInterval(t);
  }, [paused]);

  if (!recipe) return null;

  const g = GOALS[recipe.mode] || GOALS[goal] || GOALS.normal;
  const theme = THEMES[themeId] || THEMES.purple;

  const normList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === "string") return v.split(/\n|•|,/).map(x => String(x).trim()).filter(Boolean);
    return [];
  };

  const normIngredients = normList(recipe.ingredients);
  const cleanSteps = normList(recipe.steps || recipe.instructions).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim());
  const youHaveList = normList(recipe.youHave);
  const youMightNeedList = normList(recipe.youMightNeed);

  const parseMins = (s) => { const m = s.match(/(\d+)\s*(hour|hr|min|mins|minutes)/i); if (!m) return null; return m[2].toLowerCase().startsWith("hour") ? parseInt(m[1]) * 60 : parseInt(m[1]); };
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const startTimer = (i, e) => { if(e) e.preventDefault(); const mins = parseMins(cleanSteps[i]); if (mins) { setTimers(p => ({ ...p, [i]: mins * 60 })); setPaused(p => ({ ...p, [i]: false })); } };
  const togglePause = (i, e) => { if(e) e.preventDefault(); setPaused(p => ({ ...p, [i]: !p[i] })); };
  
  const allIngredients = normIngredients.map(x => swapped[x] || x);
  const shareText = `🍲 ${recipe.title} - by Chef Didi\n⏱ ${recipe.time} • 🔥 ${recipe.caloriesPerSitting || recipe.calories}\n\nIngredients:\n${allIngredients.map(x => `• ${x}`).join("\n")}\n\nSteps:\n${cleanSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nMade with Chef Didi 💜`;
  
  const copyShare = async (e) => { 
    if(e) e.preventDefault();
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { } 
  };

  const handleFavClick = (e) => {
    if (e) e.preventDefault();
    const newFav = toggleFavourite(user, recipe);
    setFav(newFav);
    window.dispatchEvent(new Event("didi-fav-updated"));
    window.dispatchEvent(new Event("didi-sync-now"));
  };

  const handleClearAll = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.removeItem("didi_persisted_recipe");
      localStorage.removeItem("didi_active_ingredients");
    } catch {}
    if (onClear) onClear();
  };

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center`}>3</span>
        <h2 className="font-display font-light text-[21px]"><span className="italic text-[#7B61FF]">Didi's</span> Response</h2>
        <button type="button" onClick={handleFavClick} className={`ml-auto w-9 h-9 rounded-full flex items-center justify-center transition ${fav ? "bg-red-500 text-white" : "bg-stone-100"}`}><Heart size={16} fill={fav ? "white" : "none"} /></button>
        <button type="button" onClick={(e) => { e.preventDefault(); setShowShare(true); }} className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center"><Share2 size={16} /></button>
      </div>

      <div className={`text-white rounded-2xl p-4 mb-4 bg-gradient-to-br ${theme.btn}`}>
        <div className="flex justify-between gap-2 mb-2"><p className="text-[10px] font-bold tracking-[0.15em] text-white/85">YOUR ONE RECIPE</p><span className="text-[10px] font-bold bg-white text-[#1A1A2E] px-2.5 py-1 rounded-full">{g.emoji} {g.label.toUpperCase()}</span></div>
        <h3 className="font-display font-light text-[22px] leading-tight mb-3">{recipe.title}</h3>
        {recipe.leftoverUsed && <span className="inline-block mb-2 text-[11px] font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">♻️ Made from your leftovers</span>}
        {recipe.isPlan && <span className="inline-block mb-2 ml-1 text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">📅 {recipe.day || "Meal Plan"}{recipe.reuseFrom ? ` • Reuses: ${recipe.reuseFrom}` : ""}</span>}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">🕐 {recipe.time}</span>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">🍽 {recipe.servings || `${sittings} sittings`}</span>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">✦ {recipe.difficulty}</span>
          <span className="text-[11px] font-bold bg-white text-[#1A1A2E] px-2.5 py-1 rounded-full">🔥 {recipe.calories} • {recipe.caloriesPerSitting || recipe.calories} / sitting</span>
        </div>
        <p className="text-[11px] text-white/90 mt-3">{g.emoji} {g.desc} • {sittings} sittings • {recipe.totalCalories || g.calories} kcal total</p>
      </div>

      {recipe.description && <p className="text-[13px] text-stone-600 leading-relaxed mb-4">{recipe.description}</p>}

      {(youHaveList.length > 0 || youMightNeedList.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#FBFAFF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">✓ You have</p>{youHaveList.length ? youHaveList.map(x => <p key={x} className="text-[12px] text-stone-600">• {x}</p>) : <p className="text-[12px] text-stone-400">Surprise pick — Didi chose everything</p>}</div>
          <div className="bg-[#F5F0FF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">You might need</p>{youMightNeedList.length ? youMightNeedList.map(x => <p key={x} className="text-[12px] text-stone-600">• {x}</p>) : <p className="text-[12px] text-stone-400">Check ingredients below</p>}</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2"><p className="font-bold text-[13px]">Ingredients</p><span className="text-[11px] text-stone-400">Tap 🔄 to swap</span></div>
      {allIngredients.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4"><p className="text-[12px] font-bold text-amber-800">⚠️ This surprise recipe came back without ingredients — tap Generate Another to get a full one.</p></div>
      )}
      <div className="mb-4 space-y-1">
        {allIngredients.map((x, i) => {
          const swap = getDiasporaSwap(x, location);
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] text-stone-600">• {x} {swapped[normIngredients[i]] && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">swapped</span>}</p>
                <button type="button" onClick={(e) => { e.preventDefault(); setShowSwapFor(showSwapFor === i ? null : i); }} className="text-[11px] font-bold text-stone-400 flex items-center gap-1"><RefreshCw size={11} /> Swap</button>
              </div>
              {swap && <p className="text-[11px] text-blue-600 ml-3">✈️ Abroad: Use <b>{swap}</b> instead</p>}
            </div>
          );
        })}
        {showSwapFor !== null && (
          <div className="flex flex-wrap gap-1.5 mt-1 p-2 bg-stone-50 rounded-xl">
            {getSwaps(normIngredients[showSwapFor]).map(s => (<button type="button" key={s} onClick={(e) => { e.preventDefault(); setSwapped(p => ({ ...p, [normIngredients[showSwapFor]]: s })); setShowSwapFor(null); }} className="text-[11px] font-bold bg-white border px-2.5 py-1 rounded-full">{s}</button>))}
          </div>
        )}
      </div>

      <CostEstimator recipe={{ ...recipe, ingredients: allIngredients }} location={location} themeId={themeId} user={user} />
      <DiasporaTranslator recipe={{ ...recipe, ingredients: allIngredients }} />

      <p className="font-bold text-[13px] mb-2 mt-4">Steps <span className="text-[11px] font-normal text-stone-400">— tap timer to pause</span></p>
      {cleanSteps.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center"><p className="text-[13px] text-stone-500">No steps returned for this one. Tap <b>Generate Another</b> for a full recipe.</p></div>
      ) : (
      <div className="space-y-3 mb-4">
        {cleanSteps.map((s, i) => {
          const mins = parseMins(s); const left = timers[i];
          return (
            <div key={i} className="flex gap-2.5">
              <span className={`w-6 h-6 shrink-0 rounded-full bg-gradient-to-br ${theme.btn} text-white text-[11px] font-bold flex items-center justify-center`}>{i + 1}</span>
              <div className="flex-1"><p className="text-[13px] text-stone-700">{s}</p>
                {mins && (left > 0 ? (
                  <button type="button" onClick={(e) => togglePause(i, e)} className={`mt-1 text-[11px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${paused[i] ? "bg-stone-200 text-stone-600" : left <= 10 ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-700"}`}>
                    {paused[i] ? <Play size={11} /> : <Pause size={11} />}
                    {paused[i] ? `Timer paused • ${fmt(left)} — tap to resume` : `${fmt(left)} left — tap to pause`}
                  </button>
                ) : <button type="button" onClick={(e) => startTimer(i, e)} className="mt-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full inline-flex items-center gap-1"><Timer size={11} /> Start {mins} min timer</button>)}
              </div>
            </div>
          );
        })}
      </div>
      )}

      <div className="bg-[#F5F0FF] rounded-2xl p-3.5 mb-4 flex gap-1.5"><Sparkles size={14} className="shrink-0 mt-0.5 text-[#7B61FF]" /><p className="text-[12px] text-stone-600"><b>Tip:</b> {recipe.tip}</p></div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button type="button" onClick={(e) => { e.preventDefault(); setCookMode(true); }} className={`h-11 text-white rounded-full bg-gradient-to-r ${theme.btn} shadow-md flex items-center justify-center gap-1.5 text-[13px] font-bold`}><ChefHat size={15} /> Cook Mode</button>
        <button type="button" onClick={(e) => { e.preventDefault(); addToShopping(user, [...youMightNeedList, ...normIngredients]); setAddedShop(true); setTimeout(() => setAddedShop(false), 2000); }} className="h-11 bg-white border rounded-full flex items-center justify-center gap-1.5 text-[13px] font-bold"><ShoppingCart size={15} /> {addedShop ? "Added ✓" : "Shopping List"}</button>
      </div>

      {onAddToKcal && <button type="button" onClick={(e) => { e.preventDefault(); onAddToKcal(); }} className="w-full h-11 bg-[#1A1A2E] text-white rounded-full flex items-center justify-center gap-1.5 text-[13px] font-bold mb-2"><Flame size={15} /> Add this recipe to my Kcal today</button>}
      
      <div className="flex gap-2">
        <button type="button" onClick={(e) => { e.preventDefault(); if(onGenerateAnother) onGenerateAnother(); }} className={`flex-1 h-11 text-white rounded-full bg-gradient-to-r ${theme.btn} shadow-md text-[13px] font-bold`}>Generate Another</button>
        <button type="button" onClick={handleClearAll} className="flex-1 h-11 bg-white border rounded-full text-[13px] font-bold">Clear</button>
      </div>

      <p className="text-center text-[11px] text-stone-400 mt-3">{g.label} • {sittings} sittings • {recipe.caloriesPerSitting} kcal / sitting</p>

      {showShare && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-[24px] p-5 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between"><h3 className="font-bold">Share this recipe</h3><button type="button" onClick={() => setShowShare(false)} className="w-8 h-8 bg-stone-100 rounded-full"><X size={14} className="mx-auto" /></button></div>
            <button type="button" onClick={copyShare} className="w-full mt-4 h-11 bg-stone-100 rounded-full flex items-center justify-center gap-2 text-[13px] font-bold"><Copy size={14} /> {copied ? "Copied ✓" : "Copy Recipe Text"}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="w-full mt-2 h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center gap-2 text-[13px] font-bold"><MessageCircle size={15} /> Share on WhatsApp</a>
          </div>
        </div>
      )}

      {cookMode && (
        <div className="fixed inset-0 z-[100] bg-[#1A1A2E] text-white flex flex-col p-5">
          <div className="flex justify-between items-center"><p className="text-[11px] font-bold tracking-widest text-white/60">COOK MODE • STEP {stepIdx + 1} / {cleanSteps.length}</p><button type="button" onClick={() => setCookMode(false)} className="w-9 h-9 bg-white/20 rounded-full"><X size={16} className="mx-auto" /></button></div>
          <h3 className="font-display text-[26px] mt-4">{recipe.title}</h3>
          <div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden"><div className={`h-full bg-gradient-to-r ${theme.btn} transition-all`} style={{ width: `${((stepIdx + 1) / cleanSteps.length) * 100}%` }} /></div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[28px] leading-snug font-light">{cleanSteps[stepIdx]}</p>
            {parseMins(cleanSteps[stepIdx]) && (
              <button type="button" onClick={(e) => timers[stepIdx] > 0 ? togglePause(stepIdx, e) : startTimer(stepIdx, e)} className="mt-4 w-fit px-4 py-2 bg-white text-black rounded-full text-[13px] font-bold flex items-center gap-1.5">
                {timers[stepIdx] > 0 && paused[stepIdx] ? <Play size={14} /> : timers[stepIdx] > 0 ? <Pause size={14} /> : <Timer size={14} />}
                {timers[stepIdx] > 0 ? (paused[stepIdx] ? `Timer paused • ${fmt(timers[stepIdx])} — tap to resume` : `${fmt(timers[stepIdx])} — tap to pause`) : `Start ${parseMins(cleanSteps[stepIdx])} min timer`}
              </button>
            )}
          </div>
          <p className="text-[12px] text-white/60 mb-3">Ingredients: {allIngredients.slice(0, 4).join(" • ")}</p>
          <div className="flex gap-2 pb-2">
            <button type="button" disabled={stepIdx === 0} onClick={() => setStepIdx(s => s - 1)} className="flex-1 h-12 bg-white/20 rounded-full font-bold disabled:opacity-30">← Back</button>
            {stepIdx < cleanSteps.length - 1 ? <button type="button" onClick={() => setStepIdx(s => s + 1)} className={`flex-1 h-12 rounded-full font-bold bg-gradient-to-r ${theme.btn}`}>Next →</button> : <button type="button" onClick={() => setCookMode(false)} className="flex-1 h-12 bg-green-500 rounded-full font-bold flex items-center justify-center gap-1"><Check size={16} /> Done — Enjoy!</button>}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Heart, Share2, ShoppingCart, ChefHat, Timer, RefreshCw, Flame, X, Check, Copy, MessageCircle } from "lucide-react";
import { GOALS, THEMES, isFavourite, toggleFavourite, addToShopping, getSwaps } from "../lib/didi";
export default function AIResponse({ recipe, onGenerateAnother, onClear, goal, sittings, lang = 'en', themeId = 'purple', onAddToKcal, user }) {
  const [fav, setFav] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timers, setTimers] = useState({});
  const [swapped, setSwapped] = useState({});
  const [showSwapFor, setShowSwapFor] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedShop, setAddedShop] = useState(false);
  useEffect(() => { setFav(isFavourite(user, recipe?.title)); setStepIdx(0); setSwapped({}); setAddedShop(false); }, [recipe?.title]);
  useEffect(() => {
    const t = setInterval(() => setTimers(prev => { const next = { ...prev }; let changed = false; Object.keys(next).forEach(k => { if (next[k] > 0) { next[k]--; changed = true; } }); return changed ? next : prev; }), 1000);
    return () => clearInterval(t);
  }, []);
  if (!recipe) return null;
  const g = GOALS[recipe.mode] || GOALS[goal] || GOALS.normal;
  const theme = THEMES[themeId] || THEMES.purple;
  const cleanSteps = (recipe.steps || []).map(s => String(s).replace(/^Step\s*\d+\s*:\s*/i, "").trim());
  const parseMins = (s) => { const m = s.match(/(\d+)\s*(hour|hr|min|mins|minutes)/i); if (!m) return null; return m[2].toLowerCase().startsWith("hour") ? parseInt(m[1]) * 60 : parseInt(m[1]); };
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const startTimer = (i) => { const mins = parseMins(cleanSteps[i]); if (mins) setTimers(p => ({ ...p, [i]: mins * 60 })); };
  const allIngredients = (recipe.ingredients || []).map(x => swapped[x] || x);
  const shareText = `🍲 ${recipe.title} - by Chef Didi\n⏱ ${recipe.time} • 🔥 ${recipe.caloriesPerSitting || recipe.calories}\n\nIngredients:\n${allIngredients.map(x => `• ${x}`).join("\n")}\n\nSteps:\n${cleanSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nMade with Chef Didi 💜`;
  const copyShare = async () => { try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { } };
  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center`}>3</span>
        <h2 className="font-display font-light text-[21px]"><span className="italic text-[#7B61FF]">Didi's</span> Response</h2>
        <button onClick={() => setFav(toggleFavourite(user, recipe))} className={`ml-auto w-9 h-9 rounded-full flex items-center justify-center transition ${fav ? "bg-red-500 text-white" : "bg-stone-100"}`}><Heart size={16} fill={fav ? "white" : "none"} /></button>
        <button onClick={() => setShowShare(true)} className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center"><Share2 size={16} /></button>
      </div>
      <div className={`text-white rounded-2xl p-4 mb-4 bg-gradient-to-br ${theme.btn}`}>
        <div className="flex justify-between gap-2 mb-2"><p className="text-[10px] font-bold tracking-[0.15em] text-white/85">YOUR ONE RECIPE</p><span className="text-[10px] font-bold bg-white text-[#1A1A2E] px-2.5 py-1 rounded-full">{g.emoji} {g.label.toUpperCase()}</span></div>
        <h3 className="font-display font-light text-[22px] leading-tight mb-3">{recipe.title}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">🕐 {recipe.time}</span>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">🍽 {recipe.servings || `${sittings} sittings`}</span>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">✦ {recipe.difficulty}</span>
          <span className="text-[11px] font-bold bg-white text-[#1A1A2E] px-2.5 py-1 rounded-full">🔥 {recipe.calories} • {recipe.caloriesPerSitting || recipe.calories} / sitting</span>
        </div>
        <p className="text-[11px] text-white/90 mt-3">{g.emoji} {g.desc} • {sittings} sittings • {recipe.totalCalories || g.calories} kcal total</p>
      </div>
      {recipe.description && <p className="text-[13px] text-stone-600 leading-relaxed mb-4">{recipe.description}</p>}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#FBFAFF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">✓ You have</p>{(recipe.youHave || []).map(x => <p key={x} className="text-[12px] text-stone-600">• {x}</p>)}</div>
        <div className="bg-[#F5F0FF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">You might need</p>{(recipe.youMightNeed || []).map(x => <p key={x} className="text-[12px] text-stone-600">• {x}</p>)}</div>
      </div>
      <div className="flex items-center justify-between mb-2"><p className="font-bold text-[13px]">Ingredients</p><span className="text-[11px] text-stone-400">Tap 🔄 to swap</span></div>
      <div className="mb-4 space-y-1">
        {allIngredients.map((x, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-stone-600">• {x} {swapped[recipe.ingredients[i]] && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">swapped</span>}</p>
            <button onClick={() => setShowSwapFor(showSwapFor === i ? null : i)} className="text-[11px] font-bold text-stone-400 flex items-center gap-1"><RefreshCw size={11} /> Swap</button>
          </div>
        ))}
        {showSwapFor !== null && (
          <div className="flex flex-wrap gap-1.5 mt-1 p-2 bg-stone-50 rounded-xl">
            {getSwaps(recipe.ingredients[showSwapFor]).map(s => (<button key={s} onClick={() => { setSwapped(p => ({ ...p, [recipe.ingredients[showSwapFor]]: s })); setShowSwapFor(null); }} className="text-[11px] font-bold bg-white border px-2.5 py-1 rounded-full">{s}</button>))}
          </div>
        )}
      </div>
      <p className="font-bold text-[13px] mb-2">Steps <span className="text-[11px] font-normal text-stone-400">— tap ⏱ if a step has time</span></p>
      <div className="space-y-3 mb-4">
        {cleanSteps.map((s, i) => {
          const mins = parseMins(s); const left = timers[i];
          return (
            <div key={i} className="flex gap-2.5">
              <span className={`w-6 h-6 shrink-0 rounded-full bg-gradient-to-br ${theme.btn} text-white text-[11px] font-bold flex items-center justify-center`}>{i + 1}</span>
              <div className="flex-1"><p className="text-[13px] text-stone-700">{s}</p>
                {mins && (left > 0 ? <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-1 rounded-full ${left <= 10 ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-700"}`}><Timer size={11} /> {fmt(left)} left {left <= 10 && "— almost done!"}</span> : <button onClick={() => startTimer(i)} className="mt-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full inline-flex items-center gap-1"><Timer size={11} /> Start {mins} min timer</button>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#F5F0FF] rounded-2xl p-3.5 mb-4"><p className="text-[12px] text-stone-600">💡 <b>Tip:</b> {recipe.tip}</p></div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={() => setCookMode(true)} className={`h-11 text-white rounded-full bg-gradient-to-r ${theme.btn} shadow-md flex items-center justify-center gap-1.5 text-[13px] font-bold`}><ChefHat size={15} /> Cook Mode</button>
        <button onClick={() => { addToShopping(user, [...(recipe.youMightNeed || []), ...(recipe.ingredients || [])]); setAddedShop(true); setTimeout(() => setAddedShop(false), 2000); }} className="h-11 bg-white border rounded-full flex items-center justify-center gap-1.5 text-[13px] font-bold"><ShoppingCart size={15} /> {addedShop ? "Added ✓" : "Shopping List"}</button>
      </div>
      {onAddToKcal && <button onClick={onAddToKcal} className="w-full h-11 bg-[#1A1A2E] text-white rounded-full flex items-center justify-center gap-1.5 text-[13px] font-bold mb-2"><Flame size={15} /> Add this recipe to my Kcal today</button>}
      <div className="flex gap-2"><button onClick={onGenerateAnother} className={`flex-1 h-11 text-white rounded-full bg-gradient-to-r ${theme.btn} shadow-md text-[13px] font-bold`}>Generate Another</button><button onClick={onClear} className="flex-1 h-11 bg-white border rounded-full text-[13px] font-bold">Clear</button></div>
      <p className="text-center text-[11px] text-stone-400 mt-3">{g.label} • {sittings} sittings • {recipe.caloriesPerSitting} kcal / sitting</p>
      {showShare && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-[24px] p-5 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between"><h3 className="font-bold">Share this recipe</h3><button onClick={() => setShowShare(false)} className="w-8 h-8 bg-stone-100 rounded-full"><X size={14} className="mx-auto" /></button></div>
            <button onClick={copyShare} className="w-full mt-4 h-11 bg-stone-100 rounded-full flex items-center justify-center gap-2 text-[13px] font-bold"><Copy size={14} /> {copied ? "Copied ✓" : "Copy Recipe Text"}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="w-full mt-2 h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center gap-2 text-[13px] font-bold"><MessageCircle size={15} /> Share on WhatsApp</a>
          </div>
        </div>
      )}
      {cookMode && (
        <div className="fixed inset-0 z-[100] bg-[#1A1A2E] text-white flex flex-col p-5">
          <div className="flex justify-between items-center"><p className="text-[11px] font-bold tracking-widest text-white/60">COOK MODE • STEP {stepIdx + 1} / {cleanSteps.length}</p><button onClick={() => setCookMode(false)} className="w-9 h-9 bg-white/20 rounded-full"><X size={16} className="mx-auto" /></button></div>
          <h3 className="font-display text-[26px] mt-4">{recipe.title}</h3>
          <div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden"><div className={`h-full bg-gradient-to-r ${theme.btn} transition-all`} style={{ width: `${((stepIdx + 1) / cleanSteps.length) * 100}%` }} /></div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[28px] leading-snug font-light">{cleanSteps[stepIdx]}</p>
            {parseMins(cleanSteps[stepIdx]) && <button onClick={() => startTimer(stepIdx)} className="mt-4 w-fit px-4 py-2 bg-white text-black rounded-full text-[13px] font-bold flex items-center gap-1.5"><Timer size={14} /> {timers[stepIdx] > 0 ? fmt(timers[stepIdx]) : `Start ${parseMins(cleanSteps[stepIdx])} min timer`}</button>}
          </div>
          <p className="text-[12px] text-white/60 mb-3">Ingredients: {allIngredients.slice(0, 4).join(" • ")}</p>
          <div className="flex gap-2 pb-2">
            <button disabled={stepIdx === 0} onClick={() => setStepIdx(s => s - 1)} className="flex-1 h-12 bg-white/20 rounded-full font-bold disabled:opacity-30">← Back</button>
            {stepIdx < cleanSteps.length - 1 ? <button onClick={() => setStepIdx(s => s + 1)} className={`flex-1 h-12 rounded-full font-bold bg-gradient-to-r ${theme.btn}`}>Next →</button> : <button onClick={() => setCookMode(false)} className="flex-1 h-12 bg-green-500 rounded-full font-bold flex items-center justify-center gap-1"><Check size={16} /> Done — Enjoy!</button>}
          </div>
        </div>
      )}
    </div>
  );
}
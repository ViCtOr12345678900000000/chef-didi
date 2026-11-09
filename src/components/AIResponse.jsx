import { GOALS, THEMES, t } from "../lib/didi";
export default function AIResponse({ recipe, onGenerateAnother, onClear, goal, sittings, lang='en', themeId='purple' }) {
  if (!recipe) return null;
  const g = GOALS[recipe.mode] || GOALS[goal] || GOALS.normal;
  const theme = THEMES[themeId] || THEMES.purple;
  const cleanSteps = (recipe.steps||[]).map(s=>String(s).replace(/^Step\s*\d+\s*:\s*/i,"").trim());
  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 mb-4"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center`}>3</span><h2 className="font-display font-light text-[21px]"><span className="italic text-[#7B61FF]">Didi's</span> Response</h2><span className="ml-auto text-[10px] font-bold bg-[#F5F0FF] text-[#5A3EC8] px-2.5 py-1 rounded-full">ONE RECIPE</span></div>
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
        <div className="bg-[#FBFAFF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">✓ You have</p>{(recipe.youHave||[]).map(x=><p key={x} className="text-[12px] text-stone-600">• {x}</p>)}</div>
        <div className="bg-[#F5F0FF] border rounded-2xl p-3"><p className="font-bold text-[13px] mb-1">You might need</p>{(recipe.youMightNeed||[]).map(x=><p key={x} className="text-[12px] text-stone-600">• {x}</p>)}</div>
      </div>
      <p className="font-bold text-[13px] mb-2">Ingredients</p><div className="mb-4">{(recipe.ingredients||[]).map(x=><p key={x} className="text-[12px] text-stone-600">• {x}</p>)}</div>
      <p className="font-bold text-[13px] mb-2">Steps</p><div className="space-y-3 mb-4">{cleanSteps.map((s,i)=><div key={i} className="flex gap-2.5"><span className={`w-6 h-6 shrink-0 rounded-full bg-gradient-to-br ${theme.btn} text-white text-[11px] font-bold flex items-center justify-center`}>{i+1}</span><p className="text-[13px] text-stone-700">{s}</p></div>)}</div>
      <div className="bg-[#F5F0FF] rounded-2xl p-3.5 mb-4"><p className="text-[12px] text-stone-600">💡 <b>Tip:</b> {recipe.tip}</p></div>
      <div className="flex gap-2"><button onClick={onGenerateAnother} className={`flex-1 h-11 text-white rounded-full bg-gradient-to-r ${theme.btn} shadow-md`}>Generate Another</button><button onClick={onClear} className="flex-1 h-11 bg-white border rounded-full">Clear</button></div>
      <p className="text-center text-[11px] text-stone-400 mt-3">{g.label} • {sittings} sittings • {recipe.caloriesPerSitting} kcal / sitting</p>
    </div>
  );
}
export const MOCK_RECIPES = [{ id:1, title:"One-Pot Stir Fry", time:"25 mins", servings:"3 sittings", difficulty:"Easy", youHave:["Garlic"], youMightNeed:["Oil","Salt"], ingredients:["2 cloves Garlic"], steps:["Wash everything.","Heat oil, cook longest first.","Serve hot."], tip:"Start with longest ingredient.", variation:1, calories:"320 kcal", caloriesPerSitting:"320 kcal", totalCalories:960, mode:"normal" }];
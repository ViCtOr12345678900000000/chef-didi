import { useState } from "react";
import { getPantry, caloriesFor, THEMES } from "../lib/didi";

export default function WeeklyPlan({ user, goal, sittings, customCalories, cuisine, location, lang, themeId, onPickRecipe }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const cal = caloriesFor(goal, sittings, customCalories);
  const pantry = getPantry(user);

  const generatePlan = async () => {
    setLoading(true); setErr(""); setOpen(true);
    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: pantry, mode: goal, sittings, caloriesPerSitting: cal.perSitting, totalCalories: cal.total, lang, cuisine, location, planMode: true, planDays: 3 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlan(data.plan || []);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl mt-4">
      <div className="flex items-center justify-between">
        <div><h2 className="font-display font-light text-[20px]">📅 Pantry-first 3-Day Plan</h2><p className="text-[11px] text-stone-400">Uses what you already have: {pantry.slice(0,4).join(", ")}{pantry.length > 4 ? ` +${pantry.length-4} more` : ""} • Reuses Day 1 leftovers on Day 2</p></div>
        <button onClick={generatePlan} disabled={loading} className={`h-11 px-5 rounded-full text-white font-bold text-[13px] bg-gradient-to-r ${theme.btn}`}>{loading ? "Planning..." : "Build My Plan"}</button>
      </div>
      {err && <p className="text-[12px] text-red-600 mt-3">{err}</p>}
      {open && plan.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {plan.map((r) => (
            <button key={r.id} onClick={() => onPickRecipe?.(r)} className="text-left border rounded-2xl p-4 hover:shadow-md transition">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r ${theme.btn} text-white`}>{r.day}</span>
              <p className="font-bold text-[15px] mt-2 leading-tight">{r.title}</p>
              <p className="text-[11px] text-stone-400 mt-1">🕐 {r.time} • 🔥 {r.caloriesPerSitting} / sitting</p>
              {r.reuseFrom && <p className="text-[11px] text-green-700 bg-green-50 rounded-lg px-2 py-1 mt-2">♻️ Reuses: {r.reuseFrom}</p>}
              <p className="text-[11px] text-stone-500 mt-2 line-clamp-2">{r.description}</p>
              <p className="text-[12px] font-bold mt-2">View recipe →</p>
            </button>
          ))}
        </div>
      )}
      {open && !loading && plan.length === 0 && !err && <p className="text-[12px] text-stone-400 mt-3">Tap Build My Plan to generate from your pantry.</p>}
    </div>
  );
}

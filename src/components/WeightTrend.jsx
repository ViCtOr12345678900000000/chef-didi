import { useMemo } from "react";
import { getWeeklyKcal, getWeights, THEMES } from "../lib/didi";

export default function WeightTrend({ user, themeId }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const weekly = getWeeklyKcal(user);
  const weights = getWeights(user);
  const sortedWeights = useMemo(() => [...weights].sort((a,b) => new Date(a.date) - new Date(b.date)), [weights]);
  const first = sortedWeights[0];
  const last = sortedWeights[sortedWeights.length - 1];
  const weightChange = first && last && sortedWeights.length > 1 ? (parseFloat(last.kg) - parseFloat(first.kg)).toFixed(1) : null;
  const avgKcal = Math.round(weekly.reduce((s,w) => s + w.total, 0) / 7);
  const maxKcal = Math.max(...weekly.map(w => w.total), 100);
  const maxKg = Math.max(...sortedWeights.map(w => parseFloat(w.kg) || 0), 1);

  let insight = "Log weight + kcal for 3+ days to see your pattern.";
  if (weightChange !== null) {
    if (parseFloat(weightChange) < 0) insight = `Down ${Math.abs(weightChange)}kg while averaging ${avgKcal} kcal/day. Your current eating is working.`;
    else if (parseFloat(weightChange) > 0) insight = `Up ${weightChange}kg while averaging ${avgKcal} kcal/day. Try dropping ~200 kcal/day or 1 extra sitting of veg.`;
    else insight = `Weight steady at ${avgKcal} kcal/day avg. That's your maintenance level.`;
  }

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl mt-4">
      <h2 className="font-display font-light text-[20px]">📈 Kcal vs Weight — One Chart</h2>
      <p className="text-[11px] text-stone-400">Read-only. No new logging. Uses your existing CalorieCalculator + Weight logs.</p>
      <div className="bg-[#F5F0FF] rounded-2xl p-3 mt-3 text-[13px] font-semibold">{insight}</div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="bg-stone-50 rounded-xl p-3"><p className="text-[18px] font-bold">{avgKcal}</p><p className="text-[10px] text-stone-400">Avg kcal / day</p></div>
        <div className="bg-stone-50 rounded-xl p-3"><p className="text-[18px] font-bold">{weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}kg` : "—"}</p><p className="text-[10px] text-stone-400">Weight change</p></div>
        <div className="bg-stone-50 rounded-xl p-3"><p className="text-[18px] font-bold">{sortedWeights.length}</p><p className="text-[10px] text-stone-400">Weight logs</p></div>
      </div>
      <p className="text-[11px] font-bold mt-4 mb-2">This week — bars = kcal, dots = weight</p>
      <div className="flex items-end gap-2 h-[90px]">
        {weekly.map((w) => {
          const wForDay = sortedWeights.find(x => x.date === w.date);
          return (
            <div key={w.date} className="flex-1 flex flex-col items-center justify-end gap-1">
              {wForDay && <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded-full">{wForDay.kg}kg</span>}
              <span className="text-[9px] font-bold">{w.total || ""}</span>
              <div className={`w-full rounded-t-md bg-gradient-to-t ${theme.btn}`} style={{ height: `${Math.max(6, (w.total / maxKcal) * 60)}px` }} />
              <span className="text-[9px] text-stone-400">{w.day}</span>
            </div>
          );
        })}
      </div>
      {sortedWeights.length > 1 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold mb-2">Weight trend</p>
          <div className="flex items-end gap-1 h-[60px]">
            {sortedWeights.slice(-14).map((w,i) => (
              <div key={i} className="flex-1 flex flex-col items-center"><div className="w-full bg-stone-800 rounded-t" style={{ height: `${Math.max(8, (parseFloat(w.kg)/maxKg)*50)}px` }} /><span className="text-[8px] text-stone-400 mt-1">{new Date(w.date).toLocaleDateString("en",{day:"numeric",month:"short"})}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

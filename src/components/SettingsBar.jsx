import { useState } from "react";
import { THEMES, GOALS } from "../lib/didi";

export default function SettingsBar({ goal, setGoal, sittings, setSittings, themeId, setThemeId, lang, setLang, customCalories, setCustomCalories, user }) {
  const [showCustom, setShowCustom] = useState(!!customCalories);
  const theme = THEMES[themeId] || THEMES.purple;
  const isGuest = !user?.email;

  const handleToggleCustom = () => {
    // Custom Kcal stays locked for guests — this triggers login via locked setter in parent
    if (isGuest) {
      setCustomCalories(GOALS[goal]?.calories || 2000);
      return;
    }
    if (showCustom) {
      setCustomCalories(null);
      setShowCustom(false);
    } else {
      setShowCustom(true);
      setCustomCalories(GOALS[goal]?.calories || 2000);
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-4 md:p-5 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Goal</label>
          <select value={goal} onChange={e => setGoal(e.target.value)} className={`w-full h-11 mt-1 px-3 ${theme.softBg} border ${theme.softBorder} rounded-full text-[13px] font-semibold outline-none`}>
            {Object.values(GOALS).map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label} • {g.calories} kcal</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Sittings / Day</label>
          <div className={`flex gap-1 mt-1 p-1 ${theme.softBg} border ${theme.softBorder} rounded-full`}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setSittings(n)} className={`flex-1 h-9 rounded-full text-[13px] font-bold ${sittings === n ? `bg-gradient-to-r ${theme.btn} text-white shadow` : 'text-stone-500'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          {/* UNLOCKED: everyone can test gradients, no login needed */}
          <label className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Theme</label>
          <div className="flex gap-1.5 mt-2">
            {Object.entries(THEMES).map(([id, th]) => (
              <button key={id} onClick={() => setThemeId(id)} title={th.name} className={`w-9 h-9 rounded-full bg-gradient-to-br ${th.btn} cursor-pointer transition hover:scale-110 active:scale-95 ${themeId === id ? `ring-2 ring-offset-2 ${th.ring} scale-110` : 'opacity-70 hover:opacity-100'}`} />
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Tap to try a colour</p>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">Language</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className={`w-full h-11 mt-1 px-3 ${theme.softBg} border ${theme.softBorder} rounded-full text-[13px] font-semibold outline-none`}>
            <option value="en">🇬🇧 English</option><option value="yo">🇳🇬 Yorùbá</option><option value="ig">🇳🇬 Igbo</option><option value="ha">🇳🇬 Hausa</option><option value="pcm">🇳🇬 Pidgin</option><option value="fr">🇫🇷 French</option><option value="es">🇪🇸 Spanish</option><option value="pt">🇵🇹 Portuguese</option><option value="de">🇩🇪 German</option><option value="ar">🇸🇦 Arabic</option><option value="sw">🇰🇪 Swahili</option><option value="zu">🇿🇦 Zulu</option><option value="am">🇪🇹 Amharic</option><option value="hi">🇮🇳 Hindi</option><option value="zh">🇨🇳 Chinese</option><option value="ja">🇯🇵 Japanese</option>
          </select>
        </div>
      </div>

      <div className={`mt-3 ${theme.softBg} border ${theme.softBorder} rounded-2xl p-3 flex flex-col md:flex-row md:items-center gap-3`}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[18px]">🔥</span>
          <div>
            <p className="text-[13px] font-bold text-[#1A1A2E]">Daily Calories: {customCalories ? `${customCalories} kcal (Custom)` : `${GOALS[goal]?.calories} kcal (from ${GOALS[goal]?.label})`}</p>
            <p className="text-[11px] text-stone-400">Default comes from your Goal. Turn on Custom to change it. {isGuest && "• Login to use Custom"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showCustom && !isGuest && (
            <div className="flex items-center gap-1">
              <input type="number" min="800" max="6000" step="50" value={customCalories || ""} onChange={e => setCustomCalories(parseInt(e.target.value) || null)} className={`w-[110px] h-10 px-3 bg-white border ${theme.softBorder} rounded-full text-[13px] font-bold text-center outline-none ${theme.focus}`} placeholder="e.g. 2200" />
              <span className="text-[12px] font-bold text-stone-500">kcal</span>
              <div className="flex gap-1 ml-1">
                {[1800, 2200, 2500, 3000].map(v => (
                  <button key={v} onClick={() => setCustomCalories(v)} className={`h-8 px-2 rounded-full text-[11px] font-bold ${customCalories === v ? `bg-gradient-to-r ${theme.btn} text-white` : `bg-white border ${theme.softBorder} text-stone-500`}`}>{v}</button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleToggleCustom} className={`h-10 px-4 rounded-full text-[12px] font-bold whitespace-nowrap ${showCustom ? 'bg-[#1A1A2E] text-white' : `bg-gradient-to-r ${theme.btn} text-white shadow`}`}>
            {showCustom ? 'Use Goal Default ↩' : isGuest ? 'Set Custom' : 'Set Custom ✏️'}
          </button>
        </div>
      </div>
    </div>
  );
}

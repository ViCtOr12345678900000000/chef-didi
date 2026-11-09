import { GOALS, THEMES, LANGUAGES, t } from "../lib/didi";

export default function SettingsBar({ goal, setGoal, sittings, setSittings, themeId, setThemeId, lang, setLang, user }) {
  const theme = THEMES[themeId] || THEMES.purple;
  return (
    <div className="bg-white rounded-[20px] border border-[#EDEAFF] p-3 md:p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* GOAL DROPDOWN - Normal / Weight Loss / Weight Gain / Fit */}
      <label className="block">
        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">{t(lang,'goal')} {user ? `• ${user.name}` : ''}</span>
        <select value={goal} onChange={e=>setGoal(e.target.value)} className="w-full h-11 mt-1 px-3 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[13px] font-bold outline-none focus:border-[#7B61FF]">
          {Object.values(GOALS).map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>)}
        </select>
        <span className="text-[11px] text-stone-400 block mt-1">{GOALS[goal]?.desc}</span>
      </label>
      {/* SITTINGS + CALORIES */}
      <label className="block">
        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">{t(lang,'sittings')}</span>
        <div className="flex items-center gap-2 mt-1">
          <button type="button" onClick={()=>setSittings(Math.max(1, sittings-1))} className="w-11 h-11 rounded-full bg-[#F5F0FF] font-bold text-[18px]">−</button>
          <span className="flex-1 text-center h-11 flex items-center justify-center bg-[#FBFAFF] border border-[#EDEAFF] rounded-full font-bold text-[14px]">{sittings}×</span>
          <button type="button" onClick={()=>setSittings(Math.min(6, sittings+1))} className="w-11 h-11 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white font-bold text-[18px]">+</button>
        </div>
        <span className="text-[11px] text-stone-400 block mt-1">🔥 {Math.round((GOALS[goal]?.calories||2000)/sittings)} kcal {t(lang,'perSitting')} • {GOALS[goal]?.calories} total</span>
      </label>
      {/* THEME */}
      <div>
        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Color Theme</span>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {Object.values(THEMES).map(th => (
            <button key={th.id} type="button" onClick={()=>setThemeId(th.id)} title={th.name} className={`w-9 h-9 rounded-full bg-gradient-to-br ${th.page} ${themeId===th.id ? 'ring-2 ring-offset-2 ring-[#7B61FF] scale-110' : 'opacity-80 hover:opacity-100'} transition`} />
          ))}
        </div>
        <span className="text-[11px] text-stone-400 block mt-1">{theme.name} gradient</span>
      </div>
      {/* LANGUAGE */}
      <label className="block">
        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">🌍 Language</span>
        <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full h-11 mt-1 px-3 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[13px] font-bold outline-none focus:border-[#7B61FF]">
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <span className="text-[11px] text-stone-400 block mt-1">English • Yorùbá • Hausa • Igbo • Pidgin</span>
      </label>
    </div>
  );
}
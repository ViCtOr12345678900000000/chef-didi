import { useState, useEffect } from 'react';
import { ChefHat, Menu } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';
import AuthModal from './components/AuthModal';
import MyNumber from './components/MyNumber';
import Advertise from './components/Advertise';
import Sidebar from './components/Sidebar';
import { THEMES, getSession, logoutUser, getPrefs, savePrefs, t } from './lib/didi';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [themeId, setThemeId] = useState('purple');
  const [lang, setLang] = useState('en');
  const [showSidebar, setShowSidebar] = useState(false);

  const theme = THEMES[themeId] || THEMES.purple;

  const handleThemeChange = (newTheme) => setThemeId(newTheme);
  const handleLangChange = (newLang) => setLang(newLang);

  const restoreFromCloud = async (email) => {
    try {
      const clean = email.toLowerCase().trim();
      const res = await fetch(`/api/profile?email=${encodeURIComponent(clean)}`);
      const { data } = await res.json();
      if (!data) return false;
      if (data.prefs) savePrefs(clean, data.prefs);
      if (data.fav) localStorage.setItem(`didi_fav_${clean}`, JSON.stringify(data.fav));
      if (data.history) localStorage.setItem(`didi_history_${clean}`, JSON.stringify(data.history));
      if (data.shopping) localStorage.setItem(`didi_shopping_${clean}`, JSON.stringify(data.shopping));
      if (data.pantry) localStorage.setItem(`didi_pantry_${clean}`, JSON.stringify(data.pantry));
      if (data.weights) localStorage.setItem(`didi_weights_${clean}`, JSON.stringify(data.weights));
      if (data.kcal) for (const [day, items] of Object.entries(data.kcal)) localStorage.setItem(`didi_kcal_${clean}_${day}`, JSON.stringify(items));
      if (data.water) for (const [day, n] of Object.entries(data.water)) localStorage.setItem(`didi_water_${clean}_${day}`, JSON.stringify(n));
      return true;
    } catch { return false; }
  };

  const doMigrate = async () => {
    try {
      const s = getSession();
      if (!s?.email) return;
      if (localStorage.getItem("didi-migrated")) return;
      const email = s.email.toLowerCase().trim();
      const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
      const found = users.find((u) => u.email === email);
      await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ users: [{ email, name: s.name || found?.name || "", password: found?.password || "", createdAt: new Date().toISOString(), migrated: true }] }) });
      localStorage.setItem("didi-migrated", "1");
    } catch {}
  };

  useEffect(() => {
    const s = getSession();
    if (s) {
      setUser(s);
      restoreFromCloud(s.email).then(() => {
        const p = getPrefs(s.email);
        setThemeId(p.theme || 'purple');
        setLang(p.lang || 'en');
        window.dispatchEvent(new Event("didi-data-restored"));
      });
    } else {
      try {
        const g = JSON.parse(localStorage.getItem("didi_prefs_guest") || "{}");
        if (g.theme) setThemeId(g.theme);
        if (g.lang) setLang(g.lang);
      } catch {}
    }
  }, []);

  useEffect(() => { doMigrate(); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#my-number') return;
    if (!sessionStorage.getItem('didi-counted')) {
      sessionStorage.setItem('didi-counted', '1');
      fetch('/api/track').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user?.email) savePrefs(user.email, { theme: themeId, lang });
    else localStorage.setItem("didi_prefs_guest", JSON.stringify({ theme: themeId, lang }));
  }, [themeId, lang, user?.email]);

  const handleAuth = async (u) => {
    const session = { email: u.email, name: u.name };
    setUser(session); setShowAuth(false);
    localStorage.removeItem("didi_guest_count");
    await restoreFromCloud(u.email);
    const p = getPrefs(u.email);
    if (p.theme) setThemeId(p.theme);
    if (p.lang) setLang(p.lang);
    window.dispatchEvent(new Event("didi-data-restored"));
  };

  const handleLogout = () => {
    const currentTheme = themeId; const currentLang = lang;
    logoutUser(); setUser(null); setThemeId(currentTheme); setLang(currentLang);
    localStorage.setItem("didi_prefs_guest", JSON.stringify({ theme: currentTheme, lang: currentLang }));
  };

  const prefs = user?.email ? getPrefs(user.email) : null;

  if (typeof window !== 'undefined' && window.location.hash === '#advertise') return <Advertise />;
  if (typeof window !== 'undefined' && window.location.hash === '#my-number') return <MyNumber />;

  return (
    <div className="min-h-screen bg-white w-[100vw] py-8 relative">
      <div className={`absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b ${theme.softBg} to-white pointer-events-none`} />

      {/* HAMBURGER BUTTON */}
      <button onClick={() => setShowSidebar(true)} className={`fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white border ${theme.softBorder} shadow-md flex items-center justify-center ${theme.accent} hover:scale-105 active:scale-95 transition`}>
        <Menu size={20} />
      </button>

      <Sidebar theme={theme} open={showSidebar} onClose={() => setShowSidebar(false)} user={user} onLogin={() => { setShowSidebar(false); setShowAuth(true); }} />

      <div className="relative text-center mb-6 px-4">
        <div className={`w-11 h-11 mx-auto mb-3 rounded-xl bg-white border ${theme.softBorder} ${theme.accent} flex items-center justify-center shadow-sm`}>
          <ChefHat size={20} />
        </div>
        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1A1A2E]">Chef <span className={`italic font-light ${theme.accent}`}>Didi</span></h1>
        <p className={`inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] ${theme.accent} uppercase bg-white border ${theme.softBorder} rounded-full px-4 py-1.5 mt-3 shadow-sm`}>✦ No waste • Use what you have</p>
        <p className="text-stone-500 text-[15px] mt-3 font-light">Enter what you have. Get a recipe.</p>
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          {user ? (
            <>
              <span className={`text-[12px] font-bold ${theme.softBg} ${theme.accent} px-4 py-2 rounded-full`}>👋 {t(lang, 'welcome')}, {user.name} • {prefs?.goal === 'weightloss' ? '⬇ Weight Loss' : prefs?.goal === 'weightgain' ? '⬆ Weight Gain' : prefs?.goal === 'fit' ? '🏋️ Fit' : '🍲 Normal'} • {prefs?.sittings || 3} sittings</span>
              <button onClick={handleLogout} className={`text-[12px] font-bold bg-white border ${theme.softBorder} px-4 py-2 rounded-full ${theme.hover} hover:text-white transition`}>{t(lang, 'logout')}</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className={`text-[12px] font-bold bg-gradient-to-r ${theme.btn} text-white px-5 py-2.5 rounded-full shadow-md hover:opacity-90 active:scale-95 transition`}>{t(lang, 'login')} / Register →</button>
          )}
        </div>
        {!user && <p className="text-[11px] text-stone-400 mt-2">Try any colour below 👇 — Login to save your Goal • Theme • Language • Kcal history</p>}
      </div>

      <IngredientPicker user={user} themeId={themeId} setThemeId={handleThemeChange} lang={lang} setLang={handleLangChange} onRequireAuth={() => setShowAuth(true)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
      <p className="relative text-center text-[11px] text-stone-300 mt-10 pb-2">Made with 💜• © 2026 Didi • Cook what you have</p>
    </div>
  );
}

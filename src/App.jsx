import { useState, useEffect } from 'react';
import { ChefHat } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';
import AuthModal from './components/AuthModal';
import MyNumber from './components/MyNumber';
import { THEMES, getSession, logoutUser, getPrefs, savePrefs, t } from './lib/didi';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [themeId, setThemeId] = useState('purple');
  const [lang, setLang] = useState('en');

  const theme = THEMES[themeId] || THEMES.purple;

  // On load: if logged in, restore saved prefs -> goal/theme/lang/sittings auto-switch
  useEffect(() => {
    const s = getSession();
    if (s) {
      setUser(s);
      const p = getPrefs(s.email);
      setThemeId(p.theme || 'purple');
      setLang(p.lang || 'en');
    }
  }, []);

  // MIGRATION: copy ALL localStorage to Upstash once
  // This runs once per user. After this, they are in the real database.
  // No re-register, no lost theme / favs / history / weights / kcal.
  useEffect(() => {
    const migrate = async () => {
      try {
        const s = getSession();
        if (!s?.email) return;
        if (localStorage.getItem("didi-migrated")) return;

        const email = s.email.toLowerCase();
        const users = JSON.parse(
          localStorage.getItem("didi_users") || "[]"
        );
        const found = users.find(
          (u) => u.email === email
        );

        // Collect kcal for last 30 days
        const kcal = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const day = d.toISOString().slice(0, 10);
          const key = `didi_kcal_${email}_${day}`;
          const val = localStorage.getItem(key);
          if (val) kcal[day] = JSON.parse(val);
        }

        const bundle = {
          email,
          name: s.name || found?.name || "",
          password: found?.password || "",
          prefs: getPrefs(email),
          fav: JSON.parse(
            localStorage.getItem(`didi_fav_${email}`) || "[]"
          ),
          history: JSON.parse(
            localStorage.getItem(`didi_history_${email}`) || "[]"
          ),
          shopping: JSON.parse(
            localStorage.getItem(`didi_shopping_${email}`) || "[]"
          ),
          pantry: JSON.parse(
            localStorage.getItem(`didi_pantry_${email}`) || "[]"
          ),
          weights: JSON.parse(
            localStorage.getItem(`didi_weights_${email}`) || "[]"
          ),
          kcal,
          createdAt: new Date().toISOString(),
          migrated: true,
        };

        await fetch("/api/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bundle),
        });

        localStorage.setItem("didi-migrated", "1");
      } catch (e) {}
    };
    migrate();
  }, []);

  // Count 1 visit per person per session - but NOT when you open the secret page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#my-number') {
      return;
    }
    if (!sessionStorage.getItem('didi-counted')) {
      sessionStorage.setItem('didi-counted', '1');
      fetch('/api/track').catch(() => {});
    }
  }, []);

  // Save theme + lang even when user changes them in Picker
  useEffect(() => {
    if (user?.email) savePrefs(user.email, { theme: themeId, lang });
  }, [themeId, lang, user?.email]);

  const handleAuth = (u) => {
    const session = { email: u.email, name: u.name };
    setUser(session);
    setShowAuth(false);
    // Load that user's saved prefs immediately
    const p = getPrefs(u.email);
    setThemeId(p.theme || 'purple');
    setLang(p.lang || 'en');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setThemeId('purple');
    setLang('en');
  };

  const prefs = user?.email ? getPrefs(user.email) : null;

  // SECRET PAGE - only you know this link: /#my-number
  // Shows ONLY the number, no words
  if (typeof window !== 'undefined' && window.location.hash === '#my-number') {
    return <MyNumber />;
  }

  return (
    <div className="min-h-screen bg-white w-[100vw] py-8 relative">
      {/* Very faint theme wash at very top only - rest is pure white */}
      <div className={`absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b ${theme.softBg} to-white pointer-events-none`} />

      <div className="relative text-center mb-6 px-4">
        {/* Theme accent only - icon */}
        <div className={`w-11 h-11 mx-auto mb-3 rounded-xl bg-white border ${theme.softBorder} ${theme.accent} flex items-center justify-center shadow-sm`}>
          <ChefHat size={20} />
        </div>

        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1A1A2E]">
          Chef <span className={`italic font-light ${theme.accent}`}>Didi</span>
        </h1>

        <p className={`inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] ${theme.accent} uppercase bg-white border ${theme.softBorder} rounded-full px-4 py-1.5 mt-3 shadow-sm`}>
          ✦ No waste • Use what you have
        </p>

        <p className="text-stone-500 text-[15px] mt-3 font-light">
          Enter what you have. Get a recipe.
        </p>

        {/* AUTH + SAVED PREFS */}
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          {user ? (
            <>
              <span className={`text-[12px] font-bold ${theme.softBg} ${theme.accent} px-4 py-2 rounded-full`}>
                👋 {t(lang, 'welcome')}, {user.name} • {prefs?.goal === 'weightloss' ? '⬇ Weight Loss' : prefs?.goal === 'weightgain' ? '⬆ Weight Gain' : prefs?.goal === 'fit' ? '🏋️ Fit' : '🍲 Normal'} • {prefs?.sittings || 3} sittings
              </span>
              <button onClick={handleLogout} className={`text-[12px] font-bold bg-white border ${theme.softBorder} px-4 py-2 rounded-full ${theme.hover} hover:text-white transition`}>
                {t(lang, 'logout')}
              </button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className={`text-[12px] font-bold bg-gradient-to-r ${theme.btn} text-white px-5 py-2.5 rounded-full shadow-md hover:opacity-90 active:scale-95 transition`}>
              {t(lang, 'login')} / Register →
            </button>
          )}
        </div>

        {/* Small hint when logged out */}
        {!user && (
          <p className="text-[11px] text-stone-400 mt-2">
            Login to save your Goal • Theme • Language • Kcal history
          </p>
        )}
      </div>

      {/* IngredientPicker = Theme block + SettingsBar + AI Kcal Calculator + Camera + 3 cards */}
      <IngredientPicker user={user} themeId={themeId} setThemeId={setThemeId} lang={lang} setLang={setLang} />

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}

      <p className="relative text-center text-[11px] text-stone-300 mt-10 pb-2">
        Made with 💜 in Lagos • © 2026 Didi • Cook what you have
      </p>
    </div>
  );
}

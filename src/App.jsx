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

  const requireLogin = () => {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    return true;
  };

  const handleThemeChange = (newTheme) => {
    if (!requireLogin()) return;
    setThemeId(newTheme);
  };

  // ---------- RESTORE CLOUD DATA INTO localStorage ----------
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

      if (data.kcal) {
        for (const [day, items] of Object.entries(data.kcal)) {
          localStorage.setItem(`didi_kcal_${clean}_${day}`, JSON.stringify(items));
        }
      }
      if (data.water) {
        for (const [day, n] of Object.entries(data.water)) {
          localStorage.setItem(`didi_water_${clean}_${day}`, JSON.stringify(n));
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  // ---------- BUILD BUNDLE FROM localStorage ----------
  const buildBundle = (s) => {
    const email = s.email.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
    const found = users.find((u) => u.email === email);

    const kcal = {};
    const water = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0, 10);
      const v = localStorage.getItem(`didi_kcal_${email}_${day}`);
      if (v) kcal[day] = JSON.parse(v);
      const w = localStorage.getItem(`didi_water_${email}_${day}`);
      if (w) water[day] = JSON.parse(w);
    }

    return {
      email,
      name: s.name || found?.name || "",
      password: found?.password || "",
      prefs: getPrefs(email),
      fav: JSON.parse(localStorage.getItem(`didi_fav_${email}`) || "[]"),
      history: JSON.parse(localStorage.getItem(`didi_history_${email}`) || "[]"),
      shopping: JSON.parse(localStorage.getItem(`didi_shopping_${email}`) || "[]"),
      pantry: JSON.parse(localStorage.getItem(`didi_pantry_${email}`) || "[]"),
      weights: JSON.parse(localStorage.getItem(`didi_weights_${email}`) || "[]"),
      kcal,
      water,
      createdAt: new Date().toISOString(),
      migrated: true,
    };
  };

  // ---------- MIGRATE: login list + profile data (ALWAYS overwrites) ----------
  const doMigrate = async (force = false) => {
    try {
      const s = getSession();
      if (!s?.email) return { ok: false, reason: 'no session' };
      if (!force && localStorage.getItem("didi-migrated")) return { ok: false, reason: 'already flagged' };

      const bundle = buildBundle(s);
      console.log("Pushing to Upstash:", bundle.email, "password found?", !!bundle.password, "kcal days:", Object.keys(bundle.kcal).length);

      // 1) for login
      await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: [bundle] }),
      });

      // 2) for data restore - always overwrites
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bundle.email, data: bundle }),
      });

      if (!res.ok) return { ok: false, reason: 'api failed ' + res.status };
      localStorage.setItem("didi-migrated", "1");
      return { ok: true, hasPassword: !!bundle.password };
    } catch (e) {
      return { ok: false, reason: String(e) };
    }
  };

  // ---------- ON LOAD: restore session + cloud data ----------
  useEffect(() => {
    const s = getSession();
    if (s) {
      setUser(s);
      // Try to restore cloud data first, then apply prefs
      restoreFromCloud(s.email).then(() => {
        const p = getPrefs(s.email);
        setThemeId(p.theme || 'purple');
        setLang(p.lang || 'en');
        window.dispatchEvent(new Event("didi-data-restored"));
      });
    }
  }, []);

  // AUTO MIGRATION on load
  useEffect(() => {
    doMigrate(false);
  }, []);

  // FORCE SYNC BUTTON - for phone
  const handleForceSync = async () => {
    const result = await doMigrate(true);
    if (result.ok) {
      alert(`✅ Synced to Upstash! Password saved: ${result.hasPassword ? 'YES' : 'NO - SEE WARNING BELOW'}\n\nNow try login in Incognito.`);
    } else {
      alert(`❌ Sync failed: ${result.reason}`);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#my-number') return;
    if (!sessionStorage.getItem('didi-counted')) {
      sessionStorage.setItem('didi-counted', '1');
      fetch('/api/track').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user?.email) savePrefs(user.email, { theme: themeId, lang });
  }, [themeId, lang, user?.email]);

  // ---------- LOGIN: download cloud data FIRST ----------
  const handleAuth = async (u) => {
    const session = { email: u.email, name: u.name };
    setUser(session);
    setShowAuth(false);
    localStorage.removeItem("didi_guest_count");

    await restoreFromCloud(u.email);

    const p = getPrefs(u.email);
    setThemeId(p.theme || 'purple');
    setLang(p.lang || 'en');
    window.dispatchEvent(new Event("didi-data-restored"));
    setTimeout(() => doMigrate(true), 500);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setThemeId('purple');
    setLang('en');
  };

  const prefs = user?.email ? getPrefs(user.email) : null;

  if (typeof window !== 'undefined' && window.location.hash === '#my-number') {
    return <MyNumber />;
  }

  return (
    <div className="min-h-screen bg-white w-[100vw] py-8 relative">
      <div className={`absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b ${theme.softBg} to-white pointer-events-none`} />

      <div className="relative text-center mb-6 px-4">
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

        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          {user ? (
            <>
              <span className={`text-[12px] font-bold ${theme.softBg} ${theme.accent} px-4 py-2 rounded-full`}>
                👋 {t(lang, 'welcome')}, {user.name} • {prefs?.goal === 'weightloss' ? '⬇ Weight Loss' : prefs?.goal === 'weightgain' ? '⬆ Weight Gain' : prefs?.goal === 'fit' ? '🏋️ Fit' : '🍲 Normal'} • {prefs?.sittings || 3} sittings
              </span>
              <button onClick={handleForceSync} className="text-[12px] font-bold bg-red-500 text-white px-4 py-2 rounded-full">
                🔄 Sync to Cloud
              </button>
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

        {!user && (
          <p className="text-[11px] text-stone-400 mt-2">
            Login to save your Goal • Theme • Language • Kcal history
          </p>
        )}
      </div>

      <IngredientPicker 
        user={user} 
        themeId={themeId} 
        setThemeId={handleThemeChange} 
        lang={lang} 
        setLang={setLang} 
        onRequireAuth={() => setShowAuth(true)} 
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}

      <p className="relative text-center text-[11px] text-stone-300 mt-10 pb-2">
        Made with 💜 in Lagos • © 2026 Didi • Cook what you have
      </p>
    </div>
  );
}

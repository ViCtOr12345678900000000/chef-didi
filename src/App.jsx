import { useState, useEffect, useRef, useCallback } from 'react';
import { ChefHat, Menu, Home, CookingPot, Calculator, ChefHat as KitchenIcon, MoreHorizontal, Check, Heart, History, ShoppingCart } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import Advertise from './components/Advertise';
import Testing from './components/Testing';
import Sidebar from './components/Sidebar';
import AdSlot from './components/AdSlot';
import Footer from './components/Footer';
import CalorieCalculator from './components/CalorieCalculator';
import WeightTrend from './components/WeightTrend';
import WeeklyPlan from './components/WeeklyPlan';
import { THEMES, getSession, logoutUser, getPrefs, savePrefs, t, getFavourites, getHistory, getShopping, toggleShopping, clearShopping, getPantry, savePantry } from './lib/didi';

const IDLE_TIMEOUT = 5 * 60 * 1000;

// --- CALCULATOR: Calorie + Weight together, once ---
function CalculatorTab({ user, themeId, lang, onRequireAuth }) {
  const [goal] = useState(() => user?.email ? (getPrefs(user.email).goal || 'normal') : 'normal');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener("didi-kcal-updated", bump);
    window.addEventListener("didi-data-restored", bump);
    return () => { window.removeEventListener("didi-kcal-updated", bump); window.removeEventListener("didi-data-restored", bump); };
  }, []);
  return (
    <div className="px-4 max-w-[600px] mx-auto space-y-4">
      <h2 className="text-xl font-bold text-[#1A1A2E]">🔥 Calorie Calculator</h2>
      <p className="text-stone-500 text-sm -mt-2">Track what you eat, see calories vs weight.</p>
      <CalorieCalculator key={version} user={user} goal={goal} themeId={themeId} lang={lang} customCalories={null} onRequireAuth={onRequireAuth} />
      <WeightTrend user={user} themeId={themeId} />
    </div>
  );
}

// --- KITCHEN: was Review. Now Leftover + Pantry + 3-Day Plan + Favs + Reviews ---
function KitchenTab({ user, themeId, lang, onRequireAuth, onPickRecipe }) {
  const isGuest = !user?.email;
  const [leftoverInput, setLeftoverInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leftoverRecipe, setLeftoverRecipe] = useState(null);
  const [pantry, setPantry] = useState(() => getPantry(user));
  const [pantryInput, setPantryInput] = useState('');
  const [favList, setFavList] = useState(() => getFavourites(user));
  const [histList, setHistList] = useState(() => getHistory(user));
  const [shopList, setShopList] = useState(() => getShopping(user));
  const [showFav, setShowFav] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [text, setText] = useState('');
  const [stars, setStars] = useState(5);
  const [reviews, setReviews] = useState(() => { try { return JSON.parse(localStorage.getItem('didi_reviews') || '[]'); } catch { return []; } });
  const [goal] = useState(() => user?.email ? (getPrefs(user.email).goal || 'normal') : 'normal');
  const [sittings] = useState(() => user?.email ? (getPrefs(user.email).sittings || 3) : 3);
  const [cuisine] = useState(() => user?.email ? (getPrefs(user.email).cuisine || 'auto') : 'auto');
  const [location] = useState(() => user?.email ? (getPrefs(user.email).location || 'nigeria') : 'nigeria');

  useEffect(() => {
    const sync = () => { setFavList(getFavourites(user)); setHistList(getHistory(user)); setShopList(getShopping(user)); setPantry(getPantry(user)); };
    window.addEventListener("didi-fav-updated", sync); window.addEventListener("didi-history-updated", sync);
    window.addEventListener("didi-shopping-updated", sync); window.addEventListener("didi-pantry-updated", sync);
    window.addEventListener("didi-data-restored", sync);
    return () => { window.removeEventListener("didi-fav-updated", sync); window.removeEventListener("didi-history-updated", sync); window.removeEventListener("didi-shopping-updated", sync); window.removeEventListener("didi-pantry-updated", sync); window.removeEventListener("didi-data-restored", sync); };
  }, [user?.email]);

  const handleLeftover = async () => {
    if (!leftoverInput.trim()) return;
    if (isGuest) { onRequireAuth?.(); return; }
    setIsLoading(true);
    try {
      const leftovers = leftoverInput.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/generate-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: leftovers, mode: goal, sittings, caloriesPerSitting: 450, totalCalories: 450 * sittings, lang, cuisine, location, leftover: true }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed");
      setLeftoverRecipe(data.recipe);
    } catch(e) { alert(e.message); } finally { setIsLoading(false); }
  };

  const addPantryItem = () => {
    if (isGuest) { onRequireAuth?.(); return; }
    if (!pantryInput.trim()) return;
    const n = [...pantry, pantryInput.trim()]; setPantry(n); savePantry(user, n); setPantryInput('');
  };

  const submitReview = () => {
    if (!text.trim()) return;
    if (!user?.email) { onRequireAuth?.(); return; }
    const r = { id: Date.now(), name: name || user.name || 'Didi User', text: text.trim(), stars, date: new Date().toLocaleDateString() };
    const next = [r, ...reviews].slice(0, 50); setReviews(next); localStorage.setItem('didi_reviews', JSON.stringify(next)); setText('');
  };

  return (
    <div className="px-4 max-w-[600px] mx-auto space-y-4">
      <h2 className="text-xl font-bold text-[#1A1A2E]">🍳 My Kitchen</h2>
      <p className="text-stone-500 text-sm -mt-2">Leftovers, pantry, meal plan, favourites & reviews.</p>

      {/* LEFTOVER RESCUE */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold">♻️ Leftover Rescue</h3>
        <p className="text-xs text-stone-400">Got leftover jollof? Don’t throw it. Didi remixes it.</p>
        <div className="flex gap-2 mt-3">
          <input value={leftoverInput} onChange={e => setLeftoverInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLeftover()} placeholder="e.g. leftover jollof, 2 eggs" className="flex-1 min-w-0 h-11 px-3 bg-stone-50 border rounded-full text-sm outline-none" />
          <button onClick={handleLeftover} disabled={isLoading || !leftoverInput.trim()} className="shrink-0 h-11 px-4 rounded-full text-white font-bold text-xs bg-purple-600">{isLoading ? "Rescuing..." : "Rescue It"}</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">{['leftover jollof, 2 eggs','leftover rice, chicken','leftover beans, plantain'].map(s => (<button key={s} onClick={() => setLeftoverInput(s)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full border bg-stone-50">{s}</button>))}</div>
        {leftoverRecipe && <button onClick={() => onPickRecipe(leftoverRecipe)} className="w-full mt-3 text-left border rounded-xl p-3"><span className="block font-bold text-sm">{leftoverRecipe.title}</span><span className="text-xs text-stone-400">{leftoverRecipe.time} • Tap to open in Cook →</span></button>}
      </div>

      {/* PANTRY */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold">🥫 My Pantry</h3>
        <p className="text-xs text-stone-400">Always at home — tap to use in Cook.</p>
        <div className="flex flex-wrap gap-1.5 mt-3">{pantry.length === 0 ? <p className="text-xs text-stone-400">No pantry items yet.</p> : pantry.map(p => (<span key={p} className="text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">{p}</span>))}</div>
        <div className="flex gap-1.5 mt-2"><input value={pantryInput} onChange={e => setPantryInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPantryItem()} placeholder={isGuest ? "Login to add 🔒" : "Add e.g. Maggi"} className="flex-1 h-10 px-3 bg-stone-50 border rounded-full text-xs outline-none" /><button onClick={addPantryItem} className="h-10 px-4 bg-green-600 text-white rounded-full text-xs font-bold">Add</button></div>
      </div>

      {/* 3-DAY PLAN */}
      <WeeklyPlan user={user} goal={goal} sittings={sittings} customCalories={null} cuisine={cuisine} location={location} lang={lang} themeId={themeId} onPickRecipe={(r) => onPickRecipe(r)} />

      {/* FAVS / HISTORY / SHOPPING */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-2">
        <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowFav(!showFav); setShowHist(false); setShowShop(false); }} className="h-10 px-4 rounded-full text-xs font-bold bg-stone-100">❤️ Favourites {isGuest ? "🔒" : `(${favList.length})`}</button>
        <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowHist(!showHist); setShowFav(false); setShowShop(false); }} className="h-10 px-4 rounded-full text-xs font-bold bg-stone-100">🕒 History {isGuest ? "🔒" : `(${histList.length})`}</button>
        <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowShop(!showShop); setShowFav(false); setShowHist(false); }} className="h-10 px-4 rounded-full text-xs font-bold bg-stone-100">🛒 Shopping {isGuest ? "🔒" : `(${shopList.filter(i => !i.done).length} left)`}</button>
      </div>
      {(showFav || showHist) && !isGuest && (
        <div className="bg-white border rounded-2xl p-3 shadow-sm space-y-2">
          {(showFav ? favList : histList).length === 0 ? <p className="text-xs text-stone-400 text-center py-3">Nothing here yet.</p> : (showFav ? favList : histList).map(r => (<button key={r.title + (r.savedAt || r.viewedAt || "")} onClick={() => onPickRecipe(r)} className="w-full text-left border rounded-xl p-3 flex justify-between"><span><span className="block text-sm font-bold">{r.title}</span><span className="text-xs text-stone-400">{r.time} • {r.caloriesPerSitting || r.calories}</span></span><span>→</span></button>))}
        </div>
      )}
      {showShop && !isGuest && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          {shopList.length === 0 ? <p className="text-xs text-stone-400 text-center">Shopping list empty.</p> : shopList.map(i => (<button key={i.id} onClick={() => setShopList(toggleShopping(user, i.id))} className="w-full flex items-center gap-2 py-2 border-b last:border-0 text-left"><span className={`w-5 h-5 rounded-full border flex items-center justify-center ${i.done ? "bg-green-500 text-white" : ""}`}>{i.done && <Check size={12} />}</span><span className={`text-sm ${i.done ? "line-through text-stone-400" : "font-semibold"}`}>{i.name}</span></button>))}
          {shopList.length > 0 && <button onClick={() => setShopList(clearShopping(user, true))} className="mt-2 text-xs font-bold text-red-500">Clear ticked</button>}
        </div>
      )}

      {/* REVIEWS - now inside Kitchen */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold">⭐ Reviews</h3>
        <div className="flex gap-1">{[1,2,3,4,5].map(s => (<button key={s} onClick={() => setStars(s)} className="text-2xl">{s <= stars ? '⭐' : '☆'}</button>))}</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full h-11 px-3 bg-stone-50 border rounded-xl text-sm outline-none" />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. I had rice and chicken, Didi made fried rice. No waste!" className="w-full px-3 py-2 bg-stone-50 border rounded-xl text-sm outline-none min-h-[80px]" />
        <button onClick={submitReview} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl text-sm">Post Review</button>
      </div>
      {reviews.map(r => (<div key={r.id} className="bg-white border rounded-2xl p-4 shadow-sm"><p className="font-bold text-sm">{r.name} <span className="font-normal text-stone-400 text-xs">• {r.date}</span></p><p className="text-sm">{'⭐'.repeat(r.stars)}</p><p className="text-sm text-stone-600 mt-1">{r.text}</p></div>))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [themeId, setThemeId] = useState('purple');
  const [lang, setLang] = useState('en');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [kitchenRecipe, setKitchenRecipe] = useState(null);

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
      if (data.quests) { const filtered = data.quests.filter(q => q.id !== "zero-waste-3" && q.id !== "zero_waste" && q.id !== "zero_waste_hero" && !String(q.id).toLowerCase().includes("zero")); localStorage.setItem(`didi_quests_${clean}`, JSON.stringify(filtered)); }
      if (data.kcal) for (const [day, items] of Object.entries(data.kcal)) localStorage.setItem(`didi_kcal_${clean}_${day}`, JSON.stringify(items));
      if (data.water) for (const [day, n] of Object.entries(data.water)) localStorage.setItem(`didi_water_${clean}_${day}`, JSON.stringify(n));
      return true;
    } catch { return false; }
  };

  const doMigrate = async () => {
    try {
      const s = getSession(); if (!s?.email) return; if (localStorage.getItem("didi-migrated")) return;
      const email = s.email.toLowerCase().trim();
      const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
      const found = users.find((u) => u.email === email);
      await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ users: [{ email, name: s.name || found?.name || "", password: found?.password || "", createdAt: new Date().toISOString(), migrated: true }] }) });
      localStorage.setItem("didi-migrated", "1");
    } catch {}
  };

  useEffect(() => {
    const s = getSession();
    if (s) { setUser(s); restoreFromCloud(s.email).then(() => { const p = getPrefs(s.email); setThemeId(p.theme || 'purple'); setLang(p.lang || 'en'); window.dispatchEvent(new Event("didi-data-restored")); }); }
    else { try { const g = JSON.parse(localStorage.getItem("didi_prefs_guest") || "{}"); if (g.theme) setThemeId(g.theme); if (g.lang) setLang(g.lang); } catch {} }
  }, []);
  useEffect(() => { doMigrate(); }, []);
  useEffect(() => {
    if (typeof window !== 'undefined' && ['#my-number', '#advertise', '#testing'].includes(window.location.hash)) return;
    const last = Number(sessionStorage.getItem('didi-counted-at') || 0); const now = Date.now();
    if (now - last < 30 * 60 * 1000) return; sessionStorage.setItem('didi-counted-at', String(now));
    fetch('/api/track', { credentials: 'same-origin', keepalive: true }).catch(() => {});
  }, []);
  useEffect(() => { if (user?.email) savePrefs(user.email, { theme: themeId, lang }); else localStorage.setItem("didi_prefs_guest", JSON.stringify({ theme: themeId, lang })); }, [themeId, lang, user?.email]);

  const handleAuth = async (u) => {
    const session = { email: u.email, name: u.name }; setUser(session); setShowAuth(false);
    localStorage.removeItem("didi_guest_count"); localStorage.setItem("didi_lastActive", Date.now().toString());
    await restoreFromCloud(u.email); const p = getPrefs(u.email); if (p.theme) setThemeId(p.theme); if (p.lang) setLang(p.lang);
    window.dispatchEvent(new Event("didi-data-restored"));
  };

  const handleLogout = useCallback(() => {
    const currentTheme = themeId; const currentLang = lang;
    logoutUser(); setUser(null); setThemeId(currentTheme); setLang(currentLang);
    localStorage.setItem("didi_prefs_guest", JSON.stringify({ theme: currentTheme, lang: currentLang }));
    localStorage.removeItem("didi_lastActive");
  }, [themeId, lang]);

  const timerRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    const resetTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); localStorage.setItem("didi_lastActive", Date.now().toString()); timerRef.current = setTimeout(() => { handleLogout(); }, IDLE_TIMEOUT); };
    const last = Number(localStorage.getItem("didi_lastActive") || 0);
    if (last && Date.now() - last > IDLE_TIMEOUT) { handleLogout(); return; }
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    const onVisible = () => { if (!document.hidden) { const lastActive = Number(localStorage.getItem("didi_lastActive") || 0); if (Date.now() - lastActive > IDLE_TIMEOUT) handleLogout(); else resetTimer(); } };
    document.addEventListener("visibilitychange", onVisible); resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); events.forEach((e) => window.removeEventListener(e, resetTimer)); document.removeEventListener("visibilitychange", onVisible); };
  }, [user, handleLogout]);

  const prefs = user?.email ? getPrefs(user.email) : null;
  if (typeof window !== 'undefined' && window.location.hash === '#advertise') return <Advertise />;
  if (typeof window !== 'undefined' && window.location.hash === '#my-number') return <AdminDashboard />;
  if (typeof window !== 'undefined' && window.location.hash === '#testing') return <Testing />;

  const TABS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cook', label: 'Cook', icon: CookingPot },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'kitchen', label: 'Kitchen', icon: KitchenIcon },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const pickFromKitchen = (r) => { setKitchenRecipe(r); setActiveTab('cook'); };

  return (
    <div className="min-h-screen bg-white w-[100vw] py-8 pb-24 relative">
      <div className={`absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b ${theme.softBg} to-white pointer-events-none`} />
      <button onClick={() => setShowSidebar(true)} className={`fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white border ${theme.softBorder} shadow-md flex items-center justify-center ${theme.accent} hover:scale-105 active:scale-95 transition`}><Menu size={20} /></button>
      <Sidebar theme={theme} open={showSidebar} onClose={() => setShowSidebar(false)} user={user} onLogin={() => { setShowSidebar(false); setShowAuth(true); }} />
      <div className="relative text-center mb-6 px-4">
        <div className={`w-11 h-11 mx-auto mb-3 rounded-xl bg-white border ${theme.softBorder} ${theme.accent} flex items-center justify-center shadow-sm`}><ChefHat size={20} /></div>
        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1A1A2E]">Chef <span className={`italic font-light ${theme.accent}`}>Didi</span></h1>
        <p className={`inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] ${theme.accent} uppercase bg-white border ${theme.softBorder} rounded-full px-4 py-1.5 mt-3 shadow-sm`}>✦ No waste • Use what you have</p>
        <p className="text-stone-500 text-[15px] mt-3 font-light">What do you want to do today?</p>
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          {user ? (<><span className={`text-[12px] font-bold ${theme.softBg} ${theme.accent} px-4 py-2 rounded-full`}>👋 {t(lang, 'welcome')}, {user.name} • {prefs?.goal === 'weightloss' ? '⬇ Weight Loss' : prefs?.goal === 'weightgain' ? '⬆ Weight Gain' : prefs?.goal === 'fit' ? '🏋️ Fit' : '🍲 Normal'}</span><button onClick={handleLogout} className={`text-[12px] font-bold bg-white border ${theme.softBorder} px-4 py-2 rounded-full ${theme.hover} hover:text-white transition`}>{t(lang, 'logout')}</button></>) : (<button onClick={() => setShowAuth(true)} className={`text-[12px] font-bold bg-gradient-to-r ${theme.btn} text-white px-5 py-2.5 rounded-full shadow-md hover:opacity-90 active:scale-95 transition`}>{t(lang, 'login')} / Register →</button>)}
        </div>
      </div>

      {activeTab === 'home' && (
        <div className="px-4 max-w-[600px] mx-auto space-y-3">
          <button onClick={() => setActiveTab('cook')} className="w-full text-left bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition"><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">🍲</div><div className="flex-1"><p className="font-bold text-[16px]">Cook With What I Have</p><p className="text-stone-500 text-[13px]">Enter ingredients → Get recipe</p></div><span>→</span></button>
          <button onClick={() => setActiveTab('calculator')} className="w-full text-left bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition"><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">🔥</div><div className="flex-1"><p className="font-bold text-[16px]">Calorie Calculator</p><p className="text-stone-500 text-[13px]">Calories + weight chart</p></div><span>→</span></button>
          <button onClick={() => setActiveTab('kitchen')} className="w-full text-left bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">🍳</div><div className="flex-1"><p className="font-bold text-[16px]">My Kitchen</p><p className="text-stone-500 text-[13px]">Leftovers, pantry, meal plan, reviews</p></div><span>→</span></button>
          <div className="pt-2"><p className="text-[11px] text-stone-400 text-center">Popular today • Jollof • Egusi • Fried Rice</p></div>
          <AdSlot slot="1111111111" />
        </div>
      )}

      {activeTab === 'cook' && (
        <div>
          <button onClick={() => setActiveTab('home')} className="mx-4 mb-3 text-[13px] font-bold text-stone-500">← Back to Home</button>
          <IngredientPicker user={user} themeId={themeId} setThemeId={handleThemeChange} lang={lang} setLang={handleLangChange} onRequireAuth={() => setShowAuth(true)} initialRecipe={kitchenRecipe} onClearInitial={() => setKitchenRecipe(null)} />
        </div>
      )}
      {activeTab === 'calculator' && <CalculatorTab user={user} themeId={themeId} lang={lang} onRequireAuth={() => setShowAuth(true)} />}
      {activeTab === 'kitchen' && <KitchenTab user={user} themeId={themeId} lang={lang} onRequireAuth={() => setShowAuth(true)} onPickRecipe={pickFromKitchen} />}
      {activeTab === 'more' && (
        <div className="px-4 max-w-[600px] mx-auto space-y-3">
          <h2 className="font-bold text-lg">More</h2>
          <p className="text-stone-500 text-sm">We’ll decide what lives here later — for now it’s just a placeholder.</p>
          <button onClick={() => setActiveTab('cook')} className="w-full text-left bg-white border rounded-2xl p-4">🍲 Cook <span className="text-stone-400 text-xs">— main aim</span></button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40">
        <div className="max-w-[600px] mx-auto flex justify-around py-2 px-2">
          {TABS.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[60px] ${isActive ? `${theme.accent} bg-purple-50` : 'text-stone-400'}`}><Icon size={20} /><span className="text-[11px] font-bold">{tab.label}</span></button>); })}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
      <p className="relative text-center text-[11px] text-stone-300 mt-10 pb-2">Made with 💜• © 2026 Didi • Cook what you have</p>
    </div>
  );
}

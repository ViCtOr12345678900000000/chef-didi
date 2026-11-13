import { useState, useEffect, useRef, useCallback } from 'react';
import { ChefHat, Menu, Home, CookingPot, Calculator, ChefHat as KitchenIcon, MoreHorizontal, Check, ArrowRight, Flame, UtensilsCrossed } from 'lucide-react';
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
import SettingsBar from './components/SettingsBar';
import { THEMES, getSession, logoutUser, getPrefs, savePrefs, t, getFavourites, getHistory, getShopping, toggleShopping, clearShopping, getPantry, savePantry } from './lib/didi';

const IDLE_TIMEOUT = 5 * 60 * 1000;

// ---------- Shared high-end styles ----------
const PAGE = "px-4 max-w-[640px] mx-auto";
const CARD = "bg-white border border-stone-100 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
const SECTION_TITLE = "font-display text-[26px] leading-tight font-medium tracking-tight text-[#1A1A2E]";
const SECTION_SUB = "text-[13px] text-stone-500 font-light leading-relaxed";
const INPUT = "w-full h-12 px-4 bg-[#FAF9F6] border border-stone-200/80 rounded-2xl text-[14px] outline-none focus:border-[#1A1A2E] focus:bg-white transition placeholder:text-stone-400";
const BTN_DARK = "bg-[#1A1A2E] hover:bg-black text-white font-semibold rounded-full transition active:scale-[0.98]";
const BTN_GOLD = "bg-[#C9A86A] hover:bg-[#B89455] text-white font-semibold rounded-full transition active:scale-[0.98]";

// --- CALCULATOR ---
function CalculatorTab({ user, themeId, lang, onRequireAuth, goal }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener("didi-kcal-updated", bump);
    window.addEventListener("didi-data-restored", bump);
    return () => { window.removeEventListener("didi-kcal-updated", bump); window.removeEventListener("didi-data-restored", bump); };
  }, []);
  return (
    <div className={`${PAGE} space-y-5`}>
      <div>
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#C9A86A]">Wellness</p>
        <h2 className={SECTION_TITLE}>Calorie Calculator</h2>
        <p className={SECTION_SUB}>Track what you eat. Watch calories meet weight, gently.</p>
      </div>
      <div className="[&>div]:!rounded-[28px] [&>div]:!border-stone-100 [&>div]:!shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <CalorieCalculator key={version} user={user} goal={goal} themeId={themeId} lang={lang} customCalories={null} onRequireAuth={onRequireAuth} />
      </div>
      <div className="[&>div]:!rounded-[28px] [&>div]:!border-stone-100">
        <WeightTrend user={user} themeId={themeId} />
      </div>
    </div>
  );
}

// --- KITCHEN ---
function KitchenTab({ user, themeId, lang, onRequireAuth, onPickRecipe, goal, sittings, cuisine, location }) {
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

  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleReview = async () => {
    const finalName = (name || user?.name || "").trim();
    if (!finalName || !comment.trim()) { setMsg("Please add your name + comment"); return; }
    setSending(true); setMsg("");
    try {
      const res = await fetch("/api/my-number", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: finalName, email: user?.email || "guest", rating, comment: comment.trim() }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsg("Thank you — your review was sent to Didi.");
      setComment(""); setRating(5);
    } catch (e) { setMsg(e.message); } finally { setSending(false); }
  };

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

  return (
    <div className={`${PAGE} space-y-5`}>
      <div>
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#C9A86A]">My Kitchen</p>
        <h2 className={SECTION_TITLE}>Everything in its place.</h2>
        <p className={SECTION_SUB}>Leftovers, pantry, meal plan, favourites & reviews — calm, organized.</p>
      </div>

      {/* Leftover */}
      <div className={CARD}>
        <div className="flex items-start justify-between">
          <div><p className="text-[22px]">♻️</p><h3 className="font-display text-[19px] font-medium mt-1">Leftover Rescue</h3><p className="text-[13px] text-stone-500 font-light">Got leftover jollof? Don’t throw it. Didi remixes it.</p></div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-[#FAF9F6] border border-stone-200 px-2.5 py-1 rounded-full text-stone-500">No Waste</span>
        </div>
        <div className="flex gap-2 mt-4">
          <input value={leftoverInput} onChange={e => setLeftoverInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLeftover()} placeholder="e.g. leftover jollof, 2 eggs" className={INPUT} />
          <button onClick={handleLeftover} disabled={isLoading || !leftoverInput.trim()} className={`shrink-0 h-12 px-5 text-[13px] ${BTN_DARK} disabled:opacity-40`}>{isLoading ? "Rescuing…" : "Rescue"}</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">{['leftover jollof, 2 eggs','leftover rice, chicken','leftover beans, plantain'].map(s => (<button key={s} onClick={() => setLeftoverInput(s)} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-stone-200 text-stone-600 hover:border-[#1A1A2E] transition">{s}</button>))}</div>
        {leftoverRecipe && <button onClick={() => onPickRecipe(leftoverRecipe)} className="w-full mt-4 text-left border border-stone-100 rounded-2xl p-4 bg-[#FAF9F6] hover:bg-white transition flex justify-between items-center"><span><span className="block font-display font-medium">{leftoverRecipe.title}</span><span className="text-xs text-stone-400">{leftoverRecipe.time} • Open in Cook</span></span><ArrowRight size={16} className="text-stone-400" /></button>}
      </div>

      {/* Pantry */}
      <div className={CARD}>
        <p className="text-[22px]">🥫</p>
        <h3 className="font-display text-[19px] font-medium mt-1">My Pantry</h3>
        <p className="text-[13px] text-stone-500 font-light">Always at home — ready for your next recipe.</p>
        <div className="flex flex-wrap gap-1.5 mt-4">{pantry.length === 0 ? <p className="text-[13px] text-stone-400 font-light italic">Your pantry is empty for now.</p> : pantry.map(p => (<span key={p} className="text-[12px] font-medium bg-[#F5F0E8] text-[#6B5A3E] border border-[#E8DCC8] px-3 py-1.5 rounded-full">{p}</span>))}</div>
        <div className="flex gap-2 mt-3"><input value={pantryInput} onChange={e => setPantryInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPantryItem()} placeholder={isGuest ? "Login to add to pantry" : "Add e.g. Maggi, Groundnut Oil"} className={INPUT} /><button onClick={addPantryItem} className={`shrink-0 h-12 px-5 text-[13px] ${BTN_GOLD}`}>Add</button></div>
      </div>

      {/* Weekly Plan - wrapped in classy card */}
      <div className="[&>div]:!rounded-[28px] [&>div]:!border-stone-100 [&>div]:!shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <WeeklyPlan user={user} goal={goal} sittings={sittings} customCalories={null} cuisine={cuisine} location={location} lang={lang} themeId={themeId} onPickRecipe={(r) => onPickRecipe(r)} />
      </div>

      {/* Favs / History / Shopping */}
      <div className={CARD}>
        <h3 className="font-display text-[19px] font-medium">Your Collection</h3>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowFav(!showFav); setShowHist(false); setShowShop(false); }} className={`h-11 px-4 rounded-full text-[13px] font-medium border transition ${showFav ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white border-stone-200 text-stone-700'}`}>Favourites {isGuest ? "🔒" : `(${favList.length})`}</button>
          <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowHist(!showHist); setShowFav(false); setShowShop(false); }} className={`h-11 px-4 rounded-full text-[13px] font-medium border transition ${showHist ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white border-stone-200 text-stone-700'}`}>History {isGuest ? "🔒" : `(${histList.length})`}</button>
          <button onClick={() => { if (isGuest) return onRequireAuth?.(); setShowShop(!showShop); setShowFav(false); setShowHist(false); }} className={`h-11 px-4 rounded-full text-[13px] font-medium border transition ${showShop ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white border-stone-200 text-stone-700'}`}>Shopping {isGuest ? "🔒" : `(${shopList.filter(i => !i.done).length} left)`}</button>
        </div>
        {(showFav || showHist) && !isGuest && (
          <div className="mt-4 space-y-2">
            {(showFav ? favList : histList).length === 0 ? <p className="text-[13px] text-stone-400 font-light italic text-center py-4">Nothing here yet.</p> : (showFav ? favList : histList).map(r => (<button key={r.title + (r.savedAt || r.viewedAt || "")} onClick={() => onPickRecipe(r)} className="w-full text-left border border-stone-100 rounded-2xl p-4 bg-[#FAF9F6] hover:bg-white transition flex justify-between items-center"><span><span className="block font-medium text-[14px]">{r.title}</span><span className="text-xs text-stone-400">{r.time} • {r.caloriesPerSitting || r.calories}</span></span><ArrowRight size={16} className="text-stone-300" /></button>))}
          </div>
        )}
        {showShop && !isGuest && (
          <div className="mt-4">
            {shopList.length === 0 ? <p className="text-[13px] text-stone-400 font-light italic text-center">Shopping list empty.</p> : shopList.map(i => (<button key={i.id} onClick={() => setShopList(toggleShopping(user, i.id))} className="w-full flex items-center gap-3 py-3 border-b border-stone-50 last:border-0 text-left"><span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${i.done ? "bg-[#1A1A2E] text-white border-[#1A1A2E]" : "border-stone-300"}`}>{i.done && <Check size={12} />}</span><span className={`text-[14px] ${i.done ? "line-through text-stone-400" : "font-medium"}`}>{i.name}</span></button>))}
            {shopList.length > 0 && <button onClick={() => setShopList(clearShopping(user, true))} className="mt-3 text-[12px] font-medium text-red-500">Clear ticked</button>}
          </div>
        )}
      </div>

      {/* Review */}
      <div className={`${CARD} !bg-[#1A1A2E] !border-[#1A1A2E] text-white`}>
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#C9A86A]">Feedback</p>
        <h3 className="font-display text-[20px] font-medium mt-1">Love Chef Didi?</h3>
        <p className="text-[13px] text-white/60 font-light mt-1">Your comment goes straight to Didi’s dashboard.</p>
        <div className="flex gap-1 mt-4">
          {[1,2,3,4,5].map(n => (<button key={n} type="button" onClick={() => setRating(n)} className="text-[28px] leading-none transition hover:scale-110">{n <= rating ? "⭐" : <span className="opacity-30">☆</span>}</button>))}
          <span className="text-[12px] font-medium text-white/60 self-center ml-2">{rating} / 5</span>
        </div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="off" maxLength={50} className="w-full h-12 px-4 bg-white/10 border border-white/15 rounded-2xl text-[14px] outline-none mt-4 placeholder:text-white/40 text-white focus:border-[#C9A86A] transition" />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a review or a feature you'd like to see in later versions…" rows={3} maxLength={500} className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-2xl text-[14px] outline-none mt-2 resize-none placeholder:text-white/40 text-white focus:border-[#C9A86A] transition" />
        <button type="button" onClick={handleReview} disabled={sending} className="w-full h-12 mt-4 rounded-full text-[13px] font-semibold bg-[#C9A86A] hover:bg-[#B89455] text-white disabled:opacity-50 transition">{sending ? "Sending…" : "Send Review →"}</button>
        {msg && <p className="text-[12px] font-medium mt-3 text-white/80">{msg}</p>}
      </div>
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
  const [goal, setGoal] = useState('normal');
  const [sittings, setSittings] = useState(3);
  const [customCalories, setCustomCalories] = useState(null);
  const [cuisine, setCuisine] = useState('auto');
  const [location, setLocation] = useState('nigeria');

  const theme = THEMES[themeId] || THEMES.purple;
  const handleThemeChange = (newTheme) => setThemeId(newTheme);
  const handleLangChange = (newLang) => setLang(newLang);
  const handleCustomCalories = (val) => { if (!user?.email) { setShowAuth(true); return; } setCustomCalories(val); };

  const restoreFromCloud = async (email) => {
    try {
      const clean = email.toLowerCase().trim();
      const res = await fetch(`/api/profile?email=${encodeURIComponent(clean)}`);
      const { data } = await res.json();
      if (!data) return false;
      if (data.prefs) { savePrefs(clean, data.prefs); if (data.prefs.goal) setGoal(data.prefs.goal); if (data.prefs.sittings) setSittings(data.prefs.sittings); if (data.prefs.customCalories !== undefined) setCustomCalories(data.prefs.customCalories); if (data.prefs.cuisine) setCuisine(data.prefs.cuisine); if (data.prefs.location) setLocation(data.prefs.location); }
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
    try { const s = getSession(); if (!s?.email) return; if (localStorage.getItem("didi-migrated")) return; const email = s.email.toLowerCase().trim(); const users = JSON.parse(localStorage.getItem("didi_users") || "[]"); const found = users.find((u) => u.email === email); await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ users: [{ email, name: s.name || found?.name || "", password: found?.password || "", createdAt: new Date().toISOString(), migrated: true }] }) }); localStorage.setItem("didi-migrated", "1"); } catch {}
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
  useEffect(() => { if (user?.email) savePrefs(user.email, { goal, theme: themeId, lang, sittings, customCalories, cuisine, location }); else localStorage.setItem("didi_prefs_guest", JSON.stringify({ theme: themeId, lang })); }, [goal, themeId, lang, sittings, customCalories, cuisine, location, user?.email]);

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
    <div className="min-h-screen bg-[#FAF9F6] w-[100vw] py-8 pb-32 relative font-sans antialiased text-[#1A1A2E]">
      {/* soft top glow */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-[#F5F0E8] via-[#FAF9F6] to-transparent pointer-events-none" />

      <button onClick={() => setShowSidebar(true)} className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur border border-stone-200 shadow-sm flex items-center justify-center text-[#1A1A2E] hover:scale-105 active:scale-95 transition">
        <Menu size={19} />
      </button>
      <Sidebar theme={theme} open={showSidebar} onClose={() => setShowSidebar(false)} user={user} onLogin={() => { setShowSidebar(false); setShowAuth(true); }} />

      {/* Header — editorial, not loud */}
      <div className="relative text-center mb-8 px-4">
        <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-[#C9A86A]">Chef Didi • Lagos</p>
        <h1 className="font-display text-[44px] leading-[1.02] font-medium tracking-tight mt-3">Cook what <span className="italic font-light text-[#8A7A5A]">you have.</span></h1>
        <p className="text-stone-500 text-[14px] mt-3 font-light max-w-[360px] mx-auto leading-relaxed">No waste. No stress. Tell Didi what’s in your kitchen — she’ll make it beautiful.</p>
        <div className="flex justify-center items-center gap-2 mt-5 flex-wrap">
          {user ? (<><span className="text-[12px] font-medium bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm">👋 {t(lang, 'welcome')}, {user.name} • {prefs?.goal === 'weightloss' ? 'Weight Loss' : prefs?.goal === 'weightgain' ? 'Weight Gain' : prefs?.goal === 'fit' ? 'Fit' : 'Normal'}</span><button onClick={handleLogout} className="text-[12px] font-medium bg-white border border-stone-200 px-4 py-2 rounded-full hover:border-[#1A1A2E] transition">{t(lang, 'logout')}</button></>) : (<button onClick={() => setShowAuth(true)} className="text-[12px] font-semibold bg-[#1A1A2E] text-white px-6 py-3 rounded-full shadow-md hover:bg-black transition">{t(lang, 'login')} / Register →</button>)}
        </div>
      </div>

      {activeTab === 'home' && (
        <div className={`${PAGE} space-y-3`}>
          {/* Hero card */}
          <button onClick={() => setActiveTab('cook')} className="w-full text-left bg-[#1A1A2E] text-white rounded-[28px] p-6 shadow-[0_16px_40px_rgba(26,26,46,0.18)] flex items-center gap-4 active:scale-[0.99] transition group overflow-hidden relative">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#C9A86A]/20 rounded-full blur-2xl" />
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[26px] shrink-0">🍲</div>
            <div className="flex-1 relative"><p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C9A86A]">Main Course</p><p className="font-display text-[21px] font-medium leading-tight mt-1">Cook With What I Have</p><p className="text-white/60 text-[13px] font-light mt-1">Enter ingredients → Get a recipe in seconds</p></div>
            <span className="w-10 h-10 rounded-full bg-white text-[#1A1A2E] flex items-center justify-center shrink-0 group-hover:translate-x-1 transition"><ArrowRight size={18} /></span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveTab('calculator')} className="text-left bg-white border border-stone-100 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] flex items-center justify-center text-[20px]">🔥</div>
              <p className="font-display text-[17px] font-medium mt-3 leading-tight">Calorie Calculator</p>
              <p className="text-stone-500 text-[12px] font-light mt-1 leading-relaxed">Calories + weight, in one calm view</p>
              <p className="text-[12px] font-semibold mt-3 flex items-center gap-1">Open <ArrowRight size={13} /></p>
            </button>
            <button onClick={() => setActiveTab('kitchen')} className="text-left bg-white border border-stone-100 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[20px]">🍳</div>
              <p className="font-display text-[17px] font-medium mt-3 leading-tight">My Kitchen</p>
              <p className="text-stone-500 text-[12px] font-light mt-1 leading-relaxed">Leftovers, pantry, meal plan</p>
              <p className="text-[12px] font-semibold mt-3 flex items-center gap-1">Open <ArrowRight size={13} /></p>
            </button>
          </div>

          <div className="bg-white border border-stone-100 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-stone-100 flex items-center justify-center"><UtensilsCrossed size={16} /></span>
            <div><p className="text-[13px] font-medium">Popular today</p><p className="text-[12px] text-stone-500 font-light">Jollof • Egusi • Fried Rice</p></div>
            <span className="ml-auto flex items-center gap-1 text-[12px] font-medium text-[#C9A86A]"><Flame size={13} /> Trending</span>
          </div>
          <AdSlot slot="1111111111" />
        </div>
      )}

      {activeTab === 'cook' && (
        <div>
          <button onClick={() => setActiveTab('home')} className="mx-4 mb-4 text-[13px] font-medium text-stone-500 hover:text-[#1A1A2E] transition">← Back to Home</button>
          <div className="px-4 md:px-6 max-w-[1400px] mx-auto mb-5 [&>div]:!rounded-[24px] [&>div]:!shadow-[0_8px_30px_rgba(0,0,0,0.04)] [&>div]:!border-stone-100">
            <SettingsBar goal={goal} setGoal={setGoal} sittings={sittings} setSittings={setSittings} themeId={themeId} setThemeId={handleThemeChange} lang={lang} setLang={handleLangChange} user={user} customCalories={customCalories} setCustomCalories={handleCustomCalories} />
          </div>
          <IngredientPicker user={user} themeId={themeId} lang={lang} goal={goal} setGoal={setGoal} sittings={sittings} customCalories={customCalories} cuisine={cuisine} setCuisine={setCuisine} location={location} setLocation={setLocation} onRequireAuth={() => setShowAuth(true)} initialRecipe={kitchenRecipe} onClearInitial={() => setKitchenRecipe(null)} />
        </div>
      )}
      {activeTab === 'calculator' && <CalculatorTab user={user} themeId={themeId} lang={lang} goal={goal} onRequireAuth={() => setShowAuth(true)} />}
      {activeTab === 'kitchen' && <KitchenTab user={user} themeId={themeId} lang={lang} goal={goal} sittings={sittings} cuisine={cuisine} location={location} onRequireAuth={() => setShowAuth(true)} onPickRecipe={pickFromKitchen} />}
      {activeTab === 'more' && (
        <div className={`${PAGE} space-y-3`}>
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#C9A86A]">More</p>
          <h2 className={SECTION_TITLE}>Coming soon.</h2>
          <p className={SECTION_SUB}>We’re keeping this space clean for now. New tools will live here when they’re ready.</p>
          <button onClick={() => setActiveTab('cook')} className="w-full text-left bg-white border border-stone-100 rounded-[28px] p-5 shadow-sm flex items-center gap-4"><span className="text-[22px]">🍲</span><span className="flex-1"><span className="block font-medium">Cook</span><span className="block text-[12px] text-stone-500 font-light">The main aim</span></span><ArrowRight size={16} className="text-stone-300" /></button>
        </div>
      )}

      {/* Floating glass footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[520px]">
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/70 shadow-[0_16px_40px_rgba(0,0,0,0.10)] rounded-full px-2 py-2 flex justify-between">
          {TABS.map(tab => {
            const Icon = tab.icon; const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-full min-w-[62px] transition ${isActive ? 'bg-[#1A1A2E] text-white shadow-md' : 'text-stone-500 hover:text-[#1A1A2E] hover:bg-stone-100'}`}>
                <Icon size={19} />
                <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
      <p className="relative text-center text-[11px] text-stone-400 mt-10 pb-2 tracking-wide">Made with care • © 2026 Didi • Cook what you have</p>
    </div>
  );
}

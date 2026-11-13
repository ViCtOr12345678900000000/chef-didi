import { useState, useEffect, useRef } from "react";
import { Flame, Droplets, Scale, Camera, ImagePlus, Trash2, Sparkles, Eye, Plus, X, Calculator, Lock } from "lucide-react";
import { GOALS, THEMES, caloriesFor, getStreak, getWeeklyKcal, getWater, setWater, getWeights, addWeight, dateStr, getPrefs } from "../lib/didi";

const FREE_LIMIT = 3;
const GUEST_KEY = "didi_guest_kcal_count"; 

function getGuestCount() {
  try { return parseInt(localStorage.getItem(GUEST_KEY) || "0", 10) || 0; } catch { return 0; }
}

export default function CalorieCalculator({ user, goal, themeId, lang, customCalories, onRequireAuth }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const today = new Date().toISOString().slice(0, 10);
  const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`;
  const [eaten, setEaten] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } });
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  const [isCalc, setIsCalc] = useState(false);
  const [err, setErr] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiSee, setAiSee] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [water, setWaterState] = useState(() => getWater(user));
  const [weights, setWeights] = useState(() => getWeights(user));
  const [weightInput, setWeightInput] = useState("");
  const [showWeek, setShowWeek] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const videoRef = useRef(null); const canvasRef = useRef(null); const streamRef = useRef(null); const fileRef = useRef(null);
  const syncTimer = useRef(null);
  const isFirstEatenSave = useRef(true);
  const cal = caloriesFor(goal, 3, customCalories);
  const target = cal.total;
  const totalEaten = eaten.reduce((s, x) => s + (x.totalKcal || 0), 0);
  const left = target - totalEaten;
  const pct = Math.min(100, Math.round((totalEaten / target) * 100));
  const over = totalEaten > target;
  const streak = getStreak(user);
  const weekly = getWeeklyKcal(user);
  const maxWeek = Math.max(...weekly.map(w => w.total), target);

  const [guestCount, setGuestCount] = useState(() => getGuestCount());
  const isGuest = !user?.email;
  const limitReached = isGuest && guestCount >= FREE_LIMIT;
  const triesLeft = isGuest ? Math.max(0, FREE_LIMIT - guestCount) : null;

  const useOneTry = () => {
    if (!isGuest) return true;
    const current = getGuestCount();
    if (current >= FREE_LIMIT) {
      setGuestCount(current);
      return false;
    }
    const next = current + 1;
    localStorage.setItem(GUEST_KEY, String(next));
    setGuestCount(next);
    return true;
  };

  const handleRequireAuth = () => {
    if (onRequireAuth) onRequireAuth();
    else setErr("You've used your 3 free tries — Login to continue unlimited.");
  };

  const syncCloud = () => {
    if (!user?.email) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const email = user.email.toLowerCase().trim();
        const users = JSON.parse(localStorage.getItem("didi_users") || "[]");
        const found = users.find((u) => u.email === email);
        const kcal = {};
        const waterMap = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const day = d.toISOString().slice(0, 10);
          const v = localStorage.getItem(`didi_kcal_${email}_${day}`);
          if (v) kcal[day] = JSON.parse(v);
          const w = localStorage.getItem(`didi_water_${email}_${day}`);
          if (w) waterMap[day] = JSON.parse(w);
        }
        const bundle = {
          email, name: user.name || found?.name || "", password: found?.password || "",
          prefs: getPrefs(email),
          fav: JSON.parse(localStorage.getItem(`didi_fav_${email}`) || "[]"),
          history: JSON.parse(localStorage.getItem(`didi_history_${email}`) || "[]"),
          shopping: JSON.parse(localStorage.getItem(`didi_shopping_${email}`) || "[]"),
          pantry: JSON.parse(localStorage.getItem(`didi_pantry_${email}`) || "[]"),
          weights: JSON.parse(localStorage.getItem(`didi_weights_${email}`) || "[]"),
          kcal, water: waterMap, createdAt: new Date().toISOString(), migrated: true,
        };
        await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, data: bundle }) });
      } catch {}
    }, 800);
  };

  useEffect(() => {
    try { setEaten(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setEaten([]); }
    setWaterState(getWater(user));
    setWeights(getWeights(user));
    isFirstEatenSave.current = true;
    if (!user?.email) setGuestCount(getGuestCount());
  }, [user?.email, key]);

  useEffect(() => {
    if (isFirstEatenSave.current) { isFirstEatenSave.current = false; return; }
    localStorage.setItem(key, JSON.stringify(eaten));
    syncCloud();
  }, [eaten, key]);

  useEffect(() => {
    const reload = () => {
      try { setEaten(JSON.parse(localStorage.getItem(key) || "[]")); } catch {}
      setWaterState(getWater(user));
      setWeights(getWeights(user));
      isFirstEatenSave.current = true;
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener("didi-kcal-updated", reload);
    window.addEventListener("didi-data-restored", reload);
    return () => {
      window.removeEventListener("didi-kcal-updated", reload);
      window.removeEventListener("didi-data-restored", reload);
    };
  }, [key, user?.email]);

  const handleWaterAdd = () => {
    const n = Math.min(12, water + 1);
    setWaterState(n);
    setWater(user, n);
    syncCloud();
  };

  const handleLogWeight = () => {
    if (!weightInput) return;
    const next = addWeight(user, weightInput);
    setWeights(next);
    setWeightInput("");
    syncCloud();
  };

  const handleClearToday = () => {
    setEaten([]);
    syncCloud();
  };

  const handleCalc = async () => {
    if (!text.trim()) return;
    if (limitReached) { handleRequireAuth(); return; }
    setErr(""); setIsCalc(true); setAiNote(""); setAiSee("");
    try {
      const res = await fetch("/api/calc-calories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, goal, customCalories: target }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Didi failed");
      const newItems = (data.items || []).map((it, i) => ({ id: Date.now() + i, name: it.name, qty: it.qty, unit: it.unit, kcal: it.kcalPerOne, totalKcal: it.totalKcal }));
      setEaten(prev => [...prev, ...newItems]); setAiNote(data.note || ""); setText("");
      useOneTry();
    } catch (e) { setErr(e.message); } finally { setIsCalc(false); }
  };
  const startCamera = async () => {
    if (limitReached) { handleRequireAuth(); return; }
    setShowCamera(true); setPhoto(null); setErr("");
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); streamRef.current = stream; setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100); }
    catch { setErr("Camera blocked. Use Upload Photo instead."); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); };
  const snapPhoto = () => { const video = videoRef.current; const canvas = canvasRef.current; if (!video || !canvas) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d").drawImage(video, 0, 0); setPhoto(canvas.toDataURL("image/jpeg", 0.85)); };
  const analyzePhoto = async () => {
    if (!photo) return;
    if (limitReached) { handleRequireAuth(); return; }
    setIsAnalyzing(true); setErr(""); setAiNote(""); setAiSee("");
    try {
      const res = await fetch("/api/calc-calories-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: photo, goal, customCalories: target }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Didi vision failed");
      const newItems = (data.items || []).map((it, i) => ({ id: Date.now() + i, name: it.name, qty: it.qty, unit: it.unit, kcal: it.kcalPerOne, totalKcal: it.totalKcal }));
      setEaten(prev => [...prev, ...newItems]); setAiNote(data.note || ""); setAiSee(data.whatYouSee || ""); stopCamera(); setPhoto(null);
      useOneTry();
    } catch (e) { setErr(e.message); } finally { setIsAnalyzing(false); }
  };
  const handleFile = (e) => {
    if (limitReached) { handleRequireAuth(); return; }
    const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f);
  };
  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100">
      <button onClick={() => setShow(!show)} className="w-full flex items-center justify-between text-left">
        <div><h2 className="font-display font-medium text-[20px] leading-none flex items-center gap-2"><Calculator size={20} className="text-[#C9A86A]" /> Kcal Calculator — Didi</h2><p className="text-[11px] text-stone-400 mt-1 font-light">Type it OR snap it, Didi calculates • {today} • Target: {target} kcal {customCalories ? '(Custom)' : `(${GOALS[goal]?.label})`}</p></div>
        <span className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-stone-200 flex items-center justify-center text-[18px] shrink-0">{show ? '−' : '+'}</span>
      </button>
      {show && (
        <div className="mt-4">
          {isGuest && !limitReached && (
            <div className="rounded-2xl bg-[#FFFBF0] border border-[#F0E2A8] p-3 mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-amber-800">🎁 {triesLeft} / 3 free tries left — test it out!</p>
              <button onClick={handleRequireAuth} className="text-[11px] font-semibold text-white bg-[#1A1A2E] px-3 py-1.5 rounded-full shrink-0">Login for unlimited</button>
            </div>
          )}
          {isGuest && limitReached && (
            <div className="rounded-2xl bg-[#1A1A2E] p-4 mb-3 text-center">
              <p className="text-[13px] font-semibold text-white flex items-center justify-center gap-1.5"><Lock size={14} /> You've used your 3 free tries</p>
              <p className="text-[11px] text-white/70 mt-1 font-light">Login to keep calculating, save history & track kcal.</p>
              <button onClick={handleRequireAuth} className="mt-3 h-10 px-5 bg-white text-black rounded-full text-[12px] font-semibold">Login / Register →</button>
            </div>
          )}
          <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-4 mb-3">
            <div className="flex justify-between text-[13px] font-semibold"><span className="flex items-center gap-1.5"><Flame size={15} className="text-orange-500" /> Eaten: {totalEaten} kcal</span><span>{over ? `Over by ${Math.abs(left)}` : `${left} left`}</span></div>
            <div className="h-3 bg-white border border-stone-100 rounded-full mt-2 overflow-hidden"><div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : `bg-gradient-to-r ${theme.btn}`}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-[11px] text-stone-500 mt-1.5 font-light">{pct}% of {target} kcal target • {eaten.length} items today</p>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 flex-1 text-center"><Flame size={20} className="mx-auto text-orange-500" /><p className="text-[14px] font-semibold mt-1">{streak} day{streak === 1 ? "" : "s"}</p><p className="text-[10px] text-stone-400">Streak</p></div>
            <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 flex-1 text-center"><Droplets size={20} className="mx-auto text-blue-500" /><p className="text-[14px] font-semibold mt-1">{water} / 8</p><button onClick={handleWaterAdd} className="mt-1 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto"><Plus size={14} /></button></div>
            <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 flex-1 text-center"><Scale size={20} className="mx-auto text-stone-600" /><p className="text-[14px] font-semibold mt-1">{weights[0]?.kg ? `${weights[0].kg} kg` : "—"}</p><p className="text-[10px] text-stone-400">Weight</p></div>
          </div>
          <div className="flex gap-2 mb-3">
            <input value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="Log weight (kg)" type="number" className="flex-1 h-10 px-3 bg-[#FAF9F6] border border-stone-200 rounded-full text-[12px] outline-none focus:border-[#1A1A2E]" />
            <button onClick={handleLogWeight} className="h-10 px-4 bg-white border border-stone-200 rounded-full text-[12px] font-semibold shrink-0">Log Weight</button>
            <button onClick={() => setShowWeek(!showWeek)} className={`h-10 px-4 rounded-full text-[12px] font-semibold shrink-0 ${showWeek ? "bg-[#1A1A2E] text-white" : "bg-white border border-stone-200"}`}>{showWeek ? "Hide Week" : "This Week"}</button>
          </div>
          {showWeek && (
            <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 mb-3">
              <p className="text-[12px] font-semibold mb-2">This week — kcal per day</p>
              <div className="flex items-end gap-2 h-[80px]">
                {weekly.map(w => (<div key={w.date} className="flex-1 flex flex-col items-center gap-1"><span className="text-[9px] font-bold">{w.total > 0 ? w.total : ""}</span><div className={`w-full rounded-t-md ${w.date === dateStr(0) ? `bg-gradient-to-t ${theme.btn}` : "bg-stone-300"}`} style={{ height: `${Math.max(6, (w.total / maxWeek) * 60)}px` }} /><span className="text-[9px] text-stone-400">{w.day}</span></div>))}
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-light">Total this week: {weekly.reduce((s, w) => s + w.total, 0)} kcal • Avg: {Math.round(weekly.reduce((s, w) => s + w.total, 0) / 7)} / day</p>
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCalc()} placeholder={limitReached ? "Login to continue..." : "e.g. 2 plates jollof + 1 grilled chicken + 1 Coke"} disabled={limitReached} className={`flex-1 min-w-0 h-12 px-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl text-[14px] outline-none focus:border-[#1A1A2E] ${limitReached ? 'opacity-50' : ''}`} />
            <button onClick={handleCalc} disabled={isCalc || !text.trim() || limitReached} className={`shrink-0 h-12 px-5 bg-gradient-to-r ${theme.btn} text-white rounded-full text-[13px] font-semibold shadow flex items-center gap-1.5 ${limitReached ? 'opacity-50' : ''}`}><Sparkles size={14} />{isCalc ? 'Didi is thinking...' : limitReached ? 'Locked 🔒' : 'Calculate'}</button>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={startCamera} disabled={limitReached} className={`h-10 px-4 bg-[#1A1A2E] text-white rounded-full text-[12px] font-semibold flex items-center gap-1.5 ${limitReached ? 'opacity-50' : ''}`}><Camera size={14} /> Snap your food</button>
            <button onClick={() => fileRef.current?.click()} disabled={limitReached} className={`h-10 px-4 bg-white border border-stone-200 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ${limitReached ? 'opacity-50' : ''}`}><ImagePlus size={14} /> Upload Photo</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button onClick={handleClearToday} className="h-10 px-4 bg-white border border-red-100 text-red-500 rounded-full text-[12px] font-semibold flex items-center gap-1"><Trash2 size={13} /> Clear today</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['1 plate Jollof + Chicken', 'A full plate of Beans', '2 Boiled Eggs + Bread', '1 bottle Coke'].map(s => (<button key={s} onClick={() => setText(s)} className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-stone-200 bg-[#FAF9F6] text-stone-600 hover:border-[#1A1A2E] transition">{s}</button>))}
          </div>
          {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 rounded-xl p-3 mb-3">{err}</p>}
          {aiSee && <p className="text-[12px] bg-[#FAF9F6] border border-stone-100 rounded-xl p-3 mb-2 flex gap-1.5"><Eye size={14} className="shrink-0 mt-0.5" /><span><b>Didi sees:</b> {aiSee}</span></p>}
          {aiNote && <p className="text-[12px] bg-[#FFFBF0] border border-[#F0E2A8] rounded-xl p-3 mb-3 flex gap-1.5"><Sparkles size={14} className="shrink-0 mt-0.5 text-amber-500" /><span><b>Didi:</b> {aiNote}</span></p>}
          {eaten.length > 0 ? (
            <div className="space-y-2">{eaten.map(it => (<div key={it.id} className="flex items-center justify-between bg-[#FAF9F6] border border-stone-100 rounded-2xl px-3 py-2.5"><div><p className="text-[13px] font-semibold">{it.name}</p><p className="text-[11px] text-stone-400 font-light">{it.qty} {it.unit} × {it.kcal} kcal</p></div><div className="flex items-center gap-2"><span className="text-[13px] font-semibold">{it.totalKcal} kcal</span><button onClick={() => setEaten(prev => prev.filter(x => x.id !== it.id))} className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><X size={11} /></button></div></div>))}</div>
          ) : <p className="text-[12px] text-stone-400 text-center py-3 font-light">Nothing logged yet today. Type or snap your food.</p>}
          {showCamera && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={stopCamera}>
              <div className="bg-white rounded-[24px] p-4 w-full max-w-[480px]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3"><h3 className="font-semibold flex items-center gap-1.5"><Camera size={16} /> Snap your food — Didi will calculate</h3><button onClick={stopCamera} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center"><X size={14} /></button></div>
                {!photo ? (<><video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover rounded-2xl bg-black" /><canvas ref={canvasRef} className="hidden" /><div className="flex gap-2 mt-3"><button onClick={snapPhoto} className="flex-1 h-12 bg-[#1A1A2E] text-white rounded-full font-semibold flex items-center justify-center gap-1.5"><Camera size={15} /> Take Photo</button><button onClick={() => fileRef.current?.click()} className="h-12 px-5 bg-white border border-stone-200 rounded-full font-semibold">Upload</button></div></>) : (<><img src={photo} alt="Your food" className="w-full aspect-[4/3] object-cover rounded-2xl" /><div className="flex gap-2 mt-3"><button onClick={analyzePhoto} disabled={isAnalyzing} className={`flex-1 h-12 bg-gradient-to-r ${theme.btn} text-white rounded-full font-semibold flex items-center justify-center gap-1.5`}><Sparkles size={15} />{isAnalyzing ? 'Didi is looking...' : 'Let Didi Calculate Calories'}</button><button onClick={() => setPhoto(null)} className="h-12 px-5 bg-white border border-stone-200 rounded-full font-semibold">Retake</button></div></>)}
                {err && <p className="text-[12px] text-red-600 mt-2">{err}</p>}
              </div>
            </div>
          )}
          {photo && !showCamera && (
            <div className="mt-3 bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 flex gap-3 items-center"><img src={photo} alt="Uploaded food" className="w-16 h-16 object-cover rounded-xl" /><div className="flex-1"><p className="text-[12px] font-semibold">Photo ready</p><p className="text-[11px] text-stone-400 font-light">Didi will look at this plate</p></div><button onClick={analyzePhoto} disabled={isAnalyzing} className="h-10 px-4 bg-[#1A1A2E] text-white rounded-full text-[12px] font-semibold flex items-center gap-1"><Sparkles size={13} />{isAnalyzing ? 'Looking...' : 'Calculate'}</button><button onClick={() => setPhoto(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-stone-200"><X size={13} /></button></div>
          )}
        </div>
      )}
    </div>
  );
}

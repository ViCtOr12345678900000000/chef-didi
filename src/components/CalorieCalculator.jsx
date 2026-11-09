import { useState, useEffect, useRef } from "react";
import { GOALS, caloriesFor } from "../lib/didi";

export default function CalorieCalculator({ user, goal, themeId, lang, customCalories }) {
  const today = new Date().toISOString().slice(0, 10);
  const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`;
  const [eaten, setEaten] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } });
  const [text, setText] = useState("");
  const [show, setShow] = useState(true);
  const [isCalc, setIsCalc] = useState(false);
  const [err, setErr] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiSee, setAiSee] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const cal = caloriesFor(goal, 3, customCalories);
  const target = cal.total;
  const totalEaten = eaten.reduce((s, x) => s + (x.totalKcal || 0), 0);
  const left = target - totalEaten;
  const pct = Math.min(100, Math.round((totalEaten / target) * 100));
  const over = totalEaten > target;

  useEffect(() => { localStorage.setItem(key, JSON.stringify(eaten)); }, [eaten, key]);
  useEffect(() => {
    const reload = () => { try { setEaten(JSON.parse(localStorage.getItem(key) || "[]")); } catch {} };
    window.addEventListener("didi-kcal-updated", reload);
    return () => window.removeEventListener("didi-kcal-updated", reload);
  }, [key]);

  const handleCalc = async () => {
    if (!text.trim()) return;
    setErr(""); setIsCalc(true); setAiNote(""); setAiSee("");
    try {
      const res = await fetch("/api/calc-calories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, goal, customCalories: target }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Didi failed");
      const newItems = (data.items || []).map((it, i) => ({ id: Date.now() + i, name: it.name, qty: it.qty, unit: it.unit, kcal: it.kcalPerOne, totalKcal: it.totalKcal }));
      setEaten(prev => [...prev, ...newItems]);
      setAiNote(data.note || "");
      setText("");
    } catch (e) { setErr(e.message); } finally { setIsCalc(false); }
  };

  const startCamera = async () => {
    setShowCamera(true); setPhoto(null); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setErr("Camera blocked. Use Upload Photo instead."); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); };
  const snapPhoto = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
  };
  const analyzePhoto = async () => {
    if (!photo) return;
    setIsAnalyzing(true); setErr(""); setAiNote(""); setAiSee("");
    try {
      const res = await fetch("/api/calc-calories-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: photo, goal, customCalories: target }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Didi vision failed");
      const newItems = (data.items || []).map((it, i) => ({ id: Date.now() + i, name: it.name, qty: it.qty, unit: it.unit, kcal: it.kcalPerOne, totalKcal: it.totalKcal }));
      setEaten(prev => [...prev, ...newItems]);
      setAiNote(data.note || ""); setAiSee(data.whatYouSee || "");
      stopCamera(); setPhoto(null);
    } catch (e) { setErr(e.message); } finally { setIsAnalyzing(false); }
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(f);
  };

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl shadow-violet-900/20">
      <button onClick={() => setShow(!show)} className="w-full flex items-center justify-between text-left">
        <div>
          <h2 className="font-display font-light text-[20px] leading-none">Kcal Calculator — Didi</h2>
          <p className="text-[11px] text-stone-400 mt-1">Type it OR snap it, Didi calculates • {today} • Target: {target} kcal {customCalories ? '(Custom)' : `(${GOALS[goal]?.label})`}</p>
        </div>
        <span className="text-[20px]">{show ? '−' : '+'}</span>
      </button>

      {show && (
        <div className="mt-4">
          <div className="bg-[#F5F0FF] rounded-2xl p-4 mb-4">
            <div className="flex justify-between text-[13px] font-bold"><span>🔥 Eaten: {totalEaten} kcal</span><span>{over ? `Over by ${Math.abs(left)}` : `${left} left`}</span></div>
            <div className="h-3 bg-white rounded-full mt-2 overflow-hidden"><div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF]'}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-[11px] text-stone-500 mt-1.5">{pct}% of {target} kcal target • {eaten.length} items today</p>
          </div>

          <div className="flex gap-2 mb-2">
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCalc()} placeholder="e.g. 2 plates jollof + 1 grilled chicken + 1 Coke" className="flex-1 min-w-0 h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
            <button onClick={handleCalc} disabled={isCalc || !text.trim()} className="shrink-0 h-12 px-5 bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white rounded-full text-[13px] font-bold shadow">{isCalc ? 'Didi is thinking...' : '✦ Calculate'}</button>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={startCamera} className="h-10 px-4 bg-[#1A1A2E] text-white rounded-full text-[12px] font-bold">📸 Snap your food</button>
            <button onClick={() => fileRef.current?.click()} className="h-10 px-4 bg-white border border-[#EDEAFF] rounded-full text-[12px] font-bold">🖼️ Upload Photo</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button onClick={() => setEaten([])} className="h-10 px-4 bg-white border border-red-100 text-red-500 rounded-full text-[12px] font-bold">Clear today</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['1 plate Jollof + Chicken', 'A full plate of Beans', '2 Boiled Eggs + Bread', '1 bottle Coke'].map(s => (
              <button key={s} onClick={() => setText(s)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#F5F0FF] text-[#4A3B8C] border border-[#E6E0FF]">{s}</button>
            ))}
          </div>

          {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 rounded-xl p-3 mb-3">{err}</p>}
          {aiSee && <p className="text-[12px] bg-[#F5F0FF] rounded-xl p-3 mb-2">👀 <b>Didi sees:</b> {aiSee}</p>}
          {aiNote && <p className="text-[12px] bg-[#FFF8E1] rounded-xl p-3 mb-3">🤖 <b>Didi:</b> {aiNote}</p>}

          {eaten.length > 0 ? (
            <div className="space-y-2">
              {eaten.map(it => (
                <div key={it.id} className="flex items-center justify-between bg-[#FBFAFF] border border-[#EDEAFF] rounded-2xl px-3 py-2.5">
                  <div><p className="text-[13px] font-bold">{it.name}</p><p className="text-[11px] text-stone-400">{it.qty} {it.unit} × {it.kcal} kcal</p></div>
                  <div className="flex items-center gap-2"><span className="text-[13px] font-bold">{it.totalKcal} kcal</span><button onClick={() => setEaten(prev => prev.filter(x => x.id !== it.id))} className="w-6 h-6 bg-red-50 text-red-500 rounded-full text-[11px] font-bold">✕</button></div>
                </div>
              ))}
            </div>
          ) : <p className="text-[12px] text-stone-400 text-center py-3">Nothing logged yet today. Type or snap your food.</p>}

          {showCamera && (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={stopCamera}>
              <div className="bg-white rounded-[24px] p-4 w-full max-w-[480px]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold">📸 Snap your food — Didi will calculate</h3><button onClick={stopCamera} className="w-8 h-8 bg-stone-100 rounded-full font-bold">✕</button></div>
                {!photo ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover rounded-2xl bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2 mt-3"><button onClick={snapPhoto} className="flex-1 h-12 bg-[#1A1A2E] text-white rounded-full font-bold">📸 Take Photo</button><button onClick={() => fileRef.current?.click()} className="h-12 px-5 bg-white border rounded-full font-bold">Upload</button></div>
                  </>
                ) : (
                  <>
                    <img src={photo} alt="Your food" className="w-full aspect-[4/3] object-cover rounded-2xl" />
                    <div className="flex gap-2 mt-3"><button onClick={analyzePhoto} disabled={isAnalyzing} className="flex-1 h-12 bg-gradient-to-r from-[#7B61FF] to-[#9B8CFF] text-white rounded-full font-bold">{isAnalyzing ? '👩🏾‍🍳 Didi is looking...' : '✦ Let Didi Calculate Calories'}</button><button onClick={() => setPhoto(null)} className="h-12 px-5 bg-white border rounded-full font-bold">Retake</button></div>
                  </>
                )}
                {err && <p className="text-[12px] text-red-600 mt-2">{err}</p>}
              </div>
            </div>
          )}
          {photo && !showCamera && (
            <div className="mt-3 bg-[#F5F0FF] rounded-2xl p-3 flex gap-3 items-center">
              <img src={photo} alt="Uploaded food" className="w-16 h-16 object-cover rounded-xl" />
              <div className="flex-1"><p className="text-[12px] font-bold">Photo ready</p><p className="text-[11px] text-stone-400">Didi will look at this plate</p></div>
              <button onClick={analyzePhoto} disabled={isAnalyzing} className="h-10 px-4 bg-[#1A1A2E] text-white rounded-full text-[12px] font-bold">{isAnalyzing ? 'Looking...' : '✦ Calculate'}</button>
              <button onClick={() => setPhoto(null)} className="w-8 h-8 bg-white rounded-full font-bold">✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
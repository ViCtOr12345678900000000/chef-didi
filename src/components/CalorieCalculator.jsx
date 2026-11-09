import { useState, useEffect, useMemo, useRef } from "react";
import { GOALS, THEMES } from "../lib/didi";

export default function CalorieCalculator({ user, goal='normal', themeId='purple', lang='en' }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const today = new Date().toISOString().slice(0,10);
  const key = user?.email ? `didi_kcal_${user.email}_${today}` : `didi_kcal_guest_${today}`;
  const [eaten, setEaten] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } });
  const [text, setText] = useState("");
  const [isCalc, setIsCalc] = useState(false);
  const [err, setErr] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [show, setShow] = useState(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null); // base64
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSee, setAiSee] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { localStorage.setItem(key, JSON.stringify(eaten)); }, [eaten, key]);
  useEffect(() => { try { setEaten(JSON.parse(localStorage.getItem(key)) || []) } catch { setEaten([]) } }, [key]);
  useEffect(() => {
    const onUpdate = () => { try { setEaten(JSON.parse(localStorage.getItem(key)) || []) } catch {} };
    window.addEventListener("didi-kcal-updated", onUpdate);
    return () => window.removeEventListener("didi-kcal-updated", onUpdate);
  }, [key]);
  // Stop camera when modal closes
  useEffect(() => { return () => stopCamera(); }, []);

  const totalEaten = useMemo(() => eaten.reduce((s, x) => s + (x.totalKcal || x.kcal * x.qty), 0), [eaten]);
  const target = GOALS[goal]?.calories || 2000;
  const left = Math.max(0, target - totalEaten);
  const pct = Math.min(100, Math.round((totalEaten / target) * 100));
  const over = totalEaten > target;

  const handleCalc = async () => {
    if (!text.trim()) return;
    setErr(""); setIsCalc(true);
    try {
      const res = await fetch("/api/calc-calories", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: text.trim(), goal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      if (!data.items?.length) throw new Error("AI couldn't understand that. Try e.g. '1 plate jollof + chicken'");
      setEaten(p => [...p, ...data.items.map(it => ({ id: Date.now()+Math.random(), name: it.name, qty: it.qty, unit: it.unit||"serving", kcal: it.kcalPerOne, totalKcal: it.totalKcal }))]);
      if (data.note) setAiNote(data.note);
      setText("");
    } catch (e) { setErr(e.message); } finally { setIsCalc(false); }
  };

  // --- CAMERA ---
  const startCamera = async () => {
    setErr(""); setPhoto(null); setAiSee(""); setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      // wait a tick for video element to mount
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (e) {
      setErr("Camera blocked. Allow camera permission, or use Upload Photo below.");
    }
  };
  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };
  const closeCamera = () => { stopCamera(); setShowCamera(false); setPhoto(null); };
  const snapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(dataUrl); stopCamera();
  };
  const retake = () => { setPhoto(null); startCamera(); };
  const onFilePick = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result); setShowCamera(true); stopCamera(); };
    reader.readAsDataURL(file);
  };
  const analyzePhoto = async () => {
    if (!photo) return;
    setErr(""); setIsAnalyzing(true);
    try {
      const res = await fetch("/api/calc-calories-image", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ image: photo, goal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI vision failed");
      if (!data.items?.length) { setAiSee(data.whatYouSee || "No food detected"); setAiNote(data.note || "Snap your plate again."); return; }
      setEaten(p => [...p, ...data.items.map(it => ({ id: Date.now()+Math.random(), name: it.name, qty: it.qty, unit: it.unit||"serving", kcal: it.kcalPerOne, totalKcal: it.totalKcal }))]);
      setAiSee(data.whatYouSee || ""); setAiNote(data.note || "");
      closeCamera();
    } catch (e) { setErr(e.message); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-xl shadow-violet-900/10 border border-[#EDEAFF]">
      <button onClick={() => setShow(!show)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2.5"><span className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.btn} text-white flex items-center justify-center text-[16px]`}>🔥</span><div><h2 className="font-display font-light text-[14px] leading-none">Kcal Calculator </h2><p className="text-[11px] text-stone-400 mt-0.5">Type it OR snap it, Didi calculates • {today}</p></div></div>
        <span className="text-[12px] font-bold bg-[#F5F0FF] text-[#5A3EC8] px-3 py-1.5 rounded-full shrink-0">{totalEaten} / {target} kcal {show ? '▲' : '▼'}</span>
      </button>

      {show && (
        <div className="mt-4">
          <div className="bg-[#F5F0FF] rounded-2xl p-3.5 mb-4">
            <div className="flex justify-between text-[12px] font-bold mb-2"><span>{GOALS[goal]?.emoji} {GOALS[goal]?.label} • Target {target} kcal</span><span className={over ? 'text-red-500' : 'text-[#5A3EC8]'}>{over ? `Over by ${totalEaten - target} kcal ⚠️` : `${left} kcal left ✅`}</span></div>
            <div className="h-3 bg-white rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : `bg-gradient-to-r ${theme.btn}`}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-[11px] text-stone-400 mt-2">{pct}% of today • {eaten.length} item{eaten.length!==1?'s':''} logged {user ? `• Saved for ${user.name}` : '• Login to save'}</p>
          </div>

          {/* 2 WAYS: Type OR Camera */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => { setShowCamera(false); }} className="h-11 rounded-full bg-[#FBFAFF] border border-[#EDEAFF] text-[13px] font-bold">⌨️ Type what you ate</button>
            <button onClick={startCamera} className={`h-11 rounded-full text-[13px] font-bold text-white bg-gradient-to-r ${theme.btn} shadow-md`}>📸 Snap your food</button>
          </div>

          <div className="flex gap-2 mb-2">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCalc()} placeholder='e.g. 2 plates jollof + 1 grilled chicken + 1 Coke' className="flex-1 h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[13px] outline-none focus:border-[#7B61FF]" />
            <button onClick={handleCalc} disabled={isCalc || !text.trim()} className={`h-12 px-5 rounded-full text-[13px] font-bold text-white shrink-0 ${isCalc ? 'bg-stone-300' : `bg-gradient-to-r ${theme.btn} shadow-md active:scale-95`}`}>{isCalc ? 'AI thinking...' : '✦ Calculate'}</button>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">Or snap: <button onClick={startCamera} className="underline font-semibold text-[#7B61FF]">Open camera 📸</button> • Didi will see your plate and calculate</p>
          {err && <p className="text-[12px] text-red-500 font-semibold mb-2">{err}</p>}
          {aiSee && <p className="text-[12px] bg-white border border-[#EDEAFF] rounded-2xl p-3 mb-2">👀 <b>Didi sees:</b> {aiSee}</p>}
          {aiNote && <p className="text-[12px] bg-[#F5F0FF] border border-[#EDEAFF] rounded-2xl p-3 mb-3">🤖 <b>Didi:</b> {aiNote}</p>}

          {eaten.length === 0 ? <p className="text-center text-[12px] text-stone-400 py-3">Nothing yet. Type it or snap it 🍲</p> : (
            <div className="space-y-2">
              {eaten.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#FBFAFF] border border-[#EDEAFF] rounded-2xl px-3 py-2.5">
                  <div><p className="text-[13px] font-semibold">{item.name} <span className="text-stone-400 font-normal">× {item.qty} {item.unit}</span></p><p className="text-[11px] text-stone-400">{item.kcal} kcal each • Didi estimated</p></div>
                  <div className="flex items-center gap-2"><span className="text-[13px] font-bold">{item.totalKcal} kcal</span><button onClick={()=>setEaten(p=>p.filter(x=>x.id!==item.id))} className="w-6 h-6 bg-white border rounded-full text-[11px] hover:bg-red-500 hover:text-white">✕</button></div>
                </div>
              ))}
              <div className="flex justify-between pt-2"><button onClick={()=>setEaten([])} className="text-[12px] font-semibold text-red-400">Clear today</button><p className="text-[13px] font-bold">Total: {totalEaten} kcal • Left: {left} kcal</p></div>
            </div>
          )}
        </div>
      )}

      {/* CAMERA MODAL */}
      {showCamera && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeCamera}>
          <div className="bg-white w-full max-w-[420px] rounded-[24px] overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 flex justify-between items-center"><h3 className="font-display text-[18px]">📸 Snap your food</h3><button onClick={closeCamera} className="w-8 h-8 bg-stone-100 rounded-full font-bold">✕</button></div>
            <div className="bg-black aspect-[4/3] relative overflow-hidden flex items-center justify-center">
              {!photo ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /> : <img src={photo} className="w-full h-full object-cover" alt="Your food" />}
              {!photo && !videoRef.current && <p className="absolute text-white text-[12px] text-center px-4">Allow camera, or use Upload below<br/>Tip: Hold phone over plate, good light</p>}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-4">
              {!photo ? (
                <>
                  <button onClick={snapPhoto} className={`w-full h-12 rounded-full text-white font-bold bg-gradient-to-r ${theme.btn} shadow-md`}>● Snap Photo</button>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>fileRef.current?.click()} className="flex-1 h-11 rounded-full bg-[#F5F0FF] font-bold text-[13px]">🖼️ Upload Photo</button>
                    <button onClick={closeCamera} className="flex-1 h-11 rounded-full bg-white border font-bold text-[13px]">Cancel</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePick} />
                </>
              ) : (
                <>
                  <p className="text-[12px] text-stone-500 text-center mb-3">Looks good? Let Didi see it.</p>
                  <button onClick={analyzePhoto} disabled={isAnalyzing} className={`w-full h-12 rounded-full text-white font-bold ${isAnalyzing ? 'bg-stone-300' : `bg-gradient-to-r ${theme.btn} shadow-md`}`}>{isAnalyzing ? '🤖 AI is looking at your plate...' : '✦ Let AI Calculate Calories'}</button>
                  <div className="flex gap-2 mt-2"><button onClick={retake} className="flex-1 h-11 rounded-full bg-[#F5F0FF] font-bold text-[13px]">↩ Retake</button><button onClick={closeCamera} className="flex-1 h-11 rounded-full bg-white border font-bold text-[13px]">Cancel</button></div>
                </>
              )}
              {err && <p className="text-[12px] text-red-500 font-semibold text-center mt-2">{err}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
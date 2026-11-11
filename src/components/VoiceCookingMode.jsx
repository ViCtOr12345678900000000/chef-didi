import { useState, useEffect, useRef } from "react";

export default function VoiceCookingMode({ recipe, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerLabel, setTimerLabel] = useState("");
  const [transcript, setTranscript] = useState("");
  const [grandpaVoice, setGrandpaVoice] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const steps = recipe?.steps || recipe?.instructions || [];
  const stepList = Array.isArray(steps) ? steps : typeof steps === "string" ? steps.split(/\n|(?<=\.)\s+/).filter(Boolean) : [];
  const currentStep = stepList[stepIndex] || "No steps found";

  // --- GRANDPA VOICE ONLY ---
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      if (!all.length) return;
      const english = all.filter(v => v.lang.startsWith("en"));
      // Grandpa = deep older male. Score for male / old voices only
      const score = (v) => {
        const n = v.name.toLowerCase();
        let s = 0;
        if (n.includes("daniel")) s += 100; // iPhone Grandpa - deep British male
        if (n.includes("david")) s += 95; // Windows Grandpa
        if (n.includes("fred")) s += 90; // Mac Grandpa
        if (n.includes("alex")) s += 85;
        if (n.includes("google uk english male")) s += 90;
        if (n.includes("google us english male")) s += 85;
        if (n.includes("male")) s += 60;
        if (n.includes("microsoft guy") || n.includes("guy")) s += 70;
        if (n.includes("ryan") || n.includes("brian") || n.includes("aaron")) s += 50;
        if (v.lang === "en-GB") s += 20;
        if (v.lang === "en-NG") s += 15;
        // Penalise female / young voices - we NEVER want them
        if (n.includes("female") || n.includes("samantha") || n.includes("zira") || n.includes("susan") || n.includes("aria") || n.includes("jenny")) s -= 100;
        return s;
      };
      const sorted = [...english].sort((a, b) => score(b) - score(a));
      if (sorted[0]) setGrandpaVoice(sorted[0]);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (grandpaVoice) { utter.voice = grandpaVoice; utter.lang = grandpaVoice.lang; }
    else utter.lang = "en-GB";
    utter.rate = 0.82; // Grandpa is SLOW, calm
    utter.pitch = 0.65; // Deep, low Grandpa pitch - this is the key fix
    utter.volume = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };
  const nextStep = () => {
    if (stepIndex < stepList.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      speak(`Step ${next + 1}, my child. ${stepList[next]}`);
    } else {
      speak("That's it, my child. Your food is ready. Come and eat, well done.");
    }
  };
  const prevStep = () => {
    if (stepIndex > 0) {
      const prev = stepIndex - 1;
      setStepIndex(prev);
      speak(`Okay, back to step ${prev + 1}, my child. ${stepList[prev]}`);
    }
  };
  const startTimer = (minutes, label = "Timer") => {
    if (timerRef.current) clearInterval(timerRef.current);
    let secs = Math.round(minutes * 60);
    setTimer(secs); setTimerLabel(label);
    speak(`Timer set for ${minutes} minutes, my child. Go and rest, I will call you.`);
    timerRef.current = setInterval(() => {
      secs -= 1; setTimer(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current); setTimer(null);
        speak("My child, timer is done! Come and check your food now.");
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
      }
    }, 1000);
  };
  const handleVoiceCommand = (cmd) => {
    const c = cmd.toLowerCase(); setTranscript(cmd);
    if (c.includes("next")) nextStep();
    else if (c.includes("back") || c.includes("previous")) prevStep();
    else if (c.includes("repeat") || c.includes("again")) speak(`Step ${stepIndex + 1}, my child. ${currentStep}`);
    else if (c.includes("timer")) {
      const match = c.match(/(\d+)\s*(minute|min|second)/);
      if (match) startTimer(match[2].includes("second") ? parseInt(match[1]) / 60 : parseInt(match[1]), "Cooking timer");
      else speak("How many minutes, my child? Say set timer for 15 minutes.");
    } else if (c.includes("stop") || c.includes("pause")) stopSpeaking();
  };
  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice commands need Chrome on Android. Use buttons for now."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR(); rec.lang = "en-NG"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => handleVoiceCommand(e.results[e.results.length - 1][0].transcript);
    recognitionRef.current = rec; rec.start(); setIsListening(true);
    speak("Grandpa is here, my child. Say Next, Repeat, or Set timer for 15 minutes.");
  };
  useEffect(() => { return () => { window.speechSynthesis.cancel(); recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }; }, []);
  const formatTimer = (s) => { if (s === null) return null; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, "0")}`; };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-full max-w-[480px] shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div><h3 className="font-display text-[22px] leading-none">👴🏾 Grandpa Didi — Voice Mode</h3><p className="text-[12px] text-stone-400 mt-1">{recipe?.title} • Hands-free • {grandpaVoice ? `Voice: ${grandpaVoice.name}` : "Loading Grandpa voice..."}</p></div>
          <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full font-bold">✕</button>
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2"><span className="text-[20px]">👴🏾</span><p className="text-[12px] text-amber-800"><b>Grandpa is cooking with you.</b> Slow, deep voice. No more robot lady. Tap Read Step and listen.</p></div>
        <div className="mt-4 flex gap-1">{stepList.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-green-500" : "bg-stone-100"}`} />))}</div>
        <p className="text-[11px] text-stone-400 mt-1">Step {stepIndex + 1} of {stepList.length}</p>
        <div className="bg-stone-50 rounded-2xl p-4 mt-3 min-h-[110px]"><p className="text-[15px] font-semibold leading-relaxed">{currentStep}</p></div>
        {transcript && <p className="text-[11px] text-stone-400 mt-2 italic">You said: "{transcript}"</p>}
        {timer !== null && (<div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex justify-between items-center"><span className="text-[13px] font-bold">⏲️ {timerLabel} — {formatTimer(timer)}</span><button onClick={() => { clearInterval(timerRef.current); setTimer(null); }} className="text-[11px] font-bold text-red-500">Cancel</button></div>)}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={prevStep} disabled={stepIndex === 0} className="h-12 rounded-full bg-stone-100 font-bold text-[13px] disabled:opacity-40">← Back</button>
          <button onClick={() => speak(`Step ${stepIndex + 1}, my child. ${currentStep}`)} className="h-12 rounded-full bg-black text-white font-bold text-[13px]">{isSpeaking ? "🔊 Grandpa..." : "▶️ Read Step"}</button>
          <button onClick={nextStep} className="h-12 rounded-full bg-green-600 text-white font-bold text-[13px]">Next →</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={toggleListening} className={`h-12 rounded-full font-bold text-[13px] ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700"}`}>{isListening ? "🎙️ Listening... Tap to Stop" : "🎙️ Talk to Grandpa"}</button>
          <button onClick={() => startTimer(15, "General cooking")} className="h-12 rounded-full bg-amber-100 text-amber-800 font-bold text-[13px]">⏲️ 15 Min Timer</button>
        </div>
        <div className="mt-4 bg-purple-50 rounded-2xl p-3"><p className="text-[11px] font-bold text-purple-800 mb-1">Try saying:</p><p className="text-[11px] text-purple-600">"Next" • "Repeat" • "Set timer for 15 minutes" • "Back"</p></div>
        {isSpeaking && <button onClick={stopSpeaking} className="w-full mt-3 h-10 rounded-full bg-stone-100 font-bold text-[12px]">⏹️ Stop Grandpa</button>}
      </div>
    </div>
  );
}

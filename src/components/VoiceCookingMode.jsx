import { useState, useEffect, useRef } from "react";

export default function VoiceCookingMode({ recipe, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerLabel, setTimerLabel] = useState("");
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const steps = recipe?.steps || recipe?.instructions || [];
  const stepList = Array.isArray(steps) ? steps : typeof steps === "string" ? steps.split(/\n|(?<=\.)\s+/).filter(Boolean) : [];
  const currentStep = stepList[stepIndex] || "No steps found";

  // --- PICK BEST NATURAL VOICE ---
  useEffect(() => {
    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      if (!all.length) return;
      // Filter to English only, prefer natural-sounding ones
      const english = all.filter(v => v.lang.startsWith("en"));
      // Score voices: Google > Microsoft Natural > Samantha > Female names > default
      const score = (v) => {
        const name = v.name.toLowerCase();
        let s = 0;
        if (name.includes("google uk english female")) s += 100;
        if (name.includes("google us english")) s += 90;
        if (name.includes("samantha")) s += 85;
        if (name.includes("zira") || name.includes("aria") || name.includes("jenny") || name.includes("sonia")) s += 80;
        if (name.includes("natural")) s += 70;
        if (name.includes("female")) s += 60;
        if (v.lang === "en-GB") s += 30;
        if (v.lang === "en-NG") s += 25;
        if (v.lang === "en-US") s += 20;
        if (v.default) s += 5;
        if (name.includes("male") || name.includes("david") || name.includes("daniel")) s -= 20;
        return s;
      };
      const sorted = [...english].sort((a, b) => score(b) - score(a));
      setVoices(sorted);
      if (!selectedVoice && sorted[0]) setSelectedVoice(sorted[0]);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Voice not supported. Use Chrome on Android / Safari on iPhone.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utter.voice = selectedVoice;
      utter.lang = selectedVoice.lang;
    } else {
      utter.lang = "en-GB";
    }
    utter.rate = 0.92; // Slower = more human, less robot
    utter.pitch = 1.05; // Slightly warm, not chipmunk
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
      speak(`Step ${next + 1}. ${stepList[next]}`);
    } else {
      speak("That's the last step. Your food is ready. Enjoy your meal!");
    }
  };
  const prevStep = () => {
    if (stepIndex > 0) {
      const prev = stepIndex - 1;
      setStepIndex(prev);
      speak(`Step ${prev + 1}. ${stepList[prev]}`);
    }
  };
  const startTimer = (minutes, label = "Timer") => {
    if (timerRef.current) clearInterval(timerRef.current);
    let secs = Math.round(minutes * 60);
    setTimer(secs);
    setTimerLabel(label);
    speak(`Timer set for ${minutes} minutes. ${label}`);
    timerRef.current = setInterval(() => {
      secs -= 1;
      setTimer(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        setTimer(null);
        speak("Timer done! Check your food now.");
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
      }
    }, 1000);
  };

  const handleVoiceCommand = (cmd) => {
    const c = cmd.toLowerCase();
    setTranscript(cmd);
    if (c.includes("next")) nextStep();
    else if (c.includes("back") || c.includes("previous")) prevStep();
    else if (c.includes("repeat") || c.includes("again")) speak(`Step ${stepIndex + 1}. ${currentStep}`);
    else if (c.includes("timer")) {
      const match = c.match(/(\d+)\s*(minute|min|second)/);
      if (match) {
        const num = parseInt(match[1]);
        startTimer(match[2].includes("second") ? num / 60 : num, "Cooking timer");
      } else speak("How many minutes? Say set timer for 15 minutes.");
    } else if (c.includes("stop") || c.includes("pause")) stopSpeaking();
  };

  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice commands need Chrome on Android. Use buttons for now."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang = "en-NG";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => handleVoiceCommand(e.results[e.results.length - 1][0].transcript);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    speak("Voice mode on. Say Next, Repeat, or Set timer for 15 minutes.");
  };

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTimer = (s) => { if (s === null) return null; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, "0")}`; };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-full max-w-[480px] shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-display text-[22px] leading-none">🎙️ Cook With Me — Voice Mode</h3>
            <p className="text-[12px] text-stone-400 mt-1">{recipe?.title} • Hands-free</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full font-bold">✕</button>
        </div>

        {/* VOICE PICKER - NEW */}
        <div className="mt-4 bg-purple-50 rounded-2xl p-3">
          <p className="text-[11px] font-bold text-purple-800 mb-1">🎤 Voice — pick one you like:</p>
          <select value={selectedVoice?.name || ""} onChange={(e) => {
            const v = voices.find(v => v.name === e.target.value);
            setSelectedVoice(v);
            if (v) {
              const test = new SpeechSynthesisUtterance("Hi, I'm Didi. Let's cook together.");
              test.voice = v; test.lang = v.lang; test.rate = 0.92; test.pitch = 1.05;
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(test);
            }
          }} className="w-full h-10 px-3 bg-white border rounded-full text-[12px] outline-none">
            {voices.slice(0, 12).map(v => <option key={v.name} value={v.name}>{v.name} — {v.lang}</option>)}
          </select>
          <p className="text-[10px] text-purple-500 mt-1">Tap a voice to preview it. On iPhone, Samantha sounds most human. On Android, Google UK Female is best.</p>
        </div>

        <div className="mt-4 flex gap-1">
          {stepList.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-green-500" : "bg-stone-100"}`} />))}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Step {stepIndex + 1} of {stepList.length}</p>

        <div className="bg-stone-50 rounded-2xl p-4 mt-3 min-h-[110px]">
          <p className="text-[15px] font-semibold leading-relaxed">{currentStep}</p>
        </div>
        {transcript && <p className="text-[11px] text-stone-400 mt-2 italic">You said: "{transcript}"</p>}
        {timer !== null && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex justify-between items-center">
            <span className="text-[13px] font-bold">⏲️ {timerLabel} — {formatTimer(timer)}</span>
            <button onClick={() => { clearInterval(timerRef.current); setTimer(null); }} className="text-[11px] font-bold text-red-500">Cancel</button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={prevStep} disabled={stepIndex === 0} className="h-12 rounded-full bg-stone-100 font-bold text-[13px] disabled:opacity-40">← Back</button>
          <button onClick={() => speak(`Step ${stepIndex + 1}. ${currentStep}`)} className="h-12 rounded-full bg-black text-white font-bold text-[13px]">{isSpeaking ? "🔊 Speaking..." : "▶️ Read Step"}</button>
          <button onClick={nextStep} className="h-12 rounded-full bg-green-600 text-white font-bold text-[13px]">Next →</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={toggleListening} className={`h-12 rounded-full font-bold text-[13px] ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700"}`}>{isListening ? "🎙️ Listening... Tap to Stop" : "🎙️ Voice Commands"}</button>
          <button onClick={() => startTimer(15, "General cooking")} className="h-12 rounded-full bg-amber-100 text-amber-800 font-bold text-[13px]">⏲️ 15 Min Timer</button>
        </div>
        <div className="mt-4 bg-purple-50 rounded-2xl p-3">
          <p className="text-[11px] font-bold text-purple-800 mb-1">Try saying:</p>
          <p className="text-[11px] text-purple-600">"Next" • "Repeat" • "Set timer for 15 minutes" • "Back"</p>
        </div>
        {isSpeaking && <button onClick={stopSpeaking} className="w-full mt-3 h-10 rounded-full bg-stone-100 font-bold text-[12px]">⏹️ Stop Voice</button>}
      </div>
    </div>
  );
}

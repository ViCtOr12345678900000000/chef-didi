import { useState } from "react";

function getUsers() {
  try { return JSON.parse(localStorage.getItem("didi_users") || "[]"); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem("didi_users", JSON.stringify(users));
}
function saveSession(session) {
  localStorage.setItem("didi_session", JSON.stringify(session));
}

const QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favourite food?",
  "What was your childhood nickname?",
  "What is your mother's first name?",
];

// Hash answer in browser so we never send plain text
async function hashAnswer(str) {
  const clean = String(str || "").trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clean));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function syncToUpstash(user, isNew) {
  try {
    if (!isNew) return;
    await fetch("/api/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: [{
        email: user.email,
        name: user.name,
        password: user.password || "",
        securityQuestion: user.securityQuestion || "",
        securityAnswerHash: user.securityAnswerHash || "",
        prefs: {},
        fav: [],
        history: [],
        shopping: [],
        pantry: ["Oil", "Salt", "Onion", "Maggi"],
        weights: [],
        kcal: {},
        createdAt: new Date().toISOString(),
        migrated: false,
      }] }),
    });
    localStorage.setItem("didi-migrated", "1");
  } catch (e) {}
}

async function loginUserLocalOrCloud(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const found = users.find(u => u.email === cleanEmail);
  if (found) {
    if (found.password !== password) throw new Error("Wrong password. Try again.");
    const session = { name: found.name, email: found.email };
    saveSession(session);
    return session;
  }
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "No account with this email. Please register first.");
    const all = getUsers();
    all.push({ name: data.user.name, email: cleanEmail, password });
    saveUsers(all);
    if (data.user.prefs) localStorage.setItem(`didi_prefs_${cleanEmail}`, JSON.stringify(data.user.prefs));
    if (data.user.fav) localStorage.setItem(`didi_fav_${cleanEmail}`, JSON.stringify(data.user.fav));
    if (data.user.history) localStorage.setItem(`didi_history_${cleanEmail}`, JSON.stringify(data.user.history));
    if (data.user.shopping) localStorage.setItem(`didi_shopping_${cleanEmail}`, JSON.stringify(data.user.shopping));
    if (data.user.pantry) localStorage.setItem(`didi_pantry_${cleanEmail}`, JSON.stringify(data.user.pantry));
    if (data.user.weights) localStorage.setItem(`didi_weights_${cleanEmail}`, JSON.stringify(data.user.weights));
    const session = { name: data.user.name, email: cleanEmail };
    saveSession(session);
    return session;
  } catch (e) {
    throw new Error(e.message || "No account with this email on this device. Please register first.");
  }
}

function registerUserLocal(name, email, password, secQ, secHash) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  if (users.find(u => u.email === cleanEmail)) throw new Error("This email is already registered. Please login instead.");
  const newUser = { name: name.trim(), email: cleanEmail, password, securityQuestion: secQ, securityAnswerHash: secHash };
  users.push(newUser);
  saveUsers(users);
  const session = { name: newUser.name, email: newUser.email };
  saveSession(session);
  return { session, newUser };
}

export default function AuthModal({ onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secQ, setSecQ] = useState(QUESTIONS[0]);
  const [secA, setSecA] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot flow: email -> question -> answer -> new password
  const [mode, setMode] = useState("auth"); // auth | forgot-email | forgot-answer | forgot-new | setup-sec
  const [forgotQ, setForgotQ] = useState("");
  const [forgotA, setForgotA] = useState("");
  const [newPass, setNewPass] = useState("");
  const [setupQ, setSetupQ] = useState(QUESTIONS[0]);
  const [setupA, setSetupA] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  const resetAll = () => { setErr(""); setMode("auth"); setForgotQ(""); setForgotA(""); setNewPass(""); setSetupA(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await loginUserLocalOrCloud(email, password);
        // Old user without security question? Ask them to set it once
        try {
          const r = await fetch(`/api/reset-password?action=has-question&email=${encodeURIComponent(user.email)}`);
          const j = await r.json();
          if (!j.hasQuestion) { setPendingUser(user); setMode("setup-sec"); return; }
        } catch {}
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 4) throw new Error("Password must be at least 4 characters.");
        if (!secA.trim()) throw new Error("Please answer your security question — you'll need it if you forget your password.");
        const hash = await hashAnswer(secA);
        const { session, newUser } = registerUserLocal(name, email, password, secQ, hash);
        syncToUpstash(newUser, true);
        user = session;
      }
      onAuth(user);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleSetupSec = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (!setupA.trim()) throw new Error("Please enter an answer.");
      const hash = await hashAnswer(setupA);
      const res = await fetch("/api/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-question", email: pendingUser.email, question: setupQ, answerHash: hash }) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not save. Try again.");
      // Save locally too
      const users = getUsers().map(u => u.email === pendingUser.email ? { ...u, securityQuestion: setupQ, securityAnswerHash: hash } : u);
      saveUsers(users);
      onAuth(pendingUser);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleForgotEmail = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const res = await fetch(`/api/reset-password?action=get-question&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const j = await res.json();
      if (!res.ok || !j.question) throw new Error(j.error || "No account with this email, or no security question set. Please create a new account.");
      setForgotQ(j.question); setMode("forgot-answer");
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleForgotAnswer = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (!forgotA.trim()) throw new Error("Please enter your answer.");
      const hash = await hashAnswer(forgotA);
      const res = await fetch("/api/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", email: email.trim().toLowerCase(), answerHash: hash }) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Wrong answer. Try again.");
      setMode("forgot-new");
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleForgotNew = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (newPass.length < 4) throw new Error("Password must be at least 4 characters.");
      const hash = await hashAnswer(forgotA);
      const res = await fetch("/api/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", email: email.trim().toLowerCase(), answerHash: hash, newPassword: newPass }) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Reset failed. Try again.");
      // Update local copy too so login works instantly on this phone
      const users = getUsers().map(u => u.email === email.trim().toLowerCase() ? { ...u, password: newPass } : u);
      saveUsers(users);
      const user = await loginUserLocalOrCloud(email, newPass);
      onAuth(user);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const inputCls = "w-full h-12 px-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl text-[14px] outline-none focus:border-[#1A1A2E] focus:bg-white transition placeholder:text-stone-400";
  const selectCls = "w-full h-12 px-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl text-[14px] outline-none focus:border-[#1A1A2E] focus:bg-white transition";
  const btnCls = "w-full h-12 bg-[#1A1A2E] hover:bg-black text-white rounded-full font-semibold text-[14px] shadow disabled:opacity-60 active:scale-[0.98] transition";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-full max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-stone-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {mode === "auth" && (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-medium text-[24px] leading-tight text-[#1A1A2E] tracking-tight">{isLogin ? "Welcome back 👋" : "Join Chef Didi 👩🏾‍🍳"}</h2>
                <p className="text-[13px] text-stone-400 mt-1 font-light">{isLogin ? "Login to save your Goal, Theme & Kcal" : "Create account to unlock Favourites, Shopping, Kcal & more"}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-[#FAF9F6] border border-stone-100 rounded-full font-semibold text-stone-500 flex items-center justify-center shrink-0">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              {!isLogin && <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name e.g. Ada" className={inputCls} />}
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Email e.g. ada@gmail.com" className={inputCls} />
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="Password" className={inputCls} />
              {!isLogin && (
                <div className="bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3 space-y-2">
                  <p className="text-[12px] font-semibold text-[#1A1A2E]">🔐 Security question — for password recovery</p>
                  <select value={secQ} onChange={e => setSecQ(e.target.value)} className={selectCls}>{QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}</select>
                  <input value={secA} onChange={e => setSecA(e.target.value)} placeholder="Your answer e.g. Bingo" className={inputCls} />
                  <p className="text-[11px] text-stone-400 font-light">Remember this answer. We will ask it if you forget your password.</p>
                </div>
              )}
              {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">{err}</p>}
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Please wait..." : isLogin ? "Login →" : "Create Account →"}</button>
            </form>
            {isLogin && <button onClick={() => { setMode("forgot-email"); setErr(""); }} className="w-full text-center text-[12px] font-semibold text-stone-500 mt-3 hover:text-[#1A1A2E]">Forgot password? Reset with security question →</button>}
            <button onClick={() => { setIsLogin(!isLogin); setErr(""); }} className="w-full text-center text-[12px] font-semibold text-[#1A1A2E] mt-3">{isLogin ? "No account? Create one →" : "Already have account? Login →"}</button>
            {!isLogin && <p className="text-[11px] text-center text-stone-400 mt-3 font-light">🔒 Register once, unlock Favourites, Shopping, Pantry, Weight, Water & Kcal History</p>}
          </>
        )}

        {mode === "setup-sec" && (
          <>
            <div className="flex justify-between items-start"><h2 className="font-display font-medium text-[22px] tracking-tight">One last step 🔐</h2><button onClick={onClose} className="w-8 h-8 bg-[#FAF9F6] border border-stone-100 rounded-full font-semibold text-stone-500 flex items-center justify-center shrink-0">✕</button></div>
            <p className="text-[13px] text-stone-500 mt-1 font-light">Set a security question so you can recover your password if you forget it. You only do this once.</p>
            <form onSubmit={handleSetupSec} className="mt-4 space-y-3">
              <select value={setupQ} onChange={e => setSetupQ(e.target.value)} className={selectCls}>{QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}</select>
              <input value={setupA} onChange={e => setSetupA(e.target.value)} placeholder="Your answer" className={inputCls} />
              {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">{err}</p>}
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Saving..." : "Save & Continue →"}</button>
            </form>
          </>
        )}

        {mode === "forgot-email" && (
          <>
            <div className="flex justify-between items-start"><h2 className="font-display font-medium text-[22px] tracking-tight">Forgot password? 🔐</h2><button onClick={onClose} className="w-8 h-8 bg-[#FAF9F6] border border-stone-100 rounded-full font-semibold text-stone-500 flex items-center justify-center shrink-0">✕</button></div>
            <p className="text-[13px] text-stone-500 mt-1 font-light">Enter your email. We will show your security question.</p>
            <form onSubmit={handleForgotEmail} className="mt-4 space-y-3">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Email e.g. ada@gmail.com" className={inputCls} />
              {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">{err}</p>}
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Checking..." : "Show my question →"}</button>
            </form>
            <button onClick={resetAll} className="w-full text-center text-[12px] font-semibold text-[#1A1A2E] mt-3">← Back to login</button>
          </>
        )}

        {mode === "forgot-answer" && (
          <>
            <div className="flex justify-between items-start"><h2 className="font-display font-medium text-[22px] tracking-tight">Security question 🔐</h2><button onClick={onClose} className="w-8 h-8 bg-[#FAF9F6] border border-stone-100 rounded-full font-semibold text-stone-500 flex items-center justify-center shrink-0">✕</button></div>
            <p className="text-[13px] font-semibold text-[#1A1A2E] mt-3 bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3">{forgotQ}</p>
            <form onSubmit={handleForgotAnswer} className="mt-3 space-y-3">
              <input value={forgotA} onChange={e => setForgotA(e.target.value)} placeholder="Your answer" className={inputCls} />
              {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">{err}</p>}
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Checking..." : "Verify answer →"}</button>
            </form>
            <button onClick={resetAll} className="w-full text-center text-[12px] font-semibold text-[#1A1A2E] mt-3">← Back to login</button>
          </>
        )}

        {mode === "forgot-new" && (
          <>
            <div className="flex justify-between items-start"><h2 className="font-display font-medium text-[22px] tracking-tight">Set new password ✅</h2><button onClick={onClose} className="w-8 h-8 bg-[#FAF9F6] border border-stone-100 rounded-full font-semibold text-stone-500 flex items-center justify-center shrink-0">✕</button></div>
            <p className="text-[13px] text-stone-500 mt-1 font-light">Answer correct. Choose a new password.</p>
            <form onSubmit={handleForgotNew} className="mt-4 space-y-3">
              <input value={newPass} onChange={e => setNewPass(e.target.value)} type="password" required placeholder="New password (min 4 chars)" className={inputCls} />
              {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">{err}</p>}
              <button type="submit" disabled={loading} className={btnCls}>{loading ? "Saving..." : "Save new password & Login →"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

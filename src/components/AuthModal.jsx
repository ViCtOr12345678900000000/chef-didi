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
    if (data.user.prefs) {
      localStorage.setItem(`didi_prefs_${cleanEmail}`, JSON.stringify(data.user.prefs));
    }
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

function registerUserLocal(name, email, password) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  if (users.find(u => u.email === cleanEmail)) throw new Error("This email is already registered. Please login instead.");
  const newUser = { name: name.trim(), email: cleanEmail, password };
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
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await loginUserLocalOrCloud(email, password);
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 4) throw new Error("Password must be at least 4 characters.");
        const { session, newUser } = registerUserLocal(name, email, password);
        syncToUpstash(newUser, true);
        user = session;
      }
      onAuth(user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-full max-w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[24px] font-bold text-[#1A1A2E]">{isLogin ? "Welcome back 👋" : "Join Chef Didi 👩🏾‍🍳"}</h2>
            <p className="text-[13px] text-stone-400 mt-1">{isLogin ? "Login to save your Goal, Theme & Kcal" : "Create account to unlock Favourites, Shopping, Kcal & more"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full font-bold">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {!isLogin && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name e.g. Ada" className="w-full h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Email e.g. ada@gmail.com" className="w-full h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full h-12 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
          {err && <p className="text-[12px] text-red-600 font-semibold bg-red-50 rounded-xl p-3">{err}</p>}
          <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-[#4A2C8A] to-[#7B61FF] text-white rounded-full font-bold text-[14px] shadow disabled:opacity-60">
            {loading ? "Please wait..." : isLogin ? "Login →" : "Create Account →"}
          </button>
        </form>
        <button onClick={() => { setIsLogin(!isLogin); setErr(""); }} className="w-full text-center text-[12px] font-bold text-[#7B61FF] mt-4">
          {isLogin ? "No account? Create one →" : "Already have account? Login →"}
        </button>
        {!isLogin && <p className="text-[11px] text-center text-stone-400 mt-3">🔒 Register once, unlock Favourites, Shopping, Pantry, Weight, Water & Kcal History</p>}
      </div>
    </div>
  );
}

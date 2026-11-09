import { useState } from "react";

// Local auth - no import from didi.js, so no MISSING_EXPORT ever
function getUsers() {
  try { return JSON.parse(localStorage.getItem("didi_users") || "[]"); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem("didi_users", JSON.stringify(users));
}
function registerUserLocal(name, email, password) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  if (users.find(u => u.email === cleanEmail)) throw new Error("This email is already registered. Please login instead.");
  const newUser = { name: name.trim(), email: cleanEmail, password };
  users.push(newUser);
  saveUsers(users);
  const session = { name: newUser.name, email: newUser.email };
  localStorage.setItem("didi_session", JSON.stringify(session));
  return session;
}
function loginUserLocal(email, password) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email === cleanEmail);
  if (!found) throw new Error("No account with this email. Please register first.");
  if (found.password !== password) throw new Error("Wrong password. Try again.");
  const session = { name: found.name, email: found.email };
  localStorage.setItem("didi_session", JSON.stringify(session));
  return session;
}

export default function AuthModal({ onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      let user;
      if (isLogin) {
        user = loginUserLocal(email, password);
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 4) throw new Error("Password must be at least 4 characters.");
        user = registerUserLocal(name, email, password);
      }
      onAuth(user);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] p-6 w-full max-w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[24px] font-bold text-[#1A1A2E]">{isLogin ? "Welcome back 👋" : "Join Chef Didi 👩🏾‍🍳"}</h2>
            <p className="text-[13px] text-stone-400 mt-1">{isLogin ? "Login to save your Goal, Theme & Kcal" : "Create account to save your preferences"}</p>
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

          <button type="submit" className="w-full h-12 bg-gradient-to-r from-[#4A2C8A] to-[#7B61FF] text-white rounded-full font-bold text-[14px] shadow">
            {isLogin ? "Login →" : "Create Account →"}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setErr(""); }} className="w-full text-center text-[12px] font-bold text-[#7B61FF] mt-4">
          {isLogin ? "No account? Create one →" : "Already have account? Login →"}
        </button>
      </div>
    </div>
  );
}
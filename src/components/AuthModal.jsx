import { useState } from "react";
import { registerUser, loginUser } from "../lib/didi";

export default function AuthModal({ onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault(); setErr("");
    try {
      const user = isLogin ? loginUser(email.trim().toLowerCase(), password) : registerUser(name.trim(), email.trim().toLowerCase(), password);
      onAuth(user);
    } catch (e2) { setErr(e2.message); }
  };
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white w-full max-w-[380px] rounded-[24px] p-6 shadow-2xl">
        <h3 className="font-display text-[22px] text-[#1A1A2E]">{isLogin ? "Welcome back 👋" : "Join Chef Didi 🍲"}</h3>
        <p className="text-[12px] text-stone-400 mt-1">Saved on this device only. Your goal, theme & language will be remembered.</p>
        {!isLogin && <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full h-11 mt-4 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />}
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full h-11 mt-3 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
        <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full h-11 mt-3 px-4 bg-[#FBFAFF] border border-[#EDEAFF] rounded-full text-[14px] outline-none focus:border-[#7B61FF]" />
        {err && <p className="text-[12px] text-red-500 mt-2 font-semibold">{err}</p>}
        <button className="w-full h-11 mt-4 bg-gradient-to-r from-[#5A3EC8] to-[#7B61FF] text-white rounded-full font-semibold text-[14px] shadow-md">{isLogin ? "Login" : "Create Account"}</button>
        <button type="button" onClick={()=>setIsLogin(!isLogin)} className="w-full text-center text-[12px] text-[#7B61FF] font-semibold mt-3">{isLogin ? "No account? Register" : "Already have account? Login"}</button>
        <button type="button" onClick={onClose} className="w-full text-center text-[12px] text-stone-400 mt-1">Close</button>
      </form>
    </div>
  );
}
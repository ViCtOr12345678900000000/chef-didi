import { useState, useEffect } from 'react';
import { ChefHat } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';
import AuthModal from './components/AuthModal';
import { getSession, logoutUser, getPrefs, t } from './lib/didi';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [themeId, setThemeId] = useState('purple');
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const s = getSession();
    if (s) { setUser(s); const p = getPrefs(s.email); setThemeId(p.theme||'purple'); setLang(p.lang||'en'); }
  }, []);

  return (
    <div className="min-h-screen bg-white w-[100vw] py-8 relative">
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#F5F0FF] to-white pointer-events-none" />
      <div className="relative text-center mb-6 px-4">
        <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-white border border-[#EDEAFF] text-[#7B61FF] flex items-center justify-center shadow-sm"><ChefHat size={20}/></div>
        <h1 className="font-display text-[42px] font-semibold text-[#1A1A2E]">Chef <span className="italic font-light text-[#7B61FF]">Didi</span></h1>
        <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#5A3EC8] uppercase bg-white border border-[#EDEAFF] rounded-full px-4 py-1.5 mt-3 shadow-sm">✦ No waste • Use what you have</p>
        <p className="text-stone-500 text-[15px] mt-3 font-light">Enter what you have. Didi gives you ONE recipe.</p>
        {/* AUTH BUTTONS */}
        <div className="flex justify-center gap-2 mt-4">
          {user ? <>
            <span className="text-[12px] font-bold bg-[#F5F0FF] text-[#5A3EC8] px-4 py-2 rounded-full">👋 {t(lang,'welcome')}, {user.name} • {getPrefs(user.email).goal}</span>
            <button onClick={()=>{logoutUser(); setUser(null);}} className="text-[12px] font-bold bg-white border px-4 py-2 rounded-full">{t(lang,'logout')}</button>
          </> : <button onClick={()=>setShowAuth(true)} className="text-[12px] font-bold bg-gradient-to-r from-[#5A3EC8] to-[#7B61FF] text-white px-5 py-2.5 rounded-full shadow-md">{t(lang,'login')} / Register →</button>}
        </div>
      </div>
      <IngredientPicker user={user} themeId={themeId} setThemeId={setThemeId} lang={lang} setLang={setLang} />
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuth={(u)=>{ setUser({email:u.email, name:u.name}); setShowAuth(false); }} />}
      <p className="relative text-center text-[11px] text-stone-300 mt-10">Made with 💜 in Lagos • © 2026 Didi</p>
    </div>
  );
}
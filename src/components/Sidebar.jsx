import { useState } from 'react';
import { X, Home, ChefHat, Briefcase, Sparkles } from 'lucide-react';
import WorkWithUs from './WorkWithUs';
import AdSlot from './AdSlot';

export default function Sidebar({ theme, open, onClose, user }) {
  const [tab, setTab] = useState('home');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative w-[86vw] max-w-[360px] h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-[slideIn_0.25s_ease-out]">
        <div className={`bg-gradient-to-r ${theme.btn} px-5 pt-5 pb-6 text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X size={16} /></button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><ChefHat size={20} /></div>
            <div>
              <p className="font-display text-[22px] font-semibold leading-none">Chef Didi</p>
              <p className="text-[11px] text-white/80 mt-1 tracking-wide">NO WASTE • USE WHAT YOU HAVE</p>
            </div>
          </div>
          <div className="mt-4 bg-white/15 rounded-xl px-3 py-2.5 text-[12px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            {user ? `Signed in as ${user.name}` : 'Cook smarter. Waste less.'}
          </div>
        </div>

        <div className="flex px-4 pt-4 gap-2">
          <button onClick={() => setTab('home')} className={`flex-1 py-2.5 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition ${tab === 'home' ? `bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-stone-100 text-stone-600`}`}>
            <Home size={15} /> Menu
          </button>
          <button onClick={() => setTab('work')} className={`flex-1 py-2.5 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition ${tab === 'work' ? `bg-gradient-to-r ${theme.btn} text-white shadow-md` : `bg-stone-100 text-stone-600`}`}>
            <Briefcase size={15} /> Work With Us
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === 'home' ? (
            <div className="space-y-2">
              <button onClick={onClose} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-stone-50 transition text-left">
                <span className={`w-10 h-10 rounded-xl ${theme.softBg} ${theme.accent} flex items-center justify-center`}><Home size={18} /></span>
                <span><span className="block text-[14px] font-bold text-[#1A1A2E]">Home</span><span className="block text-[12px] text-stone-500">Find a recipe from your ingredients</span></span>
              </button>
              <button onClick={() => { setTab('work'); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-stone-50 transition text-left">
                <span className={`w-10 h-10 rounded-xl ${theme.softBg} ${theme.accent} flex items-center justify-center`}><Briefcase size={18} /></span>
                <span><span className="block text-[14px] font-bold text-[#1A1A2E]">Work With Us</span><span className="block text-[12px] text-stone-500">Partner with Chef Didi • Book a slot</span></span>
              </button>

              <div className={`mt-5 rounded-2xl border ${theme.softBorder} ${theme.softBg} p-4`}>
                <p className={`text-[13px] font-bold flex items-center gap-1.5 ${theme.accent}`}><Sparkles size={14} /> Why Chef Didi?</p>
                <p className="text-[12.5px] text-stone-600 leading-relaxed mt-2">Enter what you have. Didi gives you a recipe — no waste, no stress. Save favourites, track kcal, and cook in your language.</p>
              </div>

              {/* AD - In Sidebar Menu */}
              <AdSlot slot="2222222222" />
            </div>
          ) : (
            <WorkWithUs theme={theme} compact />
          )}
        </div>
        <div className="px-5 py-3 border-t border-stone-100 text-center text-[11px] text-stone-400">Made with 💜 • © 2026 Didi</div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}

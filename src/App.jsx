import { ChefHat } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';

export default function App() {
  return (
    <div className="min-h-screen bg-white w-[100vw] py-8">
      <div className=" ">

        {/* Soft purple glow at top - like screenshot but white base */}
        <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-[#EDEAFF] via-[#F5F0FF] to-white pointer-events-none" />

        <div className="relative text-center mb-6 px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#7B61FF] via-[#9B8CFF] to-[#C9B8FF] text-white flex items-center justify-center shadow-lg shadow-violet-300/50 text-2xl">
            <ChefHat size={20} />
          </div>
          <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1A1A2E]">
            Chef <span className="italic font-light bg-gradient-to-r from-[#7B61FF] to-[#B18CFF] bg-clip-text text-transparent">Didi</span>
          </h1>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#5A3EC8] uppercase bg-[#F5F0FF] border border-[#E6E0FF] rounded-full px-4 py-1.5 mt-3">
            ✦ No waste • Use what you have
          </p>
          <p className="text-stone-500 text-[15px] mt-3 font-light">
            Enter what you have. Didi gives you ONE recipe.
          </p>
        </div>

        <IngredientPicker />

        <p className="relative text-center text-[11px] text-stone-400 mt-10 pb-2">
          Made with 💜 in Lagos • © 2026 Didi • Cook what you have
        </p>

      </div>
    </div>
  );
}
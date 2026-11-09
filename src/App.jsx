import { ChefHat } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';

export default function App() {
  return (
    <div className="min-h-screen bg-white w-[100vw] py-8">
      <div className=" ">

        {/* Very faint purple wash at very top only - rest is pure white */}
        <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#F5F0FF] to-white pointer-events-none" />

        <div className="relative text-center mb-6 px-4">
          {/* Small purple accent only - icon */}
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-white border border-[#EDEAFF] text-[#7B61FF] flex items-center justify-center shadow-sm text-2xl">
            <ChefHat size={20} />
          </div>
          <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1A1A2E]">
            Chef <span className="italic font-light text-[#7B61FF]">Didi</span>
          </h1>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#5A3EC8] uppercase bg-white border border-[#EDEAFF] rounded-full px-4 py-1.5 mt-3 shadow-sm">
            ✦ No waste • Use what you have
          </p>
          <p className="text-stone-500 text-[15px] mt-3 font-light">
            Enter what you have. Didi gives you ONE recipe.
          </p>
        </div>

        <IngredientPicker />

        <p className="relative text-center text-[11px] text-stone-300 mt-10 pb-2">
          Made with 💜 in Lagos • © 2026 Didi • Cook what you have
        </p>

      </div>
    </div>
  );
}
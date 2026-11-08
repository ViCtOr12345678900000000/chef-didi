import { ChefHat } from 'lucide-react';
import IngredientPicker from './components/IngredientPicker';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] px-4 py-8">
      <div className="max-w-[560px] mx-auto">

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl  flex items-center justify-center shadow-lg shadow-emerald-900/20 text-2xl">
            <ChefHat size={20} />
          </div>
          <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-[#1C1917]">
            Chef <span className="italic font-light text-[#1B4332]">Didi</span>
          </h1>
          <p className="text-stone-500 text-[15px] mt-2 font-light">
            Enter what you have. Didi gives you ONE recipe.
          </p>
        </div>

        <IngredientPicker />

      </div>
    </div>
  );
}
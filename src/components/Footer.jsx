import { THEMES, t } from "../lib/didi";

const TIPS = [
  "Parboil rice for concoction rice — stops it getting soggy.",
  "Add salt at the end for Egusi — keeps it from breaking.",
  "For Alfredo: don't boil cream too hard — low heat keeps it silky.",
  "Toast your Egusi before adding water — deeper flavour.",
  "Let Jollof steam 5 mins after cooking — don't open the pot.",
];

const POPULAR = [
  "Chicken + Rice",
  "Yam + Eggs",
  "Beans + Plantain",
  "Pasta + Chicken",
  "Egusi + Chicken",
];

export default function Footer({ lang = "en", themeId = "purple", onPickPopular }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1 - How Didi Works */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-violet-900/10">
          <p className="text-[28px] mb-2">👩🏾‍🍳</p>
          <h3 className="font-display text-[20px] font-medium text-[#1A1A2E]">{t(lang, 'howWorks')}</h3>
          <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">
            1. Add ingredients. 2. Pick Goal + Sittings + Cuisine + Location. 3. Get recipe with calories per sitting.
          </p>
        </div>

        {/* 2 - Tip of the Day */}
        <div className={`rounded-[28px] p-6 shadow-xl text-white bg-gradient-to-br ${theme.btn}`}>
          <p className="text-[28px] mb-2">💡</p>
          <h3 className="font-display text-[20px] font-medium">{t(lang, 'tip')} of the Day</h3>
          <p className="text-[13px] text-white/85 mt-2 leading-relaxed">{tip}</p>
        </div>

        {/* 3 - Popular Right Now */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-violet-900/10">
          <p className="text-[28px] mb-2">🔥</p>
          <h3 className="font-display text-[20px] font-medium text-[#1A1A2E]">{t(lang, 'popular')} Right Now</h3>
          <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">{POPULAR.join(" • ")}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {POPULAR.map(p => (
              <button
                key={p}
                onClick={() => onPickPopular && onPickPopular(p)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F5F0FF] text-[#4A3B8C] border border-[#E6E0FF] hover:bg-[#7B61FF] hover:text-white transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

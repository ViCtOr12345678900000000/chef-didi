import { useState } from "react";

const TRANSLATIONS = {
  "ugu": { abroad: "Baby Spinach / Kale", note: "Add spinach in last 2 mins — it wilts faster than Ugu", time: "-3 mins" },
  "scotch bonnet": { abroad: "Habanero", note: "Same heat. Use 1 for 1.", time: "Same" },
  "crayfish": { abroad: "Dried Shrimp / Fish Powder", note: "Use half the amount — dried shrimp is saltier", time: "Same" },
  "palm oil": { abroad: "Vegetable Oil + 1 tsp Paprika", note: "Add paprika for colour. Taste is lighter, not as smoky.", time: "Same" },
  "yam": { abroad: "Potato / Sweet Potato / Cassava", note: "Potato cooks faster. Check at 12 mins not 20.", time: "-8 mins" },
  "egusi": { abroad: "Pumpkin Seeds (ground)", note: "Grind pumpkin seeds fine. Soup will be slightly lighter.", time: "Same" },
  "stockfish": { abroad: "Dried Cod / Salted Cod", note: "Soak overnight in UK/US — it's tougher than Nigerian stockfish", time: "+10 mins soak" },
  "ogbono": { abroad: "Ground Flaxseed + Okra", note: "Won't be as drawy. Add okra for the slimy texture.", time: "Same" },
  "garri": { abroad: "Fine Semolina / Couscous", note: "Use less water, stir faster — semolina clumps quicker", time: "-2 mins" },
  "maggi": { abroad: "Knorr Cube / Bouillon", note: "1 for 1. Knorr is slightly saltier — taste first.", time: "Same" },
  "plantain": { abroad: "Ripe Plantain (Caribbean store) / Sweet Potato", note: "Caribbean stores have it. If using sweet potato, fry 1 min less.", time: "-1 min" },
  "pepper soup spice": { abroad: "Allspice + Grains of Paradise", note: "Mix 1:1. Not exact, but closest abroad.", time: "Same" },
};

export default function DiasporaTranslator({ recipe }) {
  const [mode, setMode] = useState("nigeria"); // nigeria | abroad
  const [showAll, setShowAll] = useState(false);

  const ingredients = recipe?.ingredients || [];
  const parsed = ingredients.map((raw) => {
    if (typeof raw === "string") return { name: raw.split(" - ")[0]?.trim() || raw, detail: raw.split(" - ")[1] || "" };
    return { name: raw?.name || "", detail: raw?.qty || "" };
  });

  const findSwap = (name) => {
    const key = String(name).toLowerCase();
    return Object.keys(TRANSLATIONS).find((k) => key.includes(k));
  };

  const swappable = parsed.map((p) => ({ ...p, swapKey: findSwap(p.name) })).filter((p) => p.swapKey);
  const visible = showAll ? swappable : swappable.slice(0, 3);

  if (!swappable.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-xl mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-[14px]">🌍 Ingredient Translator</h3>
        <div className="flex bg-stone-100 rounded-full p-1">
          <button onClick={() => setMode("nigeria")} className={`h-7 px-3 rounded-full text-[11px] font-bold ${mode === "nigeria" ? "bg-black text-white" : "text-stone-500"}`}>🇳🇬 Nigerian</button>
          <button onClick={() => setMode("abroad")} className={`h-7 px-3 rounded-full text-[11px] font-bold ${mode === "abroad" ? "bg-black text-white" : "text-stone-500"}`}>✈️ Abroad</button>
        </div>
      </div>

      {mode === "nigeria" ? (
        <p className="text-[12px] text-stone-500">You're viewing the original Nigerian version. Switch to <b>Abroad</b> to see what to buy in UK / US / Canada.</p>
      ) : (
        <>
          <p className="text-[12px] text-stone-500 mb-3">In UK / US / Canada, buy these instead — same dish, different shop:</p>
          <div className="space-y-2">
            {visible.map((item, i) => {
              const t = TRANSLATIONS[item.swapKey];
              return (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                  <p className="text-[13px] font-bold">{item.name} → <span className="text-green-700">{t.abroad}</span> <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full border">{t.time}</span></p>
                  <p className="text-[11px] text-stone-500 mt-1">{t.note}</p>
                  <p className="text-[10px] text-stone-400 mt-1">Where to buy: Caribbean / African store, Tesco World Food aisle, Amazon</p>
                </div>
              );
            })}
          </div>
          {swappable.length > 3 && (
            <button onClick={() => setShowAll(!showAll)} className="text-[11px] font-bold text-stone-400 mt-2">{showAll ? "Show less" : `See all ${swappable.length} swaps`}</button>
          )}
        </>
      )}
    </div>
  );
}

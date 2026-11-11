import { useState } from "react";
import { getPantry, getHistory } from "../lib/didi";

export default function ZeroWasteMode({ user, onCookFromLeftovers }) {
  const [show, setShow] = useState(false);
  const pantry = getPantry(user);
  const history = getHistory(user);
  const [selected, setSelected] = useState([]);
  const [leftoverInput, setLeftoverInput] = useState("");

  // Smart suggestions from what you already have
  const suggestions = [
    { title: "Leftover Rice → Fried Rice", needs: ["Rice", "Eggs", "Onion"], desc: "Day-2 rice is BEST for fried rice — less sticky" },
    { title: "Leftover Stew → Stew Pasta", needs: ["Stew", "Pasta"], desc: "Mix yesterday's stew with pasta. Zero waste, new meal." },
    { title: "Old Plantain → Plantain Porridge", needs: ["Plantain", "Palm Oil", "Pepper"], desc: "Overripe plantain = sweetest porridge. Don't throw it." },
    { title: "Leftover Soup → Soup + Rice / Swallow", needs: ["Soup", "Rice"], desc: "Day-3 soup still good if refrigerated. Heat well." },
  ];

  const toggle = (item) => setSelected((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);

  const handleCook = () => {
    const all = [...selected, leftoverInput].filter(Boolean).join(", ");
    if (!all) return;
    onCookFromLeftovers?.(all);
    setShow(false);
  };

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-xl mt-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-[14px]">♻️ Zero-Waste — Cook From Leftovers</h3>
        <button onClick={() => setShow(!show)} className="text-[11px] font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">{show ? "Hide" : "Cook Leftovers"}</button>
      </div>
      <p className="text-[12px] text-stone-500 mt-1">Don't throw it. Didi turns yesterday's food into today's meal.</p>

      {!show ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {suggestions.slice(0, 2).map((s, i) => (
            <div key={i} className="border rounded-2xl p-3">
              <p className="text-[13px] font-bold">{s.title}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{s.desc}</p>
              <p className="text-[10px] text-green-600 font-bold mt-1">Needs: {s.needs.join(", ")}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">1. What leftovers do you have?</p>
          <div className="flex flex-wrap gap-1.5">
            {["Leftover Rice", "Leftover Stew", "Leftover Soup", "Old Plantain", "Boiled Yam", "Cooked Beans"].map((item) => (
              <button key={item} onClick={() => toggle(item)} className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${selected.includes(item) ? "bg-green-600 text-white border-green-600" : "bg-stone-50 border-stone-200"}`}>{selected.includes(item) ? "✓ " : "+ "}{item}</button>
            ))}
          </div>
          <input value={leftoverInput} onChange={(e) => setLeftoverInput(e.target.value)} placeholder="Or type e.g. Half pot of Jollof from yesterday" className="w-full h-11 px-4 bg-stone-50 border rounded-full text-[13px] outline-none mt-2" />

          <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase mt-4 mb-2">2. From your Pantry — already at home</p>
          <div className="flex flex-wrap gap-1.5">
            {pantry.map((p) => (
              <button key={p} onClick={() => toggle(p)} className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${selected.includes(p) ? "bg-green-600 text-white border-green-600" : "bg-green-50 border-green-200 text-green-700"}`}>{selected.includes(p) ? "✓ " : "+ "}{p}</button>
            ))}
          </div>

          <button onClick={handleCook} disabled={!selected.length && !leftoverInput.trim()} className="w-full mt-4 h-12 rounded-full bg-green-600 text-white font-bold text-[14px] disabled:opacity-40">
            ♻️ Make Me a Zero-Waste Meal — {selected.length} items
          </button>
          <p className="text-[11px] text-center text-stone-400 mt-2">No new shopping. Use what you already have.</p>
        </div>
      )}
    </div>
  );
}

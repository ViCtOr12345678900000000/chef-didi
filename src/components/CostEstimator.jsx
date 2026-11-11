import { useState } from "react";
import { getMarketPrices, saveMarketPrice } from "../lib/didi";

export default function CostEstimator({ ingredients = [], location = "nigeria", sittings = 3, user, onPricesUpdated }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [prices, setPrices] = useState(() => getMarketPrices());

  const findPrice = (ing) => {
    const lower = String(ing).toLowerCase();
    const key = Object.keys(prices).find(k => lower.includes(k));
    return key ? { name: key, price: prices[key] } : null;
  };

  let total = 0;
  let foundCount = 0;
  const rows = (ingredients || []).map(ing => {
    const p = findPrice(ing);
    if (p) { total += p.price; foundCount++; }
    return { ing, price: p?.price || null, key: p?.name || null };
  });

  const perServing = sittings ? Math.round(total / sittings) : total;

  const saveEdit = (key) => {
    const v = parseInt(editVal);
    if (!v) return;
    const next = saveMarketPrice(key, v);
    setPrices(next);
    setEditing(null);
    onPricesUpdated?.(next);
  };

  if (!ingredients?.length) return null;

  return (
    <div className="bg-[#FFF8E1] border border-amber-100 rounded-2xl p-3.5 mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold text-[13px]">💰 Cost Estimator • {location === "abroad" ? "Diaspora prices (est.)" : "Lagos Market (est.)"}</p>
        <span className="text-[11px] font-bold bg-white px-2 py-1 rounded-full">₦{total.toLocaleString()} total</span>
      </div>
      <p className="text-[12px] text-stone-600 mb-2">≈ <b>₦{perServing.toLocaleString()} / serving</b> • {foundCount}/{ingredients.length} ingredients priced • {location === "abroad" ? "Tap an item to set your local price" : "Tap an item if price changed in your market"}</p>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
            <span className="text-[12px]">• {r.ing}</span>
            {editing === r.key ? (
              <span className="flex gap-1 items-center">
                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} type="number" placeholder="₦" className="w-20 h-7 px-2 border rounded-full text-[12px] outline-none" />
                <button onClick={() => saveEdit(r.key)} className="h-7 px-3 bg-black text-white rounded-full text-[11px] font-bold">Save</button>
              </span>
            ) : (
              <button onClick={() => { if (r.key) { setEditing(r.key); setEditVal(String(r.price)); } }} className="text-[12px] font-bold">
                {r.price ? `₦${r.price.toLocaleString()} ✏️` : <span className="text-stone-400 font-normal">No price</span>}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 mt-2 text-center">Prices are community estimates. Your edits save to your account and sync to your DB.</p>
    </div>
  );
}

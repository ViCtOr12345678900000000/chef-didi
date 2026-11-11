import { useState, useEffect } from "react";
import { getMarketPrices, saveMarketPrice } from "../lib/didi";

export default function CostEstimator({ ingredients = [], location = "nigeria", sittings = 3, user }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [prices, setPrices] = useState(() => getMarketPrices());
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);

  // Map your location picker to market location
  // "nigeria" -> "lagos" (default), "abroad" -> "abroad"
  const marketLoc = location === "abroad" ? "abroad" : "lagos";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/market-prices?location=${marketLoc}`);
        const j = await r.json();
        if (j.prices && Object.keys(j.prices).length) {
          setPrices(prev => ({ ...prev, ...j.prices }));
          setCounts(j.counts || {});
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [marketLoc]);

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

  const saveEdit = async (key) => {
    const v = parseInt(editVal);
    if (!v) return;
    // 1. Save locally instantly (so UI updates)
    const next = saveMarketPrice(key, v);
    setPrices(next);
    setEditing(null);
    // 2. Report to community DB
    try {
      await fetch("/api/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: marketLoc, item: key, price: v, email: user?.email || "guest" })
      });
      // Reload averages after reporting
      const r = await fetch(`/api/market-prices?location=${marketLoc}`);
      const j = await r.json();
      if (j.prices) setPrices(prev => ({ ...prev, ...j.prices }));
      if (j.counts) setCounts(j.counts);
    } catch {}
  };

  if (!ingredients?.length) return null;

  return (
    <div className="bg-[#FFF8E1] border border-amber-100 rounded-2xl p-3.5 mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold text-[13px]">💰 Cost Estimator • {marketLoc === "abroad" ? "Diaspora (community)" : "Lagos Market (community)"}</p>
        <span className="text-[11px] font-bold bg-white px-2 py-1 rounded-full">₦{total.toLocaleString()} total</span>
      </div>
      <p className="text-[12px] text-stone-600 mb-2">
        ≈ <b>₦{perServing.toLocaleString()} / serving</b> • {foundCount}/{ingredients.length} priced
        {loading ? " • Loading community prices..." : Object.keys(counts).length ? " • Live community prices ✓" : " • Estimates — be first to report!"}
      </p>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
            <span className="text-[12px]">• {r.ing} {r.key && counts[r.key] ? <span className="text-[10px] text-green-600 font-bold">• {counts[r.key]} reports</span> : null}</span>
            {editing === r.key ? (
              <span className="flex gap-1 items-center">
                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} type="number" placeholder="₦" className="w-20 h-7 px-2 border rounded-full text-[12px] outline-none" />
                <button onClick={() => saveEdit(r.key)} className="h-7 px-3 bg-black text-white rounded-full text-[11px] font-bold">Report</button>
              </span>
            ) : (
              <button onClick={() => { if (r.key) { setEditing(r.key); setEditVal(String(r.price)); } }} className="text-[12px] font-bold">
                {r.price ? `₦${r.price.toLocaleString()} ✏️` : <span className="text-stone-400 font-normal">No price</span>}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 mt-2 text-center">Prices are from real Chef Didi users in your area. Tap a price to report what you paid — it helps everyone.</p>
    </div>
  );
}

import { useState, useEffect } from "react";
import { getMarketPrices, saveMarketPrice, marketLocationFor } from "../lib/didi";

export default function CostEstimator({ recipe, location = "nigeria", themeId = "purple", user }) {
  const [community, setCommunity] = useState({ prices: {}, counts: {} });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportItem, setReportItem] = useState("");
  const [reportPrice, setReportPrice] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const marketLoc = marketLocationFor(location);
  const local = getMarketPrices();

  const ingredients = recipe?.ingredients || [];
  // recipe.ingredients can be ["Rice - 2 cups"] or [{name, qty}] - handle both
  const parsed = ingredients.map((raw) => {
    if (typeof raw === "string") {
      const parts = raw.split(" - ");
      return { name: parts[0]?.trim() || raw, detail: parts[1] || "" };
    }
    return { name: raw?.name || raw?.ingredient || "", detail: raw?.qty || raw?.amount || "" };
  }).filter((i) => i.name);

  const priceFor = (name) => {
    const key = String(name).toLowerCase().trim();
    // 1. Community price first (real market)
    if (community.prices[key]) return { price: community.prices[key], source: "community", count: community.counts[key] || 0 };
    // 2. Local fallback
    if (local[key]) return { price: local[key], source: "estimate", count: 0 };
    // 3. Fuzzy match - e.g. "Palm Oil" vs "palm oil"
    const found = Object.keys(community.prices).find((k) => key.includes(k) || k.includes(key));
    if (found) return { price: community.prices[found], source: "community", count: community.counts[found] || 0 };
    const foundLocal = Object.keys(local).find((k) => key.includes(k) || k.includes(key));
    if (foundLocal) return { price: local[foundLocal], source: "estimate", count: 0 };
    return null;
  };

  const rows = parsed.map((ing) => ({ ...ing, ...priceFor(ing.name) }));
  const total = rows.reduce((sum, r) => sum + (r.price || 0), 0);
  const communityCount = rows.filter((r) => r.source === "community").length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/community?type=market-prices&location=${marketLoc}`);
        const j = await r.json();
        if (j.prices) setCommunity({ prices: j.prices, counts: j.counts || {} });
      } catch {}
      setLoading(false);
    };
    load();
  }, [marketLoc]);

  const handleReport = async () => {
    if (!reportItem.trim() || !reportPrice) {
      setReportMsg("Pick an ingredient + enter price");
      return;
    }
    const p = parseInt(reportPrice);
    if (!p || p < 10) {
      setReportMsg("Enter a real price e.g. 2500");
      return;
    }
    setReportSending(true);
    setReportMsg("");
    try {
      const res = await fetch("/api/community?type=market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: marketLoc,
          item: reportItem.trim(),
          price: p,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      // Save locally too so it shows instantly
      saveMarketPrice(reportItem.trim(), p);
      setCommunity((prev) => ({
        prices: { ...prev.prices, [reportItem.trim().toLowerCase()]: j.average || p },
        counts: { ...prev.counts, [reportItem.trim().toLowerCase()]: (prev.counts[reportItem.trim().toLowerCase()] || 0) + 1 },
      }));
      setReportMsg(`✅ Thanks! New average for ${reportItem}: ₦${(j.average || p).toLocaleString()}`);
      setReportPrice("");
      setTimeout(() => setShowReport(false), 2000);
    } catch (e) {
      setReportMsg("❌ " + e.message);
    } finally {
      setReportSending(false);
    }
  };

  if (!parsed.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-xl mt-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-[14px]">💰 Cost Estimator — {marketLoc === "lagos" ? "Lagos Market 🇳🇬" : "Abroad ✈️"}</h3>
        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {loading ? "Loading prices..." : communityCount > 0 ? `${communityCount}/${rows.length} real market prices` : "Estimated prices"}
        </span>
      </div>
      <p className="text-[11px] text-stone-400 mb-3">
        {communityCount > 0
          ? "Green = reported by real cooks in your area. Help keep it accurate — report a price below."
          : "No one has reported prices in your area yet. Be the first — report below!"}
      </p>

      <div className="space-y-1.5">
        {rows.map((r, idx) => (
          <div key={idx} className="flex justify-between items-center text-[12px] py-1 border-b last:border-0 border-stone-50">
            <span className="font-semibold">
              {r.name} <span className="font-normal text-stone-400">{r.detail}</span>
            </span>
            {r.price ? (
              <span className="flex items-center gap-1.5">
                <span className="font-bold">₦{r.price.toLocaleString()}</span>
                {r.source === "community" ? (
                  <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ {r.count} reports</span>
                ) : (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">ESTIMATE</span>
                )}
              </span>
            ) : (
              <span className="text-stone-400 text-[11px]">No price yet</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t">
        <span className="text-[13px] font-bold">Estimated Total</span>
        <span className="text-[16px] font-black">₦{total.toLocaleString()}</span>
      </div>

      {!showReport ? (
        <button
          onClick={() => {
            setShowReport(true);
            if (!reportItem && parsed[0]) setReportItem(parsed[0].name);
          }}
          className="w-full mt-3 h-10 bg-black text-white rounded-full text-[12px] font-bold"
        >
          📣 Report a Real Market Price — Help Others
        </button>
      ) : (
        <div className="mt-3 bg-stone-50 rounded-2xl p-3">
          <p className="text-[12px] font-bold mb-2">What did you pay in {marketLoc === "lagos" ? "Lagos" : "Abroad"}?</p>
          <select value={reportItem} onChange={(e) => setReportItem(e.target.value)} className="w-full h-10 px-3 bg-white border rounded-full text-[12px] outline-none mb-2">
            {parsed.map((r, i) => (
              <option key={i} value={r.name}>{r.name}</option>
            ))}
            <option value="">Other ingredient...</option>
          </select>
          {!parsed.find((r) => r.name === reportItem) && (
            <input value={reportItem} onChange={(e) => setReportItem(e.target.value)} placeholder="Type ingredient e.g. Rice" className="w-full h-10 px-3 bg-white border rounded-full text-[12px] outline-none mb-2" />
          )}
          <div className="flex gap-2">
            <input value={reportPrice} onChange={(e) => setReportPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Price e.g. 2500" inputMode="numeric" className="flex-1 h-10 px-3 bg-white border rounded-full text-[12px] outline-none" />
            <button onClick={handleReport} disabled={reportSending} className="h-10 px-4 bg-green-600 text-white rounded-full text-[12px] font-bold disabled:opacity-50">
              {reportSending ? "Sending..." : "Send"}
            </button>
          </div>
          {reportMsg && <p className="text-[11px] mt-2 font-semibold">{reportMsg}</p>}
          <button onClick={() => setShowReport(false)} className="text-[11px] text-stone-400 font-bold mt-2">Cancel</button>
        </div>
      )}
    </div>
  );
}

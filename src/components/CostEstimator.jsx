import { useState, useEffect } from "react";
import { marketLocationFor } from "../lib/didi";

// Realistic Nigerian retail unit prices (in ₦) per standard cooking unit
const UNIT_RATES_NGN = [
  // Tubers & Grains (per cup / standard unit)
  { keywords: ["puna yam", "yam"], unitPrice: 2500, defaultQty: 0.3, unitType: "tuber" }, // ~₦2,500 per medium tuber (300g ≈ 0.3 tuber = ₦750)
  { keywords: ["rice", "basmati", "ofada"], unitPrice: 400, defaultQty: 1, unitType: "cup" }, // ~₦400 per cup
  { keywords: ["beans", "oloyin", "honey beans"], unitPrice: 450, defaultQty: 1, unitType: "cup" }, // ~₦450 per cup
  { keywords: ["garri"], unitPrice: 250, defaultQty: 1, unitType: "cup" }, // ~₦250 per cup
  { keywords: ["semovita", "semo", "wheat", "poundo"], unitPrice: 350, defaultQty: 1, unitType: "cup" }, // ~₦350 per cup
  { keywords: ["plantain"], unitPrice: 400, defaultQty: 1, unitType: "finger" }, // ~₦400 per ripe finger
  { keywords: ["spaghetti", "pasta", "macaroni"], unitPrice: 1100, defaultQty: 1, unitType: "pack" }, // ~₦1,100 per 500g pack
  { keywords: ["indomie", "noodles"], unitPrice: 350, defaultQty: 1, unitType: "pack" }, // ~₦350 per small pack
  { keywords: ["bread"], unitPrice: 1200, defaultQty: 0.5, unitType: "loaf" },

  // Proteins
  { keywords: ["titus", "mackerel"], unitPrice: 1800, defaultQty: 1, unitType: "medium fish" },
  { keywords: ["smoked fish", "panla", "catfish"], unitPrice: 1500, defaultQty: 1, unitType: "piece" },
  { keywords: ["stockfish", "okporoko"], unitPrice: 1500, defaultQty: 1, unitType: "cut" },
  { keywords: ["chicken"], unitPrice: 1800, defaultQty: 1, unitType: "lap/cut" },
  { keywords: ["beef", "meat", "goat", "assorted", "shaki", "ponmo"], unitPrice: 1500, defaultQty: 1, unitType: "portion" },
  { keywords: ["egg"], unitPrice: 250, defaultQty: 1, unitType: "egg" }, // ~₦250 per single egg
  { keywords: ["crayfish"], unitPrice: 200, defaultQty: 1, unitType: "tbsp" }, // ~₦200 per tablespoon

  // Oils & Liquids
  { keywords: ["palm oil"], unitPrice: 150, defaultQty: 1, unitType: "tbsp" }, // ~₦150 per tbsp (~₦2,500/L)
  { keywords: ["vegetable oil", "groundnut oil", "oil"], unitPrice: 150, defaultQty: 1, unitType: "tbsp" },
  { keywords: ["coconut milk"], unitPrice: 1500, defaultQty: 1, unitType: "tin" },
  { keywords: ["tomato paste", "tin tomato"], unitPrice: 300, defaultQty: 1, unitType: "sachet" },

  // Vegetables & Peppers
  { keywords: ["tatashe", "bell pepper"], unitPrice: 300, defaultQty: 1, unitType: "medium" },
  { keywords: ["scotch bonnet", "rodo", "habanero", "pepper"], unitPrice: 100, defaultQty: 1, unitType: "piece" },
  { keywords: ["tomato"], unitPrice: 200, defaultQty: 1, unitType: "medium" },
  { keywords: ["onion"], unitPrice: 250, defaultQty: 1, unitType: "small/medium" },
  { keywords: ["ugwu", "spinach", "efo", "waterleaf", "bitterleaf", "scent leaf"], unitPrice: 400, defaultQty: 1, unitType: "handful/bunch" },
  { keywords: ["okra"], unitPrice: 300, defaultQty: 1, unitType: "portion" },
  { keywords: ["egusi", "melon"], unitPrice: 500, defaultQty: 1, unitType: "cup" },
  { keywords: ["ogbono"], unitPrice: 600, defaultQty: 0.5, unitType: "cup" },

  // Seasonings & Pantry
  { keywords: ["seasoning cube", "maggi", "knorr", "royco"], unitPrice: 50, defaultQty: 1, unitType: "cube" },
  { keywords: ["salt"], unitPrice: 50, defaultQty: 1, unitType: "pinch/tsp" },
  { keywords: ["garlic", "ginger"], unitPrice: 150, defaultQty: 1, unitType: "clove/thumb" },
  { keywords: ["thyme", "curry"], unitPrice: 100, defaultQty: 1, unitType: "tsp" },
  { keywords: ["water"], unitPrice: 0, defaultQty: 1, unitType: "ml" },
];

// Parses quantity from string like "2 cups of beans", "300g Puna yam", "2 tablespoons palm oil"
function estimateIngredientCost(rawText, isAbroad) {
  const clean = String(rawText).toLowerCase().trim();
  if (clean.includes("water")) return 0;

  // Find matching ingredient rule
  const rule = UNIT_RATES_NGN.find((r) => r.keywords.some((k) => clean.includes(k)));
  if (!rule) return isAbroad ? 2 : 500;

  // Extract leading number or fraction (e.g. "2", "0.5", "1/2", "300g")
  let multiplier = rule.defaultQty;
  const numMatch = clean.match(/^(\d+(?:\.\d+)?|\d+\/\d+)/);

  if (numMatch) {
    let val = numMatch[1];
    if (val.includes("/")) {
      const [a, b] = val.split("/").map(Number);
      val = b ? a / b : 1;
    } else {
      val = parseFloat(val);
    }

    // Handle gram/ml weights (e.g. "300g Puna yam" -> 0.3 of a 1kg tuber)
    if (/\d+\s*(g|gram|grams)\b/.test(clean)) {
      if (rule.unitType === "tuber" || rule.unitType === "portion" || rule.unitType === "lap/cut") {
        multiplier = Math.max(0.25, val / 1000);
      } else if (rule.unitType === "cup") {
        multiplier = Math.max(0.5, val / 200); // 1 cup ≈ 200g
      } else {
        multiplier = Math.max(0.5, val / 250);
      }
    } else if (/\d+\s*(kg)\b/.test(clean)) {
      multiplier = val * 4; // 1kg ≈ 4-5 cups or 1 whole tuber
    } else if (/\d+\s*(ml)\b/.test(clean)) {
      multiplier = Math.max(0.5, val / 250);
    } else {
      multiplier = val;
    }
  }

  // Round to nearest ₦50 for clean Nigerian pricing
  const rawNgn = rule.unitPrice * multiplier;
  const roundedNgn = Math.max(50, Math.round(rawNgn / 50) * 50);

  return isAbroad ? Math.max(1, Math.round(roundedNgn / 600)) : roundedNgn;
}

export default function CostEstimator({ recipe, location = "nigeria", user }) {
  const defaultLoc = marketLocationFor(location);
  const [selectedLoc, setSelectedLoc] = useState(defaultLoc); // "lagos" | "abroad"
  const [community, setCommunity] = useState({ prices: {}, counts: {} });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportItem, setReportItem] = useState("");
  const [customItem, setCustomItem] = useState("");
  const [reportPrice, setReportPrice] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const isAbroad = selectedLoc === "abroad";
  const currency = isAbroad ? "$" : "₦";

  const ingredients = recipe?.ingredients || [];
  const parsed = ingredients
    .map((raw) => {
      if (typeof raw === "string") {
        const parts = raw.split(" - ");
        return { name: parts[0]?.trim() || raw, detail: parts[1] || "" };
      }
      return { name: raw?.name || raw?.ingredient || "", detail: raw?.qty || raw?.amount || "" };
    })
    .filter((i) => i.name);

  const priceFor = (name, detail) => {
    const fullText = `${name} ${detail}`.trim();
    const key = String(name).toLowerCase().trim();

    if (community.prices[key] !== undefined) {
      return { price: Number(community.prices[key]), source: "community", count: community.counts[key] || 1 };
    }
    const found = Object.keys(community.prices).find((k) => key.includes(k) || k.includes(key));
    if (found) {
      return { price: Number(community.prices[found]), source: "community", count: community.counts[found] || 1 };
    }

    // Quantity-aware Nigerian market estimate
    const est = estimateIngredientCost(fullText, isAbroad);
    return { price: est, source: "estimate", count: 0 };
  };

  const rows = parsed.map((ing) => ({ ...ing, ...priceFor(ing.name, ing.detail) }));
  const total = rows.reduce((sum, r) => sum + (r.price || 0), 0);
  const communityCount = rows.filter((r) => r.source === "community").length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/community?type=market-prices&location=${encodeURIComponent(selectedLoc)}`);
        if (r.ok) {
          const j = await r.json();
          if (j.prices) setCommunity({ prices: j.prices, counts: j.counts || {} });
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [selectedLoc]);

  const handleReport = async () => {
    const finalItem = (reportItem === "__other__" ? customItem : reportItem).trim();
    if (!finalItem || !reportPrice) {
      setReportMsg("Pick an ingredient + enter price");
      return;
    }

    const p = parseInt(String(reportPrice).replace(/[^0-9]/g, ""), 10);
    if (!p || p < 1) {
      setReportMsg(`Enter a real price e.g. ${isAbroad ? "5" : "1500"}`);
      return;
    }

    setReportSending(true);
    setReportMsg("");
    try {
      const res = await fetch("/api/community?type=market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: selectedLoc,
          item: finalItem,
          price: p,
          email: user?.email || "guest",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save price");

      const newAvg = j.average || p;
      setCommunity((prev) => ({
        prices: { ...prev.prices, [finalItem.toLowerCase()]: newAvg },
        counts: { ...prev.counts, [finalItem.toLowerCase()]: (prev.counts[finalItem.toLowerCase()] || 0) + 1 },
      }));

      setReportMsg(`✅ Saved! New ${selectedLoc === "lagos" ? "Nigerian" : "Abroad"} average: ${currency}${newAvg.toLocaleString()}`);
      setReportPrice("");
      setCustomItem("");
      setTimeout(() => setShowReport(false), 1800);
    } catch (e) {
      setReportMsg("❌ " + (e.message || "Error saving price"));
    } finally {
      setReportSending(false);
    }
  };

  if (!parsed.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-xl mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-[14px]">
          💰 Cost Estimator — {selectedLoc === "lagos" ? "Nigerian Market 🇳🇬" : "Abroad Market ✈️"}
        </h3>

        <div className="flex bg-stone-100 p-0.5 rounded-full text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSelectedLoc("lagos")}
            className={`px-2.5 py-1 rounded-full transition ${
              selectedLoc === "lagos" ? "bg-green-600 text-white shadow-sm" : "text-stone-600"
            }`}
          >
            🇳🇬 Nigeria (₦)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLoc("abroad")}
            className={`px-2.5 py-1 rounded-full transition ${
              selectedLoc === "abroad" ? "bg-black text-white shadow-sm" : "text-stone-600"
            }`}
          >
            ✈️ Abroad ($)
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-stone-400">
          {communityCount > 0
            ? "Green = community reported. Amber = estimated per portion."
            : "Estimated per recipe portion. Tap below to report what you paid!"}
        </p>
        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
          {loading ? "Syncing..." : `${communityCount}/${rows.length} verified`}
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((r, idx) => (
          <div key={idx} className="flex justify-between items-center text-[12px] py-1.5 border-b last:border-0 border-stone-100">
            <span className="font-semibold pr-2">
              {r.name} <span className="font-normal text-stone-400">{r.detail}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold">
                {r.price === 0 ? "Free" : `${currency}${r.price.toLocaleString()}`}
              </span>
              {r.price > 0 && (
                r.source === "community" ? (
                  <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    ✓ {r.count} {r.count === 1 ? "report" : "reports"}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    EST
                  </span>
                )
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-200">
        <span className="text-[13px] font-bold">Estimated Total</span>
        <span className="text-[17px] font-black text-green-700">
          {currency}{total.toLocaleString()}
        </span>
      </div>

      {!showReport ? (
        <button
          type="button"
          onClick={() => {
            setShowReport(true);
            if (!reportItem && parsed[0]) setReportItem(parsed[0].name);
          }}
          className="w-full mt-3 h-10 bg-black text-white rounded-full text-[12px] font-bold active:scale-95 transition"
        >
          ✏️ Edit / Report Price in {selectedLoc === "lagos" ? "Nigeria" : "Your Location"}
        </button>
      ) : (
        <div className="mt-3 bg-stone-50 border border-stone-200 rounded-2xl p-3">
          <p className="text-[12px] font-bold mb-2">
            Update price in {selectedLoc === "lagos" ? "Nigeria (₦)" : "Abroad ($)"}:
          </p>
          <select
            value={reportItem}
            onChange={(e) => { setReportItem(e.target.value); setReportMsg(""); }}
            className="w-full h-10 px-3 bg-white border border-stone-200 rounded-full text-[12px] outline-none mb-2"
          >
            {parsed.map((r, i) => (
              <option key={i} value={r.name}>{r.name}</option>
            ))}
            <option value="__other__">Other ingredient...</option>
          </select>

          {reportItem === "__other__" && (
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="Type ingredient e.g. 1 cup of beans"
              className="w-full h-10 px-3 bg-white border border-stone-200 rounded-full text-[12px] outline-none mb-2"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={reportPrice}
              onChange={(e) => setReportPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={isAbroad ? "Price in $ e.g. 5" : "Price in ₦ e.g. 450"}
              className="flex-1 min-w-0 h-10 px-3 bg-white border border-stone-200 rounded-full text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={handleReport}
              disabled={reportSending}
              className="h-10 px-5 bg-green-600 text-white rounded-full text-[12px] font-bold disabled:opacity-50 shrink-0"
            >
              {reportSending ? "Saving..." : "Save"}
            </button>
          </div>
          {reportMsg && <p className="text-[11px] mt-2 font-semibold">{reportMsg}</p>}
          <button
            type="button"
            onClick={() => setShowReport(false)}
            className="text-[11px] text-stone-400 font-bold mt-2 block"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

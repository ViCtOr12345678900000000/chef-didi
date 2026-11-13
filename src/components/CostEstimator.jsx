import { useState, useEffect } from "react";
import { marketLocationFor } from "../lib/didi"; 

const UNIT_RATES_NGN = [
  { keywords: ["puna yam", "yam"], unitPrice: 2500, defaultQty: 0.3, unitType: "tuber" },
  { keywords: ["rice", "basmati", "ofada"], unitPrice: 400, defaultQty: 1, unitType: "cup" },
  { keywords: ["beans", "oloyin", "honey beans"], unitPrice: 450, defaultQty: 1, unitType: "cup" },
  { keywords: ["garri"], unitPrice: 250, defaultQty: 1, unitType: "cup" },
  { keywords: ["semovita", "semo", "wheat", "poundo"], unitPrice: 350, defaultQty: 1, unitType: "cup" },
  { keywords: ["plantain"], unitPrice: 400, defaultQty: 1, unitType: "finger" },
  { keywords: ["spaghetti", "pasta", "macaroni"], unitPrice: 1100, defaultQty: 1, unitType: "pack" },
  { keywords: ["indomie", "noodles"], unitPrice: 350, defaultQty: 1, unitType: "pack" },
  { keywords: ["bread"], unitPrice: 1200, defaultQty: 0.5, unitType: "loaf" },
  { keywords: ["titus", "mackerel"], unitPrice: 1800, defaultQty: 1, unitType: "medium fish" },
  { keywords: ["smoked fish", "panla", "catfish"], unitPrice: 1500, defaultQty: 1, unitType: "piece" },
  { keywords: ["stockfish", "okporoko"], unitPrice: 1500, defaultQty: 1, unitType: "cut" },
  { keywords: ["chicken"], unitPrice: 1800, defaultQty: 1, unitType: "lap/cut" },
  { keywords: ["beef", "meat", "goat", "assorted", "shaki", "ponmo"], unitPrice: 1500, defaultQty: 1, unitType: "portion" },
  { keywords: ["egg"], unitPrice: 250, defaultQty: 1, unitType: "egg" },
  { keywords: ["crayfish"], unitPrice: 200, defaultQty: 1, unitType: "tbsp" },
  { keywords: ["palm oil"], unitPrice: 150, defaultQty: 1, unitType: "tbsp" },
  { keywords: ["vegetable oil", "groundnut oil", "oil"], unitPrice: 150, defaultQty: 1, unitType: "tbsp" },
  { keywords: ["coconut milk"], unitPrice: 1500, defaultQty: 1, unitType: "tin" },
  { keywords: ["tomato paste", "tin tomato"], unitPrice: 300, defaultQty: 1, unitType: "sachet" },
  { keywords: ["tatashe", "bell pepper"], unitPrice: 300, defaultQty: 1, unitType: "medium" },
  { keywords: ["scotch bonnet", "rodo", "habanero", "pepper"], unitPrice: 100, defaultQty: 1, unitType: "piece" },
  { keywords: ["tomato"], unitPrice: 200, defaultQty: 1, unitType: "medium" },
  { keywords: ["onion"], unitPrice: 250, defaultQty: 1, unitType: "small/medium" },
  { keywords: ["ugwu", "spinach", "efo", "waterleaf", "bitterleaf", "scent leaf"], unitPrice: 400, defaultQty: 1, unitType: "handful/bunch" },
  { keywords: ["okra"], unitPrice: 300, defaultQty: 1, unitType: "portion" },
  { keywords: ["egusi", "melon"], unitPrice: 500, defaultQty: 1, unitType: "cup" },
  { keywords: ["ogbono"], unitPrice: 600, defaultQty: 0.5, unitType: "cup" },
  { keywords: ["seasoning cube", "maggi", "knorr", "royco"], unitPrice: 50, defaultQty: 1, unitType: "cube" },
  { keywords: ["salt"], unitPrice: 50, defaultQty: 1, unitType: "pinch/tsp" },
  { keywords: ["garlic", "ginger"], unitPrice: 150, defaultQty: 1, unitType: "clove/thumb" },
  { keywords: ["thyme", "curry"], unitPrice: 100, defaultQty: 1, unitType: "tsp" },
  { keywords: ["water"], unitPrice: 0, defaultQty: 1, unitType: "ml" },
];

function parseSmartPrice(input) {
  if (!input) return 0;
  let str = String(input).toLowerCase().replace(/[₦$,]/g, "").replace(/\b(naira|dollars?|bucks?|only)\b/g, "").trim();
  if (!str) return 0;
  const suffixMatch = str.match(/^(\d+(?:\.\d+)?)\s*(k|thousand|m|million)$/);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1]);
    const mult = suffixMatch[2].startsWith("m") ? 1_000_000 : 1_000;
    return Math.round(num * mult);
  }
  if (/^\d+(?:\.\d+)?$/.test(str)) return Math.round(parseFloat(str));
  const SMALL = { zero: 0, one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const SCALE = { hundred: 100, thousand: 1000, k: 1000, million: 1000000 };
  const words = str.replace(/[-]/g, " ").split(/\s+/).filter((w) => w && w !== "and");
  let total = 0; let current = 0; let matchedAny = false;
  for (const w of words) {
    if (/^\d+(?:\.\d+)?$/.test(w)) { current += parseFloat(w); matchedAny = true; }
    else if (SMALL[w] !== undefined) { current += SMALL[w]; matchedAny = true; }
    else if (w === "hundred") { current = (current || 1) * 100; matchedAny = true; }
    else if (SCALE[w] !== undefined) { total += (current || 1) * SCALE[w]; current = 0; matchedAny = true; }
  }
  return matchedAny ? Math.round(total + current) : 0;
}

function estimateIngredientCost(rawText, isAbroad) {
  const clean = String(rawText).toLowerCase().trim();
  if (clean.includes("water")) return 0;
  const rule = UNIT_RATES_NGN.find((r) => r.keywords.some((k) => clean.includes(k)));
  if (!rule) return isAbroad ? 2 : 500;
  let multiplier = rule.defaultQty;
  const numMatch = clean.match(/^(\d+(?:\.\d+)?|\d+\/\d+)/);
  if (numMatch) {
    let val = numMatch[1];
    if (val.includes("/")) { const [a, b] = val.split("/").map(Number); val = b ? a / b : 1; } else { val = parseFloat(val); }
    if (/\d+\s*(g|gram|grams)\b/.test(clean)) {
      if (rule.unitType === "tuber" || rule.unitType === "portion" || rule.unitType === "lap/cut") multiplier = Math.max(0.25, val / 1000);
      else if (rule.unitType === "cup") multiplier = Math.max(0.5, val / 200);
      else multiplier = Math.max(0.5, val / 250);
    } else if (/\d+\s*(kg)\b/.test(clean)) multiplier = val * 4;
    else if (/\d+\s*(ml)\b/.test(clean)) multiplier = Math.max(0.5, val / 250);
    else multiplier = val;
  }
  const rawNgn = rule.unitPrice * multiplier;
  const roundedNgn = Math.max(50, Math.round(rawNgn / 50) * 50);
  return isAbroad ? Math.max(1, Math.round(roundedNgn / 600)) : roundedNgn;
}

export default function CostEstimator({ recipe, location = "nigeria", user }) {
  const defaultLoc = marketLocationFor(location);
  const [selectedLoc, setSelectedLoc] = useState(defaultLoc);
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
  const parsed = ingredients.map((raw) => {
    if (typeof raw === "string") {
      const parts = raw.split(" - ");
      return { name: parts[0]?.trim() || raw, detail: parts[1] || "" };
    }
    return { name: raw?.name || raw?.ingredient || "", detail: raw?.qty || raw?.amount || "" };
  }).filter((i) => i.name);

  const priceFor = (name, detail) => {
    const fullText = `${name} ${detail}`.trim();
    const key = String(name).toLowerCase().trim();
    if (community.prices[key] !== undefined) return { price: Number(community.prices[key]), source: "community", count: community.counts[key] || 1 };
    const found = Object.keys(community.prices).find((k) => key.includes(k) || k.includes(key));
    if (found) return { price: Number(community.prices[found]), source: "community", count: community.counts[found] || 1 };
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
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          if (r.ok && j.prices) setCommunity({ prices: j.prices, counts: j.counts || {} });
        } catch { /* ignore non-JSON from Vercel */ }
      } catch {}
      setLoading(false);
    };
    load();
  }, [selectedLoc]);

  const parsedPreview = parseSmartPrice(reportPrice);

  const handleReport = async (e) => {
    if (e) e.preventDefault();
    const finalItem = (reportItem === "__other__" ? customItem : reportItem).trim();
    if (!finalItem || !reportPrice.trim()) { setReportMsg("Pick an ingredient + enter price"); return; }
    const p = parseSmartPrice(reportPrice);
    if (!p || p < 1) { setReportMsg(`Enter a valid amount e.g. ${isAbroad ? "5 or five" : "500, 5k, or five thousand"}`); return; }
    setReportSending(true); setReportMsg("");
    try {
      const res = await fetch("/api/community?type=market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: selectedLoc, item: finalItem, price: p, email: user?.email || "guest" }),
      });
      const text = await res.text();
      let j;
      try { j = JSON.parse(text); } catch { throw new Error("Server returned non-JSON: " + text.slice(0, 100)); }
      if (!res.ok) throw new Error(j.error || "Could not save price");
      const newAvg = j.average || p;
      setCommunity((prev) => ({
        prices: { ...prev.prices, [finalItem.toLowerCase()]: newAvg },
        counts: { ...prev.counts, [finalItem.toLowerCase()]: (prev.counts[finalItem.toLowerCase()] || 0) + 1 },
      }));
      setReportMsg(`✅ Saved ${currency}${p.toLocaleString()}! New average: ${currency}${newAvg.toLocaleString()}`);
      setReportPrice(""); setCustomItem("");
      setTimeout(() => setShowReport(false), 1800);
    } catch (e) {
      setReportMsg("❌ " + (e.message || "Error saving price"));
    } finally { setReportSending(false); }
  };

  if (!parsed.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="font-display font-medium text-[15px] tracking-tight">💰 Cost Estimator — {selectedLoc === "lagos" ? "Nigerian Market 🇳🇬" : "Abroad Market ✈️"}</h3>
        <div className="flex bg-[#FAF9F6] border border-stone-200 p-1 rounded-full text-[11px] font-semibold">
          <button type="button" onClick={() => setSelectedLoc("lagos")} className={`px-3 py-1.5 rounded-full transition ${selectedLoc === "lagos" ? "bg-[#1A1A2E] text-white shadow-sm" : "text-stone-500"}`}>🇳🇬 Nigeria (₦)</button>
          <button type="button" onClick={() => setSelectedLoc("abroad")} className={`px-3 py-1.5 rounded-full transition ${selectedLoc === "abroad" ? "bg-[#1A1A2E] text-white shadow-sm" : "text-stone-500"}`}>✈️ Abroad ($)</button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-stone-400 font-light">{communityCount > 0 ? "Green = community reported. Amber = estimated." : "Estimated per portion. Tap below to update!"}</p>
        <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full shrink-0">{loading ? "Syncing..." : `${communityCount}/${rows.length} verified`}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, idx) => (
          <div key={idx} className="flex justify-between items-center text-[12px] py-2 border-b last:border-0 border-stone-100">
            <span className="font-medium pr-2">{r.name} <span className="font-light text-stone-400">{r.detail}</span></span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold">{r.price === 0 ? "Free" : `${currency}${r.price.toLocaleString()}`}</span>
              {r.price > 0 && (r.source === "community" ? (<span className="text-[9px] font-semibold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">✓ {r.count} reports</span>) : (<span className="text-[9px] font-semibold bg-[#FFFBF0] text-amber-700 border border-[#F0E2A8] px-1.5 py-0.5 rounded-full whitespace-nowrap">EST</span>))}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-200">
        <span className="text-[13px] font-semibold">Estimated Total</span>
        <span className="text-[17px] font-display font-medium text-[#1A1A2E]">{currency}{total.toLocaleString()}</span>
      </div>
      {!showReport ? (
        <button type="button" onClick={() => { setShowReport(true); if (!reportItem && parsed[0]) setReportItem(parsed[0].name); }} className="w-full mt-3 h-10 bg-[#1A1A2E] hover:bg-black text-white rounded-full text-[12px] font-semibold active:scale-[0.98] transition">✏️ Edit / Report Price in {selectedLoc === "lagos" ? "Nigeria" : "Your Location"}</button>
      ) : (
        <div className="mt-3 bg-[#FAF9F6] border border-stone-100 rounded-2xl p-3" onSubmit={(e) => e.preventDefault()}>
          <p className="text-[12px] font-semibold mb-2">Update price in {selectedLoc === "lagos" ? "Nigeria (₦)" : "Abroad ($)"}:</p>
          <select value={reportItem} onChange={(e) => { setReportItem(e.target.value); setReportMsg(""); }} className="w-full h-10 px-3 bg-white border border-stone-200 rounded-2xl text-[12px] outline-none mb-2 focus:border-[#1A1A2E]">
            {parsed.map((r, i) => (<option key={i} value={r.name}>{r.name}</option>))}
            <option value="__other__">Other ingredient...</option>
          </select>
          {reportItem === "__other__" && (
            <input type="text" value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="Type ingredient e.g. Beans" className="w-full h-10 px-3 bg-white border border-stone-200 rounded-2xl text-[12px] outline-none mb-2 focus:border-[#1A1A2E]" />
          )}
          <div className="flex gap-2">
            <input type="text" autoComplete="off" autoCorrect="off" spellCheck="false" value={reportPrice} onChange={(e) => setReportPrice(e.target.value)} placeholder={isAbroad ? "e.g. 5 or five" : "e.g. 5000, 5k, or five thousand"} className="flex-1 min-w-0 h-10 px-3 bg-white border border-stone-200 rounded-2xl text-[12px] outline-none focus:border-[#1A1A2E]" />
            <button type="button" onClick={handleReport} disabled={reportSending} className="h-10 px-5 bg-[#1A1A2E] text-white rounded-full text-[12px] font-semibold disabled:opacity-50 shrink-0">{reportSending ? "Saving..." : "Save"}</button>
          </div>
          {reportPrice.trim() && parsedPreview > 0 && (<p className="text-[11px] text-green-700 font-semibold mt-1.5 pl-2">Detected amount: {currency}{parsedPreview.toLocaleString()}</p>)}
          {reportMsg && <p className="text-[11px] mt-2 font-semibold">{reportMsg}</p>}
          <button type="button" onClick={() => setShowReport(false)} className="text-[11px] text-stone-400 font-semibold mt-2 block hover:text-[#1A1A2E]">Cancel</button>
        </div>
      )}
    </div>
  );
}

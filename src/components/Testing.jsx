import { useState } from 'react'; 

const FALLBACK_PRICES = {
  updated: "10 Nov 2026",
  source: "Mile 12 via Ola of North + Lagos Ministry",
  market: "Mile 12",
  items: [
    { id: "tomato", name: "Tomato", unit: "1kg", price: 1650, emoji: "🍅" },
    { id: "rodo", name: "Rodo Pepper", unit: "1kg", price: 1794, emoji: "🌶️" },
    { id: "tatashe", name: "Tatashe", unit: "1kg", price: 2130, emoji: "🫑" },
    { id: "shombo", name: "Shombo", unit: "1kg", price: 2000, emoji: "🌶️" },
    { id: "onion", name: "Onion", unit: "1kg", price: 1728, emoji: "🧅" },
    { id: "rice_foreign", name: "Foreign Rice", unit: "1 derica", price: 1100, emoji: "🍚" },
    { id: "rice_local", name: "Local Rice", unit: "1 derica", price: 1000, emoji: "🍚" },
    { id: "garri_ijebu", name: "Garri Ijebu", unit: "1 paint", price: 1200, emoji: "🥣" },
    { id: "yam", name: "Yam (medium)", unit: "1 tuber", price: 2350, emoji: "🍠" },
    { id: "crayfish", name: "Crayfish", unit: "small plate", price: 500, emoji: "🦐" },
    { id: "seasoning", name: "Seasoning (2 cubes)", unit: "pack", price: 200, emoji: "🧂" },
    { id: "palm_oil", name: "Palm Oil", unit: "1 bottle 75cl", price: 2800, emoji: "🫙" },
  ],
  notes: "Onion is expensive this week",
  confidence: "high"
};

export default function Testing() {
  const [prices, setPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('didi_live_prices');
      return saved ? JSON.parse(saved) : FALLBACK_PRICES;
    } catch { return FALLBACK_PRICES; }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [budget, setBudget] = useState(5000);

  // ✅ Uses api/debug.js - stays at 12 files
  const getCurrentPrice = async () => {
    setLoading(true);
    setStatus('🔍 Gemini is checking FoodPrices.ng + Mile 12...');
    try {
      const res = await fetch('/api/debug?action=prices-refresh', { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      const data = json.data;
      setPrices(data);
      localStorage.setItem('didi_live_prices', JSON.stringify(data));
      setStatus(`✅ Updated! ${data.updated} • Source: ${data.source} • Confidence: ${data.confidence}`);
    } catch (e) {
      setStatus(`❌ Could not fetch: ${e.message}. Showing last saved prices.`);
    }
    setLoading(false);
  };

  const getItemPrice = (id) => prices.items.find(i => i.id === id)?.price || 0;

  const baskets = [
    {
      name: "Jollof Rice",
      items: [
        { label: "Rice (2 derica)", cost: getItemPrice('rice_foreign') * 2 },
        { label: "Tomato (1kg)", cost: getItemPrice('tomato') },
        { label: "Rodo (0.5kg)", cost: Math.round(getItemPrice('rodo') * 0.5) },
        { label: "Onion (0.25kg)", cost: Math.round(getItemPrice('onion') * 0.25) },
      ]
    },
    {
      name: "Concoction Rice",
      items: [
        { label: "Rice (2 derica)", cost: getItemPrice('rice_foreign') * 2 },
        { label: "Palm Oil (small)", cost: 800 },
        { label: "Pepper mix (0.5kg)", cost: Math.round(getItemPrice('rodo') * 0.5) },
        { label: "Onion (0.25kg)", cost: Math.round(getItemPrice('onion') * 0.25) },
        { label: "Crayfish", cost: getItemPrice('crayfish') },
        { label: "Seasoning", cost: getItemPrice('seasoning') },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-24">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-2xl font-bold">🧪 Didi Lab - #testing</h1>
        <p className="text-stone-500 text-sm">Only you see this. Test here before it goes live.</p>

        <div className="bg-white border rounded-2xl p-4 mt-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg">💰 Live ₦5k Prices - {prices.market}</p>
              <p className="text-xs text-stone-500">Last updated: {prices.updated}</p>
              <p className="text-xs text-stone-500">Source: {prices.source}</p>
            </div>
            <span className="text-[11px] bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">● LIVE</span>
          </div>

          <button
            onClick={getCurrentPrice}
            disabled={loading}
            className="w-full mt-3 bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? '⏳ Getting Current Prices...' : '🔄 Get Current Price'}
          </button>
          {status && <p className="text-xs mt-2 bg-stone-50 p-2 rounded-lg">{status}</p>}
          {prices.notes && <p className="text-xs mt-2 bg-yellow-50 text-yellow-800 p-2 rounded-lg">💡 {prices.notes}</p>}

          <div className="mt-4 space-y-2">
            {prices.items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg text-sm">
                <span>{item.emoji} {item.name} <span className="text-stone-400 text-xs">({item.unit})</span></span>
                <b>{item.price ? `₦${item.price.toLocaleString()}` : '— No data'}</b>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <p className="font-bold">What can ₦{budget.toLocaleString()} cook today?</p>
            <input type="range" min={3000} max={10000} step={500} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full mt-2" />
            <p className="text-xs text-stone-500">Budget: ₦{budget.toLocaleString()} — drag to change</p>

            {baskets.map(b => {
              const total = b.items.reduce((s, x) => s + x.cost, 0);
              const fits = total <= budget;
              return (
                <div key={b.name} className={`border rounded-xl p-3 mt-3 ${fits ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="font-bold text-sm">{b.name}</p>
                  {b.items.map(x => <p key={x.label} className="text-xs flex justify-between"><span>{x.label}</span><span>₦{x.cost.toLocaleString()}</span></p>)}
                  <p className="text-sm font-bold mt-1">Total: ₦{total.toLocaleString()} {fits ? '✅ Fits' : `❌ Over by ₦${(total - budget).toLocaleString()}`}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => { window.location.hash = ''; window.location.reload(); }} className="w-full mt-4 bg-stone-900 text-white font-bold py-3 rounded-xl text-sm">← Back to Main Site</button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function Testing() {
  const [prices, setPrices] = useState(null);
  const [visitors, setVisitors] = useState('...');
  const [budget, setBudget] = useState(5000);
  const [market, setMarket] = useState('Mile 12');
  const [testVendor, setTestVendor] = useState({ name: '', area: '', whatsapp: '', dish: '', price: '' });

  // Live visitor count - same API as admin
  useEffect(() => {
    fetch('/api/my-number').then(r => r.json()).then(d => {
      setVisitors(d.listLength || d.total || '—');
    }).catch(() => setVisitors('—'));
  }, []);

  // Fake prices for now - we will move these to Upstash this weekend
  const MOCK_PRICES = {
    'Mile 12': { Rice: 2800, Tomato: 1500, Pepper: 800, Chicken: 4500, Onion: 600, Beans: 2200 },
    'Oyingbo': { Rice: 3000, Tomato: 1800, Pepper: 900, Chicken: 4700, Onion: 700, Beans: 2400 },
    'Lekki': { Rice: 3500, Tomato: 2200, Pepper: 1200, Chicken: 5500, Onion: 900, Beans: 2800 },
  };

  const currentPrices = MOCK_PRICES[market];
  const basket = [];
  let remaining = budget;
  for (const [item, price] of Object.entries(currentPrices)) {
    if (remaining >= price) { basket.push({ item, price }); remaining -= price; }
  }

  const waLink = testVendor.whatsapp
    ? `https://wa.me/234${testVendor.whatsapp.replace(/^0/, '')}?text=${encodeURIComponent(`TEST ORDER from Chef Didi: 1x ${testVendor.dish} - ₦${testVendor.price} | Name: Test User | Address: Test Address`)}`
    : '#';

  return (
    <div className="min-h-screen bg-[#111] text-white p-4 pb-20 max-w-[600px] mx-auto">
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-2xl font-bold">🧪 Didi Testing Lab</h1>
        <span className="text-[11px] bg-yellow-400 text-black px-2 py-1 rounded-full font-bold">PRIVATE — #testing</span>
      </div>
      <p className="text-stone-400 text-sm mt-1">Only us. Users can't see this. Test here, then push to live.</p>
      <p className="text-sm mt-3 bg-white/10 rounded-lg p-3">👥 Live visitors: <b>{visitors}</b> • Market: <b>{market}</b></p>

      {/* --- IDEA 2: BUDGET COOK TEST --- */}
      <div className="bg-white text-black rounded-2xl p-4 mt-4">
        <h2 className="font-bold text-lg">💰 Idea 2 — Cook With ₦{budget.toLocaleString()}</h2>
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.keys(MOCK_PRICES).map(m => (
            <button key={m} onClick={() => setMarket(m)} className={`px-3 py-2 rounded-full text-sm font-bold ${market === m ? 'bg-black text-white' : 'bg-stone-100'}`}>{m}</button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[3000, 5000, 10000, 20000].map(b => (
            <button key={b} onClick={() => setBudget(b)} className={`px-3 py-2 rounded-full text-sm font-bold ${budget === b ? 'bg-green-600 text-white' : 'bg-stone-100'}`}>₦{b.toLocaleString()}</button>
          ))}
        </div>

        <p className="text-sm mt-4 font-bold">Your basket in {market} for ₦{budget.toLocaleString()}:</p>
        <div className="mt-2 space-y-1">
          {basket.map(b => <div key={b.item} className="flex justify-between bg-stone-50 p-2 rounded-lg text-sm"><span>{b.item}</span><b>₦{b.price.toLocaleString()}</b></div>)}
        </div>
        <p className="text-sm mt-2 text-green-700 font-bold">Remaining: ₦{remaining.toLocaleString()}</p>
        <p className="text-xs text-stone-500 mt-2">Next step: Turn this basket into recipes automatically.</p>
      </div>

      {/* --- IDEA 3: SELL WITH DIDI TEST --- */}
      <div className="bg-white text-black rounded-2xl p-4 mt-4">
        <h2 className="font-bold text-lg">🛵 Idea 3 — Sell With Didi Test</h2>
        <p className="text-xs text-stone-500">Fill this, then tap Test Order — it should open WhatsApp with a formatted order.</p>
        <input placeholder="Vendor name e.g Mama T" value={testVendor.name} onChange={e => setTestVendor({...testVendor, name: e.target.value})} className="w-full border rounded-lg p-2 mt-3 text-sm" />
        <input placeholder="Area e.g Surulere" value={testVendor.area} onChange={e => setTestVendor({...testVendor, area: e.target.value})} className="w-full border rounded-lg p-2 mt-2 text-sm" />
        <input placeholder="WhatsApp e.g 0803..." value={testVendor.whatsapp} onChange={e => setTestVendor({...testVendor, whatsapp: e.target.value})} className="w-full border rounded-lg p-2 mt-2 text-sm" />
        <div className="flex gap-2 mt-2">
          <input placeholder="Dish e.g Jollof" value={testVendor.dish} onChange={e => setTestVendor({...testVendor, dish: e.target.value})} className="flex-1 border rounded-lg p-2 text-sm" />
          <input placeholder="Price e.g 3500" value={testVendor.price} onChange={e => setTestVendor({...testVendor, price: e.target.value})} className="w-28 border rounded-lg p-2 text-sm" />
        </div>
        <a href={waLink} target="_blank" className="block text-center bg-green-600 text-white font-bold py-3 rounded-xl mt-3 text-sm">Test Order on WhatsApp →</a>
      </div>

      {/* --- RESTRUCTURE PREVIEW --- */}
      <div className="bg-white text-black rounded-2xl p-4 mt-4">
        <h2 className="font-bold text-lg">🧭 Restructure Preview</h2>
        <p className="text-sm text-stone-600 mt-1">This is what the new home will look like — 3 cards only:</p>
        <div className="space-y-2 mt-3">
          <div className="bg-purple-100 p-3 rounded-xl font-bold">🍲 Cook With What I Have</div>
          <div className="bg-green-100 p-3 rounded-xl font-bold">💰 Cook With ₦{budget.toLocaleString()} — {market}</div>
          <div className="bg-orange-100 p-3 rounded-xl font-bold">🛵 Order Food Near Me</div>
        </div>
        <p className="text-xs text-stone-500 mt-2">All the other stuff — Kcal, Leftover, 3-Day Plan, Favourites — moves to tabs: Kitchen / Track / Plan. Not deleted, just hidden from home.</p>
      </div>

      <a href="/" className="block text-center text-stone-400 text-sm mt-6">← Back to live site</a>
    </div>
  );
}

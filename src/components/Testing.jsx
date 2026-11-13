import { useState, useEffect } from 'react';



const DEFAULT_PRICES = [
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
];

export default function Testing() {
  const [items, setItems] = useState(DEFAULT_PRICES);
  const [updated, setUpdated] = useState("10 Nov 2026");
  const [source, setSource] = useState("Mile 12 via Ola of North + Lagos Ministry");
  const [notes, setNotes] = useState("Onion is expensive this week");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chef-didi-prices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          setItems(parsed.items);
          if (parsed.updated) setUpdated(parsed.updated);
          if (parsed.source) setSource(parsed.source);
          if (parsed.notes) setNotes(parsed.notes);
        }
      }
    } catch (e) { /* ignore, use defaults */ }
  }, []);

  const refresh = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch('/api/debug?action=prices-refresh', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const data = json.data || json;
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        if (data.updated) setUpdated(data.updated);
        if (data.source) setSource(data.source);
        if (data.notes) setNotes(data.notes);
        try { localStorage.setItem('chef-didi-prices', JSON.stringify(data)); } catch {}
        setStatus("✅ Updated!");
      } else {
        throw new Error("No items returned");
      }
    } catch (e) {
      setStatus(`❌ Could not fetch: ${e.message}. Showing last saved prices.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, margin: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>💰 Live ₦5k Prices - Mile 12</div>
          <div style={{ fontSize: 12, color: '#666' }}>Last updated: {updated}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Source: {source}</div>
        </div>
        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● LIVE</span>
      </div>

      <button onClick={refresh} disabled={loading} style={{ width: '100%', marginTop: 12, padding: '12px', border: 'none', borderRadius: 10, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? '⏳ Updating...' : '🔄 Get Current Price'}
      </button>

      {status ? <div style={{ marginTop: 10, fontSize: 13, color: status.startsWith('❌') ? '#b91c1c' : '#166534' }}>{status}</div> : null}

      {notes ? <div style={{ marginTop: 10, background: '#fef9c3', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}>💡 {notes}</div> : null}

      <div style={{ marginTop: 12 }}>
        {items.map((it) => (
          <div key={it.id || it.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span>{it.emoji} {it.name} <span style={{ color: '#999', fontSize: 12 }}>({it.unit})</span></span>
            <b>₦{(it.price ?? 0).toLocaleString()}</b>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#999', marginTop: 10 }}>Only you see this. Test here before it goes live.</p>
    </div>
  );
}

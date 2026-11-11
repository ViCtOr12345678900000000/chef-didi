// components/MyNumber.jsx
import { useEffect, useState, useMemo } from "react";
const PAGE_SIZE = 20;

function normalizeCountry(c) {
  const s = String(c || "Unknown").trim();
  const m = { NG: "Nigeria", Nigeria: "Nigeria", US: "United States", USA: "United States", "United States": "United States", GB: "United Kingdom", UK: "United Kingdom" };
  return m[s] || m[s.toUpperCase()] || s;
}
function isOldBot(v) {
  const city = String(v.city || "").toLowerCase();
  const dcs = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner"];
  return dcs.some(d => city.includes(d)) || (city === "unknown" && v.device === "Other");
}

export default function MyNumber() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBots, setShowBots] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [dark, setDark] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("didi-admin-theme") !== "light" : true);
  useEffect(() => { window.localStorage.setItem("didi-admin-theme", dark ? "dark" : "light"); }, [dark]);

  const T = dark ? { bg: "#0F0F10", card: "#1A1A1C", card2: "#141415", border: "#262628", border2: "#222", text: "white", muted: "#ccc", dim: "#888", dim2: "#777", dim3: "#666", inputBg: "#1A1A1C", inputBorder: "#2A2A2E", chipOffBg: "#1A1A1C", chipOffText: "#ccc", btnBg: "white", btnText: "black" } 
  : { bg: "#F5F5F4", card: "white", card2: "white", border: "#E7E5E4", border2: "#E7E5E4", text: "#1A1A2E", muted: "#44403C", dim: "#78716C", dim2: "#A8A29E", dim3: "#A8A29E", inputBg: "white", inputBorder: "#E7E5E4", chipOffBg: "white", chipOffText: "#44403C", btnBg: "#1A1A2E", btnText: "white" };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/my-number");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server status ${res.status}`);
      setData(json);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [tab, search, countryFilter, showBots]);

  const allVisitors = useMemo(() => (data?.visitors || []).map(v => ({ ...v, country: normalizeCountry(v.country) })), [data]);
  const users = data?.users || [];
  const reviews = data?.reviews || [];
  const visitors = useMemo(() => showBots ? allVisitors : allVisitors.filter(v => !isOldBot(v)), [allVisitors, showBots]);
  const hiddenBotCount = allVisitors.length - visitors.length;

  const countries = useMemo(() => {
    const m = {}; visitors.forEach(v => { const k = v.country || "Unknown"; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [visitors]);

  const filteredVisitors = useMemo(() => visitors.filter(v => {
    if (countryFilter !== "all" && v.country !== countryFilter) return false;
    if (search && !`${v.city} ${v.country} ${v.device} ${v.time || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [visitors, search, countryFilter]);

  const filteredUsers = useMemo(() => search ? users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) : users, [users, search]);
  const filteredReviews = useMemo(() => search ? reviews.filter(r => `${r.name} ${r.comment} ${r.email}`.toLowerCase().includes(search.toLowerCase())) : reviews, [reviews, search]);
  
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : "—";
  const list = tab === "visitors" ? filteredVisitors : tab === "users" ? filteredUsers : filteredReviews;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (type, item, indexInPage) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}? Action cannot be undone.`)) return;
    const k = `${type}-${item.id || item.createdAt || item.time || ""}-${indexInPage}`;
    setDeleting(k);
    const prev = data;
    const filterOut = arr => arr.filter(x => x !== item);
    setData(d => d ? { ...d, visitors: type === "visitors" ? filterOut(d.visitors) : d.visitors, users: type === "users" ? filterOut(d.users) : d.users, reviews: type === "reviews" ? filterOut(d.reviews) : d.reviews } : d);
    try {
      const res = await fetch("/api/my-number", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id: item.id, email: item.email, createdAt: item.createdAt || item.time, comment: item.comment, city: item.city, name: item.name }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");
      await load();
    } catch (e) { alert("❌ " + e.message); setData(prev); } finally { setDeleting(null); }
  };

  if (loading && !data) return <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>Loading dashboard data...</div>;
  if (error) return <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: "10px" }}><p style={{ color: "#EF4444", fontWeight: 700 }}>⚠️ Failed to load</p><p style={{ fontSize: "13px", color: T.dim }}>{error}</p><button onClick={load} style={{ background: T.btnBg, color: T.btnText, border: "none", padding: "8px 16px", borderRadius: "999px", fontWeight: 700, cursor: "pointer" }}>Retry</button></div>;

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" };
  const chip = act => ({ padding: "8px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: act ? T.btnBg : T.chipOffBg, color: act ? T.btnText : T.chipOffText });
  const delBtn = { background: "transparent", color: "#EF4444", border: "1px solid #FECACA", borderRadius: "999px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ position: "sticky", top: 0, background: dark ? "rgba(15,15,16,0.95)" : "rgba(245,245,244,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${T.border2}`, zIndex: 10 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><p style={{ fontSize: "10px", letterSpacing: "3px", color: T.dim, margin: 0 }}>CHEF DIDI • ADMIN</p><h1 style={{ fontSize: "22px", margin: "4px 0 0" }}>Dashboard</h1></div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setDark(!dark)} style={{ background: T.card, color: T.text, padding: "9px 14px", borderRadius: "999px", border: `1px solid ${T.border}`, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
            <button onClick={load} style={{ background: T.btnBg, color: T.btnText, padding: "9px 16px", borderRadius: "999px", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>↻ Refresh</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          <div style={card}><p style={{ color: T.dim, fontSize: "11px", margin: 0 }}>VISITS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0" }}>{visitors.length}</p><p style={{ fontSize: "11px", color: T.dim3, margin: 0 }}>{hiddenBotCount} bots hidden</p></div>
          <div style={card}><p style={{ color: T.dim, fontSize: "11px", margin: 0 }}>COUNTRIES</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#4ADE80" }}>{countries.length}</p></div>
          <div style={card}><p style={{ color: T.dim, fontSize: "11px", margin: 0 }}>USERS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#A78BFA" }}>{users.length}</p></div>
          <div style={card}><p style={{ color: T.dim, fontSize: "11px", margin: 0 }}>REVIEWS ({avgRating}⭐)</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#FACC15" }}>{reviews.length}</p></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 8px" }}>
          <h3 style={{ fontSize: "13px", margin: 0, color: T.muted }}>Filter by Country</h3>
          <button onClick={() => setShowBots(!showBots)} style={{ background: T.card, color: T.dim, border: `1px solid ${T.inputBorder}`, borderRadius: "999px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>{showBots ? "Hide bots" : `Show ${hiddenBotCount} bots`}</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setCountryFilter("all")} style={{ background: countryFilter === "all" ? T.btnBg : T.card, color: countryFilter === "all" ? T.btnText : T.text, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>All • {visitors.length}</button>
          {countries.map(([c, n]) => <button key={c} onClick={() => setCountryFilter(c === countryFilter ? "all" : c)} style={{ background: countryFilter === c ? T.btnBg : T.card, color: countryFilter === c ? T.btnText : T.text, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{c} • {n}</button>)}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={() => setTab("visitors")} style={chip(tab === "visitors")}>Visitors ({filteredVisitors.length})</button>
          <button onClick={() => setTab("users")} style={chip(tab === "users")}>Users ({filteredUsers.length})</button>
          <button onClick={() => setTab("reviews")} style={chip(tab === "reviews")}>Reviews ({filteredReviews.length})</button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input type="text" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." style={{ flex: 1, height: "40px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${T.inputBorder}`, background: T.inputBg, color: T.text, outline: "none", fontSize: "13px" }} />
          {tab === "visitors" && (
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ height: "40px", borderRadius: "999px", background: T.inputBg, color: T.text, border: `1px solid ${T.inputBorder}`, padding: "0 12px", fontSize: "13px" }}>
              <option value="all">All countries</option>
              {countries.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div style={{ background: T.card2, border: `1px solid ${T.border2}`, borderRadius: "16px", overflow: "hidden" }}>
          {pageItems.length === 0 && <p style={{ padding: "24px", color: T.dim2, textAlign: "center", fontSize: "13px", margin: 0 }}>Nothing found here.</p>}
          {tab === "visitors" && pageItems.map((v, i) => {
            const k = `v-${v.id || v.time || i}`; const del = deleting === k;
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.border2}`, alignItems: "center", opacity: del ? 0.4 : 1 }}>
                <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{v.city}, {v.country}</p><p style={{ margin: "2px 0 0", color: T.dim2, fontSize: "12px" }}>{v.device || "Unknown"}</p></div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><p style={{ margin: 0, color: T.dim, fontSize: "12px" }}>{v.time ? new Date(v.time).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}</p><button onClick={() => handleDelete("visitors", v, i)} disabled={del} style={delBtn}>{del ? "..." : "🗑️ Delete"}</button></div>
              </div>
            );
          })}
          {tab === "users" && pageItems.map((u, i) => {
            const k = `u-${u.id || u.createdAt || i}`; const del = deleting === k;
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.border2}`, alignItems: "center", opacity: del ? 0.4 : 1 }}>
                <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{u.name}</p><p style={{ margin: "2px 0 0", color: T.dim2, fontSize: "12px" }}>{u.email}</p></div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><p style={{ margin: 0, color: T.dim, fontSize: "12px" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}</p><button onClick={() => handleDelete("users", u, i)} disabled={del} style={delBtn}>{del ? "..." : "🗑️ Delete"}</button></div>
              </div>
            );
          })}
          {tab === "reviews" && pageItems.map((r, i) => {
            const k = `r-${r.id || r.createdAt || i}`; const del = deleting === k;
            return (
              <div key={k} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border2}`, opacity: del ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{r.name} <span style={{ color: "#FACC15" }}>{"⭐".repeat(r.rating || 5)}</span></p><div style={{ display: "flex", gap: "8px", alignItems: "center" }}><p style={{ margin: 0, color: T.dim, fontSize: "12px" }}>{r.createdAt ? new Date(r.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}</p><button onClick={() => handleDelete("reviews", r, i)} disabled={del} style={delBtn}>{del ? "..." : "🗑️ Delete"}</button></div></div>
                <p style={{ margin: "6px 0 0", color: T.muted, fontSize: "13px" }}>{r.comment}</p><p style={{ margin: "4px 0 0", color: T.dim2, fontSize: "11px" }}>{r.email}</p>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ background: T.card, color: T.text, border: `1px solid ${T.inputBorder}`, padding: "9px 16px", borderRadius: "999px", opacity: safePage <= 1 ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>← Prev</button>
          <p style={{ fontSize: "12px", color: T.dim, margin: 0 }}>Page {safePage} of {totalPages} • {list.length} shown</p>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ background: T.btnBg, color: T.btnText, border: "none", padding: "9px 16px", borderRadius: "999px", opacity: safePage >= totalPages ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

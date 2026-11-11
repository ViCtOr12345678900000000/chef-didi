import { useEffect, useState, useMemo } from "react";
const PAGE_SIZE = 20;

function normalizeCountry(c) {
  const s = String(c || "Unknown").trim();
  const map = { NG: "Nigeria", Nigeria: "Nigeria", US: "United States", USA: "United States", "United States": "United States", GB: "United Kingdom", UK: "United Kingdom" };
  return map[s] || map[s.toUpperCase()] || s;
}
function isOldBot(v) {
  const city = String(v.city || "").toLowerCase();
  const datacenters = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner"];
  if (datacenters.some(d => city.includes(d))) return true;
  if (city === "unknown" && v.device === "Other") return true;
  return false;
}

export default function MyNumber() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showBots, setShowBots] = useState(false);
  const [dark, setDark] = useState(true);
  const [deleting, setDeleting] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/my-number", { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API returned " + res.status);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setLoadError(e.name === "AbortError" ? "Request timed out - Upstash / API is slow. Tap Retry." : "Could not load dashboard: " + (e.message || "API error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [tab, search, countryFilter, showBots]);

  // DELETE - works with id OR composite key (createdAt+email+comment)
  const handleDelete = async (type, item) => {
    const label = type === "reviews" ? `"${item.comment?.slice(0, 40)}..." by ${item.name}` : type === "users" ? `${item.name} (${item.email})` : `${item.city}, ${item.country}`;
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?\n\n${label}\n\nThis cannot be undone.`)) return;
    const key = `${type}-${item.id || item.createdAt || item.time || ""}-${item.email || ""}`;
    setDeleting(key);
    try {
      const res = await fetch("/api/my-number", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id: item.id || null,
          createdAt: item.createdAt || item.time || null,
          email: item.email || null,
          comment: item.comment || null,
          name: item.name || null,
          city: item.city || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");
      // Optimistic update - remove instantly, then reload to confirm
      setData((prev) => {
        if (!prev) return prev;
        const match = (x) => {
          if (item.id && x.id) return x.id !== item.id;
          if (type === "reviews") return !(x.createdAt === item.createdAt && x.email === item.email && x.comment === item.comment);
          if (type === "users") return !(x.createdAt === item.createdAt && x.email === item.email);
          return !(x.time === item.time && x.city === item.city && x.device === item.device);
        };
        return { ...prev, [type]: (prev[type] || []).filter(match) };
      });
    } catch (e) {
      alert("❌ Delete failed: " + e.message);
      load();
    } finally {
      setDeleting("");
    }
  };

  const allVisitors = (data?.visitors || []).map(v => ({ ...v, country: normalizeCountry(v.country) }));
  const users = data?.users || [];
  const reviews = data?.reviews || [];
  const visitors = showBots ? allVisitors : allVisitors.filter(v => !isOldBot(v));
  const hiddenBotCount = allVisitors.length - visitors.length;

  const countries = useMemo(() => {
    const map = {};
    visitors.forEach(v => { const k = v.country || "Unknown"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visitors]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      if (countryFilter !== "all" && v.country !== countryFilter) return false;
      if (search && !`${v.city} ${v.country} ${v.device}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [visitors, search, countryFilter]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(s));
  }, [users, search]);

  const filteredReviews = useMemo(() => {
    if (!search) return reviews;
    const s = search.toLowerCase();
    return reviews.filter(r => `${r.name} ${r.comment} ${r.email}`.toLowerCase().includes(s));
  }, [reviews, search]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : "—";

  const list = tab === "visitors" ? filteredVisitors : tab === "users" ? filteredUsers : filteredReviews;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // THEME - Dark / Light
  const T = dark ? {
    bg: "#0F0F10", card: "#1A1A1C", card2: "#141415", border: "#262628", border2: "#222",
    text: "white", muted: "#888", muted2: "#777", sub: "#ccc", inputBg: "#1A1A1C", btn: "white", btnText: "black"
  } : {
    bg: "#F5F5F4", card: "white", card2: "white", border: "#E7E5E4", border2: "#E7E5E4",
    text: "#1A1A2E", muted: "#78716C", muted2: "#A8A29E", sub: "#44403C", inputBg: "white", btn: "#1A1A2E", btnText: "white"
  };

  if (loading) return <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", fontFamily: "system-ui" }}><p>Loading dashboard...</p><p style={{ fontSize: "12px", color: T.muted }}>If this stays, check Upstash / API</p></div>;

  if (loadError || !data) return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "20px", textAlign: "center", fontFamily: "system-ui" }}>
      <p style={{ fontSize: "32px" }}>⚠️</p>
      <p style={{ fontWeight: 700 }}>Dashboard failed to load</p>
      <p style={{ fontSize: "13px", color: T.muted, maxWidth: "400px" }}>{loadError || "No data returned from /api/my-number"}</p>
      <button onClick={load} style={{ background: T.btn, color: T.btnText, padding: "10px 20px", borderRadius: "999px", border: "none", fontWeight: 700, cursor: "pointer" }}>↻ Retry</button>
      <p style={{ fontSize: "11px", color: T.muted2 }}>Check Vercel Logs → /api/my-number → Upstash env vars</p>
    </div>
  );

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" };
  const chip = (active) => ({ padding: "8px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: active ? T.btn : T.card, color: active ? T.btnText : T.sub });
  const inputStyle = { flex: 1, minWidth: "180px", height: "40px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${T.border}`, background: T.inputBg, color: T.text, outline: "none", fontSize: "13px" };

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ position: "sticky", top: 0, background: dark ? "rgba(15,15,16,0.95)" : "rgba(245,245,244,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${T.border2}`, zIndex: 10 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div><p style={{ fontSize: "10px", letterSpacing: "3px", color: T.muted, margin: 0 }}>CHEF DIDI • PRIVATE ADMIN</p><h1 style={{ fontSize: "22px", margin: "4px 0 0" }}>Dashboard</h1></div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setDark(!dark)} style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, padding: "9px 14px", borderRadius: "999px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
            <button onClick={load} style={{ background: T.btn, color: T.btnText, padding: "9px 16px", borderRadius: "999px", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>↻ Refresh</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          <div style={card}><p style={{ color: T.muted, fontSize: "11px", margin: 0 }}>REAL VISITS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0" }}>{visitors.length}</p><p style={{ fontSize: "11px", color: T.muted2, margin: 0 }}>{hiddenBotCount} old bot entries hidden</p></div>
          <div style={card}><p style={{ color: T.muted, fontSize: "11px", margin: 0 }}>COUNTRIES REACHED</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#4ADE80" }}>{countries.length}</p></div>
          <div style={card}><p style={{ color: T.muted, fontSize: "11px", margin: 0 }}>REGISTERED USERS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#A78BFA" }}>{users.length}</p></div>
          <div style={card}><p style={{ color: T.muted, fontSize: "11px", margin: 0 }}>REVIEWS • AVG {avgRating}⭐</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#FACC15" }}>{reviews.length}</p><p style={{ fontSize: "11px", color: T.muted2, margin: 0 }}>From footer review box</p></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0 8px", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "13px", margin: 0, color: T.muted }}>🌍 Filter by country — how far Didi has reached</h3>
          <button onClick={() => setShowBots(!showBots)} style={{ marginLeft: "auto", background: T.card, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>{showBots ? "Hide bots" : `Show ${hiddenBotCount} hidden bots`}</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setCountryFilter("all")} style={{ background: countryFilter === "all" ? T.btn : T.card, color: countryFilter === "all" ? T.btnText : T.text, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>All • {visitors.length}</button>
          {countries.map(([c, n]) => (
            <button key={c} onClick={() => setCountryFilter(c === countryFilter ? "all" : c)} style={{ background: countryFilter === c ? T.btn : T.card, color: countryFilter === c ? T.btnText : T.text, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{c} • {n}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={() => setTab("visitors")} style={chip(tab === "visitors")}>Visitors {countryFilter !== "all" ? `in ${countryFilter} ` : ""}({filteredVisitors.length})</button>
          <button onClick={() => setTab("users")} style={chip(tab === "users")}>Users ({filteredUsers.length})</button>
          <button onClick={() => setTab("reviews")} style={chip(tab === "reviews")}>⭐ Reviews ({filteredReviews.length})</button>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <input type="text" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "visitors" ? "Search city, country, device..." : tab === "reviews" ? "Search review, name..." : "Search name or email..."} style={inputStyle} />
          {tab === "visitors" && (
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ height: "40px", borderRadius: "999px", background: T.inputBg, color: T.text, border: `1px solid ${T.border}`, padding: "0 12px", fontSize: "13px" }}>
              <option value="all">All countries</option>
              {countries.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div style={{ background: T.card2, border: `1px solid ${T.border2}`, borderRadius: "16px", overflow: "hidden" }}>
          {pageItems.length === 0 && <p style={{ padding: "20px", color: T.muted2, textAlign: "center", fontSize: "13px" }}>Nothing here yet.</p>}
          {tab === "visitors" && pageItems.map((v, i) => {
            const k = `visitors-${v.id || v.time || ""}-${v.email || ""}`;
            return (
              <div key={v.id || `${v.time}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: `1px solid ${T.border2}`, alignItems: "center" }}>
                <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{v.city}, {v.country}</p><p style={{ margin: "2px 0 0", color: T.muted2, fontSize: "12px" }}>{v.device || "Unknown device"}</p></div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ margin: 0, color: T.muted, fontSize: "12px", whiteSpace: "nowrap" }}>{v.time ? new Date(v.time).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
                  <button onClick={() => handleDelete("visitors", v)} disabled={deleting === k} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "999px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{deleting === k ? "..." : "🗑️"}</button>
                </div>
              </div>
            );
          })}
          {tab === "users" && pageItems.map((u, i) => {
            const k = `users-${u.id || u.createdAt || ""}-${u.email || ""}`;
            return (
              <div key={u.id || `${u.email}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: `1px solid ${T.border2}`, alignItems: "center" }}>
                <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{u.name}</p><p style={{ margin: "2px 0 0", color: T.muted2, fontSize: "12px" }}>{u.email}</p></div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ margin: 0, color: T.muted, fontSize: "12px", whiteSpace: "nowrap" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}</p>
                  <button onClick={() => handleDelete("users", u)} disabled={deleting === k} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "999px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{deleting === k ? "..." : "🗑️"}</button>
                </div>
              </div>
            );
          })}
          {tab === "reviews" && pageItems.map((r, i) => {
            const k = `reviews-${r.id || r.createdAt || ""}-${r.email || ""}`;
            return (
              <div key={r.id || `${r.createdAt}-${r.email}-${i}`} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border2}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{r.name} <span style={{ color: "#FACC15" }}>{"⭐".repeat(r.rating || 5)}</span></p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <p style={{ margin: 0, color: T.muted, fontSize: "12px", whiteSpace: "nowrap" }}>{r.createdAt ? new Date(r.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
                    <button onClick={() => handleDelete("reviews", r)} disabled={deleting === k} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "999px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{deleting === k ? "Deleting..." : "🗑️ Delete"}</button>
                  </div>
                </div>
                <p style={{ margin: "6px 0 0", color: T.sub, fontSize: "13px", lineHeight: 1.5 }}>{r.comment}</p>
                <p style={{ margin: "4px 0 0", color: T.muted2, fontSize: "11px" }}>{r.email}</p>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, padding: "9px 16px", borderRadius: "999px", opacity: safePage <= 1 ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>← Prev</button>
          <p style={{ fontSize: "12px", color: T.muted, margin: 0 }}>Page {safePage} of {totalPages} • {list.length} shown</p>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ background: T.btn, color: T.btnText, border: "none", padding: "9px 16px", borderRadius: "999px", opacity: safePage >= totalPages ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

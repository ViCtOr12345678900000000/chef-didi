import { useEffect, useState, useMemo } from "react";

const PAGE_SIZE = 20;

export default function MyNumber() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-number");
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [tab, search, countryFilter]);

  const visitors = data?.visitors || [];
  const users = data?.users || [];

  const isBotLike = (v) => {
    const c = (v.country || "").toLowerCase();
    const city = (v.city || "").toLowerCase();
    // Vercel / bots / crawlers live in US data centers
    return c === "united states" || c === "us" || city.includes("san jose") || city.includes("ashburn") || city.includes("boardman") || (v.device || "").toLowerCase().includes("bot");
  };

  const nigeriaCount = visitors.filter(v => (v.country || "").toLowerCase().includes("nigeria")).length;
  const botCount = visitors.filter(isBotLike).length;
  const realCount = visitors.length - botCount;

  const countries = useMemo(() => {
    const map = {};
    visitors.forEach(v => { const k = v.country || "Unknown"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visitors]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      if (countryFilter === "nigeria" && !(v.country || "").toLowerCase().includes("nigeria")) return false;
      if (countryFilter === "bots" && !isBotLike(v)) return false;
      if (countryFilter === "real" && isBotLike(v)) return false;
      if (countryFilter !== "all" && countryFilter !== "nigeria" && countryFilter !== "bots" && countryFilter !== "real" && v.country !== countryFilter) return false;
      if (search && !`${v.city} ${v.country} ${v.device}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [visitors, search, countryFilter]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(s));
  }, [users, search]);

  const list = tab === "visitors" ? filteredVisitors : filteredUsers;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading || !data) return (
    <div style={{ background: "#0F0F10", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>Loading dashboard...</div>
  );

  const card = { background: "#1A1A1C", border: "1px solid #262628", borderRadius: "16px", padding: "16px" };
  const chip = (active) => ({ padding: "8px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: active ? "white" : "#1A1A1C", color: active ? "black" : "#ccc" });
  const inputStyle = { flex: 1, minWidth: "180px", height: "40px", padding: "0 14px", borderRadius: "999px", border: "1px solid #2A2A2E", background: "#1A1A1C", color: "white", outline: "none", fontSize: "13px" };

  return (
    <div style={{ background: "#0F0F10", color: "white", minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ position: "sticky", top: 0, background: "rgba(15,15,16,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #222", zIndex: 10 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><p style={{ fontSize: "10px", letterSpacing: "3px", color: "#888", margin: 0 }}>CHEF DIDI • PRIVATE ADMIN</p><h1 style={{ fontSize: "22px", margin: "4px 0 0" }}>Dashboard</h1></div>
          <button onClick={load} style={{ background: "white", color: "black", padding: "9px 16px", borderRadius: "999px", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>TOTAL VISITS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0" }}>{data.count ?? visitors.length}</p></div>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>🇳🇬 NIGERIA</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#4ADE80" }}>{nigeriaCount}</p><p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Real users</p></div>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>🤖 BOTS / US SERVERS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#F59E0B" }}>{botCount}</p><p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Vercel, crawlers, previews</p></div>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>REGISTERED USERS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#A78BFA" }}>{users.length}</p></div>
        </div>

        <p style={{ fontSize: "12px", color: "#777", background: "#1A1A1C", border: "1px solid #262628", borderRadius: "12px", padding: "12px 14px", lineHeight: 1.6 }}>
          <b style={{ color: "#fff" }}>Why San Jose / US?</b> Vercel runs in the US. Its health-checks, WhatsApp link previews and Google bots all come from US data centers (San Jose, Ashburn). They are not real visitors. Use the <b style={{ color: "#4ADE80" }}>Nigeria</b> filter to see real people.
        </p>

        {/* Top countries */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {countries.slice(0, 8).map(([c, n]) => (
            <span key={c} style={{ background: "#1A1A1C", border: "1px solid #262628", borderRadius: "999px", padding: "6px 12px", fontSize: "12px" }}>{c} • <b>{n}</b></span>
          ))}
        </div>

        {/* Tabs + Filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={() => setTab("visitors")} style={chip(tab === "visitors")}>Visitors ({filteredVisitors.length})</button>
          <button onClick={() => setTab("users")} style={chip(tab === "users")}>Users ({filteredUsers.length})</button>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "visitors" ? "Search city, country, device..." : "Search name or email..."} style={inputStyle} />
          {tab === "visitors" && (
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ height: "40px", borderRadius: "999px", background: "#1A1A1C", color: "white", border: "1px solid #2A2A2E", padding: "0 12px", fontSize: "13px" }}>
              <option value="all">All countries</option>
              <option value="nigeria">🇳🇬 Nigeria only</option>
              <option value="real">Real visitors (no bots)</option>
              <option value="bots">🤖 Bots / US only</option>
              {countries.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* List — paginated, max 20 per page */}
        <div style={{ background: "#141415", border: "1px solid #222", borderRadius: "16px", overflow: "hidden" }}>
          {pageItems.length === 0 && <p style={{ padding: "20px", color: "#777", textAlign: "center", fontSize: "13px" }}>Nothing here. Try another filter.</p>}
          {tab === "visitors" && pageItems.map((v, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #222" }}>
              <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{v.city}, {v.country} {isBotLike(v) && <span style={{ fontSize: "10px", background: "#2A2110", color: "#F59E0B", padding: "2px 7px", borderRadius: "999px", marginLeft: "6px" }}>BOT / US SERVER</span>}</p><p style={{ margin: "2px 0 0", color: "#777", fontSize: "12px" }}>{v.device || "Unknown device"}</p></div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px", whiteSpace: "nowrap" }}>{v.time ? new Date(v.time).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
            </div>
          ))}
          {tab === "users" && pageItems.map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #222" }}>
              <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{u.name}</p><p style={{ margin: "2px 0 0", color: "#777", fontSize: "12px" }}>{u.email}</p></div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px", whiteSpace: "nowrap" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ background: "#1A1A1C", color: "white", border: "1px solid #2A2A2E", padding: "9px 16px", borderRadius: "999px", opacity: safePage <= 1 ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>← Prev</button>
          <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Page {safePage} of {totalPages} • {list.length} shown</p>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ background: "white", color: "black", border: "none", padding: "9px 16px", borderRadius: "999px", opacity: safePage >= totalPages ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

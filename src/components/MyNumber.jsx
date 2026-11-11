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

  // Country counts — this is your "how far has Didi reached" view
  const countries = useMemo(() => {
    const map = {};
    visitors.forEach(v => {
      const k = v.country || "Unknown";
      map[k] = (map[k] || 0) + 1;
    });
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
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>TOTAL VISITS (REAL PEOPLE)</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0" }}>{visitors.length}</p><p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Bots already filtered out</p></div>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>COUNTRIES REACHED</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#4ADE80" }}>{countries.length}</p></div>
          <div style={card}><p style={{ color: "#888", fontSize: "11px", margin: 0 }}>REGISTERED USERS</p><p style={{ fontSize: "32px", fontWeight: 300, margin: "6px 0 0", color: "#A78BFA" }}>{users.length}</p></div>
        </div>

        {/* 🌍 COUNTRY FILTER — how far has Didi reached? */}
        <h3 style={{ fontSize: "13px", margin: "20px 0 10px", color: "#aaa" }}>🌍 Filter by country — see how far Didi has reached</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setCountryFilter("all")} style={{ background: countryFilter === "all" ? "white" : "#1A1A1C", color: countryFilter === "all" ? "black" : "white", border: "1px solid #262628", borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>All • {visitors.length}</button>
          {countries.map(([c, n]) => (
            <button key={c} onClick={() => setCountryFilter(c === countryFilter ? "all" : c)} style={{ background: countryFilter === c ? "white" : "#1A1A1C", color: countryFilter === c ? "black" : "white", border: "1px solid #262628", borderRadius: "999px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{c} • {n}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={() => setTab("visitors")} style={chip(tab === "visitors")}>Visitors {countryFilter !== "all" ? `in ${countryFilter} ` : ""}({filteredVisitors.length})</button>
          <button onClick={() => setTab("users")} style={chip(tab === "users")}>Users ({filteredUsers.length})</button>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "visitors" ? "Search city, country, device..." : "Search name or email..."} style={inputStyle} />
          {tab === "visitors" && (
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ height: "40px", borderRadius: "999px", background: "#1A1A1C", color: "white", border: "1px solid #2A2A2E", padding: "0 12px", fontSize: "13px" }}>
              <option value="all">All countries</option>
              {countries.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        <div style={{ background: "#141415", border: "1px solid #222", borderRadius: "16px", overflow: "hidden" }}>
          {pageItems.length === 0 && <p style={{ padding: "20px", color: "#777", textAlign: "center", fontSize: "13px" }}>Nothing in {countryFilter} yet.</p>}
          {tab === "visitors" && pageItems.map((v, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #222" }}>
              <div><p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{v.city}, {v.country}</p><p style={{ margin: "2px 0 0", color: "#777", fontSize: "12px" }}>{v.device || "Unknown device"}</p></div>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ background: "#1A1A1C", color: "white", border: "1px solid #2A2A2E", padding: "9px 16px", borderRadius: "999px", opacity: safePage <= 1 ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>← Prev</button>
          <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Page {safePage} of {totalPages} • {list.length} shown {countryFilter !== "all" ? `in ${countryFilter}` : ""}</p>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ background: "white", color: "black", border: "none", padding: "9px 16px", borderRadius: "999px", opacity: safePage >= totalPages ? 0.4 : 1, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

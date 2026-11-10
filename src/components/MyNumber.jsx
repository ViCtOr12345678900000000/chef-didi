import { useEffect, useState } from "react";

export default function MyNumber() {
  const [data, setData] = useState(null);

  const load = async () => {
    const res = await fetch("/api/my-number");
    const json = await res.json();
    setData(json);
  };

  useEffect(() => { load(); }, []);

  if (!data) return (
    <div style={{ background: "#111110", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ background: "#111110", color: "white", minHeight: "100vh", padding: "24px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "4px", color: "#777" }}>
        PRIVATE ADMIN
      </p>

      <h1 style={{ fontSize: "80px", fontWeight: "300", margin: "10px 0 0" }}>
        {data.count}
      </h1>
      <p style={{ color: "#999" }}>Total Visitors</p>

      <button onClick={load} style={{ marginTop: "16px", background: "white", color: "black", padding: "10px 20px", borderRadius: "999px", border: "none" }}>
        Refresh
      </button>

      <h2 style={{ marginTop: "40px" }}>
        Visitors ({data.visitors.length})
      </h2>

      {data.visitors.map((v, i) => (
        <div key={i} style={{ borderBottom: "1px solid #222", padding: "12px 0" }}>
          <p style={{ margin: 0 }}>
            {v.city}, {v.country} — {v.device}
          </p>
          <p style={{ margin: 0, color: "#777", fontSize: "12px" }}>
            {new Date(v.time).toLocaleString()}
          </p>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>
        Registered Users ({data.users.length})
      </h2>

      {data.users.length === 0 && (
        <p style={{ color: "#777" }}>
          No registered users yet.
        </p>
      )}

      {data.users.map((u, i) => (
        <div key={i} style={{ borderBottom: "1px solid #222", padding: "12px 0" }}>
          <p style={{ margin: 0 }}>{u.name} — {u.email}</p>
          <p style={{ margin: 0, color: "#777", fontSize: "12px" }}>
            {new Date(u.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

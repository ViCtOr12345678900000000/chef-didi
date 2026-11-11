import { useEffect, useState, useMemo } from "react";

const PAGE_SIZE = 20;

const normalizeCountry = (c) => {
  const s = String(c || "Unknown").trim();

  const map = {
    NG: "Nigeria",
    Nigeria: "Nigeria",
    US: "United States",
    USA: "United States",
    "United States": "United States",
    GB: "United Kingdom",
    UK: "United Kingdom",
  };

  return map[s] || map[s.toUpperCase()] || s;
};

function isOldBot(v) {
  const city = String(v.city || "").toLowerCase();

  const datacenters = [
    "san jose",
    "ashburn",
    "boardman",
    "dulles",
    "prineville",
    "hillsboro",
    "quincy",
    "the dalles",
    "council bluffs",
    "moncks corner",
  ];

  if (datacenters.some(d => city.includes(d))) {
    return true;
  }

  if (city === "unknown" && v.device === "Other") {
    return true;
  }

  return false;
}

export default function MyNumber() {

  // ---------- STATE ----------

  const [data, setData] = useState(null);

  const [tab, setTab] = useState("visitors");

  const [search, setSearch] = useState("");

  const [countryFilter, setCountryFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [showBots, setShowBots] = useState(false);

  const [error, setError] = useState("");

  const [deleting, setDeleting] = useState(null);

  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;

    return localStorage.getItem("chef-didi-admin-theme") !== "light";
  });

  // ---------- THEME ----------

  useEffect(() => {
    localStorage.setItem(
      "chef-didi-admin-theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  const theme = dark
    ? {
        bg: "#0F0F10",
        card: "#1A1A1C",
        surface: "#141415",
        border: "#262628",
        text: "#FFFFFF",
        muted: "#888888",
        secondary: "#CCCCCC",
        input: "#1A1A1C",
        active: "#FFFFFF",
        activeText: "#000000",
        hover: "#252527",
        header: "rgba(15,15,16,0.95)",
      }
    : {
        bg: "#F5F5F4",
        card: "#FFFFFF",
        surface: "#FFFFFF",
        border: "#E7E5E4",
        text: "#1A1A2E",
        muted: "#777777",
        secondary: "#555555",
        input: "#FFFFFF",
        active: "#1A1A2E",
        activeText: "#FFFFFF",
        hover: "#F0F0F0",
        header: "rgba(245,245,244,0.95)",
      };

  // ---------- LOAD DATA ----------

  const load = async () => {

    setLoading(true);
    setError("");

    try {

      const res = await fetch("/api/my-number");

      if (!res.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const json = await res.json();

      setData({
        visitors: json.visitors || [],
        users: json.users || [],
        reviews: json.reviews || [],
      });

    } catch (err) {

      setError(err.message || "Something went wrong.");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, countryFilter, showBots]);

  // ---------- DATA ----------

  const allVisitors = useMemo(() => {
    return (data?.visitors || []).map(v => ({
      ...v,
      country: normalizeCountry(v.country),
    }));
  }, [data]);

  const users = data?.users || [];

  const reviews = data?.reviews || [];

  const visitors = showBots
    ? allVisitors
    : allVisitors.filter(v => !isOldBot(v));

  const hiddenBotCount = allVisitors.length - visitors.length;

  // ---------- STATISTICS ----------

  const countries = useMemo(() => {

    const map = {};

    visitors.forEach(v => {
      const k = v.country || "Unknown";
      map[k] = (map[k] || 0) + 1;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);

  }, [visitors]);

  const avgRating = useMemo(() => {

    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / reviews.length).toFixed(1);

  }, [reviews]);

  // ---------- FILTERS ----------

  const filteredVisitors = useMemo(() => {

    return visitors.filter(v => {

      if (
        countryFilter !== "all" &&
        v.country !== countryFilter
      ) {
        return false;
      }

      const text = `
        ${v.city}
        ${v.country}
        ${v.device}
        ${v.time}
      `.toLowerCase();

      return text.includes(search.toLowerCase());

    });

  }, [visitors, search, countryFilter]);

  const filteredUsers = useMemo(() => {

    const s = search.toLowerCase();

    return users.filter(u =>
      `${u.name} ${u.email}`.toLowerCase().includes(s)
    );

  }, [users, search]);

  const filteredReviews = useMemo(() => {

    const s = search.toLowerCase();

    return reviews.filter(r =>
      `${r.name} ${r.email} ${r.comment} ${r.rating}`
        .toLowerCase()
        .includes(s)
    );

  }, [reviews, search]);

  // ---------- ACTIVE LIST ----------

  const list =
    tab === "visitors"
      ? filteredVisitors
      : tab === "users"
      ? filteredUsers
      : filteredReviews;

  const totalPages = Math.max(
    1,
    Math.ceil(list.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const pageItems = list.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // ---------- DELETE ----------

  const handleDelete = async (type, item) => {

    const identity = item.id ||
      `${item.createdAt || item.time}-${item.email || ""}-${item.comment || item.city || item.name || ""}`;

    const key = `${type}-${identity}`;

    if (deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(key);
    setError("");

    try {

      const res = await fetch("/api/my-number", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          type,
          id: item.id,
          createdAt: item.createdAt,
          email: item.email,
          comment: item.comment,
          time: item.time,
          city: item.city,
          country: item.country,
          device: item.device,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Unable to delete record.");
      }

      // Update UI immediately after successful deletion.

      setData(prev => ({
        ...prev,
        [type]: prev[type].filter(record => {

          if (item.id) {
            return String(record.id) !== String(item.id);
          }

          // Legacy records without IDs.

          if (type === "reviews") {
            return !(
              record.createdAt === item.createdAt &&
              record.comment === item.comment &&
              record.email === item.email
            );
          }

          if (type === "users") {
            return !(
              record.createdAt === item.createdAt &&
              record.email === item.email
            );
          }

          return !(
            record.time === item.time &&
            record.city === item.city &&
            record.device === item.device
          );

        }),
      }));

    } catch (err) {

      setError(err.message || "Delete failed.");

    } finally {

      setDeleting(null);

    }
  };

  // ---------- STYLES ----------

  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "16px",
  };

  const chip = (active) => ({
    padding: "8px 14px",
    borderRadius: "999px",
    border: `1px solid ${theme.border}`,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    background: active ? theme.active : theme.card,
    color: active ? theme.activeText : theme.secondary,
  });

  const inputStyle = {
    flex: 1,
    minWidth: "180px",
    height: "40px",
    padding: "0 14px",
    borderRadius: "999px",
    border: `1px solid ${theme.border}`,
    background: theme.input,
    color: theme.text,
    outline: "none",
    fontSize: "13px",
  };

  const deleteButton = {
    background: dark ? "#3A1D20" : "#FEE2E2",
    color: "#EF4444",
    border: "none",
    padding: "7px 11px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  // ---------- LOADING ----------

  if (loading && !data) {
    return (
      <div style={{
        background: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
      }}>
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        background: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        padding: "40px",
        textAlign: "center",
        fontFamily: "system-ui",
      }}>
        <p>{error || "Unable to load dashboard."}</p>

        <button onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  // ---------- MAIN UI ----------

  return (

    <div style={{
      background: theme.bg,
      color: theme.text,
      minHeight: "100vh",
      fontFamily: "system-ui",
      transition: "background 0.2s, color 0.2s",
    }}>

      {/* HEADER */}

      <div style={{
        position: "sticky",
        top: 0,
        background: theme.header,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${theme.border}`,
        zIndex: 10,
      }}>

        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}>

          <div>
            <p style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: theme.muted,
              margin: 0,
            }}>
              CHEF DIDI • PRIVATE ADMIN
            </p>

            <h1 style={{
              fontSize: "22px",
              margin: "4px 0 0",
            }}>
              Dashboard
            </h1>
          </div>

          <div style={{
            display: "flex",
            gap: "8px",
          }}>

            <button
              onClick={() => setDark(!dark)}
              style={{
                background: theme.card,
                color: theme.text,
                padding: "9px 12px",
                borderRadius: "999px",
                border: `1px solid ${theme.border}`,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={load}
              style={{
                background: theme.active,
                color: theme.activeText,
                padding: "9px 14px",
                borderRadius: "999px",
                border: "none",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ↻ Refresh
            </button>

          </div>

        </div>
      </div>

      {/* DASHBOARD CONTENT */}

      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}>

        {/* ERROR MESSAGE */}

        {error && (
          <div style={{
            background: dark ? "#3A1D20" : "#FEE2E2",
            color: "#EF4444",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
            fontSize: "13px",
          }}>
            {error}

            <button
              onClick={() => setError("")}
              style={{
                float: "right",
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}>

          <div style={card}>
            <p style={{ color: theme.muted, fontSize: "11px", margin: 0 }}>
              REAL VISITS
            </p>

            <p style={{
              fontSize: "32px",
              fontWeight: 300,
              margin: "6px 0 0",
            }}>
              {visitors.length}
            </p>

            <p style={{
              fontSize: "11px",
              color: theme.muted,
              margin: 0,
            }}>
              {hiddenBotCount} old bot entries hidden
            </p>
          </div>

          <div style={card}>
            <p style={{ color: theme.muted, fontSize: "11px", margin: 0 }}>
              COUNTRIES REACHED
            </p>

            <p style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "#4ADE80",
              margin: "6px 0 0",
            }}>
              {countries.length}
            </p>
          </div>

          <div style={card}>
            <p style={{ color: theme.muted, fontSize: "11px", margin: 0 }}>
              REGISTERED USERS
            </p>

            <p style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "#A78BFA",
              margin: "6px 0 0",
            }}>
              {users.length}
            </p>
          </div>

          <div style={card}>
            <p style={{ color: theme.muted, fontSize: "11px", margin: 0 }}>
              TOTAL REVIEWS
            </p>

            <p style={{
              fontSize: "32px",
              fontWeight: 300,
              margin: "6px 0 0",
            }}>
              {reviews.length}
            </p>
          </div>

          <div style={card}>
            <p style={{ color: theme.muted, fontSize: "11px", margin: 0 }}>
              AVERAGE RATING
            </p>

            <p style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "#FBBF24",
              margin: "6px 0 0",
            }}>
              ★ {avgRating}
            </p>
          </div>

        </div>

        {/* COUNTRY FILTER */}

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "20px 0 8px",
        }}>

          <h3 style={{
            fontSize: "13px",
            margin: 0,
            color: theme.secondary,
          }}>
            🌍 Filter by country
          </h3>

          <button
            onClick={() => setShowBots(!showBots)}
            style={{
              marginLeft: "auto",
              background: theme.card,
              color: theme.muted,
              border: `1px solid ${theme.border}`,
              borderRadius: "999px",
              padding: "6px 12px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {showBots
              ? "Hide bots"
              : `Show ${hiddenBotCount} hidden bots`}
          </button>

        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "18px",
        }}>

          <button
            onClick={() => setCountryFilter("all")}
            style={chip(countryFilter === "all")}
          >
            All • {visitors.length}
          </button>

          {countries.map(([country, count]) => (

            <button
              key={country}
              onClick={() =>
                setCountryFilter(
                  country === countryFilter ? "all" : country
                )
              }
              style={chip(countryFilter === country)}
            >
              {country} • {count}
            </button>

          ))}

        </div>

        {/* TABS */}

        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}>

          <button
            onClick={() => {
              setTab("visitors");
              setCountryFilter("all");
            }}
            style={chip(tab === "visitors")}
          >
            Visitors ({filteredVisitors.length})
          </button>

          <button
            onClick={() => {
              setTab("users");
              setCountryFilter("all");
            }}
            style={chip(tab === "users")}
          >
            Users ({filteredUsers.length})
          </button>

          <button
            onClick={() => {
              setTab("reviews");
              setCountryFilter("all");
            }}
            style={chip(tab === "reviews")}
          >
            Reviews ({filteredReviews.length})
          </button>

        </div>

        {/* SEARCH */}

        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}>

          <input
            type="text"
            autoComplete="off"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              tab === "visitors"
                ? "Search city, country, device..."
                : tab === "users"
                ? "Search name or email..."
                : "Search reviews, name, email..."
            }
            style={inputStyle}
          />

          {tab === "visitors" && (

            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              style={{
                height: "40px",
                borderRadius: "999px",
                background: theme.input,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                padding: "0 12px",
                fontSize: "13px",
              }}
            >
              <option value="all">All countries</option>

              {countries.map(([c]) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}

            </select>

          )}

        </div>

        {/* RECORD LIST */}

        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: "16px",
          overflow: "hidden",
        }}>

          {pageItems.length === 0 && (

            <p style={{
              padding: "30px 20px",
              color: theme.muted,
              textAlign: "center",
              fontSize: "13px",
            }}>
              {tab === "visitors"
                ? "No visitors found."
                : tab === "users"
                ? "No registered users found."
                : "No reviews found."}
            </p>

          )}

          {/* VISITORS */}

          {tab === "visitors" && pageItems.map((v, i) => {

            const identity = v.id ||
              `${v.time}-${v.city}-${v.device}`;

            const deletingThis =
              deleting === `visitors-${identity}`;

            return (

              <div
                key={identity || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >

                <div style={{ minWidth: 0 }}>

                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}>
                    {v.city || "Unknown"}, {v.country}
                  </p>

                  <p style={{
                    margin: "3px 0 0",
                    color: theme.muted,
                    fontSize: "12px",
                  }}>
                    {v.device || "Unknown device"}
                  </p>

                  <p style={{
                    margin: "3px 0 0",
                    color: theme.muted,
                    fontSize: "11px",
                  }}>
                    {v.time
                      ? new Date(v.time).toLocaleString("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </p>

                </div>

                <button
                  onClick={() => handleDelete("visitors", v)}
                  disabled={!!deleting}
                  style={{
                    ...deleteButton,
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  {deletingThis ? "Deleting..." : "🗑 Delete"}
                </button>

              </div>

            );

          })}

          {/* USERS */}

          {tab === "users" && pageItems.map((u, i) => {

            const identity = u.id ||
              `${u.createdAt}-${u.email}`;

            const deletingThis =
              deleting === `users-${identity}`;

            return (

              <div
                key={identity || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >

                <div style={{ minWidth: 0 }}>

                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}>
                    {u.name || "Unnamed user"}
                  </p>

                  <p style={{
                    margin: "3px 0 0",
                    color: theme.muted,
                    fontSize: "12px",
                  }}>
                    {u.email}
                  </p>

                  <p style={{
                    margin: "3px 0 0",
                    color: theme.muted,
                    fontSize: "11px",
                  }}>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-NG")
                      : ""}
                  </p>

                </div>

                <button
                  onClick={() => handleDelete("users", u)}
                  disabled={!!deleting}
                  style={{
                    ...deleteButton,
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  {deletingThis ? "Deleting..." : "🗑 Delete"}
                </button>

              </div>

            );

          })}

          {/* REVIEWS */}

          {tab === "reviews" && pageItems.map((r, i) => {

            const identity = r.id ||
              `${r.createdAt}-${r.email}-${r.comment}`;

            const deletingThis =
              deleting === `reviews-${identity}`;

            return (

              <div
                key={identity || i}
                style={{
                  padding: "16px",
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}>

                  <div style={{ minWidth: 0 }}>

                    <p style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 700,
                    }}>
                      {r.name || "Anonymous"}
                    </p>

                    <p style={{
                      margin: "3px 0",
                      color: theme.muted,
                      fontSize: "12px",
                    }}>
                      {r.email || "No email provided"}
                    </p>

                    <p style={{
                      margin: "5px 0",
                      color: "#FBBF24",
                      fontSize: "14px",
                    }}>
                      {"★".repeat(
                        Math.min(5, Math.max(0, Math.floor(Number(r.rating) || 0))
                      )}
                      <span style={{ color: theme.muted, fontSize: "11px" }}>
                        {" "}{r.rating || 0}/5
                      </span>
                    </p>

                  </div>

                  <button
                    onClick={() => handleDelete("reviews", r)}
                    disabled={!!deleting}
                    style={{
                      ...deleteButton,
                      opacity: deleting ? 0.5 : 1,
                    }}
                  >
                    {deletingThis ? "Deleting..." : "🗑 Delete"}
                  </button>

                </div>

                <p style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: theme.secondary,
                  margin: "10px 0",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {r.comment || "No comment"}
                </p>

                <p style={{
                  fontSize: "11px",
                  color: theme.muted,
                  margin: 0,
                }}>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </p>

              </div>

            );

          })}

        </div>

        {/* PAGINATION */}

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
          gap: "10px",
        }}>

          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            style={{
              background: theme.card,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: "9px 16px",
              borderRadius: "999px",
              opacity: safePage <= 1 ? 0.4 : 1,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            ← Prev
          </button>

          <p style={{
            fontSize: "12px",
            color: theme.muted,
            margin: 0,
            textAlign: "center",
          }}>
            Page {safePage} of {totalPages} • {list.length} records
          </p>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            style={{
              background: theme.active,
              color: theme.activeText,
              border: "none",
              padding: "9px 16px",
              borderRadius: "999px",
              opacity: safePage >= totalPages ? 0.4 : 1,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Next →
          </button>

        </div>

      </div>

    </div>
  );
}

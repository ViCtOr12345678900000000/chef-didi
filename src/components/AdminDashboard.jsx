import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Eye,
  Globe,
  Star,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Smartphone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity,
  Layers,
  Flame,
  RotateCcw,
  EyeOff,
  Clock,
  BadgeCheck,
  ArrowUpRight,
  MapPin,
  Monitor,
  Tablet,
  TrendingUp,
} from "lucide-react";

const PAGE_SIZE = 15;

const DATE_FORMAT = {
  dateStyle: "medium",
  timeStyle: "short",
};

function normalizeCountry(c) {
  const s = String(c || "Unknown").trim();

  const map = {
    NG: "Nigeria",
    Nigeria: "Nigeria",
    US: "United States",
    USA: "United States",
    "United States": "United States",
    GB: "United Kingdom",
    UK: "United Kingdom",
    GH: "Ghana",
    KE: "Kenya",
    ZA: "South Africa",
    CA: "Canada",
    DE: "Germany",
  };

  return map[s] || map[s.toUpperCase()] || s;
}

function getVisitorDate(v) {
  const value = v.time || v.createdAt;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  if (!value) return "Unknown time";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString("en-NG", DATE_FORMAT);
}

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
    "frankfurt am main",
  ];

  if (datacenters.some((d) => city.includes(d))) return true;

  if (city === "unknown" && v.device === "Other") return true;

  return false;
}

const METRIC_STYLES = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    label: "text-emerald-600",
    border: "hover:border-emerald-200",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    label: "text-rose-600",
    border: "hover:border-rose-200",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    label: "text-violet-600",
    border: "hover:border-violet-200",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    label: "text-amber-600",
    border: "hover:border-amber-200",
  },
};

export default function AdminDashboard() {
  const [data, setData] = useState({
    visitors: [],
    users: [],
    reviews: [],
  });

  const [totalRegisteredInUpstash, setTotalRegisteredInUpstash] =
    useState(0);

  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [activeTab, setActiveTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [onlyReturning, setOnlyReturning] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showBots, setShowBots] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // FETCH DATA
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [myNumberRes, debugRes] = await Promise.all([
        fetch("/api/my-number"),
        fetch("/api/debug").catch(() => null),
      ]);

      if (!myNumberRes.ok) {
        throw new Error("Unable to fetch dashboard data");
      }

      const json = await myNumberRes.json();

      let debug = null;

      if (debugRes && debugRes.ok) {
        try {
          debug = await debugRes.json();
        } catch {}
      }

      const debugUsersByEmail = new Map();

      if (debug?.users) {
        for (const u of debug.users) {
          if (u.email) {
            debugUsersByEmail.set(
              u.email.toLowerCase().trim(),
              u
            );
          }
        }
      }

      const mergedUsers = (json.users || []).map((u) => {
        const key = String(u.email || "").toLowerCase().trim();

        const fromDebug = debugUsersByEmail.get(key);

        if (fromDebug) return { ...u, ...fromDebug };

        return u;
      });

      for (const [email, du] of debugUsersByEmail) {
        if (
          !mergedUsers.some(
            (u) =>
              String(u.email || "").toLowerCase().trim() === email
          )
        ) {
          mergedUsers.push(du);
        }
      }

      setData({
        visitors: json.visitors || [],
        users: mergedUsers,
        reviews: json.reviews || [],
      });

      if (debug) {
        setTotalRegisteredInUpstash(
          debug.totalRegisteredInUpstash ??
            debug.countItems ??
            mergedUsers.length
        );

        setHiddenUsers(debug.hiddenUsers || []);
      } else {
        setTotalRegisteredInUpstash(mergedUsers.length);
        setHiddenUsers([]);
      }
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // AUTO REFRESH
  useEffect(() => {
    const onFocus = () => fetchData();

    const onVisible = () => {
      if (!document.hidden) fetchData();
    };

    window.addEventListener("focus", onFocus);

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);

      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, selectedCountry, showBots, onlyReturning]);

  // RESTORE USER
  const handleRestore = async (email) => {
    if (!confirm(`Restore ${email}?`)) return;

    await fetch(`/api/debug?restore=${encodeURIComponent(email)}`);

    fetchData();
  };

  // HIDE USER
  const handleHideUser = async (email) => {
    if (!confirm(`Hide ${email}? It goes to Hidden, not deleted.`))
      return;

    await fetch(`/api/debug?hide=${encodeURIComponent(email)}`);

    fetchData();
  };

  // VISITORS
  const allVisitors = useMemo(() => {
    const raw = (data.visitors || []).map((v) => ({
      ...v,
      country: normalizeCountry(v.country),
    }));

    const hashStats = {};

    raw.forEach((v) => {
      if (v.visitorHash) {
        if (!hashStats[v.visitorHash]) {
          hashStats[v.visitorHash] = {
            maxVisits: 1,
            cities: new Set(),
          };
        }

        hashStats[v.visitorHash].maxVisits = Math.max(
          hashStats[v.visitorHash].maxVisits,
          v.visitNumber || 1
        );

        if (v.city && v.city !== "Unknown") {
          hashStats[v.visitorHash].cities.add(v.city);
        }
      }
    });

    return raw
      .map((v) => {
        const stats = v.visitorHash
          ? hashStats[v.visitorHash]
          : null;

        return {
          ...v,
          totalVisits: stats
            ? stats.maxVisits
            : v.visitNumber || 1,

          uniqueCities: stats
            ? Array.from(stats.cities)
            : [],
        };
      })
      // NEW: Most recent visitor first
      .sort((a, b) => {
        return (
          (getVisitorDate(b)?.getTime() || 0) -
          (getVisitorDate(a)?.getTime() || 0)
        );
      });
  }, [data.visitors]);

  const realVisitors = useMemo(
    () =>
      showBots
        ? allVisitors
        : allVisitors.filter((v) => !isOldBot(v)),
    [allVisitors, showBots]
  );

  const hiddenBotCount = allVisitors.length - realVisitors.length;

  const returningVisitorsCount = useMemo(() => {
    const s = new Set();

    realVisitors.forEach((v) => {
      if (v.totalVisits > 1 && v.visitorHash) {
        s.add(v.visitorHash);
      }
    });

    return s.size;
  }, [realVisitors]);

  // COUNTRIES
  const countries = useMemo(() => {
    const map = {};

    realVisitors.forEach((v) => {
      const c = v.country || "Unknown";

      map[c] = (map[c] || 0) + 1;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [realVisitors]);

  const topCountries = useMemo(() => {
    const maxCount = countries.length > 0 ? countries[0][1] : 1;

    return countries.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / maxCount) * 100),
    }));
  }, [countries]);

  // FILTER VISITORS
  const filteredVisitors = useMemo(() => {
    return realVisitors.filter((v) => {
      if (selectedCountry !== "all" && v.country !== selectedCountry)
        return false;

      if (onlyReturning && v.totalVisits < 2) return false;

      if (
        search &&
        !`${v.city} ${v.country} ${v.device} ${
          v.visitorHash || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [realVisitors, search, selectedCountry, onlyReturning]);

  // USERS
  const filteredUsers = useMemo(() => {
    const sorted = [...(data.users || [])].sort(
      (a, b) =>
        (b.visitCount || 0) - (a.visitCount || 0) ||
        new Date(b.lastSeen || b.createdAt || 0) -
          new Date(a.lastSeen || a.createdAt || 0)
    );

    if (!search) return sorted;

    const s = search.toLowerCase();

    return sorted.filter((u) =>
      `${u.name || ""} ${u.email || ""} ${u.phone || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [data.users, search]);

  // REVIEWS
  const filteredReviews = useMemo(() => {
    if (!search) return data.reviews;

    const s = search.toLowerCase();

    return data.reviews.filter((r) =>
      `${r.name} ${r.comment} ${r.email}`
        .toLowerCase()
        .includes(s)
    );
  }, [data.reviews, search]);

  // PAGINATION
  const currentList =
    activeTab === "visitors"
      ? filteredVisitors
      : activeTab === "users"
        ? filteredUsers
        : filteredReviews;

  const totalPages = Math.max(
    1,
    Math.ceil(currentList.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const pageItems = currentList.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // DELETE
  const handleDelete = async (item, type) => {
    if (!confirm("Are you sure you want to delete this record?"))
      return;

    setDeletingId(item.id || item.createdAt || item.time);

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
          time: item.time,
          comment: item.comment,
          email: item.email,
          city: item.city,
        }),
      });

      if (res.ok) fetchData();
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeletingId(null);
    }
  };

  // METRICS
  const metrics = [
    {
      title: "Total Page Views",
      value: realVisitors.length,
      label: "Clean traffic",
      description: `${hiddenBotCount} bots excluded`,
      icon: Eye,
      color: "emerald",
    },
    {
      title: "Repeat Visitors",
      value: returningVisitorsCount,
      label: "High interest",
      description: "Visited 2+ times",
      icon: Flame,
      color: "rose",
    },
    {
      title: "Registered Users",
      value: totalRegisteredInUpstash,
      label: "Upstash database",
      description: `${data.users.length} visible · ${hiddenUsers.length} hidden`,
      icon: Users,
      color: "violet",
    },
    {
      title: "User Feedback",
      value: data.reviews.length,
      label: "Reviews",
      description: `${countries.length} countries reached`,
      icon: Star,
      color: "amber",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 py-6">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                Chef Didi Analytics
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-3">
                Executive Dashboard
              </h1>

              <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />

                Total in Upstash:

                <span className="font-bold text-slate-800">
                  {totalRegisteredInUpstash}
                </span>

                <span className="text-slate-300">•</span>

                Visible:

                <span className="font-semibold text-slate-700">
                  {data.users.length}
                </span>

                <span className="text-slate-300">•</span>

                Hidden:

                <span className="font-semibold text-amber-600">
                  {hiddenUsers.length}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>

                <span className="text-xs font-semibold text-emerald-700">
                  Redis Connected
                </span>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 transition text-white px-5 py-3 rounded-xl text-xs font-semibold shadow-lg shadow-slate-900/10 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Sync Metrics
              </button>

            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* METRIC CARDS */}
        <section>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Overview
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Your platform performance at a glance
              </p>
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Live metrics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              const style = METRIC_STYLES[metric.color];

              return (
                <div
                  key={index}
                  className={`bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${style.border}`}
                >

                  <div className="flex items-center justify-between mb-5">

                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {metric.title}
                    </span>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                  </div>

                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {metric.value.toLocaleString()}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">

                    <span className={`text-[11px] font-bold ${style.label}`}>
                      {metric.label}
                    </span>

                    <span className="w-1 h-1 rounded-full bg-slate-300" />

                    <span className="text-[11px] text-slate-400">
                      {metric.description}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        </section>

        {/* HIDDEN USERS */}
        {hiddenUsers.length > 0 && (
          <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <EyeOff className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hidden Users ({hiddenUsers.length})
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    These accounts are hidden, not deleted.
                  </p>
                </div>

              </div>

              <button
                onClick={() => setShowHidden(!showHidden)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition"
              >
                {showHidden ? "Hide list" : "View hidden users"}
              </button>

            </div>

            {showHidden && (
              <div className="mt-5 space-y-2">

                {hiddenUsers.map((u) => (
                  <div
                    key={u.email}
                    className="flex flex-wrap items-center justify-between gap-3 bg-white border border-amber-100 rounded-xl p-4"
                  >

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {u.name || "No name"}
                      </p>

                      <p className="text-xs text-violet-600 mt-1">
                        {u.email}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1">
                        {u.visitCount || 0} visits
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestore(u.email)}
                      className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>

                  </div>
                ))}

              </div>
            )}

          </section>
        )}

        {/* ANALYTICS PANELS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* TOP COUNTRIES */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Top Regions
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Visitor distribution by country
                  </p>
                </div>

              </div>

              <ArrowUpRight className="w-4 h-4 text-slate-300" />

            </div>

            <div className="space-y-5">

              {topCountries.map((item, index) => (
                <div key={index}>

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-xs font-semibold text-slate-700">
                      {item.name}
                    </span>

                    <span className="text-xs font-bold text-slate-500 tabular-nums">
                      {item.count} hits
                    </span>

                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />

                  </div>

                </div>
              ))}

              {topCountries.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">
                  No location metrics available
                </p>
              )}

            </div>

          </div>

          {/* ENGAGEMENT */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Engagement & Retention
                </h3>

                <p className="text-[11px] text-slate-400 mt-1">
                  Visitor tracking and platform activity
                </p>
              </div>

            </div>

            <div className="space-y-1">

              {[
                {
                  label: "Total raw logs captured",
                  value: allVisitors.length,
                  color: "text-slate-900",
                },
                {
                  label: "Returning visitors",
                  value: returningVisitorsCount,
                  color: "text-rose-600",
                },
                {
                  label: "Filtered bot traffic",
                  value: hiddenBotCount,
                  color: "text-amber-600",
                },
                {
                  label: "Total registered users",
                  value: totalRegisteredInUpstash,
                  color: "text-violet-600",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
                >

                  <span className="text-xs text-slate-500">
                    {item.label}
                  </span>

                  <span className={`text-sm font-bold tabular-nums ${item.color}`}>
                    {item.value.toLocaleString()}
                  </span>

                </div>
              ))}

            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">

              <span className="text-[10px] text-slate-400">
                HttpOnly Cookie + SHA-256
              </span>

              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Tracking Active
              </span>

            </div>

          </div>

        </section>

        {/* VISITOR FILTERS */}
        {activeTab === "visitors" && (
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Traffic Filters
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    Refine your visitor analytics
                  </p>
                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  onClick={() => setOnlyReturning(!onlyReturning)}
                  className={`flex items-center gap-2 text-[11px] font-semibold px-3.5 py-2 rounded-xl border transition ${
                    onlyReturning
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />

                  {onlyReturning
                    ? "Repeat Visitors Only"
                    : "Repeat Visitors (2+)"}
                </button>

                <button
                  onClick={() => setShowBots(!showBots)}
                  className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />

                  {showBots
                    ? "Hide Bot Traffic"
                    : `Audit ${hiddenBotCount} Bots`}
                </button>

              </div>

            </div>

            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">

              <button
                onClick={() => setSelectedCountry("all")}
                className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition ${
                  selectedCountry === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                All Countries · {realVisitors.length}
              </button>

              {countries.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() =>
                    setSelectedCountry(
                      selectedCountry === c ? "all" : c
                    )
                  }
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition ${
                    selectedCountry === c
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c} · {n}
                </button>
              ))}

            </div>

          </section>
        )}

        {/* TABS AND SEARCH */}
        <section className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-fit max-w-full overflow-x-auto">

            {["visitors", "users", "reviews"].map((tab) => {

              const count =
                tab === "visitors"
                  ? filteredVisitors.length
                  : tab === "users"
                    ? filteredUsers.length
                    : filteredReviews.length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    activeTab === tab
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}

                  <span className={`ml-1.5 ${
                    activeTab === tab
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

          </div>

          <div className="relative w-full lg:max-w-md">

            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "visitors"
                  ? "Search city, country, device or ID..."
                  : activeTab === "users"
                    ? "Search name, email or phone..."
                    : "Search review or author..."
              }
              className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition shadow-sm"
            />

          </div>

        </section>

        {/* DATA TABLE */}
        <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">

          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activeTab === "visitors"
                  ? "Visitor Activity"
                  : activeTab === "users"
                    ? "Registered Accounts"
                    : "Customer Reviews"}
              </h3>

              <p className="text-[11px] text-slate-400 mt-1">
                {currentList.length} records found
              </p>
            </div>

            {activeTab === "visitors" && (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                Newest first
              </div>
            )}

          </div>

          {loading ? (

            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
              Fetching latest dataset...
            </div>

          ) : pageItems.length === 0 ? (

            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-slate-300" />
              </div>

              <p className="text-sm font-semibold text-slate-700">
                No records found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search or filters.
              </p>
            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {/* VISITORS */}
              {activeTab === "visitors" &&
                pageItems.map((v, idx) => {

                  const visitorDate = getVisitorDate(v);

                  return (
                    <div
                      key={v.id || `${v.visitorHash}-${visitorDate?.getTime() || idx}-${idx}`}
                      className="group px-5 sm:px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                    >

                      <div className="min-w-0 flex-1 space-y-2">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-bold text-sm text-slate-900">
                            {v.city || "Unknown"}, {v.country}
                          </span>

                          {v.totalVisits > 1 && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2.5 py-1 rounded-full font-bold">
                              <Flame className="w-3 h-3" />
                              Returning · {v.totalVisits}x
                            </span>
                          )}

                          {v.uniqueCities?.length > 1 && (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-1 rounded-full font-semibold">
                              {v.uniqueCities.length} cities
                            </span>
                          )}

                          {isOldBot(v) && (
                            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] px-2 py-1 rounded-full font-bold">
                              Bot Log
                            </span>
                          )}

                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">

                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            {v.device || "Unknown Device"}
                          </span>

                          {v.visitorHash && (
                            <button
                              onClick={() => setSearch(v.visitorHash)}
                              className="text-[10px] font-mono text-slate-500 hover:text-violet-600 bg-slate-100 hover:bg-violet-50 px-2 py-1 rounded-md transition"
                              title="Filter visits by this visitor ID"
                            >
                              ID: {v.visitorHash}
                            </button>
                          )}

                          {/* NEW: VISIBLE DATE AND TIME */}
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-violet-500" />

                            <span className="font-medium">
                              {visitorDate
                                ? visitorDate.toLocaleString("en-NG", DATE_FORMAT)
                                : "Time unavailable"}
                            </span>
                          </span>

                        </div>

                      </div>

                      <button
                        onClick={() => handleDelete(v, "visitors")}
                        disabled={deletingId === (v.id || v.time)}
                        className="shrink-0 p-2.5 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete visitor record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  );
                })}

              {/* USERS */}
              {activeTab === "users" &&
                pageItems.map((u, idx) => (
                  <div
                    key={u.id || u.email || idx}
                    className="group px-5 sm:px-6 py-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                  >

                    <div className="min-w-0 space-y-1">

                      <p className="font-bold text-sm text-slate-900 truncate">
                        {u.name || "No name"}
                      </p>

                      <p className="text-xs text-violet-600 truncate">
                        {u.email}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">

                        {u.phone && <span>{u.phone}</span>}

                        <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-600 border border-violet-100 px-2 py-1 rounded-full font-bold">
                          <Flame className="w-3 h-3" />
                          {u.visitCount || 0} visits
                        </span>

                        {u.lastSeen && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(u.lastSeen)}
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="flex items-center gap-2 shrink-0">

                      <span className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />

                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString(
                              "en-NG",
                              { dateStyle: "medium" }
                            )
                          : "—"}
                      </span>

                      <button
                        onClick={() => handleHideUser(u.email)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition"
                        title="Hide user"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(u, "users")}
                        disabled={deletingId === (u.id || u.createdAt)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}

              {/* REVIEWS */}
              {activeTab === "reviews" &&
                pageItems.map((r, idx) => (
                  <div
                    key={r.id || r.createdAt || idx}
                    className="px-5 sm:px-6 py-5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition"
                  >

                    <div className="space-y-2 max-w-2xl">

                      <div className="flex flex-wrap items-center gap-3">

                        <span className="font-bold text-sm text-slate-900">
                          {r.name}
                        </span>

                        <div className="flex items-center text-amber-500 text-xs">
                          {"★".repeat(r.rating || 5)}
                        </div>

                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {r.comment}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        {r.email || "Guest"}
                      </p>

                    </div>

                    <div className="flex items-center gap-3 shrink-0">

                      <span className="hidden sm:block text-[11px] text-slate-400 whitespace-nowrap">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString(
                              "en-NG",
                              { dateStyle: "medium" }
                            )
                          : ""}
                      </span>

                      <button
                        onClick={() => handleDelete(r, "reviews")}
                        disabled={deletingId === (r.id || r.createdAt)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}

            </div>
          )}

        </section>

        {/* PAGINATION */}
        <section className="flex items-center justify-between text-xs py-2">

          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition font-semibold shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-slate-400">
            Page{" "}
            <strong className="text-slate-900">
              {safePage}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-900">
              {totalPages}
            </strong>

            <span className="hidden sm:inline">
              {" "}· Total{" "}
              <strong className="text-slate-900">
                {currentList.length}
              </strong>{" "}
              records
            </span>
          </span>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition font-semibold shadow-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>

        </section>

        {/* FOOTER */}
        <footer className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">

          <p className="text-[10px] text-slate-400">
            Chef Didi Analytics Suite
          </p>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Dashboard operational
          </div>

        </footer>

      </main>
    </div>
  );
}

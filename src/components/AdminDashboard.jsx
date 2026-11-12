import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, Eye, Globe, Star, RefreshCw, Search, ShieldAlert, Trash2,
  Smartphone, Calendar, ChevronLeft, ChevronRight, Sparkles, Activity,
  Layers, Flame, RotateCcw, EyeOff, Clock, BadgeCheck, ArrowUpRight,
} from "lucide-react";

const PAGE_SIZE = 15;

const normalizeCountry = (c) => {
  const map = {
    NG: "Nigeria", Nigeria: "Nigeria", US: "United States",
    USA: "United States", GB: "United Kingdom", UK: "United Kingdom",
    GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada",
    DE: "Germany",
  };
  const value = String(c || "Unknown").trim();
  return map[value] || map[value.toUpperCase()] || value;
};

const getDate = (v) => {
  const date = new Date(v.time || v.createdAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatDate = (value, options = {
  dateStyle: "medium", timeStyle: "short",
}) => {
  if (!value || !getDate({ time: value })) return "Unknown time";
  return new Date(value).toLocaleString("en-NG", options);
};

// Only exclude recognized datacenter locations.
// Unknown cities and Other devices remain visible.
const isOldBot = (v) => {
  const city = String(v.city || "").toLowerCase();
  const bots = [
    "san jose", "ashburn", "boardman", "dulles", "prineville",
    "hillsboro", "quincy", "the dalles", "council bluffs",
    "moncks corner", "frankfurt am main",
  ];

  return bots.some((d) => city.includes(d));
};

const styles = {
  emerald: ["bg-emerald-50 text-emerald-600", "text-emerald-600"],
  rose: ["bg-rose-50 text-rose-600", "text-rose-600"],
  violet: ["bg-violet-50 text-violet-600", "text-violet-600"],
  amber: ["bg-amber-50 text-amber-600", "text-amber-600"],
};

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const [icon, label] = styles[metric.color];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-center mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {metric.title}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${icon}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="text-3xl font-bold text-slate-900 tabular-nums">
        {metric.value.toLocaleString()}
      </p>

      <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
        <span className={`font-bold ${label}`}>{metric.label}</span>
        <span className="text-slate-400">• {metric.description}</span>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
        <Icon size={19} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-[11px] text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    visitors: [], users: [], reviews: [],
  });

  const [totalRegistered, setTotalRegistered] = useState(0);
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [activeTab, setActiveTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [onlyReturning, setOnlyReturning] = useState(false);
  const [showBots, setShowBots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  // FETCH DATA - CACHE DISABLED
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const timestamp = Date.now();

      const [res, debugRes] = await Promise.all([
        fetch(`/api/my-number?t=${timestamp}`, {
          cache: "no-store",
        }),
        fetch(`/api/debug?t=${timestamp}`, {
          cache: "no-store",
        }).catch(() => null),
      ]);

      if (!res.ok) throw new Error("Failed to load dashboard");

      const json = await res.json();
      let debug = null;

      if (debugRes?.ok) {
        try {
          debug = await debugRes.json();
        } catch {}
      }

      const debugUsers = new Map(
        (debug?.users || [])
          .filter(u => u.email)
          .map(u => [u.email.toLowerCase().trim(), u])
      );

      const users = (json.users || []).map(u => {
        const key = String(u.email || "").toLowerCase().trim();
        return { ...u, ...(debugUsers.get(key) || {}) };
      });

      debugUsers.forEach((u, email) => {
        if (!users.some(x =>
          String(x.email || "").toLowerCase().trim() === email
        )) users.push(u);
      });

      setData({
        visitors: json.visitors || [],
        users,
        reviews: json.reviews || [],
      });

      setTotalRegistered(
        debug?.totalRegisteredInUpstash ??
        debug?.countItems ?? users.length
      );

      setHiddenUsers(debug?.hiddenUsers || []);

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) fetchData();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, selectedCountry, showBots, onlyReturning]);

  // USER ACTIONS
  const handleRestore = async (email) => {
    if (!confirm(`Restore ${email}?`)) return;
    await fetch(`/api/debug?restore=${encodeURIComponent(email)}`);
    fetchData();
  };

  const handleHide = async (email) => {
    if (!confirm(`Hide ${email}? It goes to Hidden, not deleted.`)) return;
    await fetch(`/api/debug?hide=${encodeURIComponent(email)}`);
    fetchData();
  };

  const handleDelete = async (item, type) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const id = item.id || item.createdAt || item.time;
    setDeletingId(id);

    try {
      const res = await fetch("/api/my-number", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, id: item.id, createdAt: item.createdAt,
          time: item.time, comment: item.comment,
          email: item.email, city: item.city,
        }),
      });

      if (res.ok) await fetchData();

    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // VISITOR PROCESSING
  const allVisitors = useMemo(() => {
    const raw = data.visitors.map(v => ({
      ...v, country: normalizeCountry(v.country),
    }));

    const stats = {};

    raw.forEach(v => {
      if (!v.visitorHash) return;

      const key = v.visitorHash;
      stats[key] ||= { max: 1, cities: new Set() };

      stats[key].max = Math.max(
        stats[key].max, v.visitNumber || 1
      );

      if (v.city && v.city !== "Unknown") {
        stats[key].cities.add(v.city);
      }
    });

    return raw.map(v => ({
      ...v,
      totalVisits: stats[v.visitorHash]?.max || v.visitNumber || 1,
      uniqueCities: [...(stats[v.visitorHash]?.cities || [])],
    })).sort((a, b) => getDate(b) - getDate(a));

  }, [data.visitors]);

  const realVisitors = useMemo(
    () => showBots
      ? allVisitors
      : allVisitors.filter(v => !isOldBot(v)),
    [allVisitors, showBots]
  );

  const hiddenBotCount = allVisitors.length - realVisitors.length;

  const returningCount = useMemo(() => {
    const ids = new Set();

    realVisitors.forEach(v => {
      if (v.totalVisits > 1 && v.visitorHash) {
        ids.add(v.visitorHash);
      }
    });

    return ids.size;
  }, [realVisitors]);

  const countries = useMemo(() => {
    const map = {};

    realVisitors.forEach(v => {
      map[v.country] = (map[v.country] || 0) + 1;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [realVisitors]);

  const topCountries = useMemo(() => {
    const max = countries[0]?.[1] || 1;

    return countries.slice(0, 5).map(([name, count]) => ({
      name, count,
      percentage: Math.round(count / max * 100),
    }));
  }, [countries]);

  const filteredVisitors = useMemo(() =>
    realVisitors.filter(v => {
      if (selectedCountry !== "all" && v.country !== selectedCountry) {
        return false;
      }

      if (onlyReturning && v.totalVisits < 2) return false;

      return !search ||
        `${v.city} ${v.country} ${v.device} ${v.visitorHash || ""}`
          .toLowerCase().includes(search.toLowerCase());
    }),
    [realVisitors, selectedCountry, onlyReturning, search]
  );

  // USERS AND REVIEWS
  const filteredUsers = useMemo(() => {
    const sorted = [...data.users].sort((a, b) =>
      (b.visitCount || 0) - (a.visitCount || 0) ||
      new Date(b.lastSeen || b.createdAt || 0) -
      new Date(a.lastSeen || a.createdAt || 0)
    );

    return search
      ? sorted.filter(u =>
          `${u.name || ""} ${u.email || ""} ${u.phone || ""}`
            .toLowerCase().includes(search.toLowerCase())
        )
      : sorted;
  }, [data.users, search]);

  const filteredReviews = useMemo(() =>
    search
      ? data.reviews.filter(r =>
          `${r.name} ${r.comment} ${r.email}`
            .toLowerCase().includes(search.toLowerCase())
        )
      : data.reviews,
    [data.reviews, search]
  );

  const currentList = activeTab === "visitors"
    ? filteredVisitors
    : activeTab === "users"
      ? filteredUsers
      : filteredReviews;

  const totalPages = Math.max(
    1, Math.ceil(currentList.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const pageItems = currentList.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // DASHBOARD METRICS
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
      value: returningCount,
      label: "High interest",
      description: "Visited 2+ times",
      icon: Flame,
      color: "rose",
    },
    {
      title: "Registered Users",
      value: totalRegistered,
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

  const tabs = ["visitors", "users", "reviews"];

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 font-sans selection:bg-violet-200">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-600">
              <Sparkles size={17} /> Chef Didi Analytics
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">
              Executive Dashboard
            </h1>

            <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
              <BadgeCheck size={14} className="text-emerald-500" />
              Total in Upstash:
              <b className="text-slate-800">{totalRegistered}</b>
              • Visible:
              <b className="text-slate-800">{data.users.length}</b>
              • Hidden:
              <b className="text-amber-600">{hiddenUsers.length}</b>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <Activity size={15} /> Redis Connected
            </span>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Sync Metrics
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* FOUR METRIC CARDS */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-bold">Overview</h2>
            <p className="text-xs text-slate-400 mt-1">
              Platform performance at a glance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metrics.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </section>

        {/* HIDDEN USERS */}
        {hiddenUsers.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <EyeOff className="text-amber-600" size={20} />
                <div>
                  <h3 className="text-sm font-bold">
                    Hidden Users ({hiddenUsers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hidden, not deleted.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHidden(!showHidden)}
                className="px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-amber-700"
              >
                {showHidden ? "Hide list" : "View users"}
              </button>
            </div>

            {showHidden && hiddenUsers.map(u => (
              <div
                key={u.email}
                className="mt-3 bg-white rounded-xl p-4 flex justify-between items-center gap-3"
              >
                <div>
                  <p className="text-sm font-bold">{u.name || "No name"}</p>
                  <p className="text-xs text-violet-600">{u.email}</p>
                </div>

                <button
                  onClick={() => handleRestore(u.email)}
                  className="flex gap-2 items-center bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                >
                  <RotateCcw size={14} /> Restore
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ANALYTICS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <SectionHeading
              icon={Globe}
              title="Top Regions"
              description="Visitor distribution by country"
            />

            <div className="space-y-5 mt-7">
              {topCountries.map(item => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-slate-400">
                      {item.count} hits
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {!topCountries.length && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No location metrics available
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <SectionHeading
              icon={Activity}
              title="Engagement & Retention"
              description="Visitor tracking and platform activity"
            />

            <div className="mt-5 divide-y divide-slate-100">
              {[
                ["Total raw logs captured", allVisitors.length, "text-slate-900"],
                ["Returning visitors", returningCount, "text-rose-600"],
                ["Filtered bot traffic", hiddenBotCount, "text-amber-600"],
                ["Registered users", totalRegistered, "text-violet-600"],
              ].map(([label, value, color]) => (
                <div key={label} className="py-4 flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <b className={color}>{value.toLocaleString()}</b>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
              <span>HttpOnly Cookie + SHA-256</span>
              <span className="text-emerald-600 font-bold">
                ● Tracking Active
              </span>
            </div>
          </div>
        </section>

        {/* VISITOR FILTERS */}
        {activeTab === "visitors" && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <SectionHeading
                icon={Layers}
                title="Traffic Filters"
                description="Refine your visitor analytics"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOnlyReturning(!onlyReturning)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold ${
                    onlyReturning
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <Flame size={14} />
                  {onlyReturning ? "Repeat Only" : "Repeat Visitors (2+)"}
                </button>

                <button
                  onClick={() => setShowBots(!showBots)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-semibold"
                >
                  <ShieldAlert size={14} />
                  {showBots ? "Hide Bots" : `Audit ${hiddenBotCount} Bots`}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
              {[["all", realVisitors.length], ...countries].map(([country, count]) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition ${
                    selectedCountry === country
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-600"
                  }`}
                >
                  {country === "all" ? "All Countries" : country} · {count}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TABS + SEARCH */}
        <section className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
            {tabs.map(tab => {
              const count = tab === "visitors"
                ? filteredVisitors.length
                : tab === "users"
                  ? filteredUsers.length
                  : filteredReviews.length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                  <span className="opacity-60"> {count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
        </section>

        {/* DATA TABLE */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
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
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <Clock size={12} className="inline mr-1" />
                Newest first
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <RefreshCw size={22} className="animate-spin mx-auto mb-3 text-violet-500" />
              Fetching latest dataset...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              No matching records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {/* VISITORS */}
              {activeTab === "visitors" && pageItems.map((v, i) => (
                <div
                  key={v.id || `${v.visitorHash}-${getDate(v)}-${i}`}
                  className="group px-5 sm:px-6 py-5 flex justify-between items-center gap-4 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm text-slate-900">
                        {v.city || "Unknown"}, {v.country}
                      </b>

                      {v.totalVisits > 1 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                          <Flame size={11} className="inline" />
                          {" "}Returning · {v.totalVisits}x
                        </span>
                      )}

                      {v.uniqueCities.length > 1 && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {v.uniqueCities.length} cities
                        </span>
                      )}

                      {isOldBot(v) && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          Bot Log
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Smartphone size={14} />
                        {v.device || "Unknown Device"}
                      </span>

                      {v.visitorHash && (
                        <button
                          onClick={() => setSearch(v.visitorHash)}
                          className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded hover:text-violet-600"
                        >
                          ID: {v.visitorHash}
                        </button>
                      )}

                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-violet-500" />
                        {v.time || v.createdAt
                          ? formatDate(v.time || v.createdAt)
                          : "Time unavailable"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(v, "visitors")}
                    disabled={deletingId === (v.id || v.time)}
                    className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              {/* USERS */}
              {activeTab === "users" && pageItems.map((u, i) => (
                <div
                  key={u.id || u.email || i}
                  className="px-5 sm:px-6 py-5 flex justify-between items-center gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 space-y-1">
                    <b className="text-sm text-slate-900">
                      {u.name || "No name"}
                    </b>

                    <p className="text-xs text-violet-600 truncate">
                      {u.email}
                    </p>

                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                      {u.phone && <span>{u.phone}</span>}

                      <span className="text-violet-600">
                        <Flame size={12} className="inline" />
                        {" "}{u.visitCount || 0} visits
                      </span>

                      {u.lastSeen && (
                        <span>
                          <Clock size={12} className="inline" />
                          {" "}{formatDate(u.lastSeen)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center shrink-0">
                    <span className="hidden md:block text-[11px] text-slate-400">
                      {u.createdAt
                        ? formatDate(u.createdAt, { dateStyle: "medium" })
                        : "—"}
                    </span>

                    <button
                      onClick={() => handleHide(u.email)}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-amber-600"
                    >
                      <EyeOff size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(u, "users")}
                      disabled={deletingId === (u.id || u.createdAt)}
                      className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* REVIEWS */}
              {activeTab === "reviews" && pageItems.map((r, i) => (
                <div
                  key={r.id || r.createdAt || i}
                  className="px-5 sm:px-6 py-5 flex justify-between gap-4 hover:bg-slate-50"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap gap-3 items-center">
                      <b className="text-sm">{r.name}</b>
                      <span className="text-amber-500 text-xs">
                        {"★".repeat(r.rating || 5)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {r.comment}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {r.email || "Guest"}
                    </p>
                  </div>

                  <div className="flex gap-3 items-center shrink-0">
                    <span className="hidden sm:block text-[11px] text-slate-400">
                      {r.createdAt
                        ? formatDate(r.createdAt, { dateStyle: "medium" })
                        : ""}
                    </span>

                    <button
                      onClick={() => handleDelete(r, "reviews")}
                      disabled={deletingId === (r.id || r.createdAt)}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PAGINATION */}
        <section className="flex justify-between items-center py-2 text-xs">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span className="text-slate-400">
            Page <b className="text-slate-900">{safePage}</b> of{" "}
            <b className="text-slate-900">{totalPages}</b>
            <span className="hidden sm:inline">
              {" "}· {currentList.length} records
            </span>
          </span>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 pt-5 flex justify-between text-[10px] text-slate-400">
          <span>Chef Didi Analytics Suite</span>
          <span className="text-emerald-600">
            ● Dashboard Operational
          </span>
        </footer>

      </main>
    </div>
  );
}

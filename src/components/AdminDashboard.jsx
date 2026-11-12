import React, { useState, useEffect, useMemo } from "react";
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
  TrendingUp,
  Activity,
  Layers,
  Flame
} from "lucide-react";

const PAGE_SIZE = 15;

function normalizeCountry(c) {
  const s = String(c || "Unknown").trim();
  const map = { 
    NG: "Nigeria", Nigeria: "Nigeria", 
    US: "United States", USA: "United States", "United States": "United States", 
    GB: "United Kingdom", UK: "United Kingdom",
    GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada", DE: "Germany"
  };
  return map[s] || map[s.toUpperCase()] || s;
}

function isOldBot(v) {
  const city = String(v.city || "").toLowerCase();
  const datacenters = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner", "frankfurt am main"];
  if (datacenters.some(d => city.includes(d))) return true;
  if (city === "unknown" && v.device === "Other") return true;
  return false;
}

export default function AdminDashboard() {
  const [data, setData] = useState({ visitors: [], users: [], reviews: [] });
  const [activeTab, setActiveTab] = useState("visitors");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [onlyReturning, setOnlyReturning] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showBots, setShowBots] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-number");
      const json = await res.json();
      setData({
        visitors: json.visitors || [],
        users: json.users || [],
        reviews: json.reviews || [],
      });
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, selectedCountry, showBots, onlyReturning]);

  // Process visitors, sort recent to oldest, and calculate total visits & cities per visitorHash
  const allVisitors = useMemo(() => {
    const raw = (data.visitors || []).map(v => ({
      ...v,
      country: normalizeCountry(v.country),
    }));

    const hashStats = {};
    raw.forEach(v => {
      if (v.visitorHash) {
        if (!hashStats[v.visitorHash]) {
          hashStats[v.visitorHash] = { maxVisits: 1, cities: new Set() };
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
      .map(v => {
        const stats = v.visitorHash ? hashStats[v.visitorHash] : null;
        return {
          ...v,
          totalVisits: stats ? stats.maxVisits : (v.visitNumber || 1),
          uniqueCities: stats ? Array.from(stats.cities) : [],
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.time || a.createdAt || 0).getTime();
        const timeB = new Date(b.time || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [data.visitors]);

  const realVisitors = useMemo(() => {
    return showBots ? allVisitors : allVisitors.filter(v => !isOldBot(v));
  }, [allVisitors, showBots]);

  const hiddenBotCount = allVisitors.length - realVisitors.length;

  // Count unique returning visitors (2+ visits)
  const returningVisitorsCount = useMemo(() => {
    const uniqueReturningHashes = new Set();
    realVisitors.forEach(v => {
      if (v.totalVisits > 1 && v.visitorHash) {
        uniqueReturningHashes.add(v.visitorHash);
      }
    });
    return uniqueReturningHashes.size;
  }, [realVisitors]);

  // Country Aggregation
  const countries = useMemo(() => {
    const map = {};
    realVisitors.forEach(v => {
      const c = v.country || "Unknown";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [realVisitors]);

  // Top Regions Breakdown
  const topCountries = useMemo(() => {
    const maxCount = countries.length > 0 ? countries[0][1] : 1;
    return countries.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / maxCount) * 100),
    }));
  }, [countries]);

  // Filtered datasets per tab
  const filteredVisitors = useMemo(() => {
    return realVisitors.filter(v => {
      if (selectedCountry !== "all" && v.country !== selectedCountry) return false;
      if (onlyReturning && v.totalVisits < 2) return false;
      if (search && !`${v.city} ${v.country} ${v.device} ${v.visitorHash || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [realVisitors, search, selectedCountry, onlyReturning]);

  const filteredUsers = useMemo(() => {
    if (!search) return data.users;
    const s = search.toLowerCase();
    return data.users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(s));
  }, [data.users, search]);

  const filteredReviews = useMemo(() => {
    if (!search) return data.reviews;
    const s = search.toLowerCase();
    return data.reviews.filter(r => `${r.name} ${r.comment} ${r.email}`.toLowerCase().includes(s));
  }, [data.reviews, search]);

  // Pagination target
  const currentList = activeTab === "visitors" ? filteredVisitors : activeTab === "users" ? filteredUsers : filteredReviews;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = currentList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Delete handler
  const handleDelete = async (item, type) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(item.id || item.createdAt || item.time);
    try {
      const res = await fetch("/api/my-number", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: item.id, createdAt: item.createdAt, time: item.time, comment: item.comment, email: item.email, city: item.city }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans p-4 sm:p-8 selection:bg-violet-500 selection:text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>Chef Didi Analytics Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Executive Command Center
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Upstash Redis: <strong className="text-emerald-400 font-medium">Connected</strong></span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 transition text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-violet-900/20 border border-violet-500/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
            <span>Sync Metrics</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">Total Page Views</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{realVisitors.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <span className="text-emerald-400 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Clean
              </span>
              <span>• {hiddenBotCount} bots excluded</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">Repeat Visitors</span>
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{returningVisitorsCount}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <span className="text-rose-400 font-semibold">High Interest</span>
              <span>• Visited 2+ times</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">Registered Users</span>
              <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{data.users.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <span className="text-violet-400 font-semibold">Signups</span>
              <span>• Verified accounts</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">User Feedback</span>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Star className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{data.reviews.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
              <span className="text-amber-400 font-semibold">Reviews</span>
              <span>• {countries.length} countries reached</span>
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/70 border border-zinc-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Top Regions Breakdown</h3>
                  <p className="text-[11px] text-zinc-500">Distribution of visitor traffic by country</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {topCountries.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">{item.name}</span>
                    <span className="text-zinc-400 font-mono">{item.count} hits</span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {topCountries.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-6">No location metrics available</p>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Engagement & Retention Health</h3>
                  <p className="text-[11px] text-zinc-500">Cross-location HttpOnly cookie & fingerprint tracking</p>
                </div>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Total Raw Logs Captured</span>
                  <span className="font-mono font-bold text-white">{allVisitors.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Returning Interested People (2+ visits)</span>
                  <span className="font-mono font-bold text-rose-400">{returningVisitorsCount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Filtered Crawler / Datacenter Logs</span>
                  <span className="font-mono font-bold text-amber-400">{hiddenBotCount}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Tracking: HttpOnly Cookie + SHA-256</span>
              <span className="text-emerald-400 font-medium">Cross-City Active</span>
            </div>
          </div>
        </div>

        {/* Country & Intent Quick Filter Bar */}
        {activeTab === "visitors" && (
          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Filter Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyReturning(!onlyReturning)}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition ${
                    onlyReturning 
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40" 
                      : "bg-zinc-800/90 text-zinc-300 hover:text-white border-zinc-700/60"
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>{onlyReturning ? "Showing Repeat Visitors Only" : "Filter Repeat Visitors (2+)"}</span>
                </button>
                <button
                  onClick={() => setShowBots(!showBots)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white bg-zinc-800/90 px-3.5 py-1.5 rounded-full border border-zinc-700/60 shadow-sm transition"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>{showBots ? "Hide Datacenter Traffic" : `Audit ${hiddenBotCount} Filtered Bots`}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setSelectedCountry("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCountry === "all" ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/40"
                }`}
              >
                All • {realVisitors.length}
              </button>
              {countries.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(selectedCountry === c ? "all" : c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedCountry === c ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/40"
                  }`}
                >
                  {c} • {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Controls & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-2">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl gap-1 self-start shadow-inner">
            <button
              onClick={() => setActiveTab("visitors")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "visitors" ? "bg-zinc-100 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Visitors ({filteredVisitors.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "users" ? "bg-zinc-100 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "reviews" ? "bg-zinc-100 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Reviews ({filteredReviews.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                activeTab === "visitors"
                  ? "Search city, country, device, or visitor ID..."
                  : activeTab === "users"
                  ? "Search user name or email..."
                  : "Search review text or author..."
              }
              className="w-full bg-zinc-900 border border-zinc-800 pl-11 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* Data Table / List View */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          {loading ? (
            <div className="p-16 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
              <span>Fetching latest dataset...</span>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 text-xs">No records matching your search criteria.</div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {/* VISITORS TAB */}
              {activeTab === "visitors" &&
                pageItems.map((v, idx) => (
                  <div key={idx} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/40 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">
                          {v.city}, {v.country}
                        </span>
                        {v.totalVisits > 1 && (
                          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" />
                            Returning • {v.totalVisits}x visits
                          </span>
                        )}
                        {v.uniqueCities && v.uniqueCities.length > 1 && (
                          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            {v.uniqueCities.length} cities
                          </span>
                        )}
                        {isOldBot(v) && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Bot Log
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                          {v.device || "Unknown Device"}
                        </span>
                        {v.visitorHash && (
                          <button
                            onClick={() => setSearch(v.visitorHash)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-violet-400 bg-zinc-800/80 px-2 py-0.5 rounded transition"
                            title="Click to filter all visits by this user"
                          >
                            ID: {v.visitorHash}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-400 font-mono">
                        {v.time ? new Date(v.time).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(v, "visitors")}
                        disabled={deletingId === (v.id || v.time)}
                        className="text-zinc-600 hover:text-red-400 p-2 rounded-xl hover:bg-zinc-800 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* USERS TAB */}
              {activeTab === "users" &&
                pageItems.map((u, idx) => (
                  <div key={idx} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/40 transition">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-zinc-100">{u.name}</p>
                      <p className="text-xs text-violet-400">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(u, "users")}
                        disabled={deletingId === (u.id || u.createdAt)}
                        className="text-zinc-600 hover:text-red-400 p-2 rounded-xl hover:bg-zinc-800 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* REVIEWS TAB */}
              {activeTab === "reviews" &&
                pageItems.map((r, idx) => (
                  <div key={idx} className="p-4 sm:px-6 flex items-start justify-between gap-4 hover:bg-zinc-800/40 transition">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-zinc-100">{r.name}</span>
                        <div className="flex text-amber-400 text-xs font-bold">
                          {"★".repeat(r.rating || 5)}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{r.comment}</p>
                      <p className="text-[11px] text-zinc-500">{r.email || "guest"}</p>
                    </div>
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <span className="text-xs text-zinc-400 font-mono">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(r, "reviews")}
                        disabled={deletingId === (r.id || r.createdAt)}
                        className="text-zinc-600 hover:text-red-400 p-2 rounded-xl hover:bg-zinc-800 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between text-xs text-zinc-400 py-3">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-zinc-800 transition shadow-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          
          <span>
            Page <strong className="text-white">{safePage}</strong> of {totalPages} • Total <strong className="text-white">{currentList.length}</strong> items
          </span>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-zinc-800 transition shadow-sm font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

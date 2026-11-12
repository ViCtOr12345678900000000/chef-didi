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
  Sparkles
} from "lucide-react";

const PAGE_SIZE = 15;

function normalizeCountry(c) {
  const s = String(c || "Unknown").trim();
  const map = { 
    NG: "Nigeria", Nigeria: "Nigeria", 
    US: "United States", USA: "United States", "United States": "United States", 
    GB: "United Kingdom", UK: "United Kingdom",
    GH: "Ghana", KE: "Kenya", ZA: "South Africa", CA: "Canada"
  };
  return map[s] || map[s.toUpperCase()] || s;
}

function isOldBot(v) {
  const city = String(v.city || "").toLowerCase();
  const datacenters = ["san jose", "ashburn", "boardman", "dulles", "prineville", "hillsboro", "quincy", "the dalles", "council bluffs", "moncks corner"];
  if (datacenters.some(d => city.includes(d))) return true;
  if (city === "unknown" && v.device === "Other") return true;
  return false;
}

export default function AdminDashboard() {
  const [data, setData] = useState({ visitors: [], users: [], reviews: [] });
  const [activeTab, setActiveTab] = useState("visitors"); // visitors | users | reviews
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
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
  }, [activeTab, search, selectedCountry, showBots]);

  // Visitor processing (sorted recent to oldest)
  const allVisitors = useMemo(() => {
    return (data.visitors || [])
      .map(v => ({
        ...v,
        country: normalizeCountry(v.country),
      }))
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

  // Country Aggregation
  const countries = useMemo(() => {
    const map = {};
    realVisitors.forEach(v => {
      const c = v.country || "Unknown";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [realVisitors]);

  // Filtered datasets per tab
  const filteredVisitors = useMemo(() => {
    return realVisitors.filter(v => {
      if (selectedCountry !== "all" && v.country !== selectedCountry) return false;
      if (search && !`${v.city} ${v.country} ${v.device}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [realVisitors, search, selectedCountry]);

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
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>Chef Didi Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Live Overview</h1>
        </div>
        
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition text-white px-4 py-2.5 rounded-full text-xs font-semibold border border-zinc-700/60 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-violet-400" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold tracking-wider uppercase">Live Visitors</span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-light text-white">{realVisitors.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">{hiddenBotCount} crawler visits filtered</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold tracking-wider uppercase">Countries</span>
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-light text-emerald-400">{countries.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Global engagement reach</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold tracking-wider uppercase">Registered</span>
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-3xl font-light text-violet-400">{data.users.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Active registered user accounts</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold tracking-wider uppercase">Reviews</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-light text-amber-400">{data.reviews.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Submitted user feedback</p>
          </div>
        </div>

        {/* Country Quick Filter Bar */}
        {activeTab === "visitors" && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Filter Traffic by Region</span>
              <button
                onClick={() => setShowBots(!showBots)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>{showBots ? "Hide Datacenter Traffic" : `Audit ${hiddenBotCount} Filtered Bots`}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCountry("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  selectedCountry === "all" ? "bg-white text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                All • {realVisitors.length}
              </button>
              {countries.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(selectedCountry === c ? "all" : c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    selectedCountry === c ? "bg-white text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {c} • {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Controls & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full gap-1 self-start">
            <button
              onClick={() => setActiveTab("visitors")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === "visitors" ? "bg-zinc-100 text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Visitors ({filteredVisitors.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === "users" ? "bg-zinc-100 text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === "reviews" ? "bg-zinc-100 text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Reviews ({filteredReviews.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                activeTab === "visitors"
                  ? "Search city, country, device..."
                  : activeTab === "users"
                  ? "Search user name or email..."
                  : "Search review text or author..."
              }
              className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/80"
            />
          </div>
        </div>

        {/* Data Table / List View */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Fetching latest dataset...</div>
          ) : pageItems.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">No records matching your search.</div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {/* VISITORS TAB */}
              {activeTab === "visitors" &&
                pageItems.map((v, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">
                          {v.city}, {v.country}
                        </span>
                        {isOldBot(v) && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Bot Log
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-zinc-500" />
                          {v.device || "Unknown Device"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500 font-mono">
                        {v.time ? new Date(v.time).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(v, "visitors")}
                        disabled={deletingId === (v.id || v.time)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* USERS TAB */}
              {activeTab === "users" &&
                pageItems.map((u, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-zinc-100">{u.name}</p>
                      <p className="text-xs text-violet-400">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(u, "users")}
                        disabled={deletingId === (u.id || u.createdAt)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* REVIEWS TAB */}
              {activeTab === "reviews" &&
                pageItems.map((r, idx) => (
                  <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-800/30 transition">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">{r.name}</span>
                        <div className="flex text-amber-400 text-xs font-bold">
                          {"★".repeat(r.rating || 5)}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{r.comment}</p>
                      <p className="text-[11px] text-zinc-500">{r.email || "guest"}</p>
                    </div>
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <span className="text-xs text-zinc-500 font-mono">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(r, "reviews")}
                        disabled={deletingId === (r.id || r.createdAt)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between text-xs text-zinc-500 py-2">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full disabled:opacity-40 hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          
          <span>
            Page <strong className="text-white">{safePage}</strong> of {totalPages} • Total {currentList.length} items
          </span>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full disabled:opacity-40 hover:bg-zinc-800 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

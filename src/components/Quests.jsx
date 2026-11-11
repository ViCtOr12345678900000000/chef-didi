import { useState, useEffect } from "react";
import { QUESTS } from "../lib/didi";

export default function Quests({ user, location = "nigeria", themeId = "purple" }) {
  const [myQuests, setMyQuests] = useState([]);
  const [counts, setCounts] = useState({});
  const [showAll, setShowAll] = useState(false);
  const marketLoc = location === "abroad" ? "abroad" : "lagos";

  // REMOVE Zero Waste Hero everywhere, even if user joined before
  const filteredQuests = QUESTS.filter(q => q.id !== "zero_waste" && q.id !== "zero_waste_hero" && !q.title.toLowerCase().includes("zero waste"));

  const loadCounts = async () => {
    try {
      const r = await fetch(`/api/community?type=quests&location=${marketLoc}`);
      const j = await r.json();
      if (j.counts) setCounts(j.counts);
    } catch {}
  };

  // UPSTASH ONLY: load my joined quests from /api/profile (Upstash), no localStorage
  const restoreMyQuests = async () => {
    if (!user?.email) { setMyQuests([]); return; }
    try {
      const r = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
      const j = await r.json();
      const cloudQuests = j?.data?.quests || j?.quests || [];
      // Filter out Zero Waste Hero from cloud too
      setMyQuests(cloudQuests.filter(q => q.id !== "zero_waste" && q.id !== "zero_waste_hero"));
    } catch { setMyQuests([]); }
  };

  useEffect(() => {
    loadCounts();
    restoreMyQuests();
    const sync = () => { restoreMyQuests(); loadCounts(); };
    window.addEventListener("didi-quests-updated", sync);
    return () => window.removeEventListener("didi-quests-updated", sync);
  }, [user?.email, marketLoc]);

  const handleJoin = async (id) => {
    // Optimistic UI
    const optimistic = [...myQuests, { id, progress: 0, completed: false }];
    setMyQuests(optimistic);
    // UPSTASH ONLY: no joinQuest() localStorage call
    try {
      await fetch("/api/community?type=quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", questId: id, location: marketLoc, email: user?.email || "guest" }),
      });
      loadCounts();
      window.dispatchEvent(new Event("didi-quests-updated"));
    } catch {}
  };

  const visible = showAll ? filteredQuests : filteredQuests.slice(0, 2);

  return (
    <div className="bg-white rounded-[24px] p-4 shadow-xl mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-[14px]">🏆 Cook With Me — Quests</h3>
        <button onClick={() => setShowAll(!showAll)} className="text-[11px] font-bold text-stone-400">{showAll ? "Show less" : "See all"}</button>
      </div>
      <p className="text-[12px] text-stone-500 mb-3">Join a quest, cook, earn a badge. Your progress saves to your account.</p>
      <div className="space-y-2">
        {visible.map(q => {
          const mine = myQuests.find(x => x.id === q.id);
          const pct = mine ? Math.min(100, (mine.progress / q.total) * 100) : 0;
          return (
            <div key={q.id} className="border rounded-2xl p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-snug">{q.title}</p>
                  <p className="text-[11px] text-stone-500 leading-snug mt-0.5">{q.desc}</p>
                  <p className="text-[10px] text-stone-400 mt-1">🏅 {q.reward} • {counts[q.id] || 0} completed</p>
                </div>
                {!mine ? (
                  <button onClick={() => handleJoin(q.id)} className="shrink-0 h-8 px-3 bg-black text-white rounded-full text-[11px] font-bold">Join</button>
                ) : mine.completed ? (
                  <span className="shrink-0 text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-full whitespace-nowrap">✓ Completed</span>
                ) : (
                  <span className="shrink-0 text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-full whitespace-nowrap">{mine.progress}/{mine.total}</span>
                )}
              </div>
              {mine && !mine.completed && (
                <>
                  <div className="h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} /></div>
                  <p className="text-[11px] text-stone-400 mt-1">Cook a matching recipe to progress. It auto-tracks when you generate a recipe.</p>
                </>
              )}
              {mine?.completed && <p className="text-[11px] text-green-600 font-bold mt-1">🎉 Badge earned: {q.reward}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

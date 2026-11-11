import { useState, useEffect } from "react";
import { QUESTS, getQuests, joinQuest } from "../lib/didi";

export default function Quests({ user, location = "nigeria", themeId = "purple" }) {
  const [myQuests, setMyQuests] = useState(() => getQuests(user));
  const [counts, setCounts] = useState({});
  const [showAll, setShowAll] = useState(false);
  const marketLoc = location === "abroad" ? "abroad" : "lagos";

  const loadCounts = async () => {
    try {
      const r = await fetch(`/api/community?type=quests&location=${marketLoc}`);
      const j = await r.json();
      if (j.counts) setCounts(j.counts);
    } catch {}
  };

  // Restore my joined quests from Upstash on refresh - THIS WAS MISSING
  const restoreMyQuests = async () => {
    if (!user?.email) return;
    try {
      // 1. Try Upstash first
      const r = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
      const j = await r.json();
      const cloudQuests = j?.data?.quests || j?.quests || [];
      if (cloudQuests.length) {
        localStorage.setItem(`didi_quests_${user.email}`, JSON.stringify(cloudQuests));
        setMyQuests(cloudQuests);
        return;
      }
    } catch {}
    // Fallback to localStorage
    setMyQuests(getQuests(user));
  };

  useEffect(() => {
    loadCounts();
    restoreMyQuests();
    const sync = () => { setMyQuests(getQuests(user)); loadCounts(); };
    window.addEventListener("didi-quests-updated", sync);
    return () => window.removeEventListener("didi-quests-updated", sync);
  }, [user?.email, marketLoc]);

  const handleJoin = async (id) => {
    // 1. Save locally instantly so UI updates
    const updated = joinQuest(user, id);
    setMyQuests(updated);

    // 2. Save to Upstash - THIS IS THE FIX, before it never uploaded
    try {
      await fetch("/api/community?type=quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", questId: id, location: marketLoc, email: user?.email || "guest" }),
      });
      // 3. Also save to profile bundle so restore works
      if (user?.email) {
        const email = user.email.toLowerCase().trim();
        const existing = JSON.parse(localStorage.getItem(`didi_quests_${email}`) || "[]");
        // syncCloud in IngredientPicker will pick this up, but force it now
        window.dispatchEvent(new Event("didi-quests-updated"));
      }
      loadCounts();
    } catch {}
  };

  const visible = showAll ? QUESTS : QUESTS.slice(0, 2);

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
                <div>
                  <p className="text-[13px] font-bold">{q.title}</p>
                  <p className="text-[11px] text-stone-500">{q.desc}</p>
                  {/* FIXED TEXT: was "0 people completed in lagos" -> now just "X completed" */}
                  <p className="text-[10px] text-stone-400 mt-1">🏅 {q.reward} • {counts[q.id] || 0} completed</p>
                </div>
                {!mine ? (
                  <button onClick={() => handleJoin(q.id)} className="shrink-0 h-8 px-3 bg-black text-white rounded-full text-[11px] font-bold">Join</button>
                ) : mine.completed ? (
                  <span className="shrink-0 text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-1.5 rounded-full">✓ Completed</span>
                ) : (
                  <span className="shrink-0 text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-full">{mine.progress}/{mine.total}</span>
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

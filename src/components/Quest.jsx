import { useState, useEffect } from "react";
import { QUESTS, getQuests, joinQuest, progressQuests } from "../lib/didi";

export default function Quests({ user, location = "nigeria", themeId = "purple" }) {
  const [myQuests, setMyQuests] = useState(() => getQuests(user));
  const [counts, setCounts] = useState({});
  const [showAll, setShowAll] = useState(false);

  const marketLoc = location === "abroad" ? "abroad" : "lagos";

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/quests?location=${marketLoc}`);
        const j = await r.json();
        if (j.counts) setCounts(j.counts);
      } catch {}
    };
    load();
    const sync = () => setMyQuests(getQuests(user));
    window.addEventListener("didi-quests-updated", sync);
    return () => window.removeEventListener("didi-quests-updated", sync);
  }, [user?.email, marketLoc]);

  const handleJoin = (id) => {
    setMyQuests(joinQuest(user, id));
  };

  const joinedIds = myQuests.map(q => q.id);
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
                  <p className="text-[10px] text-stone-400 mt-1">🏅 {q.reward} • {counts[q.id] || 0} people completed in {marketLoc}</p>
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
                <div className="h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} /></div>
              )}
              {mine?.completed && <p className="text-[11px] text-green-600 font-bold mt-1">🎉 Badge earned: {q.reward}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

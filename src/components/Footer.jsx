// components/Footer.jsx
import { useState } from "react";
import { THEMES, t } from "../lib/didi";

const TIPS = [
  "Parboil rice for concoction rice — stops it getting soggy.",
  "Add salt at the end for Egusi — keeps it from breaking.",
  "For Alfredo: don't boil cream too hard — low heat keeps it silky.",
  "Toast your Egusi before adding water — deeper flavour.",
  "Let Jollof steam 5 mins after cooking — don't open the pot.",
];

const POPULAR = [
  "Chicken + Rice",
  "Yam + Eggs",
  "Beans + Plantain",
  "Pasta + Chicken",
  "Egusi + Chicken",
];

export default function Footer({ lang = "en", themeId = "purple", onPickPopular, user }) {
  const theme = THEMES[themeId] || THEMES.purple;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  // --- REVIEW BOX STATE ---
  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleReview = async () => {
    const finalName = (name || user?.name || "").trim();
    if (!finalName || !comment.trim()) {
      setMsg("Please add your name + comment");
      return;
    }
    setSending(true);
    setMsg("");
    try {
      const res = await fetch("/api/my-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          email: user?.email || "guest",
          rating,
          comment: comment.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsg("✅ Thanks! Your review was sent to Didi.");
      setComment("");
      setRating(5);
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1 - How Didi Works */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-violet-900/10">
          <p className="text-[28px] mb-2">👩🏾‍🍳</p>
          <h3 className="font-display text-[20px] font-medium text-[#1A1A2E]">{t(lang, 'howWorks')}</h3>
          <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">
            1. Add ingredients. 2. Pick Goal + Sittings + Cuisine + Location. 3. Get recipe with calories per sitting.
          </p>
        </div>

        {/* 2 - Tip of the Day */}
        <div className={`rounded-[28px] p-6 shadow-xl text-white bg-gradient-to-br ${theme.btn}`}>
          <p className="text-[28px] mb-2">💡</p>
          <h3 className="font-display text-[20px] font-medium">{t(lang, 'tip')} of the Day</h3>
          <p className="text-[13px] text-white/85 mt-2 leading-relaxed">{tip}</p>
        </div>

        {/* 3 - Popular Right Now */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-violet-900/10">
          <p className="text-[28px] mb-2">🔥</p>
          <h3 className="font-display text-[20px] font-medium text-[#1A1A2E]">{t(lang, 'popular')} Right Now</h3>
          <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">{POPULAR.join(" • ")}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {POPULAR.map(p => (
              <button
                key={p}
                onClick={() => onPickPopular && onPickPopular(p)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F5F0FF] text-[#4A3B8C] border border-[#E6E0FF] hover:bg-[#7B61FF] hover:text-white transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 - REVIEW BOX - NEW - sends to Upstash -> shows in MyNumber */}
      <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-violet-900/10 mt-4">
        <p className="text-[28px] mb-1">⭐</p>
        <h3 className="font-display text-[20px] font-medium text-[#1A1A2E]">Love Chef Didi? Leave a Review</h3>
        <p className="text-[13px] text-stone-500 mt-1">Your comment goes straight to Didi's dashboard.</p>

        <div className="flex gap-1 mt-3">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button" onClick={() => setRating(n)} className="text-[26px] leading-none">
              {n <= rating ? "⭐" : "☆"}
            </button>
          ))}
          <span className="text-[12px] font-bold text-stone-500 self-center ml-1">{rating}/5</span>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full h-11 px-4 bg-stone-50 border rounded-full text-[13px] outline-none mt-3"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell Didi what you cooked... e.g. Jollof came out perfect!"
          rows={3}
          className="w-full px-4 py-3 bg-stone-50 border rounded-2xl text-[13px] outline-none mt-2 resize-none"
        />
        <button
          type="button"
          onClick={handleReview}
          disabled={sending}
          className={`w-full h-11 mt-3 rounded-full text-[13px] font-bold text-white bg-gradient-to-r ${theme.btn} disabled:opacity-50`}
        >
          {sending ? "Sending..." : "Send Review →"}
        </button>
        {msg && <p className="text-[12px] font-semibold mt-2">{msg}</p>}
      </div>
    </div>
  );
}

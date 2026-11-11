import { useState, useEffect } from "react";

export default function ReviewBox({ user }) {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  import { useState, useEffect } from "react";

export default function ReviewBox({ user }) {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const r = await fetch(`/api/my-number`);
      const j = await r.json();
      if (j.reviews) setReviews(j.reviews.slice(0, 5));
    } catch {}
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  const submit = async () => {
    if (!comment.trim()) { setMsg("Write your review first"); return; }
    if (!name.trim()) { setMsg("Enter your name"); return; }
    setSending(true); setMsg("");
    try {
      const res = await fetch("/api/my-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reviews",
          name: name.trim(),
          rating,
          comment: comment.trim(),
          email: user?.email || "guest",
          createdAt: new Date().toISOString()
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setComment("");
      setMsg("✅ Thanks! Your review was sent");
      load();
    } catch (e) { setMsg("❌ " + e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="mt-5 bg-white/10 border border-white/20 rounded-[24px] p-4 text-left">
      <h4 className="text-white font-bold text-[14px]">⭐ Loved Didi? Leave a review</h4>
      <p className="text-white/70 text-[11px] mt-1">Your review shows here + goes to your Admin dashboard.</p>

      {reviews.length > 0 && (
        <div className="mt-3 space-y-2">
          {reviews.map((rev, i) => (
            <div key={i} className="bg-white rounded-2xl p-3">
              <p className="text-[12px] font-bold text-stone-800">{rev.name} <span className="text-amber-500">{"⭐".repeat(rev.rating || 5)}</span></p>
              <p className="text-[12px] text-stone-600 leading-snug mt-0.5">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name e.g. Amaka" className="w-full h-10 px-3 bg-white rounded-full text-[12px] outline-none text-stone-800" />
        <div className="flex gap-1 items-center">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button" onClick={() => setRating(n)} className={`w-8 h-8 rounded-full text-[16px] ${rating >= n ? "bg-amber-400" : "bg-white/20"}`}>{rating >= n ? "⭐" : "☆"}</button>
          ))}
          <span className="text-white text-[12px] font-bold ml-1">{rating}/5</span>
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you cook? Did Didi help?" rows={2} className="w-full px-3 py-2 bg-white rounded-2xl text-[12px] outline-none text-stone-800 resize-none" />
        <button type="button" onClick={submit} disabled={sending} className="w-full h-11 bg-white text-[#4A2C8A] rounded-full text-[13px] font-bold disabled:opacity-50">
          {sending ? "Sending..." : "Send Review →"}
        </button>
        {msg && <p className="text-[11px] text-white font-bold text-center">{msg}</p>}
      </div>
    </div>
  );
}

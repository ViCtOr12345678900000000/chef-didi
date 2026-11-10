import { useEffect, useState } from "react";

export default function MyNumber() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-number");
      const data = await res.json();
      setCount(data.count);
      const now = new Date();
      setTime(now.toLocaleTimeString());
    } catch (e) {
      setCount(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#111110", color: "white" }}
    >
      <p className="text-[11px] tracking-[4px] text-stone-500">
        PRIVATE
      </p>

      <p className="text-stone-400 text-sm mt-8">
        Total Visitors
      </p>

      <h1
        className="font-light leading-none mt-2"
        style={{ fontSize: "140px" }}
      >
        {loading ? "..." : count}
      </h1>

      <div className="w-10 h-[1px] bg-stone-700 my-8" />

      <p className="text-stone-500 text-xs">
        Chef Didi
      </p>

      <p className="text-stone-600 text-[11px] mt-1">
        Last checked: {time || "just now"}
      </p>

      <button
        onClick={load}
        className="mt-10 px-6 py-3 rounded-full text-sm"
        style={{
          background: "white",
          color: "black",
        }}
      >
        Refresh
      </button>

      <p className="text-stone-700 text-[11px] mt-10 text-center">
        Only you know this link.
        <br />
        Do not share it.
      </p>
    </div>
  );
}

export default function BlobBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* BASE - EXACTLY LIKE YOUR SCREENSHOT */}
      <div className="absolute inset-0 bg-[#FAF9F6]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0E8] via-[#FAF9F6] to-[#FAF9F6]" />

      {/* MAIN PINK BLOB - behind header, big + bouncy */}
      <div className="blob blob-1 absolute -top-[40px] -left-[60px] w-[95vw] h-[380px] max-w-[460px] bg-[#F5B8B8]" />
      {/* PEACH BLOB - middle, moves opposite */}
      <div className="blob blob-2 absolute top-[52%] -right-[80px] w-[280px] h-[280px] bg-[#FFD9B3]" />
      {/* GOLD BLOB - small, fast, Didi gold */}
      <div className="blob blob-3 absolute top-[38%] left-[68%] w-[90px] h-[90px] bg-[#C9A86A]" />
      {/* SAGE BLOB - bottom left */}
      <div className="blob blob-4 absolute bottom-[12%] -left-[40px] w-[180px] h-[180px] bg-[#C8D8D0]" />

      {/* TINY DOTS - energetic sparkles */}
      <div className="dot dot-1 absolute top-[18%] right-[12%] w-[18px] h-[18px] bg-[#1A1A2E]" />
      <div className="dot dot-2 absolute top-[62%] left-[12%] w-[14px] h-[14px] bg-[#1A1A2E]" />
      <div className="dot dot-3 absolute top-[78%] right-[22%] w-[22px] h-[22px] bg-[#F5B8B8]" />
      <div className="dot dot-4 absolute top-[30%] left-[8%] w-[10px] h-[10px] bg-[#C9A86A]" />

      <style jsx>{`
        .blob { opacity: 0.85; will-change: transform, border-radius; }
        .blob-1 { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; animation: morph1 4s ease-in-out infinite alternate, bounce1 5s ease-in-out infinite alternate; }
        .blob-2 { border-radius: 50% 50% 40% 60% / 60% 50% 50% 40%; opacity: 0.6; animation: morph2 6s ease-in-out infinite alternate, driftRight 7s ease-in-out infinite alternate; }
        .blob-3 { border-radius: 50%; opacity: 0.7; animation: jiggle 2.5s ease-in-out infinite alternate; }
        .blob-4 { border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%; opacity: 0.55; animation: morph2 7s ease-in-out infinite alternate-reverse, floatUp 6s ease-in-out infinite alternate; }
        .dot { border-radius: 50%; animation: pop 2s ease-in-out infinite alternate; }
        .dot-2 { animation-delay: 0.4s; animation-duration: 2.4s; }
        .dot-3 { animation-delay: 0.8s; animation-duration: 1.8s; }
        .dot-4 { animation-delay: 0.2s; animation-duration: 2.8s; }
        @keyframes morph1 {
          0% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; transform: rotate(0deg) scale(1); }
          25% { border-radius: 40% 60% 45% 55% / 65% 40% 60% 35%; transform: rotate(6deg) scale(1.08, 0.95); }
          50% { border-radius: 55% 45% 60% 40% / 40% 60% 35% 65%; transform: rotate(-4deg) scale(0.95, 1.1); }
          75% { border-radius: 45% 55% 35% 65% / 55% 45% 65% 35%; transform: rotate(8deg) scale(1.12, 0.92); }
          100% { border-radius: 65% 35% 50% 50% / 50% 50% 40% 60%; transform: rotate(-6deg) scale(1, 1); }
        }
        @keyframes morph2 {
          0% { border-radius: 50% 50% 40% 60% / 60% 50% 50% 40%; transform: rotate(0deg) scale(1); }
          100% { border-radius: 40% 60% 60% 40% / 40% 60% 40% 60%; transform: rotate(15deg) scale(1.15); }
        }
        @keyframes bounce1 { 0% { translate: 0 0; } 100% { translate: 18px 14px; } }
        @keyframes driftRight { 0% { translate: 0 0; } 100% { translate: -22px -18px; } }
        @keyframes jiggle { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-14px) scale(1.15); } 100% { transform: translateY(6px) scale(0.9); } }
        @keyframes floatUp { 0% { translate: 0 0; } 100% { translate: 12px -20px; } }
        @keyframes pop { 0% { transform: scale(1) translateY(0); opacity: 0.9; } 100% { transform: scale(1.4) translateY(-10px); opacity: 0.5; } }
      `}</style>
    </div>
  );
}

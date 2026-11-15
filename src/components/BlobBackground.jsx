export default function BlobBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-[#FAF9F6]" />
      <div className="blob-main absolute top-[120px] left-[-20px] w-[90vw] h-[52vw] max-w-[440px] max-h-[240px] bg-[#F5B8B8]" />
      <div className="blob-circle absolute top-[180px] left-[-25px] w-[80px] h-[80px] bg-[#F5B8B8]" />
      <div className="blob-circle-2 absolute top-[110px] right-[30px] w-[28px] h-[28px] bg-[#C8D8D0]" />
      <div className="blob-dark absolute top-[300px] left-[110px] w-[58px] h-[58px] bg-[#1A1A2E]" />
      <div className="blob-dark-2 absolute top-[105px] right-[90px] w-[16px] h-[16px] bg-[#1A1A2E]" />
      <style jsx>{`
        .blob-main { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; animation: morph 8s ease-in-out infinite alternate, drift 12s ease-in-out infinite alternate; opacity: 0.9; }
        .blob-circle { border-radius: 50%; animation: drift2 9s ease-in-out infinite alternate; }
        .blob-circle-2 { border-radius: 50%; animation: drift3 7s ease-in-out infinite alternate; }
        .blob-dark, .blob-dark-2 { border-radius: 50%; animation: floatDark 10s ease-in-out infinite alternate; }
        @keyframes morph { 0% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; transform: rotate(0deg) scale(1); } 50% { border-radius: 45% 55% 40% 60% / 60% 40% 60% 40%; transform: rotate(8deg) scale(1.08); } 100% { border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%; transform: rotate(-5deg) scale(0.95); } }
        @keyframes drift { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(20px) translateY(-15px); } }
        @keyframes drift2 { 0% { transform: translateX(0); } 100% { transform: translateX(25px) translateY(10px); } }
        @keyframes drift3 { 0% { transform: translateY(0); } 100% { transform: translateY(18px) translateX(-10px); } }
        @keyframes floatDark { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(-20px) translateX(15px); } }
      `}</style>
    </div>
  );
}

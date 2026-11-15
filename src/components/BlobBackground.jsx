export default function BlobBackground() {
  return (
    <div className="relative min-h-[100svh] bg-[#0A0A0A] overflow-hidden">
      {/* BLOBS LAYER */}
      <div className="absolute inset-0">
        {/* Big pink blob - the main one */}
        <div className="blob-main absolute top-[28%] left-[8%] w-[78vw] h-[42vw] max-w-[420px] max-h-[220px] bg-[#F5B8B8]" />
        
        {/* Small floating circles */}
        <div className="blob-circle absolute top-[32%] left-[-8%] w-[90px] h-[90px] bg-[#F5B8B8]" />
        <div className="blob-circle-2 absolute top-[24%] right-[8%] w-[28px] h-[28px] bg-[#C8D8D0]" />
        <div className="blob-dark absolute top-[48%] left-[28%] w-[58px] h-[58px] bg-[#1A1A1A]" />
        <div className="blob-dark-2 absolute top-[22%] right-[22%] w-[18px] h-[18px] bg-[#1A1A1A]" />
      </div>

      {/* YOUR CONTENT ON TOP */}
      <div className="relative z-10 px-6 pt-6 pb-16">
        <p className="text-center text-white text-[13px] tracking-[0.2em] font-semibold">CHEF DIDI</p>
        
        <h1 className="text-white text-[28px] leading-[1.2] font-serif italic mt-10">
          Cook in kindness and<br />respect.<br /><br />
          And feed yourself<br />towards a radically<br />better future.
        </h1>

        <div className="mt-[180px]">
          <p className="text-white/40 text-[20px] font-bold">Chef Didi</p>
          <div className="flex gap-4 mt-2 text-white/80 text-[11px]">
            <span>HOME</span><span>RECIPES</span><span>ABOUT</span><span>KCAL</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .blob-main {
          border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
          animation: morph 8s ease-in-out infinite alternate, drift 12s ease-in-out infinite alternate;
        }
        .blob-circle {
          border-radius: 50%;
          animation: drift2 9s ease-in-out infinite alternate;
        }
        .blob-circle-2 {
          border-radius: 50%;
          animation: drift3 7s ease-in-out infinite alternate;
        }
        .blob-dark, .blob-dark-2 {
          border-radius: 50%;
          animation: floatDark 10s ease-in-out infinite alternate;
        }
        @keyframes morph {
          0% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; transform: rotate(0deg) scale(1); }
          50% { border-radius: 45% 55% 40% 60% / 60% 40% 60% 40%; transform: rotate(8deg) scale(1.08); }
          100% { border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%; transform: rotate(-5deg) scale(0.95); }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(20px) translateY(-15px); }
        }
        @keyframes drift2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(25px) translateY(10px); }
        }
        @keyframes drift3 {
          0% { transform: translateY(0); }
          100% { transform: translateY(18px) translateX(-10px); }
        }
        @keyframes floatDark {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(15px); }
        }
      `}</style>
    </div>
  );
}

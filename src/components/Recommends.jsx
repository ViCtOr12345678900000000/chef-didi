export default function Recommends() {
  return (
    <div className="max-w-[600px] mx-auto mt-8 px-4">
      <h3 className="text-center text-[11px] font-bold tracking-[0.2em] text-stone-400 uppercase">
        Chef Didi Recommends
      </h3>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* SLOT 1 - PAID - Example: Golden Penny */}
        <a href="https://goldenpenny.com" target="_blank" rel="noreferrer" className="bg-white border border-[#f0c27a] rounded-xl p-3 flex items-center gap-2 shadow-sm">
          <img src="https://via.placeholder.com/40x40.png?text=LOGO" alt="Golden Penny" className="w-10 h-10 rounded-full bg-[#fff8f0] object-cover" />
          <span>
            <span className="block text-[13px] font-bold text-[#1A1A2E]">Golden Penny</span>
            <span className="block text-[11px] text-stone-500">Tomato Paste →</span>
          </span>
        </a>

        {/* SLOT 2 - PAID - Example: Maggi */}
        <a href="https://maggi.com" target="_blank" rel="noreferrer" className="bg-white border border-[#f0c27a] rounded-xl p-3 flex items-center gap-2 shadow-sm">
          <img src="https://via.placeholder.com/40x40.png?text=LOGO" alt="Maggi" className="w-10 h-10 rounded-full bg-[#fff8f0] object-cover" />
          <span>
            <span className="block text-[13px] font-bold text-[#1A1A2E]">Maggi</span>
            <span className="block text-[11px] text-stone-500">Seasoning →</span>
          </span>
        </a>

        {/* SLOT 3 - EMPTY - Delete this block if no brand yet */}
        {/* 
        <a href="BRAND LINK" target="_blank" rel="noreferrer" className="bg-white border border-[#f0c27a] rounded-xl p-3 flex items-center gap-2 shadow-sm">
          <img src="BRAND LOGO" alt="Brand" className="w-10 h-10 rounded-full bg-[#fff8f0] object-cover" />
          <span>
            <span className="block text-[13px] font-bold text-[#1A1A2E]">Brand Name</span>
            <span className="block text-[11px] text-stone-500">Product →</span>
          </span>
        </a>
        */}

        {/* SLOT 4 - EMPTY - Same, delete if no brand yet */}
      </div>
    </div>
  );
}

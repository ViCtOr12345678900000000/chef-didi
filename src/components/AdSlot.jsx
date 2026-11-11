import { useEffect } from 'react';

const ADSENSE_CLIENT = "ca-pub-8335282148172571";

export default function AdSlot({ slot = "1234567890", inSidebar = false }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div
      className={`my-4 overflow-hidden ${inSidebar ? 'w-full max-w-full px-0' : 'px-4'}`}
      style={{ maxWidth: '100%' }}
    >
      <p className="text-center text-[10px] tracking-[0.2em] text-stone-300 uppercase mb-1">Advertisement</p>
      <div className="w-full max-w-full overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', maxWidth: '100%', overflow: 'hidden' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
      <style>{`
        .adsbygoogle, .adsbygoogle iframe {
          max-width: 100% !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}

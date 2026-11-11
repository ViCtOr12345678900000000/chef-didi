import { useEffect } from 'react';

const ADSENSE_CLIENT = "ca-pub-8335282148172571";

export default function AdSlot({ slot = "1234567890" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div className="my-4 px-4">
      <p className="text-center text-[10px] tracking-[0.2em] text-stone-300 uppercase mb-1">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

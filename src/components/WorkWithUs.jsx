import { useState } from 'react';

export default function WorkWithUs({ theme, compact = false }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [want, setWant] = useState('');
  const [budget, setBudget] = useState('');
  const [contact, setContact] = useState('');
  const [about, setAbout] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!name || !brand || !want || !contact) { alert('Please fill Name, Brand, What you want, and WhatsApp/Email'); return; }
    setLoading(true);

    // 1. Save to Upstash (your database)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, brand, want, budget, contact, about }),
      });
    } catch {}

    // 2. Send email via FormSubmit - EXACT SAME AS Advertise.jsx
    try {
      const formData = new FormData();
      formData.append('_subject', 'New Partner - Chef Didi');
      formData.append('_captcha', 'false');
      formData.append('Name', name);
      formData.append('Brand', brand);
      formData.append('Slot', want);
      formData.append('Budget', budget);
      formData.append('Contact', contact);
      formData.append('Message', about);

      await fetch('https://formsubmit.co/ajax/Vardevictor78@gmail.com', {
        method: 'POST',
        body: formData,
      });
      setSent(true);
    } catch {
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  const inputClass = `w-full bg-white border ${theme.softBorder} rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-stone-400 ${theme.focus}`;

  if (sent) {
    return (
      <div className={`${theme.softBg} border ${theme.softBorder} rounded-2xl p-6 text-center`}>
        <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${theme.btn} text-white flex items-center justify-center text-[20px]`}>✓</div>
        <h3 className="font-display text-[20px] font-semibold text-[#1A1A2E] mt-3">Request Sent!</h3>
        <p className="text-stone-500 text-[13px] mt-1">Thank you, {name}. Chef Didi will reach out to {brand} soon.</p>
        <button onClick={() => { setSent(false); setName(''); setBrand(''); setWant(''); setBudget(''); setContact(''); setAbout(''); }} className={`mt-4 text-[12px] font-bold ${theme.accent} underline`}>Send another request</button>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'max-w-[600px] mx-auto mt-8 px-4'}>
      {!compact && <div className="text-center mb-4"><h2 className="font-display text-[26px] font-semibold text-[#1A1A2E]">Book A Slot</h2><p className="text-stone-500 text-[14px]">Fill this form. Only Chef Didi sees it.</p></div>}
      {compact && <div className="mb-3"><h3 className="font-display text-[19px] font-semibold text-[#1A1A2E]">Book A Slot</h3><p className="text-stone-500 text-[12.5px]">For brands & partners.</p></div>}

      <form onSubmit={handleSend} className={`${theme.softBg} border ${theme.softBorder} rounded-2xl p-4 space-y-3 shadow-sm`}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className={inputClass} />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand Name" className={inputClass} />
        <select value={want} onChange={(e) => setWant(e.target.value)} className={`w-full bg-white border ${theme.softBorder} rounded-xl px-3 py-3 text-[14px] outline-none ${theme.focus}`}>
          <option value="">What do you want?</option>
          <option value="Billboard - Top of homepage">Billboard - Top of homepage</option>
          <option value="Sponsored Recipe">Sponsored Recipe</option>
          <option value="Chef Didi Recommends">Chef Didi Recommends</option>
          <option value="Not sure yet - advise me">Not sure yet - advise me</option>
        </select>
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Your Budget" className={inputClass} />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Your WhatsApp or Email" className={inputClass} />
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell Chef Didi about your brand" rows={3} className={`${inputClass} resize-none`} />
        <button type="submit" disabled={loading} className={`w-full text-white font-bold text-[15px] bg-gradient-to-r ${theme.btn} py-3.5 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60`}>
          {loading ? 'Sending...' : 'Send To Chef Didi'}
        </button>
        
      </form>
    </div>
  );
}

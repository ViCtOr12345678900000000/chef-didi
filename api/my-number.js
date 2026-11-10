export default async function handler(req, res) {
  try {
    const r = await fetch('https://abacus.jasoncameron.dev/info/chef-didi-secret-2026/visits');
    const data = await r.json();
    // Start from 1 to include your first Vercel Analytics visitor
    const count = (data.value || 0) + 1;
    res.status(200).json({ count });
  } catch {
    res.status(200).json({ count: 1 });
  }
}

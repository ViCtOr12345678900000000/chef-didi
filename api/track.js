export default async function handler(req, res) {
  try {
    await fetch('https://abacus.jasoncameron.dev/hit/chef-didi-secret-2026/visits');
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
}

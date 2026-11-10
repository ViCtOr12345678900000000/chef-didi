export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const getTotal = await fetch(
    `${url}/get/total_visitors`,
    { headers }
  ).then((r) => r.json());

  const getVisitors = await fetch(
    `${url}/lrange/visitors/0/49`,
    { headers }
  ).then((r) => r.json());

  const getUsers = await fetch(
    `${url}/lrange/users/0/99`,
    { headers }
  ).then((r) => r.json());

  const visitors = (getVisitors.result || []).map((v) => {
    try { return JSON.parse(v); } catch { return null; }
  }).filter(Boolean);

  const users = (getUsers.result || []).map((u) => {
    try { return JSON.parse(u); } catch { return null; }
  }).filter(Boolean);

  const total = Number(getTotal.result || 0) + 1;

  return res.status(200).json({
    count: total,
    visitors,
    users,
  });
}

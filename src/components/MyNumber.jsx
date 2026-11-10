import { useState, useEffect } from 'react';

export default function MyNumber() {
  const [count, setCount] = useState('...');
  useEffect(() => {
    fetch('/api/my-number')
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => setCount('?'));
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ fontSize: '120px', fontWeight: '700', color: '#1A1A2E', lineHeight: 1 }}>{count}</div>
    </div>
  );
}

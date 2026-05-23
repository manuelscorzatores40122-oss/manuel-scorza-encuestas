'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const INTERVAL = 30_000; // 30 s

export function AutoRefresh() {
  const router = useRouter();
  const [last, setLast]       = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);

  // Inicializar la hora solo en el cliente para evitar hydration mismatch
  useEffect(() => { setLast(new Date()); }, []);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setLast(new Date());
    setTimeout(() => setSpinning(false), 800);
  }

  useEffect(() => {
    const id = setInterval(refresh, INTERVAL);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
      <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>
        {last ? `Act. ${last.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}` : ''}
      </span>
      <button
        onClick={refresh}
        title="Actualizar ahora"
        style={{
          display:'flex', alignItems:'center', gap:'0.25rem',
          padding:'0.25rem 0.6rem', fontSize:'0.75rem', fontWeight:600,
          border:'1px solid #e5e7eb', borderRadius:'6px',
          background:'#fff', color:'#374151', cursor:'pointer',
        }}
      >
        <RefreshCw
          style={{
            width:'0.8rem', height:'0.8rem',
            transition:'transform 0.5s',
            transform: spinning ? 'rotate(360deg)' : 'none',
          }}
        />
        Actualizar
      </button>
    </div>
  );
}

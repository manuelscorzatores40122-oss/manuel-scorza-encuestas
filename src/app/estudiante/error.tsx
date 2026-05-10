'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function StudentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card border-red-200 bg-red-50 max-w-xl">
      <h2 className="font-semibold text-red-800 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" /> No se pudo cargar esta sección
      </h2>
      <p className="text-sm text-red-700 mt-2">
        La base de datos no respondió a tiempo. Esto suele ser temporal cuando Neon está iniciando o la conexión está inestable.
      </p>
      <button onClick={reset} className="btn-danger mt-4">
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );
}

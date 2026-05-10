import { AlertTriangle } from 'lucide-react';

export function DatabaseUnavailable({
  title = 'Base de datos no disponible',
  message = 'No se pudo conectar con Neon en este momento. Espera unos segundos y vuelve a intentar.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="card border-red-200 bg-red-50 max-w-xl">
      <h2 className="font-semibold text-red-800 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" /> {title}
      </h2>
      <p className="text-sm text-red-700 mt-2">{message}</p>
    </div>
  );
}

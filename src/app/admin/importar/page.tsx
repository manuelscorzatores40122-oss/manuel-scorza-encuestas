import { ImportarSiagie } from './ImportarSiagie';

export default function ImportarPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold">Importar nómina SIAGIE</h1>
      <p className="text-slate-600 text-sm">
        Sube el archivo Excel <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">rptPadresFamiliaEstudiantes.xlsx</code> exportado
        desde SIAGIE. Header en fila 12, datos desde fila 13.
      </p>
      <ImportarSiagie />
    </div>
  );
}

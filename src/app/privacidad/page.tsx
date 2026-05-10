import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <h1 className="text-3xl font-semibold text-slate-900">
          Aviso de Privacidad
        </h1>

        <p className="text-sm text-slate-500 mt-2 mb-10">
        I.E. 40122 Manuel Scorza Torres
        </p>

        <div className="space-y-8 text-slate-700 leading-7">
          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-2">
            </h2>
            <p>
              Los datos serán conservados mientras exista vínculo académico con
              la institución y posteriormente durante el plazo establecido por
              normativa interna.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
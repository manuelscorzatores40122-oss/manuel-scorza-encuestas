import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/login" className="inline-flex items-center gap-2 text-brand-600 mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Aviso de Privacidad</h1>
        <p className="text-slate-500 mb-8">PsicoEscolar — I.E. 40122 Manuel Scorza Torres</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Responsable del tratamiento</h2>
            <p>
              La I.E. 40122 Manuel Scorza Torres es responsable del tratamiento de los datos
              personales recolectados a través de este sistema, conforme a la Ley N° 29733 —
              Ley de Protección de Datos Personales del Perú y su reglamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Finalidad</h2>
            <p>
              Los datos se recolectan exclusivamente con fines de seguimiento del bienestar
              emocional del estudiantado, identificación de situaciones de riesgo y
              acompañamiento por parte del psicólogo escolar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. Datos recolectados</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Datos académicos: DNI, código de estudiante, grado, sección.</li>
              <li>Datos de identificación: nombres, apellidos, sexo, fecha de nacimiento.</li>
              <li>Datos del apoderado: nombre, documento, correo y celular de contacto.</li>
              <li>Respuestas a encuestas de bienestar, marcadas como sensibles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Acceso a la información</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>El psicólogo accede a respuestas individuales identificadas.</li>
              <li>Tutores y auxiliares acceden a respuestas de su grupo, sin alertas de riesgo.</li>
              <li>El director accede solo a estadísticas agregadas anonimizadas.</li>
              <li>El administrador gestiona usuarios y configuración, sin acceso a contenido de respuestas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Conservación</h2>
            <p>
              Los datos se conservan mientras el estudiante mantenga matrícula vigente y
              hasta tres años posteriores a su egreso, momento en el cual son eliminados o
              anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Derechos ARCO</h2>
            <p>
              Los apoderados pueden ejercer derechos de Acceso, Rectificación, Cancelación
              y Oposición sobre los datos del menor, dirigiéndose por escrito a la dirección
              de la institución.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Seguridad</h2>
            <p>
              El sistema implementa cifrado en tránsito (HTTPS), cifrado de contraseñas,
              control de acceso por rol y registro de auditoría de operaciones sensibles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Consentimiento</h2>
            <p>
              El uso del sistema por parte del estudiante presupone que el apoderado ha
              firmado el consentimiento informado entregado al inicio del año académico.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

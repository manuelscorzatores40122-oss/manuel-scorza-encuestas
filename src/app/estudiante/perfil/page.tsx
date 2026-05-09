import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { ProfileForm } from './ProfileForm';

export default async function PerfilEstudiantePage() {

  const session = await getSession();

  const student = await prisma.student.findUnique({
    where: {
      userId: session?.userId,
    },

    include: {
      apoderados: true,
    },
  });

  if (!student) {
    return (
      <p>No se encontró estudiante.</p>
    );
  }

  const contacts = {
    padre:
      student.apoderados.find(
        (a) => a.parentesco === 'PADRE'
      ) || null,

    madre:
      student.apoderados.find(
        (a) => a.parentesco === 'MADRE'
      ) || null,

    apoderado:
      student.apoderados.find(
        (a) =>
          a.parentesco === 'APODERADO'
      ) || null,
  };

  return (
    <div className="space-y-6">

      <header>
        <h1 className="text-2xl font-bold">
          Mi perfil
        </h1>

        <p className="text-slate-600">
          Actualiza tus datos de contacto.
        </p>
      </header>

      <ProfileForm contacts={contacts} />
    </div>
  );
}
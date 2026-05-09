import { redirect } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from './ProfileForm';

export default async function StudentProfilePage() {
  const session = (await getSession())!;
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
    },
  });

  if (!student) redirect('/login');

  const contacts = {
    padre: student.apoderados.find((a) => a.parentesco === 'PADRE') || null,
    madre: student.apoderados.find((a) => a.parentesco === 'MADRE') || null,
    apoderado: student.apoderados.find((a) => a.parentesco === 'APODERADO') || null,
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserRound className="w-6 h-6 text-warm-600" /> Mi perfil y contactos
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {student.nombres} {student.apellidoPaterno} {student.apellidoMaterno} · {student.section.grade.name} {student.section.name}
        </p>
      </header>

      <div className="card bg-warm-50 border-warm-200">
        <p className="text-sm text-warm-900">
          Mantén actualizado el celular del apoderado o contacto de emergencia. El colegio lo usará solo para situaciones importantes.
        </p>
      </div>

      <ProfileForm
        contacts={{
          padre: contacts.padre && serializeContact(contacts.padre),
          madre: contacts.madre && serializeContact(contacts.madre),
          apoderado: contacts.apoderado && serializeContact(contacts.apoderado),
        }}
      />
    </div>
  );
}

function serializeContact(contact: {
  parentesco: 'PADRE' | 'MADRE' | 'APODERADO' | 'OTRO';
  apellidosNombres: string;
  sexo: 'M' | 'F' | null;
  numeroDocumento: string | null;
  correo: string | null;
  celular: string | null;
}) {
  return {
    parentesco: contact.parentesco,
    apellidosNombres: contact.apellidosNombres,
    sexo: contact.sexo,
    numeroDocumento: contact.numeroDocumento,
    correo: contact.correo,
    celular: contact.celular,
  };
}

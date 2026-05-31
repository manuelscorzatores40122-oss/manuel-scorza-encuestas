import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logoutAction } from '@/app/login/actions';
import { FormularioPerfil } from './FormularioPerfil';
import styles from './perfil.module.css';

export default async function PerfilEstudiantePage() {
  const session = await getSession();

  const student = await prisma.student.findUnique({
    where: { userId: session?.userId },
    include: {
      apoderados: true,
      section: { include: { grade: true } },
    },
  });

  if (!student) return <p>No se encontró estudiante.</p>;

  const contacts = {
    padre:    student.apoderados.find((a) => a.parentesco === 'PADRE')    || null,
    madre:    student.apoderados.find((a) => a.parentesco === 'MADRE')    || null,
    apoderado:student.apoderados.find((a) => a.parentesco === 'APODERADO')|| null,
  };

  const initials = (student.apellidoPaterno[0] + student.nombres[0]).toUpperCase();
  const fullName = `${student.apellidoPaterno} ${student.apellidoMaterno}, ${student.nombres}`;
  const grade = `${student.section.grade.name} ${student.section.name}`;

  async function handleLogout() {
    'use server';
    await logoutAction();
    redirect('/login');
  }

  return (
    <div className={styles.page}>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerAvatar}>{initials}</div>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Mi perfil</h1>
          <p className={styles.bannerName}>{fullName} · {grade}</p>
        </div>
        <form action={handleLogout} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutBtn}>
            <LogOut size={14} />
            Salir
          </button>
        </form>
      </div>

      <FormularioPerfil contacts={contacts} />
    </div>
  );
}
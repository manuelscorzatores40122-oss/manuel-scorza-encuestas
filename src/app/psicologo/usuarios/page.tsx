import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GestorPsicologos } from './GestorPsicologos';
import styles from './usuarios.module.css';

const MASTER_PSI = 'psicologo@scorzatorres.edu.pe';

export default async function PsicologoUsuarios() {
  const session = await getSession();
  if (!session || (session.username !== MASTER_PSI && session.role !== 'ADMIN')) {
    redirect('/psicologo');
  }

  const psicologos = await prisma.user.findMany({
    where: { role: 'PSYCHOLOGIST' },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      isActive: true,
      lastLogin: true,
    },
  });

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Psicólogo</p>
        <h1 className={styles.pageTitle}>Equipo de Psicología</h1>
        <p className={styles.pageSub}>Registra y gestiona los psicólogos del colegio</p>
      </header>

      <div className={styles.body}>
        <GestorPsicologos psicologos={psicologos} />
      </div>

    </div>
  );
}

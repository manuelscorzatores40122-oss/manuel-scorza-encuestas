import { prisma } from '@/lib/prisma';
import { ROLE_LABELS } from '@/lib/constants';
import { TablaUsuarios } from './TablaUsuarios';
import styles from './page.module.css';

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: { rol?: string; q?: string };
}) {
  const q = searchParams.q?.trim() || '';
  const where: any = {};

  if (searchParams.rol) {
    where.role = searchParams.rol;
  } else if (!q) {
    where.role = { not: 'STUDENT' };
  }

  if (q) {
    where.fullName = { contains: q, mode: 'insensitive' };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    take: 500,
  });

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.head}>
        <p className={styles.kicker}>Panel · Administrador</p>
        <h1 className={styles.title}>Usuarios</h1>
      </header>
      <div className={styles.rule} />

      {/* ── Búsqueda ── */}
      <form className={styles.searchBox}>
        <p className={styles.searchKicker}>Buscar y filtrar</p>
        <div className={styles.searchRow}>
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Nombre o apellido</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Incluye alumnos…"
              className={styles.input}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={styles.label}>Filtrar por rol</label>
            <select name="rol" defaultValue={searchParams.rol || ''} className={styles.select}>
              <option value="">Solo staff</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button className={styles.searchBtn} type="submit">Buscar</button>
        </div>
      </form>

      {/* ── Tabla interactiva ── */}
      <TablaUsuarios
        users={users.map(u => ({
          id:        u.id,
          username:  u.username,
          fullName:  u.fullName,
          role:      u.role,
          email:     u.email,
          isActive:  u.isActive,
          lastLogin: u.lastLogin?.toISOString() || null,
        }))}
      />
    </div>
  );
}

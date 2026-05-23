/**
 * Corrige los usuarios de estudiantes migrados desde manuel_db:
 *  - username → DNI del estudiante
 *  - passwordHash → bcrypt(dni.slice(-6), 10)
 *
 * Uso: npx tsx scripts/fix-student-passwords.ts
 */
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

async function main() {
  const students = await prisma.student.findMany({
    select: { userId: true, dni: true, nombres: true, apellidoPaterno: true },
  });

  console.log(`Procesando ${students.length} estudiantes...`);

  let updated = 0;
  let errors = 0;

  for (const s of students) {
    const clave = s.dni.slice(-6);
    try {
      await prisma.user.update({
        where: { id: s.userId },
        data: {
          username: s.dni,
          passwordHash: await hashPassword(clave),
        },
      });
      updated++;
      if (updated % 50 === 0) process.stdout.write(`  ${updated}/${students.length}\r`);
    } catch (err) {
      console.error(`  Error en DNI ${s.dni}:`, err);
      errors++;
    }
  }

  console.log(`\n✅ Actualizados: ${updated}  ❌ Errores: ${errors}`);
  console.log('\nFormato de login:');
  console.log('  Usuario   → DNI del estudiante');
  console.log('  Contraseña → últimos 6 dígitos del DNI');

  const sample = students.slice(0, 3);
  console.log('\nEjemplos:');
  for (const s of sample) {
    console.log(`  ${s.apellidoPaterno} ${s.nombres}: usuario="${s.dni}"  clave="${s.dni.slice(-6)}"`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Regla única: últimos 6 dígitos numéricos del documento, con ceros a la izq. si hacen falta.
function derivarClave(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length >= 6) return digits.slice(-6);
  return digits.padStart(6, '0');
}

async function main() {
  const students = await prisma.student.findMany({
    select: { id: true, dni: true, nombres: true, apellidoPaterno: true, userId: true },
  });

  const extranjeros = students.filter(s => s.dni.replace(/\D/g, '').length !== 8);

  console.log(`\nActualizando ${extranjeros.length} estudiantes extranjeros...\n`);

  for (const s of extranjeros) {
    const clave = derivarClave(s.dni);
    const hash  = await bcrypt.hash(clave, 10);
    await prisma.user.update({
      where: { id: s.userId },
      data: { passwordHash: hash },
    });
    console.log(`✓ ${s.apellidoPaterno} ${s.nombres} | doc: ${s.dni} → clave: ${clave}`);
  }

  console.log('\n✅ Contraseñas actualizadas correctamente.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

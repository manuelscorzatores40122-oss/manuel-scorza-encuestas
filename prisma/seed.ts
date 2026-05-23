import { PrismaClient, Nivel, Role, Sexo, EstadoMatricula, QuestionType, AlertRuleType, Parentesco } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ============================================================
  // 1. GRADOS Y SECCIONES
  // ============================================================
  const primariaGrades = [];
  for (let i = 1; i <= 6; i++) {
    const g = await prisma.grade.upsert({
      where: { nivel_order: { nivel: Nivel.PRIMARIA, order: i } },
      update: {},
      create: { name: `${i}°`, order: i, nivel: Nivel.PRIMARIA },
    });
    primariaGrades.push(g);
  }

  const secundariaGrades = [];
  for (let i = 1; i <= 5; i++) {
    const g = await prisma.grade.upsert({
      where: { nivel_order: { nivel: Nivel.SECUNDARIA, order: i } },
      update: {},
      create: { name: `${i}°`, order: i, nivel: Nivel.SECUNDARIA },
    });
    secundariaGrades.push(g);
  }

  const allGrades = [...primariaGrades, ...secundariaGrades];
  for (const grade of allGrades) {
    for (const sec of ['A', 'B']) {
      await prisma.section.upsert({
        where: { gradeId_name: { gradeId: grade.id, name: sec } },
        update: {},
        create: { name: sec, gradeId: grade.id },
      });
    }
  }
  console.log(`✅ ${allGrades.length} grados × 2 secciones creados`);//

  // ============================================================
  // 2. USUARIOS DEMO (admin, psicólogo, director, tutor, auxiliar, estudiante)
  // ============================================================
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'admin@scorzatorres.edu.pe',
      passwordHash,
      role: Role.ADMIN,
      fullName: 'Administrador del Sistema',
      email: 'admin@scorzatorres.edu.pe',
    },
  });

  const psicologo = await prisma.user.upsert({
    where: { username: 'psicologo@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'psicologo@scorzatorres.edu.pe',
      passwordHash,
      role: Role.PSYCHOLOGIST,
      fullName: 'Lic. María Fernández',
      email: 'psicologo@scorzatorres.edu.pe',
    },
  });

  await prisma.user.upsert({
    where: { username: 'director@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'director@scorzatorres.edu.pe',
      passwordHash,
      role: Role.DIRECTOR,
      fullName: 'Director del I.E.',
      email: 'director@scorzatorres.edu.pe',
    },
  });

  await prisma.user.upsert({
    where: { username: 'auxiliar@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'auxiliar@scorzatorres.edu.pe',
      passwordHash,
      role: Role.AUXILIAR,
      fullName: 'Auxiliar de Educación',
      email: 'auxiliar@scorzatorres.edu.pe',
    },
  });

  // Tutor asignado a 1° A primaria
  const seccion1A = await prisma.section.findFirst({
    where: { name: 'A', grade: { nivel: Nivel.PRIMARIA, order: 1 } },
  });
  const tutor = await prisma.user.upsert({
    where: { username: 'tutor1a@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'tutor1a@scorzatorres.edu.pe',
      passwordHash,
      role: Role.TUTOR,
      fullName: 'Prof. Tutor 1° A Primaria',
      email: 'tutor1a@scorzatorres.edu.pe',
    },
  });
  if (seccion1A) {
    await prisma.section.update({
      where: { id: seccion1A.id },
      data: { tutorId: tutor.id },
    });
  }

  console.log('✅ Usuarios staff creados');

  /*/ ============================================================
  // 3. ESTUDIANTES DEMO (3 para probar)
  // ============================================================
  const demoStudents = [
    {
      dni: '70000001',
      nombres: 'JUAN CARLOS',
      apellidoPaterno: 'GARCIA',
      apellidoMaterno: 'LOPEZ',
      sexo: Sexo.M,
      nivel: Nivel.PRIMARIA,
      gradeOrder: 1,
      seccion: 'A',
    },
    {
      dni: '70000002',
      nombres: 'MARIA FERNANDA',
      apellidoPaterno: 'TORRES',
      apellidoMaterno: 'RAMIREZ',
      sexo: Sexo.F,
      nivel: Nivel.SECUNDARIA,
      gradeOrder: 3,
      seccion: 'B',
    },
    {
      dni: '70000003',
      nombres: 'LUIS ANTONIO',
      apellidoPaterno: 'VARGAS',
      apellidoMaterno: 'CHAVEZ',
      sexo: Sexo.M,
      nivel: Nivel.SECUNDARIA,
      gradeOrder: 1,
      seccion: 'A',
    },
  ];

  for (const s of demoStudents) {
    const section = await prisma.section.findFirst({
      where: { name: s.seccion, grade: { nivel: s.nivel, order: s.gradeOrder } },
    });
    if (!section) continue;

    const user = await prisma.user.upsert({
      where: { username: s.dni },
      update: {},
      create: {
        username: s.dni,
        passwordHash: await bcrypt.hash(s.dni.slice(-6), 10), // clave = últimos 6 del DNI
        role: Role.STUDENT,
        fullName: `${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
      },
    });

    await prisma.student.upsert({
      where: { dni: s.dni },
      update: {},
      create: {
        userId: user.id,
        dni: s.dni,
        apellidoPaterno: s.apellidoPaterno,
        apellidoMaterno: s.apellidoMaterno,
        nombres: s.nombres,
        sexo: s.sexo,
        fechaNacimiento: new Date(2015, 0, 1),
        edad: 10,
        sectionId: section.id,
        estadoMatricula: EstadoMatricula.DEFINITIVA,
        anioAcademico: 2026,
        apoderados: {
          create: [
            {
              parentesco: Parentesco.MADRE,
              apellidosNombres: `MADRE DE ${s.nombres}`,
              correo: `apoderado.${s.dni}@example.com`,
              celular: '999999999',
              esContactoPrincipal: true,
            },
          ],
        },
      },
    });
  }
  console.log('✅ 3 estudiantes demo creados (login: DNI / clave: últimos 6 del DNI)');
*/
  // ============================================================
  // 4. ENCUESTA INICIAL (los 9 campos del bienestar semanal)
  // ============================================================
  const existing = await prisma.survey.findFirst({ where: { title: 'Bienestar semanal' } });
  let survey = existing;
  if (!existing) {
    survey = await prisma.survey.create({
      data: {
        title: 'Bienestar semanal',
        description: 'Cuéntanos cómo te has sentido esta semana. Tus respuestas son privadas y solo las ve el psicólogo del colegio.',
        isActive: true,
        createdById: psicologo.id,
        targetGrades: allGrades.map((g) => g.id),
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Cómo te has sentido esta semana?',
              order: 1,
              riskScore: 0,
              options: [
                { label: 'Muy bien', value: 'muy_bien', riskScore: 0 },
                { label: 'Bien', value: 'bien', riskScore: 0 },
                { label: 'Regular', value: 'regular', riskScore: 1 },
                { label: 'Mal', value: 'mal', riskScore: 3 },
                { label: 'Muy mal', value: 'muy_mal', riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has sentido estrés o ansiedad últimamente?',
              order: 2,
              options: [
                { label: 'Nunca', value: 'nunca', riskScore: 0 },
                { label: 'A veces', value: 'a_veces', riskScore: 1 },
                { label: 'Frecuentemente', value: 'frecuente', riskScore: 3 },
                { label: 'Siempre', value: 'siempre', riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Tienes alguien con quien hablar cuando te sientes mal?',
              order: 3,
              options: [
                { label: 'Sí', value: 'si', riskScore: 0 },
                { label: 'No', value: 'no', riskScore: 3 },
                { label: 'No estoy seguro/a', value: 'inseguro', riskScore: 2 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has tenido problemas con compañeros?',
              order: 4,
              options: [
                { label: 'Sí', value: 'si', riskScore: 2 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: 'Describe cómo te sientes actualmente',
              order: 5,
              required: false,
              riskScore: 0,
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Te gustaría hablar con el psicólogo?',
              order: 6,
              options: [
                { label: 'Sí', value: 'si', riskScore: 2 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta inicial "Bienestar semanal" creada');

  // ============================================================
  // 5. REGLAS DE ALERTA POR DEFECTO
  // ============================================================
  const reglas = [
    {
      name: 'Palabras clave críticas',
      type: AlertRuleType.KEYWORD,
      severity: 'HIGH',
      config: {
        keywords: [
          'suicid', 'matarme', 'morir', 'no quiero vivir', 'hacerme daño',
          'cortarme', 'desaparecer', 'no aguanto', 'nadie me quiere',
          'odio mi vida', 'sin sentido', 'sin esperanza',
        ],
      },
    },
    {
      name: 'Estado emocional muy bajo + sin red de apoyo',
      type: AlertRuleType.COMBINATION,
      severity: 'HIGH',
      config: {
        rules: [
          { questionOrder: 1, valueIn: ['mal', 'muy_mal'] },
          { questionOrder: 3, valueIn: ['no'] },
        ],
      },
    },
    {
      name: 'Score de riesgo elevado',
      type: AlertRuleType.SCORE,
      severity: 'MID',
      config: { threshold: 8 },
    },
    {
      name: 'Score de riesgo crítico',
      type: AlertRuleType.SCORE,
      severity: 'HIGH',
      config: { threshold: 12 },
    },
  ];

  for (const r of reglas) {
    const exists = await prisma.alertRule.findFirst({ where: { name: r.name } });
    if (!exists) {
      await prisma.alertRule.create({
        data: { ...r, createdById: admin.id },
      });
    }
  }
  console.log('✅ Reglas de alerta por defecto creadas');

  console.log('\n🎉 Seed completado.\n');
  console.log('Credenciales de prueba (clave: demo1234):');
  console.log('  - admin@scorzatorres.edu.pe       → Administrador');
  console.log('  - psicologo@scorzatorres.edu.pe   → Psicólogo');
  console.log('  - director@scorzatorres.edu.pe    → Director');
  console.log('  - auxiliar@scorzatorres.edu.pe    → Auxiliar');
  console.log('  - tutor1a@scorzatorres.edu.pe     → Tutor 1°A primaria');
  console.log('\nEstudiantes demo (clave: últimos 6 dígitos del DNI):');
  console.log('  - 70000001 (clave: 000001)  → 1° A primaria');
  console.log('  - 70000002 (clave: 000002)  → 3° B secundaria');
  console.log('  - 70000003 (clave: 000003)  → 1° A secundaria');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

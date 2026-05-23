/**
 * Crea usuarios staff, encuestas básicas y anuncios iniciales.
 * Uso: npx tsx scripts/seed-encuestas-anuncios.ts
 */
import { PrismaClient, Role, QuestionType, AlertRuleType } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de encuestas y anuncios...\n');

  // ──────────────────────────────────────────────
  // 1. USUARIOS STAFF
  // ──────────────────────────────────────────────
  const passDemo = await hashPassword('demo1234');

  const admin = await prisma.user.upsert({
    where: { username: 'admin@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'admin@scorzatorres.edu.pe',
      passwordHash: passDemo,
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
      passwordHash: passDemo,
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
      passwordHash: passDemo,
      role: Role.DIRECTOR,
      fullName: 'Director General',
      email: 'director@scorzatorres.edu.pe',
    },
  });

  await prisma.user.upsert({
    where: { username: 'auxiliar@scorzatorres.edu.pe' },
    update: {},
    create: {
      username: 'auxiliar@scorzatorres.edu.pe',
      passwordHash: passDemo,
      role: Role.AUXILIAR,
      fullName: 'Auxiliar de Educación',
      email: 'auxiliar@scorzatorres.edu.pe',
    },
  });

  console.log('✅ Usuarios staff creados (clave: demo1234)');

  // ──────────────────────────────────────────────
  // 2. TODOS LOS GRADOS (para targetGrades)
  // ──────────────────────────────────────────────
  const todosLosGrados = await prisma.grade.findMany({ select: { id: true } });
  const idsGrados = todosLosGrados.map((g) => g.id);

  // ──────────────────────────────────────────────
  // 3. ENCUESTAS
  // ──────────────────────────────────────────────

  // 3.1 Bienestar Semanal
  const enc1 = await prisma.survey.upsert({
    where: { id: 'encuesta-bienestar-semanal' },
    update: {},
    create: {
      id: 'encuesta-bienestar-semanal',
      title: 'Bienestar Semanal',
      description: 'Cuéntanos cómo te has sentido esta semana. Tus respuestas son privadas y solo las ve el psicólogo del colegio.',
      isActive: true,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          {
            order: 1, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo te has sentido esta semana?',
            options: [
              { label: 'Muy bien',  value: 'muy_bien', riskScore: 0 },
              { label: 'Bien',      value: 'bien',     riskScore: 0 },
              { label: 'Regular',   value: 'regular',  riskScore: 1 },
              { label: 'Mal',       value: 'mal',      riskScore: 3 },
              { label: 'Muy mal',   value: 'muy_mal',  riskScore: 5 },
            ],
          },
          {
            order: 2, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Has sentido estrés o ansiedad últimamente?',
            options: [
              { label: 'Nunca',          value: 'nunca',    riskScore: 0 },
              { label: 'A veces',        value: 'a_veces',  riskScore: 1 },
              { label: 'Frecuentemente', value: 'frecuente',riskScore: 3 },
              { label: 'Siempre',        value: 'siempre',  riskScore: 5 },
            ],
          },
          {
            order: 3, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Tienes a alguien con quien hablar cuando te sientes mal?',
            options: [
              { label: 'Sí',              value: 'si',       riskScore: 0 },
              { label: 'No',              value: 'no',       riskScore: 3 },
              { label: 'No estoy seguro/a', value: 'inseguro', riskScore: 2 },
            ],
          },
          {
            order: 4, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Has tenido problemas con algún compañero/a esta semana?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 2 },
              { label: 'No', value: 'no', riskScore: 0 },
            ],
          },
          {
            order: 5, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Has faltado a clases por motivos emocionales?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 2 },
              { label: 'No', value: 'no', riskScore: 0 },
            ],
          },
          {
            order: 6, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿Hay algo más que quieras contarnos? (opcional)',
            options: null,
          },
          {
            order: 7, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Te gustaría hablar con el psicólogo del colegio?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 0 },
              { label: 'No', value: 'no', riskScore: 0 },
            ],
          },
        ],
      },
    },
  });

  // 3.2 Convivencia Escolar
  const enc2 = await prisma.survey.upsert({
    where: { id: 'encuesta-convivencia' },
    update: {},
    create: {
      id: 'encuesta-convivencia',
      title: 'Convivencia Escolar',
      description: 'Queremos saber cómo te sientes en el colegio y con tus compañeros. Responde con sinceridad.',
      isActive: true,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          {
            order: 1, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo describes el ambiente en tu salón de clases?',
            options: [
              { label: 'Muy bueno',  value: 'muy_bueno', riskScore: 0 },
              { label: 'Bueno',      value: 'bueno',     riskScore: 0 },
              { label: 'Regular',    value: 'regular',   riskScore: 1 },
              { label: 'Malo',       value: 'malo',      riskScore: 3 },
              { label: 'Muy malo',   value: 'muy_malo',  riskScore: 5 },
            ],
          },
          {
            order: 2, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Con qué frecuencia ves situaciones de bullying en tu colegio?',
            options: [
              { label: 'Nunca',          value: 'nunca',     riskScore: 0 },
              { label: 'Pocas veces',    value: 'pocas',     riskScore: 1 },
              { label: 'Frecuentemente', value: 'frecuente', riskScore: 3 },
              { label: 'Casi siempre',   value: 'siempre',   riskScore: 5 },
            ],
          },
          {
            order: 3, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Alguna vez has sido víctima de bullying en este colegio?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 5 },
              { label: 'No', value: 'no', riskScore: 0 },
            ],
          },
          {
            order: 4, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Te sientes seguro/a en el colegio?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 0 },
              { label: 'No', value: 'no', riskScore: 4 },
            ],
          },
          {
            order: 5, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo es tu relación con tus profesores?',
            options: [
              { label: 'Muy buena', value: 'muy_buena', riskScore: 0 },
              { label: 'Buena',     value: 'buena',     riskScore: 0 },
              { label: 'Regular',   value: 'regular',   riskScore: 1 },
              { label: 'Mala',      value: 'mala',      riskScore: 3 },
            ],
          },
          {
            order: 6, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿Quieres contarnos algo sobre la convivencia en tu colegio? (opcional)',
            options: null,
          },
        ],
      },
    },
  });

  // 3.3 Apoyo Familiar y Emocional
  const enc3 = await prisma.survey.upsert({
    where: { id: 'encuesta-apoyo-familiar' },
    update: {},
    create: {
      id: 'encuesta-apoyo-familiar',
      title: 'Apoyo Familiar y Emocional',
      description: 'Esta encuesta nos ayuda a entender mejor tu situación familiar y emocional. Todo es confidencial.',
      isActive: false,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          {
            order: 1, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo es el ambiente en tu hogar?',
            options: [
              { label: 'Muy tranquilo',  value: 'muy_tranquilo', riskScore: 0 },
              { label: 'Tranquilo',      value: 'tranquilo',     riskScore: 0 },
              { label: 'A veces tenso',  value: 'tenso',         riskScore: 2 },
              { label: 'Muy conflictivo', value: 'conflictivo',  riskScore: 5 },
            ],
          },
          {
            order: 2, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Tienes apoyo de tu familia cuando tienes problemas?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 0 },
              { label: 'No', value: 'no', riskScore: 4 },
            ],
          },
          {
            order: 3, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo te sientes con respecto a tu rendimiento en el colegio?',
            options: [
              { label: 'Muy bien',  value: 'muy_bien', riskScore: 0 },
              { label: 'Bien',      value: 'bien',     riskScore: 0 },
              { label: 'Con dudas', value: 'dudas',    riskScore: 1 },
              { label: 'Mal',       value: 'mal',      riskScore: 3 },
              { label: 'Muy mal',   value: 'muy_mal',  riskScore: 5 },
            ],
          },
          {
            order: 4, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Has pensado alguna vez en hacerte daño?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 10 },
              { label: 'No', value: 'no', riskScore: 0  },
            ],
          },
          {
            order: 5, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿Hay algo que quieras compartir con el psicólogo? (opcional)',
            options: null,
          },
        ],
      },
    },
  });

  console.log(`✅ 3 encuestas creadas:`);
  console.log(`   • "${enc1.title}" (activa)`);
  console.log(`   • "${enc2.title}" (activa)`);
  console.log(`   • "${enc3.title}" (inactiva - para usar después)`);

  // ──────────────────────────────────────────────
  // 4. REGLAS DE ALERTA
  // ──────────────────────────────────────────────
  const reglas = [
    {
      name: 'Palabras de riesgo crítico',
      type: AlertRuleType.KEYWORD,
      severity: 'HIGH',
      config: {
        keywords: [
          'suicid', 'matarme', 'morir', 'no quiero vivir',
          'hacerme daño', 'cortarme', 'desaparecer',
          'no aguanto', 'nadie me quiere', 'odio mi vida',
          'sin sentido', 'sin esperanza',
        ],
      },
    },
    {
      name: 'Emoción muy baja + sin apoyo',
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
      await prisma.alertRule.create({ data: { ...r, createdById: psicologo.id } });
    }
  }
  console.log('✅ 4 reglas de alerta configuradas');

  // ──────────────────────────────────────────────
  // 5. ANUNCIOS
  // ──────────────────────────────────────────────
  const anuncios = [
    {
      title: 'Bienvenidos al Año Escolar 2026',
      content: `Estimados estudiantes,

El equipo de Psicología Escolar les da la bienvenida al año académico 2026. Estamos aquí para apoyarlos en todo lo que necesiten.

Recuerden que el psicólogo del colegio está disponible para escucharlos y orientarlos en situaciones personales, emocionales o académicas. No estás solo/a.

¡Mucho ánimo en este nuevo año!`,
      targetRoles: ['STUDENT', 'TUTOR', 'DIRECTOR'],
    },
    {
      title: 'Encuesta de Bienestar Semanal — ¡Participa!',
      content: `Hola a todos,

Hemos lanzado la encuesta "Bienestar Semanal". Es una forma de contarnos cómo te estás sintiendo cada semana.

Tus respuestas son **privadas y confidenciales** — solo las verá el psicólogo del colegio para ayudarte mejor.

Ingresa a tu cuenta y completa la encuesta. ¡Solo toma unos minutos!`,
      targetRoles: ['STUDENT'],
    },
    {
      title: 'Encuesta de Convivencia Escolar — Ya disponible',
      content: `Estimados estudiantes,

Queremos conocer tu opinión sobre el clima escolar en nuestra institución. La encuesta "Convivencia Escolar" está ahora disponible en tu panel.

Tu opinión es importante para mejorar el ambiente en el colegio. Responde con sinceridad.`,
      targetRoles: ['STUDENT'],
    },
    {
      title: 'Servicio de Orientación Psicológica',
      content: `Información para estudiantes y tutores:

El servicio de orientación psicológica está disponible para todos los alumnos de la institución. Si necesitas apoyo por:

• Problemas emocionales o de ansiedad
• Dificultades en el aprendizaje
• Problemas con compañeros o en casa
• Cualquier situación que te preocupe

Puedes solicitar una cita directamente respondiendo "Sí" en la encuesta semanal cuando se pregunta si deseas hablar con el psicólogo.

Todo es estrictamente confidencial.`,
      targetRoles: ['STUDENT', 'TUTOR'],
    },
    {
      title: 'Comunicado para Tutores — Seguimiento de Encuestas',
      content: `Estimados tutores,

Les informamos que el sistema PsicoEscolar ya está activo. Como tutores, pueden ver el resumen de bienestar de su sección desde su panel.

Si detectan señales de alerta en algún estudiante, comuníquense de inmediato con el departamento de psicología.

Gracias por su compromiso con el bienestar de nuestros alumnos.`,
      targetRoles: ['TUTOR', 'DIRECTOR'],
    },
  ];

  for (const a of anuncios) {
    await prisma.announcement.create({
      data: {
        title: a.title,
        content: a.content,
        targetRoles: a.targetRoles,
        isPublished: true,
        createdById: psicologo.id,
      },
    });
  }
  console.log(`✅ ${anuncios.length} anuncios publicados`);

  // ──────────────────────────────────────────────
  // RESUMEN
  // ──────────────────────────────────────────────
  console.log('\n🎉 Seed completado.\n');
  console.log('Credenciales staff (clave: demo1234):');
  console.log('  psicologo@scorzatorres.edu.pe  → Psicólogo');
  console.log('  director@scorzatorres.edu.pe   → Director');
  console.log('  auxiliar@scorzatorres.edu.pe   → Auxiliar');
  console.log('  admin@scorzatorres.edu.pe       → Admin');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

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

  // ── Encuesta 2: Detección de Acoso Escolar ──────────────────
  const existeBullying = await prisma.survey.findFirst({ where: { title: 'Detección de Acoso Escolar (Bullying)' } });
  if (!existeBullying) {
    await prisma.survey.create({
      data: {
        title: 'Detección de Acoso Escolar (Bullying)',
        description: 'Esta encuesta es confidencial. Ayúdanos a conocer tu experiencia en el colegio para poder apoyarte mejor.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Has sido molestado, insultado o agredido por algún compañero esta semana?',
              order: 1,
              riskScore: 0,
              options: [
                { label: 'No, para nada',        value: 'nunca',        riskScore: 0 },
                { label: 'Una o dos veces',       value: 'una_vez',      riskScore: 2 },
                { label: 'Varias veces',          value: 'varias',       riskScore: 4 },
                { label: 'Casi todos los días',   value: 'casi_siempre', riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has visto a algún compañero ser agredido o maltratado?',
              order: 2,
              riskScore: 0,
              options: [
                { label: 'No',          value: 'no',       riskScore: 0 },
                { label: 'Una vez',     value: 'una_vez',  riskScore: 1 },
                { label: 'Varias veces',value: 'varias',   riskScore: 2 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has sentido miedo o ganas de no venir al colegio por problemas con compañeros?',
              order: 3,
              riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 4 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.MULTI,
              text: '¿En qué lugares ocurren los problemas? (puedes marcar varios)',
              order: 4,
              required: false,
              riskScore: 0,
              options: [
                { label: 'En el aula',              value: 'aula',          riskScore: 0 },
                { label: 'En el patio',              value: 'patio',         riskScore: 0 },
                { label: 'En los baños',             value: 'banos',         riskScore: 1 },
                { label: 'Fuera del colegio',        value: 'fuera',         riskScore: 1 },
                { label: 'En redes sociales / chat', value: 'redes_sociales',riskScore: 2 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has contado a algún adulto (docente, padre/madre) lo que está pasando?',
              order: 5,
              riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 0 },
                { label: 'No', value: 'no', riskScore: 2 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: 'Si quieres, cuéntanos brevemente qué está pasando (esto solo lo verá el psicólogo)',
              order: 6,
              required: false,
              riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Detección de Acoso Escolar" creada (inactiva)');

  // ── Encuesta 3: Entorno Familiar ────────────────────────────
  const existeFamiliar = await prisma.survey.findFirst({ where: { title: 'Entorno Familiar y Bienestar en Casa' } });
  if (!existeFamiliar) {
    await prisma.survey.create({
      data: {
        title: 'Entorno Familiar y Bienestar en Casa',
        description: 'Queremos conocer cómo te encuentras en casa para brindarte el apoyo que necesitas. Tus respuestas son privadas.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Cómo describirías el ambiente en tu hogar esta semana?',
              order: 1,
              riskScore: 0,
              options: [
                { label: 'Muy tranquilo y bien',        value: 'muy_tranquilo', riskScore: 0 },
                { label: 'Tranquilo, normal',           value: 'tranquilo',     riskScore: 0 },
                { label: 'Algo tenso o con problemas',  value: 'tenso',         riskScore: 3 },
                { label: 'Muy tenso, con conflictos',   value: 'muy_tenso',     riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Tienes un adulto en casa con quien puedas hablar cuando tienes problemas?',
              order: 2,
              riskScore: 0,
              options: [
                { label: 'Sí, siempre puedo hablar con alguien', value: 'si',        riskScore: 0 },
                { label: 'A veces, depende del momento',         value: 'a_veces',   riskScore: 1 },
                { label: 'No, no tengo a nadie con quien hablar',value: 'no',        riskScore: 4 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has presenciado discusiones o conflictos fuertes en casa?',
              order: 3,
              riskScore: 0,
              options: [
                { label: 'No, todo está bien',              value: 'no',            riskScore: 0 },
                { label: 'Raramente',                       value: 'raramente',     riskScore: 1 },
                { label: 'A veces',                         value: 'a_veces',       riskScore: 3 },
                { label: 'Con frecuencia',                  value: 'frecuente',     riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Tu familia cubre tus necesidades básicas (alimentación, útiles escolares, ropa)?',
              order: 4,
              riskScore: 0,
              options: [
                { label: 'Sí, siempre',             value: 'siempre',      riskScore: 0 },
                { label: 'Casi siempre',             value: 'casi_siempre', riskScore: 1 },
                { label: 'A veces nos falta algo',   value: 'a_veces',      riskScore: 3 },
                { label: 'Frecuentemente nos falta', value: 'frecuente',    riskScore: 5 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Tienes que trabajar o realizar actividades fuera del colegio que te impidan estudiar?',
              order: 5,
              riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 4 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Hay algo en casa que te preocupe mucho y quieras contarnos? (solo lo verá el psicólogo)',
              order: 6,
              required: false,
              riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Entorno Familiar y Bienestar en Casa" creada (inactiva)');

  // ── Encuesta 4: Detección de Depresión y Desesperanza ───────
  if (!await prisma.survey.findFirst({ where: { title: 'Detección de Depresión y Desesperanza' } })) {
    await prisma.survey.create({
      data: {
        title: 'Detección de Depresión y Desesperanza',
        description: 'Esta encuesta nos ayuda a conocer cómo te has sentido emocionalmente. Es completamente confidencial. Responde con sinceridad.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: 'Durante las últimas dos semanas, ¿con qué frecuencia te has sentido triste, deprimido/a o sin esperanza?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Para nada',                    value: 'para_nada',       riskScore: 0 },
                { label: 'Varios días',                  value: 'varios_dias',     riskScore: 2 },
                { label: 'Más de la mitad de los días',  value: 'mitad_dias',      riskScore: 4 },
                { label: 'Casi todos los días',          value: 'casi_siempre',    riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has perdido el interés o las ganas de hacer cosas que antes te gustaban?',
              order: 2, riskScore: 0,
              options: [
                { label: 'Para nada',                    value: 'para_nada',       riskScore: 0 },
                { label: 'Algunos días',                 value: 'algunos_dias',    riskScore: 2 },
                { label: 'Muchos días',                  value: 'muchos_dias',     riskScore: 4 },
                { label: 'Casi todos los días',          value: 'casi_siempre',    riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has tenido problemas para dormir, te has despertado muy temprano o has dormido demasiado?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Para nada',                    value: 'para_nada',       riskScore: 0 },
                { label: 'Algunos días',                 value: 'algunos_dias',    riskScore: 1 },
                { label: 'Muchos días',                  value: 'muchos_dias',     riskScore: 3 },
                { label: 'Casi todos los días',          value: 'casi_siempre',    riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Te has sentido cansado/a o con muy poca energía?',
              order: 4, riskScore: 0,
              options: [
                { label: 'Para nada',                    value: 'para_nada',       riskScore: 0 },
                { label: 'Algunos días',                 value: 'algunos_dias',    riskScore: 1 },
                { label: 'Muchos días',                  value: 'muchos_dias',     riskScore: 3 },
                { label: 'Casi todos los días',          value: 'casi_siempre',    riskScore: 4 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has tenido pensamientos de que estarías mejor muerto/a o de hacerte algún daño?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Para nada',                    value: 'para_nada',       riskScore: 0 },
                { label: 'Alguna vez',                   value: 'alguna_vez',      riskScore: 8 },
                { label: 'Con frecuencia',               value: 'frecuente',       riskScore: 15 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: 'Si deseas, cuéntanos cómo te has sentido últimamente (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Detección de Depresión y Desesperanza" creada (inactiva)');

  // ── Encuesta 5: Ansiedad y Estrés Escolar ───────────────────
  if (!await prisma.survey.findFirst({ where: { title: 'Ansiedad y Estrés Escolar' } })) {
    await prisma.survey.create({
      data: {
        title: 'Ansiedad y Estrés Escolar',
        description: 'Queremos entender cómo el colegio afecta tu bienestar. No hay respuestas correctas o incorrectas.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Cuánta presión sientes por las notas, exámenes o tareas del colegio?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Ninguna, me siento tranquilo/a',          value: 'ninguna',       riskScore: 0 },
                { label: 'Poca, es manejable',                      value: 'poca',          riskScore: 1 },
                { label: 'Bastante, me genera angustia',            value: 'bastante',      riskScore: 3 },
                { label: 'Mucha, me siento abrumado/a',             value: 'mucha',         riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Has tenido síntomas físicos relacionados con el estrés (dolor de cabeza, de estómago, taquicardia)?',
              order: 2, riskScore: 0,
              options: [
                { label: 'Nunca',                                   value: 'nunca',         riskScore: 0 },
                { label: 'A veces',                                 value: 'a_veces',       riskScore: 2 },
                { label: 'Con frecuencia',                          value: 'frecuente',     riskScore: 4 },
                { label: 'Casi siempre',                            value: 'casi_siempre',  riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Puedes concentrarte bien durante las clases o al estudiar?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Sí, sin problema',                        value: 'si',            riskScore: 0 },
                { label: 'A veces me cuesta',                       value: 'a_veces',       riskScore: 1 },
                { label: 'Frecuentemente me cuesta',               value: 'frecuente',     riskScore: 3 },
                { label: 'Casi nunca puedo concentrarme',           value: 'casi_nunca',    riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Sientes miedo o pánico antes de un examen o exposición?',
              order: 4, riskScore: 0,
              options: [
                { label: 'No, estoy tranquilo/a',                   value: 'no',            riskScore: 0 },
                { label: 'Un poco de nervios, normal',              value: 'poco',          riskScore: 1 },
                { label: 'Sí, me bloqueo bastante',                 value: 'bastante',      riskScore: 3 },
                { label: 'Sí, es muy intenso y me paraliza',        value: 'muy_intenso',   riskScore: 6 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has faltado al colegio o has evitado ir por el estrés o la ansiedad que te genera?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 5 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Qué situaciones del colegio te generan más estrés? (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Ansiedad y Estrés Escolar" creada (inactiva)');

  // ── Encuesta 6: Autoestima y Valoración Personal ─────────────
  if (!await prisma.survey.findFirst({ where: { title: 'Autoestima y Valoración Personal' } })) {
    await prisma.survey.create({
      data: {
        title: 'Autoestima y Valoración Personal',
        description: 'Esta encuesta nos ayuda a conocer cómo te valoras a ti mismo/a. Tus respuestas son privadas.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: 'En general, ¿cómo te sientes contigo mismo/a?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Muy bien, me acepto y me quiero',          value: 'muy_bien',      riskScore: 0 },
                { label: 'Bien, aunque hay cosas que mejorar',       value: 'bien',          riskScore: 1 },
                { label: 'Regular, no me siento muy seguro/a',       value: 'regular',       riskScore: 3 },
                { label: 'Mal, no me gusto ni me valoro',            value: 'mal',           riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Con qué frecuencia te comparas negativamente con otras personas?',
              order: 2, riskScore: 0,
              options: [
                { label: 'Casi nunca',                               value: 'casi_nunca',    riskScore: 0 },
                { label: 'A veces',                                  value: 'a_veces',       riskScore: 1 },
                { label: 'Con frecuencia',                           value: 'frecuente',     riskScore: 3 },
                { label: 'Todo el tiempo',                           value: 'siempre',       riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: 'Cuando cometes un error, ¿cómo reaccionas?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Lo acepto y aprendo de él',                value: 'acepto',        riskScore: 0 },
                { label: 'Me molesta pero lo supero',                value: 'molesta',       riskScore: 1 },
                { label: 'Me afecta mucho y me critico duramente',   value: 'afecta',        riskScore: 3 },
                { label: 'Me hace sentir que no sirvo para nada',    value: 'inutil',        riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Crees que puedes lograr tus metas si te lo propones?',
              order: 4, riskScore: 0,
              options: [
                { label: 'Sí, confío en mí',                         value: 'si',            riskScore: 0 },
                { label: 'A veces lo dudo, pero lo intento',         value: 'a_veces',       riskScore: 1 },
                { label: 'Pocas veces, me falta confianza',          value: 'pocas',         riskScore: 3 },
                { label: 'No, siento que no soy capaz',              value: 'no',            riskScore: 5 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has sentido que no le importas a nadie o que serías una carga para los demás?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 8 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Hay algo sobre ti mismo/a que te gustaría cambiar o que te preocupa? (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Autoestima y Valoración Personal" creada (inactiva)');

  // ── Encuesta 7: Relaciones Sociales y Sentido de Pertenencia ─
  if (!await prisma.survey.findFirst({ where: { title: 'Relaciones Sociales y Sentido de Pertenencia' } })) {
    await prisma.survey.create({
      data: {
        title: 'Relaciones Sociales y Sentido de Pertenencia',
        description: 'Queremos saber cómo te llevas con tus compañeros y si te sientes parte del colegio.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Tienes amigos o amigas de confianza en el colegio?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Sí, tengo buenos amigos/as',              value: 'si',            riskScore: 0 },
                { label: 'Algunos, pero no mucha confianza',         value: 'algunos',       riskScore: 1 },
                { label: 'Muy pocos, me cuesta relacionarme',        value: 'pocos',         riskScore: 3 },
                { label: 'No tengo amigos/as en el colegio',         value: 'no',            riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Te has sentido excluido/a, ignorado/a o rechazado/a por tus compañeros?',
              order: 2, riskScore: 0,
              options: [
                { label: 'No, nunca',                                value: 'no',            riskScore: 0 },
                { label: 'Alguna vez',                               value: 'alguna_vez',    riskScore: 2 },
                { label: 'Con bastante frecuencia',                  value: 'frecuente',     riskScore: 4 },
                { label: 'Sí, constantemente',                       value: 'siempre',       riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Sientes que encajas y que formas parte del grupo en tu salón?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Sí, me siento parte del grupo',           value: 'si',            riskScore: 0 },
                { label: 'Más o menos',                              value: 'mas_o_menos',   riskScore: 1 },
                { label: 'Poco, me siento diferente o aparte',      value: 'poco',          riskScore: 3 },
                { label: 'No, me siento muy solo/a',                value: 'no',            riskScore: 6 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Cómo es tu relación con tus docentes?',
              order: 4, riskScore: 0,
              options: [
                { label: 'Buena, me llevan bien con la mayoría',    value: 'buena',         riskScore: 0 },
                { label: 'Regular, hay algunos problemas',          value: 'regular',       riskScore: 1 },
                { label: 'Difícil, frecuentemente hay conflictos',  value: 'dificil',       riskScore: 3 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Te has sentido completamente solo/a aunque estuvieras rodeado/a de personas?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 5 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Hay algo sobre tus relaciones en el colegio que quieras contarnos? (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Relaciones Sociales y Sentido de Pertenencia" creada (inactiva)');

  // ── Encuesta 8: Uso Problemático de Tecnología y Redes Sociales
  if (!await prisma.survey.findFirst({ where: { title: 'Tecnología, Redes Sociales y Bienestar Digital' } })) {
    await prisma.survey.create({
      data: {
        title: 'Tecnología, Redes Sociales y Bienestar Digital',
        description: 'Esta encuesta nos ayuda a entender cómo el uso del celular y las redes sociales afecta tu bienestar.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Cuántas horas al día usas el celular o las redes sociales aproximadamente?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Menos de 1 hora',                          value: 'menos_1h',      riskScore: 0 },
                { label: 'Entre 1 y 3 horas',                        value: '1_3h',          riskScore: 0 },
                { label: 'Entre 3 y 6 horas',                        value: '3_6h',          riskScore: 2 },
                { label: 'Más de 6 horas',                           value: 'mas_6h',        riskScore: 4 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Sientes que no puedes dejar de usar el celular o las redes aunque quieras?',
              order: 2, riskScore: 0,
              options: [
                { label: 'No, puedo controlarlo bien',               value: 'no',            riskScore: 0 },
                { label: 'A veces me cuesta parar',                  value: 'a_veces',       riskScore: 2 },
                { label: 'Sí, me cuesta mucho dejarlo',              value: 'si',            riskScore: 4 },
                { label: 'No puedo pasar el día sin revisarlo',      value: 'dependencia',   riskScore: 6 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has recibido mensajes hirientes, amenazas o burlas por internet o redes sociales?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 6 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Las redes sociales afectan cómo te sientes contigo mismo/a (comparaciones, "likes", comentarios)?',
              order: 4, riskScore: 0,
              options: [
                { label: 'No, no me afectan',                        value: 'no',            riskScore: 0 },
                { label: 'Un poco, pero lo manejo',                  value: 'un_poco',       riskScore: 1 },
                { label: 'Bastante, me hacen sentir inseguro/a',     value: 'bastante',      riskScore: 3 },
                { label: 'Mucho, afectan mi estado de ánimo',        value: 'mucho',         riskScore: 5 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿El uso del celular o internet ha afectado tu rendimiento escolar o tus horas de sueño?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 3 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Hay algo sobre tu uso del celular o redes sociales que te preocupe? (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Tecnología, Redes Sociales y Bienestar Digital" creada (inactiva)');

  // ── Encuesta 9: Proyecto de Vida y Motivación ────────────────
  if (!await prisma.survey.findFirst({ where: { title: 'Proyecto de Vida y Motivación Escolar' } })) {
    await prisma.survey.create({
      data: {
        title: 'Proyecto de Vida y Motivación Escolar',
        description: 'Queremos conocer tus metas, sueños y qué tan motivado/a te sientes en el colegio.',
        isActive: false,
        createdById: psicologo.id,
        targetGrades: [],
        targetSections: [],
        questions: {
          create: [
            {
              type: QuestionType.SINGLE,
              text: '¿Qué tan motivado/a te sientes para venir al colegio y aprender?',
              order: 1, riskScore: 0,
              options: [
                { label: 'Muy motivado/a, me gusta aprender',        value: 'muy',           riskScore: 0 },
                { label: 'Motivado/a, aunque hay días difíciles',    value: 'motivado',      riskScore: 0 },
                { label: 'Poco motivado/a, me cuesta',               value: 'poco',          riskScore: 2 },
                { label: 'Nada motivado/a, no le veo sentido',       value: 'nada',          riskScore: 5 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Tienes claro qué quieres estudiar o hacer después de terminar el colegio?',
              order: 2, riskScore: 0,
              options: [
                { label: 'Sí, tengo una meta clara',                 value: 'si',            riskScore: 0 },
                { label: 'Más o menos, tengo algunas ideas',         value: 'mas_o_menos',   riskScore: 0 },
                { label: 'No, aún no lo sé y me preocupa',           value: 'no_preocupa',   riskScore: 2 },
                { label: 'No, y no me importa',                      value: 'no_importa',    riskScore: 4 },
              ],
            },
            {
              type: QuestionType.SINGLE,
              text: '¿Tienes personas (familia, amigos, docentes) que creen en ti y te apoyan?',
              order: 3, riskScore: 0,
              options: [
                { label: 'Sí, cuento con mucho apoyo',               value: 'si',            riskScore: 0 },
                { label: 'Con algunos, pero quisiera más',           value: 'algunos',       riskScore: 1 },
                { label: 'Muy poco apoyo de mi entorno',             value: 'poco',          riskScore: 3 },
                { label: 'No, siento que estoy solo/a',              value: 'no',            riskScore: 6 },
              ],
            },
            {
              type: QuestionType.MULTI,
              text: '¿Qué obstáculos sientes que dificultan lograr tus metas? (puedes marcar varios)',
              order: 4, required: false, riskScore: 0,
              options: [
                { label: 'Dificultades económicas en casa',          value: 'economico',     riskScore: 2 },
                { label: 'Problemas familiares',                     value: 'familiar',      riskScore: 2 },
                { label: 'No me siento capaz',                       value: 'autoestima',    riskScore: 3 },
                { label: 'Falta de apoyo de mis padres',             value: 'apoyo',         riskScore: 2 },
                { label: 'No sé qué quiero hacer',                   value: 'indefinicion',  riskScore: 1 },
                { label: 'Ninguno, me siento bien',                  value: 'ninguno',       riskScore: 0 },
              ],
            },
            {
              type: QuestionType.YES_NO,
              text: '¿Has pensado alguna vez en abandonar el colegio?',
              order: 5, riskScore: 0,
              options: [
                { label: 'Sí', value: 'si', riskScore: 6 },
                { label: 'No', value: 'no', riskScore: 0 },
              ],
            },
            {
              type: QuestionType.TEXT,
              text: '¿Cuál es tu sueño o meta más importante? Cuéntanos (solo lo verá el psicólogo)',
              order: 6, required: false, riskScore: 0,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Encuesta "Proyecto de Vida y Motivación Escolar" creada (inactiva)');

  // ============================================================
  // 5. ANUNCIOS POR DEFECTO
  // ============================================================
  const anunciosDefault = [
    {
      title: '¡Bienvenidos al Sistema PsicoEscolar!',
      content:
        'Estimados estudiantes, a partir de ahora contamos con PsicoEscolar para el seguimiento de su bienestar emocional. ' +
        'Aquí podrán responder encuestas, leer comunicados y solicitar apoyo del área de Psicología. ' +
        'Sus respuestas son completamente confidenciales. ¡Gracias por participar!',
    },
    {
      title: 'Área de Psicología — Estamos aquí para apoyarte',
      content:
        'Recuerda que el área de Psicología de la I.E. 40122 Manuel Scorza Torres está disponible ' +
        'para apoyarte en cualquier situación difícil. Si sientes que necesitas hablar con alguien, ' +
        'puedes acercarte directamente al departamento de Psicología o indicarlo en tus encuestas de bienestar.',
    },
    {
      title: 'Tus respuestas son privadas y confidenciales',
      content:
        'Queremos que sepas que todo lo que respondes en las encuestas de PsicoEscolar es estrictamente confidencial. ' +
        'Solo el psicólogo del colegio tiene acceso a tus respuestas. ' +
        'Responde con sinceridad para que podamos brindarte el mejor apoyo posible.',
    },
  ];

  for (const anuncio of anunciosDefault) {
    const existe = await prisma.announcement.findFirst({ where: { title: anuncio.title } });
    if (!existe) {
      await prisma.announcement.create({
        data: {
          title:       anuncio.title,
          content:     anuncio.content,
          targetRoles: ['STUDENT'],
          isPublished: true,
          createdById: psicologo.id,
        },
      });
    }
  }
  console.log('✅ 3 anuncios por defecto creados (visibles para estudiantes)');

  // ============================================================
  // 6. REGLAS DE ALERTA POR DEFECTO
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

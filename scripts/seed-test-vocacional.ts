/**
 * Test Vocacional complejo — 3 encuestas basadas en modelo Holland (RIASEC)
 *  1. Test de Intereses Vocacionales    (30 preguntas SCALE)
 *  2. Test de Aptitudes y Habilidades   (25 preguntas SCALE + MULTI)
 *  3. Test de Personalidad y Valores    (20 preguntas SINGLE + MULTI)
 *
 * Uso: npx tsx scripts/seed-test-vocacional.ts
 */
import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Creando tests vocacionales...\n');

  const psicologo = await prisma.user.findFirst({
    where: { role: 'PSYCHOLOGIST' },
    select: { id: true },
  });
  if (!psicologo) throw new Error('No existe usuario PSYCHOLOGIST. Ejecuta seed-encuestas-anuncios.ts primero.');

  const grados = await prisma.grade.findMany({ select: { id: true } });
  const idsGrados = grados.map((g) => g.id);

  // ══════════════════════════════════════════════════════════════
  // ENCUESTA 1 — INTERESES VOCACIONALES  (RIASEC)
  // Escala 1-5: 1=No me interesa nada / 5=Me apasiona
  // ══════════════════════════════════════════════════════════════
  const enc1 = await prisma.survey.create({
    data: {
      title: 'Test de Intereses Vocacionales',
      description:
        'Evalúa qué tan interesante encuentras cada actividad. ' +
        'Responde con sinceridad — no hay respuestas correctas o incorrectas. ' +
        '(1 = No me interesa / 5 = Me apasiona)',
      isActive: true,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          // ── BLOQUE R: REALISTA (trabajo práctico/manual/técnico)
          {
            order: 1, type: QuestionType.SCALE, riskScore: 0,
            text: '[R] Armar, reparar o construir objetos con tus manos (muebles, electrodomésticos, máquinas)',
            options: null,
          },
          {
            order: 2, type: QuestionType.SCALE, riskScore: 0,
            text: '[R] Usar herramientas o equipos técnicos (taladro, torno, soldadora, instrumentos de medición)',
            options: null,
          },
          {
            order: 3, type: QuestionType.SCALE, riskScore: 0,
            text: '[R] Trabajar al aire libre en actividades como agricultura, ganadería o construcción',
            options: null,
          },
          {
            order: 4, type: QuestionType.SCALE, riskScore: 0,
            text: '[R] Aprender sobre mecánica de autos, electrónica o robótica',
            options: null,
          },
          {
            order: 5, type: QuestionType.SCALE, riskScore: 0,
            text: '[R] Realizar actividades físicas como deporte, atletismo o artes marciales de manera profesional',
            options: null,
          },

          // ── BLOQUE I: INVESTIGATIVO (ciencia/análisis/investigación)
          {
            order: 6, type: QuestionType.SCALE, riskScore: 0,
            text: '[I] Realizar experimentos científicos en química, física o biología',
            options: null,
          },
          {
            order: 7, type: QuestionType.SCALE, riskScore: 0,
            text: '[I] Investigar cómo funcionan las cosas: enfermedades, el universo, la naturaleza',
            options: null,
          },
          {
            order: 8, type: QuestionType.SCALE, riskScore: 0,
            text: '[I] Resolver problemas matemáticos o lógicos complejos',
            options: null,
          },
          {
            order: 9, type: QuestionType.SCALE, riskScore: 0,
            text: '[I] Leer artículos o libros de ciencia, tecnología o medicina',
            options: null,
          },
          {
            order: 10, type: QuestionType.SCALE, riskScore: 0,
            text: '[I] Analizar datos, estadísticas o resultados de estudios',
            options: null,
          },

          // ── BLOQUE A: ARTÍSTICO (creativo/expresivo)
          {
            order: 11, type: QuestionType.SCALE, riskScore: 0,
            text: '[A] Dibujar, pintar o hacer diseño gráfico o ilustración',
            options: null,
          },
          {
            order: 12, type: QuestionType.SCALE, riskScore: 0,
            text: '[A] Escribir cuentos, poemas, guiones o artículos',
            options: null,
          },
          {
            order: 13, type: QuestionType.SCALE, riskScore: 0,
            text: '[A] Tocar un instrumento musical, cantar o componer música',
            options: null,
          },
          {
            order: 14, type: QuestionType.SCALE, riskScore: 0,
            text: '[A] Actuar en teatro, danza, cine o televisión',
            options: null,
          },
          {
            order: 15, type: QuestionType.SCALE, riskScore: 0,
            text: '[A] Diseñar espacios, ropa, muebles o productos con criterio estético',
            options: null,
          },

          // ── BLOQUE S: SOCIAL (ayuda/enseñanza/orientación)
          {
            order: 16, type: QuestionType.SCALE, riskScore: 0,
            text: '[S] Enseñar o explicar temas a otras personas (compañeros, niños, adultos)',
            options: null,
          },
          {
            order: 17, type: QuestionType.SCALE, riskScore: 0,
            text: '[S] Escuchar los problemas de otros y ayudarlos a encontrar soluciones',
            options: null,
          },
          {
            order: 18, type: QuestionType.SCALE, riskScore: 0,
            text: '[S] Trabajar en salud: atender pacientes, cuidar enfermos, dar primeros auxilios',
            options: null,
          },
          {
            order: 19, type: QuestionType.SCALE, riskScore: 0,
            text: '[S] Participar en trabajo comunitario, voluntariado o ayuda social',
            options: null,
          },
          {
            order: 20, type: QuestionType.SCALE, riskScore: 0,
            text: '[S] Trabajar con niños, adolescentes o personas en situación vulnerable',
            options: null,
          },

          // ── BLOQUE E: EMPRENDEDOR (liderazgo/negocios/persuasión)
          {
            order: 21, type: QuestionType.SCALE, riskScore: 0,
            text: '[E] Liderar un grupo, organizar un evento o dirigir un proyecto',
            options: null,
          },
          {
            order: 22, type: QuestionType.SCALE, riskScore: 0,
            text: '[E] Negociar, vender o convencer a otras personas',
            options: null,
          },
          {
            order: 23, type: QuestionType.SCALE, riskScore: 0,
            text: '[E] Crear tu propio negocio o emprendimiento',
            options: null,
          },
          {
            order: 24, type: QuestionType.SCALE, riskScore: 0,
            text: '[E] Hablar en público, dar discursos o debatir',
            options: null,
          },
          {
            order: 25, type: QuestionType.SCALE, riskScore: 0,
            text: '[E] Tomar decisiones importantes y asumir responsabilidades',
            options: null,
          },

          // ── BLOQUE C: CONVENCIONAL (organización/datos/procesos)
          {
            order: 26, type: QuestionType.SCALE, riskScore: 0,
            text: '[C] Organizar archivos, documentos, inventarios o registros',
            options: null,
          },
          {
            order: 27, type: QuestionType.SCALE, riskScore: 0,
            text: '[C] Trabajar con hojas de cálculo, bases de datos o sistemas administrativos',
            options: null,
          },
          {
            order: 28, type: QuestionType.SCALE, riskScore: 0,
            text: '[C] Llevar cuentas, presupuestos o registros financieros',
            options: null,
          },
          {
            order: 29, type: QuestionType.SCALE, riskScore: 0,
            text: '[C] Seguir procedimientos establecidos y trabajar con normas claras',
            options: null,
          },
          {
            order: 30, type: QuestionType.SCALE, riskScore: 0,
            text: '[C] Revisar y verificar detalles para asegurarte de que todo esté correcto',
            options: null,
          },
        ],
      },
    },
  });

  // ══════════════════════════════════════════════════════════════
  // ENCUESTA 2 — APTITUDES Y HABILIDADES
  // Escala 1-5: 1=Se me da muy mal / 5=Se me da muy bien
  // ══════════════════════════════════════════════════════════════
  const enc2 = await prisma.survey.create({
    data: {
      title: 'Test de Aptitudes y Habilidades',
      description:
        'Evalúa qué tan desarrolladas están tus habilidades en cada área. ' +
        'Sé honesto/a — esto nos ayuda a orientarte mejor. ' +
        '(1 = Se me da muy mal / 5 = Se me da excelente)',
      isActive: true,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          // ── HABILIDADES NUMÉRICAS Y LÓGICAS
          {
            order: 1, type: QuestionType.SCALE, riskScore: 0,
            text: '[Numérica] Hacer cálculos matemáticos mentalmente o en papel con rapidez',
            options: null,
          },
          {
            order: 2, type: QuestionType.SCALE, riskScore: 0,
            text: '[Numérica] Entender y resolver problemas de álgebra, geometría o estadística',
            options: null,
          },
          {
            order: 3, type: QuestionType.SCALE, riskScore: 0,
            text: '[Lógica] Identificar patrones, secuencias o relaciones entre objetos o ideas',
            options: null,
          },
          {
            order: 4, type: QuestionType.SCALE, riskScore: 0,
            text: '[Lógica] Resolver puzzles, acertijos o problemas de razonamiento',
            options: null,
          },

          // ── HABILIDADES VERBALES Y COMUNICATIVAS
          {
            order: 5, type: QuestionType.SCALE, riskScore: 0,
            text: '[Verbal] Leer y comprender textos complejos con facilidad',
            options: null,
          },
          {
            order: 6, type: QuestionType.SCALE, riskScore: 0,
            text: '[Verbal] Expresarte con claridad al hablar en público o en grupo',
            options: null,
          },
          {
            order: 7, type: QuestionType.SCALE, riskScore: 0,
            text: '[Verbal] Redactar textos, cartas o informes de forma clara y ordenada',
            options: null,
          },
          {
            order: 8, type: QuestionType.SCALE, riskScore: 0,
            text: '[Idiomas] Aprender o usar idiomas extranjeros (inglés, francés, etc.)',
            options: null,
          },

          // ── HABILIDADES ESPACIALES Y TÉCNICAS
          {
            order: 9, type: QuestionType.SCALE, riskScore: 0,
            text: '[Espacial] Visualizar objetos en 3D, interpretar mapas o planos',
            options: null,
          },
          {
            order: 10, type: QuestionType.SCALE, riskScore: 0,
            text: '[Técnica] Entender cómo funcionan las máquinas o dispositivos electrónicos',
            options: null,
          },
          {
            order: 11, type: QuestionType.SCALE, riskScore: 0,
            text: '[Técnica] Usar computadoras, programas o aplicaciones tecnológicas',
            options: null,
          },
          {
            order: 12, type: QuestionType.SCALE, riskScore: 0,
            text: '[Motora] Realizar trabajos manuales que requieren precisión y destreza',
            options: null,
          },

          // ── HABILIDADES SOCIALES E INTERPERSONALES
          {
            order: 13, type: QuestionType.SCALE, riskScore: 0,
            text: '[Social] Relacionarte fácilmente con personas que no conoces',
            options: null,
          },
          {
            order: 14, type: QuestionType.SCALE, riskScore: 0,
            text: '[Empática] Entender cómo se sienten los demás y ponerte en su lugar',
            options: null,
          },
          {
            order: 15, type: QuestionType.SCALE, riskScore: 0,
            text: '[Liderazgo] Organizar y motivar a un grupo para lograr un objetivo',
            options: null,
          },

          // ── HABILIDADES ARTÍSTICAS Y CREATIVAS
          {
            order: 16, type: QuestionType.SCALE, riskScore: 0,
            text: '[Artística] Dibujar, pintar u otras artes visuales',
            options: null,
          },
          {
            order: 17, type: QuestionType.SCALE, riskScore: 0,
            text: '[Musical] Tocar un instrumento, cantar o componer',
            options: null,
          },
          {
            order: 18, type: QuestionType.SCALE, riskScore: 0,
            text: '[Creativa] Generar ideas nuevas y originales ante un problema',
            options: null,
          },

          // ── HABILIDADES CIENTÍFICAS Y ANALÍTICAS
          {
            order: 19, type: QuestionType.SCALE, riskScore: 0,
            text: '[Científica] Realizar observaciones, experimentos y sacar conclusiones',
            options: null,
          },
          {
            order: 20, type: QuestionType.SCALE, riskScore: 0,
            text: '[Analítica] Revisar información y detectar errores o inconsistencias',
            options: null,
          },

          // ── MATERIAS ESCOLARES FAVORITAS
          {
            order: 21, type: QuestionType.MULTI, riskScore: 0,
            text: '¿En qué cursos te va mejor o te resultan más fáciles? (Selecciona todos los que apliquen)',
            options: [
              { label: 'Matemáticas / Álgebra', value: 'mat' },
              { label: 'Ciencias (Física / Química / Biología)', value: 'cien' },
              { label: 'Comunicación / Literatura', value: 'com' },
              { label: 'Historia / Geografía / CCSS', value: 'hist' },
              { label: 'Inglés u otro idioma', value: 'ing' },
              { label: 'Educación Artística / Música', value: 'arte' },
              { label: 'Educación Física', value: 'ef' },
              { label: 'Computación / Tecnología', value: 'comp' },
              { label: 'Economía / Administración', value: 'eco' },
            ],
          },

          // ── FORMA DE APRENDER
          {
            order: 22, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo aprendes mejor?',
            options: [
              { label: 'Leyendo y estudiando solo/a', value: 'leyendo', riskScore: 0 },
              { label: 'Escuchando explicaciones y tomando apuntes', value: 'escuchando', riskScore: 0 },
              { label: 'Haciendo y practicando (aprender haciendo)', value: 'haciendo', riskScore: 0 },
              { label: 'Trabajando en grupo y discutiendo ideas', value: 'grupo', riskScore: 0 },
              { label: 'Viendo videos o representaciones visuales', value: 'visual', riskScore: 0 },
            ],
          },

          // ── TIPO DE TAREA PREFERIDA
          {
            order: 23, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Qué tipo de tarea disfrutas más al estudiar?',
            options: [
              { label: 'Resolver ejercicios y problemas', value: 'problemas', riskScore: 0 },
              { label: 'Leer y analizar textos', value: 'textos', riskScore: 0 },
              { label: 'Crear algo (dibujar, escribir, diseñar)', value: 'crear', riskScore: 0 },
              { label: 'Investigar y buscar información', value: 'investigar', riskScore: 0 },
              { label: 'Exponer o presentar al grupo', value: 'exponer', riskScore: 0 },
              { label: 'Trabajos manuales o experimentos', value: 'manual', riskScore: 0 },
            ],
          },

          // ── RETO ACADÉMICO
          {
            order: 24, type: QuestionType.SINGLE, riskScore: 0,
            text: 'Cuando tienes un problema difícil, ¿qué haces normalmente?',
            options: [
              { label: 'Lo analizo solo/a hasta encontrar la solución', value: 'solo', riskScore: 0 },
              { label: 'Pido ayuda a alguien que sabe más', value: 'ayuda', riskScore: 0 },
              { label: 'Busco información en internet o libros', value: 'busca', riskScore: 0 },
              { label: 'Lo dejo y espero que se resuelva solo', value: 'deja', riskScore: 0 },
              { label: 'Propongo soluciones creativas o distintas', value: 'creativo', riskScore: 0 },
            ],
          },

          // ── RENDIMIENTO ACADÉMICO
          {
            order: 25, type: QuestionType.SCALE, riskScore: 0,
            text: '¿Cómo evalúas tu rendimiento académico general este año? (1=Muy bajo / 5=Excelente)',
            options: null,
          },
        ],
      },
    },
  });

  // ══════════════════════════════════════════════════════════════
  // ENCUESTA 3 — PERSONALIDAD VOCACIONAL Y VALORES LABORALES
  // ══════════════════════════════════════════════════════════════
  const enc3 = await prisma.survey.create({
    data: {
      title: 'Test de Personalidad Vocacional y Valores',
      description:
        'Esta encuesta explora tu personalidad, valores y el tipo de ambiente de trabajo que prefieres. ' +
        'No hay respuestas buenas o malas — todo nos ayuda a orientarte.',
      isActive: true,
      createdById: psicologo.id,
      targetGrades: idsGrados,
      targetSections: [],
      questions: {
        create: [
          // ── ESTILO DE TRABAJO
          {
            order: 1, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cómo prefieres trabajar habitualmente?',
            options: [
              { label: 'Solo/a, de forma independiente',            value: 'solo',     riskScore: 0 },
              { label: 'En equipo, colaborando con otros',           value: 'equipo',   riskScore: 0 },
              { label: 'Combinando trabajo individual y en equipo',  value: 'mixto',    riskScore: 0 },
              { label: 'Liderando y coordinando a un grupo',         value: 'lider',    riskScore: 0 },
            ],
          },
          {
            order: 2, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Qué tipo de ambiente de trabajo te imaginas en el futuro?',
            options: [
              { label: 'Oficina o ambiente cerrado y organizado',    value: 'oficina',   riskScore: 0 },
              { label: 'Al aire libre o en campo',                   value: 'campo',     riskScore: 0 },
              { label: 'Taller, laboratorio o planta industrial',    value: 'taller',    riskScore: 0 },
              { label: 'Hospital, escuela u otro servicio social',   value: 'servicio',  riskScore: 0 },
              { label: 'Estudio, escenario o espacio creativo',      value: 'creativo',  riskScore: 0 },
              { label: 'Viajando o en diferentes lugares',           value: 'viaje',     riskScore: 0 },
            ],
          },
          {
            order: 3, type: QuestionType.SINGLE, riskScore: 0,
            text: 'Ante una decisión importante, ¿cómo actúas?',
            options: [
              { label: 'Analizo mucho antes de decidir',             value: 'analiza',  riskScore: 0 },
              { label: 'Decido rápido según lo que siento',          value: 'rapido',   riskScore: 0 },
              { label: 'Consulto con personas de confianza',         value: 'consulta', riskScore: 0 },
              { label: 'Sigo los pasos o el procedimiento indicado', value: 'procedimiento', riskScore: 0 },
            ],
          },

          // ── RASGOS DE PERSONALIDAD
          {
            order: 4, type: QuestionType.MULTI, riskScore: 0,
            text: '¿Cuáles de estos rasgos te describen mejor? (Selecciona los que más apliquen)',
            options: [
              { label: 'Curioso/a — siempre quiero aprender cosas nuevas',      value: 'curioso' },
              { label: 'Organizado/a — me gusta tener todo en orden',           value: 'organizado' },
              { label: 'Creativo/a — se me ocurren ideas originales',           value: 'creativo' },
              { label: 'Empático/a — entiendo fácil cómo se sienten los demás', value: 'empatico' },
              { label: 'Ambicioso/a — quiero tener éxito y destacar',           value: 'ambicioso' },
              { label: 'Paciente — puedo esperar y trabajar a largo plazo',     value: 'paciente' },
              { label: 'Sociable — disfruto estar y hablar con personas',        value: 'sociable' },
              { label: 'Independiente — prefiero hacer las cosas a mi manera', value: 'independiente' },
              { label: 'Detallista — me fijo en los pequeños detalles',         value: 'detallista' },
              { label: 'Perseverante — no me rindo fácilmente',                value: 'perseverante' },
            ],
          },

          // ── VALORES LABORALES
          {
            order: 5, type: QuestionType.MULTI, riskScore: 0,
            text: '¿Qué es lo más importante para ti en un trabajo futuro? (Elige hasta 4)',
            options: [
              { label: 'Ganar buen salario',                         value: 'salario' },
              { label: 'Ayudar a los demás',                         value: 'ayudar' },
              { label: 'Tener reconocimiento y prestigio',           value: 'prestigio' },
              { label: 'Hacer algo creativo y original',             value: 'creativo' },
              { label: 'Tener estabilidad y seguridad laboral',      value: 'estabilidad' },
              { label: 'Resolver problemas intelectuales',           value: 'intelectual' },
              { label: 'Tener libertad e independencia',             value: 'libertad' },
              { label: 'Trabajar con tecnología de punta',           value: 'tecnologia' },
              { label: 'Contribuir al medio ambiente o la sociedad', value: 'contribuir' },
              { label: 'Seguir aprendiendo y desarrollándome',       value: 'aprendizaje' },
            ],
          },

          // ── ORIENTACIÓN TEMPORAL
          {
            order: 6, type: QuestionType.SINGLE, riskScore: 0,
            text: 'Si tuvieras que elegir hoy, ¿qué preferirías estudiar?',
            options: [
              { label: 'Ingeniería o ciencias exactas',              value: 'ing', riskScore: 0 },
              { label: 'Medicina, salud o ciencias de la vida',      value: 'med', riskScore: 0 },
              { label: 'Humanidades, letras o ciencias sociales',    value: 'hum', riskScore: 0 },
              { label: 'Arte, diseño, música o comunicación',        value: 'arte', riskScore: 0 },
              { label: 'Administración, economía o negocios',        value: 'adm', riskScore: 0 },
              { label: 'Tecnología, sistemas o computación',         value: 'tec', riskScore: 0 },
              { label: 'Educación, psicología o trabajo social',     value: 'edu', riskScore: 0 },
              { label: 'Derecho o ciencias políticas',               value: 'der', riskScore: 0 },
              { label: 'Agropecuaria, ambiental o recursos naturales', value: 'agro', riskScore: 0 },
              { label: 'Aún no lo sé',                               value: 'ns', riskScore: 0 },
            ],
          },

          // ── ESCALA: motivación y seguridad vocacional
          {
            order: 7, type: QuestionType.SCALE, riskScore: 0,
            text: '¿Qué tan claro tienes lo que quieres estudiar o ser en el futuro? (1=Muy confundido/a / 5=Muy claro)',
            options: null,
          },
          {
            order: 8, type: QuestionType.SCALE, riskScore: 0,
            text: '¿Qué tan motivado/a estás con tu futuro profesional? (1=Nada motivado/a / 5=Muy motivado/a)',
            options: null,
          },
          {
            order: 9, type: QuestionType.SCALE, riskScore: 0,
            text: '¿Cuánta influencia tienen tus padres o familia en tu decisión vocacional? (1=Ninguna / 5=Decisiva)',
            options: null,
          },

          // ── REFERENTE VOCACIONAL
          {
            order: 10, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Tienes algún familiar o conocido cuya carrera o trabajo admiras?',
            options: [
              { label: 'Sí, y eso me influye bastante', value: 'si_mucho', riskScore: 0 },
              { label: 'Sí, pero no necesariamente quiero lo mismo', value: 'si_poco', riskScore: 0 },
              { label: 'No, quiero encontrar mi propio camino', value: 'no', riskScore: 0 },
            ],
          },

          // ── CARRERA O PROFESIÓN QUE MÁS ATRAE
          {
            order: 11, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: 'Escribe la carrera, profesión u oficio que más te llama la atención (puede ser más de una):',
            options: null,
          },

          // ── OBSTÁCULOS PERCIBIDOS
          {
            order: 12, type: QuestionType.MULTI, riskScore: 0,
            text: '¿Qué obstáculos sientes que podrían dificultar tu futuro profesional? (Puedes seleccionar varios)',
            options: [
              { label: 'Situación económica de mi familia',           value: 'economico' },
              { label: 'No sé qué carrera elegir',                    value: 'confusion' },
              { label: 'Mis notas o rendimiento académico',           value: 'notas' },
              { label: 'No hay universidades o institutos cerca',     value: 'acceso' },
              { label: 'Presión familiar para elegir algo específico', value: 'familia' },
              { label: 'Miedo al fracaso o a no ser suficiente',      value: 'miedo' },
              { label: 'Falta de información sobre las carreras',     value: 'info' },
              { label: 'No veo obstáculos importantes',               value: 'ninguno' },
            ],
          },

          // ── NIVEL DE ESTUDIOS ESPERADO
          {
            order: 13, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Hasta qué nivel de estudios esperas llegar?',
            options: [
              { label: 'Curso técnico o vocacional (CETPRO)',        value: 'tecnico', riskScore: 0 },
              { label: 'Instituto técnico superior (2-3 años)',      value: 'instituto', riskScore: 0 },
              { label: 'Universidad (bachiller)',                    value: 'uni', riskScore: 0 },
              { label: 'Universidad + maestría o especialización',  value: 'postgrado', riskScore: 0 },
              { label: 'Doctorado o investigación científica',       value: 'doctorado', riskScore: 0 },
              { label: 'No estoy seguro/a',                          value: 'ns', riskScore: 0 },
            ],
          },

          // ── EXPERIENCIAS PREVIAS
          {
            order: 14, type: QuestionType.MULTI, riskScore: 0,
            text: '¿Has tenido alguna de estas experiencias? (Marca las que apliquen)',
            options: [
              { label: 'He participado en ferias o competencias científicas', value: 'feria' },
              { label: 'He tomado clases de arte, música o baile fuera del colegio', value: 'arte' },
              { label: 'He trabajado o ayudado en un negocio familiar', value: 'negocio' },
              { label: 'He hecho voluntariado o trabajo comunitario', value: 'voluntario' },
              { label: 'He ganado algún concurso académico o deportivo', value: 'concurso' },
              { label: 'He creado algo (blog, canal de YouTube, proyecto, etc.)', value: 'creado' },
              { label: 'He participado en talleres de liderazgo o emprendimiento', value: 'lider' },
              { label: 'Ninguna de las anteriores', value: 'ninguna' },
            ],
          },

          // ── MODELO DE VIDA
          {
            order: 15, type: QuestionType.SINGLE, riskScore: 0,
            text: '¿Cuál de estas frases describe mejor lo que quieres para tu vida?',
            options: [
              { label: 'Quiero tener estabilidad, una familia y vida tranquila',      value: 'estable',   riskScore: 0 },
              { label: 'Quiero crear algo propio: empresa, obra de arte, invento',    value: 'crear',     riskScore: 0 },
              { label: 'Quiero ayudar a las personas y cambiar el mundo',              value: 'ayudar',    riskScore: 0 },
              { label: 'Quiero ser reconocido/a y alcanzar el éxito profesional',     value: 'exito',     riskScore: 0 },
              { label: 'Quiero explorar, viajar y vivir nuevas experiencias',         value: 'explorar',  riskScore: 0 },
              { label: 'Quiero descubrir, investigar y entender cómo funciona el mundo', value: 'descubrir', riskScore: 0 },
            ],
          },

          // ── FORTALEZAS Y ÁREAS DE MEJORA
          {
            order: 16, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿Cuáles consideras que son tus principales fortalezas o talentos?',
            options: null,
          },
          {
            order: 17, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿En qué áreas sientes que necesitas mejorar para lograr tus metas?',
            options: null,
          },

          // ── ORIENTACIÓN FINAL
          {
            order: 18, type: QuestionType.SCALE, riskScore: 0,
            text: '¿Qué tan importante es para ti recibir orientación vocacional de un especialista? (1=No me interesa / 5=Es muy importante)',
            options: null,
          },
          {
            order: 19, type: QuestionType.YES_NO, riskScore: 0,
            text: '¿Te gustaría tener una sesión de orientación vocacional personalizada con el psicólogo del colegio?',
            options: [
              { label: 'Sí', value: 'si', riskScore: 0 },
              { label: 'No', value: 'no', riskScore: 0 },
            ],
          },
          {
            order: 20, type: QuestionType.TEXT, riskScore: 0, required: false,
            text: '¿Hay algo más que quieras compartir sobre tu futuro o tus dudas vocacionales? (opcional)',
            options: null,
          },
        ],
      },
    },
  });

  console.log('✅ Tests vocacionales creados:');
  console.log(`   • "${enc1.title}" — 30 preguntas SCALE (intereses RIASEC)`);
  console.log(`   • "${enc2.title}" — 25 preguntas (habilidades + cursos + estilo)`);
  console.log(`   • "${enc3.title}" — 20 preguntas (personalidad, valores, metas)`);

  console.log('\n📊 Guía de interpretación RIASEC:');
  console.log('   [R] Preguntas 1-5   → Perfil Realista   (técnico/manual/deportivo)');
  console.log('   [I] Preguntas 6-10  → Perfil Investigativo (ciencia/análisis)');
  console.log('   [A] Preguntas 11-15 → Perfil Artístico  (creativo/expresivo)');
  console.log('   [S] Preguntas 16-20 → Perfil Social     (ayuda/educación/salud)');
  console.log('   [E] Preguntas 21-25 → Perfil Emprendedor (negocios/liderazgo)');
  console.log('   [C] Preguntas 26-30 → Perfil Convencional (organización/datos)');
  console.log('\n   Suma los puntos de cada bloque (máx 25 por categoría).');
  console.log('   Los 2 bloques más altos = código vocacional del estudiante.\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

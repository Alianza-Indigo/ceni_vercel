import type { Line } from "@prisma/client";

/**
 * Normative criteria catalog (Lineamientos CENI v3.1). Titles and point
 * distribution must not be altered. helpText is literal, one line each.
 */

export const DIMENSION_NAMES: Record<Line, Record<number, string>> = {
  LABORAL: {
    1: "Políticas y Compromiso",
    2: "Reclutamiento y Selección",
    3: "Ambiente y Cultura",
    4: "Desarrollo y Retención",
    5: "Gestión de Crisis",
    6: "Medición e Impacto",
  },
  ESPACIOS: {
    1: "Accesibilidad Sensorial",
    2: "Accesibilidad Cognitiva",
    3: "Accesibilidad Social y Comunicativa",
    4: "Seguridad Emocional e Infraestructura",
    5: "Flexibilidad y Opciones",
    6: "Gobernanza y Mejora Continua",
  },
};

export const DIMENSION_MAX_POINTS: Record<Line, Record<number, number>> = {
  LABORAL: { 1: 150, 2: 200, 3: 250, 4: 200, 5: 100, 6: 100 },
  ESPACIOS: { 1: 250, 2: 150, 3: 200, 4: 200, 5: 100, 6: 100 },
};

export interface CriterionSeed {
  line: Line;
  dimension: number;
  code: string;
  title: string;
  helpText: string;
  maxPoints: number;
  sortOrder: number;
}

function laboral(
  dimension: number,
  index: number,
  title: string,
  helpText: string,
  maxPoints: number,
): CriterionSeed {
  return {
    line: "LABORAL",
    dimension,
    code: `D${dimension}-C${index}`,
    title,
    helpText,
    maxPoints,
    sortOrder: dimension * 10 + index,
  };
}

function espacios(
  dimension: number,
  index: number,
  title: string,
  helpText: string,
  maxPoints: number,
): CriterionSeed {
  return {
    line: "ESPACIOS",
    dimension,
    code: `E${dimension}-C${index}`,
    title,
    helpText,
    maxPoints,
    sortOrder: dimension * 10 + index,
  };
}

export const CRITERIA: CriterionSeed[] = [
  // ----- CENI Laboral · D1 Políticas y Compromiso (150 = 5×30) -----
  laboral(1, 1, "Política formal aprobada por dirección", "Existe una política de neuroinclusión escrita, aprobada y firmada por la dirección general.", 30),
  laboral(1, 2, "Presupuesto asignado", "La política cuenta con un presupuesto anual específico y comprobable.", 30),
  laboral(1, 3, "Declaración pública", "La organización publica su compromiso de neuroinclusión en sus canales oficiales.", 30),
  laboral(1, 4, "Responsable con autoridad presupuestal", "Hay una persona responsable del programa con autoridad para ejercer el presupuesto.", 30),
  laboral(1, 5, "Plan estratégico con metas", "Existe un plan con metas medibles y fechas para avanzar en neuroinclusión.", 30),
  // ----- D2 Reclutamiento y Selección (200 = 5×40) -----
  laboral(2, 1, "Vacantes en lenguaje neuroinclusivo", "Las vacantes se redactan en lenguaje claro, literal y sin requisitos sociales innecesarios.", 40),
  laboral(2, 2, "Entrevistas adaptadas", "Se ofrecen ajustes en entrevistas: preguntas por adelantado, formato escrito o tiempo extra.", 40),
  laboral(2, 3, "Evaluaciones diversificadas", "Existen alternativas de evaluación: pruebas prácticas, portafolio o periodos de prueba.", 40),
  laboral(2, 4, "Eliminación documentada de sesgos", "El proceso de selección documenta cómo se eliminan sesgos contra personas neurodivergentes.", 40),
  laboral(2, 5, "Metas de contratación", "Hay metas explícitas de contratación de personas neurodivergentes y seguimiento de avance.", 40),
  // ----- D3 Ambiente y Cultura (250 = 5×50) -----
  laboral(3, 1, "Iluminación regulable", "Las áreas de trabajo tienen iluminación LED sin parpadeo, regulable y con máximo 500 lux.", 50),
  laboral(3, 2, "Control de ruido y espacio de regulación", "El ruido general no supera 45 dB y existe un espacio de regulación con máximo 35 dB y 200 lux.", 50),
  laboral(3, 3, "Trabajo remoto e híbrido documentados", "Las opciones de trabajo remoto, híbrido y horario flexible están escritas y disponibles.", 50),
  laboral(3, 4, "Comunicación clara y explícita", "Las instrucciones de trabajo se dan por escrito, en lenguaje literal y con expectativas explícitas.", 50),
  laboral(3, 5, "Cultura de celebración", "El stimming está permitido y el masking no se exige ni se premia en ningún proceso.", 50),
  // ----- D4 Desarrollo y Retención (200 = 5×40) -----
  laboral(4, 1, "Inducción adaptada", "La inducción ofrece materiales escritos, tiempos flexibles y acompañamiento individual.", 40),
  laboral(4, 2, "Mentoría específica", "Existe un programa de mentoría con personas capacitadas en neurodivergencia.", 40),
  laboral(4, 3, "Plan de carrera sin depender de habilidades sociales", "El crecimiento profesional no exige socialización ni autopromoción como requisito.", 40),
  laboral(4, 4, "Evaluaciones por resultados", "El desempeño se evalúa por resultados verificables, no por estilo de comunicación.", 40),
  laboral(4, 5, "Retención medida y reportada", "La retención de personas neurodivergentes se mide y se reporta periódicamente.", 40),
  // ----- D5 Gestión de Crisis (100 = 5×20) -----
  laboral(5, 1, "Protocolo meltdown/shutdown no punitivo", "Existe un protocolo escrito para crisis que excluye cualquier sanción a la persona.", 20),
  laboral(5, 2, "Personal capacitado en primeros auxilios emocionales", "Hay personal formado en primeros auxilios emocionales disponible en cada turno.", 20),
  laboral(5, 3, "Espacio de descompresión disponible", "Existe un espacio de descompresión accesible sin pedir permiso ni dar explicaciones.", 20),
  laboral(5, 4, "Canal confidencial de reporte", "Hay un canal confidencial para reportar incidentes o solicitar apoyo.", 20),
  laboral(5, 5, "Mediación con opciones no verbales", "Los procesos de mediación ofrecen alternativas escritas o no verbales.", 20),
  // ----- D6 Medición e Impacto (100 = 5×20) -----
  laboral(6, 1, "Indicadores definidos y publicados", "Los indicadores de neuroinclusión están definidos y publicados internamente.", 20),
  laboral(6, 2, "Encuestas de clima con preguntas ND", "Las encuestas de clima incluyen preguntas específicas sobre experiencia neurodivergente.", 20),
  laboral(6, 3, "Reporte anual a dirección", "Se entrega un reporte anual de resultados de neuroinclusión a la dirección.", 20),
  laboral(6, 4, "Benchmarking sectorial", "La organización compara sus resultados con referentes de su sector.", 20),
  laboral(6, 5, "Mejora continua documentada", "Los hallazgos generan acciones de mejora documentadas y con seguimiento.", 20),

  // ----- CENI Espacios · E1 Accesibilidad Sensorial (250 = 60/70/30/40/50) -----
  espacios(1, 1, "Iluminación", "La iluminación es LED sin parpadeo perceptible, regulable y con máximo 500 lux en áreas de servicio.", 60),
  espacios(1, 2, "Acústica", "El ruido no supera 55 dB en áreas generales ni 45 dB en zonas silenciosas.", 70),
  espacios(1, 3, "Control olfativo", "Se evitan aromatizantes intensos y hay ventilación adecuada en todas las áreas.", 30),
  espacios(1, 4, "Estímulos visuales", "Se limitan pantallas parpadeantes, saturación de anuncios y estímulos visuales intensos.", 40),
  espacios(1, 5, "Espacio de regulación sensorial", "Existe un espacio de regulación sensorial con máximo 35 dB y 200 lux, disponible sin costo.", 50),
  // ----- E2 Accesibilidad Cognitiva (150 = 35/25/40/30/20) -----
  espacios(2, 1, "Señalización clara", "La señalización usa lenguaje literal, pictogramas y alto contraste.", 35),
  espacios(2, 2, "Mapas y orientación", "Hay mapas simples del espacio y rutas señalizadas hacia salidas y servicios.", 25),
  espacios(2, 3, "Consentimiento informado ambiental", "Se informa por adelantado qué estímulos y dinámicas encontrará la persona en el espacio.", 40),
  espacios(2, 4, "Procedimientos predecibles", "Los procesos de atención siguen pasos publicados y sin cambios sorpresivos.", 30),
  espacios(2, 5, "Eliminación de ambigüedades", "Las reglas del espacio están escritas, visibles y sin dobles sentidos.", 20),
  // ----- E3 Accesibilidad Social y Comunicativa (200 = 60/40/40/30/30) -----
  espacios(3, 1, "Personal capacitado", "Todo el personal de atención recibió capacitación en trato neuroinclusivo en el último año.", 60),
  espacios(3, 2, "Comunicación alternativa", "Se aceptan medios alternativos de comunicación: escrito, pictogramas o dispositivos.", 40),
  espacios(3, 3, "Protocolo neurosensible y mystery client", "Existe un protocolo de atención neurosensible verificado con visitas de cliente incógnito.", 40),
  espacios(3, 4, "Respeto a tiempos de procesamiento", "El personal espera las respuestas sin presionar ni completar las frases de la persona.", 30),
  espacios(3, 5, "Eliminación de coerción social", "Nadie es obligado a mantener contacto visual, saludar de mano ni interactuar socialmente.", 30),
  // ----- E4 Seguridad Emocional e Infraestructura (200 = 50/40/25/45/40) -----
  espacios(4, 1, "Espacio de descompresión", "Existe un espacio de descompresión señalizado, disponible sin costo ni requisitos.", 50),
  espacios(4, 2, "Protocolo de crisis", "Hay un protocolo escrito y no punitivo para acompañar crisis en el espacio.", 40),
  espacios(4, 3, "Políticas de no interrupción", "El personal no interrumpe ni toca a una persona en regulación sin su consentimiento.", 25),
  espacios(4, 4, "Mobiliario ergonómico y flexible", "Hay opciones de asiento y mobiliario con distintas texturas, alturas y niveles de firmeza.", 45),
  espacios(4, 5, "Mascotas de servicio", "Se admiten animales de servicio y de apoyo emocional con política escrita.", 40),
  // ----- E5 Flexibilidad y Opciones (100 = 25/20/20/15/20) -----
  espacios(5, 1, "Hora de baja estimulación", "Existe un horario semanal publicado con iluminación y sonido reducidos.", 25),
  espacios(5, 2, "Servicio alternativo", "Se ofrece una vía alternativa de servicio: en línea, a domicilio o sin fila.", 20),
  espacios(5, 3, "Adaptación de productos", "Los productos o servicios pueden ajustarse a necesidades sensoriales al solicitarlo.", 20),
  espacios(5, 4, "Acompañamiento sin costo", "Las personas acompañantes de apoyo entran sin costo adicional.", 15),
  espacios(5, 5, "Preparación pre-visita", "Hay material publicado para preparar la visita: fotos, video o guía paso a paso.", 20),
  // ----- E6 Gobernanza y Mejora Continua (100 = 5×20) -----
  espacios(6, 1, "Manual interno", "Existe un manual interno de neuroinclusión conocido por todo el personal.", 20),
  espacios(6, 2, "Responsable designado", "Hay una persona responsable de neuroinclusión con funciones escritas.", 20),
  espacios(6, 3, "Canal de retroalimentación", "Existe un canal público para recibir comentarios sobre accesibilidad.", 20),
  espacios(6, 4, "Auditorías internas semestrales", "Se realizan auditorías internas de accesibilidad cada seis meses con registro.", 20),
  espacios(6, 5, "Plan de mejora con participación ND", "El plan de mejora se elabora con participación de personas neurodivergentes.", 20),
];

export function criteriaForLine(line: Line): CriterionSeed[] {
  return CRITERIA.filter((criterion) => criterion.line === line);
}

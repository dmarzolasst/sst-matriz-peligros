import { PrismaClient, CatalogCategory, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Tablas 2, 3, 5, 6 y 8 de la GUÍA TÉCNICA COLOMBIANA GTC 45 (ICONTEC,
// segunda actualización, 2012-06-20) transcritas textualmente. Verificado
// contra el documento oficial el 2026-09-17. Se guardan versionadas en
// `risk_methodology_versions`, nunca hardcodeadas en el motor de cálculo.
// ---------------------------------------------------------------------------

const ND_LEVELS = [
  {
    value: 10,
    label: "Muy Alto",
    description:
      "Se ha(n) detectado peligro(s) que determina(n) como posible la generación de incidentes o consecuencias muy significativas, o la eficacia del conjunto de medidas preventivas existentes respecto al riesgo es nula o no existe, o ambos.",
  },
  {
    value: 6,
    label: "Alto",
    description:
      "Se ha(n) detectado algún(os) peligro(s) que pueden dar lugar a consecuencias significativa(s), o la eficacia del conjunto de medidas preventivas existentes es baja, o ambos.",
  },
  {
    value: 2,
    label: "Medio",
    description:
      "Se han detectado peligros que pueden dar lugar a consecuencias poco significativas o de menor importancia, o la eficacia del conjunto de medidas preventivas existentes es moderada, o ambos.",
  },
  {
    value: 0,
    label: "Bajo",
    description:
      "No se ha detectado consecuencia alguna, o la eficacia del conjunto de medidas preventivas existentes es alta, o ambos. El riesgo está controlado. Estos peligros se clasifican directamente en el nivel de riesgo y de intervención IV (Tabla 8).",
  },
];

const NE_LEVELS = [
  {
    value: 4,
    label: "Continua (EC)",
    description:
      "La situación de exposición se presenta sin interrupción o varias veces con tiempo prolongado durante la jornada laboral.",
  },
  {
    value: 3,
    label: "Frecuente (EF)",
    description:
      "La situación de exposición se presenta varias veces durante la jornada laboral por tiempos cortos.",
  },
  {
    value: 2,
    label: "Ocasional (EO)",
    description:
      "La situación de exposición se presenta alguna vez durante la jornada laboral y por un periodo de tiempo corto.",
  },
  {
    value: 1,
    label: "Esporádica (EE)",
    description: "La situación de exposición se presenta de manera eventual.",
  },
];

const NC_LEVELS = [
  {
    value: 100,
    label: "Mortal o Catastrófico",
    description: "Muerte(s).",
  },
  {
    value: 60,
    label: "Muy Grave",
    description: "Lesiones o enfermedades graves irreparables (incapacidad permanente parcial o invalidez).",
  },
  {
    value: 25,
    label: "Grave",
    description: "Lesiones o enfermedades con incapacidad laboral temporal (ILT).",
  },
  {
    value: 10,
    label: "Leve",
    description: "Lesiones o enfermedades que no requieren incapacidad.",
  },
];

// Rangos de interpretación de NP = ND x NE
const NP_RANGES = [
  {
    min: 24,
    max: 40,
    label: "Muy Alto",
    description:
      "Situación deficiente con exposición continua, o muy deficiente con exposición frecuente. Normalmente la materialización del riesgo ocurre con frecuencia.",
  },
  {
    min: 10,
    max: 20,
    label: "Alto",
    description:
      "Situación deficiente con exposición frecuente u ocasional, o bien situación muy deficiente con exposición ocasional o esporádica. La materialización del riesgo es posible que suceda varias veces en la vida laboral.",
  },
  {
    min: 6,
    max: 8,
    label: "Medio",
    description:
      "Situación deficiente con exposición esporádica, o bien situación mejorable con exposición continuada o frecuente. Es posible que suceda el daño alguna vez.",
  },
  {
    min: 2,
    max: 4,
    label: "Bajo",
    description:
      "Situación mejorable con exposición ocasional o esporádica, o situación sin anomalía destacable con cualquier nivel de exposición. No es esperable que se materialice el riesgo, aunque puede ser concebible.",
  },
];

// Rangos de interpretación de NR = NP x NC, con prioridad y aceptabilidad
const NR_RANGES = [
  {
    min: 600,
    max: 4000,
    label: "I - Riesgo No Aceptable",
    priority: "Crítica",
    acceptability: "No aceptable",
    description: "Situación crítica. Suspender actividades hasta que el riesgo esté controlado. Intervención urgente.",
  },
  {
    min: 150,
    max: 500,
    label: "II - Riesgo No Aceptable o Aceptable con control específico",
    priority: "Alta",
    acceptability: "No aceptable o aceptable con control específico",
    description: "Corregir y adoptar medidas de control de inmediato.",
  },
  {
    min: 40,
    max: 120,
    label: "III - Riesgo Mejorable",
    priority: "Media",
    acceptability: "Mejorable",
    description: "Mejorar si es posible. Sería conveniente justificar la intervención y su rentabilidad.",
  },
  {
    min: 0,
    max: 20,
    label: "IV - Riesgo Aceptable",
    priority: "Baja",
    acceptability: "Aceptable",
    description:
      "Mantener las medidas de control existentes, pero se deberían considerar soluciones o mejoras y se deben hacer comprobaciones periódicas para asegurar que el riesgo aún es aceptable.",
  },
];

// ---------------------------------------------------------------------------
// Catálogos base (editables luego desde Configuración)
// ---------------------------------------------------------------------------

// Listado del Anexo A (Informativo) de la GTC 45 (ICONTEC, segunda actualización).
// Verificado contra el documento oficial el 2026-09-17.
const CLASIFICACIONES: Record<string, string[]> = {
  Biológico: [
    "Virus",
    "Bacterias",
    "Hongos",
    "Ricketsias",
    "Parásitos",
    "Picadura de insectos o animales",
    "Mordeduras",
    "Fluidos o excrementos",
  ],
  Físico: [
    "Iluminación deficiente",
    "Iluminación en exceso",
    "Ruido",
    "Vibración",
    "Temperaturas extremas (calor)",
    "Temperaturas extremas (frío)",
    "Presión atmosférica (normal y ajustada)",
    "Radiaciones no ionizantes",
    "Radiaciones ionizantes",
  ],
  Químico: [
    "Polvos orgánicos e inorgánicos",
    "Fibras",
    "Líquidos (nieblas y rocíos)",
    "Gases y vapores",
    "Humos metálicos y no metálicos",
    "Material particulado",
  ],
  Psicosocial: [
    "Gestión organizacional",
    "Características de la organización del trabajo",
    "Características del grupo social del trabajo",
    "Condiciones de la tarea",
    "Interfase persona-tarea",
    "Jornada de trabajo",
  ],
  Biomecánico: [
    "Postura prolongada",
    "Postura mantenida",
    "Postura forzada",
    "Postura antigravitacional",
    "Esfuerzo",
    "Movimiento repetitivo",
    "Manipulación manual de cargas",
  ],
  "Condiciones de Seguridad": [
    "Mecánico (atrapamiento, golpeado por o contra)",
    "Eléctrico (alta y baja tensión, estática)",
    "Locativo (superficies e instalaciones de trabajo)",
    "Tecnológico (explosión, fuga, derrame, incendio)",
    "Accidentes de tránsito",
    "Público (robo, atraco, asalto)",
    "Trabajo en alturas",
    "Espacios confinados",
  ],
  "Fenómenos Naturales": [
    "Sismo",
    "Terremoto",
    "Vendaval",
    "Inundación",
    "Derrumbe o deslizamiento",
    "Precipitaciones (lluvias, granizadas, heladas)",
  ],
};

const CONTROL_FUENTE = [
  "Automatización del proceso",
  "Mantenimiento preventivo",
  "Rediseño de herramienta o equipo",
  "Eliminación de la condición peligrosa",
  "Sustitución de materiales o productos",
  "Encerramiento de la fuente",
];

const CONTROL_MEDIO = [
  "Barreras físicas",
  "Señalización",
  "Ventilación",
  "Demarcación de áreas",
  "Protección de máquinas y equipos",
  "Adecuación del puesto de trabajo",
  "Sistemas de extracción localizada",
];

const CONTROL_INDIVIDUO = [
  "Capacitación",
  "Entrenamiento",
  "Inspecciones planeadas",
  "Procedimientos de trabajo seguro",
  "Elementos de Protección Personal (EPP)",
  "Pausas activas",
  "Vigilancia epidemiológica",
];

const CONSECUENCIAS = [
  "Lesión grave",
  "Amputación",
  "Fractura",
  "Intoxicación",
  "Quemadura",
  "Enfermedad laboral",
  "Incapacidad permanente",
  "Muerte",
];

const MEDIDA_ELIMINACION = [
  "Eliminación de la tarea o actividad peligrosa",
  "Retiro de la máquina o equipo peligroso",
  "Eliminación de la sustancia química peligrosa",
];

const MEDIDA_SUSTITUCION = [
  "Sustitución de materia prima o insumo por uno menos peligroso",
  "Sustitución de proceso por uno más seguro",
  "Sustitución de equipo por uno de menor riesgo",
];

const MEDIDA_INGENIERIA = [
  "Automatización",
  "Guardas de seguridad",
  "Barreras físicas",
  "Rediseño del puesto o proceso",
  "Ayudas mecánicas",
  "Sistemas de extracción o ventilación",
  "Encerramiento de equipos",
];

const MEDIDA_ADMINISTRATIVA = [
  "Capacitación",
  "Procedimiento de trabajo seguro",
  "Inspecciones planeadas",
  "Programa de mantenimiento preventivo",
  "Rotación de trabajadores",
  "Pausas activas",
  "Señalización",
  "Estándares de seguridad",
  "Permisos de trabajo",
];

const MEDIDA_EPP = [
  "Protección auditiva",
  "Protección respiratoria",
  "Protección visual",
  "Guantes de protección",
  "Calzado de seguridad",
  "Arnés de seguridad",
  "Casco de seguridad",
  "Protección dérmica",
];

async function seedSimpleCatalog(category: CatalogCategory, names: string[]) {
  for (const name of names) {
    await prisma.catalogItem.upsert({
      where: { id: `${category}:${name}` }, // ver nota abajo
      update: {},
      create: { id: `${category}:${name}`, category, name },
    });
  }
}

async function main() {
  // -------------------------------------------------------------------
  // Usuario administrador inicial (cambiar la contraseña tras el primer login)
  // -------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "dmarzola.sst@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador",
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  // -------------------------------------------------------------------
  // Clasificaciones de peligro + descripciones (jerarquía padre/hijo)
  // -------------------------------------------------------------------
  for (const [classificationName, descriptions] of Object.entries(CLASIFICACIONES)) {
    const classification = await prisma.catalogItem.upsert({
      where: { id: `CLASIFICACION_PELIGRO:${classificationName}` },
      update: {},
      create: {
        id: `CLASIFICACION_PELIGRO:${classificationName}`,
        category: CatalogCategory.CLASIFICACION_PELIGRO,
        name: classificationName,
      },
    });

    for (const description of descriptions) {
      const id = `PELIGRO_DESCRIPCION:${classificationName}:${description}`;
      await prisma.catalogItem.upsert({
        where: { id },
        update: {},
        create: {
          id,
          category: CatalogCategory.PELIGRO_DESCRIPCION,
          name: description,
          parentId: classification.id,
        },
      });
    }
  }

  // -------------------------------------------------------------------
  // Controles, consecuencias y medidas de intervención
  // -------------------------------------------------------------------
  await seedSimpleCatalog(CatalogCategory.CONTROL_FUENTE, CONTROL_FUENTE);
  await seedSimpleCatalog(CatalogCategory.CONTROL_MEDIO, CONTROL_MEDIO);
  await seedSimpleCatalog(CatalogCategory.CONTROL_INDIVIDUO, CONTROL_INDIVIDUO);
  await seedSimpleCatalog(CatalogCategory.CONSECUENCIA, CONSECUENCIAS);
  await seedSimpleCatalog(CatalogCategory.MEDIDA_ELIMINACION, MEDIDA_ELIMINACION);
  await seedSimpleCatalog(CatalogCategory.MEDIDA_SUSTITUCION, MEDIDA_SUSTITUCION);
  await seedSimpleCatalog(CatalogCategory.MEDIDA_INGENIERIA, MEDIDA_INGENIERIA);
  await seedSimpleCatalog(CatalogCategory.MEDIDA_ADMINISTRATIVA, MEDIDA_ADMINISTRATIVA);
  await seedSimpleCatalog(CatalogCategory.MEDIDA_EPP, MEDIDA_EPP);

  // -------------------------------------------------------------------
  // Metodología GTC 45 activa
  // -------------------------------------------------------------------
  const methodologyName = "GTC 45:2012 (segunda actualización, ICONTEC) — verificada contra el documento oficial";
  const existingMethodology = await prisma.riskMethodologyVersion.findFirst({
    where: { name: methodologyName },
  });

  if (!existingMethodology) {
    await prisma.riskMethodologyVersion.create({
      data: {
        name: methodologyName,
        isActive: true,
        ndLevels: ND_LEVELS,
        neLevels: NE_LEVELS,
        ncLevels: NC_LEVELS,
        npRanges: NP_RANGES,
        nrRanges: NR_RANGES,
      },
    });
  }

  console.log("Seed completado.");
  console.log(`Usuario admin: ${adminEmail} / contraseña temporal: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SST');

-- CreateEnum
CREATE TYPE "MatrixStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('CLASIFICACION_PELIGRO', 'PELIGRO_DESCRIPCION', 'CONTROL_FUENTE', 'CONTROL_MEDIO', 'CONTROL_INDIVIDUO', 'CONSECUENCIA', 'MEDIDA_ELIMINACION', 'MEDIDA_SUSTITUCION', 'MEDIDA_INGENIERIA', 'MEDIDA_ADMINISTRATIVA', 'MEDIDA_EPP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nit" TEXT,
    "sector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskMatrix" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "MatrixStatus" NOT NULL DEFAULT 'DRAFT',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateSector" TEXT,
    "methodologyVersionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "riskMatrixId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "routine" BOOLEAN NOT NULL DEFAULT true,
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hazard" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "classificationId" TEXT NOT NULL,
    "descriptionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExistingControl" (
    "id" TEXT NOT NULL,
    "hazardId" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "individual" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExistingControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "hazardId" TEXT NOT NULL,
    "nd" INTEGER NOT NULL,
    "ne" INTEGER NOT NULL,
    "nc" INTEGER NOT NULL,
    "np" INTEGER NOT NULL,
    "npInterpretation" TEXT NOT NULL,
    "nr" INTEGER NOT NULL,
    "nrInterpretation" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlCriteria" (
    "id" TEXT NOT NULL,
    "hazardId" TEXT NOT NULL,
    "exposedWorkers" INTEGER NOT NULL,
    "worstConsequence" TEXT NOT NULL,
    "hasLegalRequirement" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRequirement" (
    "id" TEXT NOT NULL,
    "controlCriteriaId" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "article" TEXT,
    "description" TEXT,
    "referenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionMeasure" (
    "id" TEXT NOT NULL,
    "hazardId" TEXT NOT NULL,
    "elimination" TEXT,
    "substitution" TEXT,
    "engineering" TEXT,
    "administrative" TEXT,
    "ppe" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "category" "CatalogCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskMethodologyVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "ndLevels" JSONB NOT NULL,
    "neLevels" JSONB NOT NULL,
    "ncLevels" JSONB NOT NULL,
    "npRanges" JSONB NOT NULL,
    "nrRanges" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskMethodologyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_nit_key" ON "Company"("nit");

-- CreateIndex
CREATE INDEX "Process_companyId_idx" ON "Process"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Process_companyId_name_key" ON "Process"("companyId", "name");

-- CreateIndex
CREATE INDEX "Area_companyId_idx" ON "Area"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_companyId_name_key" ON "Area"("companyId", "name");

-- CreateIndex
CREATE INDEX "RiskMatrix_companyId_idx" ON "RiskMatrix"("companyId");

-- CreateIndex
CREATE INDEX "Activity_processId_idx" ON "Activity"("processId");

-- CreateIndex
CREATE INDEX "Task_riskMatrixId_idx" ON "Task"("riskMatrixId");

-- CreateIndex
CREATE INDEX "Task_activityId_idx" ON "Task"("activityId");

-- CreateIndex
CREATE INDEX "Task_areaId_idx" ON "Task"("areaId");

-- CreateIndex
CREATE INDEX "Hazard_taskId_idx" ON "Hazard"("taskId");

-- CreateIndex
CREATE INDEX "Hazard_classificationId_idx" ON "Hazard"("classificationId");

-- CreateIndex
CREATE INDEX "Hazard_descriptionId_idx" ON "Hazard"("descriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExistingControl_hazardId_key" ON "ExistingControl"("hazardId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_hazardId_key" ON "RiskAssessment"("hazardId");

-- CreateIndex
CREATE INDEX "RiskAssessment_hazardId_idx" ON "RiskAssessment"("hazardId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlCriteria_hazardId_key" ON "ControlCriteria"("hazardId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRequirement_controlCriteriaId_key" ON "LegalRequirement"("controlCriteriaId");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionMeasure_hazardId_key" ON "InterventionMeasure"("hazardId");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "CatalogItem_parentId_idx" ON "CatalogItem"("parentId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrix" ADD CONSTRAINT "RiskMatrix_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrix" ADD CONSTRAINT "RiskMatrix_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "RiskMethodologyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrix" ADD CONSTRAINT "RiskMatrix_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMatrix" ADD CONSTRAINT "RiskMatrix_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_riskMatrixId_fkey" FOREIGN KEY ("riskMatrixId") REFERENCES "RiskMatrix"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExistingControl" ADD CONSTRAINT "ExistingControl_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlCriteria" ADD CONSTRAINT "ControlCriteria_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRequirement" ADD CONSTRAINT "LegalRequirement_controlCriteriaId_fkey" FOREIGN KEY ("controlCriteriaId") REFERENCES "ControlCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMeasure" ADD CONSTRAINT "InterventionMeasure_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

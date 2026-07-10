-- AlterTable
ALTER TABLE "RequirementNode" ADD COLUMN "externalId" TEXT;

-- AlterTable
ALTER TABLE "DesignElement" ADD COLUMN "externalId" TEXT;

-- AlterTable
ALTER TABLE "VerificationRecord" ADD COLUMN "externalId" TEXT;

-- AlterTable
ALTER TABLE "RiskControl" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RequirementNode_projectId_externalId_key" ON "RequirementNode"("projectId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignElement_projectId_externalId_key" ON "DesignElement"("projectId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRecord_projectId_externalId_key" ON "VerificationRecord"("projectId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskControl_projectId_externalId_key" ON "RiskControl"("projectId", "externalId");

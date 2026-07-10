// Seeds two starter compliance packs to prove out the plug-in architecture:
// one medtech (ISO 13485 / QMSR-flavored), one aerospace (DO-178C-flavored).
// These are intentionally minimal — flesh out GapRule/ArtifactTemplate sets
// as each vertical gets built out for real.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const medtech = await prisma.compliancePack.upsert({
    where: { standardId: "iso13485" },
    update: {},
    create: {
      standardId: "iso13485",
      name: "ISO 13485 / QMSR (Medtech)",
      description:
        "Design and development file (DDF) traceability aligned to FDA QMSR and ISO 13485:2016.",
      terminologyMaps: {
        create: [
          { nodeSubtype: "design_input", label: "Design Input" },
          { nodeSubtype: "design_output", label: "Design Output" },
          { nodeSubtype: "hazard", label: "Hazard (ISO 14971)" },
        ],
      },
      gapRules: {
        create: [
          {
            name: "risk_control_needs_verification",
            description:
              "Every risk control must be linked to at least one verification record.",
            ruleDefinition: {
              requires: "RiskControl",
              mustLinkTo: "VerificationRecord",
              linkType: "mitigates",
            },
          },
        ],
      },
    },
  });

  const aerospace = await prisma.compliancePack.upsert({
    where: { standardId: "do178c" },
    update: {},
    create: {
      standardId: "do178c",
      name: "DO-178C (Airborne Software)",
      description:
        "Software requirements traceability aligned to DO-178C objectives, fed by ARP4754A system-level requirements.",
      terminologyMaps: {
        create: [
          { nodeSubtype: "system_requirement", label: "System Requirement (ARP4754A)" },
          { nodeSubtype: "software_requirement", label: "Software Requirement (DO-178C)" },
          { nodeSubtype: "hazard", label: "Failure Condition" },
        ],
      },
      gapRules: {
        create: [
          {
            name: "requirement_needs_verification",
            description:
              "Every software requirement must be linked to at least one verification record.",
            ruleDefinition: {
              requires: "RequirementNode",
              mustLinkTo: "VerificationRecord",
              linkType: "verifies",
            },
          },
        ],
      },
    },
  });

  console.log("Seeded compliance packs:", medtech.standardId, aerospace.standardId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

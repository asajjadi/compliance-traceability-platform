// Seeds two starter compliance packs to prove out the plug-in architecture:
// one medtech (ISO 13485 / QMSR-flavored), one aerospace (DO-178C-flavored).
//
// GapRule sets below encode the real traceability chains for each standard
// (see docs/STRATEGY.md "Regulatory context" and docs/ARCHITECTURE.md):
//   - ISO 13485 / ISO 14971: design input -> design output -> verification,
//     and hazard -> mitigation -> verification.
//   - DO-178C / ARP4754A: system requirement -> software requirement ->
//     code module -> verification, and failure condition -> derived
//     system requirement.
//
// Safe to re-run: each pack's gapRules/terminologyMaps are replaced on every
// run rather than left stale after the first insert.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedPack({ standardId, name, description, terminologyMaps, gapRules, artifactTemplates }) {
  const pack = await prisma.compliancePack.upsert({
    where: { standardId },
    update: { name, description },
    create: { standardId, name, description },
  });

  await prisma.terminologyMap.deleteMany({ where: { compliancePackId: pack.id } });
  await prisma.terminologyMap.createMany({
    data: terminologyMaps.map((t) => ({ ...t, compliancePackId: pack.id })),
  });

  await prisma.gapRule.deleteMany({ where: { compliancePackId: pack.id } });
  await prisma.gapRule.createMany({
    data: gapRules.map((r) => ({ ...r, compliancePackId: pack.id })),
  });

  await prisma.artifactTemplate.deleteMany({ where: { compliancePackId: pack.id } });
  await prisma.artifactTemplate.createMany({
    data: artifactTemplates.map((a) => ({ ...a, compliancePackId: pack.id })),
  });

  return pack;
}

async function main() {
  const medtech = await seedPack({
    standardId: "iso13485",
    name: "ISO 13485 / QMSR (Medtech)",
    description:
      "Design and development file (DDF) traceability aligned to FDA QMSR and ISO 13485:2016.",
    terminologyMaps: [
      { nodeSubtype: "design_input", label: "Design Input" },
      { nodeSubtype: "design_output", label: "Design Output" },
      { nodeSubtype: "hazard", label: "Hazard (ISO 14971)" },
      { nodeSubtype: "mitigation", label: "Risk Mitigation" },
    ],
    gapRules: [
      {
        name: "risk_control_needs_verification",
        description:
          "Every identified hazard must be directly linked to at least one verification record.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "VerificationRecord",
          linkType: "mitigates",
        },
      },
      {
        name: "design_input_needs_design_output",
        description:
          "Every design input must be linked to at least one design output that implements it.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "design_input",
          mustLinkTo: "DesignElement",
          mustLinkToSubtype: "design_output",
          linkType: "implements",
        },
      },
      {
        name: "design_output_needs_verification",
        description:
          "Every design output must be linked to at least one verification record.",
        ruleDefinition: {
          requires: "DesignElement",
          requiresSubtype: "design_output",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "hazard_needs_mitigation",
        description:
          "Every identified hazard must be linked to at least one risk mitigation (ISO 14971 risk control).",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "RiskControl",
          mustLinkToSubtype: "mitigation",
          linkType: "mitigated_by",
        },
      },
      {
        name: "mitigation_needs_verification",
        description:
          "Every risk mitigation must be linked to at least one verification record confirming its effectiveness.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "mitigation",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
    ],
    artifactTemplates: [
      {
        name: "Design and Development File (DDF)",
        requiredSections: [
          { name: "Design and Development Plan", description: "Scope, responsibilities, stages, and review points for the design effort." },
          { name: "Design Inputs", description: "User needs, intended use, and regulatory/design input requirements." },
          { name: "Design Outputs", description: "Specifications, drawings, and software that meet the design inputs." },
          { name: "Design Review Records", description: "Formal design review minutes and dispositions." },
          { name: "Design Verification Records", description: "Evidence that design outputs meet design inputs." },
          { name: "Design Validation Records", description: "Evidence the device meets user needs and intended use, under actual or simulated conditions." },
          { name: "Design Transfer Records", description: "Evidence design outputs were correctly translated into production specifications." },
          { name: "Design Change Records", description: "History of design changes, rationale, and re-verification/re-validation as needed." },
          { name: "Risk Management File Reference", description: "Cross-reference to the ISO 14971 risk management file for this device." },
          { name: "Usability Engineering File Reference", description: "Cross-reference to the IEC 62366 usability engineering file for this device." },
        ],
      },
      {
        name: "Medical Device File (MDF)",
        requiredSections: [
          { name: "Device Specifications", description: "Finished-device specifications, including drawings and composition." },
          { name: "Production Process Specifications", description: "Equipment, environment, methods, and procedures used in production." },
          { name: "Quality Assurance Procedures", description: "Acceptance criteria and QA procedures applied during production." },
          { name: "Packaging and Labeling Specifications", description: "Approved packaging and labeling, including any control numbers." },
          { name: "Installation, Maintenance, and Servicing Procedures", description: "Required if the device needs installation or servicing after manufacture." },
        ],
      },
    ],
  });

  const aerospace = await seedPack({
    standardId: "do178c",
    name: "DO-178C (Airborne Software)",
    description:
      "Software requirements traceability aligned to DO-178C objectives, fed by ARP4754A system-level requirements.",
    terminologyMaps: [
      { nodeSubtype: "system_requirement", label: "System Requirement (ARP4754A)" },
      { nodeSubtype: "software_requirement", label: "Software Requirement (DO-178C)" },
      { nodeSubtype: "code_module", label: "Source Code Module (DO-178C)" },
      { nodeSubtype: "hazard", label: "Failure Condition" },
    ],
    gapRules: [
      {
        name: "requirement_needs_verification",
        description:
          "Every software requirement must be linked to at least one verification record.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "software_requirement",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "system_requirement_needs_software_requirement",
        description:
          "Every system requirement must be linked to at least one derived software requirement (ARP4754A to DO-178C handoff).",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "system_requirement",
          mustLinkTo: "RequirementNode",
          mustLinkToSubtype: "software_requirement",
          linkType: "derives_to",
        },
      },
      {
        name: "software_requirement_needs_code_module",
        description:
          "Every software requirement must be linked to at least one implementing code module.",
        ruleDefinition: {
          requires: "RequirementNode",
          requiresSubtype: "software_requirement",
          mustLinkTo: "DesignElement",
          mustLinkToSubtype: "code_module",
          linkType: "implements",
        },
      },
      {
        name: "code_module_needs_verification",
        description:
          "Every code module must be linked to at least one verification record (unit/integration test).",
        ruleDefinition: {
          requires: "DesignElement",
          requiresSubtype: "code_module",
          mustLinkTo: "VerificationRecord",
          linkType: "verifies",
        },
      },
      {
        name: "failure_condition_needs_derived_requirement",
        description:
          "Every failure condition must be linked to at least one derived system requirement that mitigates it.",
        ruleDefinition: {
          requires: "RiskControl",
          requiresSubtype: "hazard",
          mustLinkTo: "RequirementNode",
          mustLinkToSubtype: "system_requirement",
          linkType: "mitigates",
        },
      },
    ],
    // Mirrors DO-178C Annex A software life cycle data categories.
    artifactTemplates: [
      {
        name: "Certification & Planning Data",
        requiredSections: [
          { name: "Plan for Software Aspects of Certification (PSAC)", description: "Overall certification approach agreed with the certification authority." },
          { name: "Software Development Plan (SDP)", description: "Development standards, methods, and tools used for this software." },
          { name: "Software Verification Plan (SVP)", description: "Verification methods, environment, and independence requirements." },
          { name: "Software Configuration Management Plan (SCMP)", description: "Baseline, change control, and problem-reporting procedures." },
          { name: "Software Quality Assurance Plan (SQAP)", description: "SQA activities and transition criteria between life cycle processes." },
        ],
      },
      {
        name: "Development Standards",
        requiredSections: [
          { name: "Software Requirements Standards", description: "Rules and conventions for expressing software requirements." },
          { name: "Software Design Standards", description: "Rules and conventions for software architecture and design." },
          { name: "Software Code Standards", description: "Coding standards applied to source code." },
        ],
      },
      {
        name: "Software Requirements Data",
        requiredSections: [
          { name: "System Requirements Allocated to Software", description: "ARP4754A system requirements allocated to the software item." },
          { name: "High-Level Requirements", description: "Software requirements derived from allocated system requirements." },
          { name: "Derived Requirements", description: "Requirements not directly traceable to a higher-level requirement, with rationale." },
        ],
      },
      {
        name: "Software Design Description",
        requiredSections: [
          { name: "Software Architecture", description: "Top-level software structure and component interfaces." },
          { name: "Low-Level Requirements", description: "Requirements detailed enough to generate source code without further information." },
          { name: "Interface Control Description", description: "Hardware/software and software/software interface definitions." },
        ],
      },
      {
        name: "Source Code",
        requiredSections: [
          { name: "Source Code Listing", description: "The actual source code implementing the low-level requirements." },
          { name: "Compiler / Linker Configuration", description: "Build environment configuration needed to reproduce the executable object code." },
        ],
      },
      {
        name: "Software Verification Data",
        requiredSections: [
          { name: "Verification Cases and Procedures", description: "Test cases and procedures for requirements-based testing." },
          { name: "Verification Results", description: "Recorded results of executing verification cases and procedures." },
          { name: "Structural Coverage Analysis", description: "Evidence of structural coverage achieved by requirements-based tests." },
        ],
      },
      {
        name: "Software Configuration Management Data",
        requiredSections: [
          { name: "Problem Reports", description: "Reported anomalies and their resolution status." },
          { name: "Change History", description: "Record of approved changes to configuration items." },
          { name: "Software Configuration Index (SCI)", description: "Identifies the configuration of the software product." },
          { name: "Software Life Cycle Environment Configuration Index (SECI)", description: "Identifies the tools and environment used to produce the software." },
        ],
      },
      {
        name: "Software Accomplishment Summary",
        requiredSections: [
          { name: "Summary of Compliance", description: "Summary of how the software life cycle data shows compliance with the PSAC." },
          { name: "Deviations", description: "Approved deviations from the plans or standards, with rationale." },
          { name: "Open Problem Reports", description: "Problem reports open at the time of certification, with impact assessment." },
        ],
      },
    ],
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

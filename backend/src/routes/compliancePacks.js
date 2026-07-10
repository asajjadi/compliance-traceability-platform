import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const compliancePacksRouter = Router();

compliancePacksRouter.use(requireAuth);

// List all available compliance packs (summary only).
compliancePacksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const packs = await prisma.compliancePack.findMany({
      select: { id: true, standardId: true, name: true, description: true },
      orderBy: { standardId: "asc" },
    });
    res.json(packs);
  })
);

// Full detail for one pack, including terminology, gap rules, and artifact
// templates — used by the frontend's pack-attachment UI.
compliancePacksRouter.get(
  "/:standardId",
  asyncHandler(async (req, res) => {
    const pack = await prisma.compliancePack.findUnique({
      where: { standardId: req.params.standardId },
      include: { terminologyMaps: true, gapRules: true, artifactTemplates: true },
    });
    if (!pack) {
      return res.status(404).json({ error: `No compliance pack found for standardId "${req.params.standardId}"` });
    }
    res.json(pack);
  })
);

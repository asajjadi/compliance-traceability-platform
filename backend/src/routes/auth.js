import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const authRouter = Router();

const ROLES = ["ADMIN", "ENGINEER", "QUALITY", "VIEWER"];
const MIN_PASSWORD_LENGTH = 8;

// Self-serve signup: creates a brand-new Organization plus its first ADMIN user.
// This is the only way to create an org — joining an existing one happens via /invite.
authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { organizationName, email, password, name } = req.body;
    if (!organizationName || !email || !password) {
      return res.status(400).json({ error: "organizationName, email, and password are required" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A user with that email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        users: { create: [{ email, name, passwordHash, role: "ADMIN" }] },
      },
      include: { users: true },
    });

    const user = organization.users[0];
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: organization.id },
    });
  })
);

// Login for an existing user.
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await verifyPassword(password, user.passwordHash));
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId },
    });
  })
);

// Invite a teammate into the caller's organization. ADMIN only.
authRouter.post(
  "/invite",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A user with that email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role && ROLES.includes(role) ? role : "ENGINEER",
        organizationId: req.user.organizationId,
      },
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  })
);

// Return the caller's own identity — lets the frontend bootstrap session state.
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
    });
    res.json(user);
  })
);

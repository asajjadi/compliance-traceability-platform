import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, organizationId: user.organizationId, role: user.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

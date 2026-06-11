import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { Op } from "sequelize";
import { PasswordResetCode } from "../models";
import { normalizeEmail } from "../utils/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getResetSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET nao definido no ambiente.");
  }
  return secret;
}

function hashResetCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${getResetSecret()}`)
    .digest("hex");
}

function safeCompareHex(a: string, b: string) {
  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");
  if (first.length !== second.length) return false;
  return timingSafeEqual(first, second);
}

async function cleanupExpiredCodes(now = new Date()) {
  await PasswordResetCode.update(
    { usedAt: now },
    {
      where: {
        usedAt: null,
        expiresAt: {
          [Op.lte]: now
        },
        [Op.or]: [
          { verifiedUntil: null },
          {
            verifiedUntil: {
              [Op.lte]: now
            }
          }
        ]
      }
    }
  );
}

export async function createPasswordResetCode(userId: number, email: string) {
  await cleanupExpiredCodes();

  const normalizedEmail = normalizeEmail(email);
  const code = String(randomInt(100000, 1000000));
  const now = new Date();

  await PasswordResetCode.update(
    { usedAt: now },
    {
      where: {
        userId,
        usedAt: null
      }
    }
  );

  await PasswordResetCode.create({
    userId,
    email: normalizedEmail,
    codeHash: hashResetCode(normalizedEmail, code),
    expiresAt: new Date(now.getTime() + CODE_TTL_MS)
  });

  return code;
}

export async function verifyPasswordResetCode(email: string, code: string) {
  await cleanupExpiredCodes();

  const normalizedEmail = normalizeEmail(email);
  const sanitizedCode = code.trim();
  const now = new Date();
  const entry = await PasswordResetCode.findOne({
    where: {
      email: normalizedEmail,
      usedAt: null,
      expiresAt: {
        [Op.gt]: now
      }
    },
    order: [["createdAt", "DESC"]]
  });

  if (!entry) {
    return false;
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    await entry.update({ usedAt: now });
    return false;
  }

  const nextAttempts = entry.attempts + 1;
  await entry.update({ attempts: nextAttempts });

  if (!/^\d{6}$/.test(sanitizedCode)) {
    return false;
  }

  const matches = safeCompareHex(entry.codeHash, hashResetCode(normalizedEmail, sanitizedCode));
  if (!matches) return false;

  await entry.update({ verifiedUntil: new Date(now.getTime() + VERIFIED_TTL_MS) });
  return true;
}

export async function consumePasswordResetVerification(email: string) {
  await cleanupExpiredCodes();

  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const entry = await PasswordResetCode.findOne({
    where: {
      email: normalizedEmail,
      usedAt: null,
      verifiedUntil: {
        [Op.gt]: now
      }
    },
    order: [["createdAt", "DESC"]]
  });

  if (!entry) {
    return false;
  }

  await entry.update({ usedAt: now });
  return true;
}

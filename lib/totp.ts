import crypto from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(key, "hex");
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, ciphertext] = encrypted.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function generateTotpSecret(email: string): {
  secret: string;
  uri: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: "Finances Next",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString("hex"));
  }
  return codes;
}

export async function generateQrDataUri(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}

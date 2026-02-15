// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

// Set encryption key before imports that use it
const TEST_KEY = "a".repeat(64);

describe("totp", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("TOTP_ENCRYPTION_KEY", TEST_KEY);
  });

  describe("encryptSecret / decryptSecret", () => {
    it("encrypts and decrypts a secret round-trip", async () => {
      const { encryptSecret, decryptSecret } = await import("./totp");
      const secret = "JBSWY3DPEHPK3PXP";
      const encrypted = encryptSecret(secret);

      expect(encrypted).not.toBe(secret);
      expect(encrypted.split(":")).toHaveLength(3);

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(secret);
    });

    it("produces different ciphertexts for the same input (random IV)", async () => {
      const { encryptSecret } = await import("./totp");
      const secret = "JBSWY3DPEHPK3PXP";
      const a = encryptSecret(secret);
      const b = encryptSecret(secret);

      expect(a).not.toBe(b);
    });

    it("throws when encryption key is missing", async () => {
      vi.stubEnv("TOTP_ENCRYPTION_KEY", "");
      const { encryptSecret } = await import("./totp");

      expect(() => encryptSecret("test")).toThrow("TOTP_ENCRYPTION_KEY");
    });
  });

  describe("generateTotpSecret", () => {
    it("returns a base32 secret and otpauth URI", async () => {
      const { generateTotpSecret } = await import("./totp");
      const result = generateTotpSecret("user@example.com");

      expect(result.secret).toMatch(/^[A-Z2-7]+=*$/);
      expect(result.uri).toContain("otpauth://totp/");
      expect(result.uri).toContain("Finances%20Next");
      expect(result.uri).toContain("user%40example.com");
    });
  });

  describe("verifyTotpCode", () => {
    it("validates a correct code", async () => {
      const OTPAuth = await import("otpauth");
      const { verifyTotpCode } = await import("./totp");

      const totp = new OTPAuth.TOTP({
        secret: new OTPAuth.Secret(),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const code = totp.generate();
      const result = verifyTotpCode(totp.secret.base32, code);

      expect(result).toBe(true);
    });

    it("rejects an invalid code", async () => {
      const OTPAuth = await import("otpauth");
      const { verifyTotpCode } = await import("./totp");

      const totp = new OTPAuth.TOTP({
        secret: new OTPAuth.Secret(),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const result = verifyTotpCode(totp.secret.base32, "000000");

      expect(result).toBe(false);
    });
  });

  describe("generateBackupCodes", () => {
    it("generates 10 unique 8-character hex codes", async () => {
      const { generateBackupCodes } = await import("./totp");
      const codes = generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach((code) => {
        expect(code).toMatch(/^[0-9a-f]{8}$/);
      });

      const unique = new Set(codes);
      expect(unique.size).toBe(10);
    });
  });

  describe("generateQrDataUri", () => {
    it("returns a data URI PNG", async () => {
      const { generateQrDataUri } = await import("./totp");
      const uri = await generateQrDataUri(
        "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP"
      );

      expect(uri).toMatch(/^data:image\/png;base64,/);
    });
  });
});

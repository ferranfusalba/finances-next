"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "@/actions/two-factor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Badge } from "@/components/ui/badge";

type TwoFactorState = "idle" | "setup" | "enabled";

export const TwoFactorSection = ({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) => {
  const [state, setState] = useState<TwoFactorState>(
    initialEnabled ? "enabled" : "idle"
  );
  const [qrCode, setQrCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [totpSecret, setTotpSecret] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSetup = () => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      const result = await setupTwoFactor();

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setQrCode(result.qrCode);
      setTotpSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setState("setup");
    });
  };

  const handleConfirm = () => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      const result = await confirmTwoFactor({ code: verifyCode });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success);
      setState("enabled");
      setQrCode("");
      setTotpSecret("");
      setBackupCodes([]);
      setVerifyCode("");
    });
  };

  const handleDisable = () => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      const result = await disableTwoFactor({ password: disablePassword });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success);
      setState("idle");
      setShowDisable(false);
      setDisablePassword("");
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Two-Factor Authentication</p>
        {state === "enabled" && (
          <Badge variant="default">Active</Badge>
        )}
      </div>

      {state === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security by requiring a code from your
            authenticator app when signing in.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleSetup}
            disabled={isPending}
          >
            Enable Two-Factor Authentication
          </Button>
        </div>
      )}

      {state === "setup" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.), then enter the 6-digit code below.
          </p>

          {qrCode && (
            <div className="flex justify-center">
              <Image
                src={qrCode}
                alt="Two-factor authentication QR code"
                width={200}
                height={200}
                className="rounded-md"
              />
            </div>
          )}

          {totpSecret && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Manual Entry Code</p>
              <p className="text-sm text-muted-foreground">
                If you can&apos;t scan the QR code, enter this key manually in
                your authenticator app.
              </p>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                  {totpSecret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                >
                  {copiedSecret ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Backup Codes</p>
            <p className="text-sm text-muted-foreground">
              Save these codes in a safe place. Each code can only be used once.
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-3 font-mono text-sm">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyBackupCodes}
            >
              {copiedCodes ? "Copied!" : "Copy codes"}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="totp-verify">
              Verification Code
            </label>
            <Input
              id="totp-verify"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || verifyCode.length !== 6}
            >
              Verify & Enable
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setState("idle");
                setQrCode("");
                setTotpSecret("");
                setBackupCodes([]);
                setVerifyCode("");
                setError(undefined);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {state === "enabled" && !showDisable && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your account is protected with two-factor authentication.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setShowDisable(true);
              setError(undefined);
              setSuccess(undefined);
            }}
            disabled={isPending}
          >
            Disable Two-Factor Authentication
          </Button>
        </div>
      )}

      {state === "enabled" && showDisable && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your password to disable two-factor authentication.
          </p>
          <Input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Your password"
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisable}
              disabled={isPending || !disablePassword}
            >
              Confirm Disable
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowDisable(false);
                setDisablePassword("");
                setError(undefined);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <FormError message={error} />
      <FormSuccess message={success} />
    </div>
  );
};

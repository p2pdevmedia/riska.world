"use client";

import {
  IDKitRequestWidget,
  proofOfHuman,
  type IDKitResult,
  type RpContext
} from "@worldcoin/idkit";
import { MiniKit } from "@worldcoin/minikit-js";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import {
  RISKA_WORLD_ID_ENVIRONMENT,
  RISKA_WORLD_ID_POLICY_ACTION,
  getWorldAppId,
  normalizeWorldIdSignal
} from "@/lib/world/idkit";

type GateStatus = "idle" | "loading" | "verified" | "error";

type VerifyPolicyHumanResponse = {
  success: boolean;
  alreadyReserved?: boolean;
  code?: string;
  error?: string;
  reservation?: {
    credentialIdentifiers: string[];
    nullifier: string;
    protocolVersion: string;
    reservedAt: string;
    walletAddress: string;
  };
};

export type PolicyHumanReservationView = NonNullable<VerifyPolicyHumanResponse["reservation"]>;

type RpSignatureResponse = {
  configured: boolean;
  action?: string;
  error?: string;
  rpContext?: RpContext;
};

function shortProofId(nullifier: string) {
  return `${nullifier.slice(0, 8)}…${nullifier.slice(-6)}`;
}

function getMiniKitHumanCredentialStatus() {
  const verificationStatus = MiniKit.user?.verificationStatus;

  if (!verificationStatus) {
    return "unknown";
  }

  return verificationStatus.isOrbVerified ||
    verificationStatus.isDocumentVerified ||
    verificationStatus.isSecureDocumentVerified
    ? "verified"
    : "unverified";
}

export function WorldIdGate({
  onReservationChange,
  variant = "dark",
  walletAddress
}: {
  onReservationChange?: (reservation: PolicyHumanReservationView | null) => void;
  variant?: "dark" | "light";
  walletAddress?: string;
}) {
  const { language, t } = useLanguage();
  const { isInstalled } = useMiniKit();
  const copy = t.worldIdGate;
  const worldAppId = getWorldAppId();

  const [status, setStatus] = useState<GateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [reservation, setReservation] = useState<PolicyHumanReservationView | null>(null);
  const verificationRef = useRef<VerifyPolicyHumanResponse | null>(null);

  useEffect(() => {
    setStatus("idle");
    setError(null);
    setIsOpen(false);
    setRpContext(null);
    setReservation(null);
    verificationRef.current = null;
    onReservationChange?.(null);
  }, [onReservationChange, walletAddress]);

  const resolveWorldIdError = useCallback(
    (errorCode?: string, fallback?: string) => {
      if (errorCode && copy.errors[errorCode]) {
        return copy.errors[errorCode];
      }

      return fallback ?? copy.errors.generic_error ?? copy.verifyError;
    },
    [copy.errors, copy.verifyError]
  );

  const startVerification = useCallback(async () => {
    if (!walletAddress) {
      setStatus("error");
      setError(copy.walletRequired);
      return;
    }

    if (!worldAppId) {
      setStatus("error");
      setError(copy.configMissing);
      return;
    }

    if (isInstalled && getMiniKitHumanCredentialStatus() === "unverified") {
      setStatus("error");
      setError(resolveWorldIdError("credential_unavailable"));
      return;
    }

    setStatus("loading");
    setError(null);

    let response: Response;

    try {
      response = await fetch("/api/world-id/rp-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: RISKA_WORLD_ID_POLICY_ACTION })
      });
    } catch {
      setStatus("error");
      setError(resolveWorldIdError("connection_failed"));
      return;
    }

    const payload = (await response.json().catch(() => null)) as RpSignatureResponse | null;

    if (!payload || !response.ok || !payload.configured || !payload.rpContext) {
      setStatus("error");
      setError(payload?.error ?? copy.signatureError);
      return;
    }

    setRpContext(payload.rpContext);
    setIsOpen(true);
  }, [
    copy.configMissing,
    copy.signatureError,
    copy.walletRequired,
    isInstalled,
    resolveWorldIdError,
    walletAddress,
    worldAppId
  ]);

  const handleVerify = useCallback(
    async (result: IDKitResult) => {
      verificationRef.current = null;

      let response: Response;

      try {
        response = await fetch("/api/world-id/verify-policy-human", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idkitResponse: result,
            walletAddress
          })
        });
      } catch {
        const networkError = resolveWorldIdError("connection_failed");
        verificationRef.current = {
          success: false,
          code: "connection_failed",
          error: networkError
        };
        throw new Error(networkError);
      }

      const payload = (await response.json().catch(() => null)) as VerifyPolicyHumanResponse | null;

      if (!payload || !response.ok || !payload.success || !payload.reservation) {
        const verificationError = payload?.alreadyReserved
          ? copy.duplicateError
          : resolveWorldIdError(payload?.code, payload?.error);

        verificationRef.current = {
          success: false,
          ...payload,
          error: verificationError
        };

        throw new Error(verificationError);
      }

      verificationRef.current = payload;
      setReservation(payload.reservation);
      onReservationChange?.(payload.reservation);
      setStatus("verified");
    },
    [copy.duplicateError, onReservationChange, resolveWorldIdError, walletAddress]
  );

  const handleSuccess = useCallback(() => {
    const verifiedReservation = verificationRef.current?.reservation;
    if (verifiedReservation) {
      setReservation(verifiedReservation);
      onReservationChange?.(verifiedReservation);
    }
    setStatus("verified");
    setError(null);
  }, [onReservationChange]);

  const handleError = useCallback(
    (errorCode: string) => {
      const lastError = verificationRef.current?.error;
      setStatus("error");
      setError(lastError ?? resolveWorldIdError(errorCode));
      setIsOpen(false);
      setRpContext(null);
    },
    [resolveWorldIdError]
  );

  const statusText =
    status === "verified"
      ? copy.statuses.verified
      : status === "loading"
      ? copy.statuses.loading
      : status === "error"
      ? copy.statuses.error
      : walletAddress
      ? worldAppId
        ? copy.statuses.ready
        : copy.statuses.notConfigured
      : copy.statuses.locked;

  const buttonDisabled = status === "loading" || !walletAddress || !worldAppId;
  const isLight = variant === "light";
  const panelClass = isLight
    ? "border border-[#dce4d8] bg-[#f8faf6] px-4 py-4"
    : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4";
  const eyebrowClass = isLight
    ? "text-xs uppercase tracking-[0.26em] text-[#6b766f]"
    : "text-xs uppercase tracking-[0.26em] text-slate-400";
  const descriptionClass = isLight ? "mt-1 text-sm text-[#516159]" : "mt-1 text-sm text-slate-300/80";
  const statusClass = isLight ? "text-[#26342d]" : "text-slate-200";
  const detailClass = isLight ? "break-all text-xs text-[#66746e]" : "break-all text-xs text-slate-400";
  const proofClass = isLight ? "text-xs text-emerald-700" : "text-xs text-aurora-500/90";
  const errorClass = isLight
    ? "border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
    : "rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200";
  const buttonClass = isLight
    ? "bg-[#17231e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26342d] disabled:cursor-not-allowed disabled:bg-[#ccd6cf] disabled:text-[#728078]"
    : "rounded-full bg-aurora-600 px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:bg-aurora-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none";

  return (
    <div className={panelClass}>
      <div className="flex flex-col gap-4">
        <div>
          <p className={eyebrowClass}>
            {copy.statusLabel}
          </p>
          <h4 className="mt-2 text-lg font-semibold">{copy.heading}</h4>
          <p className={descriptionClass}>{copy.description}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className={statusClass}>{statusText}</p>
          {walletAddress && (
            <p className={detailClass}>
              {copy.signalLabel(normalizeWorldIdSignal(walletAddress))}
            </p>
          )}
          {reservation && (
            <p className={proofClass}>
              {copy.proofLabel(shortProofId(reservation.nullifier))}
            </p>
          )}
          {error && (
            <p className={errorClass}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={startVerification}
          disabled={buttonDisabled}
          className={buttonClass}
        >
          {status === "loading" ? copy.actionLoading : copy.action}
        </button>
      </div>

      {worldAppId && rpContext && (
        <IDKitRequestWidget
          open={isOpen}
          onOpenChange={setIsOpen}
          app_id={worldAppId}
          action={RISKA_WORLD_ID_POLICY_ACTION}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={proofOfHuman({ signal: normalizeWorldIdSignal(walletAddress ?? "") })}
          environment={RISKA_WORLD_ID_ENVIRONMENT}
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
          onError={handleError}
          language={language}
        />
      )}
    </div>
  );
}

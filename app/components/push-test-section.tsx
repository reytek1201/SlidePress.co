"use client";

import { useIsNativeApp } from "@/app/hooks/use-is-native-app";
import { getStoredPushDeviceToken } from "@/utils/push-preferences";
import { Capacitor } from "@capacitor/core";
import { useState } from "react";

type PushTestResponse = {
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
  errors?: string[];
  apnsEnvironment?: "sandbox" | "production";
  environmentHint?: string;
  diagnostics?: Partial<Record<"sandbox" | "production", string>>;
};

export default function PushTestSection({ embedded = false }: { embedded?: boolean }) {
  const isNativeApp = useIsNativeApp();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<PushTestResponse["diagnostics"] | null>(
    null,
  );

  if (process.env.NEXT_PUBLIC_ALLOW_PUSH_TEST !== "true") {
    return null;
  }

  if (isNativeApp !== true) {
    return null;
  }

  async function handleSendTestPush() {
    setSending(true);
    setMessage(null);
    setError(null);
    setDiagnostics(null);

    const deviceToken = getStoredPushDeviceToken();
    const platform = Capacitor.getPlatform();

    if (!deviceToken) {
      setError(
        "No device token on this phone. Turn notifications on in Settings, then reopen the app.",
      );
      setSending(false);
      return;
    }

    if (platform !== "ios" && platform !== "android") {
      setError("Push test is only available on iOS and Android.");
      setSending(false);
      return;
    }

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken,
          platform,
        }),
      });

      const data = (await response.json()) as PushTestResponse;

      if (!response.ok || !data.success) {
        const detail =
          data.environmentHint ??
          data.errors?.[0] ??
          data.error ??
          "Failed to send test push";
        setDiagnostics(data.diagnostics ?? null);
        throw new Error(detail);
      }

      const envNote = data.apnsEnvironment
        ? ` Delivered via ${data.apnsEnvironment} APNs.`
        : "";

      const hintNote = data.environmentHint ? ` ${data.environmentHint}` : "";

      setDiagnostics(data.diagnostics ?? null);
      setMessage(
        `Test push sent to this device.${envNote}${hintNote} Background the app to see the banner.`,
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send test push",
      );
    } finally {
      setSending(false);
    }
  }

  const inner = (
    <>
      {!embedded ? (
        <>
          <h2 className="text-lg font-semibold text-foreground">Push test (dev)</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Send a test notification to this device without generating images.
            Background the app after tapping send.
          </p>
        </>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Send a test notification to this device without generating images.
          Background the app after tapping send.
        </p>
      )}

      <button
        type="button"
        disabled={sending}
        onClick={() => void handleSendTestPush()}
        className="mt-6 inline-flex items-center justify-center rounded-xl border border-amber-700/50 bg-amber-950/30 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-600/60 hover:bg-amber-950/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send test push"}
      </button>

      {message && (
        <p className="mt-4 text-sm text-emerald-200">{message}</p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {diagnostics && (
        <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-xs text-amber-100/90">
          <p className="font-medium text-amber-100">APNs probe</p>
          <ul className="mt-2 space-y-1">
            <li>Production: {diagnostics.production ?? "—"}</li>
            <li>Sandbox: {diagnostics.sandbox ?? "—"}</li>
          </ul>
        </div>
      )}
    </>
  );

  if (embedded) {
    return inner;
  }

  return (
    <section className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6 sm:p-8">
      {inner}
    </section>
  );
}

"use client";

import {
  checkBiometry,
  biometryLabel,
  isBiometricSupported,
} from "@/utils/biometric-auth";
import { isBiometricLockEnabled } from "@/utils/biometric-session";
import { clearBiometricSession } from "@/utils/biometric-session";
import { useUsageSummary } from "@/app/settings/usage-settings";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isPushNotificationsEnabled } from "@/utils/push-preferences";
import { isNativeAppRuntime } from "@/utils/is-native-app";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface SettingsHubProps {
  user: User;
}

function SettingsListRow({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value?: string | null;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 px-4 py-3.5 transition active:bg-secondary/40"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        {value ? <span className="max-w-[10rem] truncate">{value}</span> : null}
        <span aria-hidden className="text-muted-foreground/70">
          ›
        </span>
      </span>
    </Link>
  );
}

function SettingsListGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50 divide-y divide-border">
      {children}
    </div>
  );
}

export default function SettingsHub({ user }: SettingsHubProps) {
  const supabase = createClient();
  const router = useRouter();
  const { usage } = useUsageSummary();

  const [securityLabel, setSecurityLabel] = useState<string | null>(null);
  const [notificationsLabel, setNotificationsLabel] = useState<string | null>(
    null,
  );
  const [signingOut, setSigningOut] = useState(false);
  const showNotificationsLink = isNativeAppRuntime();

  useEffect(() => {
    if (!isBiometricSupported() || !isBiometricLockEnabled()) {
      setSecurityLabel(isBiometricLockEnabled() ? "On" : "Off");
      return;
    }

    void checkBiometry().then((info) => {
      if (!isBiometricLockEnabled()) {
        setSecurityLabel("Off");
        return;
      }

      if (info.isAvailable) {
        setSecurityLabel(biometryLabel(info.biometryType));
      } else {
        setSecurityLabel("On");
      }
    });
  }, []);

  useEffect(() => {
    if (!showNotificationsLink) {
      return;
    }

    setNotificationsLabel(isPushNotificationsEnabled() ? "On" : "Off");
  }, [showNotificationsLink]);

  async function handleSignOut() {
    setSigningOut(true);
    await clearBiometricSession();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const usageTrailing = usage
    ? `${usage.remaining.campaigns} left`
    : null;

  const showDevLink = process.env.NEXT_PUBLIC_ALLOW_PUSH_TEST === "true";

  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="page-content">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            {usage ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {usage.planLabel}
              </p>
            ) : null}
          </div>

          <div className="mt-8 space-y-4">
            <SettingsListGroup>
              <SettingsListRow href="/settings/account" label="Account" />
              <SettingsListRow href="/settings/brand" label="Brand library" />
              <SettingsListRow
                href="/settings/security"
                label="Security"
                value={securityLabel}
              />
              {showNotificationsLink ? (
                <SettingsListRow
                  href="/settings/notifications"
                  label="Notifications"
                  value={notificationsLabel}
                />
              ) : null}
              <SettingsListRow
                href="/settings/usage"
                label="Usage"
                value={usageTrailing}
              />
              <SettingsListRow href="/settings/about" label="About" />
              {showDevLink ? (
                <SettingsListRow href="/settings/dev" label="Push test (dev)" />
              ) : null}
            </SettingsListGroup>

            <SettingsListGroup>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className="flex w-full items-center px-4 py-3.5 text-left text-sm font-medium text-red-400 transition active:bg-secondary/40 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </SettingsListGroup>
          </div>
        </div>
      </main>
    </div>
  );
}

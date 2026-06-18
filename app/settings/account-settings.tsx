"use client";

import DeleteAccountSection from "@/app/components/delete-account-section";
import PasswordResetForm from "@/app/components/password-reset-form";
import SettingsSection from "@/app/settings/settings-section";
import { createClient } from "@/utils/supabase/client";
import { clearBiometricSession } from "@/utils/biometric-session";
import { logOutRevenueCat } from "@/utils/revenuecat";
import { isNativeAppRuntime } from "@/utils/is-native-app";
import { buildNativeOAuthRedirectUrl } from "@/utils/native-oauth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface AccountSettingsProps {
  user: User;
  showPasswordReset?: boolean;
  showSignOut?: boolean;
  variant?: "card" | "plain";
}

export default function AccountSettings({
  user,
  showPasswordReset = false,
  showSignOut = true,
  variant = "card",
}: AccountSettingsProps) {
  const supabase = createClient();
  const router = useRouter();

  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handlePasswordReset() {
    if (!user.email) {
      return;
    }

    setResetSending(true);
    setResetMessage(null);
    setResetError(null);

    const redirectTo = isNativeAppRuntime()
      ? buildNativeOAuthRedirectUrl("/settings/account?reset=1")
      : `${window.location.origin}/settings/account?reset=1`;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo,
    });

    if (error) {
      setResetError(error.message);
    } else {
      setResetMessage("Check your email for a password reset link.");
    }

    setResetSending(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await clearBiometricSession();
    await logOutRevenueCat();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const accountBody = (
    <>
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={resetSending || !user.email}
          onClick={() => void handlePasswordReset()}
          className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resetSending ? "Sending…" : "Send password reset email"}
        </button>

        {showSignOut ? (
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>

      {resetMessage && (
        <p className="mt-4 text-sm text-primary">{resetMessage}</p>
      )}

      {resetError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {resetError}
        </div>
      )}

      <div className="mt-10">
        <DeleteAccountSection />
      </div>
    </>
  );

  if (variant === "plain") {
    return (
      <div>
        {showPasswordReset ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground">
              Set a new password
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You opened a password reset link. Choose a new password to finish.
            </p>
            <div className="mt-6">
              <PasswordResetForm />
            </div>
          </div>
        ) : null}
        {accountBody}
      </div>
    );
  }

  return (
    <SettingsSection
      title="Account"
      description="Manage your sign-in and session."
    >
      {accountBody}
    </SettingsSection>
  );
}

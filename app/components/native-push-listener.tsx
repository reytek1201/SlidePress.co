"use client";

import { createClient } from "@/utils/supabase/client";
import { isNativeAppRuntime } from "@/utils/is-native-app";
import {
  dispatchPushRegistrationFailed,
  getStoredPushDeviceToken,
  isPushNotificationsEnabled,
  PUSH_PREFERENCE_CHANGED_EVENT,
  setPushNotificationsEnabled,
  setStoredPushDeviceToken,
} from "@/utils/push-preferences";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type ActionPerformed,
  type Token,
} from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

async function registerPushToken(token: string) {
  const platform = Capacitor.getPlatform();

  if (platform !== "ios" && platform !== "android") {
    return;
  }

  await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
}

async function unregisterPushToken(token: string) {
  await fetch("/api/push/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

function getCampaignIdFromNotification(
  action: ActionPerformed,
): string | null {
  const data = action.notification.data;
  const campaignId = data?.campaignId;

  return typeof campaignId === "string" && campaignId.length > 0
    ? campaignId
    : null;
}

export default function NativePushListener() {
  const router = useRouter();
  const registeredToken = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!isNativeAppRuntime()) {
      return;
    }

    let active = true;
    registeredToken.current = getStoredPushDeviceToken();

    async function teardownRegistration() {
      const token = registeredToken.current ?? getStoredPushDeviceToken();

      if (token) {
        await unregisterPushToken(token);
      }

      registeredToken.current = null;
      setStoredPushDeviceToken(null);
    }

    async function setupPushNotifications() {
      if (!isPushNotificationsEnabled()) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        return;
      }

      const permission = await PushNotifications.checkPermissions();

      if (!active) {
        return;
      }

      const receivePermission =
        permission.receive === "granted"
          ? permission
          : await PushNotifications.requestPermissions();

      if (!active || receivePermission.receive !== "granted") {
        setPushNotificationsEnabled(false);
        dispatchPushRegistrationFailed(
          receivePermission.receive === "denied" ? "denied" : "not_granted",
        );
        return;
      }

      await PushNotifications.register();
    }

    function handlePreferenceChanged() {
      if (!isPushNotificationsEnabled()) {
        void teardownRegistration();
        return;
      }

      void setupPushNotifications();
    }

    const registrationListener = PushNotifications.addListener(
      "registration",
      (token: Token) => {
        registeredToken.current = token.value;
        setStoredPushDeviceToken(token.value);
        void registerPushToken(token.value);
      },
    );

    const registrationErrorListener = PushNotifications.addListener(
      "registrationError",
      (registrationError) => {
        console.error("Push registration failed:", registrationError);
        setPushNotificationsEnabled(false);
        dispatchPushRegistrationFailed("registration_error");
      },
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const campaignId = getCampaignIdFromNotification(action);

        if (campaignId) {
          router.push(`/campaign/${campaignId}`);
        }
      },
    );

    window.addEventListener(
      PUSH_PREFERENCE_CHANGED_EVENT,
      handlePreferenceChanged,
    );

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (active && user && isPushNotificationsEnabled()) {
        void setupPushNotifications();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        void teardownRegistration();
        return;
      }

      if (isPushNotificationsEnabled()) {
        void setupPushNotifications();
      }
    });

    return () => {
      active = false;
      window.removeEventListener(
        PUSH_PREFERENCE_CHANGED_EVENT,
        handlePreferenceChanged,
      );
      void registrationListener.then((listener) => listener.remove());
      void registrationErrorListener.then((listener) => listener.remove());
      void actionListener.then((listener) => listener.remove());
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}

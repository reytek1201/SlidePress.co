import { ApnsClient, Notification, ApnsError } from "apns2";
import { getApnsConfig } from "@/utils/apns-config";
import type { PushDataPayload } from "@/utils/send-campaign-push";

export interface ApnsSendResult {
  ok: boolean;
  error?: string;
  stale?: boolean;
}

let apnsClient: ApnsClient | null = null;

function getClient(): ApnsClient | null {
  const config = getApnsConfig();

  if (!config) {
    return null;
  }

  if (!apnsClient) {
    apnsClient = new ApnsClient({
      team: config.teamId,
      keyId: config.keyId,
      signingKey: config.privateKey,
      defaultTopic: config.bundleId,
      host: config.useSandbox
        ? "api.sandbox.push.apple.com"
        : "api.push.apple.com",
    });
  }

  return apnsClient;
}

function normalizeDeviceToken(token: string): string {
  return token.replace(/[<>\s]/g, "");
}

export async function sendApnsToDevice(
  deviceToken: string,
  notification: { title: string; body: string },
  data: PushDataPayload = {},
): Promise<ApnsSendResult> {
  const client = getClient();

  if (!client) {
    return { ok: false, error: "APNs is not configured" };
  }

  const dataPayload: Record<string, string> = {};

  if (data.campaignId) {
    dataPayload.campaignId = data.campaignId;
  }

  if (data.title) {
    dataPayload.title = data.title;
  }

  try {
    const apnsNotification = new Notification(
      normalizeDeviceToken(deviceToken),
      {
        alert: {
          title: notification.title,
          body: notification.body,
        },
        sound: "default",
        data: dataPayload,
      },
    );

    await client.send(apnsNotification);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApnsError) {
      const stale =
        error.reason === "Unregistered" ||
        error.reason === "BadDeviceToken" ||
        error.statusCode === 410;

      return {
        ok: false,
        error: error.reason,
        stale,
      };
    }

    const message = error instanceof Error ? error.message : "APNs send failed";
    return { ok: false, error: message };
  }
}

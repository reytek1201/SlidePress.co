import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://www.slidepress.co";

const config: CapacitorConfig = {
  appId: "co.slidepress.app",
  appName: "SlidePress",
  webDir: "capacitor-www",
  appendUserAgent: "SlidePressApp/1",
  server: {
    url: serverUrl,
    androidScheme: "https",
  },
};

export default config;

"use client";

import { getAppVersionInfo, type AppVersionInfo } from "@/utils/app-version";
import { useEffect, useState } from "react";

export function useAppVersion() {
  const [version, setVersion] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getAppVersionInfo().then((info) => {
      if (!cancelled) {
        setVersion(info);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}

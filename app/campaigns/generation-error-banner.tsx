"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GenerationErrorBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [creditRefunded, setCreditRefunded] = useState(false);

  useEffect(() => {
    const error = searchParams.get("generation_error");

    if (!error) {
      return;
    }

    setMessage(error);
    setCreditRefunded(searchParams.get("credit_refunded") === "1");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("generation_error");
    params.delete("credit_refunded");

    const nextSearch = params.toString();
    router.replace(nextSearch ? `/campaigns?${nextSearch}` : "/campaigns");
  }, [router, searchParams]);

  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mt-6 rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100"
    >
      <p className="font-medium">Campaign generation didn&apos;t finish</p>
      <p className="mt-1 leading-6 text-amber-100/90">{message}</p>
      {creditRefunded ? (
        <p className="mt-2 leading-6 text-amber-100/80">
          Your campaign credit was restored. Try creating again when you&apos;re
          ready.
        </p>
      ) : null}
    </div>
  );
}

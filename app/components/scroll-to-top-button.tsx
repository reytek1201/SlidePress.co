"use client";

import { scrollToCampaignTop } from "@/utils/campaign-progress";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 320;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={scrollToCampaignTop}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-45 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-secondary-foreground shadow-lg transition hover:border-ring/60 hover:text-foreground md:bottom-6 md:right-6"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}

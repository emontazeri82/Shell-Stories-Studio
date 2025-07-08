
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { scroller } from "react-scroll";

export function useScrollToHighlightedProduct({ setHighlightedId }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash.startsWith("#favorite-")) return;

    const idStr = hash.replace("#favorite-", "");
    const numericId = Number(idStr);
    if (isNaN(numericId)) return;

    setHighlightedId?.(numericId);

    // Use react-scroll to scroll to the target element
    scroller.scrollTo(`favorite-${numericId}`, {
      duration: 600,
      delay: 100,
      smooth: "easeInOutQuart",
      offset: -window.innerHeight / 2 + 200 // adjust for header or visual alignment
    });
  }, [router.isReady]);
}





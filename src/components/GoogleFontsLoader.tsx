"use client";

import { useEffect } from "react";
import {
  buildGoogleFontsStylesheetUrl,
  collectGoogleFontFamilies,
} from "@/lib/layer-style";
import type { AnimationTarget } from "@/stores/timeline-store";

const LINK_ID = "gsap-editor-google-fonts";

export function GoogleFontsLoader({ targets }: { targets: AnimationTarget[] }) {
  const href = buildGoogleFontsStylesheetUrl(
    collectGoogleFontFamilies(targets.map((t) => t.style))
  );

  useEffect(() => {
    const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null;

    if (!href) {
      existing?.remove();
      return;
    }

    if (existing) {
      if (existing.href !== href) existing.href = href;
      return;
    }

    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [href]);

  return null;
}
"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AnimationTarget } from "@/stores/timeline-store";
import {
  codeLayerMarkupInner,
  DEFAULT_CODE_HTML,
  runCodeLayerScript,
} from "@/lib/code-layer";
import { layerStyleToCss } from "@/lib/layer-style";

type Props = {
  target: AnimationTarget;
};

export function CodeLayerPreview({ target }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const html = useMemo(
    () => codeLayerMarkupInner(target),
    [target.codeHtml]
  );
  const extra = layerStyleToCss(target.style, { customCss: false });

  useEffect(() => {
    const root = hostRef.current;
    if (!root) return;
    runCodeLayerScript(root, target.id, target.codeJs ?? "");
  }, [target.id, target.codeJs, html]);

  return (
    <div
      ref={hostRef}
      className="layer-code-host w-full max-w-full [&_img]:max-w-full"
      data-code-layer
      style={extra}
      dangerouslySetInnerHTML={{
        __html: html || DEFAULT_CODE_HTML,
      }}
    />
  );
}
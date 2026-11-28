"use client";

import { useCallback, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type HtmlExportPreviewOverlayProps = {
  html: string;
  initialScrollTop?: number;
  onClose: () => void;
};

type ExportPreviewWindow = Window & {
  ScrollTrigger?: { refresh: () => void; update: () => void };
  syncMasterScrollAnimation?: () => void;
  syncScrollAnimations?: () => void;
  refreshScrollPreviews?: () => void;
  __gsapMasterTl?: {
    scrollTrigger?: { progress: number };
    duration: () => number;
    time: (value?: number) => number;
  };
};

export function HtmlExportPreviewOverlay({
  html,
  initialScrollTop = 0,
  onClose,
}: HtmlExportPreviewOverlayProps) {
  const iframeSrc = useMemo(() => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [html]);

  useEffect(() => {
    return () => URL.revokeObjectURL(iframeSrc);
  }, [iframeSrc]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onIframeLoad = useCallback(
    (event: React.SyntheticEvent<HTMLIFrameElement>) => {
      const doc = event.currentTarget.contentDocument;
      const win = doc?.defaultView as ExportPreviewWindow | null;
      if (!doc || !win) return;

      const applyEditorScroll = () => {
        const scrollerEl = doc.getElementById("scroller");
        if (!scrollerEl) return false;

        win.ScrollTrigger?.refresh();
        if (initialScrollTop > 0) {
          scrollerEl.scrollTop = initialScrollTop;
        }
        win.ScrollTrigger?.refresh();
        win.ScrollTrigger?.update();
        win.syncScrollAnimations?.();
        win.syncMasterScrollAnimation?.();
        win.refreshScrollPreviews?.();
        return true;
      };

      const schedule = () => {
        applyEditorScroll();
        requestAnimationFrame(() => {
          requestAnimationFrame(applyEditorScroll);
        });
      };

      win.addEventListener("gsap-export-ready", schedule, { once: true });
      schedule();
      win.addEventListener("load", schedule, { once: true });
      const retryMs = [80, 200, 500, 1500];
      retryMs.forEach((ms) => win.setTimeout(schedule, ms));
    },
    [initialScrollTop]
  );

  return (
    <div
      className="fixed inset-0 z-[300] bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Anteprima HTML export"
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full shadow-md"
        onClick={onClose}
        aria-label="Chiudi anteprima"
      >
        <X className="h-5 w-5" />
      </Button>
      <iframe
        title="Anteprima export HTML"
        src={iframeSrc}
        className="h-full w-full border-0"
        onLoad={onIframeLoad}
      />
    </div>
  );
}
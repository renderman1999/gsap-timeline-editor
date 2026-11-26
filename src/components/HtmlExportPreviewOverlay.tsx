"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type HtmlExportPreviewOverlayProps = {
  html: string;
  onClose: () => void;
};

export function HtmlExportPreviewOverlay({
  html,
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
      />
    </div>
  );
}
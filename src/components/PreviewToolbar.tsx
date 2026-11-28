"use client";

import { useMemo, useState } from "react";
import { HtmlExportPreviewOverlay } from "@/components/HtmlExportPreviewOverlay";
import { GsapPreviewToolbar } from "@/components/GsapPreviewToolbar";
import { useTimelineStore } from "@/stores/timeline-store";
import type { HtmlPreviewPayload } from "@/lib/html-preview-payload";

export function PreviewToolbar() {
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId);
  const timelines = useTimelineStore((s) => s.timelines);
  const [htmlPreview, setHtmlPreview] = useState<HtmlPreviewPayload | null>(
    null
  );

  const activeTimeline = useMemo(
    () => timelines.find((t) => t.id === activeTimelineId) ?? null,
    [timelines, activeTimelineId]
  );

  if (!activeTimeline) return null;

  return (
    <>
      <GsapPreviewToolbar
        activeTimeline={activeTimeline}
        onPreviewHtml={setHtmlPreview}
      />

      {htmlPreview ? (
        <HtmlExportPreviewOverlay
          html={htmlPreview.html}
          initialScrollTop={htmlPreview.scrollTop}
          onClose={() => setHtmlPreview(null)}
        />
      ) : null}
    </>
  );
}
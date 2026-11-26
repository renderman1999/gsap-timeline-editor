export const TIMELINE_PERSIST_KEY = "timeline-storage";
export const TIMELINE_PANEL_HEIGHT_KEY = "gsap-editor-timeline-panel-height";

/** Rimuove dati locali dell'editor (timeline, layout pannello). */
export function clearProjectLocalCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TIMELINE_PERSIST_KEY);
  localStorage.removeItem(TIMELINE_PANEL_HEIGHT_KEY);
  const prefix = "gsap-editor-";
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}
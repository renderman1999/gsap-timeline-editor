import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { boundsClassSelector } from "@/lib/timeline-stage";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";

export const DRAGGABLE_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Draggable.min.js";
export const INERTIA_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/InertiaPlugin.min.js";

export type DraggableAxisType = "x" | "y" | "x,y" | "rotation";

export interface TargetDraggableConfig {
  enabled: boolean;
  type?: DraggableAxisType;
  /** Selettore bounds, es. ".stage" o "parent" */
  bounds?: string;
  inertia?: boolean;
}

export const DEFAULT_DRAGGABLE_CONFIG: TargetDraggableConfig = {
  enabled: false,
  type: "x,y",
  inertia: false,
};

export function registerDraggablePlugins(needsInertia: boolean): void {
  if (needsInertia) {
    gsap.registerPlugin(Draggable, InertiaPlugin);
  } else {
    gsap.registerPlugin(Draggable);
  }
}

export function isDraggableEnabled(target: AnimationTarget): boolean {
  return target.draggable?.enabled === true;
}

export function timelineUsesDraggable(timeline: Timeline): boolean {
  return timeline.targets.some((t) => isDraggableEnabled(t));
}

export function timelineUsesDraggableInertia(timeline: Timeline): boolean {
  return timeline.targets.some(
    (t) => isDraggableEnabled(t) && t.draggable?.inertia === true
  );
}

export const PREVIEW_BOUNDS_SELECTOR = "[data-preview-bounds]";

/** Valore bounds salvato sul layer (validazione sintassi; export codegen). */
export function normalizeDraggableBounds(
  bounds?: string
): string | undefined {
  const trimmed = bounds?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "parent") return "parent";
  if (trimmed === "." || trimmed === "#") return undefined;
  if (/^\.\s*$/.test(trimmed) || /^#\s*$/.test(trimmed)) return undefined;
  try {
    if (typeof document !== "undefined") {
      const hit = document.querySelector(trimmed);
      if (!hit) return undefined;
    }
  } catch {
    return undefined;
  }
  return trimmed;
}

/** Risolve bounds a un Element reale (preview): evita selettori fantasma. */
export function resolveDraggableBoundsElement(
  bounds: string | undefined,
  dragElement: HTMLElement,
  scope?: ParentNode | null
): Element | undefined {
  const trimmed = bounds?.trim();
  if (!trimmed) return undefined;

  if (trimmed === "parent") {
    return dragElement.parentElement ?? undefined;
  }

  const searchRoots: ParentNode[] = [];
  if (scope) searchRoots.push(scope);
  if (dragElement.parentElement) searchRoots.push(dragElement.parentElement);
  if (typeof document !== "undefined") searchRoots.push(document);

  for (const root of searchRoots) {
    if (!(root instanceof Document) && !(root instanceof Element)) continue;
    try {
      if (root instanceof Element && root.matches(trimmed)) {
        return root;
      }
      const el =
        root instanceof Document
          ? root.querySelector(trimmed)
          : root.querySelector(trimmed);
      if (el) return el;
    } catch {
      continue;
    }
  }

  return undefined;
}

export function buildDraggableVars(
  target: AnimationTarget
): Draggable.Vars {
  const config = target.draggable ?? DEFAULT_DRAGGABLE_CONFIG;
  const vars: Draggable.Vars = {
    type: config.type ?? "x,y",
  };
  const bounds = normalizeDraggableBounds(config.bounds);
  if (bounds) {
    vars.bounds = bounds;
  }
  if (config.inertia) {
    vars.inertia = true;
  }
  return vars;
}

export function buildDraggableVarsForPreview(
  target: AnimationTarget,
  dragElement: HTMLElement,
  scope?: Element | null,
  timeline?: Pick<Timeline, "boundsClass"> | null
): Draggable.Vars {
  const config = target.draggable ?? DEFAULT_DRAGGABLE_CONFIG;
  const vars: Draggable.Vars = {
    type: config.type ?? "x,y",
  };
  const configured = resolveDraggableBoundsElement(
    config.bounds,
    dragElement,
    scope
  );
  if (configured) {
    vars.bounds = configured;
  } else if (!config.bounds?.trim()) {
    const fromProject = timeline
      ? resolveDraggableBoundsElement(
          boundsClassSelector(timeline),
          dragElement,
          scope
        )
      : undefined;
    const fallback =
      fromProject ??
      resolveDraggableBoundsElement(
        PREVIEW_BOUNDS_SELECTOR,
        dragElement,
        scope
      );
    if (fallback) vars.bounds = fallback;
  }
  if (config.inertia) {
    vars.inertia = true;
  }
  // In editor, evita z-index 1000+ che copre i dialog (z-50).
  vars.zIndexBoost = false;
  return vars;
}

function escapeJsString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function draggableOptionsToCode(
  target: AnimationTarget,
  timeline?: Pick<Timeline, "boundsClass">
): string {
  const config = target.draggable ?? DEFAULT_DRAGGABLE_CONFIG;
  const parts: string[] = [];
  parts.push(`type: "${config.type ?? "x,y"}"`);
  const bounds =
    normalizeDraggableBounds(config.bounds) ??
    (timeline ? boundsClassSelector(timeline) : undefined);
  if (bounds) {
    if (bounds === "parent") {
      parts.push('bounds: "parent"');
    } else {
      parts.push(`bounds: "${escapeJsString(bounds)}"`);
    }
  }
  if (config.inertia) {
    parts.push("inertia: true");
  }
  return `{ ${parts.join(", ")} }`;
}

export function draggableCreateCodeLines(
  target: AnimationTarget,
  timeline?: Pick<Timeline, "boundsClass">
): string[] {
  if (!isDraggableEnabled(target)) return [];
  const selector = target.selector.trim();
  return [
    `// Draggable: ${target.name}`,
    `Draggable.create("${escapeJsString(selector)}", ${draggableOptionsToCode(target, timeline)});`,
  ];
}

export function draggableSetupCodeLines(timeline: Timeline): string[] {
  const lines: string[] = [];
  timeline.targets.forEach((target) => {
    draggableCreateCodeLines(target, timeline).forEach((line) => lines.push(line));
  });
  if (lines.length > 0) {
    lines.unshift("// Interazione drag (preview / runtime)");
  }
  return lines;
}

export function createDraggablesForPreview(
  elements: { target: AnimationTarget; element: HTMLElement }[],
  scope?: Element | null,
  timeline?: Pick<Timeline, "boundsClass"> | null
): Draggable[] {
  const created: Draggable[] = [];
  elements.forEach(({ target, element }) => {
    if (!isDraggableEnabled(target)) return;
    element.style.zIndex = "";
    let result: Draggable[] | Draggable;
    try {
      result = Draggable.create(
        element,
        buildDraggableVarsForPreview(target, element, scope, timeline)
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[GSAP] Draggable non creato per "${target.name}":`,
          error
        );
      }
      return;
    }
    if (Array.isArray(result)) {
      created.push(...result);
    } else if (result) {
      created.push(result);
    }
  });
  return created;
}

export function killDraggables(instances: Draggable[]): void {
  instances.forEach((instance) => instance.kill());
}
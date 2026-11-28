import { gsap } from "gsap";
import { CSSRulePlugin } from "gsap/CSSRulePlugin";
import { escapeJsString } from "@/lib/gsap-export-code";
import { formatPositionArg } from "@/lib/gsap-value";
import type { Keyframe, Timeline, Transform } from "@/stores/timeline-store";

export const CSS_RULE_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/CSSRulePlugin.min.js";

export function registerCssRulePlugin(): void {
  gsap.registerPlugin(CSSRulePlugin);
}

export function transformUsesCssRule(transform: Transform): boolean {
  return transform.type === "cssRule";
}

export function transformUsesCssVar(transform: Transform): boolean {
  return transform.type === "cssVar";
}

export function timelineUsesCssRule(timeline: Timeline): boolean {
  const inKeyframes = timeline.keyframes.some((k) =>
    k.transforms.some((t) => transformUsesCssRule(t))
  );
  const inInitial = Object.values(timeline.initialStates ?? {}).some((list) =>
    list?.some((t) => transformUsesCssRule(t))
  );
  return inKeyframes || inInitial;
}

export function defaultRuleSelectorForTarget(targetId: string): string {
  return `[data-preview-target="${targetId}"]::before`;
}

export function normalizeCssVarName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("--") ? trimmed : `--${trimmed}`;
}

export function applyCssVarTransformToProps(
  props: Record<string, string | number | unknown>,
  values: Record<string, number | string>
): void {
  const key = normalizeCssVarName(String(values.varName ?? ""));
  if (!key) return;
  const value = values.value;
  if (value === undefined || value === "") return;
  props[key] =
    typeof value === "number" ? value : String(value);
}

export type CssRuleTweenPayload = {
  ruleSelector: string;
  to: Record<string, string>;
  from?: Record<string, string>;
};

function cssRuleEntry(
  transform: Transform
): { selector: string; property: string; value: string } | null {
  if (transform.type !== "cssRule") return null;
  const selector = String(transform.values.ruleSelector ?? "").trim();
  const property = String(transform.values.property ?? "").trim();
  const value = String(transform.values.value ?? "");
  if (!selector || !property) return null;
  return { selector, property, value };
}

export function groupCssRuleTransforms(
  transforms: Transform[]
): CssRuleTweenPayload[] {
  const toBySelector = new Map<string, Record<string, string>>();
  transforms.forEach((t) => {
    const entry = cssRuleEntry(t);
    if (!entry) return;
    if (!toBySelector.has(entry.selector)) {
      toBySelector.set(entry.selector, {});
    }
    toBySelector.get(entry.selector)![entry.property] = entry.value;
  });
  return [...toBySelector.entries()].map(([ruleSelector, to]) => ({
    ruleSelector,
    to,
  }));
}

export function buildCssRuleFromGroups(
  transforms: Transform[],
  initialState?: Transform[]
): CssRuleTweenPayload[] {
  const groups = groupCssRuleTransforms(transforms);
  if (!initialState?.length) return groups;

  const fromBySelector = groupCssRuleTransforms(initialState);
  const fromMap = new Map(
    fromBySelector.map((g) => [g.ruleSelector, g.to] as const)
  );

  return groups.map((g) => {
    const from = fromMap.get(g.ruleSelector);
    if (!from || Object.keys(from).length === 0) return g;
    return { ...g, from };
  });
}

export function collectCssRuleStylesheet(timeline: Timeline): string {
  const bySelector = new Map<string, Map<string, string>>();

  const absorb = (transforms: Transform[]) => {
    transforms
      .filter((t) => t.type === "cssRule")
      .forEach((t) => {
        const entry = cssRuleEntry(t);
        if (!entry) return;
        if (!bySelector.has(entry.selector)) {
          bySelector.set(entry.selector, new Map());
        }
        bySelector.get(entry.selector)!.set(entry.property, entry.value);
      });
  };

  Object.values(timeline.initialStates ?? {}).forEach((list) => {
    if (list) absorb(list);
  });

  if (bySelector.size === 0 && timelineUsesCssRule(timeline)) {
    timeline.keyframes.forEach((k) => absorb(k.transforms));
  }

  const blocks: string[] = [];
  bySelector.forEach((props, selector) => {
    if (
      selector.includes("::before") &&
      !props.has("content") &&
      ![...props.keys()].some((k) => k === "content")
    ) {
      props.set("content", '""');
    }
    if (
      selector.includes("::after") &&
      !props.has("content")
    ) {
      props.set("content", '""');
    }
    const body = [...props.entries()]
      .map(([prop, val]) => `${prop}: ${val}`)
      .join("; ");
    blocks.push(`${selector} { ${body}; }`);
  });

  return blocks.join("\n");
}

export function cssRulePropsToCode(props: Record<string, string>): string {
  const inner = Object.entries(props)
    .map(([key, value]) => {
      const v = value.includes('"')
        ? `'${value.replace(/'/g, "\\'")}'`
        : `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
      return `${key}: ${v}`;
    })
    .join(", ");
  return `{ ${inner} }`;
}

export function appendCssRuleSteps(
  tl: gsap.core.Timeline,
  payloads: CssRuleTweenPayload[],
  step: {
    duration: number;
    ease: string;
    position: number | string;
    kind: "to" | "fromTo";
  }
): void {
  payloads.forEach((payload) => {
    const rule = CSSRulePlugin.getRule(payload.ruleSelector);
    if (!rule) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[GSAP] CSSRule non trovata per selettore: ${payload.ruleSelector}`
        );
      }
      return;
    }
    const baseVars = {
      duration: step.duration,
      ease: step.ease,
    };
    if (
      step.kind === "fromTo" &&
      payload.from &&
      Object.keys(payload.from).length > 0
    ) {
      tl.fromTo(
        rule,
        { cssRule: payload.from },
        { cssRule: payload.to, ...baseVars },
        step.position
      );
    } else {
      tl.to(rule, { cssRule: payload.to, ...baseVars }, step.position);
    }
  });
}

export function cssRuleStepsToCodeLines(
  payloads: CssRuleTweenPayload[],
  step: {
    duration: number;
    ease: string;
    position: number | string;
    kind: "to" | "fromTo";
  }
): string[] {
  return payloads.map((payload) => {
    const ruleExpr = `CSSRulePlugin.getRule("${payload.ruleSelector.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
    const toCss = `cssRule: ${cssRulePropsToCode(payload.to)}`;
    const vars = `{ ${toCss}, duration: ${step.duration}, ease: "${escapeJsString(step.ease)}" }`;
    if (
      step.kind === "fromTo" &&
      payload.from &&
      Object.keys(payload.from).length > 0
    ) {
      const fromCss = `cssRule: ${cssRulePropsToCode(payload.from)}`;
      return `tl.fromTo(${ruleExpr}, { ${fromCss} }, ${vars}, ${formatPositionArg(step.position)});`;
    }
    return `tl.to(${ruleExpr}, ${vars}, ${formatPositionArg(step.position)});`;
  });
}
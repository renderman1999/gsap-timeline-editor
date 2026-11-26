"use client";

import { useState } from "react";
import { ColorField } from "@/components/ColorField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCssVarCustomCssSnippet,
  CSS_VAR_LINK_OPTIONS,
  isLikelyColorValue,
  mergeCustomCssBlock,
  type CssVarLinkTarget,
} from "@/lib/css-var-link";
import {
  defaultRuleSelectorForTarget,
  normalizeCssVarName,
} from "@/lib/gsap-css-rule";
import { useTimelineStore } from "@/stores/timeline-store";
import { toast } from "react-toastify";
import type { Transform } from "@/stores/timeline-store";

type Props = {
  transform: Transform;
  targetId?: string;
  onUpdate: (values: Record<string, number | string>) => void;
};

type CssVarValueKind = "color" | "length" | "text";

export function CssVarTransformFields({
  transform,
  targetId,
  onUpdate,
}: Props) {
  const { getActiveTimeline, updateTarget } = useTimelineStore();
  const varName = (transform.values.varName as string) ?? "--myColor";
  const value = String(transform.values.value ?? "");
  const storedKind = transform.values.valueKind as CssVarValueKind | undefined;
  const valueKind: CssVarValueKind =
    storedKind ??
    (isLikelyColorValue(value) ? "color" : "text");

  const [linkTargets, setLinkTargets] = useState<CssVarLinkTarget[]>([
    "color",
  ]);

  const toggleLink = (id: CssVarLinkTarget, checked: boolean) => {
    setLinkTargets((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
    );
  };

  const applyLinkToLayer = () => {
    const timeline = getActiveTimeline();
    if (!timeline || !targetId) {
      toast.error("Seleziona un layer attivo.");
      return;
    }
    const target = timeline.targets.find((t) => t.id === targetId);
    if (!target) return;
    const name = normalizeCssVarName(varName);
    if (!name) {
      toast.error("Nome variabile non valido.");
      return;
    }
    if (linkTargets.length === 0) {
      toast.error("Seleziona almeno un utilizzo (testo, bordo, …).");
      return;
    }
    const snippet = buildCssVarCustomCssSnippet(
      name,
      value || "#00bae2",
      linkTargets
    );
    const customCss = mergeCustomCssBlock(target.style?.customCss, snippet);
    updateTarget(timeline.id, targetId, {
      style: { ...target.style, customCss },
    });
    toast.success(
      "CSS personalizzato aggiornato. La variabile si anima sul wrapper del layer e si eredita sul testo/stili collegati."
    );
  };

  const previewSnippet = buildCssVarCustomCssSnippet(
    normalizeCssVarName(varName) || "--myColor",
    value || "#00bae2",
    linkTargets.length ? linkTargets : ["color"]
  );

  return (
    <div className="flex flex-col gap-2 min-w-0 flex-1">
      <div className="space-y-1">
        <Label className="text-xxs">Variabile CSS</Label>
        <Input
          className="h-8 text-xs font-mono"
          value={varName}
          placeholder="--myColor"
          onChange={(e) =>
            onUpdate({ ...transform.values, varName: e.target.value })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xxs">Tipo valore</Label>
        <Select
          value={valueKind}
          onValueChange={(kind: CssVarValueKind) =>
            onUpdate({ ...transform.values, valueKind: kind })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Colore</SelectItem>
            <SelectItem value="length">Numero + unità</SelectItem>
            <SelectItem value="text">Testo libero</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {valueKind === "color" ? (
        <ColorField
          label="Valore colore"
          value={value}
          placeholder="#00bae2"
          withAlpha
          onChange={(next) =>
            onUpdate({ ...transform.values, value: next, valueKind: "color" })
          }
        />
      ) : (
        <div className="space-y-1">
          <Label className="text-xxs">Valore</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={value}
            placeholder={valueKind === "length" ? "24px" : "valore"}
            onChange={(e) =>
              onUpdate({
                ...transform.values,
                value: e.target.value,
                valueKind,
              })
            }
          />
        </div>
      )}

      <div className="space-y-1.5 rounded-md border border-border/80 p-2">
        <Label className="text-xxs text-muted-foreground">
          Collega la variabile a (stile layer)
        </Label>
        <div className="flex flex-col gap-1.5">
          {CSS_VAR_LINK_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border border-border"
                checked={linkTargets.includes(opt.id)}
                onChange={(e) => toggleLink(opt.id, e.target.checked)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <pre className="text-xxs text-muted-foreground whitespace-pre-wrap break-all font-mono bg-muted/40 rounded p-1.5">
          {previewSnippet}
        </pre>
        {targetId ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-xs w-full"
            onClick={applyLinkToLayer}
          >
            Applica al CSS personalizzato del layer
          </Button>
        ) : null}
      </div>

      <p className="text-xxs text-muted-foreground leading-relaxed">
        GSAP anima la variabile sul contenitore del layer in preview. Nel CSS usa
        solo <code className="font-mono">color: var(--nome)</code> (senza
        ridefinire <code className="font-mono">--nome</code> sullo stesso
        elemento), così il valore animato si eredita. Per bordo/sfondo vale lo
        stesso con <code className="font-mono">border-color</code>,{" "}
        <code className="font-mono">background-color</code>, ecc.
      </p>
    </div>
  );
}

export function CssRuleTransformFields({
  transform,
  targetId,
  onUpdate,
}: Props) {
  const ruleSelector =
    (transform.values.ruleSelector as string) ??
    (targetId ? defaultRuleSelectorForTarget(targetId) : "");

  return (
    <div className="flex flex-col gap-2 min-w-0 flex-1">
      <div className="space-y-1">
        <Label className="text-xxs">Selettore regola CSS</Label>
        <Input
          className="h-8 text-xs font-mono"
          value={ruleSelector}
          placeholder=".classe::before"
          onChange={(e) =>
            onUpdate({ ...transform.values, ruleSelector: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xxs">Proprietà</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={(transform.values.property as string) ?? "color"}
            placeholder="color"
            onChange={(e) =>
              onUpdate({ ...transform.values, property: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xxs">Valore</Label>
          <Input
            className="h-8 text-xs font-mono"
            value={String(transform.values.value ?? "")}
            placeholder="#0ae448"
            onChange={(e) =>
              onUpdate({ ...transform.values, value: e.target.value })
            }
          />
        </div>
      </div>
      <p className="text-xxs text-muted-foreground">
        Per ::before/::after imposta anche content nello stato iniziale. Le
        regole compaiono nel foglio stile di preview/export.
      </p>
    </div>
  );
}
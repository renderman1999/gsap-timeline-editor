"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EasePluginKind,
  KeyframeEaseExtra,
  KeyframeStagger,
  OverwriteMode,
  StaggerFrom,
} from "@/stores/timeline-store";

export type KeyframeGsapOptionValues = {
  position?: string;
  repeat?: number;
  yoyo?: boolean;
  repeatDelay?: number;
  yoyoEase?: string;
  overwrite?: OverwriteMode;
  immediateRender?: boolean;
  clearProps?: string;
  startAt?: string;
  onStart?: string;
  onUpdate?: string;
  onComplete?: string;
  onRepeat?: string;
  onReverseComplete?: string;
  staggerConfig?: KeyframeStagger;
  easeExtra?: KeyframeEaseExtra;
};

type Props = {
  values: KeyframeGsapOptionValues;
  easingOrder: string;
  labelNames?: string[];
  onChange: (partial: KeyframeGsapOptionValues) => void;
};

function optionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

export function KeyframeGsapOptions({
  values,
  easingOrder,
  labelNames,
  onChange,
}: Props) {
  const extra = values.easeExtra ?? {};
  const stagger = values.staggerConfig ?? {};
  const setExtra = (partial: Partial<KeyframeEaseExtra>) =>
    onChange({ easeExtra: { ...extra, ...partial } });
  const setStagger = (partial: Partial<KeyframeStagger>) =>
    onChange({ staggerConfig: { ...stagger, ...partial } });
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        className="flex w-full items-center gap-1 px-3 py-2 text-left text-xs font-medium"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        Opzioni tween GSAP
      </button>
      {open ? (
      <div className="space-y-3 px-3 pb-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Position GSAP</Label>
          <Input
            className="h-8 text-xs"
            value={values.position ?? ""}
            placeholder="+=0.5, <, >, label"
            list="timeline-gsap-labels"
            onChange={(event) =>
              onChange({ position: event.target.value || undefined })
            }
          />
          <datalist id="timeline-gsap-labels">
            {(labelNames ?? []).map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Repeat</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            step="1"
            value={values.repeat ?? ""}
            placeholder="0, -1"
            onChange={(event) =>
              onChange({ repeat: optionalNumber(event.target.value) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Repeat delay, s</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            step="0.01"
            min="0"
            value={values.repeatDelay ?? ""}
            onChange={(event) =>
              onChange({ repeatDelay: optionalNumber(event.target.value) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Yoyo ease</Label>
          <Input
            className="h-8 text-xs"
            value={values.yoyoEase ?? ""}
            placeholder="power2.in"
            onChange={(event) =>
              onChange({ yoyoEase: event.target.value || undefined })
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={Boolean(values.yoyo)}
            onCheckedChange={(checked) => onChange({ yoyo: checked })}
          />
          Yoyo
        </label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Overwrite</Label>
          <Select
            value={values.overwrite ?? "default"}
            onValueChange={(value) =>
              onChange({
                overwrite:
                  value === "default" ? undefined : (value as OverwriteMode),
              })
            }
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="false">false</SelectItem>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="auto">auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">immediateRender</Label>
          <Select
            value={
              values.immediateRender == null
                ? "default"
                : values.immediateRender
                  ? "true"
                  : "false"
            }
            onValueChange={(value) =>
              onChange({
                immediateRender:
                  value === "default" ? undefined : value === "true",
              })
            }
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">clearProps</Label>
          <Input
            className="h-8 text-xs"
            value={values.clearProps ?? ""}
            placeholder="all oppure x,opacity"
            onChange={(event) =>
              onChange({ clearProps: event.target.value || undefined })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">startAt</Label>
          <Input
            className="h-8 text-xs"
            value={values.startAt ?? ""}
            placeholder="x: 0, opacity: 0"
            onChange={(event) =>
              onChange({ startAt: event.target.value || undefined })
            }
          />
        </div>
      </div>

      {easingOrder === "back" || easingOrder === "elastic" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">
              {easingOrder === "back" ? "Overshoot" : "Amplitude"}
            </Label>
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.param ?? ""}
              placeholder={easingOrder === "back" ? "1.7" : "1"}
              onChange={(event) =>
                setExtra({ param: optionalNumber(event.target.value) })
              }
            />
          </div>
          {easingOrder === "elastic" ? (
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                step="0.1"
                value={extra.param2 ?? ""}
                placeholder="0.3"
                onChange={(event) =>
                  setExtra({ param2: optionalNumber(event.target.value) })
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs">Ease plugin</Label>
        <Select
          value={extra.plugin ?? "none"}
          onValueChange={(value) =>
            setExtra({
              plugin: value === "none" ? undefined : (value as EasePluginKind),
            })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ease standard</SelectItem>
            <SelectItem value="steps">steps</SelectItem>
            <SelectItem value="rough">rough</SelectItem>
            <SelectItem value="slow">slow</SelectItem>
            <SelectItem value="expoScale">expoScale</SelectItem>
            <SelectItem value="custom">CustomEase</SelectItem>
            <SelectItem value="wiggle">CustomWiggle</SelectItem>
            <SelectItem value="customBounce">CustomBounce</SelectItem>
          </SelectContent>
        </Select>
        {extra.plugin === "steps" ? (
          <Input
            className="h-8 text-xs"
            type="number"
            min="1"
            value={extra.steps ?? 5}
            onChange={(event) =>
              setExtra({ steps: optionalNumber(event.target.value) })
            }
          />
        ) : null}
        {extra.plugin === "rough" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.strength ?? 1}
              placeholder="strength"
              onChange={(event) =>
                setExtra({ strength: optionalNumber(event.target.value) })
              }
            />
            <Input
              className="h-8 text-xs"
              type="number"
              value={extra.points ?? 20}
              placeholder="points"
              onChange={(event) =>
                setExtra({ points: optionalNumber(event.target.value) })
              }
            />
          </div>
        ) : null}
        {extra.plugin === "slow" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.linearRatio ?? 0.7}
              placeholder="linearRatio"
              onChange={(event) =>
                setExtra({ linearRatio: optionalNumber(event.target.value) })
              }
            />
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.power ?? 0.7}
              placeholder="power"
              onChange={(event) =>
                setExtra({ power: optionalNumber(event.target.value) })
              }
            />
          </div>
        ) : null}
        {extra.plugin === "expoScale" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.expoStart ?? 1}
              placeholder="start"
              onChange={(event) =>
                setExtra({ expoStart: optionalNumber(event.target.value) })
              }
            />
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.expoEnd ?? 2}
              placeholder="end"
              onChange={(event) =>
                setExtra({ expoEnd: optionalNumber(event.target.value) })
              }
            />
          </div>
        ) : null}
        {extra.plugin === "custom" ? (
          <Textarea
            className="text-xs min-h-16"
            value={extra.curve ?? ""}
            placeholder=".17,.67,.83,.67 oppure path SVG M0,0 C..."
            onChange={(event) => setExtra({ curve: event.target.value })}
          />
        ) : null}
        {extra.plugin === "wiggle" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs"
              type="number"
              min="1"
              value={extra.wiggles ?? 6}
              onChange={(event) =>
                setExtra({ wiggles: optionalNumber(event.target.value) })
              }
            />
            <Select
              value={extra.wiggleType ?? "easeOut"}
              onValueChange={(value) =>
                setExtra({
                  wiggleType: value as KeyframeEaseExtra["wiggleType"],
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easeOut">easeOut</SelectItem>
                <SelectItem value="easeInOut">easeInOut</SelectItem>
                <SelectItem value="anticipate">anticipate</SelectItem>
                <SelectItem value="uniform">uniform</SelectItem>
                <SelectItem value="random">random</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {extra.plugin === "customBounce" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.strength ?? 0.7}
              placeholder="strength"
              onChange={(event) =>
                setExtra({ strength: optionalNumber(event.target.value) })
              }
            />
            <Input
              className="h-8 text-xs"
              type="number"
              step="0.1"
              value={extra.squash ?? 1}
              placeholder="squash"
              onChange={(event) =>
                setExtra({ squash: optionalNumber(event.target.value) })
              }
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Stagger avanzato</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            className="h-8 text-xs"
            type="number"
            step="0.01"
            value={stagger.amount ?? ""}
            placeholder="amount"
            onChange={(event) =>
              setStagger({ amount: optionalNumber(event.target.value) })
            }
          />
          <Select
            value={stagger.from ?? "start"}
            onValueChange={(value) =>
              setStagger({
                from: value === "start" ? undefined : (value as StaggerFrom),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">from start</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="edges">edges</SelectItem>
              <SelectItem value="random">random</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-xs"
            value={stagger.grid ?? ""}
            placeholder="grid auto oppure 3,4"
            onChange={(event) =>
              setStagger({ grid: event.target.value || undefined })
            }
          />
          <Input
            className="h-8 text-xs"
            value={stagger.ease ?? ""}
            placeholder="ease stagger"
            onChange={(event) =>
              setStagger({ ease: event.target.value || undefined })
            }
          />
        </div>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Callback
        </summary>
        <div className="space-y-2 pt-2">
          {(
            [
              "onStart",
              "onUpdate",
              "onComplete",
              "onRepeat",
              "onReverseComplete",
            ] as const
          ).map((key) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{key}</Label>
              <Textarea
                className="min-h-14 text-xs font-mono"
                value={values[key] ?? ""}
                placeholder="console.log(this)"
                onChange={(event) =>
                  onChange({ [key]: event.target.value || undefined })
                }
              />
            </div>
          ))}
        </div>
      </details>
      <p className="text-[11px] text-muted-foreground">
        Nei valori puoi scrivere un numero, +=20, -=10, *=2, /=2 oppure una
        funzione (i) =&gt; i * 40.
      </p>
      </div>
      ) : null}
    </div>
  );
}

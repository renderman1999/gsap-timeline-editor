"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  combineEasing,
  EASING_ORDERS,
  EASING_TYPES,
  parseEasing,
} from "@/constants/easings";
import {
  MODEL3D_HIT_LABELS,
  MODEL3D_INTERACTION_KIND_LABELS,
  MODEL3D_TRIGGER_LABELS,
  newModel3dInteractionRule,
  normalizeModel3dInteraction,
  type Model3dInteractionConfig,
  type Model3dInteractionKind,
  type Model3dInteractionRule,
} from "@/lib/model3d-interaction";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: Model3dInteractionConfig | null;
  meshNames?: string[];
  onChange: (next: Model3dInteractionConfig) => void;
};

function RuleEditor({
  rule,
  meshNames,
  onPatch,
  onRemove,
}: {
  rule: Model3dInteractionRule;
  meshNames: string[];
  onPatch: (patch: Partial<Model3dInteractionRule>) => void;
  onRemove: () => void;
}) {
  const { order, type } = parseEasing(rule.ease);
  const amountLabel =
    rule.kind === "moveRelative"
      ? "Distanza"
      : rule.kind.startsWith("scale")
        ? "Scala"
        : "Gradi";

  return (
    <div className="rounded-md border border-border/80 p-2 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <Switch
          checked={rule.enabled}
          onCheckedChange={(enabled) => onPatch({ enabled })}
        />
        <Input
          className="h-7 text-xxs flex-1"
          value={rule.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Trigger</Label>
          <Select
            value={rule.trigger}
            onValueChange={(trigger: Model3dInteractionRule["trigger"]) =>
              onPatch({ trigger })
            }
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(MODEL3D_TRIGGER_LABELS) as [
                  Model3dInteractionRule["trigger"],
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Area</Label>
          <Select
            value={rule.hit}
            onValueChange={(hit: Model3dInteractionRule["hit"]) =>
              onPatch({ hit })
            }
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(MODEL3D_HIT_LABELS) as [
                  Model3dInteractionRule["hit"],
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {rule.hit === "model" && meshNames.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">
            Mesh (opzionale)
          </Label>
          <Select
            value={rule.meshName?.trim() || "__any__"}
            onValueChange={(v) =>
              onPatch({ meshName: v === "__any__" ? undefined : v })
            }
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue placeholder="Qualsiasi mesh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Qualsiasi mesh</SelectItem>
              {meshNames.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Azione</Label>
          <Select
            value={rule.kind}
            onValueChange={(kind: Model3dInteractionKind) => onPatch({ kind })}
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(MODEL3D_INTERACTION_KIND_LABELS) as [
                  Model3dInteractionKind,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Asse</Label>
          <Select
            value={rule.axis}
            onValueChange={(axis: Model3dInteractionRule["axis"]) =>
              onPatch({ axis })
            }
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="x">X</SelectItem>
              <SelectItem value="y">Y</SelectItem>
              <SelectItem value="z">Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">
            {amountLabel}
          </Label>
          <Input
            type="number"
            step={rule.kind.startsWith("rotate") ? 1 : 0.05}
            className="h-7 text-xxs"
            value={rule.amount}
            onChange={(e) =>
              onPatch({ amount: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Durata (s)</Label>
          <Input
            type="number"
            step={0.05}
            min={0.05}
            className="h-7 text-xxs"
            value={rule.duration}
            onChange={(e) =>
              onPatch({ duration: parseFloat(e.target.value) || 0.1 })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Easing</Label>
          <div className="flex gap-1">
            <Select
              value={order}
              onValueChange={(o) => onPatch({ ease: combineEasing(o, type) })}
            >
              <SelectTrigger className="h-7 text-xxs px-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASING_ORDERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={type}
              disabled={order === "none"}
              onValueChange={(t) => onPatch({ ease: combineEasing(order, t) })}
            >
              <SelectTrigger className="h-7 text-xxs px-1.5 w-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Model3dInteractionDialog({
  open,
  onOpenChange,
  config,
  meshNames = [],
  onChange,
}: Props) {
  const normalized = useMemo(
    () => normalizeModel3dInteraction(config),
    [config]
  );

  const patch = (partial: Partial<Model3dInteractionConfig>) =>
    onChange({ ...normalized, ...partial });

  const patchRule = (id: string, partial: Partial<Model3dInteractionRule>) => {
    patch({
      rules: normalized.rules.map((r) =>
        r.id === id ? { ...r, ...partial } : r
      ),
    });
  };

  const removeRule = (id: string) => {
    patch({ rules: normalized.rules.filter((r) => r.id !== id) });
  };

  const addRule = () => {
    patch({
      rules: [
        ...normalized.rules,
        newModel3dInteractionRule({
          name: `Interazione ${normalized.rules.length + 1}`,
        }),
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interazioni modello 3D</DialogTitle>
          <DialogDescription>
            Collega click o hover sul viewport al root animato da GSAP (rotazione,
            scala, spostamento). Vale in preview e export HTML.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2">
          <Label className="text-xxs">Interazioni attive</Label>
          <Switch
            checked={normalized.enabled}
            onCheckedChange={(enabled) => patch({ enabled })}
          />
        </div>

        <div className="space-y-2">
          {normalized.rules.length === 0 ? (
            <p className="text-xxs text-muted-foreground">
              Nessuna regola. Aggiungine una per iniziare.
            </p>
          ) : (
            normalized.rules.map((rule) => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                meshNames={meshNames}
                onPatch={(p) => patchRule(rule.id, p)}
                onRemove={() => removeRule(rule.id)}
              />
            ))
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-xxs gap-1"
          onClick={addRule}
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi regola
        </Button>

        <DialogFooter>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Model3dInteractionTriggerButton({
  config,
  meshNames,
  onChange,
}: {
  config?: Model3dInteractionConfig | null;
  meshNames?: string[];
  onChange: (next: Model3dInteractionConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => {
    const n = normalizeModel3dInteraction(config);
    if (!n.enabled) return "off";
    const active = n.rules.filter((r) => r.enabled).length;
    return `${active} regola${active === 1 ? "" : "e"}`;
  }, [config]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xxs w-full gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Zap className="h-3.5 w-3.5" />
        Interazione
        <span className="text-muted-foreground ml-auto tabular-nums">
          {summary}
        </span>
      </Button>
      <Model3dInteractionDialog
        open={open}
        onOpenChange={setOpen}
        config={config}
        meshNames={meshNames}
        onChange={onChange}
      />
    </>
  );
}
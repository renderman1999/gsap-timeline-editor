"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  codeHtml: string | undefined;
  codeJs: string | undefined;
  onHtmlChange: (codeHtml: string) => void;
  onJsChange: (codeJs: string) => void;
};

export function CodeLayerFields({
  codeHtml,
  codeJs,
  onHtmlChange,
  onJsChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xxs text-muted-foreground">HTML</Label>
        <Textarea
          className="min-h-[120px] font-mono text-xs leading-relaxed"
          value={codeHtml ?? ""}
          placeholder="<div>...</div>"
          spellCheck={false}
          onChange={(e) => onHtmlChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xxs text-muted-foreground">
          JavaScript (opzionale)
        </Label>
        <p className="text-xxs text-muted-foreground leading-snug">
          Variabili: <span className="font-mono">root</span>,{" "}
          <span className="font-mono">layerId</span>. Eseguito in anteprima e
          nell&apos;export HTML.
        </p>
        <Textarea
          className="min-h-[100px] font-mono text-xs leading-relaxed"
          value={codeJs ?? ""}
          placeholder="// root.querySelector('button')?.addEventListener(...)"
          spellCheck={false}
          onChange={(e) => onJsChange(e.target.value)}
        />
      </div>
    </div>
  );
}
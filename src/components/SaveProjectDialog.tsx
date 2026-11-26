"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultProjectFilename,
  downloadProjectFile,
  saveProjectWithPicker,
} from "@/lib/project-file";
import { toast } from "react-toastify";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelines: Parameters<typeof downloadProjectFile>[0];
  activeTimelineId: string | null;
};

export function SaveProjectDialog({
  open,
  onOpenChange,
  timelines,
  activeTimelineId,
}: Props) {
  const [filename, setFilename] = useState(defaultProjectFilename);

  useEffect(() => {
    if (open) setFilename(defaultProjectFilename());
  }, [open]);

  const handleSave = async () => {
    const name = filename.trim() || defaultProjectFilename();
    try {
      const usedPicker = await saveProjectWithPicker(
        timelines,
        activeTimelineId,
        name
      );
      if (usedPicker) {
        toast.success("Progetto salvato nella posizione scelta.");
        onOpenChange(false);
        return;
      }
      downloadProjectFile(timelines, activeTimelineId, name);
      toast.info(
        "File scaricato. Per scegliere la cartella ogni volta: impostazioni download di Edge → chiedi dove salvare."
      );
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Salvataggio non riuscito";
      if (message === "Salvataggio annullato") return;
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle>Salva progetto</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="save-project-filename">Nome file</Label>
          <Input
            id="save-project-filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
          <p className="text-xxs text-muted-foreground leading-snug">
            Su Edge/Linux compare il dialog &quot;Salva con nome&quot; se il
            browser lo supporta. Altrimenti il file va nella cartella Download
            (o dove hai impostato &quot;Chiedi dove salvare&quot;).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={() => void handleSave()}>Salva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
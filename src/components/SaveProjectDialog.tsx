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
import type { ProjectFileHandle } from "@/lib/project-file-source";
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
  defaultFilename?: string | null;
  onSaved?: (result: {
    mode: "handle" | "picker" | "download";
    handle: ProjectFileHandle | null;
    filename: string;
  }) => void;
};

export function SaveProjectDialog({
  open,
  onOpenChange,
  timelines,
  activeTimelineId,
  defaultFilename,
  onSaved,
}: Props) {
  const [filename, setFilename] = useState(defaultProjectFilename);

  useEffect(() => {
    if (open) {
      setFilename(
        defaultFilename?.trim() || defaultProjectFilename()
      );
    }
  }, [open, defaultFilename]);

  const handleSave = async () => {
    const name = filename.trim() || defaultProjectFilename();
    try {
      const pickerResult = await saveProjectWithPicker(
        timelines,
        activeTimelineId,
        name
      );
      if (pickerResult.usedPicker && pickerResult.handle) {
        toast.success("Progetto salvato nella posizione scelta.");
        onSaved?.({
          mode: "picker",
          handle: pickerResult.handle,
          filename: pickerResult.filename,
        });
        onOpenChange(false);
        return;
      }
      downloadProjectFile(timelines, activeTimelineId, name);
      toast.info(
        "File scaricato. Per salvare sullo stesso file: Apri progetto con il selettore del browser (Chrome/Edge)."
      );
      onSaved?.({ mode: "download", handle: null, filename: name });
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
            Dopo &quot;Apri progetto&quot; con Chrome/Edge, il comando Salva
            progetto sovrascrive il file senza questo dialog. Qui: Salva con
            nome o download.
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
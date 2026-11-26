"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearProjectLocalCache,
  TIMELINE_PANEL_HEIGHT_KEY,
  TIMELINE_PERSIST_KEY,
} from "@/lib/project-storage";
import { useTimelineStore } from "@/stores/timeline-store";
import { toast } from "react-toastify";

export function ProjectCacheDialog() {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    if (
      !window.confirm(
        "Eliminare la cache locale? Le timeline salvate nel browser andranno perse (se non hai un backup JSON)."
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      clearProjectLocalCache();
      useTimelineStore.persist.clearStorage();
      toast.success("Cache eliminata. Ricarico l'editor…");
      window.setTimeout(() => window.location.reload(), 400);
    } catch {
      setResetting(false);
      toast.error("Reset cache non riuscito");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        title="Cache locale progetto"
        aria-label="Cache locale progetto"
        onClick={() => setOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cache locale</DialogTitle>
            <DialogDescription>
              I progetti sono salvati nel browser. Da qui puoi azzerare i dati
              locali e ripartire con una timeline vuota (utile se qualcosa è
              corrotto o vuoi uno stato pulito).
            </DialogDescription>
          </DialogHeader>

          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>
              Timeline e impostazioni (
              <span className="font-mono text-xxs">{TIMELINE_PERSIST_KEY}</span>
              )
            </li>
            <li>
              Altezza pannello timeline (
              <span className="font-mono text-xxs">
                {TIMELINE_PANEL_HEIGHT_KEY}
              </span>
              )
            </li>
          </ul>

          <p className="text-xxs text-muted-foreground">
            Prima di resettare, esporta un file JSON da Progetto → Salva se ti
            serve un backup.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={resetting}
            >
              Chiudi
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? "Reset…" : "Elimina cache e ricomincia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
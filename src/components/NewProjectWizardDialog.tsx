"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { newTimelinePatchForEditorMode } from "@/lib/timeline-editor-mode";
import { useTimelineStore } from "@/stores/timeline-store";

export function NewProjectWizardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addTimeline, generateUniqueTimelineName } = useTimelineStore();
  const [name, setName] = useState("");
  const [playbackType, setPlaybackType] = useState<"normal" | "scroll">("normal");
  const [scrollLength, setScrollLength] = useState(300);
  const [loop, setLoop] = useState(false);
  const [yoyo, setYoyo] = useState(false);

  useEffect(() => {
    if (open) {
      setName(generateUniqueTimelineName("New Animation"));
    }
  }, [open, generateUniqueTimelineName]);

  const reset = () => {
    setName("");
    setPlaybackType("normal");
    setScrollLength(300);
    setLoop(false);
    setYoyo(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = () => {
    const patch = newTimelinePatchForEditorMode("gsap", {
      name: name.trim() || undefined,
      playbackType,
      scrollLength,
      loop,
      yoyo,
    });
    addTimeline(patch);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[440px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Nuovo progetto GSAP</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-project-name">Nome</Label>
            <Input
              id="wizard-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Playback</Label>
            <Select
              value={playbackType}
              onValueChange={(v: "normal" | "scroll") => setPlaybackType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="scroll">Scroll</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {playbackType === "scroll" ? (
            <div className="space-y-1.5">
              <Label htmlFor="wizard-scroll-length">Scroll length (%)</Label>
              <Input
                id="wizard-scroll-length"
                type="number"
                value={scrollLength}
                onChange={(e) =>
                  setScrollLength(parseInt(e.target.value, 10) || 300)
                }
              />
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Switch id="wizard-loop" checked={loop} onCheckedChange={setLoop} />
            <Label htmlFor="wizard-loop">Loop</Label>
          </div>
          {loop ? (
            <div className="ml-6 flex items-center gap-2">
              <Switch id="wizard-yoyo" checked={yoyo} onCheckedChange={setYoyo} />
              <Label htmlFor="wizard-yoyo">Yo-yo</Label>
            </div>
          ) : null}

          <Button type="button" className="w-full" onClick={handleCreate}>
            Crea progetto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
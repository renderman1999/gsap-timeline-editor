"use client";

import { useRef, useState } from "react";
import { ChevronDown, FolderOpen, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveProjectDialog } from "@/components/SaveProjectDialog";
import { parseProjectFile } from "@/lib/project-file";
import { toast } from "react-toastify";
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
import { useTimelineStore } from "@/stores/timeline-store";

export function NewProjectMenu() {
  const {
    addTimeline,
    generateUniqueTimelineName,
    timelines,
    activeTimelineId,
    loadProject,
  } = useTimelineStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTimelineForm, setNewTimelineForm] = useState({
    name: "",
    playbackType: "normal" as "normal" | "scroll",
    scrollLength: 300,
    loop: false,
    yoyo: false,
  });

  const handleAddTimeline = () => {
    const name =
      newTimelineForm.name || generateUniqueTimelineName("New Animation");

    addTimeline({
      name,
      playbackType: newTimelineForm.playbackType,
      scrollLength:
        newTimelineForm.playbackType === "scroll"
          ? newTimelineForm.scrollLength
          : undefined,
      loop: newTimelineForm.loop,
      yoyo: newTimelineForm.yoyo,
      keyframes: [],
    });

    setNewTimelineForm({
      name: "",
      playbackType: "normal",
      scrollLength: 300,
      loop: false,
      yoyo: false,
    });
    setIsAddDialogOpen(false);
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = parseProjectFile(content);

        const replace = window.confirm(
          "Aprire questo progetto? Le timeline attualmente aperte verranno sostituite."
        );
        if (!replace) return;

        loadProject({
          timelines: project.timelines,
          activeTimelineId: project.activeTimelineId,
        });
        toast.success(
          `Progetto aperto (${project.timelines.length} timeline).`
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Apertura non riuscita"
        );
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs shrink-0"
          >
            Progetto
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onSelect={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Crea progetto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsSaveDialogOpen(true)}>
            <Save className="h-4 w-4" />
            Salva progetto
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenFile}>
            <FolderOpen className="h-4 w-4" />
            Apri progetto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json,.gsap-project.json"
        onChange={handleFileChange}
        className="hidden"
      />

      <SaveProjectDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        timelines={timelines}
        activeTimelineId={activeTimelineId}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>Nuovo progetto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                id="new-project-name"
                value={newTimelineForm.name || "New Animation"}
                onChange={(e) =>
                  setNewTimelineForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="new-project-playback">Playback</Label>
              <Select
                value={newTimelineForm.playbackType}
                onValueChange={(value: "normal" | "scroll") =>
                  setNewTimelineForm((prev) => ({
                    ...prev,
                    playbackType: value,
                  }))
                }
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

            {newTimelineForm.playbackType === "scroll" && (
              <div>
                <Label htmlFor="new-project-scroll-length">Scroll length (%)</Label>
                <Input
                  id="new-project-scroll-length"
                  type="number"
                  value={newTimelineForm.scrollLength}
                  onChange={(e) =>
                    setNewTimelineForm((prev) => ({
                      ...prev,
                      scrollLength: parseInt(e.target.value, 10) || 300,
                    }))
                  }
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="new-project-loop"
                checked={newTimelineForm.loop}
                onCheckedChange={(checked) =>
                  setNewTimelineForm((prev) => ({ ...prev, loop: checked }))
                }
              />
              <Label htmlFor="new-project-loop">Loop</Label>
            </div>

            {newTimelineForm.loop && (
              <div className="flex items-center space-x-2 ml-6">
                <Switch
                  id="new-project-yoyo"
                  checked={newTimelineForm.yoyo}
                  onCheckedChange={(checked) =>
                    setNewTimelineForm((prev) => ({ ...prev, yoyo: checked }))
                  }
                />
                <Label htmlFor="new-project-yoyo">Yo-yo</Label>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddTimeline} className="flex-1">
                Crea progetto
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
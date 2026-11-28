"use client";

import { useRef, useState } from "react";
import { ChevronDown, FolderOpen, Play, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveProjectDialog } from "@/components/SaveProjectDialog";
import {
  openProjectWithPicker,
  parseProjectFile,
  saveProjectQuick,
} from "@/lib/project-file";
import {
  getProjectFileSource,
  hasWritableProjectFile,
  setProjectFileSource,
} from "@/lib/project-file-source";
import { toast } from "react-toastify";
import { NewProjectWizardDialog } from "@/components/NewProjectWizardDialog";
import { useTimelineStore } from "@/stores/timeline-store";

export function NewProjectMenu() {
  const {
    timelines,
    activeTimelineId,
    loadProject,
    setProjectFileName,
    projectFileName,
    addPinnedScrollDemo,
  } = useTimelineStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const applyOpenedProject = (
    content: string,
    filename: string,
    handle: ReturnType<typeof getProjectFileSource>["handle"]
  ) => {
    const project = parseProjectFile(content);
    const replace = window.confirm(
      "Aprire questo progetto? Le timeline attualmente aperte verranno sostituite."
    );
    if (!replace) return;

    loadProject({
      timelines: project.timelines,
      activeTimelineId: project.activeTimelineId,
    });
    setProjectFileSource({ handle, filename });
    setProjectFileName(filename);
    toast.success(
      handle
        ? `Progetto aperto: ${filename}. Salva aggiorna questo file.`
        : `Progetto aperto (${project.timelines.length} timeline).`
    );
  };

  const handleOpenFile = async () => {
    try {
      const picked = await openProjectWithPicker();
      if (picked) {
        applyOpenedProject(picked.content, picked.filename, picked.handle);
        return;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Apertura non riuscita"
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        applyOpenedProject(content, file.name, null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Apertura non riuscita"
        );
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSaveProject = async () => {
    const { handle, filename } = getProjectFileSource();

    if (handle) {
      try {
        await saveProjectQuick(timelines, activeTimelineId, { handle, filename });
        const label = filename ?? projectFileName ?? "progetto";
        toast.success(`Salvato: ${label}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Salvataggio non riuscito"
        );
      }
      return;
    }

    setIsSaveDialogOpen(true);
  };

  const saveMenuLabel = hasWritableProjectFile()
    ? "Salva progetto"
    : projectFileName
      ? "Salva progetto…"
      : "Salva progetto…";

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
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Crea progetto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleSaveProject()}>
            <Save className="h-4 w-4" />
            {saveMenuLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void handleOpenFile()}>
            <FolderOpen className="h-4 w-4" />
            Apri progetto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              addPinnedScrollDemo();
              toast.success("Demo aperta");
            }}
          >
            <Play className="h-4 w-4" />
            Apri demo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      <SaveProjectDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        timelines={timelines}
        activeTimelineId={activeTimelineId}
        defaultFilename={projectFileName ?? getProjectFileSource().filename}
        onSaved={({ handle, filename, mode }) => {
          if (mode === "picker" && handle && filename) {
            setProjectFileSource({ handle, filename });
            setProjectFileName(filename);
          } else if (filename) {
            setProjectFileName(filename);
          }
        }}
      />

      <NewProjectWizardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
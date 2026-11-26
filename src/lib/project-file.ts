import { EXPORT_CODE_VERSION } from "@/lib/gsap-build";
import { normalizeTimelines } from "@/lib/timeline-migrate";
import type { Timeline } from "@/stores/timeline-store";

export const PROJECT_FILE_KIND = "gsap-timeline-editor-project";

export interface ProjectFile {
  kind: typeof PROJECT_FILE_KIND;
  version: string;
  timelines: Timeline[];
  activeTimelineId: string | null;
  exportedAt: string;
}

export interface LegacyTimelineExport {
  version?: string;
  timelines: Timeline[];
  exportedAt?: string;
  activeTimelineId?: string | null;
}

function isTimelineLike(value: unknown): value is Timeline {
  if (!value || typeof value !== "object") return false;
  const t = value as Timeline;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    Array.isArray(t.keyframes)
  );
}

export function buildProjectFile(
  timelines: Timeline[],
  activeTimelineId: string | null
): ProjectFile {
  const normalized = normalizeTimelines(timelines);
  if (normalized.length === 0) {
    throw new Error("Nessuna timeline da salvare");
  }

  const activeOk =
    activeTimelineId &&
    normalized.some((t) => t.id === activeTimelineId)
      ? activeTimelineId
      : normalized[0].id;

  return {
    kind: PROJECT_FILE_KIND,
    version: EXPORT_CODE_VERSION,
    timelines: normalized,
    activeTimelineId: activeOk,
    exportedAt: new Date().toISOString(),
  };
}

export function serializeProjectFile(
  timelines: Timeline[],
  activeTimelineId: string | null
): string {
  return JSON.stringify(
    buildProjectFile(timelines, activeTimelineId),
    null,
    2
  );
}

export function parseProjectFile(jsonString: string): ProjectFile {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("File JSON non valido");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Struttura progetto non valida");
  }

  const record = data as ProjectFile & LegacyTimelineExport;

  if (record.kind === PROJECT_FILE_KIND) {
    if (!Array.isArray(record.timelines) || record.timelines.length === 0) {
      throw new Error("Il progetto non contiene timeline");
    }
    record.timelines.forEach((timeline, index) => {
      if (!isTimelineLike(timeline)) {
        throw new Error(`Timeline non valida all'indice ${index}`);
      }
    });
    return buildProjectFile(
      record.timelines,
      record.activeTimelineId ?? record.timelines[0].id
    );
  }

  if (Array.isArray(record.timelines) && record.timelines.length > 0) {
    record.timelines.forEach((timeline, index) => {
      if (!isTimelineLike(timeline)) {
        throw new Error(`Timeline non valida all'indice ${index}`);
      }
    });
    return buildProjectFile(
      record.timelines,
      record.activeTimelineId ?? record.timelines[0].id
    );
  }

  throw new Error("Formato file non riconosciuto");
}

export function defaultProjectFilename(): string {
  return `progetto-gsap-${new Date().toISOString().slice(0, 10)}.gsap-project.json`;
}

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type FileSystemFileHandle = {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions
  ) => Promise<FileSystemFileHandle>;
};

export function downloadProjectFile(
  timelines: Timeline[],
  activeTimelineId: string | null,
  filename?: string
) {
  const jsonString = serializeProjectFile(timelines, activeTimelineId);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? defaultProjectFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function canUseNativeSavePicker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as WindowWithSavePicker).showSaveFilePicker === "function"
  );
}

/**
 * Chiamare da un click su pulsante (gesto utente). Restituisce true se usato il picker nativo.
 */
export async function saveProjectWithPicker(
  timelines: Timeline[],
  activeTimelineId: string | null,
  filename?: string
): Promise<boolean> {
  const jsonString = serializeProjectFile(timelines, activeTimelineId);
  const suggestedName = filename?.trim() || defaultProjectFilename();
  const win = typeof window !== "undefined" ? (window as WindowWithSavePicker) : null;
  const picker = win?.showSaveFilePicker;
  if (!picker) return false;

  try {
    const handle = await picker.call(win, {
      suggestedName,
      types: [
        {
          description: "Progetto JSON",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(jsonString);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Salvataggio annullato");
    }
    return false;
  }
}

import { EXPORT_CODE_VERSION } from "@/lib/gsap-build";
import { normalizeTimelines } from "@/lib/timeline-migrate";
import type { ProjectFileHandle } from "@/lib/project-file-source";
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

/** Estensioni per showOpenFilePicker/showSaveFilePicker: un solo punto (no `.foo.bar`). */
const PROJECT_FILE_PICKER_TYPES: SaveFilePickerOptions["types"] = [
  {
    description: "Progetto GSAP Timeline Editor",
    accept: { "application/json": [".json"] },
  },
];

type WindowWithFilePicker = Window & {
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions
  ) => Promise<ProjectFileHandle>;
  showOpenFilePicker?: (options?: {
    types?: SaveFilePickerOptions["types"];
    multiple?: boolean;
    mode?: "read" | "readwrite";
  }) => Promise<ProjectFileHandle[]>;
};

export async function writeProjectToHandle(
  handle: ProjectFileHandle,
  timelines: Timeline[],
  activeTimelineId: string | null
): Promise<void> {
  const jsonString = serializeProjectFile(timelines, activeTimelineId);
  const writable = await handle.createWritable();
  await writable.write(jsonString);
  await writable.close();
}

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
    typeof (window as WindowWithFilePicker).showSaveFilePicker === "function"
  );
}

export function canUseNativeOpenPicker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as WindowWithFilePicker).showOpenFilePicker === "function"
  );
}

export type OpenedProjectFile = {
  content: string;
  handle: ProjectFileHandle | null;
  filename: string;
};

export async function openProjectWithPicker(): Promise<OpenedProjectFile | null> {
  const win =
    typeof window !== "undefined" ? (window as WindowWithFilePicker) : null;
  const picker = win?.showOpenFilePicker;
  if (!picker || !win) return null;

  try {
    const [handle] = await picker.call(win, {
      types: PROJECT_FILE_PICKER_TYPES,
      multiple: false,
      mode: "readwrite",
    });
    const file = await (
      handle as ProjectFileHandle & { getFile: () => Promise<File> }
    ).getFile();
    const content = await file.text();
    const filename =
      file.name ||
      (typeof handle.name === "string" ? handle.name : defaultProjectFilename());
    return { content, handle, filename };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

export async function saveProjectQuick(
  timelines: Timeline[],
  activeTimelineId: string | null,
  options?: {
    handle?: ProjectFileHandle | null;
    filename?: string | null;
  }
): Promise<"handle" | "picker" | "download"> {
  const handle = options?.handle;
  if (handle) {
    await writeProjectToHandle(handle, timelines, activeTimelineId);
    return "handle";
  }

  const name = options?.filename?.trim() || defaultProjectFilename();
  const pickerResult = await saveProjectWithPicker(
    timelines,
    activeTimelineId,
    name
  );
  if (pickerResult.usedPicker) return "picker";

  downloadProjectFile(timelines, activeTimelineId, name);
  return "download";
}

/**
 * Chiamare da un click su pulsante (gesto utente). Restituisce true se usato il picker nativo.
 */
export type SaveProjectWithPickerResult = {
  usedPicker: boolean;
  handle: ProjectFileHandle | null;
  filename: string;
};

export async function saveProjectWithPicker(
  timelines: Timeline[],
  activeTimelineId: string | null,
  filename?: string
): Promise<SaveProjectWithPickerResult> {
  const jsonString = serializeProjectFile(timelines, activeTimelineId);
  const suggestedName = filename?.trim() || defaultProjectFilename();
  const win = typeof window !== "undefined" ? (window as WindowWithFilePicker) : null;
  const picker = win?.showSaveFilePicker;
  if (!picker) {
    return { usedPicker: false, handle: null, filename: suggestedName };
  }

  try {
    const handle = await picker.call(win, {
      suggestedName,
      types: PROJECT_FILE_PICKER_TYPES,
    });
    const writable = await handle.createWritable();
    await writable.write(jsonString);
    await writable.close();
    const savedName =
      typeof handle.name === "string" && handle.name.trim()
        ? handle.name
        : suggestedName;
    return { usedPicker: true, handle, filename: savedName };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Salvataggio annullato");
    }
    return { usedPicker: false, handle: null, filename: suggestedName };
  }
}

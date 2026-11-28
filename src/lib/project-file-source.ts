type ProjectFileHandle = {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
  name?: string;
};

type ProjectFileSource = {
  handle: ProjectFileHandle | null;
  filename: string | null;
};

let projectFileSource: ProjectFileSource = {
  handle: null,
  filename: null,
};

export function getProjectFileSource(): ProjectFileSource {
  return projectFileSource;
}

export function setProjectFileSource(
  source: Partial<ProjectFileSource>
): void {
  projectFileSource = {
    handle:
      source.handle !== undefined
        ? source.handle
        : projectFileSource.handle,
    filename:
      source.filename !== undefined
        ? source.filename
        : projectFileSource.filename,
  };
}

export function clearProjectFileSource(): void {
  projectFileSource = { handle: null, filename: null };
}

export function hasWritableProjectFile(): boolean {
  return projectFileSource.handle != null;
}

export type { ProjectFileHandle };
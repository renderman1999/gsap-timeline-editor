"use client";

import { NewProjectMenu } from "@/components/NewProjectMenu";
import { ProjectCacheDialog } from "@/components/ProjectCacheDialog";
import { PreviewToolbar } from "@/components/PreviewToolbar";
import { TimelineProjectsList } from "@/components/TimelineProjectsList";

export function Header() {
  return (
    <header className="border-b border-border bg-card px-3 py-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-base font-semibold text-primary shrink-0 leading-none">
            Editor
          </h1>
          <NewProjectMenu />
          <ProjectCacheDialog />
          <TimelineProjectsList />
        </div>

        <PreviewToolbar />
      </div>

    </header>
  );
}

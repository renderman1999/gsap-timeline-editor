"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTimelineStore } from "@/stores/timeline-store";

type Props = {
  children: ReactNode;
};

export function TimelineStoreHydration({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => setReady(true);
    if (useTimelineStore.persist.hasHydrated()) {
      finish();
      return;
    }
    const unsub = useTimelineStore.persist.onFinishHydration(finish);
    void useTimelineStore.persist.rehydrate();
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Caricamento progetto…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
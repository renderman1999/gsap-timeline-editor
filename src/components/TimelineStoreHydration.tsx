"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  PIN_SCROLL_DEMO_ID,
  useTimelineStore,
} from "@/stores/timeline-store";

const PIN_DEMO_SEEDED_KEY = "gsap-editor-pin-demo-v1";

type Props = {
  children: ReactNode;
};

export function TimelineStoreHydration({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => {
      try {
        if (!window.localStorage.getItem(PIN_DEMO_SEEDED_KEY)) {
          const state = useTimelineStore.getState();
          if (!state.timelines.some((timeline) => timeline.id === PIN_SCROLL_DEMO_ID)) {
            state.addPinnedScrollDemo();
          } else {
            state.setActiveTimeline(PIN_SCROLL_DEMO_ID);
          }
          window.localStorage.setItem(PIN_DEMO_SEEDED_KEY, "1");
        }
      } catch {
        useTimelineStore.getState().addPinnedScrollDemo();
      }
      setReady(true);
    };
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
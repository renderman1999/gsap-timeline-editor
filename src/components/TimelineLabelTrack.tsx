"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TimelineLabel } from "@/stores/timeline-store";
import { sanitizeTimelineLabelName } from "@/lib/gsap-labels";

type Props = {
  labels: TimelineLabel[];
  duration: number;
  onSeek: (time: number) => void;
  onMove: (id: string, time: number) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

export function TimelineLabelTrack({
  labels,
  duration,
  onSeek,
  onMove,
  onRename,
  onRemove,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    originX: number;
    originTime: number;
    width: number;
    duration: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.width <= 0 || drag.duration <= 0) return;
      const delta = ((event.clientX - drag.originX) / drag.width) * drag.duration;
      onMove(drag.id, Math.round(Math.max(0, drag.originTime + delta) * 1000) / 1000);
    };
    const onPointerUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onMove]);

  if (labels.length === 0) return null;

  return (
    <div ref={trackRef} className="absolute inset-x-0 bottom-0 h-4">
      {labels.map((label) => {
        const left = duration > 0 ? (label.time / duration) * 100 : 0;
        return (
          <div
            key={label.id}
            className="absolute top-0 -translate-x-1/2 flex items-center gap-0.5"
            style={{ left: `${left}%` }}
            title={`${label.name} a ${label.time}s`}
          >
            <button
              type="button"
              className="h-3 w-px bg-amber-500"
              onClick={() => onSeek(label.time)}
            />
            {editingId === label.id ? (
              <input
                autoFocus
                defaultValue={label.name}
                className="h-4 w-16 rounded border border-amber-500 bg-background px-1 text-[10px]"
                onBlur={(event) => {
                  const name = sanitizeTimelineLabelName(event.target.value);
                  if (name && name !== label.name) onRename(label.id, name);
                  setEditingId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="max-w-24 truncate rounded bg-amber-400/20 px-1 text-[10px] leading-4 text-amber-200 cursor-grab"
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  const width = trackRef.current?.getBoundingClientRect().width ?? 0;
                  dragRef.current = {
                    id: label.id,
                    originX: event.clientX,
                    originTime: label.time,
                    width,
                    duration,
                  };
                }}
                onClick={() => onSeek(label.time)}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setEditingId(label.id);
                }}
              >
                {label.name}
              </button>
            )}
            <button
              type="button"
              className="text-amber-200/80 hover:text-amber-100"
              aria-label={`Rimuovi label ${label.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(label.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

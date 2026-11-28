"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { AnimationTarget } from "@/stores/timeline-store";
import {
  DEFAULT_PIXI_SCENE,
  normalizePixiLayerSettings,
  runPixiSceneScript,
} from "@/lib/pixi-scene";
import {
  preparePixiLayerRecreate,
  registerPixiLayer,
  setPixiLayerReady,
  unregisterPixiLayer,
} from "@/lib/pixi-layer-registry";
import { cn } from "@/lib/utils";
import {
  pixiLayoutHostClassName,
  pixiSlotOffsetStyle,
} from "@/lib/pixi-layer-layout";

type Props = {
  target: AnimationTarget;
  hostExtraStyle?: CSSProperties;
  /** Layer in una sezione fullpage (serve per fillSection). */
  sectionFill?: boolean;
};

export function PixiLayerPreview({
  target,
  hostExtraStyle,
  sectionFill = false,
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const initGeneration = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const settings = normalizePixiLayerSettings(target.pixiSettings);
  const transparentCanvas = settings.backgroundAlpha === 0;
  const fillActive = settings.fillSection && sectionFill;
  const slotOffset = pixiSlotOffsetStyle(target.pixiSettings, fillActive);
  const layoutHostClass = pixiLayoutHostClassName(
    target.pixiSettings,
    fillActive
  );
  const layoutDepsKey = [
    target.pixiSettings?.alignX,
    target.pixiSettings?.alignY,
    target.pixiSettings?.offsetX,
    target.pixiSettings?.offsetY,
    fillActive,
  ].join("\0");
  const [dimensions, setDimensions] = useState({
    w: settings.width,
    h: settings.height,
  });

  const initDepsKey = [
    target.id,
    target.pixiScene,
    dimensions.w,
    dimensions.h,
    settings.background,
    settings.backgroundAlpha,
  ].join("\0");

  useLayoutEffect(() => {
    if (!fillActive) {
      setDimensions({ w: settings.width, h: settings.height });
      return;
    }
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => {
      const w = Math.max(64, Math.floor(slot.clientWidth));
      const h = Math.max(64, Math.floor(slot.clientHeight));
      setDimensions({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [fillActive, settings.width, settings.height]);

  useLayoutEffect(() => {
    return () => {
      preparePixiLayerRecreate(target.id);
      initGeneration.current += 1;
    };
  }, [initDepsKey, target.id]);

  useEffect(() => {
    return () => {
      unregisterPixiLayer(target.id);
    };
  }, [initDepsKey, target.id]);

  useEffect(() => {
    const generation = initGeneration.current;
    let disposed = false;
    setError(null);

    void (async () => {
      const host = hostRef.current;
      if (!host) return;
      host.replaceChildren();

      const w = dimensions.w;
      const h = dimensions.h;

      try {
        const { Application, Container } = await import("pixi.js");
        const app = new Application();
        await app.init({
          width: w,
          height: h,
          ...(settings.backgroundAlpha > 0
            ? { background: settings.background }
            : {}),
          backgroundAlpha: settings.backgroundAlpha,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        });

        if (
          disposed ||
          generation !== initGeneration.current
        ) {
          app.destroy(true, { children: true });
          return;
        }

        host.appendChild(app.canvas);
        const root = new Container();
        root.x = w / 2;
        root.y = h / 2;
        app.stage.addChild(root);

        const dispose = () => {
          try {
            app.ticker.stop();
            app.destroy(true, { children: true });
          } catch {
            /* ignore */
          }
          host.replaceChildren();
        };

        registerPixiLayer(target.id, {
          app,
          root,
          ready: false,
          dispose,
        });

        const pixi = await import("pixi.js");
        runPixiSceneScript(
          pixi,
          app,
          root,
          target.id,
          target.pixiScene?.trim() || DEFAULT_PIXI_SCENE
        );

        if (disposed || generation !== initGeneration.current) {
          dispose();
          return;
        }

        setPixiLayerReady(target.id, true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Inizializzazione Pixi fallita";
        setError(message);
        console.error("[pixi layer]", target.id, err);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [initDepsKey, target.id, target.pixiScene, dimensions.w, dimensions.h, settings.background, settings.backgroundAlpha]);

  return (
    <div
      className={cn("pixi-layout-host", layoutHostClass)}
      style={{ width: fillActive ? "100%" : undefined }}
      data-pixi-layout={layoutDepsKey}
    >
      <div
        ref={slotRef}
        className={cn(
          "pixi-slot",
          fillActive ? "absolute inset-0 w-full h-full" : "shrink-0"
        )}
        style={
          fillActive
            ? { ...hostExtraStyle, ...slotOffset }
            : {
                width: settings.width,
                height: settings.height,
                ...slotOffset,
                ...hostExtraStyle,
              }
        }
      >
        <div
          ref={hostRef}
          className={
            transparentCanvas
              ? "pixi-canvas-host w-full h-full overflow-visible [&_canvas]:block [&_canvas]:w-full [&_canvas]:h-full"
              : "pixi-canvas-host w-full h-full overflow-visible rounded-md border border-border/60 [&_canvas]:block [&_canvas]:w-full [&_canvas]:h-full"
          }
          data-pixi-host={target.id}
          data-pixi-fill={fillActive ? "1" : undefined}
        />
        {error ? (
          <p className="text-xxs text-destructive mt-1 text-center px-1">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
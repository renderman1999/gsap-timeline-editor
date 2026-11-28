import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { AnimationTarget, TargetShape } from "@/stores/timeline-store";
import type { Model3dSceneSettings } from "@/lib/model3d-scene";
import {
  layerStyleToCss,
  layerStyleUsesLinkedCustomColor,
  layerTextUsesFullViewportWidth,
  resolveTextFullWidthStyle,
  TEXT_FULL_VIEWPORT_WIDTH_CLASS,
  type TextFullWidthContext,
} from "@/lib/layer-style";
import { resolveTextContainerStyle } from "@/lib/text-container-style";
import { cn } from "@/lib/utils";
import {
  layerShapeChromeStyle,
  layerShapeGeometryExtras,
} from "@/lib/layer-shape-style";
import { STAR_CLIP_PATH } from "@/lib/shape-star";
import { imageLayerSizeStyle } from "@/lib/image-layer";
import { sanitizeSvgMarkup } from "@/lib/svg-sanitize";
import { ThreeModelLayerPreview } from "@/components/ThreeModelLayerPreview";
import { CodeLayerPreview } from "@/components/CodeLayerPreview";
import { PixiLayerPreview } from "@/components/PixiLayerPreview";
import { AudioLines, Bell, Heart, Menu } from "lucide-react";

function shapeFill(target: AnimationTarget) {
  return target.style?.color ?? "#ffffff";
}

function layerInnerStyle(target: AnimationTarget): CSSProperties {
  return layerStyleToCss(target.style, { customCss: false });
}

function renderShape(target: AnimationTarget) {
  const fill = shapeFill(target);
  const shape = target.shape ?? "square";
  const iconStyle = { color: fill, fill };
  const chrome = layerShapeChromeStyle(target.style, shape);
  const geomExtra = layerShapeGeometryExtras(target.style, shape);

  const wrap = (body: ReactNode) => (
    <div style={chrome}>{body}</div>
  );

  switch (shape) {
    case "square":
      return wrap(
        <div
          className="w-20 h-20"
          style={{ backgroundColor: fill, ...geomExtra }}
        />
      );
    case "circle":
      return wrap(
        <div
          className="w-20 h-20 rounded-full"
          style={{ backgroundColor: fill, ...geomExtra }}
        />
      );
    case "triangle":
      return wrap(
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "40px solid transparent",
            borderRight: "40px solid transparent",
            borderBottom: `69px solid ${fill}`,
          }}
        />
      );
    case "star":
      return wrap(
        <div
          className="h-20 w-20"
          style={{ backgroundColor: fill, clipPath: STAR_CLIP_PATH }}
        />
      );
    case "heart":
      return wrap(
        <Heart className="w-20 h-20 shrink-0" style={iconStyle} />
      );
    case "bell":
      return wrap(
        <Bell className="w-20 h-20 shrink-0" style={iconStyle} />
      );
    case "menu":
      return wrap(
        <Menu className="w-20 h-20 shrink-0" style={iconStyle} />
      );
    case "audio-lines":
      return wrap(
        <AudioLines className="w-20 h-20 shrink-0" style={iconStyle} />
      );
    default:
      return wrap(
        <div
          className="w-20 h-20"
          style={{ backgroundColor: fill, ...geomExtra }}
        />
      );
  }
}

function InlineSvgLayer({ target }: { target: AnimationTarget }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const markup = useMemo(
    () => sanitizeSvgMarkup(target.svgContent),
    [target.svgContent]
  );
  const extra = layerInnerStyle(target);
  const inheritColor = layerStyleUsesLinkedCustomColor(target.style);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host
      .querySelectorAll("[data-svg-path]")
      .forEach((node) => node.removeAttribute("data-svg-path"));

    const sub = target.svgPathSelector?.trim() || "#draw-path";
    const path =
      host.querySelector(sub) ??
      host.querySelector(`svg ${sub}`) ??
      host.querySelector("svg path");

    if (path) {
      path.setAttribute("data-svg-path", target.id);
    }
  }, [markup, target.id, target.svgPathSelector]);

  return (
    <div
      ref={hostRef}
      className="layer-svg-host max-w-[12rem] max-h-[12rem] flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
      style={{
        ...(inheritColor
          ? { color: "inherit" }
          : { color: target.style?.color ?? "#ffffff" }),
        ...extra,
      }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

type PreviewTargetViewProps = {
  target: AnimationTarget;
  /** viewport = 100vw breakout; section = 100% in sezione fullpage */
  textFullWidthContext?: TextFullWidthContext;
  /** Se impostato sul testo, GSAP tweena il paragrafo (necessario per larghezza 100%). */
  previewTargetId?: string;
  tweenHostStyle?: CSSProperties;
  model3dHostStyle?: CSSProperties;
  onModel3dMeshesDiscovered?: (targetId: string, names: string[]) => void;
  /** Pixi: canvas a tutta sezione fullpage */
  pixiSectionFill?: boolean;
};

export function PreviewTargetView({
  target,
  textFullWidthContext = "viewport",
  previewTargetId,
  tweenHostStyle,
  model3dHostStyle,
  onModel3dMeshesDiscovered,
  pixiSectionFill = false,
}: PreviewTargetViewProps) {
  const extra = layerInnerStyle(target);
  const inheritColor = layerStyleUsesLinkedCustomColor(target.style);

  switch (target.type) {
    case "text": {
      const fullViewport = layerTextUsesFullViewportWidth(target.style);
      return (
        <p
          {...(previewTargetId
            ? { "data-preview-target": previewTargetId }
            : {})}
          data-text-layer
          className={cn(
            "font-semibold text-center",
            fullViewport
              ? cn(TEXT_FULL_VIEWPORT_WIDTH_CLASS, "text-2xl sm:text-3xl")
              : "text-2xl"
          )}
          style={{
            ...(fullViewport
              ? resolveTextFullWidthStyle(textFullWidthContext)
              : {}),
            ...resolveTextContainerStyle(target.style),
            ...(inheritColor
              ? { color: "inherit" }
              : { color: target.style?.color ?? "#ffffff" }),
            ...extra,
            ...tweenHostStyle,
          }}
        >
          {target.text || "Testo"}
        </p>
      );
    }
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={target.imageUrl}
          alt={target.name}
          className="rounded-lg"
          style={{ ...extra, ...imageLayerSizeStyle(target.imageWidth) }}
        />
      );
    case "svg":
      return <InlineSvgLayer target={target} />;
    case "code":
      return <CodeLayerPreview target={target} />;
    case "pixi":
      return (
        <PixiLayerPreview
          target={target}
          hostExtraStyle={model3dHostStyle}
          sectionFill={pixiSectionFill}
        />
      );
    case "model3d":
      return (
        <ThreeModelLayerPreview
          key={target.model3dUrl ?? target.id}
          targetId={target.id}
          modelUrl={target.model3dUrl}
          sceneSettings={target.model3dScene as Model3dSceneSettings | undefined}
          interactions={target.model3dInteractions}
          hostExtraStyle={model3dHostStyle}
          onMeshesDiscovered={(names) =>
            onModel3dMeshesDiscovered?.(target.id, names)
          }
        />
      );
    case "shape":
    default:
      return renderShape(target);
  }
}
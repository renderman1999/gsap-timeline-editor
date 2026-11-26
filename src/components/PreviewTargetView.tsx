import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import type { AnimationTarget, TargetShape } from "@/stores/timeline-store";
import type { Model3dSceneSettings } from "@/lib/model3d-scene";
import {
  layerStyleToCss,
  layerStyleUsesLinkedCustomColor,
} from "@/lib/layer-style";
import { sanitizeSvgMarkup } from "@/lib/svg-sanitize";
import { ThreeModelLayerPreview } from "@/components/ThreeModelLayerPreview";
import {
  AudioLines,
  Bell,
  Heart,
  Menu,
  Square,
  Triangle,
} from "lucide-react";

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
  const inner = layerInnerStyle(target);

  switch (shape) {
    case "square":
      return (
        <div
          className="w-20 h-20"
          style={{ backgroundColor: fill, ...inner }}
        />
      );
    case "circle":
      return (
        <div
          className="w-20 h-20 rounded-full"
          style={{ backgroundColor: fill, ...inner }}
        />
      );
    case "triangle":
      return (
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "40px solid transparent",
            borderRight: "40px solid transparent",
            borderBottom: `69px solid ${fill}`,
            ...inner,
          }}
        />
      );
    case "heart":
      return (
        <div style={inner}>
          <Heart className="w-20 h-20" style={iconStyle} />
        </div>
      );
    case "bell":
      return (
        <div style={inner}>
          <Bell className="w-20 h-20" style={iconStyle} />
        </div>
      );
    case "menu":
      return (
        <div style={inner}>
          <Menu className="w-20 h-20" style={iconStyle} />
        </div>
      );
    case "audio-lines":
      return (
        <div style={inner}>
          <AudioLines className="w-20 h-20" style={iconStyle} />
        </div>
      );
    default:
      return (
        <div className="w-20 h-20" style={{ backgroundColor: fill }} />
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
  model3dHostStyle?: CSSProperties;
  onModel3dMeshesDiscovered?: (targetId: string, names: string[]) => void;
};

export function PreviewTargetView({
  target,
  model3dHostStyle,
  onModel3dMeshesDiscovered,
}: PreviewTargetViewProps) {
  const extra = layerInnerStyle(target);
  const inheritColor = layerStyleUsesLinkedCustomColor(target.style);

  switch (target.type) {
    case "text":
      return (
        <p
          data-text-layer
          className="text-2xl font-semibold text-center max-w-xs"
          style={{
            ...(inheritColor
              ? { color: "inherit" }
              : { color: target.style?.color ?? "#ffffff" }),
            ...extra,
          }}
        >
          {target.text || "Testo"}
        </p>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={target.imageUrl}
          alt={target.name}
          className="max-w-[10rem] max-h-[10rem] object-cover rounded"
          style={extra}
        />
      );
    case "svg":
      return <InlineSvgLayer target={target} />;
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
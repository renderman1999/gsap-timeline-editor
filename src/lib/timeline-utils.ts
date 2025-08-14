import { Timeline } from "@/stores/timeline-store";

export interface TimelineExport {
  version: string;
  timelines: Timeline[];
  exportedAt: string;
}

export const exportTimelines = (timelines: Timeline[]): string => {
  const exportData: TimelineExport = {
    version: "1.2.0",
    timelines,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
};

export const importTimelines = (jsonString: string): Timeline[] => {
  try {
    const data = JSON.parse(jsonString) as TimelineExport;

    // Validate the structure
    if (!data.timelines || !Array.isArray(data.timelines)) {
      throw new Error("Invalid timeline data structure");
    }

    // Validate each timeline
    data.timelines.forEach((timeline, index) => {
      if (
        !timeline.id ||
        !timeline.name ||
        !Array.isArray(timeline.keyframes)
      ) {
        throw new Error(`Invalid timeline at index ${index}`);
      }
    });

    return data.timelines;
  } catch (error) {
    throw new Error(
      `Failed to import timelines: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const downloadTimelines = (timelines: Timeline[], filename?: string) => {
  const jsonString = exportTimelines(timelines);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename || `gsap-timelines-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const generateTimelineCode = (timeline: Timeline): string => {
  const lines: string[] = [];

  lines.push(`// GSAP Timeline: ${timeline.name}`);
  lines.push(`const tl = gsap.timeline({`);

  if (timeline.loop) {
    lines.push(`  repeat: -1,`);
    if (timeline.yoyo) {
      lines.push(`  yoyo: true,`);
    }
  }

  lines.push(`});`);
  lines.push("");

  // Sort keyframes by delay
  const sortedKeyframes = [...timeline.keyframes].sort(
    (a, b) => a.delay - b.delay
  );

  sortedKeyframes.forEach((keyframe, index) => {
    // Skip keyframes without transforms
    if (keyframe.transforms.length === 0) {
      return;
    }

    const transformProps: string[] = [];
    const fromProps: string[] = [];

    // For the first keyframe with Initial State, collect from values
    const isFirstKeyframe = index === 0;
    const hasInitialState = timeline.initialState && timeline.initialState.length > 0;

    keyframe.transforms.forEach((transform) => {
      // Find corresponding initial state transform if this is the first keyframe
      let initialTransform = null;
      if (isFirstKeyframe && hasInitialState) {
        initialTransform = timeline.initialState!.find(t => t.type === transform.type);
      }

      switch (transform.type) {
        case "move":
          // Include x and y values even if they're 0
          transformProps.push(`x: ${transform.values.x}`);
          transformProps.push(`y: ${transform.values.y}`);
          
          if (initialTransform) {
            fromProps.push(`x: ${initialTransform.values.x || 0}`);
            fromProps.push(`y: ${initialTransform.values.y || 0}`);
          }
          break;
        case "rotate":
          transformProps.push(`rotation: ${transform.values.rotation}`);
          
          if (initialTransform) {
            fromProps.push(`rotation: ${initialTransform.values.rotation || 0}`);
          }
          break;
        case "opacity":
          transformProps.push(`opacity: ${transform.values.opacity}`);
          
          if (initialTransform) {
            fromProps.push(`opacity: ${initialTransform.values.opacity || 1}`);
          }
          break;
        case "skew":
          // Include skewX and skewY values even if they're 0
          transformProps.push(`skewX: ${transform.values.skewX}`);
          transformProps.push(`skewY: ${transform.values.skewY}`);
          
          if (initialTransform) {
            fromProps.push(`skewX: ${initialTransform.values.skewX || 0}`);
            fromProps.push(`skewY: ${initialTransform.values.skewY || 0}`);
          }
          break;
        case "scale":
          // Include scaleX and scaleY values even if they're 1
          transformProps.push(`scaleX: ${transform.values.scaleX}`);
          transformProps.push(`scaleY: ${transform.values.scaleY}`);
          
          if (initialTransform) {
            fromProps.push(`scaleX: ${initialTransform.values.scaleX || 1}`);
            fromProps.push(`scaleY: ${initialTransform.values.scaleY || 1}`);
          }
          break;
        case "filter":
          const filterType = transform.values.filter;
          const filterValue = transform.values.value;
          let filterString = "";

          switch (filterType) {
            case "blur":
              filterString = `blur(${filterValue}px)`;
              break;
            case "brightness":
              filterString = `brightness(${filterValue}%)`;
              break;
            case "contrast":
              filterString = `contrast(${filterValue}%)`;
              break;
            case "grayscale":
              filterString = `grayscale(${filterValue}%)`;
              break;
            case "hue-rotate":
              filterString = `hue-rotate(${filterValue}deg)`;
              break;
            case "invert":
              filterString = `invert(${filterValue}%)`;
              break;
            case "opacity":
              filterString = `opacity(${filterValue}%)`;
              break;
            case "saturate":
              filterString = `saturate(${filterValue}%)`;
              break;
            case "sepia":
              filterString = `sepia(${filterValue}%)`;
              break;
          }

          transformProps.push(`filter: "${filterString}"`);
          
          if (initialTransform) {
            const initialFilterType = initialTransform.values.filter;
            const initialFilterValue = initialTransform.values.value;
            let initialFilterString = "";

            switch (initialFilterType) {
              case "blur":
                initialFilterString = `blur(${initialFilterValue}px)`;
                break;
              case "brightness":
                initialFilterString = `brightness(${initialFilterValue}%)`;
                break;
              case "contrast":
                initialFilterString = `contrast(${initialFilterValue}%)`;
                break;
              case "grayscale":
                initialFilterString = `grayscale(${initialFilterValue}%)`;
                break;
              case "hue-rotate":
                initialFilterString = `hue-rotate(${initialFilterValue}deg)`;
                break;
              case "invert":
                initialFilterString = `invert(${initialFilterValue}%)`;
                break;
              case "opacity":
                initialFilterString = `opacity(${initialFilterValue}%)`;
                break;
              case "saturate":
                initialFilterString = `saturate(${initialFilterValue}%)`;
                break;
              case "sepia":
                initialFilterString = `sepia(${initialFilterValue}%)`;
                break;
            }

            fromProps.push(`filter: "${initialFilterString}"`);
          }
          break;
      }
    });

    const propsString =
      transformProps.length > 0
        ? `{ ${transformProps.join(", ")}, duration: ${
            keyframe.duration / 1000
          }, ease: "${keyframe.easing}" }`
        : `{ duration: ${keyframe.duration / 1000}, ease: "${
            keyframe.easing
          }" }`;

    // Use .fromTo() for first keyframe if Initial State exists and has matching transforms
    if (isFirstKeyframe && hasInitialState && fromProps.length > 0) {
      const fromPropsString = `{ ${fromProps.join(", ")} }`;
      lines.push(`tl.fromTo(".target", ${fromPropsString}, ${propsString}, ${keyframe.delay});`);
    } else {
      lines.push(`tl.to(".target", ${propsString}, ${keyframe.delay});`);
    }
  });

  if (timeline.playbackType === "scroll") {
    lines.push("");
    lines.push("// Add ScrollTrigger");
    lines.push("ScrollTrigger.create({");
    lines.push("  animation: tl,");
    lines.push('  trigger: ".trigger-element",');
    lines.push(`  start: "top center",`);
    lines.push(`  end: "${timeline.scrollLength || 300}% center",`);
    lines.push("  scrub: true");
    lines.push("});");
  }

  return lines.join("\n");
};

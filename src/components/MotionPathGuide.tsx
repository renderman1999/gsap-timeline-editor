import {
  collectMotionPathGuideIds,
  motionPathGuideSvgMarkup,
} from "@/lib/gsap-motion-path";
import type { Timeline } from "@/stores/timeline-store";

export function MotionPathGuide({
  timeline,
  visibleStroke = true,
}: {
  timeline: Timeline;
  visibleStroke?: boolean;
}) {
  const ids = collectMotionPathGuideIds(timeline);
  if (ids.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      dangerouslySetInnerHTML={{
        __html: motionPathGuideSvgMarkup(ids, { visibleStroke }),
      }}
    />
  );
}
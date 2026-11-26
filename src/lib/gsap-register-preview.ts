import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { CSSRulePlugin } from "gsap/CSSRulePlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registrazione unica per l'anteprima client (vedi https://gsap.com/resources/React). */
export function registerPreviewGsapPlugins(): void {
  if (registered) return;
  gsap.registerPlugin(useGSAP);
  gsap.registerPlugin(
    ScrollTrigger,
    DrawSVGPlugin,
    MorphSVGPlugin,
    MotionPathPlugin,
    CSSRulePlugin,
    Draggable,
    InertiaPlugin,
    SplitText
  );
  registered = true;
}
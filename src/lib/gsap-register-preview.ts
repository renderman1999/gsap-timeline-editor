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
import { CustomBounce } from "gsap/CustomBounce";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { ExpoScaleEase, RoughEase, SlowMo } from "gsap/EasePack";
import { Flip } from "gsap/Flip";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

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
    SplitText,
    CustomEase,
    CustomWiggle,
    CustomBounce,
    RoughEase,
    SlowMo,
    ExpoScaleEase,
    Flip,
    ScrambleTextPlugin,
    Physics2DPlugin,
    PhysicsPropsPlugin,
    ScrollToPlugin
  );
  registered = true;
}
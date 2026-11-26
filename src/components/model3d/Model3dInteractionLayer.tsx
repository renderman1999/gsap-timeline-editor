"use client";

import { gsap } from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  normalizeModel3dInteraction,
  runModel3dInteractionRule,
  type Model3dInteractionConfig,
  type Model3dInteractionRule,
} from "@/lib/model3d-interaction";
import { callThreeFitView } from "@/lib/three-preview-fit";
import { renderAllThreeLayers } from "@/lib/three-layer-registry";

type Props = {
  targetId: string;
  rootRef: React.RefObject<THREE.Group | null>;
  config?: Model3dInteractionConfig | null;
};

function rulePassesHit(
  rule: Model3dInteractionRule,
  root: THREE.Object3D,
  event: PointerEvent,
  camera: THREE.Camera,
  domElement: HTMLElement
): boolean {
  if (rule.hit === "viewport") return true;

  const rect = domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

  const hits = raycaster.intersectObject(root, true);
  if (hits.length === 0) return false;

  if (!rule.meshName?.trim()) return true;

  const needle = rule.meshName.trim();
  return hits.some((hit) => {
    const mesh = hit.object as THREE.Mesh;
    const name = mesh.name?.trim();
    return name === needle || mesh.uuid === needle;
  });
}

export function Model3dInteractionLayer({
  targetId,
  rootRef,
  config,
}: Props) {
  const { camera, gl } = useThree();
  const activeTweenRef = useRef<Map<string, gsap.core.Tween>>(new Map());

  const interactions = useMemo(
    () => normalizeModel3dInteraction(config),
    [config]
  );

  const rules = useMemo(
    () =>
      interactions.enabled
        ? interactions.rules.filter((r) => r.enabled)
        : [],
    [interactions]
  );

  useEffect(() => {
    if (rules.length === 0) return;

    const dom = gl.domElement;
    const runtime = {
      onUpdate: () => {
        const root = rootRef.current;
        if (root) callThreeFitView(root);
        renderAllThreeLayers();
      },
    };

    const runRule = (rule: Model3dInteractionRule, event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!rulePassesHit(rule, root, event, camera, dom)) return;

      const prev = activeTweenRef.current.get(rule.id);
      prev?.kill();

      const tween = runModel3dInteractionRule(root, rule, runtime);
      if (tween) activeTweenRef.current.set(rule.id, tween);
    };

    const byTrigger = (trigger: Model3dInteractionRule["trigger"]) =>
      rules.filter((r) => r.trigger === trigger);

    const onClick = (e: PointerEvent) => {
      byTrigger("click").forEach((r) => runRule(r, e));
    };
    const onDblClick = (e: PointerEvent) => {
      byTrigger("doubleClick").forEach((r) => runRule(r, e));
    };
    const onEnter = (e: PointerEvent) => {
      byTrigger("pointerenter").forEach((r) => runRule(r, e));
    };
    const onLeave = (e: PointerEvent) => {
      byTrigger("pointerleave").forEach((r) => runRule(r, e));
    };

    if (byTrigger("click").length) dom.addEventListener("click", onClick);
    if (byTrigger("doubleClick").length) {
      dom.addEventListener("dblclick", onDblClick);
    }
    if (byTrigger("pointerenter").length) {
      dom.addEventListener("pointerenter", onEnter);
    }
    if (byTrigger("pointerleave").length) {
      dom.addEventListener("pointerleave", onLeave);
    }

    dom.style.cursor = rules.some((r) => r.trigger === "click") ? "pointer" : "";

    return () => {
      dom.removeEventListener("click", onClick);
      dom.removeEventListener("dblclick", onDblClick);
      dom.removeEventListener("pointerenter", onEnter);
      dom.removeEventListener("pointerleave", onLeave);
      if (!rules.length) dom.style.cursor = "";
      activeTweenRef.current.forEach((t) => t.kill());
      activeTweenRef.current.clear();
    };
  }, [rules, gl, camera, rootRef, targetId]);

  return null;
}
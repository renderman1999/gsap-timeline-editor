"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import {
  patchThreeLayer,
  registerThreeLayer,
  setThreeLayerLoaded,
  unregisterThreeLayer,
} from "@/lib/three-layer-registry";
import { normalizeModel3dSource } from "@/lib/model3d-layer";
import {
  applyMeshMaterials,
  enableShadowMapsOnMeshes,
  fitDirectionalShadowToObject,
  groundYFromObject,
  listMeshNames,
  prepareGltfSceneForStage,
  model3dCameraFitOptions,
  type Model3dSceneSettings,
} from "@/lib/model3d-scene";
import {
  bindThreeFitView,
  MODEL3D_VIEW_H,
  MODEL3D_VIEW_W,
  syncModel3dViewport,
} from "@/lib/three-preview-fit";
import type { Model3dInteractionConfig } from "@/lib/model3d-interaction";
import { Model3dInteractionLayer } from "@/components/model3d/Model3dInteractionLayer";

type Props = {
  targetId: string;
  modelUrl: string;
  sceneSettings: Model3dSceneSettings;
  interactions?: Model3dInteractionConfig | null;
  onReady: () => void;
  onMeshesDiscovered: (names: string[]) => void;
};

export function Model3dR3fScene({
  targetId,
  modelUrl,
  sceneSettings,
  interactions,
  onReady,
  onMeshesDiscovered,
}: Props) {
  const gsapRootRef = useRef<THREE.Group>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const onReadyRef = useRef(onReady);
  const onMeshesRef = useRef(onMeshesDiscovered);
  onReadyRef.current = onReady;
  onMeshesRef.current = onMeshesDiscovered;

  const source = normalizeModel3dSource(modelUrl);
  const gltf = useGLTF(source);

  useEffect(() => {
    return () => {
      useGLTF.clear(source);
    };
  }, [source]);
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const showShadowPlane =
    sceneSettings.shadowMap && sceneSettings.shadowGroundOpacity > 0;
  const showContactShadow =
    sceneSettings.shadowContact && sceneSettings.contactOpacity > 0;

  const shadowPlaneMaterial = useMemo(() => {
    return new THREE.ShadowMaterial({
      color: new THREE.Color(sceneSettings.groundColor),
      transparent: true,
      opacity: sceneSettings.shadowGroundOpacity,
      depthWrite: false,
    });
  }, [
    sceneSettings.groundColor,
    sceneSettings.shadowGroundOpacity,
  ]);

  useLayoutEffect(() => {
    shadowPlaneMaterial.color.set(sceneSettings.groundColor);
    shadowPlaneMaterial.opacity = sceneSettings.shadowGroundOpacity;
    shadowPlaneMaterial.needsUpdate = true;
    invalidate();
  }, [
    shadowPlaneMaterial,
    sceneSettings.groundColor,
    sceneSettings.shadowGroundOpacity,
    invalidate,
  ]);

  const model = useMemo(
    () => prepareGltfSceneForStage(gltf.scene),
    [gltf.scene]
  );

  const groundY = useMemo(() => groundYFromObject(model), [model]);

  useLayoutEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    const light = dirLightRef.current;
    if (light && light.target.parent !== scene) {
      scene.add(light.target);
    }
  }, [gl, scene]);

  useLayoutEffect(() => {
    gl.shadowMap.enabled = showShadowPlane;
    if (showShadowPlane) {
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }, [gl, showShadowPlane]);

  useLayoutEffect(() => {
    applyMeshMaterials(model, sceneSettings.meshMaterials);
    enableShadowMapsOnMeshes(model, showShadowPlane);
    const light = dirLightRef.current;
    const root = gsapRootRef.current;
    if (light && root && showShadowPlane) {
      fitDirectionalShadowToObject(light, root);
    }
    invalidate();
  }, [
    model,
    sceneSettings.meshMaterials,
    showShadowPlane,
    sceneSettings.shadowGroundOpacity,
    sceneSettings.groundColor,
    invalidate,
  ]);

  useLayoutEffect(() => {
    let cancelled = false;
    let registered = false;

    const attachLayer = () => {
      if (cancelled || registered) return;
      const root = gsapRootRef.current;
      if (!root) return;

      registered = true;
      const cameraFit = model3dCameraFitOptions(sceneSettings);
      const fitView = bindThreeFitView(
        root,
        camera,
        MODEL3D_VIEW_W,
        MODEL3D_VIEW_H,
        cameraFit
      );

      const renderFrame = () => invalidate();

      registerThreeLayer(targetId, {
        root,
        loaded: true,
        dispose: () => {},
        fitView,
        render: renderFrame,
      });

      fitView();
      syncModel3dViewport(gl, camera, MODEL3D_VIEW_W, MODEL3D_VIEW_H);
      const light = dirLightRef.current;
      if (light && showShadowPlane) {
        fitDirectionalShadowToObject(light, root);
      }
      renderFrame();
      patchThreeLayer(targetId, { loaded: true, fitView, render: renderFrame });
      setThreeLayerLoaded(targetId, true);
      onMeshesRef.current(listMeshNames(model));
      onReadyRef.current();
    };

    attachLayer();
    let raf = 0;
    if (!registered) {
      raf = requestAnimationFrame(attachLayer);
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      unregisterThreeLayer(targetId);
      setThreeLayerLoaded(targetId, false);
    };
  }, [
    targetId,
    model,
    showShadowPlane,
    sceneSettings.cameraPreset,
    sceneSettings.cameraFov,
  ]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        ref={dirLightRef}
        position={[4, 8, 6]}
        intensity={1.15}
        castShadow={showShadowPlane}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      <Environment
        preset={sceneSettings.envPreset}
        environmentIntensity={sceneSettings.envIntensity}
      />

      <group ref={gsapRootRef}>
        <primitive object={model} />
      </group>

      {showShadowPlane ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, groundY - 0.001, 0]}
          receiveShadow
          renderOrder={1}
        >
          <planeGeometry args={[24, 24]} />
          <primitive attach="material" object={shadowPlaneMaterial} />
        </mesh>
      ) : null}

      <Model3dInteractionLayer
        targetId={targetId}
        rootRef={gsapRootRef}
        config={interactions}
      />

      {showContactShadow ? (
        <ContactShadows
          position={[0, groundY + 0.001, 0]}
          opacity={sceneSettings.contactOpacity}
          scale={sceneSettings.contactScale}
          blur={sceneSettings.contactBlur}
          far={6}
          resolution={1024}
          color="#000000"
          frames={Infinity}
        />
      ) : null}
    </>
  );
}
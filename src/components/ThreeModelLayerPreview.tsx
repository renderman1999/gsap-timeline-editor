"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Model3dR3fScene } from "@/components/model3d/Model3dR3fScene";
import {
  normalizeModel3dSceneSettings,
  type Model3dSceneSettings,
} from "@/lib/model3d-scene";
import type { Model3dInteractionConfig } from "@/lib/model3d-interaction";
import {
  MODEL3D_VIEW_H,
  MODEL3D_VIEW_W,
  model3dHostStyle,
} from "@/lib/three-preview-fit";

type Props = {
  targetId: string;
  modelUrl?: string;
  sceneSettings?: Model3dSceneSettings;
  interactions?: Model3dInteractionConfig | null;
  hostExtraStyle?: CSSProperties;
  onMeshesDiscovered?: (names: string[]) => void;
};

type BoundaryProps = {
  children: ReactNode;
  onError: (message: string) => void;
};

type BoundaryState = { error: string | null };

class Model3dErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(err: unknown): BoundaryState {
    const message =
      err instanceof Error ? err.message : "Caricamento modello fallito";
    return { error: message };
  }

  componentDidCatch(err: unknown) {
    const message =
      err instanceof Error ? err.message : "Caricamento modello fallito";
    this.props.onError(message);
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export function ThreeModelLayerPreview({
  targetId,
  modelUrl,
  sceneSettings,
  interactions,
  hostExtraStyle,
  onMeshesDiscovered,
}: Props) {
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const settings = normalizeModel3dSceneSettings(sceneSettings);
  const canvasShadows =
    (settings.shadowMap && settings.shadowGroundOpacity > 0) ||
    (settings.shadowContact && settings.contactOpacity > 0);

  const hostStyle: CSSProperties = { ...model3dHostStyle(), ...hostExtraStyle };

  const handleReady = useCallback(() => {
    setLoadState("ready");
    setErrorMsg(null);
  }, []);

  const handleError = useCallback((message: string) => {
    setLoadState("error");
    setErrorMsg(message);
  }, []);

  const handleMeshes = useCallback(
    (names: string[]) => {
      onMeshesDiscovered?.(names);
    },
    [onMeshesDiscovered]
  );

  useEffect(() => {
    if (modelUrl?.trim()) {
      setLoadState("loading");
      setErrorMsg(null);
    } else {
      setLoadState("idle");
    }
  }, [modelUrl, targetId]);

  const viewport = (content: ReactNode) => (
    <div className="model3d-slot" data-model3d-id={targetId}>
      <div
        data-preview-target={targetId}
        className="model3d-viewport model3d-canvas-host relative overflow-hidden rounded bg-transparent"
        style={hostStyle}
      >
        {content}
      </div>
    </div>
  );

  if (!modelUrl?.trim()) {
    return viewport(
      <span className="flex h-full items-center justify-center text-xxs text-muted-foreground text-center px-2">
        Carica un file .glb / .gltf nel pannello layer
      </span>
    );
  }

  const showLoading = loadState === "idle" || loadState === "loading";

  return viewport(
    <>
      <Canvas
        key={`${targetId}-${modelUrl}`}
        className="!block"
        style={{ width: MODEL3D_VIEW_W, height: MODEL3D_VIEW_H }}
        dpr={[1, 2]}
        shadows={canvasShadows}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene, camera }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          const cam = camera as THREE.PerspectiveCamera;
          cam.fov = settings.cameraFov;
          cam.near = 0.01;
          cam.far = 2000;
          cam.updateProjectionMatrix();
        }}
      >
        <Model3dErrorBoundary onError={handleError}>
          <Suspense fallback={null}>
            <Model3dR3fScene
              targetId={targetId}
              modelUrl={modelUrl}
              sceneSettings={settings}
              interactions={interactions}
              onReady={handleReady}
              onMeshesDiscovered={handleMeshes}
            />
          </Suspense>
        </Model3dErrorBoundary>
      </Canvas>
      {showLoading ? (
        <span className="absolute inset-0 flex items-center justify-center text-xxs text-muted-foreground pointer-events-none z-10">
          Caricamento modello…
        </span>
      ) : null}
      {loadState === "error" ? (
        <span className="absolute inset-0 flex items-center justify-center text-xxs text-destructive text-center px-2 pointer-events-none z-10">
          {errorMsg ?? "Errore GLB (rileva file o ricarica)"}
        </span>
      ) : null}
    </>
  );
}
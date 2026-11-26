import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import { threeLayerVarName } from "@/lib/three-gsap";
import {
  MODEL3D_VIEW_H,
  MODEL3D_VIEW_W,
  model3dCameraFitVanillaJsLines,
} from "@/lib/three-preview-fit";
import { model3dExportVanillaHelperLines } from "@/lib/model3d-export-vanilla";
import { model3dInteractionVanillaJsLines } from "@/lib/model3d-interaction-export";
import { normalizeModel3dInteraction } from "@/lib/model3d-interaction";
import { DEFAULT_MODEL3D_CAMERA_FOV } from "@/lib/model3d-scene";
import { normalizeModel3dSceneSettings } from "@/lib/model3d-scene";

export const THREE_MODULE = "0.187.0";

export function timelineUsesModel3d(model: Timeline): boolean {
  return model.targets.some((t) => t.type === "model3d");
}

function escapeJsString(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

export function model3dLayerMarkup(target: AnimationTarget): string {
  return `<div class="model3d-slot" data-model3d-id="${target.id}">\n          <div class="model3d-canvas-host" data-preview-target="${target.id}"></div>\n        </div>`;
}

export function threeImportMapLines(): string[] {
  return [
    '<script type="importmap">',
    JSON.stringify(
      {
        imports: {
          three: `https://unpkg.com/three@${THREE_MODULE}/build/three.module.js`,
          "three/addons/": `https://unpkg.com/three@${THREE_MODULE}/examples/jsm/`,
        },
      },
      null,
      2
    ),
    "</script>",
  ];
}

function applyMaterialsJs(materialsJson: string): string[] {
  return [
    "function __applyModel3dMaterials(root, materials) {",
    "  root.traverse((child) => {",
    "    if (!child.isMesh) return;",
    "    const key = (child.name && child.name.trim()) || child.uuid;",
    "    const patch = materials[key] || materials[child.name];",
    "    if (!patch) return;",
    "    const mats = Array.isArray(child.material) ? child.material : [child.material];",
    "    mats.forEach((mat) => {",
    "      if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;",
    "      if (patch.color != null) mat.color.set(patch.color);",
    "      if (patch.emissive != null) mat.emissive.set(patch.emissive);",
    "      if (patch.metalness != null) mat.metalness = patch.metalness;",
    "      if (patch.roughness != null) mat.roughness = patch.roughness;",
    "      if (patch.opacity != null) { mat.opacity = patch.opacity; mat.transparent = patch.opacity < 1; }",
    "      mat.needsUpdate = true;",
    "    });",
    "  });",
    "}",
    "const __model3dMaterials = " + materialsJson + ";",
  ];
}

/** Righe da inserire in buildScript (prima della timeline GSAP). Export vanilla (no R3F). */
export function threeBootstrapCodeLines(model: Timeline): string[] {
  const layers = model.targets.filter(
    (t) => t.type === "model3d" && t.model3dUrl?.trim()
  );
  if (layers.length === 0) return [];

  const materialsByTarget: Record<string, unknown> = {};
  layers.forEach((t) => {
    materialsByTarget[t.id] =
      normalizeModel3dSceneSettings(t.model3dScene).meshMaterials;
  });

  const lines: string[] = [];
  lines.push("// --- Three.js layer bootstrap (export vanilla) ---");
  lines.push(...applyMaterialsJs(JSON.stringify(materialsByTarget)));
  lines.push("const __model3dLayers = {");
  layers.forEach((t) => {
    const scene = normalizeModel3dSceneSettings(t.model3dScene);
    const interactions = normalizeModel3dInteraction(t.model3dInteractions);
    lines.push(`  "${t.id}": {`);
    lines.push(`    url: "${escapeJsString(t.model3dUrl!.trim())}",`);
    lines.push(`    scene: ${JSON.stringify(scene)},`);
    lines.push(`    interactions: ${JSON.stringify(interactions)},`);
    lines.push("  },");
  });
  lines.push("};");
  lines.push("window.__threeLayers = window.__threeLayers || {};");
  lines.push("");
  lines.push("async function initModel3dLayers() {");
  lines.push('  const THREE = await import("three");');
  lines.push(...model3dCameraFitVanillaJsLines("  "));
  lines.push(...model3dExportVanillaHelperLines("  "));
  lines.push(...model3dInteractionVanillaJsLines("  "));
  lines.push(
    '  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");'
  );
  lines.push(`  const viewW = ${MODEL3D_VIEW_W}, viewH = ${MODEL3D_VIEW_H};`);
  lines.push(
    "  for (const [targetId, layer] of Object.entries(__model3dLayers)) {"
  );
  lines.push(
    '    const host = document.querySelector(`[data-model3d-id="${targetId}"] .model3d-canvas-host`);'
  );
  lines.push("    if (!host) continue;");
  lines.push("    const sceneCfg = layer.scene;");
  lines.push("    const scene = new THREE.Scene();");
  lines.push(
    `    const camera = new THREE.PerspectiveCamera(sceneCfg.cameraFov ?? ${DEFAULT_MODEL3D_CAMERA_FOV}, viewW / viewH, 0.01, 2000);`
  );
  lines.push("    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });");
  lines.push("    renderer.outputColorSpace = THREE.SRGBColorSpace;");
  lines.push("    renderer.toneMapping = THREE.ACESFilmicToneMapping;");
  lines.push("    renderer.toneMappingExposure = 1;");
  lines.push("    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));");
  lines.push("    renderer.setSize(viewW, viewH, false);");
  lines.push("    const canvas = renderer.domElement;");
  lines.push("    canvas.style.width = viewW + 'px';");
  lines.push("    canvas.style.height = viewH + 'px';");
  lines.push("    const __useShadowPlane = Boolean(sceneCfg.shadowMap) && (sceneCfg.shadowGroundOpacity ?? 0) > 0;");
  lines.push("    renderer.shadowMap.enabled = __useShadowPlane;");
  lines.push("    if (__useShadowPlane) renderer.shadowMap.type = THREE.PCFSoftShadowMap;");
  lines.push("    host.appendChild(canvas);");
  lines.push("    try { await __loadModel3dEnvironment(renderer, scene, sceneCfg); } catch (e) { console.warn('[model3d] HDR environment', e); }");
  lines.push("    scene.add(new THREE.AmbientLight(0xffffff, 0.35));");
  lines.push("    const key = new THREE.DirectionalLight(0xffffff, 1.15);");
  lines.push("    key.position.set(4, 8, 6);");
  lines.push("    key.castShadow = __useShadowPlane;");
  lines.push("    key.shadow.mapSize.set(2048, 2048);");
  lines.push("    key.shadow.bias = -0.0001;");
  lines.push("    key.shadow.normalBias = 0.02;");
  lines.push("    scene.add(key.target);");
  lines.push("    scene.add(key);");
  lines.push("    const root = new THREE.Group();");
  lines.push("    scene.add(root);");
  lines.push("    window.__threeLayers[targetId] = root;");
  lines.push("    const loader = new GLTFLoader();");
  lines.push("    await new Promise((resolve, reject) => {");
  lines.push("      loader.load(layer.url, (gltf) => {");
  lines.push("        const model = gltf.scene.clone(true);");
  lines.push("        const box = new THREE.Box3().setFromObject(model);");
  lines.push("        const size = box.getSize(new THREE.Vector3());");
  lines.push("        const maxDim = Math.max(size.x, size.y, size.z, 0.001);");
  lines.push("        model.scale.setScalar(1.35 / maxDim);");
  lines.push("        box.setFromObject(model);");
  lines.push("        const center = box.getCenter(new THREE.Vector3());");
  lines.push("        model.position.sub(center);");
  lines.push("        __upgradeModel3dMaterials(model);");
  lines.push("        __applyModel3dMaterials(model, __model3dMaterials[targetId] || {});");
  lines.push("        if (__useShadowPlane) model.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = false; } });");
  lines.push("        root.add(model);");
  lines.push("        box.setFromObject(model);");
  lines.push("        const groundY = box.min.y;");
  lines.push("        const maxDimGround = Math.max(size.x, size.y, size.z, 0.001);");
  lines.push("        if (sceneCfg.shadowMap && (sceneCfg.shadowGroundOpacity ?? 0) > 0) {");
  lines.push("          const groundSpan = Math.max(maxDimGround * 14, 6);");
  lines.push("          const ground = new THREE.Mesh(");
  lines.push("            new THREE.PlaneGeometry(groundSpan, groundSpan),");
  lines.push(
    "            new THREE.ShadowMaterial({ color: sceneCfg.groundColor || '#000000', transparent: true, opacity: sceneCfg.shadowGroundOpacity ?? 0.55, depthWrite: false })"
  );
  lines.push("          );");
  lines.push("          ground.rotation.x = -Math.PI / 2;");
  lines.push("          ground.position.y = groundY - 0.001;");
  lines.push("          ground.receiveShadow = true;");
  lines.push("          ground.renderOrder = 1;");
  lines.push("          scene.add(ground);");
  lines.push("        }");
  lines.push(
    "        if (sceneCfg.shadowContact && (sceneCfg.contactOpacity ?? 0) > 0) __addModel3dContactShadow(scene, groundY, sceneCfg, maxDimGround);"
  );
  lines.push("        __fitModel3dCamera(camera, root, viewW, viewH, sceneCfg);");
  lines.push("        if (__useShadowPlane) __fitModel3dDirectionalShadow(key, root);");
  lines.push(
    "        __bindModel3dInteractions(targetId, layer.interactions, root, camera, canvas, sceneCfg, viewW, viewH);"
  );
  lines.push("        resolve(null);");
  lines.push("      }, undefined, reject);");
  lines.push("    });");
  lines.push("    (function loop() {");
  lines.push("      renderer.render(scene, camera);");
  lines.push("      requestAnimationFrame(loop);");
  lines.push("    })();");
  lines.push("  }");
  lines.push("}");
  lines.push("");
  return lines;
}

export function threeRootVarLines(model: Timeline): string[] {
  return model.targets
    .filter((t) => t.type === "model3d" && t.model3dUrl?.trim())
    .map(
      (t) =>
        `const ${threeLayerVarName(t)} = window.__threeLayers["${t.id}"];`
    );
}
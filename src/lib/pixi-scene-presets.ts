import { YELLOW_DROPS_PIXI_SCENE } from "@/lib/pixi-scenes/yellow-drops";

export type PixiScenePreset = {
  id: string;
  label: string;
  hint: string;
  code: string;
  /** Sostituisce tutta la scena (es. pioggia con ticker), non appende al placeholder Pixi. */
  replaceScene?: boolean;
};

/** Snippet da appendere alla scena (usa PIXI, root). Eseguibili in sync salvo dove indicato. */
export const PIXI_SCENE_PRESETS: PixiScenePreset[] = [
  {
    id: "graphics-roundrect",
    label: "Rettangolo arrotondato",
    hint: "Graphics",
    code: `const box = new PIXI.Graphics();
box.roundRect(-60, -40, 120, 80, 16);
box.fill(0x7c5cff);
root.addChild(box);`,
  },
  {
    id: "graphics-circle",
    label: "Cerchio",
    hint: "Graphics",
    code: `const dot = new PIXI.Graphics();
dot.circle(0, 0, 56);
dot.fill(0x38bdf8);
root.addChild(dot);`,
  },
  {
    id: "graphics-star",
    label: "Stella",
    hint: "Graphics",
    code: `const star = new PIXI.Graphics();
star.star(0, 0, 5, 52, 24);
star.fill(0xfacc15);
root.addChild(star);`,
  },
  {
    id: "graphics-ring",
    label: "Anello",
    hint: "Graphics",
    code: `const ring = new PIXI.Graphics();
ring.circle(0, 0, 50);
ring.stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
root.addChild(ring);`,
  },
  {
    id: "text-label",
    label: "Testo",
    hint: "Text",
    code: `const title = new PIXI.Text({
  text: "Titolo",
  style: {
    fill: 0xffffff,
    fontSize: 36,
    fontWeight: "700",
    align: "center",
  },
});
title.anchor.set(0.5);
root.addChild(title);`,
  },
  {
    id: "container-group",
    label: "Gruppo (Container)",
    hint: "Container",
    code: `const group = new PIXI.Container();
group.label = "myGroup";
const chip = new PIXI.Graphics();
chip.roundRect(-40, -16, 80, 32, 8);
chip.fill(0x22c55e);
group.addChild(chip);
const tag = new PIXI.Text({
  text: "OK",
  style: { fill: 0xffffff, fontSize: 14, fontWeight: "600" },
});
tag.anchor.set(0.5);
group.addChild(tag);
root.addChild(group);`,
  },
  {
    id: "sprite-url",
    label: "Sprite (immagine URL)",
    hint: "Async — Assets",
    code: `// Caricamento async (sprite compare dopo il load)
void (async () => {
  const url = "https://pixijs.com/assets/bunny.png";
  const texture = await PIXI.Assets.load(url);
  const bunny = new PIXI.Sprite(texture);
  bunny.anchor.set(0.5);
  bunny.scale.set(1.5);
  root.addChild(bunny);
})();`,
  },
  {
    id: "grid-dots",
    label: "Griglia di punti",
    hint: "Graphics loop",
    code: `const grid = new PIXI.Graphics();
const step = 48;
const cols = 7;
const rows = 5;
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const x = (col - (cols - 1) / 2) * step;
    const y = (row - (rows - 1) / 2) * step;
    grid.circle(x, y, 4);
  }
}
grid.fill(0xffffff, 0.35);
root.addChild(grid);`,
  },
  {
    id: "yellow-drops",
    label: "Gocce gialle (pioggia)",
    hint: "Ticker + Graphics",
    code: YELLOW_DROPS_PIXI_SCENE,
    replaceScene: true,
  },
];

export function appendPixiPresetCode(
  currentScene: string | undefined,
  presetCode: string
): string {
  const base = currentScene?.trim() ?? "";
  if (!base) return presetCode;
  return `${base}\n\n${presetCode}`;
}

export function applyPixiPresetCode(
  currentScene: string | undefined,
  preset: PixiScenePreset
): string {
  if (preset.replaceScene) return preset.code;
  return appendPixiPresetCode(currentScene, preset.code);
}
/**
 * Preset UI: stringa scena per preset Pixi.
 * Per copia/incolla nel layer usa yellow-drops.scene.js (solo JS, senza export).
 */
export const YELLOW_DROPS_PIXI_SCENE = `function createYellowDrops(PIXI, app, root, layerId) {
  const w = app.screen.width;
  const h = app.screen.height;
  const halfW = w / 2;
  const halfH = h / 2;
  const ground = -halfH + h * 0.82;

  const layer = new PIXI.Container();
  layer.name = layerId;
  root.addChild(layer);

  const drops = [];
  let spawnTimer = 0;

  const CONFIG = {
    color: 0xffcc00,
    gravity: 0.35,
    minSpeed: 3,
    maxSpeed: 7,
    minSize: 5,
    maxSize: 13,
    spawnRate: 0.12,
  };

  function drawEllipse(graphics, color) {
    graphics.clear();
    if (graphics.ellipse && graphics.fill) {
      graphics.ellipse(0, 0, 1, 1).fill(color);
    } else {
      graphics.beginFill(color).drawEllipse(0, 0, 1, 1).endFill();
    }
  }

  function createDrop() {
    const graphics = new PIXI.Graphics();
    drawEllipse(graphics, CONFIG.color);

    const radius =
      CONFIG.minSize +
      Math.random() * (CONFIG.maxSize - CONFIG.minSize);

    graphics.scale.set(radius);
    graphics.x = Math.random() * w - halfW;
    graphics.y = -halfH - 20;

    layer.addChild(graphics);

    drops.push({
      graphics,
      x: graphics.x,
      y: graphics.y,
      radius,
      velocity:
        CONFIG.minSpeed +
        Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed),
      state: "falling",
      impactTime: 0,
      splash: null,
    });
  }

  function createSplash(drop) {
    const splash = new PIXI.Graphics();
    drawEllipse(splash, CONFIG.color);
    splash.x = drop.x;
    splash.y = ground;
    splash.scale.set(drop.radius * 1.5, 1);
    layer.addChild(splash);
    return splash;
  }

  function update(ticker) {
    const dt = Math.min(ticker.deltaTime, 2);
    spawnTimer += dt;
    if (spawnTimer >= CONFIG.spawnRate * 60) {
      spawnTimer = 0;
      createDrop();
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      const g = drop.graphics;

      if (drop.state === "falling") {
        drop.velocity += CONFIG.gravity * dt;
        drop.y += drop.velocity * dt;

        const stretch = Math.min(2.8, 1 + drop.velocity * 0.08);
        g.scale.set(drop.radius / stretch, drop.radius * stretch);
        g.x = drop.x;
        g.y = drop.y;

        if (drop.y + drop.radius >= ground) {
          drop.y = ground - drop.radius;
          drop.state = "squash";
          drop.impactTime = 0;
          drop.splash = createSplash(drop);
        }
      } else if (drop.state === "squash") {
        drop.impactTime += dt;
        const t = Math.min(drop.impactTime / 8, 1);

        const squashX = 1 + Math.sin(t * Math.PI) * 1.5;
        const squashY = 1 - Math.sin(t * Math.PI) * 0.85;

        g.scale.set(drop.radius * squashX, drop.radius * squashY);
        g.x = drop.x;
        g.y = ground - drop.radius * squashY;

        if (drop.splash) {
          drop.splash.scale.set(
            drop.radius * (1 + t * 3),
            Math.max(0.2, 1 - t * 0.7)
          );
          drop.splash.alpha = 1 - t;
        }

        if (t >= 1) {
          layer.removeChild(g);
          g.destroy({ children: true });
          if (drop.splash) {
            layer.removeChild(drop.splash);
            drop.splash.destroy({ children: true });
          }
          drops.splice(i, 1);
        }
      }
    }
  }

  app.ticker.add(update);

  return {
    destroy() {
      app.ticker.remove(update);
      layer.destroy({ children: true });
      drops.length = 0;
    },
  };
}

createYellowDrops(PIXI, app, root, layerId);
`;
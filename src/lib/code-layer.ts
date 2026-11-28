import type { AnimationTarget } from "@/stores/timeline-store";

export const DEFAULT_CODE_HTML =
  '<div class="p-4 rounded border border-white/20 text-center">Contenuto HTML</div>';

export const DEFAULT_CODE_JS = `// root = elemento del layer, layerId = id del layer
// Esempio: root.querySelector("h1")?.textContent = "Ciao";
`;

export function runCodeLayerScript(
  root: HTMLElement,
  layerId: string,
  source: string
): void {
  const trimmed = source.trim();
  if (!trimmed) return;
  try {
    const fn = new Function("root", "layerId", trimmed);
    fn(root, layerId);
  } catch (err) {
    console.error("[code layer]", layerId, err);
  }
}

function escapeScriptBody(source: string): string {
  return source.replace(/<\/script/gi, "<\\/script");
}

export function codeLayerMarkupInner(target: AnimationTarget): string {
  const html = target.codeHtml?.trim() || DEFAULT_CODE_HTML;
  return html;
}

export function buildCodeLayerScriptBlocks(targets: AnimationTarget[]): string {
  const blocks: string[] = [];
  for (const target of targets) {
    if (target.type !== "code") continue;
    const js = target.codeJs?.trim();
    if (!js) continue;
    const safeJs = escapeScriptBody(js);
    const idJson = JSON.stringify(target.id);
    blocks.push(
      `(function () {
  var layerId = ${idJson};
  var root = document.querySelector('[data-preview-target="' + layerId + '"]');
  if (!root) return;
  try {
${safeJs}
  } catch (e) { console.error("[code layer]", layerId, e); }
})();`
    );
  }
  return blocks.join("\n");
}
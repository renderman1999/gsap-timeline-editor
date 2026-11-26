# Preset Blender per GSAP Timeline Editor

Addon in `gsap_timeline_editor_preset/` per preparare modelli **GLB** compatibili con l’editor (Three.js / R3F, ombre, override materiali per mesh).

## Installazione

1. In Blender: **Edit → Preferences → Add-ons → Install…**
2. Scegli la cartella `blender/gsap_timeline_editor_preset` (oppure comprimila in `.zip` con solo quella cartella dentro).
3. Attiva **Import-Export: GSAP Timeline Editor – GLB Preset**.

## Utilizzo

1. Nel **Viewport 3D**, pannello laterale (**N**) → tab **GSAP**.
2. **Prepara per GSAP Editor** (oggetti selezionati):
   - applica loc/rot/scale;
   - rinomina mesh in modo leggibile;
   - converte i materiali verso **Principled BSDF** (PBR per shadow map).
3. Opzionale: **Materiale preset prodotto** (grigio neutro, roughness ~0.55).
4. **Export GLB (preset GSAP)** → salva il `.glb` e caricalo nell’editor con *Carica modello*.

## Materiali consigliati in Blender

- Shader **Principled BSDF** (non Shadeless / solo Emission per il corpo).
- **Metallic** e **Roughness** impostati (l’editor può sovrascriverli per mesh).
- Nomi oggetto/mesh chiari (`Body`, `Logo`, …) per il pannello *Materiali per mesh*.

## Script senza addon

Apri **Scripting**, incolla e esegui il contenuto di `gsap_timeline_editor_preset/__init__.py`, poi usa la tab **GSAP** nel sidebar.
# SPDX-License-Identifier: MIT
# Preset Blender per export GLB compatibile con GSAP Timeline Editor (Three.js / R3F)

bl_info = {
    "name": "GSAP Timeline Editor – GLB Preset",
    "author": "GSAP Timeline Editor",
    "version": (1, 0, 0),
    "blender": (4, 2, 0),
    "location": "View3D > Sidebar > GSAP",
    "description": "Prepara mesh/materiali Principled BSDF ed esporta GLB per l'editor",
    "category": "Import-Export",
}

import bpy
from bpy.props import BoolProperty, StringProperty
from bpy.types import Operator, Panel

PRINCIPLED = "ShaderNodeBsdfPrincipled"


def _active_principled(mat: bpy.types.Material) -> bpy.types.Node | None:
    if not mat.use_nodes or not mat.node_tree:
        return None
    out = next(
        (n for n in mat.node_tree.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output),
        None,
    )
    if not out or not out.inputs["Surface"].links:
        return None
    src = out.inputs["Surface"].links[0].from_node
    if src.type == "BSDF_PRINCIPLED":
        return src
    if src.type == "MIX_SHADER" or src.type == "ADD_SHADER":
        for link in src.inputs:
            if link.links:
                n = link.links[0].from_node
                if n.type == "BSDF_PRINCIPLED":
                    return n
    return None


def ensure_principled_material(mat: bpy.types.Material) -> None:
    mat.use_nodes = True
    tree = mat.node_tree
    if not tree:
        return
    nodes = tree.nodes
    links = tree.links
    princ = _active_principled(mat)
    if princ:
        # Valori consigliati per Three.js MeshStandardMaterial + ombre
        if "Specular IOR Level" in princ.inputs:
            princ.inputs["Specular IOR Level"].default_value = 0.5
        elif "Specular" in princ.inputs:
            princ.inputs["Specular"].default_value = 0.5
        princ.inputs["Roughness"].default_value = min(
            1.0, max(0.0, princ.inputs["Roughness"].default_value)
        )
        princ.inputs["Metallic"].default_value = min(
            1.0, max(0.0, princ.inputs["Metallic"].default_value)
        )
        return

    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    princ = nodes.new("ShaderNodeBsdfPrincipled")
    princ.location = (0, 0)
    princ.label = "GSAP PBR"
    princ.inputs["Roughness"].default_value = 0.55
    princ.inputs["Metallic"].default_value = 0.0
    links.new(princ.outputs["BSDF"], out.inputs["Surface"])


def prepare_mesh_names(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    data = obj.data
    base = obj.name.split(".")[0].strip() or "Mesh"
    if not data.name or data.name.startswith("Mesh"):
        data.name = base
    obj.name = base


def gsap_gltf_export_kwargs(filepath: str) -> dict:
    """Parametri export glTF allineati a Three.js / editor."""
    return {
        "filepath": filepath,
        "export_format": "GLB",
        "use_selection": False,
        "use_visible": True,
        "use_renderable": True,
        "use_active_collection_with_nested": True,
        "export_apply": True,
        "export_texcoords": True,
        "export_normals": True,
        "export_tangents": True,
        "export_colors": True,
        "export_attributes": True,
        "export_materials": "EXPORT",
        "export_image_format": "AUTO",
        "export_cameras": False,
        "export_lights": False,
        "export_extras": False,
        "export_yup": True,
        "export_gn_mesh": True,
        "export_animations": True,
        "export_animation_mode": "ACTIONS",
        "export_frame_range": False,
        "export_skins": True,
        "export_morph": True,
        "export_lights_punctual": False,
        "export_try_sparse_sk": True,
        "export_try_omit_sparse_sk": False,
    }


class GSAPEditorPrepare(Operator):
    bl_idname = "gsap_editor.prepare"
    bl_label = "Prepara per GSAP Editor"
    bl_description = (
        "Applica scale/rot/pos, rinominia mesh, forza Principled BSDF (PBR per ombre)"
    )
    bl_options = {"REGISTER", "UNDO"}

    apply_transforms: BoolProperty(
        name="Applica transform",
        default=True,
        description="Ctrl+A equivalente su oggetti selezionati",
    )

    @classmethod
    def poll(cls, context):
        return context.selected_objects

    def execute(self, context):
        saved = context.view_layer.objects.active
        for obj in context.selected_objects:
            context.view_layer.objects.active = obj
            if self.apply_transforms:
                bpy.ops.object.transform_apply(
                    location=True, rotation=True, scale=True
                )
            prepare_mesh_names(obj)
            if obj.type == "MESH":
                for slot in obj.material_slots:
                    if slot.material:
                        ensure_principled_material(slot.material)
        context.view_layer.objects.active = saved
        self.report({"INFO"}, "Oggetti pronti per export GLB (Principled PBR)")
        return {"FINISHED"}


class GSAPEditorExportGLB(Operator):
    bl_idname = "gsap_editor.export_glb"
    bl_label = "Export GLB (preset GSAP)"
    bl_description = "Esporta con impostazioni glTF per GSAP Timeline Editor"
    bl_options = {"REGISTER"}

    filepath: StringProperty(subtype="FILE_PATH")

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {"RUNNING_MODAL"}

    def execute(self, context):
        path = bpy.path.ensure_ext(self.filepath, ".glb")
        kw = gsap_gltf_export_kwargs(path)
        try:
            bpy.ops.export_scene.gltf(**kw)
        except TypeError:
            # Blender 5.x: rimuovi chiavi non supportate
            for key in (
                "export_gn_mesh",
                "export_animation_mode",
                "export_try_sparse_sk",
                "export_try_omit_sparse_sk",
                "export_lights_punctual",
            ):
                kw.pop(key, None)
            bpy.ops.export_scene.gltf(**kw)
        self.report({"INFO"}, f"GLB esportato: {path}")
        return {"FINISHED"}


class GSAPEditorApplyMaterialPreset(Operator):
    bl_idname = "gsap_editor.material_preset"
    bl_label = "Materiale preset prodotto"
    bl_description = "Principled: roughness 0.55, metallic 0, bianco neutro"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return context.active_object and context.active_object.type == "MESH"

    def execute(self, context):
        obj = context.active_object
        mat = bpy.data.materials.get("GSAP_Product") or bpy.data.materials.new(
            "GSAP_Product"
        )
        ensure_principled_material(mat)
        princ = _active_principled(mat)
        if princ:
            princ.inputs["Base Color"].default_value = (0.85, 0.85, 0.88, 1.0)
            princ.inputs["Roughness"].default_value = 0.55
            princ.inputs["Metallic"].default_value = 0.08
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
        self.report({"INFO"}, "Materiale GSAP_Product applicato")
        return {"FINISHED"}


class VIEW3D_PT_gsap_editor(Panel):
    bl_label = "GSAP Timeline Editor"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "GSAP"

    def draw(self, context):
        layout = self.layout
        layout.label(text="Export per editor WebGL")
        layout.operator("gsap_editor.prepare", icon="OBJECT_DATA")
        layout.operator("gsap_editor.material_preset", icon="MATERIAL")
        layout.separator()
        layout.operator("gsap_editor.export_glb", icon="EXPORT")
        layout.label(text="Usa Principled BSDF; ombre in editor", icon="INFO")


classes = (
    GSAPEditorPrepare,
    GSAPEditorExportGLB,
    GSAPEditorApplyMaterialPreset,
    VIEW3D_PT_gsap_editor,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
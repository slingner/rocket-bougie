#!/Users/scottlingner/Documents/rbc-venv/bin/python3
"""
RBC Template Replacer

Browse or drag in images, pick a preset or individual templates, click Run.
Outputs <1MB PNGs to TEMPLATES_DIR/final_png/

Run: python ps_smart_replace.py
"""

import os
import sys

# If Pillow isn't available, re-exec using the venv Python which has it
_VENV_PYTHON = os.path.expanduser("~/Documents/rbc-venv/bin/python3")
try:
    from PIL import Image as _pil_check  # noqa
except ImportError:
    if os.path.exists(_VENV_PYTHON) and sys.executable != _VENV_PYTHON:
        os.execv(_VENV_PYTHON, [_VENV_PYTHON] + sys.argv)

import json
import glob
import subprocess
import tempfile
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext, messagebox

# ── Config ────────────────────────────────────────────────────────────────────
TEMPLATES_DIR = Path.home() / "Documents" / "RBC TEMPLATES"
PRESETS_FILE  = TEMPLATES_DIR / "presets.json"
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_PRESETS = {
    "8x10 / 11x14 Vertical": [],
    "Mini Print Vertical":    [],
    "Mini Print Horizontal":  [],
}

# Enable drag-and-drop if tkinterdnd2 is installed
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    TkBase = TkinterDnD.Tk
    HAS_DND = True
except ImportError:
    TkBase = tk.Tk
    HAS_DND = False


def load_presets() -> dict:
    if PRESETS_FILE.exists():
        return json.loads(PRESETS_FILE.read_text())
    return DEFAULT_PRESETS.copy()


def save_presets(presets: dict) -> None:
    PRESETS_FILE.write_text(json.dumps(presets, indent=2))


def find_photoshop() -> str:
    candidates = sorted(
        glob.glob("/Applications/Adobe Photoshop */Adobe Photoshop *.app"),
        reverse=True,
    )
    if not candidates:
        raise RuntimeError("Adobe Photoshop not found in /Applications")
    return candidates[0]


def build_jsx(template: Path, image: Path, output: Path) -> str:
    def esc(p: Path) -> str:
        return str(p).replace("\\", "/").replace('"', '\\"')

    return f"""\
// Close stale open instance if present
for (var i = app.documents.length - 1; i >= 0; i--) {{
    try {{
        if (app.documents[i].fullName.toString() === "{esc(template)}") {{
            app.documents[i].close(SaveOptions.DONOTSAVECHANGES);
            break;
        }}
    }} catch(e) {{}}
}}

var doc = app.open(new File("{esc(template)}"));

function findSmartObject(layers) {{
    for (var i = 0; i < layers.length; i++) {{
        var l = layers[i];
        if (l.kind === LayerKind.SMARTOBJECT) return l;
        if (l.typename === "LayerSet") {{
            var found = findSmartObject(l.layers);
            if (found) return found;
        }}
    }}
    return null;
}}

var so = findSmartObject(doc.layers);
if (!so) {{
    doc.close(SaveOptions.DONOTSAVECHANGES);
    throw new Error("No smart object found in: {esc(template)}");
}}

// Open the smart object for editing (keeps all parent transforms intact)
doc.activeLayer = so;
executeAction(stringIDToTypeID("placedLayerEditContents"), new ActionDescriptor(), DialogModes.NO);

var soDoc = app.activeDocument;
var origUnits = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;

var canvasW = soDoc.width.value;
var canvasH = soDoc.height.value;

// Place the new image into the smart object canvas
var placeDesc = new ActionDescriptor();
placeDesc.putPath(charIDToTypeID("null"), new File("{esc(image)}"));
executeAction(charIDToTypeID("Plc "), placeDesc, DialogModes.NO);

// Commit free-transform if PS left the layer in transform mode
try {{ executeAction(charIDToTypeID("Cmmt"), new ActionDescriptor(), DialogModes.NO); }} catch(e) {{}}

// Re-grab active layer — PS sets it to the placed layer after Plc
var placedLayer = soDoc.activeLayer;
var b = placedLayer.bounds;
var layerW = b[2].value - b[0].value;
var layerH = b[3].value - b[1].value;

// Scale proportionally to cover 102% of the smart object canvas
var scale = Math.max((canvasW * 1.02) / layerW, (canvasH * 1.02) / layerH) * 100;
placedLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

// Center on canvas
var b2 = placedLayer.bounds;
var lCX = (b2[0].value + b2[2].value) / 2;
var lCY = (b2[1].value + b2[3].value) / 2;
placedLayer.translate(canvasW / 2 - lCX, canvasH / 2 - lCY);

app.preferences.rulerUnits = origUnits;

// Save and close smart object — returns focus to parent doc
soDoc.close(SaveOptions.SAVECHANGES);

var doc = app.activeDocument;

// Export as PNG
var outputFile = new File("{esc(output)}");
var pngOpts = new PNGSaveOptions();
pngOpts.compression = 6;
pngOpts.interlaced = false;
doc.saveAs(outputFile, pngOpts, true, Extension.LOWERCASE);

doc.close(SaveOptions.DONOTSAVECHANGES);
"""


def run_jsx(jsx_code: str, ps_app: str) -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsx", delete=False) as f:
        f.write(jsx_code)
        jsx_path = f.name
    try:
        applescript = f"""tell application "{ps_app}"
    activate
    do javascript "$.evalFile(new File(\\"{jsx_path}\\"));"
end tell
"""
        result = subprocess.run(["osascript", "-e", applescript], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    finally:
        os.unlink(jsx_path)


def ensure_under_1mb(png: Path) -> str:
    size = png.stat().st_size
    if size <= 1_000_000:
        return f"{size // 1024} KB"
    try:
        from PIL import Image
    except ImportError:
        return f"{size // 1024} KB (Pillow not found — install it to auto-resize)"
    img = Image.open(png)
    w, h = img.size
    TARGET = 900_000
    scale = (TARGET / size) ** 0.5
    for _ in range(8):
        new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
        img.resize(new_size, Image.LANCZOS).save(png, "PNG", optimize=True, compress_level=9)
        result = png.stat().st_size
        if 800_000 <= result <= 1_000_000:
            break
        scale *= (TARGET / result) ** 0.5
        scale = min(scale, 0.99)
    return f"{png.stat().st_size // 1024} KB (resized)"


# ── Preset Editor ─────────────────────────────────────────────────────────────

class PresetEditor(tk.Toplevel):
    def __init__(self, parent: "App"):
        super().__init__(parent)
        self.parent = parent
        self.title("Edit Presets")
        self.resizable(False, False)
        self.grab_set()
        self.presets: dict = load_presets()
        self.editing_name: str | None = None
        self.templates = sorted(TEMPLATES_DIR.glob("*.psd"))
        self.tpl_vars: dict[str, tk.BooleanVar] = {}
        self._build_ui()
        self._refresh_list()

    def _build_ui(self):
        left = ttk.Frame(self, padding=10)
        left.pack(side="left", fill="y")

        ttk.Label(left, text="Presets").pack(anchor="w")
        self.listbox = tk.Listbox(left, width=26, height=12, selectmode="single")
        self.listbox.pack(fill="y", expand=True)
        self.listbox.bind("<<ListboxSelect>>", self._on_select)

        btn_row = ttk.Frame(left)
        btn_row.pack(fill="x", pady=(6, 0))
        ttk.Button(btn_row, text="New",    command=self._new).pack(side="left", padx=2)
        ttk.Button(btn_row, text="Delete", command=self._delete).pack(side="left", padx=2)

        right = ttk.Frame(self, padding=10)
        right.pack(side="left", fill="both", expand=True)

        ttk.Label(right, text="Preset name").pack(anchor="w")
        self.name_var = tk.StringVar()
        ttk.Entry(right, textvariable=self.name_var, width=36).pack(fill="x", pady=(0, 10))

        ttk.Label(right, text="Templates to include").pack(anchor="w")
        tpl_frame = ttk.Frame(right)
        tpl_frame.pack(fill="both", expand=True)

        for tpl in self.templates:
            var = tk.BooleanVar(value=False)
            self.tpl_vars[tpl.name] = var
            ttk.Checkbutton(tpl_frame, text=tpl.name, variable=var).pack(anchor="w")

        ttk.Button(right, text="Save preset", command=self._save_preset).pack(pady=(12, 0))

    def _refresh_list(self):
        self.listbox.delete(0, "end")
        for name in self.presets:
            self.listbox.insert("end", name)

    def _on_select(self, _=None):
        sel = self.listbox.curselection()
        if not sel:
            return
        name = self.listbox.get(sel[0])
        self.editing_name = name
        self.name_var.set(name)
        checked = self.presets.get(name, [])
        for tpl_name, var in self.tpl_vars.items():
            var.set(tpl_name in checked)

    def _new(self):
        self.editing_name = None
        self.listbox.selection_clear(0, "end")
        self.name_var.set("New Preset")
        for var in self.tpl_vars.values():
            var.set(False)

    def _save_preset(self):
        name = self.name_var.get().strip()
        if not name:
            messagebox.showwarning("No name", "Enter a preset name.", parent=self)
            return
        checked = [tpl_name for tpl_name, var in self.tpl_vars.items() if var.get()]
        if self.editing_name and self.editing_name != name and self.editing_name in self.presets:
            del self.presets[self.editing_name]
        self.presets[name] = checked
        self.editing_name = name
        save_presets(self.presets)
        self._refresh_list()
        self.parent._reload_presets()

    def _delete(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        name = self.listbox.get(sel[0])
        if messagebox.askyesno("Delete", f"Delete preset '{name}'?", parent=self):
            del self.presets[name]
            save_presets(self.presets)
            self._refresh_list()
            self.editing_name = None
            self.name_var.set("")
            for var in self.tpl_vars.values():
                var.set(False)
            self.parent._reload_presets()


# ── Main App ──────────────────────────────────────────────────────────────────

class App(TkBase):
    def __init__(self):
        super().__init__()
        self.title("RBC Template Replacer")
        self.resizable(False, False)
        self.image_paths: list[Path] = []
        self.template_vars: dict[Path, tk.BooleanVar] = {}
        self.preset_buttons: list[ttk.Button] = []
        self._build_ui()
        self._load_templates()
        self._reload_presets()

    def _build_ui(self):
        pad = {"padx": 12, "pady": 6}

        # ── Image queue ──────────────────────────────────────────────────────
        img_outer = ttk.LabelFrame(self, text="Art Queue", padding=10)
        img_outer.pack(fill="x", **pad)

        # Listbox + scrollbar
        list_frame = ttk.Frame(img_outer)
        list_frame.pack(fill="x", expand=True)

        self.queue_listbox = tk.Listbox(list_frame, height=4, selectmode="extended")
        self.queue_listbox.pack(side="left", fill="x", expand=True)

        sb = ttk.Scrollbar(list_frame, orient="vertical", command=self.queue_listbox.yview)
        sb.pack(side="left", fill="y")
        self.queue_listbox.config(yscrollcommand=sb.set)

        # Buttons row
        btn_row = ttk.Frame(img_outer)
        btn_row.pack(fill="x", pady=(6, 0))

        drop_text = "Drop images here  —  or  —" if HAS_DND else ""
        if drop_text:
            ttk.Label(btn_row, text=drop_text, foreground="#888").pack(side="left", padx=(0, 8))
        ttk.Button(btn_row, text="Add…",        command=self._browse).pack(side="left", padx=(0, 4))
        ttk.Button(btn_row, text="Remove selected", command=self._remove_selected).pack(side="left", padx=(0, 4))
        ttk.Button(btn_row, text="Clear all",   command=self._clear_queue).pack(side="left")

        if HAS_DND:
            self.queue_listbox.drop_target_register(DND_FILES)
            self.queue_listbox.dnd_bind("<<Drop>>", self._on_drop)

        # ── Presets ──────────────────────────────────────────────────────────
        preset_outer = ttk.LabelFrame(self, text="Presets", padding=10)
        preset_outer.pack(fill="x", **pad)

        self.preset_btn_frame = ttk.Frame(preset_outer)
        self.preset_btn_frame.pack(side="left", fill="x", expand=True)

        ttk.Button(preset_outer, text="Edit Presets", command=self._open_preset_editor).pack(side="right")

        # ── Templates ────────────────────────────────────────────────────────
        tpl_outer = ttk.LabelFrame(self, text="Templates", padding=10)
        tpl_outer.pack(fill="both", expand=True, **pad)

        self.tpl_frame = ttk.Frame(tpl_outer)
        self.tpl_frame.pack(fill="both", expand=True)

        self.select_all_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            tpl_outer, text="Select all", variable=self.select_all_var,
            command=self._toggle_all,
        ).pack(anchor="w", pady=(8, 0))

        # ── Run + log ────────────────────────────────────────────────────────
        self.run_btn = ttk.Button(self, text="Run", command=self._run)
        self.run_btn.pack(**pad)

        self.log = scrolledtext.ScrolledText(
            self, height=8, state="disabled", font=("Menlo", 11),
        )
        self.log.pack(fill="both", expand=True, padx=12, pady=(0, 12))

    def _load_templates(self):
        templates = sorted(TEMPLATES_DIR.glob("*.psd"))
        if not templates:
            self._log(f"No .psd files found in:\n{TEMPLATES_DIR}")
            return
        for tpl in templates:
            var = tk.BooleanVar(value=False)
            self.template_vars[tpl] = var
            ttk.Checkbutton(self.tpl_frame, text=tpl.name, variable=var).pack(anchor="w")

    def _reload_presets(self):
        for btn in self.preset_buttons:
            btn.destroy()
        self.preset_buttons.clear()
        presets = load_presets()
        for name in presets:
            btn = ttk.Button(
                self.preset_btn_frame, text=name,
                command=lambda n=name: self._apply_preset(n),
            )
            btn.pack(side="left", padx=(0, 6))
            self.preset_buttons.append(btn)

    def _apply_preset(self, name: str):
        presets = load_presets()
        checked = presets.get(name, [])
        for tpl, var in self.template_vars.items():
            var.set(tpl.name in checked)
        self.select_all_var.set(False)

    def _open_preset_editor(self):
        PresetEditor(self)

    def _toggle_all(self):
        state = self.select_all_var.get()
        for var in self.template_vars.values():
            var.set(state)

    def _browse(self):
        paths = filedialog.askopenfilenames(
            title="Select images",
            filetypes=[("All files", "*.*")],
        )
        for p in paths:
            self._add_to_queue(Path(p))

    def _on_drop(self, event):
        raw = event.data.strip()
        # tkinterdnd2 wraps paths with spaces in braces; multiple files are space-separated
        paths = []
        while raw:
            if raw.startswith("{"):
                end = raw.index("}")
                paths.append(raw[1:end])
                raw = raw[end + 1:].strip()
            else:
                parts = raw.split(" ", 1)
                paths.append(parts[0])
                raw = parts[1].strip() if len(parts) > 1 else ""
        for p in paths:
            self._add_to_queue(Path(p))

    def _add_to_queue(self, path: Path):
        if path not in self.image_paths:
            self.image_paths.append(path)
            self.queue_listbox.insert("end", path.name)

    def _remove_selected(self):
        for i in reversed(self.queue_listbox.curselection()):
            self.queue_listbox.delete(i)
            self.image_paths.pop(i)

    def _clear_queue(self):
        self.queue_listbox.delete(0, "end")
        self.image_paths.clear()

    def _log(self, msg: str):
        self.log.config(state="normal")
        self.log.insert("end", msg + "\n")
        self.log.see("end")
        self.log.config(state="disabled")

    def _run(self):
        if not self.image_paths:
            self._log("No images in queue.")
            return
        selected = [tpl for tpl, var in self.template_vars.items() if var.get()]
        if not selected:
            self._log("No templates selected.")
            return
        self.run_btn.config(state="disabled")
        threading.Thread(target=self._process, args=(list(self.image_paths), selected), daemon=True).start()

    def _process(self, images: list[Path], templates: list[Path]):
        try:
            ps_app = find_photoshop()
        except RuntimeError as e:
            self._log(str(e))
            self.run_btn.config(state="normal")
            return

        output_dir = TEMPLATES_DIR / "final_png"
        output_dir.mkdir(exist_ok=True)
        self._log(f"Using: {Path(ps_app).stem}")
        self._log(f"Output: {output_dir}")
        self._log(f"{len(images)} image(s) × {len(templates)} template(s) = {len(images) * len(templates)} exports\n")

        for image in images:
            self._log(f"── {image.name}")
            for tpl in templates:
                out = output_dir / f"{tpl.stem}_{image.stem}.png"
                self._log(f"   {tpl.name}...")
                try:
                    run_jsx(build_jsx(tpl, image, out), ps_app)
                    if out.exists():
                        status = ensure_under_1mb(out)
                        self._log(f"   Saved: {out.name} ({status})")
                    else:
                        self._log("   Warning: output not created — check Photoshop for errors")
                except Exception as e:
                    self._log(f"   Error: {e}")

        self._log("\nDone.")
        self.run_btn.config(state="normal")


if __name__ == "__main__":
    app = App()
    app.mainloop()

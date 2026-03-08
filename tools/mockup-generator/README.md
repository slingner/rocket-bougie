# Mockup Generator

Automates placing artwork into Photoshop mockup templates and exporting each result as a PNG under 1MB.

## Requirements

- macOS
- Adobe Photoshop (2024 or newer) installed in `/Applications`
- Python 3 via Homebrew: `brew install python python-tk`
- A Python virtual environment with Pillow (one-time setup below)

## One-time setup

```bash
python3 -m venv ~/Documents/rbc-venv
source ~/Documents/rbc-venv/bin/activate
pip install Pillow
```

## Running

```bash
python3 ~/Documents/ps_smart_replace.py
```

No need to activate the venv each time — the script detects and uses it automatically.

## How it works

1. **Add images** to the art queue using the Add… button or by dragging files onto the list
2. **Select templates** individually or use a preset button
3. Click **Run** — the script will:
   - Open each selected PSD template in Photoshop
   - Find the smart object layer named `Click to change Art`
   - Place your image inside it, scaled to just slightly overflow the smart object canvas (102%) so there are no white edges
   - Export a flattened PNG
   - Resize it down to ~900KB if it's over 1MB
4. Outputs land in `RBC TEMPLATES/final_png/` named `templateName_imageName.png`

## Templates

PSD files live in `~/Documents/RBC TEMPLATES/`. Each template must have a Smart Object layer named **`Click to change Art`**.

The script searches all layers and layer groups automatically, so nesting structure doesn't matter.

## Presets

Presets let you check a group of templates with one click. Click **Edit Presets** to:
- Select a preset and check/uncheck which templates belong to it
- Rename or delete presets
- Create new ones

Presets are saved to `~/Documents/RBC TEMPLATES/presets.json`.

## Output

- Files are saved to `~/Documents/RBC TEMPLATES/final_png/`
- Each file is named `templateStem_imageStem.png`
- File size is kept under 1MB using Pillow — targets ~900KB
- Original PSD templates are never modified

## Troubleshooting

**"No smart object found"** — Make sure the smart object layer in your PSD is named exactly `Click to change Art`.

**"Adobe Photoshop not found"** — Photoshop must be installed in `/Applications`. The script finds the newest version automatically.

**Files over 1MB** — Make sure Pillow is installed in the venv (`pip install Pillow` after activating).

**Drag and drop not working** — Install tkinterdnd2: `pip install tkinterdnd2` in the venv.

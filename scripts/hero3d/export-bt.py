"""Build the hero textures from the bullet-time character sheet's face close-up.

Owner, 2026-10-19: the hero is the face close-up from his bullet-time character
sheet (brown fila cap, black glasses, white band-collar shirt), cut out on navy.
The previous plate (public/hero/king-base-2560.webp) is still built by export.py.

Source: public/hero/bt-face.png, the first panel of
ContentBrain/06-Drafts/bullet-time-bybit/REFERENCE/image_1.png (1672x941, the
largest copy that exists), cropped at x 0..491. Nothing is graded.

Steps (python -I scripts/hero3d/export-bt.py, from the repo root):
  1. cut-out: rembg 2.0.76, birefnet-portrait -> scripts/hero3d/bt-mask.png
  2. depth: Depth Anything V2 Base -> scripts/hero3d/bt-depth-raw.png (16-bit)
  3. the panel is upscaled 2x, padded with transparency to the old plate's
     landscape shape (so the head sits at the same size in the hero), and an
     oval fade rounds off the shoulders the panel cuts with straight edges.

Outputs (public/hero3d/, the names portrait.ts loads):
  quiv-color.webp / quiv-color-900.webp   the cut-out
  quiv-chrome.webp / quiv-chrome-900.webp the same image: the blob is a clear lens
  quiv-depth.png                          depth, dilated past the edge
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "public/hero/bt-face.png"
plate = Image.open(SRC).convert("RGB")

if not os.path.exists("scripts/hero3d/bt-mask.png"):
    from rembg import new_session, remove
    m = remove(plate, session=new_session("birefnet-portrait"), only_mask=True)
    m.save("scripts/hero3d/bt-mask.png")
if not os.path.exists("scripts/hero3d/bt-depth-raw.png"):
    from transformers import pipeline
    est = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Base-hf")
    d = np.asarray(est(plate)["predicted_depth"].squeeze().numpy(), dtype=float)
    d = (d - d.min()) / (d.max() - d.min())
    Image.fromarray((d * 65535).astype("uint16")).resize(plate.size, Image.BICUBIC).save("scripts/hero3d/bt-depth-raw.png")

S = 2  # upscale
im = plate.resize((plate.width * S, plate.height * S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 40, 2))
im = np.asarray(im).astype(float) / 255
mk = Image.open("scripts/hero3d/bt-mask.png").convert("L").resize((plate.width * S, plate.height * S), Image.LANCZOS)
m = np.asarray(mk.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))).astype(float) / 255
H0, W0 = m.shape
# round off the bust: the panel cuts his shoulders with straight edges, so an
# oval fade centred on the head turns them into soft shoulders on navy
yy, xx = np.mgrid[0:H0, 0:W0]
r = np.hypot((xx - W0 / 2) / (W0 * 0.62), (yy - H0 * 0.38) / (H0 * 0.75))
m = m * (1 - np.clip((r - 0.8) / 0.22, 0, 1)) ** 1.6

dr = Image.open("scripts/hero3d/bt-depth-raw.png").resize((W0, H0), Image.BICUBIC)
d = np.asarray(dr).astype(float) / 65535

# pad to the old plate's shape (1800x1336, aspect 1.347)
A = 1800 / 1336
Wp = int(round(H0 * A))
pad = (Wp - W0) // 2
rgba = np.zeros((H0, Wp, 4))
rgba[:, pad:pad + W0, :3] = im
rgba[:, pad:pad + W0, 3] = m
o = Image.fromarray((rgba * 255).astype("uint8"), "RGBA")
o.save("public/hero3d/quiv-color.webp", quality=92, method=6)
o.save("public/hero3d/quiv-chrome.webp", quality=92, method=6)
half = o.resize((Wp // 2, H0 // 2), Image.LANCZOS)
half.save("public/hero3d/quiv-color-900.webp", quality=90, method=6)
half.save("public/hero3d/quiv-chrome-900.webp", quality=90, method=6)

sub = m > 0.5
lo, hi = np.percentile(d[sub], 1), np.percentile(d[sub], 99.5)
dd = np.clip((d - lo) / (hi - lo), 0, 1)
idx = ndimage.distance_transform_edt(~sub, return_distances=False, return_indices=True)
filled = ndimage.gaussian_filter(dd[idx[0], idx[1]], 5.0)
dep = np.zeros((H0, Wp))
dep[:, pad:pad + W0] = filled
# carry the edge depth into the padding so silhouette triangles do not tear
dep[:, :pad] = filled[:, :1]
dep[:, pad + W0:] = filled[:, -1:]
Image.fromarray((dep * 255).astype("uint8"), "L").resize((Wp // 2, H0 // 2), Image.LANCZOS).save(
    "public/hero3d/quiv-depth.png", optimize=True
)
print("color", o.size, "half", half.size, "pad", pad)

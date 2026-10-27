"""Build the v3 hero textures from the current hero plate.

Source: public/hero/king-base-2560.webp (the hero photo, unchanged).
mask.png: rembg 2.0.76, model birefnet-portrait, run on a gamma 0.35 lifted
copy of the plate so the black top separates from the black backdrop.
depth-raw.png (16-bit): Depth Anything V2 Base (depth-anything/Depth-Anything-V2-Base-hf,
transformers pipeline), run on a gamma 0.5 lifted copy, normalised 0..1.

Outputs (public/hero3d/):
  quiv-color.webp      1800px RGBA: graded (gamma 0.62, +2% lift) cut-out
  quiv-color-900.webp  900px copy for phones and low-power devices
  quiv-depth.png       900px depth, subject-normalised, dilated past the edge
                       so silhouette triangles keep the subject's depth

Run: python -I scripts/hero3d/export.py  (from the repo root)
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

im = np.asarray(Image.open("public/hero/king-base-2560.webp").convert("RGB")).astype(float) / 255
mk = Image.open("scripts/hero3d/mask.png").convert("L").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
m = np.asarray(mk).astype(float) / 255
c = 0.02 + 0.98 * im ** 0.62
d = np.asarray(Image.open("scripts/hero3d/depth-raw.png")).astype(float) / 65535

ys, xs = np.where(m > 0.5)
pad = 40
x0, x1 = max(0, xs.min() - pad), min(im.shape[1], xs.max() + pad)
y0, y1 = max(0, ys.min() - pad), im.shape[0]

rgba = np.dstack([c, m])[y0:y1, x0:x1]
o = Image.fromarray((rgba * 255).astype("uint8"), "RGBA")
W = 1800
H = int(o.size[1] * W / o.size[0])
o = o.resize((W, H), Image.LANCZOS)
o.save("public/hero3d/quiv-color.webp", quality=90, method=6)
o.resize((900, H // 2), Image.LANCZOS).save("public/hero3d/quiv-color-900.webp", quality=88, method=6)

sub = m > 0.5
lo, hi = np.percentile(d[sub], 1), np.percentile(d[sub], 99.5)
dd = np.clip((d - lo) / (hi - lo), 0, 1)
idx = ndimage.distance_transform_edt(~sub, return_distances=False, return_indices=True)
filled = dd[idx[0], idx[1]]
# soft steps: the glasses rim is a hard edge in depth, and a hard step tears on a turn
filled = ndimage.gaussian_filter(filled, 5.0)
dep = filled[y0:y1, x0:x1]
Image.fromarray((dep * 255).astype("uint8"), "L").resize((900, H // 2), Image.LANCZOS).save(
    "public/hero3d/quiv-depth.png", optimize=True
)
print("color", o.size, "depth", (900, H // 2), "crop", (x0, x1, y0, y1))

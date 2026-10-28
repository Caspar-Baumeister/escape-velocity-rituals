#!/usr/bin/env python3
"""Swap the page photos in one step.

Usage:
  python3 tools/make_images.py ritual-1=/path/a.png ritual-2=/path/b.png ...
  python3 tools/make_images.py --defaults      (rebuild all slots from /home/claude/evr/assets/images)

Slots and what they show:
  ritual-1   card 01 Kühlen      (4:3)
  ritual-2   card 02 Hinlegen    (4:3)
  ritual-3   card 03 Schwitzen   (4:3)
  inside     large photo next to the spec list (4:5)
  flat       small photo inside the spec card (16:9)
  capsule    photo in the capsule panel (4:5)
  foot       photo in the footer panel (1:1)

Each slot is cropped to its aspect ratio (focus point optional: slot=path@fx,fy)
and written as a large and a small WebP into assets/img/. No code change needed.
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
SRC = "/home/claude/evr/assets/images"
SLOTS = {
    "ritual-1": ((1200, 900), (640, 480)),
    "ritual-2": ((1200, 900), (640, 480)),
    "ritual-3": ((1200, 900), (640, 480)),
    "inside": ((1200, 1500), (640, 800)),
    "flat": ((1200, 675), (640, 360)),
    "capsule": ((1200, 1500), (640, 800)),
    "foot": ((1000, 1000), (560, 560)),
}
DEFAULTS = {
    "ritual-1": "core_hand_4x5_v2.png@0.5,0.55",
    "ritual-2": "ugc_sauna_towel_4x5_v2.png@0.5,0.62",
    "ritual-3": "sauna_scene_3x2_v2.png@0.5,0.5",
    "inside": "core_macro_3x2_v2.png@0.47,0.5",
    "flat": "flatlay_1x1_v2.png@0.5,0.5",
    "capsule": "hero_open_2x3_v2.png@0.5,0.62",
    "foot": "hero_closed_3x2.png@0.5,0.5",
}


def crop_to(im, aspect, fx=0.5, fy=0.5):
    w, h = im.size
    if w / h > aspect:
        nw = int(round(h * aspect)); x = int((w - nw) * fx)
        return im.crop((x, 0, x + nw, h))
    nh = int(round(w / aspect)); y = int((h - nh) * fy)
    return im.crop((0, y, w, y + nh))


def build(slot, spec):
    path, fx, fy = spec, 0.5, 0.5
    if "@" in spec:
        path, f = spec.rsplit("@", 1)
        fx, fy = [float(v) for v in f.split(",")]
    if not os.path.isabs(path):
        path = os.path.join(SRC, path)
    big, small = SLOTS[slot]
    im = crop_to(Image.open(path).convert("RGB"), big[0] / big[1], fx, fy)
    im.resize(big, Image.LANCZOS).save(os.path.join(IMG, slot + ".webp"), "WEBP", quality=80, method=6)
    im.resize(small, Image.LANCZOS).save(os.path.join(IMG, slot + "-sm.webp"), "WEBP", quality=78, method=6)
    print("ok", slot)


def main(args):
    if not args:
        sys.exit(__doc__)
    os.makedirs(IMG, exist_ok=True)
    if args == ["--defaults"]:
        for k, v in DEFAULTS.items():
            build(k, v)
        return
    for arg in args:
        slot, spec = arg.split("=", 1)
        if slot not in SLOTS:
            sys.exit("unknown slot %s, use one of %s" % (slot, ", ".join(SLOTS)))
        build(slot, spec)


if __name__ == "__main__":
    main(sys.argv[1:])

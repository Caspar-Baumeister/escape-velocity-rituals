#!/usr/bin/env python3
"""Swap the page photos in one step.

Usage: python3 tools/make_images.py capsule-closed=/path/a.png core=/path/b.png ritual=/path/c.jpg

Each slot is centre cropped to its aspect ratio and written as a large and a
small WebP into assets/img/. The page needs no code change.
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
SLOTS = {
    "capsule-closed": ((1200, 1500), (600, 750)),
    "core": ((1200, 1200), (600, 600)),
    "ritual": ((1600, 1000), (800, 500)),
}


def crop_to(im, aspect, fx=0.5, fy=0.5):
    w, h = im.size
    if w / h > aspect:
        nw = int(round(h * aspect)); x = int((w - nw) * fx)
        return im.crop((x, 0, x + nw, h))
    nh = int(round(w / aspect)); y = int((h - nh) * fy)
    return im.crop((0, y, w, y + nh))


def main(args):
    if not args:
        sys.exit(__doc__)
    os.makedirs(IMG, exist_ok=True)
    for arg in args:
        slot, path = arg.split("=", 1)
        if slot not in SLOTS:
            sys.exit("unknown slot %s, use one of %s" % (slot, ", ".join(SLOTS)))
        big, small = SLOTS[slot]
        im = crop_to(Image.open(path).convert("RGB"), big[0] / big[1])
        im.resize(big, Image.LANCZOS).save(os.path.join(IMG, slot + ".webp"), "WEBP", quality=80, method=6)
        im.resize(small, Image.LANCZOS).save(os.path.join(IMG, slot + "-sm.webp"), "WEBP", quality=78, method=6)
        print("ok", slot)


if __name__ == "__main__":
    main(sys.argv[1:])

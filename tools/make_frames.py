#!/usr/bin/env python3
"""Turn a folder of PNG/JPG frames into the web frame sets + manifest.

Usage: python3 tools/make_frames.py <frames_dir> [--count 120]

Writes assets/frames/desktop/f_000.webp ... (1600x900, cover crop 16:9),
assets/frames/mobile/f_000.webp ... (720x720, centre square crop) and
assets/frames/manifest.json. The manifest background is sampled from the
corners of the first frame so the canvas fill matches the footage.
"""
import argparse, json, os, shutil, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "frames")


def crop_to(im, aspect):
    w, h = im.size
    if w / h > aspect:
        nw = int(round(h * aspect)); x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(round(w / aspect)); y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


_masks = {}


def fit(im, size, pad, bg):
    """Resize to size. With pad < 1 the footage shrinks and its edges melt into the background."""
    if pad >= 0.999:
        return im.resize(size, Image.LANCZOS)
    W, H = size
    w, h = int(W * pad), int(H * pad)
    small = im.resize((w, h), Image.LANCZOS)
    if (w, h) not in _masks:
        m = Image.new("L", (w, h), 0)
        px = m.load()
        e = 0.18
        for y in range(h):
            for x in range(w):
                dx = min(x / w, 1 - x / w) / e
                dy = min(y / h, 1 - y / h) / e
                px[x, y] = int(255 * max(0, min(1, min(dx, dy))) ** 1.5)
        _masks[(w, h)] = m
    canvas = Image.new("RGB", size, bg)
    canvas.paste(small, ((W - w) // 2, (H - h) // 2), _masks[(w, h)])
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--count", type=int, default=120)
    ap.add_argument("--q-desktop", type=int, default=72)
    ap.add_argument("--q-mobile", type=int, default=70)
    ap.add_argument("--pad", type=float, default=1.0, help="shrink the footage inside the frame, e.g. 0.8 gives the object more room")
    a = ap.parse_args()

    files = sorted(f for f in os.listdir(a.src) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    if not files:
        sys.exit("no frames found in " + a.src)
    n = min(a.count, len(files))
    pick = [files[round(i * (len(files) - 1) / max(1, n - 1))] for i in range(n)]

    for sub in ("desktop", "mobile"):
        d = os.path.join(OUT, sub)
        if os.path.isdir(d):
            shutil.rmtree(d)
        os.makedirs(d)

    bg = None
    for i, f in enumerate(pick):
        im = Image.open(os.path.join(a.src, f)).convert("RGB")
        if bg is None:
            w, h = im.size
            pts = [im.getpixel((4, 4)), im.getpixel((w - 5, 4)), im.getpixel((4, h - 5)), im.getpixel((w - 5, h - 5))]
            bg = "#%02x%02x%02x" % tuple(sum(p[k] for p in pts) // 4 for k in range(3))
        fit(crop_to(im, 16 / 9), (1600, 900), a.pad, bg).save(
            os.path.join(OUT, "desktop", "f_%03d.webp" % i), "WEBP", quality=a.q_desktop, method=6)
        fit(crop_to(im, 1), (720, 720), a.pad, bg).save(
            os.path.join(OUT, "mobile", "f_%03d.webp" % i), "WEBP", quality=a.q_mobile, method=6)

    manifest = {
        "version": 1,
        "background": bg,
        "sets": {
            "desktop": {"count": n, "width": 1600, "height": 900, "pattern": "desktop/f_{i}.webp", "pad": 3},
            "mobile": {"count": n, "width": 720, "height": 720, "pattern": "mobile/f_{i}.webp", "pad": 3},
        },
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
    print("frames:", n, "background:", bg, "total MB: %.1f" % (total / 1e6))


if __name__ == "__main__":
    main()

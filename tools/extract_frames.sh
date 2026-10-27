#!/usr/bin/env bash
# Turn any video (for example the Gemini clip) into the scroll frames for the hero.
#
#   tools/extract_frames.sh <video.mp4> [count=120] [start_seconds=0] [end_seconds=end] [pad=1]
#
# Example: tools/extract_frames.sh ~/Downloads/capsule.mp4 120 0.3 7.8 0.82
# pad < 1 shrinks the footage so the capsule gets more room (edges fade into the background).
# Needs ffmpeg and python3 with Pillow. Writes assets/frames/{desktop,mobile}/ and manifest.json.
set -euo pipefail

SRC="${1:?usage: extract_frames.sh <video> [count] [start] [end]}"
COUNT="${2:-120}"
START="${3:-0}"
END="${4:-}"
PAD="${5:-1}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ -z "$END" ]; then
  END="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$SRC")"
fi
DUR="$(python3 -c "print(max(0.1, float('$END') - float('$START')))")"
# a little oversampling, make_frames.py then picks exactly COUNT evenly spaced frames
FPS="$(python3 -c "print(round(($COUNT + 4) / $DUR, 4))")"

ffmpeg -hide_banner -loglevel error -ss "$START" -to "$END" -i "$SRC" -vf "fps=$FPS" "$TMP/f_%04d.png"
python3 "$HERE/make_frames.py" "$TMP" --count "$COUNT" --pad "$PAD"

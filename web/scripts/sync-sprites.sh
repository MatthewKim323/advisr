#!/usr/bin/env bash
# Copy vendor atlases from repo root into web/public/sprites/ where Next serves them.
# Run from anywhere:  bash web/scripts/sync-sprites.sh
# Or:                 cd web && npm run sprites:sync
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_ROOT/.." && pwd)"

OFFICE_SRC="$REPO_ROOT/Office Tileset"
KENNEY_SRC="$REPO_ROOT/kenney_rpg-urban-pack/Tilemap"

DEST_OFFICE="$WEB_ROOT/public/sprites/office"
DEST_CHARS="$WEB_ROOT/public/sprites/chars"

mkdir -p "$DEST_OFFICE" "$DEST_CHARS"

copied=0

if [[ -d "$OFFICE_SRC" ]]; then
  if [[ -f "$OFFICE_SRC/Office Tileset All 16x16.png" ]]; then
    cp "$OFFICE_SRC/Office Tileset All 16x16.png" "$DEST_OFFICE/tileset-16.png"
    echo "ok  office → tileset-16.png"
    copied=$((copied + 1))
  fi
  if [[ -f "$OFFICE_SRC/Office Tileset All 16x16 no shadow.png" ]]; then
    cp "$OFFICE_SRC/Office Tileset All 16x16 no shadow.png" "$DEST_OFFICE/tileset-16-noshadow.png"
    echo "ok  office → tileset-16-noshadow.png"
    copied=$((copied + 1))
  fi
  if [[ -f "$OFFICE_SRC/Office Tileset All 32x32.png" ]]; then
    cp "$OFFICE_SRC/Office Tileset All 32x32.png" "$DEST_OFFICE/tileset-32.png"
    echo "ok  office → tileset-32.png"
    copied=$((copied + 1))
  fi
else
  echo "skip  no folder: $OFFICE_SRC"
fi

if [[ -d "$KENNEY_SRC" ]]; then
  if [[ -f "$KENNEY_SRC/tilemap_packed.png" ]]; then
    cp "$KENNEY_SRC/tilemap_packed.png" "$DEST_CHARS/kenney-urban.png"
    echo "ok  chars  → kenney-urban.png"
    copied=$((copied + 1))
  fi
  if [[ -f "$KENNEY_SRC/tilemap.txt" ]]; then
    cp "$KENNEY_SRC/tilemap.txt" "$DEST_CHARS/kenney-urban-layout.txt"
    echo "ok  chars  → kenney-urban-layout.txt"
    copied=$((copied + 1))
  fi
else
  echo "skip  no folder: $KENNEY_SRC (Kenney optional if chars PNG already present)"
fi

if [[ "$copied" -eq 0 ]]; then
  echo "sprites:sync — nothing copied. Put Donarg under: $OFFICE_SRC"
  exit 1
fi

echo "sprites:sync — done ($copied files). Restart next dev if running."

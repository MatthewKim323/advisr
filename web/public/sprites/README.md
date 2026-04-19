# Sprites

Asset blobs served by Next.js for the pixel office. Populated locally from the
sprite packs at the repo root — **not committed** because of Donarg's license
and general repo-bloat hygiene (see root `.gitignore`).

## Layout

```
sprites/
  office/
    tileset-16.png           ← Donarg Office Tileset, 16x16, with shadow
    tileset-16-noshadow.png  ← same, shadow layer removed
    tileset-32.png           ← same art rescaled to 32x32 (Donarg's 2x export)
  chars/
    kenney-urban.png         ← Kenney RPG Urban Pack, packed tilemap
    kenney-urban-layout.txt  ← tile index lookup
```

## Regenerating

If these files ever go missing, from the repo root:

```bash
mkdir -p web/public/sprites/office web/public/sprites/chars
cp "Office Tileset/Office Tileset All 16x16.png"            web/public/sprites/office/tileset-16.png
cp "Office Tileset/Office Tileset All 16x16 no shadow.png"  web/public/sprites/office/tileset-16-noshadow.png
cp "Office Tileset/Office Tileset All 32x32.png"            web/public/sprites/office/tileset-32.png
cp  kenney_rpg-urban-pack/Tilemap/tilemap_packed.png        web/public/sprites/chars/kenney-urban.png
cp  kenney_rpg-urban-pack/Tilemap/tilemap.txt               web/public/sprites/chars/kenney-urban-layout.txt
```

The root `Office Tileset/` and `kenney_rpg-urban-pack/` folders are themselves
gitignored and must be obtained out-of-band:

- **Donarg Office Interior** — purchase at itch.io ($2)
- **Kenney RPG Urban Pack** — free CC0 at https://kenney.nl/assets/rpg-urban-pack

## Submarine recolor (Phase 4.1+)

The sprites ship in their original warm-office palette. When we upgrade the
office from CSS placeholders to real tile renders, two options:

1. **CSS filter pass** — apply `filter: hue-rotate(180deg) saturate(1.1)` at
   the <img> level. Quick, keeps the pack reusable, adequate for Phase 1.
2. **Canvas recolor** — load the PNG, walk pixels, map the Donarg "Office
   Palette" PNG's 16 colors to the Bathysphere palette, output a new atlas.
   Takes ~1 hr; produces a true submarine palette that reads as *designed*,
   not *tinted*. Do this before the final demo video if time allows.

See `docs/architecture.md` for the palette mapping table.

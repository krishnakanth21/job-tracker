# Icons Needed

Chrome requires these PNG sizes. Add your icon files here before loading the extension.

| File         | Size    | Used for                                  |
|--------------|---------|-------------------------------------------|
| icon16.png   | 16×16   | Browser toolbar (small)                   |
| icon32.png   | 32×32   | Windows taskbar                           |
| icon48.png   | 48×48   | Extensions management page                |
| icon128.png  | 128×128 | Chrome Web Store listing                  |

## Design Guidelines

- Use a square canvas with the icon centered (some padding)
- The ApplyTrack mark: a rounded square (like an app icon) with a checkmark inside
- Recommended: use the purple accent color `#7C5BF5` as background
- White checkmark path: `M3 7l3 3 5-5` (scaled proportionally per size)
- Export as PNG with transparency (or solid background)

## Quick SVG Reference

Use this SVG as your source to export each size:

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="28" fill="#7C5BF5"/>
  <path d="M36 66L54 84L92 46"
        stroke="white" stroke-width="10"
        stroke-linecap="round" stroke-linejoin="round"
        fill="none"/>
</svg>
```

Export this at 16×16, 32×32, 48×48, and 128×128 px.

## Free Tools

- **Figma** — paste the SVG, export at each size
- **Inkscape** — open SVG → File → Export PNG → set width
- **ImageMagick** — `convert -resize 48x48 icon128.png icon48.png`
- **Online** — [SVGtoPNG.com](https://svgtopng.com) or [Squoosh](https://squoosh.app)

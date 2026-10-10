[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/midnightideas/code128-code-gen)

# Barcode Generator

A simple, static barcode generator that runs entirely in the browser — no backend, no tracking, no build step. Supports Code 128, Code 39, EAN-13, EAN-8, UPC, ITF-14, Codabar, Code 93, MSI, and Pharmacode via [JsBarcode](https://github.com/lindell/JsBarcode). Built for GitHub Pages.

**Live site:** https://midnightideas.github.io/code128-code-gen/

## Features

- **Multiple formats** — pick Code 128, EAN-13, UPC, and more from a dropdown.
- **Real-time generation** — barcodes render as you type, with per-format validation.
- **Copy to clipboard** — copy the rendered barcode as a PNG to paste anywhere.
- **Download as PNG** — export a high-resolution PNG of your barcode.
- **Mobile-friendly** — responsive layout that works on any screen size.
- **No tracking, no backend** — everything runs in the browser. The CDN script is pinned with Subresource Integrity and a strict Content Security Policy.

## Usage

1. Pick a format from the dropdown.
2. Type your text (or digits, for EAN/UPC/ITF/MSI/Pharmacode).
3. Click **Copy** to put a PNG on your clipboard, or **Download PNG** to save the file.

Each format enforces its own character set; invalid input is flagged inline.

## Development

Serve the static site:

```bash
npm run local
```

Then open http://localhost:8000/.

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no build step)
- [JsBarcode](https://github.com/lindell/JsBarcode) (CDN, SRI-pinned)
- GitHub Pages serves from `docs/`

## License

GPL-3.0

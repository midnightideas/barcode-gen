# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static barcode generator for GitHub Pages. Single-page app in `docs/index.html`.

## Key Files

- `docs/index.html` — Markup, CSP meta tag, JsBarcode `<script>` with SRI
- `docs/styles.css` — Styles
- `docs/script.js` — Barcode generation, validation, copy/download
- `package.json` — Project metadata (private; license: GPL-3.0)

## Supported Formats

Code 128, Code 39, EAN-13, EAN-8, UPC, ITF-14, Codabar, Code 93, MSI, Pharmacode.
Per-format character rules and placeholders live in the `HINTS` map in `docs/script.js`.
EAN/UPC/ITF accept the shorter length and auto-compute the check digit.
Codabar requires start/stop characters `A`–`D`.

## Commands

```bash
# Serve locally (document root: docs/)
npm run local
```

## Tech Stack

- Vanilla HTML/CSS/JS (no build step)
- JsBarcode via CDN with SRI pinning
- GitHub Pages deploys from `docs/`

## Security Notes

- External scripts use Subresource Integrity (SRI) hashes
- CSP meta tag restricts script sources to pinned CDN
- No server-side code; all processing is client-side

## JsBarcode / SVG Gotchas

The workarounds in `docs/script.js` are load-bearing — don't "clean them up":

- `background: false` is passed to JsBarcode; the white background is added
  as a manual `<rect>`. JsBarcode's `style="fill:#ffffff"` renders black in
  some browsers when pasted from the clipboard.
- `img.decode()` is awaited before drawing to the canvas. Safari fires
  `onload` before decoding finishes, which otherwise produces a black PNG.
- JsBarcode's target must be `<svg>`, `<canvas>`, `<img>`, or a plain
  object — a `<div>` throws `InvalidElementException`.
- PNG export uses a 2× scale.

## Deployment

Push to `main` branch. GitHub Pages serves `docs/` automatically at:
`https://midnightideas.github.io/barcode-gen/`

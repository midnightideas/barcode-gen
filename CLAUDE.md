# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static barcode generator for GitHub Pages. Single-page app in `docs/index.html`.

## Key Files

- `docs/index.html` — The entire app (HTML + CSS + JS)
- `docs/styles.css` — Styles
- `docs/script.js` — Barcode generation, copy, and download logic
- `package.json` — Project metadata (private, unlicensed)

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

## Deployment

Push to `main` branch. GitHub Pages serves `docs/` automatically at:
`https://midnightideas.github.io/barcode-gen/`

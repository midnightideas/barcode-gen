// docs/script.js — Barcode generation, validation, copy/download for the
// single-page barcode generator. Loaded as a classic <script> after JsBarcode
// in index.html.
//
// Three load-bearing JsBarcode/SVG workarounds live in this file — don't
// "clean them up" without testing in Safari:
//   1. `background: false` is passed to JsBarcode and the white background
//      is added as a manual <rect>. JsBarcode's `style="fill:#ffffff"` is
//      rendered as black in some browsers when pasted from the clipboard.
//   2. `img.decode()` is awaited before drawing to canvas. Safari fires
//      `onload` before decoding finishes, which otherwise produces a black
//      PNG when copied to the clipboard.
//   3. JsBarcode's target must be <svg>, <canvas>, <img>, or a plain
//      object — a <div> throws InvalidElementException.
//
// File layout:
//   1. DOM element references
//   2. State
//   3. Format configuration
//   4. Rendering
//   5. SVG → PNG
//   6. Misc utilities
//   7. Event handlers & init


// ---------- 1. DOM element references ----------

const formatSelect = document.getElementById('format-select');
const textInput = document.getElementById('text-input');
const barcodeContainer = document.getElementById('barcode-container');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const toast = document.getElementById('toast');
const formatHint = document.getElementById('format-hint');

const SVG_NS = 'http://www.w3.org/2000/svg';


// ---------- 2. State ----------

// The currently rendered barcode, or null when the placeholder is showing.
// Both fields are read by the copy/download handlers and updated by render.
const state = { value: '', svg: null };


// ---------- 3. Format configuration ----------

const HINTS = {
  'CODE128': {
    hint: 'Code 128 encodes any ASCII text (0–127).',
    placeholder: 'Hello World',
    validate: (v) => v.length > 0,
  },
  'CODE39': {
    hint: 'Code 39: A–Z, 0–9 and the characters - . space $ / + %.',
    placeholder: 'HELLO-123',
    validate: (v) => /^[0-9A-Z\-. $/+%]+$/.test(v),
  },
  'EAN-13': {
    hint: 'EAN-13: 12 or 13 digits. The check digit is computed if 12 are provided.',
    placeholder: '123456789012',
    validate: (v) => /^\d{12,13}$/.test(v),
  },
  'EAN-8': {
    hint: 'EAN-8: 7 or 8 digits. The check digit is computed if 7 are provided.',
    placeholder: '1234567',
    validate: (v) => /^\d{7,8}$/.test(v),
  },
  'UPC': {
    hint: 'UPC: 11 or 12 digits. The check digit is computed if 11 are provided.',
    placeholder: '03600029145',
    validate: (v) => /^\d{11,12}$/.test(v),
  },
  'ITF14': {
    hint: 'ITF-14: 13 or 14 digits. The check digit is computed if 13 are provided.',
    placeholder: '1234567890123',
    validate: (v) => /^\d{13,14}$/.test(v),
  },
  'codabar': {
    hint: 'Codabar: digits 0–9 and - $ : / . + with start/stop characters A, B, C, or D.',
    placeholder: 'A12345B',
    validate: (v) => /^[0-9\-$:/.+]+$/.test(v) && /^[ABCD]/.test(v) && /[ABCD]$/.test(v),
  },
  'CODE93': {
    hint: 'Code 93: A–Z, 0–9 and the characters - . space $ / + %.',
    placeholder: 'HELLO-123',
    validate: (v) => /^[0-9A-Z\-. $/+%]+$/.test(v),
  },
  'MSI': {
    hint: 'MSI: digits only.',
    placeholder: '12345',
    validate: (v) => /^\d+$/.test(v),
  },
  'Pharmacode': {
    hint: 'Pharmacode: integer between 3 and 131070.',
    placeholder: '1234',
    validate: (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 3 && n <= 131070;
    },
  },
};


// ---------- 4. Rendering ----------

function placeholderHtml(message, isError) {
  const messageClass = isError ? 'placeholder error' : 'placeholder';
  return `
    <div class="${messageClass}">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h2v12H4zM8 6h1v12H8zM10 6h2v12h-2zM14 6h1v12h-1zM16 6h3v12h-3z" />
      </svg>
      <p>${message}</p>
    </div>
  `;
}

function disableButtons() {
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
}

function enableButtons() {
  copyBtn.disabled = false;
  downloadBtn.disabled = false;
}

function showPlaceholder() {
  barcodeContainer.innerHTML = placeholderHtml('Enter text to generate a barcode', false);
  state.value = '';
  state.svg = null;
  disableButtons();
}

function showError(message) {
  barcodeContainer.innerHTML = placeholderHtml(message, true);
  state.svg = null;
  disableButtons();
}

function renderBarcode(value) {
  // Replace the container with a fresh <svg>; JsBarcode mutates its target,
  // so we can't reuse a previous render. See gotcha #3 in the file header.
  barcodeContainer.innerHTML = '<svg id="barcode"></svg>';
  const svg = document.getElementById('barcode');

  try {
    JsBarcode(svg, value, {
      format: formatSelect.value,
      displayValue: false,
      fontSize: 18,
      height: 80,
      margin: 8,
      lineColor: '#000000',
      // background: false (gotcha #1) — we add a white <rect> ourselves below.
      background: false,
    });
  } catch (err) {
    showError(`Cannot encode "${value}" as ${formatSelect.value}: ${err.message || err}`);
    return;
  }

  // Manual white background rect. fill="#ffffff" works consistently across
  // renderers; JsBarcode's `style="fill:#ffffff"` is unreliable when the
  // result is serialized to a data URL and pasted from the clipboard.
  const vb = svg.viewBox.baseVal;
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(vb.width || svg.getBoundingClientRect().width));
  bg.setAttribute('height', String(vb.height || svg.getBoundingClientRect().height));
  bg.setAttribute('fill', '#ffffff');
  svg.insertBefore(bg, svg.firstChild);

  state.svg = svg;
  state.value = value;
  enableButtons();
}

function render(value) {
  if (!value) {
    showPlaceholder();
    return;
  }
  const format = formatSelect.value;
  if (!HINTS[format].validate(value)) {
    showError(`Invalid input for ${format}. ${HINTS[format].hint}`);
    return;
  }
  renderBarcode(value);
}

function applyFormatMeta() {
  const meta = HINTS[formatSelect.value];
  formatHint.textContent = meta.hint;
  textInput.placeholder = meta.placeholder;
}


// ---------- 5. SVG → PNG ----------

// Best-effort dimension lookup. Prefer the width/height attributes JsBarcode
// sets on the <svg>; fall back to the rendered bounding box, then the
// viewBox, then a sane default.
function getSvgDimensions(svgEl) {
  const attrW = parseFloat(svgEl.getAttribute('width')) || 0;
  const attrH = parseFloat(svgEl.getAttribute('height')) || 0;
  if (attrW && attrH) return { width: attrW, height: attrH };

  const rect = svgEl.getBoundingClientRect();
  if (rect.width && rect.height) {
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  }

  const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
  if (vb && vb.width && vb.height) return { width: vb.width, height: vb.height };

  return { width: 200, height: 80 };
}

// Clone the SVG, set explicit width/height, add a white background rect,
// and return a data: URL that <img> can load.
function svgToDataUrl(svgEl) {
  const clone = svgEl.cloneNode(true);
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const { width, height } = getSvgDimensions(svgEl);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  // White background rect inside the SVG itself. Without this, Safari can
  // render the data URL as transparent, which then shows up as a black image
  // when pasted from the clipboard.
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', String(width));
  bg.setAttribute('height', String(height));
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

// Load an image from a data URL, awaiting full decode. Gotcha #2 in the
// file header: Safari fires `onload` before decoding is complete, which
// otherwise produces a black canvas when drawn to.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') await img.decode();
        resolve(img);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load SVG as image'));
    img.src = src;
  });
}

// Draw an image to a canvas at the given scale, return a PNG blob.
function imageToPngBlob(img, width, height, scale) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob returned null'));
    }, 'image/png');
  });
}

// End-to-end: SVG element → PNG blob. Default 2× scale for crisper output.
function svgToPngBlob(svgEl, scale = 2) {
  return loadImage(svgToDataUrl(svgEl)).then((img) => {
    const { width, height } = getSvgDimensions(svgEl);
    return imageToPngBlob(img, width, height, scale);
  });
}


// ---------- 6. Misc utilities ----------

function sanitizeFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 40) || 'barcode';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}


// ---------- 7. Event handlers & init ----------

formatSelect.addEventListener('change', () => {
  applyFormatMeta();
  render(textInput.value.trim());
});

textInput.addEventListener('input', () => {
  render(textInput.value.trim());
});

textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') textInput.blur();
});

copyBtn.addEventListener('click', async () => {
  if (!state.svg) return;
  try {
    const blob = await svgToPngBlob(state.svg);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    showToast('Copied to clipboard!');
  } catch (err) {
    showToast('Failed to copy. Try downloading instead.');
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!state.svg) return;
  try {
    const blob = await svgToPngBlob(state.svg);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${formatSelect.value}-${sanitizeFilename(state.value)}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded');
  } catch (err) {
    showToast('Failed to download.');
  }
});

applyFormatMeta();
showPlaceholder();

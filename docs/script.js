const formatSelect = document.getElementById('format-select');
const textInput = document.getElementById('text-input');
const barcodeContainer = document.getElementById('barcode-container');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const toast = document.getElementById('toast');
const formatHint = document.getElementById('format-hint');

let currentValue = '';
let currentSvg = null;

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

function resetPlaceholder() {
  barcodeContainer.innerHTML = placeholderHtml('Enter text to generate a barcode', false);
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  currentValue = '';
  currentSvg = null;
}

function showError(message) {
  barcodeContainer.innerHTML = placeholderHtml(message, true);
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  currentSvg = null;
}

function renderBarcode(value) {
  // JsBarcode only accepts <svg>, <canvas>, <img>, or a plain object as a
  // target — a <div> triggers InvalidElementException. The SVGRenderer
  // clears the svg and sets width/height/viewBox on this same element.
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
      background: false,  // suppress JsBarcode's default white background
    });
  } catch (err) {
    showError(`Cannot encode "${value}" as ${formatSelect.value}: ${err.message || err}`);
    return;
  }

  // Add the white background ourselves. JsBarcode's `background` option
  // emits `style="fill:#ffffff;"` which some browsers render as black
  // instead of white — using the `fill` attribute on a rect we add
  // ourselves avoids that parser quirk.
  const vb = svg.viewBox.baseVal;
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(vb.width || svg.getBoundingClientRect().width));
  bg.setAttribute('height', String(vb.height || svg.getBoundingClientRect().height));
  bg.setAttribute('fill', '#ffffff');
  svg.insertBefore(bg, svg.firstChild);

  currentSvg = svg;
  currentValue = value;
  copyBtn.disabled = false;
  downloadBtn.disabled = false;
}

function validateAndRender() {
  const value = textInput.value.trim();

  if (!value) {
    resetPlaceholder();
    return;
  }

  const format = formatSelect.value;
  if (!HINTS[format].validate(value)) {
    showError(`Invalid input for ${format}. ${HINTS[format].hint}`);
    return;
  }

  renderBarcode(value);
}

function getSvgDimensions(svgEl) {
  // Prefer the width/height attributes JsBarcode sets on the SVG. Fall back
  // to the rendered bounding box, then the viewBox, then a sane default.
  let width = parseFloat(svgEl.getAttribute('width')) || 0;
  let height = parseFloat(svgEl.getAttribute('height')) || 0;

  if (!width || !height) {
    const rect = svgEl.getBoundingClientRect();
    width = width || Math.round(rect.width);
    height = height || Math.round(rect.height);
  }

  if (!width || !height) {
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    if (vb && vb.width) {
      width = width || vb.width;
      height = height || vb.height;
    }
  }

  return {
    width: Math.max(1, Math.round(width || 200)),
    height: Math.max(1, Math.round(height || 80)),
  };
}

function svgToPngBlob(svgEl, scale) {
  return new Promise((resolve, reject) => {
    const clone = svgEl.cloneNode(true);
    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const { width, height } = getSvgDimensions(svgEl);
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    // White background rect inside the SVG. Without this, Safari can render
    // the data URL as transparent, which then shows up as a black image when
    // pasted from the clipboard.
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', String(width));
    bg.setAttribute('height', String(height));
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

    const img = new Image();
    img.onload = async () => {
      try {
        // image.decode() forces the browser to fully decode the SVG before
        // we draw. Safari fires `onload` before decoding is complete, which
        // otherwise causes a black canvas — the symptom we see when copying
        // the result to the clipboard.
        if (typeof img.decode === 'function') {
          await img.decode();
        }

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
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load SVG as image'));
    img.src = src;
  });
}

function sanitizeFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 40) || 'barcode';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function applyFormatMeta() {
  const meta = HINTS[formatSelect.value];
  formatHint.textContent = meta.hint;
  textInput.placeholder = meta.placeholder;
}

formatSelect.addEventListener('change', () => {
  applyFormatMeta();
  validateAndRender();
});

textInput.addEventListener('input', () => {
  validateAndRender();
});

textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    textInput.blur();
  }
});

copyBtn.addEventListener('click', async () => {
  if (!currentSvg) return;

  try {
    const blob = await svgToPngBlob(currentSvg, 2);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    showToast('Copied to clipboard!');
  } catch (err) {
    showToast('Failed to copy. Try downloading instead.');
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!currentSvg) return;

  try {
    const blob = await svgToPngBlob(currentSvg, 2);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${formatSelect.value}-${sanitizeFilename(currentValue)}.png`;
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
resetPlaceholder();

/**
 * Modular Utility for generating vector barcodes in Code 39 format.
 * High-precision, responsive SVG output without extra external package requirements.
 */

const CODE39_ENCODINGS: { [key: string]: string } = {
  '0': 'nnnwwwnwn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwnww', 'H': 'wnnnnwnwn', 'I': 'nnwnnwnwn', 'J': 'nnnnwwnwn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnnw', 'M': 'wnwnnnnnn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwnnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn'
};

/**
 * Generates a Code 39 vector barcode SVG string.
 * Code 39 encodes uppercase letters A-Z, numbers 0-9, spaces, and hyphens.
 */
export function generateCode39Svg(text: string): string {
  // Normalize text: filter only valid characters, convert to upper case
  const upperText = text.toUpperCase();
  const cleanChars = ('*' + upperText + '*')
    .split('')
    .map(char => (CODE39_ENCODINGS[char] ? char : ' '));

  let x = 0;
  const narrowWidth = 1.5;
  const wideWidth = 3.5;
  const barHeight = 50;

  let svgElements = '';

  for (let cIdx = 0; cIdx < cleanChars.length; cIdx++) {
    const char = cleanChars[cIdx];
    const pattern = CODE39_ENCODINGS[char];

    for (let i = 0; i < 9; i++) {
      const isBar = i % 2 === 0;
      const size = pattern[i] === 'w' ? wideWidth : narrowWidth;

      if (isBar) {
        svgElements += `<rect x="${x}" y="0" width="${size}" height="${barHeight}" fill="currentColor" />`;
      }

      x += size;
    }

    // Inter-character narrow space gap
    if (cIdx < cleanChars.length - 1) {
      x += narrowWidth;
    }
  }

  return `<svg width="100%" height="100%" viewBox="0 0 ${x} ${barHeight}" preserveAspectRatio="none" className="text-neutral-900">${svgElements}</svg>`;
}

/**
 * Generates a data URI containing the Code 39 SVG barcode, suitable for use in standard <img> tags.
 */
export function generateCode39DataUri(text: string): string {
  const svg = generateCode39Svg(text);
  // URL-encode the SVG markup to make it a safe data URI
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Script de verification independante des ratios de contraste WCAG 2.1
// (formule officielle de luminance relative, cf. https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
// Usage : node contraste-wcag.js
// Aucune dependance externe requise (Node >= 14).

function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return {
    r: parseInt(n.substring(0, 2), 16),
    g: parseInt(n.substring(2, 4), 16),
    b: parseInt(n.substring(4, 6), 16),
  };
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const paires = [
  { nom: 'Texte principal / fond', fg: '#0D0D12', bg: '#F5F4F1' },
  { nom: 'Texte blanc / bouton primaire', fg: '#FFFFFF', bg: '#2D1FE8' },
  { nom: 'Texte / badge lime', fg: '#0D0D12', bg: '#C8FF47' },
  { nom: 'Texte muted / fond', fg: '#6E6D6A', bg: '#F5F4F1' },
  { nom: 'Lien / blanc', fg: '#2D1FE8', bg: '#FFFFFF' },
  { nom: 'Etoile notation - AVANT correction', fg: '#F5A623', bg: '#FFFFFF' },
  { nom: 'Etoile notation - APRES correction', fg: '#976600', bg: '#FFFFFF' },
];

console.log('Element'.padEnd(38), 'Ratio'.padEnd(10), 'Seuil AA texte normal (4.5:1)');
console.log('-'.repeat(70));
for (const p of paires) {
  const ratio = contrastRatio(p.fg, p.bg);
  const statut = ratio >= 4.5 ? 'CONFORME' : 'NON CONFORME';
  console.log(p.nom.padEnd(38), (ratio.toFixed(2) + ':1').padEnd(10), statut);
}

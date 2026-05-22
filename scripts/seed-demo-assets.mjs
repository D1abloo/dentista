#!/usr/bin/env node
/** Genera PDFs mínimos válidos en public/demo/{prueba,facturas,documentos,consentimientos,informes} */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'public', 'demo');

function miniPdf(title) {
  const text = `(${title.replace(/[()\\]/g, '')})`;
  const stream = `BT /F1 11 Tf 48 720 Td ${text} Tj ET`;
  const len = stream.length;
  return Buffer.from(
    `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 420 595]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${len}>>stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`,
    'utf8'
  );
}

const dirs = {
  prueba: ['muestra-radiografia.pdf', 'ficha-preoperatoria.pdf'],
  facturas: [
    'fac-0001-ortodoncia.pdf',
    'fac-0002-implantes.pdf',
    'fac-0003-blanqueamiento.pdf',
    'fac-0004-limpieza.pdf',
    'fac-0005-limpieza-hoy.pdf',
    'fac-0006-endodoncia.pdf',
    'fac-0007-carillas.pdf',
    'fac-0008-revision.pdf'
  ],
  documentos: [
    'receta-postoperatoria.pdf',
    'orden-laboratorio.pdf',
    'historia-clinica-resumen.pdf',
    'informe-periodoncia.pdf',
    'fotografia-intraoral.pdf'
  ],
  consentimientos: [
    'consentimiento-ortodoncia.pdf',
    'consentimiento-blanqueamiento.pdf',
    'consentimiento-implantes.pdf',
    'consentimiento-endodoncia.pdf',
    'consentimiento-anestesia.pdf',
    'consentimiento-radiologia.pdf'
  ],
  informes: [
    'informe-ortodoncia.pdf',
    'informe-implantes.pdf',
    'informe-blanqueamiento.pdf',
    'informe-limpieza.pdf',
    'informe-endodoncia.pdf',
    'informe-periodoncia.pdf',
    'informe-carillas.pdf'
  ]
};

for (const [dir, files] of Object.entries(dirs)) {
  const path = join(root, dir);
  mkdirSync(path, { recursive: true });
  for (const file of files) {
    const label = file.replace(/\.pdf$/, '').replace(/-/g, ' ');
    writeFileSync(join(path, file), miniPdf(`Dentista+ demo · ${label}`));
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" role="img" aria-label="Radiografía demo">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f2742"/><stop offset="100%" stop-color="#14b8a6"/></linearGradient></defs>
  <rect width="480" height="240" fill="#0b1220"/>
  <ellipse cx="240" cy="120" rx="160" ry="90" fill="none" stroke="url(#g)" stroke-width="3"/>
  <text x="240" y="128" text-anchor="middle" fill="#7dd3fc" font-family="system-ui,sans-serif" font-size="14" font-weight="700">Radiografía panorámica · DEMO</text>
</svg>`;
writeFileSync(join(root, 'prueba', 'radiografia-panoramica.svg'), svg, 'utf8');

writeFileSync(
  join(root, 'README.md'),
  `# Archivos demo (modo sin Supabase)

Carpetas servidas en \`/demo/*\`:

- \`prueba/\` — muestras y radiografías de prueba
- \`facturas/\` — PDFs de facturación
- \`documentos/\` — recetas, órdenes e informes clínicos
- \`consentimientos/\` — consentimientos informados firmados o pendientes
- \`informes/\` — informes clínicos adjuntos

Referencias en \`src/data/demoData.ts\` vía \`fileRef: '/demo/...'\`.
`,
  'utf8'
);

console.log('Demo assets OK:', Object.values(dirs).flat().length + 1, 'files');

/** Estilos A4 para factura AgendaClinic (impresión / guardar como PDF). */
export const INVOICE_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 20mm;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #0f172a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .inv-print {
    max-width: 186mm;
    margin: 0 auto;
    padding-bottom: 12mm;
  }

  .inv-print__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 2px solid #0d9488;
  }

  .inv-print__brand img {
    max-height: 48px;
    max-width: 160px;
    object-fit: contain;
    display: block;
    margin-bottom: 8px;
  }

  .inv-print__brand h1 {
    margin: 0;
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .inv-print__brand p {
    margin: 4px 0 0;
    font-size: 8.5pt;
    color: #64748b;
  }

  .inv-print__title-block {
    text-align: right;
    min-width: 42%;
  }

  .inv-print__title {
    margin: 0 0 10px;
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
  }

  .inv-print__meta {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 9pt;
  }

  .inv-print__meta li {
    margin: 3px 0;
    color: #334155;
  }

  .inv-print__meta strong {
    color: #0f172a;
    font-weight: 700;
  }

  .inv-print__status {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .inv-print__status--pagada { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .inv-print__status--pendiente { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .inv-print__status--vencida { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .inv-print__status--cancelada { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

  .inv-print__grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }

  .inv-print__block {
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .inv-print__block h2 {
    margin: 0 0 8px;
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0d9488;
  }

  .inv-print__block p {
    margin: 2px 0;
    font-size: 9pt;
    color: #334155;
  }

  .inv-print__block p strong {
    color: #0f172a;
  }

  .inv-print__context {
    margin-bottom: 14px;
    padding: 10px 14px;
    border-left: 3px solid #0d9488;
    background: #f0fdfa;
    border-radius: 0 8px 8px 0;
    font-size: 9pt;
  }

  .inv-print__context h2 {
    margin: 0 0 6px;
    font-size: 8.5pt;
    font-weight: 800;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inv-print__context dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 12px;
    margin: 0;
  }

  .inv-print__context dt {
    font-weight: 700;
    color: #64748b;
  }

  .inv-print__context dd {
    margin: 0;
    color: #0f172a;
  }

  .inv-print__table-wrap {
    margin-bottom: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  table.inv-print__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }

  .inv-print__table thead {
    display: table-header-group;
    background: #0f172a;
    color: #fff;
  }

  .inv-print__table th {
    padding: 8px 8px;
    text-align: left;
    font-weight: 700;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .inv-print__table th.num,
  .inv-print__table td.num {
    text-align: right;
    white-space: nowrap;
  }

  .inv-print__table tbody tr {
    border-bottom: 1px solid #e8eef4;
    page-break-inside: avoid;
  }

  .inv-print__table tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  .inv-print__table td {
    padding: 8px 8px;
    vertical-align: top;
    color: #334155;
  }

  .inv-print__table td strong {
    color: #0f172a;
    font-weight: 700;
  }

  .inv-print__table .muted {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 2px;
  }

  .inv-print__totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
    page-break-inside: avoid;
  }

  .inv-print__totals {
    width: 52%;
    min-width: 220px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
  }

  .inv-print__totals dl {
    margin: 0;
    padding: 0;
  }

  .inv-print__totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 9pt;
  }

  .inv-print__totals-row dt {
    color: #64748b;
    font-weight: 600;
  }

  .inv-print__totals-row dd {
    margin: 0;
    font-weight: 700;
    color: #0f172a;
  }

  .inv-print__totals-row--total {
    background: #0f172a;
    color: #fff;
    padding: 10px 12px;
    border-bottom: none;
  }

  .inv-print__totals-row--total dt,
  .inv-print__totals-row--total dd {
    color: #fff;
    font-size: 11pt;
    font-weight: 800;
  }

  .inv-print__totals-row--discount dd {
    color: #b91c1c;
  }

  .inv-print__badge-paid {
    display: inline-block;
    margin-top: 8px;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 8.5pt;
    font-weight: 800;
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .inv-print__badge-pending {
    display: inline-block;
    margin-top: 8px;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 8.5pt;
    font-weight: 800;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .inv-print__payment {
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    page-break-inside: avoid;
  }

  .inv-print__payment h2 {
    margin: 0 0 8px;
    font-size: 8.5pt;
    font-weight: 800;
    color: #0d9488;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inv-print__payment p,
  .inv-print__payment li {
    margin: 3px 0;
    font-size: 9pt;
    color: #334155;
  }

  .inv-print__payment ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
  }

  .inv-print__notes {
    margin-bottom: 14px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  .inv-print__notes h2 {
    margin: 0 0 6px;
    font-size: 8pt;
    font-weight: 800;
    color: #92400e;
    text-transform: uppercase;
  }

  .inv-print__legal {
    margin-bottom: 20px;
    font-size: 7.5pt;
    color: #94a3b8;
    line-height: 1.5;
    page-break-inside: avoid;
  }

  .inv-print__footer-zone {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    page-break-inside: avoid;
  }

  .inv-print__pro {
    flex: 0 0 auto;
    max-width: 55%;
    margin-left: auto;
    text-align: right;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .inv-print__pro h2 {
    margin: 0 0 8px;
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0d9488;
  }

  .inv-print__pro img {
    max-height: 52px;
    max-width: 140px;
    object-fit: contain;
    display: block;
    margin: 0 0 8px auto;
  }

  .inv-print__pro p {
    margin: 2px 0;
    font-size: 9pt;
    color: #0f172a;
    font-weight: 600;
  }

  .inv-print__pro .muted {
    font-weight: 500;
    color: #64748b;
    font-size: 8.5pt;
  }

  .inv-print__page-footer {
    position: fixed;
    left: 12mm;
    right: 12mm;
    bottom: 6mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7pt;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
  }

  .inv-print__page-footer img {
    max-height: 14px;
    opacity: 0.7;
  }

  @media print {
    .inv-print__page-footer {
      position: fixed;
    }
    .no-print { display: none !important; }
  }

  @media screen {
    body { padding: 16px; background: #f1f5f9; }
    .inv-print { background: #fff; padding: 24px; box-shadow: 0 8px 32px rgba(15,23,42,0.08); border-radius: 12px; }
    .inv-print__toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      margin: -24px -24px 20px;
      padding: 12px 24px;
      background: #0f172a;
      color: #fff;
      display: flex;
      gap: 12px;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }
    .inv-print__toolbar button {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      background: #0d9488;
      color: #fff;
    }
    .inv-print__toolbar button.secondary {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.35);
    }
  }
`;

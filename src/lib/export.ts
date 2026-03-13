// ─── Export Utilities for SGRT2 ───
// CSV/Excel export, PDF via print dialog, and formatting helpers.

/**
 * Escape a value for CSV: wrap in quotes if it contains commas, quotes, or newlines.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Export an array of objects as a CSV file (opens natively in Excel).
 *
 * @param data    - Array of flat objects. Keys of the first object become headers.
 * @param filename - Download filename (without extension).
 * @param sheetName - Ignored for CSV but kept for API compat.
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  _sheetName?: string
): void {
  if (!data.length) {
    console.warn('exportToExcel: no data to export');
    return;
  }

  const headers = Object.keys(data[0]);

  const lines: string[] = [];

  // Header row
  lines.push(headers.map(csvEscape).join(','));

  // Data rows
  for (const row of data) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }

  // BOM for Excel to detect UTF-8
  const bom = '\uFEFF';
  const csvContent = bom + lines.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Export a styled table as a printable PDF via the browser print dialog.
 *
 * Opens a new window with a branded HTML table and triggers window.print().
 *
 * @param title    - Document title / heading.
 * @param headers  - Array of column header labels.
 * @param rows     - Array of arrays (each inner array = one row of cell values).
 * @param filename - Used as the document title (browser may use it for the PDF name).
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename?: string
): void {
  const docTitle = filename || title;
  const now = formatDate(new Date().toISOString());

  const headerCells = headers
    .map(
      (h) =>
        `<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;
          color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0;
          white-space:nowrap;">${escapeHtml(h)}</th>`
    )
    .join('');

  const bodyRows = rows
    .map(
      (row, i) =>
        `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">` +
        row
          .map(
            (cell) =>
              `<td style="padding:6px 12px;font-size:11px;color:#334155;
                border-bottom:1px solid #f1f5f9;">${escapeHtml(String(cell ?? ''))}</td>`
          )
          .join('') +
        '</tr>'
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm 12mm;
      @bottom-center { content: "Página " counter(page) " de " counter(pages); font-size: 9px; color: #94a3b8; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #1e40af;
      letter-spacing: -0.5px;
    }
    .brand span { color: #6366f1; }
    .meta { font-size: 11px; color: #94a3b8; text-align: right; }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SGRT<span>2</span></div>
      <div style="font-size:15px;font-weight:600;color:#334155;margin-top:4px;">
        ${escapeHtml(title)}
      </div>
    </div>
    <div class="meta">
      Generado: ${now}<br/>
      Total: ${rows.length} registros
    </div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('exportToPDF: popup blocked. Allow popups for this site.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render before triggering print
  printWindow.addEventListener('load', () => {
    printWindow.focus();
    printWindow.print();
  });
}

// ─── Formatting helpers ───

/**
 * Format an ISO date string to a localized short date.
 * E.g. "2026-03-09T12:00:00Z" → "09/03/2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Format a number as ARS currency.
 * E.g. 12500.5 → "$ 12.500,50"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Internal helpers ───

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import ExcelJS from 'exceljs';

/**
 * Utilidad ejecutiva de exportación de reportes corporativos a Excel (.xlsx) y PDF
 * diseñada conforme a los estándares de Clear Minds Consultores / ProjectFlow.
 */

async function getLogoBase64(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/assets/clear-minds-horizontal-logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function parseNumericValue(val: any): { isNumber: boolean; num: number; formatted: string } {
  if (val === null || val === undefined || val === '') {
    return { isNumber: false, num: 0, formatted: '-' };
  }
  if (typeof val === 'number') {
    return {
      isNumber: true,
      num: val,
      formatted: val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }
  const str = String(val).trim();
  // Quitar símbolos de dólar o separadores para comprobar si es un número monetario
  const clean = str.replace(/^\$\s*/, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  if (!isNaN(parsed) && /^[-+]?\$?\s*\d+([.,]\d{2})?$/.test(str.replace(/\s+/g, ''))) {
    return {
      isNumber: true,
      num: parsed,
      formatted: parsed.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }
  return { isNumber: false, num: 0, formatted: str };
}

export async function exportExecutiveExcel(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  subtitle?: string,
  username?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clear Minds Consultores - CMC Cobranzas';
  workbook.lastModifiedBy = username || 'Sofía Supervisora';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Nombre de hoja descriptivo (máximo 31 caracteres)
  const currentMonth = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  const sheetName = (currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)).slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF00A3E0' } }, // Color Cyan corporativo Clear Minds
  });

  // 1. Intentar incrustar logotipo oficial en A1:B3
  const logoData = await getLogoBase64();
  if (logoData && logoData.includes('base64,')) {
    try {
      const base64Pure = logoData.split('base64,')[1];
      const imageId = workbook.addImage({
        base64: base64Pure,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: 0.3 },
        ext: { width: 140, height: 48 },
      });
    } catch {
      // Si falla, se escribe texto de marca
    }
  }

  // Si no hay logo o como respaldo, texto de marca en A2
  if (!logoData) {
    worksheet.mergeCells('A2:B2');
    const brandCell = worksheet.getCell('A2');
    brandCell.value = 'Clear Minds';
    brandCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF00A3E0' } };
    const brandSub = worksheet.getCell('A3');
    brandSub.value = 'CONSULTORES';
    brandSub.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF2C3E50' } };
  }

  // 2. Bloque de Título y Metadatos en columna D / C
  const titleCol = headers.length > 5 ? 'D' : 'C';
  const titleCell = worksheet.getCell(`${titleCol}2`);
  titleCell.value = title;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF0F172A' } };

  const subCell = worksheet.getCell(`${titleCol}3`);
  subCell.value = subtitle || `Periodo: ${currentMonth} · Saldo según registros contables y cobranza`;
  subCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF64748B' } };

  const metaCell = worksheet.getCell(`${titleCol}4`);
  const dateStr = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  metaCell.value = `Generado el ${dateStr} ${timeStr} por ${username || 'Administrador'} · CMC Cobranzas`;
  metaCell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF64748B' } };

  // Espaciado de filas de encabezado
  worksheet.getRow(1).height = 12;
  worksheet.getRow(2).height = 20;
  worksheet.getRow(3).height = 16;
  worksheet.getRow(4).height = 16;
  worksheet.getRow(5).height = 26; // Fila de cabecera de tabla

  // 3. Fila de Encabezados de Tabla (Fila 5) - Deep Midnight Navy (#13103C / #171738)
  const headerRow = worksheet.getRow(5);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF13103C' }, // Midnight Navy idéntico a la imagen del supervisor
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: h.toLowerCase().includes('monto') || h.toLowerCase().includes('precio') || h.toLowerCase().includes('valor') || h.toLowerCase().includes('saldo')
        ? 'right'
        : 'left',
      wrapText: false,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF2D2B55' } },
      bottom: { style: 'medium', color: { argb: 'FF00A3E0' } }, // Acento cian en el borde inferior
      left: { style: 'thin', color: { argb: 'FF2D2B55' } },
      right: { style: 'thin', color: { argb: 'FF2D2B55' } },
    };
  });

  // 4. Filas de Datos (Desde fila 6)
  let currentRowIdx = 6;
  const columnSums: Record<number, number> = {};
  const isNumericColumn: Record<number, boolean> = {};

  rows.forEach((row, rIdx) => {
    const rowObj = worksheet.getRow(currentRowIdx);
    rowObj.height = 20;
    const isEven = rIdx % 2 === 0;

    row.forEach((val, cIdx) => {
      const colNum = cIdx + 1;
      const cell = rowObj.getCell(colNum);
      const parsed = parseNumericValue(val);

      const isNegative = typeof val === 'number' && val < 0;
      const isCancellation = typeof val === 'string' && (val.toLowerCase().includes('anula') || val.startsWith('-'));

      if (parsed.isNumber) {
        cell.value = parsed.num;
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        columnSums[colNum] = (columnSums[colNum] || 0) + parsed.num;
        isNumericColumn[colNum] = true;
      } else {
        cell.value = val !== undefined && val !== null ? String(val) : '-';
        cell.alignment = {
          vertical: 'middle',
          horizontal: String(val).match(/^\d{2}[/-]\d{2}[/-]\d{2,4}/) || String(val).startsWith('REC-') || String(val).startsWith('ANU-')
            ? 'center'
            : 'left',
        };
      }

      // Estilo de texto: rojo para anulaciones o números negativos
      if (isNegative || isCancellation) {
        cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FFDC2626' }, bold: true };
      } else {
        cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF0F172A' } };
      }

      // Relleno alternado sutil
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    currentRowIdx++;
  });

  // 5. Fila de Totales / Resumen (Fondo Lavanda Suave #EEF2FF)
  const totalRow = worksheet.getRow(currentRowIdx);
  totalRow.height = 24;
  const totalColCount = headers.length;

  for (let c = 1; c <= totalColCount; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEF2FF' }, // Lavanda ejecutivo suave idéntico a la captura
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF4338CA' } },
      bottom: { style: 'double', color: { argb: 'FF4338CA' } }, // Doble línea inferior contable
      left: { style: 'thin', color: { argb: 'FFE0E7FF' } },
      right: { style: 'thin', color: { argb: 'FFE0E7FF' } },
    };

    if (c === 1) {
      cell.value = `Total Registros (${rows.length})`;
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E1B4B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else if (isNumericColumn[c] && columnSums[c] !== undefined) {
      cell.value = columnSums[c];
      cell.numFmt = '$#,##0.00';
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E1B4B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
    }
  }

  // 6. Ajuste dinámico inteligente del ancho de columnas para evitar "###"
  headers.forEach((h, colIdx) => {
    const colNum = colIdx + 1;
    let maxLen = h.length;
    rows.forEach((r) => {
      const cellVal = r[colIdx];
      if (cellVal !== null && cellVal !== undefined) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    });
    // Añadir margen de comodidad para fuente Segoe UI
    worksheet.getColumn(colNum).width = Math.max(maxLen + 4, 14);
  });

  // Descarga del archivo .xlsx nativo en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportExecutivePDF(
  title: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  subtitle?: string,
  username?: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite las ventanas emergentes en su navegador para imprimir el PDF.');
    return;
  }

  const currentMonth = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  const dateStr = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  // Calcular sumas para totales en PDF
  const columnSums: Record<number, number> = {};
  const isNumericColumn: Record<number, boolean> = {};

  rows.forEach((row) => {
    row.forEach((val, cIdx) => {
      const parsed = parseNumericValue(val);
      if (parsed.isNumber) {
        columnSums[cIdx] = (columnSums[cIdx] || 0) + parsed.num;
        isNumericColumn[cIdx] = true;
      }
    });
  });

  const headerHtml = headers
    .map((h, i) => {
      const align = isNumericColumn[i] ? 'text-align: right;' : 'text-align: left;';
      return `<th style="padding: 10px 12px; background: #13103C; color: #ffffff; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #2D2B55; ${align}">${h}</th>`;
    })
    .join('');

  const rowsHtml = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = r
        .map((c, colIdx) => {
          const parsed = parseNumericValue(c);
          const isNeg = typeof c === 'number' && c < 0;
          const isCancel = typeof c === 'string' && (c.toLowerCase().includes('anula') || c.startsWith('-'));
          const textColor = isNeg || isCancel ? '#dc2626; font-weight: bold;' : '#0f172a;';
          const align = isNumericColumn[colIdx] ? 'text-align: right;' : 'text-align: left;';
          const displayVal = parsed.isNumber ? parsed.formatted : (c !== null && c !== undefined ? c : '-');
          return `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 10px; color: ${textColor} ${align}">${displayVal}</td>`;
        })
        .join('');
      return `<tr style="background: ${bg};">${cells}</tr>`;
    })
    .join('');

  // Fila de total en PDF
  const totalCellsHtml = headers
    .map((_, colIdx) => {
      if (colIdx === 0) {
        return `<td style="padding: 10px 12px; font-weight: bold; color: #1E1B4B; border-top: 1.5px solid #4338ca; border-bottom: 2px solid #4338ca; font-size: 10.5px;">Total Registros (${rows.length})</td>`;
      }
      if (isNumericColumn[colIdx] && columnSums[colIdx] !== undefined) {
        return `<td style="padding: 10px 12px; font-weight: bold; text-align: right; color: #1E1B4B; border-top: 1.5px solid #4338ca; border-bottom: 2px solid #4338ca; font-size: 11px;">$${columnSums[colIdx].toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
      }
      return `<td style="padding: 10px 12px; border-top: 1.5px solid #4338ca; border-bottom: 2px solid #4338ca;"></td>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${title} - Clear Minds Consultores</title>
      <style>
        @page { size: landscape; margin: 10mm 12mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 12px;
          background: #ffffff;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #00A3E0;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-img {
          height: 48px;
          width: auto;
          object-contain: contain;
        }
        .brand-text {
          font-size: 20px;
          font-weight: 800;
          color: #00A3E0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .brand-sub {
          font-size: 9px;
          font-weight: 700;
          color: #2C3E50;
          letter-spacing: 2px;
        }
        .title-box {
          text-align: right;
        }
        .report-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }
        .report-sub {
          font-size: 10px;
          color: #64748B;
          margin-top: 3px;
        }
        .report-meta {
          font-size: 9px;
          color: #94A3B8;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        .total-row {
          background-color: #EEF2FF;
        }
        .footer-note {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94A3B8;
        }
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-around;
          page-break-inside: avoid;
        }
        .signature-box {
          text-align: center;
          width: 200px;
          border-top: 1px solid #0F172A;
          padding-top: 6px;
          font-size: 10px;
          font-weight: 600;
          color: #0F172A;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="logo-box">
          <img src="/assets/clear-minds-horizontal-logo.png" alt="Clear Minds Logo" class="logo-img" onerror="this.style.display='none'" />
          <div>
            <div class="brand-text">Clear Minds</div>
            <div class="brand-sub">CONSULTORES</div>
          </div>
        </div>
        <div class="title-box">
          <h1 class="report-title">${title}</h1>
          <div class="report-sub">${subtitle || `Periodo: ${currentMonth} · Saldo según registros contables`}</div>
          <div class="report-meta">Generado el ${dateStr} ${timeStr} por ${username || 'Administrador'} · CMC Cobranzas</div>
        </div>
      </div>

      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">${totalCellsHtml}</tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="signature-box">
          ${username || 'Sofía Supervisora'}<br/>
          <span style="font-size: 8.5px; font-weight: normal; color: #64748B;">Responsable de Emisión / Cobranzas</span>
        </div>
        <div class="signature-box">
          Stalin Krak<br/>
          <span style="font-size: 8.5px; font-weight: normal; color: #64748B;">Supervisor General / Aprobación</span>
        </div>
      </div>

      <div class="footer-note">
        <span>Documento oficial confidencial emitido por el Sistema Integral CMC Cobranzas.</span>
        <span>Página 1 de 1 · Clear Minds Consultores C.A.</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

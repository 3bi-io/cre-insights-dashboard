/**
 * ExcelJS helper utilities
 * Centralizes Excel read/write operations using the secure exceljs library
 * (replaces vulnerable xlsx/SheetJS package)
 */
import ExcelJS from 'exceljs';

/**
 * Read an Excel file (ArrayBuffer) and return rows as JSON objects
 * Keys are taken from the first row (header)
 */
export async function readExcelFile<T extends Record<string, unknown> = Record<string, unknown>>(
  data: ArrayBuffer,
  sheetIndex = 0,
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[sheetIndex];
  if (!sheet) return [];

  const rows: T[] = [];
  const headers: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    const values = row.values as (string | number | boolean | null | undefined)[];
    // ExcelJS row.values is 1-indexed (index 0 is undefined)
    const cells = values.slice(1);

    if (rowNumber === 1) {
      cells.forEach((cell) => headers.push(String(cell ?? '')));
      return;
    }

    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header] = cells[i] ?? undefined;
    });
    rows.push(obj as T);
  });

  return rows;
}

/**
 * Create an Excel workbook from JSON data and trigger a browser download
 */
export async function writeExcelFile(
  sheets: Array<{
    name: string;
    data: Record<string, unknown>[];
    columnWidths?: number[];
  }>,
  filename: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    if (sheet.data.length === 0) continue;

    // Add header row
    const headers = Object.keys(sheet.data[0]);
    ws.addRow(headers);

    // Bold headers
    ws.getRow(1).font = { bold: true };

    // Add data rows
    for (const row of sheet.data) {
      ws.addRow(headers.map((h) => row[h] ?? ''));
    }

    // Auto-size columns
    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });
    } else {
      headers.forEach((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...sheet.data.map((r) => String(r[h] ?? '').length),
        );
        ws.getColumn(i + 1).width = Math.min(50, maxLen + 2);
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create an Excel workbook with AOA (array of arrays) sheets and download
 */
export async function writeExcelFileAOA(
  sheets: Array<{
    name: string;
    data: (string | number | null | undefined)[][];
    columnWidths?: number[];
  }>,
  filename: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    for (const row of sheet.data) {
      ws.addRow(row);
    }

    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create an Excel Blob (for export functions that return Blob)
 */
export async function createExcelBlob(
  sheets: Array<{
    name: string;
    data: (string | number | null | undefined)[][];
    columnWidths?: number[];
  }>,
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    for (const row of sheet.data) {
      ws.addRow(row);
    }
    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

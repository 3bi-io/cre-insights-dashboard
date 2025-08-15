
export const parseCsvData = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines.slice(0, 5).join('\n'));
  console.log('Detected CSV delimiter:', JSON.stringify(delimiter));

  const headers = parseCsvLine(lines[0], delimiter);
  console.log('CSV Headers found:', headers);

  const data = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, delimiter);
    const row: any = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? '';
    });
    console.log(`Row ${index + 1}:`, row);
    return row;
  });

  console.log(`Total rows parsed: ${data.length}`);
  return data;
};

export const parsePreviewData = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const delimiter = detectDelimiter(lines.slice(0, 5).join('\n'));
  const headers = parseCsvLine(lines[0], delimiter);
  const previewData = lines.slice(1, 4).map(line => {
    const values = parseCsvLine(line, delimiter);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
  return previewData;
};

// Helper function to properly parse CSV lines with quoted fields and a dynamic delimiter
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  // Clean up quoted fields
  return result.map(field => {
    // Remove surrounding quotes and clean up
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"');
    }
    return field;
  });
}

// Detect the delimiter by testing candidates and picking the one with the most fields
function detectDelimiter(sampleText: string): string {
  const candidates = [',', '\t', ';', '|'];
  const lines = sampleText.split('\n').filter(line => line.trim());
  const header = lines[0] || '';
  let bestDelimiter = ',';
  let bestCount = -1;

  for (const d of candidates) {
    const fields = parseCsvLine(header, d);
    if (fields.length > bestCount) {
      bestCount = fields.length;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

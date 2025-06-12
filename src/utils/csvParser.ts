
export const parseCsvData = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCsvLine(lines[0]);
  console.log('CSV Headers found:', headers);
  
  const data = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: any = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || '';
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
  
  const headers = parseCsvLine(lines[0]);
  const previewData = lines.slice(1, 4).map(line => {
    const values = parseCsvLine(line);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  return previewData;
};

// Helper function to properly parse CSV lines with quoted fields
function parseCsvLine(line: string): string[] {
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
    } else if (char === ',' && !inQuotes) {
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

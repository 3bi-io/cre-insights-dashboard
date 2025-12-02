
import React from 'react';
import { FileText } from 'lucide-react';

interface CsvRowData {
  [key: string]: string | number | boolean | null | undefined;
}

interface CsvPreviewProps {
  data: CsvRowData[];
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Preview (first 3 rows)
      </h4>
      <div className="max-h-40 overflow-auto border rounded">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              {Object.keys(data[0]).map(header => (
                <th key={header} className="p-2 text-left">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-t">
                {Object.values(row).map((value, i) => (
                  <td key={i} className="p-2 truncate max-w-32">{String(value ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CsvPreview;

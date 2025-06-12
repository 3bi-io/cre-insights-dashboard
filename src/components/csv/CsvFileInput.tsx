
import React from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CsvFileInputProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const CsvFileInput: React.FC<CsvFileInputProps> = ({ onFileSelect, disabled }) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="csv-upload" className="text-sm font-medium">
        Select CSV File
      </label>
      <Input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        Expected columns: client, radius, city, state, salary_min, salary_max, job_id, dest_city, dest_state, job_title, job_description, salary_type, url
      </p>
    </div>
  );
};

export default CsvFileInput;

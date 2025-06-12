
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CsvUploadButtonProps {
  onUpload: () => void;
  disabled: boolean;
  uploading: boolean;
}

const CsvUploadButton: React.FC<CsvUploadButtonProps> = ({ onUpload, disabled, uploading }) => {
  return (
    <Button 
      onClick={onUpload} 
      disabled={disabled}
      className="flex-1"
    >
      {uploading ? (
        <>
          <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Upload CSV
        </>
      )}
    </Button>
  );
};

export default CsvUploadButton;

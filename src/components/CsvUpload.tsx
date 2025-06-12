
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { parsePreviewData } from '@/utils/csvParser';
import CsvPreview from '@/components/CsvPreview';
import CsvFileInput from '@/components/csv/CsvFileInput';
import CsvUploadButton from '@/components/csv/CsvUploadButton';
import { useCsvUploadProcessor } from '@/components/csv/CsvUploadProcessor';

interface CsvUploadProps {
  onSuccess: () => void;
}

const CsvUpload: React.FC<CsvUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const { user } = useAuth();
  const { processUpload } = useCsvUploadProcessor();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    parsePreview(selectedFile);
  };

  const parsePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const previewData = parsePreviewData(text);
      setPreview(previewData);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    
    await processUpload({
      file,
      userId: user.id,
      onSuccess: () => {
        setFile(null);
        setPreview([]);
        onSuccess();
        setUploading(false);
      },
      onError: () => {
        setUploading(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Job Listings (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CsvFileInput 
          onFileSelect={handleFileSelect}
          disabled={uploading}
        />

        <CsvPreview data={preview} />

        <div className="flex gap-2">
          <CsvUploadButton
            onUpload={handleUpload}
            disabled={!file || uploading}
            uploading={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvUpload;

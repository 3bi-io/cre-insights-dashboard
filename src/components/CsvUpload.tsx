
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseCsvData, parsePreviewData } from '@/utils/csvParser';
import { mapCsvToJobListing } from '@/utils/jobMapper';
import CsvPreview from '@/components/CsvPreview';

interface CsvUploadProps {
  onSuccess: () => void;
}

const CsvUpload: React.FC<CsvUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

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
      setFile(selectedFile);
      parsePreview(selectedFile);
    }
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

  const uploadCsv = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const csvData = parseCsvData(text);

        // Get default platform and category IDs
        const { data: platforms } = await supabase.from('platforms').select('id').limit(1);
        const { data: categories } = await supabase.from('job_categories').select('id').limit(1);

        if (!platforms?.length || !categories?.length) {
          toast({
            title: "Setup required",
            description: "Please ensure platforms and job categories exist before uploading.",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }

        const jobListings = csvData.map(row => ({
          ...mapCsvToJobListing(row, user.id),
          platform_id: platforms[0].id,
          category_id: categories[0].id,
        })).filter(job => job.title || job.job_title);

        if (jobListings.length === 0) {
          toast({
            title: "No valid data",
            description: "No valid job listings found in the CSV file. Please ensure job_title column has data.",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }

        const { error } = await supabase
          .from('job_listings')
          .insert(jobListings);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload successful",
            description: `Successfully uploaded ${jobListings.length} job listings.`,
          });
          setFile(null);
          setPreview([]);
          onSuccess();
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the CSV file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
        <div className="space-y-2">
          <label htmlFor="csv-upload" className="text-sm font-medium">
            Select CSV File
          </label>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Expected columns: client, radius, city, state, salary_min, salary_max, job_id, dest_city, dest_state, job_title, job_description, salary_type, url
          </p>
        </div>

        <CsvPreview data={preview} />

        <div className="flex gap-2">
          <Button 
            onClick={uploadCsv} 
            disabled={!file || uploading}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvUpload;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const previewData = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      setPreview(previewData);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  };

  const mapCsvToJobListing = (csvRow: any) => {
    // Map CSV columns to database columns - using the new fields
    return {
      title: csvRow.job_title || '', // Use job_title from CSV as title
      description: csvRow.job_description || '', // Use job_description from CSV
      location: csvRow.city && csvRow.state ? `${csvRow.city}, ${csvRow.state}` : (csvRow.city || csvRow.state || ''),
      budget: csvRow.salary_max ? parseFloat(csvRow.salary_max) : null,
      experience_level: 'entry', // Default since not provided in CSV
      status: 'active', // Default status
      salary_min: csvRow.salary_min ? parseFloat(csvRow.salary_min) : null,
      salary_max: csvRow.salary_max ? parseFloat(csvRow.salary_max) : null,
      salary_type: csvRow.salary_type || null,
      remote_type: null, // Not provided in CSV
      city: csvRow.city || null,
      state: csvRow.state || null,
      client: csvRow.client || null,
      radius: csvRow.radius ? parseInt(csvRow.radius) : null,
      job_id: csvRow.job_id || null,
      dest_city: csvRow.dest_city || null,
      dest_state: csvRow.dest_state || null,
      job_title: csvRow.job_title || null,
      job_description: csvRow.job_description || null,
      url: csvRow.url || null,
      user_id: user?.id,
    };
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
          ...mapCsvToJobListing(row),
          platform_id: platforms[0].id,
          category_id: categories[0].id,
        })).filter(job => job.title || job.job_title); // Include rows with either title or job_title

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

        {preview.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Preview (first 3 rows)
            </h4>
            <div className="max-h-40 overflow-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(preview[0]).map(header => (
                      <th key={header} className="p-2 text-left">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-t">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="p-2 truncate max-w-32">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

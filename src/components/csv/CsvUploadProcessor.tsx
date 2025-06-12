
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseCsvData } from '@/utils/csvParser';
import { mapCsvToJobListing } from '@/utils/jobMapper';

interface CsvUploadProcessorProps {
  file: File;
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const useCsvUploadProcessor = () => {
  const { toast } = useToast();

  const processUpload = async ({ file, userId, onSuccess, onError }: CsvUploadProcessorProps) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const csvData = parseCsvData(text);

        // Get default platform and category IDs
        const { data: platforms } = await supabase.from('platforms').select('id').limit(1);
        const { data: categories } = await supabase.from('job_categories').select('id').limit(1);

        if (!platforms?.length || !categories?.length) {
          const errorMsg = "Please ensure platforms and job categories exist before uploading.";
          toast({
            title: "Setup required",
            description: errorMsg,
            variant: "destructive",
          });
          onError(errorMsg);
          return;
        }

        const jobListings = csvData.map(row => ({
          ...mapCsvToJobListing(row, userId),
          platform_id: platforms[0].id,
          category_id: categories[0].id,
        })).filter(job => job.title || job.job_title);

        if (jobListings.length === 0) {
          const errorMsg = "No valid job listings found in the CSV file. Please ensure job_title column has data.";
          toast({
            title: "No valid data",
            description: errorMsg,
            variant: "destructive",
          });
          onError(errorMsg);
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
          onError(error.message);
        } else {
          toast({
            title: "Upload successful",
            description: `Successfully uploaded ${jobListings.length} job listings.`,
          });
          onSuccess();
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = "Failed to process the CSV file.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      onError(errorMsg);
    }
  };

  return { processUpload };
};

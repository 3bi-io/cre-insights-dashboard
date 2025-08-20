
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
      console.log('Starting CSV upload process for file:', file.name);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        console.log('File read complete, parsing CSV data...');
        
        const csvData = parseCsvData(text);
        console.log(`Parsed ${csvData.length} rows from CSV`);

        // Get default platform and category IDs
        
        const { data: categories } = await supabase.from('job_categories').select('id').limit(1);

        if (!categories?.length) {
          const errorMsg = "Please ensure job categories exist before uploading.";
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
          category_id: categories[0].id,
        }));

        console.log(`Mapped ${jobListings.length} job listings`);

        // Filter out jobs that don't have a title (be more lenient)
        const validJobListings = jobListings.filter(job => {
          const hasTitle = (job.title && job.title.trim()) || (job.job_title && job.job_title.trim());
          if (!hasTitle) {
            console.log('Filtering out job without title:', job);
          }
          return hasTitle;
        });

        console.log(`${validJobListings.length} valid job listings after filtering`);

        if (validJobListings.length === 0) {
          const errorMsg = "No valid job listings found in the CSV file. Please ensure job_title column has data.";
          toast({
            title: "No valid data",
            description: errorMsg,
            variant: "destructive",
          });
          onError(errorMsg);
          return;
        }

        console.log('Inserting job listings into database...');
        const { error, data } = await supabase
          .from('job_listings')
          .insert(validJobListings)
          .select();

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          });
          onError(error.message);
        } else {
          console.log(`Successfully inserted ${data?.length || validJobListings.length} job listings`);
          toast({
            title: "Upload successful",
            description: `Successfully uploaded ${data?.length || validJobListings.length} out of ${csvData.length} job listings.`,
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

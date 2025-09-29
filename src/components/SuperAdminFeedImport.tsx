import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SuperAdminFeedImportProps {
  feedUrl: string;
  organizationId: string;
  organizationName: string;
}

export const SuperAdminFeedImport = ({ feedUrl, organizationId, organizationName }: SuperAdminFeedImportProps) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-jobs-from-feed', {
        body: {
          feedUrl,
          organizationId
        }
      });

      if (error) {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Import Successful",
          description: `${data.message} for ${organizationName}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data?.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: "Import Failed",
        description: "Failed to import jobs from feed",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={importing}
      size="sm"
      className="w-full"
    >
      {importing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Importing...
        </>
      ) : (
        'Import Jobs'
      )}
    </Button>
  );
};
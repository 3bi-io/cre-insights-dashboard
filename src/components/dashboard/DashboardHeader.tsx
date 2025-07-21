
import React from 'react';
import { Calendar, Download, Settings, Bell, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApplications } from '@/hooks/useApplications';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

const DashboardHeader = () => {
  const { data: applications = [] } = useApplications();
  const { toast } = useToast();

  const handleExportPDF = () => {
    try {
      generateApplicationsPDF(applications);
      toast({
        title: "PDF Downloaded",
        description: "Applications report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
              Dashboard
            </h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Calendar className="w-4 h-4" />
              <span>Last 30 Days</span>
            </Button>
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              className="flex items-center gap-2 h-10"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

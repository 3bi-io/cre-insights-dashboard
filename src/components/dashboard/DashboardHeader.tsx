
import React from 'react';
import { Download, ExternalLink, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { generateDashboardPDF } from '@/utils/dashboardPdfGenerator';
import DateRangePicker from './DateRangePicker';
import FilterDialog from './FilterDialog';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';

const DashboardHeader = () => {
  const { toast } = useToast();
  const { dateRange, setDateRange, filters, setFilters } = useDashboardFilters();

  const handleExportPDF = () => {
    try {
      generateDashboardPDF();
      toast({
        title: "PDF Downloaded",
        description: "Dashboard report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    toast({
      title: "Filters Applied",
      description: "Dashboard data has been filtered",
    });
  };

  const handleOpenIndeedFeed = () => {
    const feedUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/indeed-xml-feed';
    window.open(feedUrl, '_blank');
    toast({
      title: "Indeed XML Feed",
      description: "Feed opened in new tab",
    });
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
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            
            <FilterDialog onFiltersChange={handleFiltersChange} />
            
            <Button 
              variant="outline" 
              size="default" 
              className="flex items-center gap-2 h-10"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="h-10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenIndeedFeed}>
                  <img 
                    src="/lovable-uploads/00cf88bc-aaab-4e8e-8908-3bfd7c363516.png" 
                    alt="Indeed" 
                    className="w-4 h-4 mr-2"
                  />
                  Indeed XML Feed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-2 ml-2">
              <NotificationsPanel />
              <SettingsPanel />
            </div>
          </div>

          {/* Mobile version with simplified layout */}
          <div className="flex lg:hidden items-center gap-2">
            <NotificationsPanel />
            <SettingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

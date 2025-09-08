
import React from 'react';
import { Calendar, Download, Settings, Bell, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardHeader = () => {
  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-8 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              C.R. England - Job Advertising Analytics
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Monitor spend, track performance, and optimize your job advertising campaigns across all publishers
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Last 30 Days</span>
            </Button>
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
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


import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface DashboardFilters {
  status: string;
  platform: string;
  category: string;
  location: string;
  metrics: {
    showSpend: boolean;
    showApplications: boolean;
    showConversions: boolean;
    showCTR: boolean;
  };
}

interface FilterDialogProps {
  onFiltersChange: (filters: DashboardFilters) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({ onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    category: '',
    location: '',
    metrics: {
      showSpend: true,
      showApplications: true,
      showConversions: true,
      showCTR: true,
    }
  });

  const handleApplyFilters = () => {
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: '__ALL__',
      platform: '__ALL__',
      category: '__ALL__',
      location: '__ALL__',
      metrics: {
        showSpend: true,
        showApplications: true,
        showConversions: true,
        showCTR: true,
      }
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-10">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Job Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Filter */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select
              value={filters.platform}
              onValueChange={(value) => setFilters({ ...filters, platform: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All publishers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All publishers</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="ziprecruiter">ZipRecruiter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="glassdoor">Glassdoor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Job Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All categories</SelectItem>
                <SelectItem value="cdl-a">CDL-A</SelectItem>
                <SelectItem value="cdl-b">CDL-B</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="otr">OTR</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Display */}
          <div className="space-y-2">
            <Label>Show Metrics</Label>
            <div className="space-y-3">
              {Object.entries(filters.metrics).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(value) =>
                      setFilters({
                        ...filters,
                        metrics: { ...filters.metrics, [key]: value }
                      })
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;

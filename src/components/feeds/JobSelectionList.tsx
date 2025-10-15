import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface Job {
  id?: string;
  title?: string;
  name?: string;
  company?: string;
  location?: string;
  category?: string;
  division?: string;
  description?: string;
  url?: string;
  salary?: string;
  jobtype?: string;
  [key: string]: any;
}

interface JobSelectionListProps {
  jobs: Job[];
  selectedJobs: Set<string>;
  onToggleJob: (jobId: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export const JobSelectionList: React.FC<JobSelectionListProps> = ({
  jobs,
  selectedJobs,
  onToggleJob,
  onToggleAll,
}) => {
  const allSelected = jobs.length > 0 && jobs.every(job => job.id && selectedJobs.has(job.id));
  const someSelected = jobs.some(job => job.id && selectedJobs.has(job.id)) && !allSelected;

  // Group jobs by category/division
  const groupedJobs = jobs.reduce((acc, job) => {
    const category = job.category || job.division || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={onToggleAll}
          className="data-[state=checked]:bg-primary"
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {allSelected ? 'Deselect All' : 'Select All'} ({selectedJobs.size} of {jobs.length} selected)
        </label>
      </div>

      {/* Grouped Job Lists */}
      {Object.entries(groupedJobs).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryJobs]) => (
        <div key={category} className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground px-2">{category}</h3>
          <div className="space-y-2">
            {categoryJobs.map((job) => (
              <Card key={job.id || Math.random()} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={job.id || ''}
                      checked={job.id ? selectedJobs.has(job.id) : false}
                      onCheckedChange={() => job.id && onToggleJob(job.id)}
                      className="mt-1 data-[state=checked]:bg-primary"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <label
                          htmlFor={job.id || ''}
                          className="text-sm font-semibold cursor-pointer hover:text-primary"
                        >
                          {job.title || job.name || 'Untitled Job'}
                        </label>
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {job.company && (
                          <Badge variant="secondary" className="text-xs">
                            {job.company}
                          </Badge>
                        )}
                        {job.location && (
                          <Badge variant="outline" className="text-xs">
                            📍 {job.location}
                          </Badge>
                        )}
                        {job.jobtype && (
                          <Badge variant="outline" className="text-xs">
                            {job.jobtype}
                          </Badge>
                        )}
                        {job.salary && (
                          <Badge variant="outline" className="text-xs">
                            💰 {job.salary}
                          </Badge>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

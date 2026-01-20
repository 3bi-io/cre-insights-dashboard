import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Loader2 } from 'lucide-react';
import { JobSelectionList } from '@/components/feeds/JobSelectionList';

interface Feed {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  status?: string;
  type?: string;
  description?: string;
  last_updated?: string;
  category?: string;
  division?: string;
  company?: string;
  location?: string;
  source?: string;
  [key: string]: any;
}

interface FeedJobsListProps {
  feeds: Feed[];
  feedSource: 'cdl_jobcast' | 'crengland';
  selectiveImport: boolean;
  selectedJobs: Set<string>;
  onToggleJob: (jobId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onImportSelected: () => void;
  isImporting: boolean;
}

export const FeedJobsList: React.FC<FeedJobsListProps> = ({
  feeds,
  feedSource,
  selectiveImport,
  selectedJobs,
  onToggleJob,
  onToggleAll,
  onImportSelected,
  isImporting,
}) => {
  if (feeds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Listings ({feeds.length})</CardTitle>
            <CardDescription>
              {selectiveImport ? 'Select jobs to import' : 'All jobs fetched from feed'}
            </CardDescription>
          </div>
          <Badge variant="outline">
            Source: {feedSource === 'cdl_jobcast' ? 'CDL Job Cast' : 'CR England'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {selectiveImport ? (
          <div className="space-y-4">
            <JobSelectionList
              jobs={feeds}
              selectedJobs={selectedJobs}
              onToggleJob={onToggleJob}
              onToggleAll={onToggleAll}
            />
            <Button
              onClick={onImportSelected}
              disabled={isImporting || selectedJobs.size === 0}
              className="w-full"
              size="lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import {selectedJobs.size} Selected Job{selectedJobs.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.map((job, index) => (
              <Card key={job.id || index} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{job.title || job.name}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {job.company && <Badge variant="secondary">{job.company}</Badge>}
                      {job.location && <Badge variant="outline">📍 {job.location}</Badge>}
                      {job.category && <Badge variant="outline">{job.category}</Badge>}
                      {job.division && <Badge variant="outline">{job.division}</Badge>}
                    </div>
                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {job.description}
                      </p>
                    )}
                  </div>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface JobsEmptyStateProps {
  searchTerm?: string;
  hasFilter?: boolean;
  onShowUploadDialog: () => void;
}

const JobsEmptyState: React.FC<JobsEmptyStateProps> = ({ 
  searchTerm, 
  hasFilter, 
  onShowUploadDialog 
}) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No job listings found</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm || hasFilter 
            ? 'Try adjusting your search terms or filters.' 
            : 'Get started by uploading a CSV file with your job listings.'
          }
        </p>
        {!searchTerm && !hasFilter && (
          <Button variant="outline" onClick={onShowUploadDialog}>
            Upload CSV
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default JobsEmptyState;
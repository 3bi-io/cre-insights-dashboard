
import React from 'react';

const PlatformsTableHeader: React.FC = () => {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
        <th className="text-left py-3 px-4 font-medium text-muted-foreground">API Endpoint</th>
        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
      </tr>
    </thead>
  );
};

export default PlatformsTableHeader;

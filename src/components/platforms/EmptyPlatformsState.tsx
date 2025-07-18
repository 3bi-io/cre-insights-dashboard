
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const EmptyPlatformsState: React.FC = () => {
  return (
    <Card>
      <CardContent className="text-center py-12 px-4">
        <div className="text-gray-500 mb-4">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No platforms found</h3>
          <p className="text-sm sm:text-base">Get started by adding your first advertising platform.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyPlatformsState;

import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useRocketLaunch } from '../../hooks/useRocketLaunch';

interface RocketLaunchButtonProps {
  unpublishedCount?: number;
}

export function RocketLaunchButton({ unpublishedCount = 0 }: RocketLaunchButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { launchAll, isLaunching } = useRocketLaunch();

  const handleConfirm = () => {
    setShowConfirm(false);
    launchAll();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isLaunching || unpublishedCount === 0}
        className="relative"
      >
        {isLaunching ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-4 w-4" />
        )}
        {isLaunching ? 'Launching...' : 'Launch All'}
        {unpublishedCount > 0 && !isLaunching && (
          <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 text-xs">
            {unpublishedCount}
          </Badge>
        )}
      </Button>

      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="🚀 Launch All Creatives"
        description={`This will publish ${unpublishedCount} unpublished creative${unpublishedCount !== 1 ? 's' : ''} to all connected social platforms. This action cannot be undone.`}
        confirmLabel="Launch Now"
        onConfirm={handleConfirm}
        isLoading={isLaunching}
      />
    </>
  );
}

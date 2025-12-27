import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import type { TopReferrer } from '../../types/applyAnalytics';

interface ApplyPageTopReferrersProps {
  data: TopReferrer[];
  isLoading?: boolean;
}

export const ApplyPageTopReferrers: React.FC<ApplyPageTopReferrersProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatReferrer = (referrer: string): string => {
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return referrer.length > 40 ? referrer.substring(0, 40) + '...' : referrer;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Top Referrers</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No referrer data available
          </p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 8).map((referrer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {formatReferrer(referrer.referrer)}
                  </span>
                  <a
                    href={referrer.referrer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {referrer.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplyPageTopReferrers;

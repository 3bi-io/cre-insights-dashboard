import { UniversalFeedManager } from '@/components/feeds/UniversalFeedManager';

const UniversalFeeds = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Universal XML Feeds</h1>
        <p className="text-muted-foreground">
          Create public XML feeds for external job boards and aggregators
        </p>
      </div>
      <UniversalFeedManager />
    </div>
  );
};

export default UniversalFeeds;

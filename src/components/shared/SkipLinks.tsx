import React from 'react';

interface SkipLinksProps {
  mainContentId?: string;
  navigationId?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  mainContentId = 'main-content',
  navigationId = 'main-navigation'
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href={`#${mainContentId}`}
        className="absolute top-0 left-0 z-50 px-4 py-2 bg-primary text-primary-foreground focus:not-sr-only focus:outline-none"
      >
        Skip to main content
      </a>
      <a
        href={`#${navigationId}`}
        className="absolute top-0 left-32 z-50 px-4 py-2 bg-primary text-primary-foreground focus:not-sr-only focus:outline-none"
      >
        Skip to navigation
      </a>
    </div>
  );
};

export default SkipLinks;

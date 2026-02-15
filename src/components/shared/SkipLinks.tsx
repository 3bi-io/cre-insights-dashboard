import React from 'react';

interface SkipLink {
  id: string;
  label: string;
}

interface SkipLinksProps {
  mainContentId?: string;
  navigationId?: string;
  extraLinks?: SkipLink[];
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  mainContentId = 'main-content',
  navigationId = 'main-navigation',
  extraLinks = [],
}) => {
  const allLinks: SkipLink[] = [
    { id: mainContentId, label: 'Skip to main content' },
    { id: navigationId, label: 'Skip to navigation' },
    ...extraLinks,
  ];

  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      {allLinks.map((link, idx) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="absolute top-0 z-50 px-4 py-2 bg-primary text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
          style={{ left: `${idx * 10}rem` }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;

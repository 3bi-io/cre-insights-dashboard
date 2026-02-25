/**
 * Shared layout for legal pages (Privacy, Terms, Cookies)
 * Features: scroll-spy TOC sidebar, accordion sections, download PDF, print styles
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, Printer, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  icon: React.ReactNode;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  breadcrumbPath: string;
  sections: LegalSection[];
  introAlert?: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  lastUpdated,
  icon,
  seoTitle,
  seoDescription,
  canonical,
  breadcrumbPath,
  sections,
  introAlert,
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [openSections, setOpenSections] = useState<string[]>(sections.map(s => s.id));
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const breadcrumbs = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: title, href: breadcrumbPath },
  ]), [title, breadcrumbPath]);

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    toast.info('Opening print dialog — save as PDF from your browser.');
    window.print();
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!openSections.includes(id)) {
      setOpenSections(prev => [...prev, id]);
    }
  };

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} canonical={canonical} />
      <StructuredData data={breadcrumbs} />
      <div className="min-h-screen bg-background animate-page-in print:animate-none">
        {/* Hero */}
        <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-4">{icon}</div>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-4">{title}</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last updated: {lastUpdated}</span>
            </div>
            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 mt-6 print:hidden">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
                <Download className="h-4 w-4" /> Save PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </section>

        {/* Content with TOC sidebar */}
        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-10">
              {/* TOC Sidebar — desktop only */}
              <aside className="hidden lg:block w-56 shrink-0 print:hidden">
                <nav className="sticky top-24 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'block w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors truncate',
                        activeSection === section.id
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div className="flex-1 max-w-4xl">
                {introAlert && <div className="mb-8">{introAlert}</div>}

                <Accordion
                  type="multiple"
                  value={openSections}
                  onValueChange={setOpenSections}
                  className="space-y-4"
                >
                  {sections.map(section => (
                    <div
                      key={section.id}
                      id={section.id}
                      ref={el => { sectionRefs.current[section.id] = el; }}
                      className="scroll-mt-24"
                    >
                      <AccordionItem value={section.id} className="border rounded-lg px-4 md:px-6 bg-card">
                        <AccordionTrigger className="text-base md:text-lg font-semibold hover:no-underline py-4">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                          {section.content}
                        </AccordionContent>
                      </AccordionItem>
                    </div>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LegalPageLayout;

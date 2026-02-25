/**
 * Blog FAQ Section
 * Renders FAQ accordion with FAQPage structured data schema
 * High-impact for AEO/GEO — AI engines pull FAQ answers directly
 */

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { StructuredData, buildFAQSchema } from '@/components/StructuredData';
import { HelpCircle } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface BlogFAQSectionProps {
  faqs: FAQItem[];
}

const BlogFAQSection: React.FC<BlogFAQSectionProps> = ({ faqs }) => {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mb-12" aria-label="Frequently Asked Questions">
      <StructuredData data={buildFAQSchema(faqs)} />
      
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Frequently Asked Questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="border rounded-lg">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`} className="px-4">
            <AccordionTrigger className="text-left text-sm font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default BlogFAQSection;

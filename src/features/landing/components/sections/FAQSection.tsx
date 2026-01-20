/**
 * FAQ Section Component
 * Displays frequently asked questions with structured data
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionWrapper } from '../shared/SectionWrapper';
import { faqContent } from '../../content/faq.content';

const FAQSection = () => {
  return (
    <SectionWrapper variant="muted" className="py-16" containerClassName="max-w-4xl">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqContent.faqs.map((faq) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
      
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {faqContent.title}
        </h2>
        <p className="text-lg text-muted-foreground">
          {faqContent.description}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqContent.faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left min-h-[48px] py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          {faqContent.footer.text}
        </p>
        <a 
          href={faqContent.footer.linkUrl}
          className="text-primary hover:underline font-semibold"
        >
          {faqContent.footer.linkText}
        </a>
      </div>
    </SectionWrapper>
  );
};

export default FAQSection;

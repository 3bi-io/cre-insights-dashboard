/**
 * Structured Data Component
 * Renders JSON-LD schemas for SEO
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  data: object | object[];
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const schemas = Array.isArray(data) ? data : [data];
  
  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

// Common schema builders
export const buildBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url,
  })),
});

export const buildFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
});

// Base URL for structured data - can be overridden via environment variable
const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://ats.me';

export const buildWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ATS.me",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const buildJobPostingSchema = (job: {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization: string;
  jobLocation: {
    city?: string;
    state?: string;
    country?: string;
  };
  baseSalary?: {
    value: number;
    currency: string;
  };
}) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": job.title,
  "description": job.description,
  "datePosted": job.datePosted,
  "validThrough": job.validThrough,
  "employmentType": job.employmentType || "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": job.hiringOrganization,
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": job.jobLocation.city,
      "addressRegion": job.jobLocation.state,
      "addressCountry": job.jobLocation.country || "US",
    },
  },
  ...(job.baseSalary && {
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": job.baseSalary.currency,
      "value": {
        "@type": "QuantitativeValue",
        "value": job.baseSalary.value,
        "unitText": "YEAR",
      },
    },
  }),
});

export const buildArticleSchema = (article: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  publisher: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.headline,
  "description": article.description,
  "image": article.image,
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "author": {
    "@type": "Person",
    "name": article.author,
  },
  "publisher": {
    "@type": "Organization",
    "name": article.publisher,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`,
    },
  },
});

export const buildHowToSchema = (howTo: {
  name: string;
  description: string;
  totalTime?: string;
  steps: Array<{ name: string; text: string }>;
}) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": howTo.name,
  "description": howTo.description,
  ...(howTo.totalTime && { "totalTime": howTo.totalTime }),
  "step": howTo.steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
  })),
});

/**
 * Structured Data Component
 * Renders JSON-LD schemas for SEO
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { JobPostingSchemaInput } from '@/types/googleJobs';
import { EMPLOYMENT_TYPE_MAP, SALARY_UNIT_MAP } from '@/types/googleJobs';

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

/**
 * Build a Google Jobs compliant JobPosting schema
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export const buildJobPostingSchema = (job: JobPostingSchemaInput) => {
  // Normalize employment type
  const normalizedEmploymentType = job.employmentType 
    ? (EMPLOYMENT_TYPE_MAP[job.employmentType.toLowerCase()] || job.employmentType.toUpperCase())
    : 'FULL_TIME';

  // Build the base schema
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.datePosted.split('T')[0], // ISO date format
    "validThrough": job.validThrough || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": normalizedEmploymentType,
    "directApply": job.directApply ?? true,
    
    // Required: identifier for tracking
    "identifier": {
      "@type": "PropertyValue",
      "name": job.hiringOrganization,
      "value": job.id
    },
    
    // Required: hiring organization
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.hiringOrganization,
      ...(job.hiringOrganizationUrl && { "sameAs": job.hiringOrganizationUrl }),
      ...(job.hiringOrganizationLogo && { 
        "logo": job.hiringOrganizationLogo 
      })
    }
  };

  // Job location handling
  if (job.remoteType === 'fully_remote') {
    // Fully remote jobs
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = {
      "@type": "Country",
      "name": job.jobLocation?.country || "US"
    };
  } else if (job.jobLocation) {
    // On-site or hybrid jobs
    schema.jobLocation = {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        ...(job.jobLocation.streetAddress && { "streetAddress": job.jobLocation.streetAddress }),
        ...(job.jobLocation.city && { "addressLocality": job.jobLocation.city }),
        ...(job.jobLocation.state && { "addressRegion": job.jobLocation.state }),
        ...(job.jobLocation.postalCode && { "postalCode": job.jobLocation.postalCode }),
        "addressCountry": job.jobLocation.country || "US"
      }
    };
    
    // Add telecommute for hybrid
    if (job.remoteType === 'hybrid') {
      schema.jobLocationType = "TELECOMMUTE";
    }
  }

  // Salary handling with min/max support
  if (job.baseSalary) {
    const { minValue, maxValue, currency, unitText } = job.baseSalary;
    
    if (minValue || maxValue) {
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        "currency": currency || "USD",
        "value": {
          "@type": "QuantitativeValue",
          ...(minValue && maxValue ? {
            "minValue": minValue,
            "maxValue": maxValue
          } : {
            "value": minValue || maxValue
          }),
          "unitText": unitText || "YEAR"
        }
      };
    }
  }

  return schema;
};

// Legacy function signature for backwards compatibility
export const buildJobPostingSchemaLegacy = (job: {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization: string;
  jobLocation?: {
    city?: string;
    state?: string;
    country?: string;
  };
  baseSalary?: {
    value: number;
    currency: string;
  };
}) => buildJobPostingSchema({
  id: crypto.randomUUID(),
  title: job.title,
  description: job.description,
  datePosted: job.datePosted,
  validThrough: job.validThrough,
  employmentType: job.employmentType,
  hiringOrganization: job.hiringOrganization,
  jobLocation: job.jobLocation,
  baseSalary: job.baseSalary ? {
    minValue: job.baseSalary.value,
    currency: job.baseSalary.currency,
    unitText: 'YEAR'
  } : undefined
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

/**
 * Helper function to get salary unit text from salary type
 */
export function getSalaryUnitText(salaryType: string | null | undefined): 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' {
  if (!salaryType) return 'YEAR';
  return SALARY_UNIT_MAP[salaryType.toLowerCase()] || 'YEAR';
}

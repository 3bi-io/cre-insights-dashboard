import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  jobCount: number;
  errors: string[];
  warnings: string[];
  xmlPreview: string;
  jsonLdPreview?: string;
}

const GoogleJobsFeedValidator: React.FC<{ feedUrl: string }> = ({ feedUrl }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [showJsonLdPreview, setShowJsonLdPreview] = useState(false);
  const { toast } = useToast();

  const validateXMLStructure = (xmlText: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let jobCount = 0;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        errors.push('XML syntax error: ' + parseError.textContent);
        return { isValid: false, jobCount: 0, errors, warnings, xmlPreview: xmlText.substring(0, 500) };
      }

      // Check RSS structure
      const rss = xmlDoc.querySelector('rss');
      if (!rss) {
        errors.push('Missing RSS root element');
      } else {
        const version = rss.getAttribute('version');
        if (version !== '2.0') {
          warnings.push('RSS version should be 2.0 for Google Jobs compatibility');
        }

        // Check for Google namespace
        const googleNS = rss.getAttribute('xmlns:g');
        if (!googleNS || !googleNS.includes('base.google.com')) {
          errors.push('Missing Google Base namespace (xmlns:g="http://base.google.com/ns/1.0")');
        }
      }

      // Check channel
      const channel = xmlDoc.querySelector('channel');
      if (!channel) {
        errors.push('Missing channel element');
      } else {
        // Check required channel elements
        const requiredChannelElements = ['title', 'description', 'link'];
        requiredChannelElements.forEach(element => {
          if (!channel.querySelector(element)) {
            errors.push(`Missing required channel element: ${element}`);
          }
        });
      }

      // Check job items
      const items = xmlDoc.querySelectorAll('item');
      jobCount = items.length;

      if (jobCount === 0) {
        warnings.push('No job items found in the feed');
      }

      // Validate each job item (and map to JSON-LD JobPosting)
      let jsonLdPreview = '';
      items.forEach((item, index) => {
        const requiredJobFields = [
          'g\\:job_title',
          'g\\:job_description', 
          'g\\:job_location',
          'g\\:company_name',
          'g\\:application_url'
        ];

        requiredJobFields.forEach(field => {
          const selector = field; // namespace already escaped
          if (!item.querySelector(selector)) {
            errors.push(`Job ${index + 1}: Missing required field ${field.replace('g\\:', '')}`);
          }
        });

        // Check for valid URLs
        const appUrl = item.querySelector('g\\:application_url')?.textContent?.trim() || '';
        if (appUrl) {
          try { new URL(appUrl); } catch { errors.push(`Job ${index + 1}: Invalid application URL`); }
        }

        // Check date formats
        const datePostedText = item.querySelector('g\\:date_posted')?.textContent?.trim() || '';
        if (datePostedText) {
          const date = new Date(datePostedText);
          if (isNaN(date.getTime())) {
            errors.push(`Job ${index + 1}: Invalid date_posted format`);
          }
        } else {
          warnings.push(`Job ${index + 1}: Missing date_posted (required for JobPosting.datePosted)`);
        }

        // JSON-LD JobPosting schema checks based on provided template
        const title = item.querySelector('g\\:job_title')?.textContent?.trim() || '';
        const description = item.querySelector('g\\:job_description')?.textContent?.trim() || '';
        const company = item.querySelector('g\\:company_name')?.textContent?.trim() || '';
        const jobId = item.querySelector('g\\:job_id')?.textContent?.trim() || item.querySelector('guid')?.textContent?.trim() || '';
        const jobType = item.querySelector('g\\:job_type')?.textContent?.trim() || '';
        const location = item.querySelector('g\\:job_location')?.textContent?.trim() || '';
        const validThrough = item.querySelector('g\\:valid_through')?.textContent?.trim() || '';
        const salaryText = item.querySelector('g\\:salary')?.textContent?.trim() || '';

        if (!jobId) {
          warnings.push(`Job ${index + 1}: Missing job_id/guid for identifier.value`);
        }
        const allowedEmployment = ['FULL_TIME','PART_TIME','CONTRACTOR','TEMPORARY','INTERN','VOLUNTEER'];
        if (jobType && !allowedEmployment.includes(jobType.toUpperCase())) {
          warnings.push(`Job ${index + 1}: job_type "${jobType}" not in ${allowedEmployment.join(', ')}`);
        }
        // Location -> PostalAddress expectations
        const hasCity = /,/.test(location) || /\b[A-Z]{2}\b/.test(location);
        if (!hasCity) {
          warnings.push(`Job ${index + 1}: job_location should include city and region (e.g., "City, ST") for PostalAddress`);
        }
        // validThrough formatting
        if (validThrough) {
          const dt = new Date(validThrough);
          if (isNaN(dt.getTime())) {
            errors.push(`Job ${index + 1}: Invalid valid_through format`);
          }
        } else {
          warnings.push(`Job ${index + 1}: Missing valid_through (JobPosting.validThrough)`);
        }
        // Salary mapping note
        if (salaryText) {
          const hasUnit = /(hour|week|year)/i.test(salaryText);
          if (!hasUnit) {
            warnings.push(`Job ${index + 1}: salary should include unit (HOUR/WEEK/YEAR) for JSON-LD baseSalary.value.unitText`);
          }
        } else {
          warnings.push(`Job ${index + 1}: Missing salary; JSON-LD baseSalary is recommended`);
        }

        // Build JSON-LD preview for first item
        if (index === 0) {
          // Attempt to derive minimal JSON-LD object
          const unit = /hour/i.test(salaryText) ? 'HOUR' : /week/i.test(salaryText) ? 'WEEK' : /year/i.test(salaryText) ? 'YEAR' : undefined;
          const valueMatch = salaryText.match(/\$?([\d,]+(\.\d+)?)/);
          const numericValue = valueMatch ? Number(valueMatch[1].replace(/,/g,'')) : undefined;
          const jsonLd: Record<string, unknown> = {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            title,
            description,
            identifier: jobId ? { "@type": "PropertyValue", name: company || 'Company', value: jobId } : undefined,
            datePosted: datePostedText ? datePostedText.split('T')[0] : undefined,
            validThrough: validThrough || undefined,
            employmentType: jobType || undefined,
            hiringOrganization: company ? { "@type": "Organization", name: company } : undefined,
            jobLocation: location ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: location.split(',')[0]?.trim(), addressRegion: location.split(',')[1]?.trim() } } : undefined,
            baseSalary: unit && numericValue ? { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", value: numericValue, unitText: unit } } : undefined
          };
          // Remove undefined keys
          const clean = JSON.parse(JSON.stringify(jsonLd));
          jsonLdPreview = JSON.stringify(clean, null, 2);
        }
      });

      return {
        isValid: errors.length === 0,
        jobCount,
        errors,
        warnings,
        xmlPreview: xmlText.substring(0, 1000),
        jsonLdPreview
      };

    } catch (error) {
      return {
        isValid: false,
        jobCount: 0,
        errors: ['Failed to parse XML: ' + (error as Error).message],
        warnings,
        xmlPreview: xmlText.substring(0, 500)
      };
    }
  };

  const validateFeed = async () => {
    if (!feedUrl) return;
    
    setIsValidating(true);
    try {
      const response = await fetch(feedUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const result = validateXMLStructure(xmlText);
      setValidationResult(result);

      if (result.isValid) {
        toast({
          title: "Feed validation successful",
          description: `Found ${result.jobCount} valid job listings`
        });
      } else {
        toast({
          title: "Feed validation failed",
          description: `Found ${result.errors.length} errors`,
          variant: "destructive"
        });
      }

    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        jobCount: 0,
        errors: [(error as Error).message],
        warnings: [],
        xmlPreview: ''
      };
      setValidationResult(errorResult);
      
      toast({
        title: "Validation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const downloadSampleXML = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Sample Job Feed</title>
    <description>Example job feed for Google Jobs</description>
    <link>https://example.com/jobs</link>
    <item>
      <title>Software Engineer</title>
      <description>Join our team as a Software Engineer...</description>
      <link>https://example.com/apply/123</link>
      <g:job_title>Software Engineer</g:job_title>
      <g:job_description>Join our team as a Software Engineer...</g:job_description>
      <g:job_location>San Francisco, CA</g:job_location>
      <g:company_name>Example Company</g:company_name>
      <g:job_type>FULL_TIME</g:job_type>
      <g:application_url>https://example.com/apply/123</g:application_url>
      <g:date_posted>2024-01-01T00:00:00Z</g:date_posted>
    </item>
  </channel>
</rss>`;

    const blob = new Blob([sampleXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-jobs-sample.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          XML Feed Validator
        </CardTitle>
        <CardDescription>
          Validate your XML feed against Google Jobs requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={validateFeed}
            disabled={!feedUrl || isValidating}
            className="flex-1"
          >
            {isValidating ? 'Validating...' : 'Validate Feed'}
          </Button>
          <Button
            onClick={downloadSampleXML}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Sample XML
          </Button>
        </div>

        {validationResult && (
          <div className="space-y-4">
            {/* Status */}
            <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
                  {validationResult.isValid 
                    ? `✅ Feed is valid with ${validationResult.jobCount} job listings`
                    : `❌ Feed validation failed with ${validationResult.errors.length} errors`
                  }
                </AlertDescription>
              </div>
            </Alert>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-700">Errors:</h4>
                <div className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-700">Warnings:</h4>
                <div className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* XML Preview */}
            {validationResult.xmlPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">XML Preview:</h4>
                  <Button
                    onClick={() => setShowXmlPreview(!showXmlPreview)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showXmlPreview ? 'Hide' : 'Show'} XML
                  </Button>
                </div>
                {showXmlPreview && (
                  <Textarea
                    value={validationResult.xmlPreview + (validationResult.xmlPreview.length >= 1000 ? '...' : '')}
                    readOnly
                    className="font-mono text-xs h-32"
                  />
                )}
              </div>
            )}

            {/* JSON-LD Preview */}
            {validationResult.jsonLdPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">JSON-LD Preview (JobPosting):</h4>
                  <Button
                    onClick={() => setShowJsonLdPreview(!showJsonLdPreview)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showJsonLdPreview ? 'Hide' : 'Show'} JSON-LD
                  </Button>
                </div>
                {showJsonLdPreview && (
                  <Textarea
                    value={validationResult.jsonLdPreview}
                    readOnly
                    className="font-mono text-xs h-48"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleJobsFeedValidator;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download,
  Eye,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validateSitemapFeed, 
  extractSitemapUrls,
  extractJsonLdFromHtml,
  findJobPostingSchema,
  validateJobPostingSchema 
} from '@/utils/googleJobsValidation';
import type { FeedValidationResult, ValidatedUrl } from '@/types/googleJobs';

interface GoogleJobsFeedValidatorProps {
  feedUrl: string;
}

const GoogleJobsFeedValidator: React.FC<GoogleJobsFeedValidatorProps> = ({ feedUrl }) => {
  const [validationResult, setValidationResult] = useState<FeedValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeepValidating, setIsDeepValidating] = useState(false);
  const [deepValidationProgress, setDeepValidationProgress] = useState(0);
  const [showSitemapPreview, setShowSitemapPreview] = useState(false);
  const [validatedUrls, setValidatedUrls] = useState<ValidatedUrl[]>([]);
  const { toast } = useToast();

  const validateFeed = async () => {
    if (!feedUrl) return;
    
    setIsValidating(true);
    setValidatedUrls([]);
    try {
      const response = await fetch(feedUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const result = validateSitemapFeed(xmlText);
      setValidationResult(result);

      if (result.isValid) {
        toast({
          title: "Sitemap validation successful",
          description: `Found ${result.urlCount} job URLs in the sitemap`
        });
      } else {
        toast({
          title: "Sitemap validation failed",
          description: `Found ${result.errors.length} errors`,
          variant: "destructive"
        });
      }

    } catch (error) {
      const errorResult: FeedValidationResult = {
        isValid: false,
        urlCount: 0,
        errors: [(error as Error).message],
        warnings: [],
        sitemapPreview: '',
        urlsWithJsonLd: 0,
        urlsWithoutJsonLd: 0
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

  const deepValidateUrls = async () => {
    if (!feedUrl) return;
    
    setIsDeepValidating(true);
    setDeepValidationProgress(0);
    const validated: ValidatedUrl[] = [];
    
    try {
      const response = await fetch(feedUrl);
      const xmlText = await response.text();
      const urls = extractSitemapUrls(xmlText);
      
      // Limit to first 10 URLs for performance
      const urlsToCheck = urls.slice(0, 10);
      
      for (let i = 0; i < urlsToCheck.length; i++) {
        const entry = urlsToCheck[i];
        setDeepValidationProgress(((i + 1) / urlsToCheck.length) * 100);
        
        const validatedUrl: ValidatedUrl = {
          url: entry.loc,
          hasJsonLd: false,
          errors: [],
          warnings: []
        };
        
        try {
          const pageResponse = await fetch(entry.loc);
          if (pageResponse.ok) {
            const html = await pageResponse.text();
            const jsonLdArray = extractJsonLdFromHtml(html);
            const jobPosting = findJobPostingSchema(jsonLdArray);
            
            if (jobPosting) {
              validatedUrl.hasJsonLd = true;
              validatedUrl.jobTitle = jobPosting.title as string;
              
              const schemaValidation = validateJobPostingSchema(jobPosting);
              validatedUrl.errors = schemaValidation.errors;
              validatedUrl.warnings = schemaValidation.warnings;
            } else {
              validatedUrl.errors.push('No JobPosting JSON-LD found on page');
            }
          } else {
            validatedUrl.errors.push(`Page returned HTTP ${pageResponse.status}`);
          }
        } catch (e) {
          validatedUrl.errors.push(`Failed to fetch page: ${(e as Error).message}`);
        }
        
        validated.push(validatedUrl);
      }
      
      setValidatedUrls(validated);
      
      const withJsonLd = validated.filter(v => v.hasJsonLd).length;
      const withoutJsonLd = validated.filter(v => !v.hasJsonLd).length;
      
      if (validationResult) {
        setValidationResult({
          ...validationResult,
          urlsWithJsonLd: withJsonLd,
          urlsWithoutJsonLd: withoutJsonLd,
          validatedUrls: validated
        });
      }
      
      toast({
        title: "Deep validation complete",
        description: `${withJsonLd}/${validated.length} URLs have valid JobPosting schema`
      });
      
    } catch (error) {
      toast({
        title: "Deep validation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsDeepValidating(false);
    }
  };

  const downloadSampleSitemap = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Job listing URLs - each page must contain JobPosting JSON-LD -->
  <url>
    <loc>https://example.com/jobs/software-engineer-123</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/jobs/product-manager-456</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const blob = new Blob([sampleXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-jobs-sitemap-sample.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openRichResultsTest = () => {
    if (validatedUrls.length > 0) {
      const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(validatedUrls[0].url)}`;
      window.open(testUrl, '_blank');
    } else {
      window.open('https://search.google.com/test/rich-results', '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Sitemap Feed Validator
        </CardTitle>
        <CardDescription>
          Validate your XML sitemap and verify job pages contain JobPosting JSON-LD schema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={validateFeed}
            disabled={!feedUrl || isValidating}
            className="flex-1 min-w-[140px]"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Sitemap'
            )}
          </Button>
          <Button
            onClick={deepValidateUrls}
            disabled={!feedUrl || isDeepValidating || !validationResult?.isValid}
            variant="secondary"
            className="flex-1 min-w-[140px]"
          >
            {isDeepValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking URLs...
              </>
            ) : (
              'Deep Validate (10 URLs)'
            )}
          </Button>
          <Button
            onClick={downloadSampleSitemap}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Sample
          </Button>
        </div>

        {isDeepValidating && (
          <div className="space-y-2">
            <Progress value={deepValidationProgress} />
            <p className="text-sm text-muted-foreground text-center">
              Checking job pages for JSON-LD schema...
            </p>
          </div>
        )}

        {validationResult && (
          <div className="space-y-4">
            {/* Status */}
            <Alert className={validationResult.isValid ? 'border-green-500/50 bg-green-500/10' : 'border-destructive/50 bg-destructive/10'}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <AlertDescription className={validationResult.isValid ? 'text-green-700' : 'text-destructive'}>
                  {validationResult.isValid 
                    ? `✅ Sitemap is valid with ${validationResult.urlCount} job URLs`
                    : `❌ Sitemap validation failed with ${validationResult.errors.length} errors`
                  }
                </AlertDescription>
              </div>
            </Alert>

            {/* JSON-LD Stats */}
            {validatedUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {validatedUrls.filter(v => v.hasJsonLd).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pages with JSON-LD</div>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {validatedUrls.filter(v => !v.hasJsonLd).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Missing JSON-LD</div>
                </div>
              </div>
            )}

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 bg-yellow-500/10 p-2 rounded">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validated URLs */}
            {validatedUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Validated Job Pages:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validatedUrls.map((validated, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        validated.hasJsonLd && validated.errors.length === 0 
                          ? 'border-green-500/50 bg-green-500/5' 
                          : 'border-destructive/50 bg-destructive/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {validated.hasJsonLd ? (
                              <Badge variant="outline" className="text-green-600 border-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                JSON-LD
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                            {validated.jobTitle && (
                              <span className="text-sm font-medium truncate">
                                {validated.jobTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {validated.url}
                          </p>
                          {validated.errors.length > 0 && (
                            <div className="mt-2 text-xs text-destructive">
                              {validated.errors.slice(0, 2).join(', ')}
                              {validated.errors.length > 2 && ` +${validated.errors.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sitemap Preview */}
            {validationResult.sitemapPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Sitemap Preview:</h4>
                  <Button
                    onClick={() => setShowSitemapPreview(!showSitemapPreview)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showSitemapPreview ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showSitemapPreview && (
                  <Textarea
                    value={validationResult.sitemapPreview + (validationResult.sitemapPreview.length >= 1000 ? '...' : '')}
                    readOnly
                    className="font-mono text-xs h-32"
                  />
                )}
              </div>
            )}

            {/* Google Tools */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={openRichResultsTest}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Rich Results Test
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleJobsFeedValidator;

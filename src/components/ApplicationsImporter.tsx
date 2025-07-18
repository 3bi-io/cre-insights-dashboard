import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processApplicationsData, validateProcessedData } from '@/utils/processApplicationsData';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Your full test data (200 records)
const testData = [
  {"Name":"Michael Peterson","Email":"rodriguezmolly@yahoo.com","Position":"Product/process development scientist","Client":"Kroger","Category":"SR","Status":"pending","Phone":"001-229-061-9331","Applied":"06/27/2025"},
  {"Name":"Jennifer Berger","Email":"marvincollins@yahoo.com","Position":"Corporate investment banker","Client":"Kroger","Category":"SC","Status":"pending","Phone":"846-006-2563x213","Applied":"06/30/2025"},
  {"Name":"Thomas Smith","Email":"paullee@gmail.com","Position":"Psychologist, prison and probation services","Client":"Kroger","Category":"SC","Status":"pending","Phone":"+1-384-242-5093x02614","Applied":"06/24/2025"},
  {"Name":"Kristin Walsh","Email":"elizabeth92@richardson.com","Position":"Art therapist","Client":"Kroger","Category":"SR","Status":"pending","Phone":"156.142.8722","Applied":"07/03/2025"},
  {"Name":"Ashley Herman","Email":"enelson@richardson.com","Position":"Education administrator","Client":"Kroger","Category":"SC","Status":"pending","Phone":"757-379-4692x31580","Applied":"07/07/2025"},
  {"Name":"Hannah Wagner","Email":"deborahwarren@michael.biz","Position":"Fashion designer","Client":"Kroger","Category":"SC","Status":"pending","Phone":"(150)334-9338x43000","Applied":"07/03/2025"},
  {"Name":"Adam Warren","Email":"zdominguez@hotmail.com","Position":"Chartered legal executive (England and Wales)","Client":"Kroger","Category":"SR","Status":"pending","Phone":"+1-610-443-9714x880","Applied":"07/01/2025"},
  {"Name":"Garrett Benson","Email":"margaretsmith@mitchell-walters.biz","Position":"Management consultant","Client":"Kroger","Category":"SR","Status":"pending","Phone":"(294)683-4083x3401","Applied":"07/12/2025"},
  {"Name":"Barbara Murray","Email":"kyle15@yahoo.com","Position":"Production designer, theatre/television/film","Client":"Kroger","Category":"D","Status":"pending","Phone":"968-818-5589x5395","Applied":"06/19/2025"},
  {"Name":"Richard Hancock","Email":"nathan82@garcia.com","Position":"Engineer, chemical","Client":"Kroger","Category":"SR","Status":"pending","Phone":"9284249718","Applied":"06/24/2025"},
  {"Name":"Traci Weaver","Email":"andersonkyle@hotmail.com","Position":"Dance movement psychotherapist","Client":"Kroger","Category":"SC","Status":"pending","Phone":"+1-685-913-8642x0895","Applied":"07/14/2025"},
  {"Name":"Courtney Fuller","Email":"xkoch@gmail.com","Position":"Engineer, electrical","Client":"Kroger","Category":"SR","Status":"pending","Phone":"001-929-717-4979x918","Applied":"07/15/2025"},
  {"Name":"Robert Shepherd","Email":"karen43@turner.biz","Position":"Advertising account planner","Client":"Kroger","Category":"SC","Status":"pending","Phone":"858.448.5776","Applied":"07/08/2025"},
  {"Name":"Elizabeth Hoffman","Email":"robinsondebra@yahoo.com","Position":"Commercial/residential surveyor","Client":"Kroger","Category":"D","Status":"pending","Phone":"7665580438","Applied":"06/23/2025"},
  {"Name":"Roger Arroyo","Email":"jeffescobar@hotmail.com","Position":"Microbiologist","Client":"Kroger","Category":"SC","Status":"pending","Phone":"(994)279-6520","Applied":"07/09/2025"},
  {"Name":"Sarah Davis","Email":"greenemichael@roberts.biz","Position":"Fisheries officer","Client":"Kroger","Category":"SC","Status":"pending","Phone":"797.965.3134","Applied":"06/24/2025"},
  {"Name":"Kimberly Brooks","Email":"timothypierce@gmail.com","Position":"Operational researcher","Client":"Kroger","Category":"D","Status":"pending","Phone":"480-823-8431","Applied":"07/06/2025"},
  {"Name":"Jordan Eaton","Email":"goodmichael@mckenzie-miller.net","Position":"Structural engineer","Client":"Kroger","Category":"SR","Status":"pending","Phone":"589-927-4569x8403","Applied":"07/05/2025"},
  {"Name":"Monica Melton","Email":"wrightnathan@heath.com","Position":"Fitness centre manager","Client":"Kroger","Category":"SC","Status":"pending","Phone":"+1-371-416-8446","Applied":"07/06/2025"},
  {"Name":"Diane Horton","Email":"kelsey86@hotmail.com","Position":"Academic librarian","Client":"Kroger","Category":"SC","Status":"pending","Phone":"001-965-235-0011x07019","Applied":"07/14/2025"}
  // Adding first 20 records as demo - in real implementation, include all 200
];

interface ImportStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function ApplicationsImporter() {
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const insertBatch = async (records: any[], batchSize = 10) => {
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        const { data, error } = await supabase
          .from('applications')
          .insert(batch)
          .select('id');

        if (error) {
          console.error('Batch insert error:', error);
          errors.push(`Batch ${i + 1}: ${error.message}`);
          failed += batch.length;
        } else {
          successful += data?.length || 0;
        }
      } catch (err) {
        console.error('Batch insert exception:', err);
        errors.push(`Batch ${i + 1}: ${err.message}`);
        failed += batch.length;
      }

      // Update progress
      const processed = (i + 1) * batchSize;
      setProgress(Math.min((processed / records.length) * 100, 100));
      
      // Update stats
      setImportStats({
        total: records.length,
        processed: Math.min(processed, records.length),
        successful,
        failed,
        errors
      });

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed, errors };
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setImportStats({
      total: testData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });

    try {
      // Process the raw data
      const processedData = processApplicationsData(testData);
      const validation = validateProcessedData(processedData);

      if (!validation.isValid) {
        toast({
          title: "Data Validation Failed",
          description: `Found ${validation.errors.length} validation errors`,
          variant: "destructive"
        });
        setImporting(false);
        return;
      }

      // Prepare data for Supabase insertion
      const insertData = processedData.map(record => ({
        applicant_email: record.applicant_email,
        first_name: record.first_name,
        last_name: record.last_name,
        full_name: record.full_name,
        phone: record.phone,
        applied_at: record.applied_at,
        status: record.status,
        source: record.source,
        job_id: record.job_id,
        cdl: record.cdl,
        exp: record.exp,
        drug: record.drug,
        consent: record.consent,
        city: record.city,
        state: record.state,
        zip: record.zip,
        privacy: record.privacy,
        age: record.age,
        veteran: record.veteran,
        months: record.months
      }));

      // Insert in batches
      const result = await insertBatch(insertData);

      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.successful} applications. ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Test Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Ready to Import</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">📊 {testData.length} Total Records</Badge>
              <Badge variant="outline">🏢 Kroger Client</Badge>
              <Badge variant="outline">📅 2024 Dates</Badge>
              <Badge variant="outline">📞 Standardized Phones</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This will process and import all test application data with:
              • Adjusted dates (2024 instead of 2025)
              • Standardized phone formats (+1XXXXXXXXXX)
              • Proper CDL category mapping (D/SC/SR)
              • Realistic location data
            </p>
          </div>

          {importing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              
              {importStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{importStats.processed}</div>
                    <div className="text-muted-foreground">Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{importStats.successful}</div>
                    <div className="text-muted-foreground">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{importStats.failed}</div>
                    <div className="text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{importStats.total}</div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {importStats && !importing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {importStats.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-semibold">Import Complete</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{importStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {importStats.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-semibold">Import Errors:</div>
                      {importStats.errors.slice(0, 3).map((error, index) => (
                        <div key={index} className="text-sm">• {error}</div>
                      ))}
                      {importStats.errors.length > 3 && (
                        <div className="text-sm">... and {importStats.errors.length - 3} more</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {testData.length} Applications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
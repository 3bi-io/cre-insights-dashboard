import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { processApplicationsData, validateProcessedData } from '@/utils/processApplicationsData';
import { Download, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Sample of the test data you provided
const sampleTestData = [
  {"Name":"Michael Peterson","Email":"rodriguezmolly@yahoo.com","Position":"Product/process development scientist","Client":"Kroger","Category":"SR","Status":"pending","Phone":"001-229-061-9331","Applied":"06/27/2025"},
  {"Name":"Jennifer Berger","Email":"marvincollins@yahoo.com","Position":"Corporate investment banker","Client":"Kroger","Category":"SC","Status":"pending","Phone":"846-006-2563x213","Applied":"06/30/2025"},
  {"Name":"Thomas Smith","Email":"paullee@gmail.com","Position":"Psychologist, prison and probation services","Client":"Kroger","Category":"SC","Status":"pending","Phone":"+1-384-242-5093x02614","Applied":"06/24/2025"},
  {"Name":"Kristin Walsh","Email":"elizabeth92@richardson.com","Position":"Art therapist","Client":"Kroger","Category":"SR","Status":"pending","Phone":"156.142.8722","Applied":"07/03/2025"},
  {"Name":"Ashley Herman","Email":"enelson@richardson.com","Position":"Education administrator","Client":"Kroger","Category":"SC","Status":"pending","Phone":"757-379-4692x31580","Applied":"07/07/2025"}
];

export default function DataProcessingDemo() {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleProcessData = () => {
    try {
      const processed = processApplicationsData(sampleTestData);
      const validationResult = validateProcessedData(processed);
      
      setProcessedData(processed);
      setValidation(validationResult);
      setIsProcessed(true);
    } catch (error) {
      console.error('Error processing data:', error);
    }
  };

  const downloadProcessedData = () => {
    const dataStr = JSON.stringify(processedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'processed-applications.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Data Processing Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Sample Test Data (5 records)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This demo shows how your 200 test records will be processed to match the current system.
              </p>
              <Button onClick={handleProcessData} disabled={isProcessed}>
                Process Sample Data
              </Button>
            </div>

            {validation && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {validation.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-semibold">
                    {validation.isValid ? 'Data Valid' : 'Issues Found'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{validation.summary.totalRecords}</div>
                    <div className="text-sm text-muted-foreground">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validation.summary.categoryCounts.D}
                    </div>
                    <div className="text-sm text-muted-foreground">Experienced Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {validation.summary.categoryCounts.SC}
                    </div>
                    <div className="text-sm text-muted-foreground">New CDL Holders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validation.summary.categoryCounts.SR}
                    </div>
                    <div className="text-sm text-muted-foreground">Student Ready</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Processing Results</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      📅 Dates: {validation.summary.dateRange.earliest} to {validation.summary.dateRange.latest}
                    </Badge>
                    <Badge variant="outline">
                      📞 Phone Issues: {validation.summary.phoneFormatIssues}
                    </Badge>
                  </div>
                </div>

                {validation.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                    <ul className="text-sm space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="text-red-600">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={downloadProcessedData} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Processed Data
                </Button>
              </div>
            )}

            {processedData.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Sample Processed Record</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(processedData[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
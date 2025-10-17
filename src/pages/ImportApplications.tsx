import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { useImportApplicationsAccess } from '@/hooks/useImportApplicationsAccess';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

const ImportApplications = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRole, organization } = useAuth();
  const { hasImportApplicationsAccess } = useImportApplicationsAccess();

  // Check if user has access to Import Applications feature
  if (!hasImportApplicationsAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature. Import Applications must be enabled for your organization by a super administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = `job_listing_id,first_name,middle_name,last_name,applicant_email,phone,secondary_phone,city,state,zip,address_1,address_2,country,date_of_birth,ssn,cdl,cdl_class,cdl_state,cdl_expiration_date,cdl_endorsements,exp,driving_experience_years,education_level,work_authorization,military_service,military_branch,military_start_date,military_end_date,veteran,hazmat_endorsement,passport_card,twic_card,medical_card_expiration,dot_physical_date,age,status,source,notes,salary_expectations,preferred_start_date,willing_to_relocate,can_work_nights,can_work_weekends,convicted_felony,felony_details,accident_history,violation_history,can_pass_drug_test,can_pass_physical,over_21,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,preferred_contact_method,consent,background_check_consent,consent_to_email,consent_to_sms,agree_privacy_policy,how_did_you_hear,referral_source
example-job-id,John,M,Doe,john@example.com,555-0100,555-0200,Phoenix,AZ,85001,123 Main St,Apt 4,US,1990-01-15,123-45-6789,Yes,A,AZ,2025-12-31,H;N,5+ years,5,High School,Yes,Army,US Army,2010-01-01,2014-12-31,Yes,Yes,Yes,Yes,2025-06-30,2024-01-15,34,pending,CSV Import,"Excellent candidate",60000,2024-02-01,Yes,Yes,Yes,No,,No crashes,No violations,Yes,Yes,Yes,Jane Doe,555-0300,Spouse,Phone,Yes,Yes,Yes,Yes,Yes,Job Board,Friend
example-job-id,Jane,,Smith,jane@example.com,555-0101,,Los Angeles,CA,90001,456 Oak Ave,,US,1992-05-20,,No,,,,,1-2 years,2,Bachelor,US Citizen,No,,,,No,No,No,No,,,28,pending,CSV Import,,45000,2024-03-01,No,Yes,No,No,,No,No,Yes,Yes,Yes,Bob Smith,555-0400,Sibling,Email,Yes,Yes,Yes,Yes,Yes,LinkedIn,Company Website`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'application_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "Use this template to format your CSV file",
    });
  };

  const handleImport = async () => {
    if (!file || !organization) {
      toast({
        title: "Missing information",
        description: "Please select a file and ensure you're part of an organization",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      // Read file content
      const text = await file.text();
      
      // Call edge function to process CSV
      const { data, error } = await supabase.functions.invoke('import-applications', {
        body: {
          csv: text,
          organizationId: organization.id,
        }
      });

      if (error) throw error;

      setImportResult(data);

      if (data.success && data.imported > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${data.imported} application(s)`,
        });
      } else if (data.failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `Imported ${data.imported} application(s), ${data.failed} failed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Import Applications</h1>
        <p className="text-muted-foreground">
          Bulk import candidate applications from a CSV file
        </p>
      </div>

      <div className="grid gap-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              How to Import Applications
            </CardTitle>
            <CardDescription>
              Follow these steps to successfully import your applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Download the template</h4>
              <p className="text-sm text-muted-foreground">
                Download our CSV template to ensure your data is formatted correctly.
              </p>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Required fields</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>job_listing_id</strong>: The UUID of the job listing</li>
                <li><strong>first_name</strong>: Candidate's first name</li>
                <li><strong>last_name</strong>: Candidate's last name</li>
                <li><strong>applicant_email</strong>: Valid email address</li>
                <li><strong>phone</strong>: Contact phone number</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Optional fields</h4>
              <p className="text-sm text-muted-foreground mb-2">
                You can include many additional fields. Key optional fields include:
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div>
                  <strong>Personal:</strong> middle_name, date_of_birth, ssn, age, country
                </div>
                <div>
                  <strong>Address:</strong> address_1, address_2, city, state, zip
                </div>
                <div>
                  <strong>Contact:</strong> secondary_phone, emergency_contact_*
                </div>
                <div>
                  <strong>CDL:</strong> cdl_class, cdl_state, cdl_expiration_date, cdl_endorsements
                </div>
                <div>
                  <strong>Experience:</strong> exp, driving_experience_years, accident_history
                </div>
                <div>
                  <strong>Military:</strong> military_service, military_branch, veteran
                </div>
                <div>
                  <strong>Documents:</strong> hazmat_endorsement, passport_card, twic_card
                </div>
                <div>
                  <strong>Medical:</strong> medical_card_expiration, dot_physical_date
                </div>
                <div>
                  <strong>Compliance:</strong> consent, background_check_consent, agree_privacy_policy
                </div>
                <div>
                  <strong>Other:</strong> education_level, work_authorization, salary_expectations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select your prepared CSV file to import applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || isUploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Importing...' : 'Import Applications'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/applications')}
              >
                Cancel
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing your CSV file...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Errors:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Row {error.row}: {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {importResult.imported > 0 && (
                <Button onClick={() => navigate('/applications')} className="w-full">
                  View Imported Applications
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportApplications;

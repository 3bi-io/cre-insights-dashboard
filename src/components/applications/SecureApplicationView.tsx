import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Eye, 
  AlertTriangle,
  Lock,
  FileText,
  Clock
} from 'lucide-react';
import { useSecureApplicationData } from '@/hooks/useSecureApplicationData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SecureApplicationViewProps {
  applicationId: string;
  onClose?: () => void;
}

const SecureApplicationView: React.FC<SecureApplicationViewProps> = ({
  applicationId,
  onClose
}) => {
  const [sensitiveAccessReason, setSensitiveAccessReason] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const {
    useBasicApplicationData,
    useApplicationSummary,
    useSensitiveApplicationData,
    accessSensitiveData,
    isAccessingSensitiveData,
    canAccessSensitiveData
  } = useSecureApplicationData();

  const { data: basicData, isLoading: basicLoading } = useBasicApplicationData(applicationId);
  const { data: summaryData, isLoading: summaryLoading } = useApplicationSummary(applicationId);
  const { data: sensitiveData, isLoading: sensitiveLoading } = useSensitiveApplicationData(
    showSensitiveData ? applicationId : '', 
    sensitiveAccessReason || 'Administrative review'
  );

  const handleAccessSensitiveData = () => {
    if (!sensitiveAccessReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for accessing sensitive data",
        variant: "destructive"
      });
      return;
    }
    setShowSensitiveData(true);
    accessSensitiveData({ 
      applicationId, 
      reason: sensitiveAccessReason 
    });
  };

  if (basicLoading || summaryLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {summaryData?.candidate_name || 'Application Details'}
            </CardTitle>
            <Badge variant={summaryData?.status === 'pending' ? 'secondary' : 'default'}>
              {summaryData?.status || basicData?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Applied: {new Date(summaryData?.applied_at || basicData?.applied_at || '').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{summaryData?.location || `${basicData?.city}, ${basicData?.state}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Experience: {summaryData?.experience_level || basicData?.exp}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Can start soon: {summaryData?.can_start_soon ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="sensitive" disabled={!canAccessSensitiveData}>
            <Lock className="w-4 h-4 mr-1" />
            Sensitive Data
          </TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{basicData?.applicant_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{basicData?.phone}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground">
                  {basicData?.notes || 'No notes available'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">CDL Status</Label>
                  <p className="text-sm">{basicData?.cdl || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Education Level</Label>
                  <p className="text-sm">{basicData?.education_level || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Work Authorization</Label>
                  <p className="text-sm">{basicData?.work_authorization || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <p className="text-sm">{basicData?.source || 'Direct application'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sensitive" className="space-y-4">
          {!canAccessSensitiveData ? (
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                You don't have permission to access sensitive personal information.
              </AlertDescription>
            </Alert>
          ) : !showSensitiveData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Access Sensitive Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Accessing sensitive personal information will be logged for audit purposes. 
                    Only access this data if necessary for legitimate business purposes.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for accessing sensitive data *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Background check verification, Legal compliance review"
                    value={sensitiveAccessReason}
                    onChange={(e) => setSensitiveAccessReason(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAccessSensitiveData}
                  disabled={!sensitiveAccessReason.trim() || isAccessingSensitiveData}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isAccessingSensitiveData ? 'Accessing...' : 'Access Sensitive Data'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Sensitive Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Confidential Data:</strong> This information is logged and monitored. 
                    Handle according to privacy policies and regulations.
                  </AlertDescription>
                </Alert>

                {sensitiveLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : sensitiveData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">SSN</Label>
                        <p className="text-sm font-mono">{sensitiveData.ssn || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <p className="text-sm">{sensitiveData.date_of_birth ? new Date(sensitiveData.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Government ID</Label>
                        <p className="text-sm">{sensitiveData.government_id_type} - {sensitiveData.government_id || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Medical Card Expiration</Label>
                        <p className="text-sm">{sensitiveData.medical_card_expiration ? new Date(sensitiveData.medical_card_expiration).toLocaleDateString() : 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Full Address</Label>
                      <p className="text-sm">{sensitiveData.full_address || 'Not provided'}</p>
                    </div>

                    {sensitiveData.felony_details && (
                      <div>
                        <Label className="text-sm font-medium">Background Information</Label>
                        <p className="text-sm">{sensitiveData.felony_details}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sensitive data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Position</Label>
                      <p className="text-sm">{summaryData.job_title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Candidate</Label>
                      <p className="text-sm">{summaryData.candidate_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm">{summaryData.location}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Experience</Label>
                      <p className="text-sm">{summaryData.experience_level}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Badge variant={summaryData.can_start_soon ? 'default' : 'secondary'}>
                      {summaryData.can_start_soon ? 'Available Soon' : 'Not Immediately Available'}
                    </Badge>
                    <Badge variant={summaryData.has_required_credentials ? 'default' : 'secondary'}>
                      {summaryData.has_required_credentials ? 'Has Credentials' : 'Credentials Needed'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Summary data not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default SecureApplicationView;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  Lock, 
  Eye, 
  AlertTriangle,
  Database,
  FileText,
  Users,
  Activity
} from 'lucide-react';

const SecurityDemoCard = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Security Vulnerability Fixed: PII Protection Implemented
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>RESOLVED:</strong> Critical security vulnerability in applications table has been fixed. 
            Sensitive personal information is now properly protected with multi-layer security controls.
          </AlertDescription>
        </Alert>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-red-700 dark:text-red-300">Before Fix (VULNERABLE)</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-red-500" />
                <span>Job owners could access ALL PII data</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-red-500" />
                <span>Recruiters had full access to sensitive fields</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-red-500" />
                <span>No audit logging for data access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-red-500" />
                <span>SSNs, DOB, addresses exposed</span>
              </div>
            </div>
            <Badge variant="destructive" className="w-fit">High Risk</Badge>
          </div>

          {/* After */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-green-700 dark:text-green-300">After Fix (SECURE)</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Restrictive role-based access controls</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-green-500" />
                <span>Sensitive data requires admin privileges</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-500" />
                <span>Mandatory audit logging with reason</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-green-500" />
                <span>Secure database functions control access</span>
              </div>
            </div>
            <Badge variant="default" className="w-fit bg-green-600">Secure</Badge>
          </div>
        </div>

        {/* Security Features Implemented */}
        <div className="space-y-4">
          <h3 className="font-semibold">Security Features Implemented:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Restrictive RLS Policies</h4>
                  <p className="text-xs text-muted-foreground">Updated Row Level Security with strict role-based access</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Data Segregation</h4>
                  <p className="text-xs text-muted-foreground">Basic data separated from sensitive PII fields</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Mandatory Audit Logging</h4>
                  <p className="text-xs text-muted-foreground">All sensitive data access logged with user and reason</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Secure Database Functions</h4>
                  <p className="text-xs text-muted-foreground">Controlled access through validated security functions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protected Data Types */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Now Protected Sensitive Data:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Badge variant="outline" className="justify-center">SSN</Badge>
            <Badge variant="outline" className="justify-center">Date of Birth</Badge>
            <Badge variant="outline" className="justify-center">Government ID</Badge>
            <Badge variant="outline" className="justify-center">Full Address</Badge>
            <Badge variant="outline" className="justify-center">Medical Info</Badge>
            <Badge variant="outline" className="justify-center">Employment History</Badge>
            <Badge variant="outline" className="justify-center">Criminal History</Badge>
            <Badge variant="outline" className="justify-center">Military Records</Badge>
          </div>
        </div>

        {/* Access Control Summary */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Access Control Matrix:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>🟢 <strong>Super Admins:</strong></span>
              <span>Full access to all data with logging</span>
            </div>
            <div className="flex justify-between">
              <span>🟡 <strong>Organization Admins:</strong></span>
              <span>Basic data + sensitive with approval & logging</span>
            </div>
            <div className="flex justify-between">
              <span>⚪ <strong>Recruiters:</strong></span>
              <span>Basic data only for assigned applications</span>
            </div>
            <div className="flex justify-between">
              <span>⚪ <strong>Job Owners:</strong></span>
              <span>Basic data only for their job applications</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityDemoCard;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';

export function TenstreetNavigationCard() {
  const navigate = useNavigate();
  const { credentials } = useTenstreetConfiguration();
  const isConfigured = !!credentials?.client_id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Tenstreet ATS Integration
              {isConfigured ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Setup Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Applicant tracking, background screening, and analytics
            </CardDescription>
          </div>
          <Button onClick={() => navigate('/admin/ats-command')}>
            Open Dashboard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="h-16 flex-col gap-1"
            onClick={() => navigate('/admin/ats-command')}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs">Overview</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-16 flex-col gap-1"
            onClick={() => navigate('/admin/ats-command?tab=xchange')}
            disabled={!isConfigured}
          >
            <Shield className="h-4 w-4" />
            <span className="text-xs">Screenings</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-16 flex-col gap-1"
            onClick={() => navigate('/admin/ats-command?tab=focus')}
            disabled={!isConfigured}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Analytics</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-16 flex-col gap-1"
            onClick={() => navigate('/admin/ats-command?tab=explorer')}
            disabled={!isConfigured}
          >
            <Activity className="h-4 w-4" />
            <span className="text-xs">API Explorer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

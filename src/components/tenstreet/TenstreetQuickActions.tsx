import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Upload, 
  Settings, 
  FileCheck,
  Shield,
  TrendingUp
} from 'lucide-react';

export function TenstreetQuickActions() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenstreet Quick Actions</CardTitle>
        <CardDescription>Fast access to common Tenstreet features</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet')}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs">Dashboard</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet/xchange')}
        >
          <Shield className="h-5 w-5" />
          <span className="text-xs">Screenings</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet/focus')}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs">Analytics</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet/bulk')}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Bulk Ops</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet-explorer')}
        >
          <Activity className="h-5 w-5" />
          <span className="text-xs">API Explorer</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => navigate('/admin/tenstreet-integration')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </CardContent>
    </Card>
  );
}

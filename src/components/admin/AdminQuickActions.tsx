import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  BarChart3, 
  FileText,
  Shield,
  Upload,
  Mail
} from 'lucide-react';
import { AdminEmailUtility } from '@/features/admin/components/AdminEmailUtility';

export function AdminQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Users,
      label: 'Applications',
      description: 'View and manage candidate applications',
      path: '/admin/applications',
      color: 'text-blue-600'
    },
    {
      icon: Briefcase,
      label: 'Job Listings',
      description: 'Create and manage job postings',
      path: '/admin/jobs',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      label: 'Tenstreet',
      description: 'ATS integration & screenings',
      path: '/admin/tenstreet',
      color: 'text-purple-600'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View performance metrics',
      path: '/admin/ai-analytics',
      color: 'text-orange-600'
    },
    {
      icon: FileText,
      label: 'Publishers',
      description: 'Manage job board integrations',
      path: '/admin/publishers',
      color: 'text-pink-600'
    },
    {
      icon: Upload,
      label: 'Bulk Import',
      description: 'Import applications in bulk',
      path: '/admin/import-applications',
      color: 'text-teal-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-accent"
                onClick={() => navigate(action.path)}
              >
                <Icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            );
          })}
          <AdminEmailUtility 
            trigger={
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-accent"
              >
                <Mail className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-medium">Send Email</span>
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

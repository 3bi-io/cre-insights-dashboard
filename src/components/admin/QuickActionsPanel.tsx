import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserPlus, Settings, Download, RefreshCw, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActionsPanel = () => {
  const quickActions = [
    {
      label: 'Create Organization',
      icon: Building,
      href: '/admin/organizations',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    },
    {
      label: 'Manage Users',
      icon: UserPlus,
      href: '/admin/users',
      color: 'bg-green-50 hover:bg-green-100 text-green-700',
    },
    {
      label: 'System Settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
    },
    {
      label: 'Security Audit',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-red-50 hover:bg-red-100 text-red-700',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button
                variant="outline"
                className={`w-full h-auto flex-col gap-2 p-4 ${action.color}`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

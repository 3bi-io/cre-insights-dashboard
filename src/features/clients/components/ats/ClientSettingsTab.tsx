import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2, Bell, ClipboardList, Users } from 'lucide-react';
import type { Client } from '../../types/client.types';

interface ClientSettingsTabProps {
  client: Client;
}

const ClientSettingsTab: React.FC<ClientSettingsTabProps> = ({ client }) => {
  const sections = [
    {
      icon: Settings2,
      title: 'ATS Integration',
      description: 'Configure ATS connections and field mappings for this client.',
      status: 'Configured',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Set up email and SMS notification preferences for new applications.',
      status: 'Enabled',
    },
    {
      icon: ClipboardList,
      title: 'Custom Fields',
      description: 'Manage custom application fields and form configuration.',
      status: 'Active',
    },
    {
      icon: Users,
      title: 'Team Assignments',
      description: 'Assign recruiters and team members to this client.',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage settings for {client.name}. Use the Edit button on the Overview tab for ATS and application field configuration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <Card key={section.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">{section.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientSettingsTab;

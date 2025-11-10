import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickAction } from '../../types';

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  description?: string;
}

export const QuickActions = React.memo<QuickActionsProps>(({ 
  actions, 
  title = "Quick Actions",
  description = "Common tasks and shortcuts"
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <Button 
            key={index} 
            variant="outline" 
            className="w-full justify-start" 
            asChild
          >
            <a href={action.href}>
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

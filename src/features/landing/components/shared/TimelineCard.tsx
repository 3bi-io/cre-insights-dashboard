/**
 * Reusable timeline/step card component
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Clock, CheckCircle } from 'lucide-react';

interface TimelineCardProps {
  icon: LucideIcon;
  title: string;
  time: string;
  tasks: string[];
}

export const TimelineCard = ({ 
  icon: Icon, 
  title, 
  time, 
  tasks 
}: TimelineCardProps) => {
  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <Clock className="h-3 w-3 inline mr-1" />
          {time}
        </p>
        <ul className="space-y-2">
          {tasks.map((task, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

/**
 * Kanban Pipeline Demo Tab
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Kanban, GripVertical } from 'lucide-react';

const kanbanColumns = [
  { id: 'new', label: 'New', color: 'bg-blue-500', count: 12, candidates: ['John Smith', 'Sarah Johnson', 'Mike Williams'] },
  { id: 'reviewed', label: 'Reviewed', color: 'bg-yellow-500', count: 8, candidates: ['Emily Davis', 'Robert Brown'] },
  { id: 'interview', label: 'Interview', color: 'bg-purple-500', count: 5, candidates: ['Lisa Anderson', 'James Wilson'] },
  { id: 'hired', label: 'Hired', color: 'bg-green-500', count: 3, candidates: ['David Martinez'] },
  { id: 'rejected', label: 'Rejected', color: 'bg-gray-500', count: 4, candidates: ['Mark Taylor'] },
];

export const KanbanDemoTab = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Visual Kanban Pipeline</h2>
        <p className="text-muted-foreground">Drag-and-drop candidates through your hiring stages</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {kanbanColumns.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-medium">{column.label}</CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs">{column.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {column.candidates.map((name, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-muted hover:border-primary/50 transition-colors cursor-grab">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">CDL Class A Driver</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {column.count > column.candidates.length && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{column.count - column.candidates.length} more
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <Kanban className="h-10 w-10 text-primary" />
            <div>
              <h3 className="text-lg font-bold mb-1">Intuitive Pipeline Management</h3>
              <p className="text-muted-foreground text-sm max-w-xl">
                Simply drag and drop candidates between columns to update their status. 
                Changes sync in real-time across your team, with complete activity tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

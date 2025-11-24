/**
 * Keyboard Shortcuts Hint Component
 * Shows available keyboard shortcuts to users
 */

import { Card, CardContent } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const KeyboardShortcutsHint = () => {
  const shortcuts = [
    { key: '/', description: 'Focus search' },
    { key: 'Esc', description: 'Clear filters' },
    { key: 'Ctrl+R', description: 'Refresh' },
    { key: 'Ctrl+E', description: 'Export CSV' },
    { key: 'Ctrl+A', description: 'Select all' },
  ];

  return (
    <Card className="border-border/40 bg-muted/5 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="w-3 h-3" />
          <span className="font-medium">Shortcuts:</span>
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                  {shortcut.key}
                </Badge>
                <span className="hidden sm:inline">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

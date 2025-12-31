import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MessageCircle, Upload, FileCheck, MoreVertical, Mail } from 'lucide-react';
import type { Application } from '@/types/common.types';

interface ApplicationActionsProps {
  application: Application;
  onSmsOpen: (app: Application) => void;
  onDetailsView: (app: Application) => void;
  onTenstreetUpdate: (app: Application) => void;
  onScreeningOpen: (app: Application) => void;
  isMobile?: boolean;
}

export const ApplicationActions: React.FC<ApplicationActionsProps> = ({
  application,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
  onScreeningOpen,
  isMobile = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const applicantEmail = application.applicant_email;

  // Close dropdown first, then execute action to prevent aria-hidden focus conflict
  const handleAction = (action: () => void) => {
    setDropdownOpen(false);
    requestAnimationFrame(() => {
      action();
    });
  };

  if (isMobile) {
    return (
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm border-border/50">
          <DropdownMenuItem onClick={() => handleAction(() => onDetailsView(application))}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(() => onSmsOpen(application))}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Send SMS
          </DropdownMenuItem>
          {applicantEmail && (
            <DropdownMenuItem asChild>
              <a href={`mailto:${applicantEmail}`}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleAction(() => onTenstreetUpdate(application))}>
            <Upload className="h-4 w-4 mr-2" />
            Post to Tenstreet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(() => onScreeningOpen(application))}>
            <FileCheck className="h-4 w-4 mr-2" />
            Screening Requests
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDetailsView(application)}
        className="hover:bg-primary/10 transition-colors"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSmsOpen(application)}
        className="hover:bg-primary/10 transition-colors"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        SMS
      </Button>
      {applicantEmail && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="hover:bg-primary/10 transition-colors"
        >
          <a href={`mailto:${applicantEmail}`}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </a>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTenstreetUpdate(application)}
        className="hover:bg-primary/10 transition-colors"
      >
        <Upload className="h-4 w-4 mr-2" />
        Tenstreet
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onScreeningOpen(application)}
        className="hover:bg-primary/10 transition-colors"
      >
        <FileCheck className="h-4 w-4 mr-2" />
        Screening
      </Button>
    </div>
  );
};

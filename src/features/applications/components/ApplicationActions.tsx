import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Eye, MessageCircle, Upload, FileCheck, MoreVertical, Mail } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  isMobile: isMobileProp = false,
}) => {
  const [open, setOpen] = useState(false);
  const isMobileDevice = useIsMobile();
  const showMobileLayout = isMobileProp || isMobileDevice;
  const applicantEmail = application.applicant_email;

  // Close menu first, then execute action
  const handleAction = (action: () => void) => {
    setOpen(false);
    requestAnimationFrame(() => {
      action();
    });
  };

  const actionItems = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: () => handleAction(() => onDetailsView(application)),
    },
    {
      icon: MessageCircle,
      label: 'Send SMS',
      onClick: () => handleAction(() => onSmsOpen(application)),
    },
    ...(applicantEmail ? [{
      icon: Mail,
      label: 'Send Email',
      href: `mailto:${applicantEmail}`,
    }] : []),
    {
      icon: Upload,
      label: 'Post to Tenstreet',
      onClick: () => handleAction(() => onTenstreetUpdate(application)),
    },
    {
      icon: FileCheck,
      label: 'Screening Requests',
      onClick: () => handleAction(() => onScreeningOpen(application)),
    },
  ];

  // Mobile: Use Drawer (bottom sheet) for better touch UX
  if (showMobileLayout) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="touch-target">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Actions</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4 pb-8">
            {actionItems.map((item, index) => {
              const Icon = item.icon;
              if ('href' in item && item.href) {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start min-h-[48px] text-base"
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </a>
                  </Button>
                );
              }
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start min-h-[48px] text-base"
                  onClick={item.onClick}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use dropdown menu
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

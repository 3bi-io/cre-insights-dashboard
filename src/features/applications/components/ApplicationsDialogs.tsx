import React from 'react';
import type { Application } from '@/types/common.types';
import {
  ApplicationDetailsDialog,
  TenstreetUpdateModal,
  SmsConversationDialog,
} from '../components';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';

interface ApplicationsDialogsProps {
  selectedApplication: Application | null;
  smsDialogOpen: boolean;
  detailsDialogOpen: boolean;
  screeningDialogOpen: boolean;
  tenstreetModalOpen: boolean;
  onCloseSms: () => void;
  onCloseDetails: () => void;
  onCloseScreening: () => void;
  onCloseTenstreet: () => void;
}

export const ApplicationsDialogs = ({
  selectedApplication,
  smsDialogOpen,
  detailsDialogOpen,
  screeningDialogOpen,
  tenstreetModalOpen,
  onCloseSms,
  onCloseDetails,
  onCloseScreening,
  onCloseTenstreet,
}: ApplicationsDialogsProps) => {
  if (!selectedApplication) {
    return null;
  }

  return (
    <>
      <SmsConversationDialog
        application={selectedApplication}
        open={smsDialogOpen}
        onOpenChange={onCloseSms}
      />
      
      <ApplicationDetailsDialog
        application={selectedApplication}
        isOpen={detailsDialogOpen}
        onClose={onCloseDetails}
      />
      
      <ScreeningRequestsDialog
        application={selectedApplication}
        open={screeningDialogOpen}
        onOpenChange={onCloseScreening}
      />
      
      <TenstreetUpdateModal
        application={selectedApplication}
        isOpen={tenstreetModalOpen}
        onClose={onCloseTenstreet}
      />
    </>
  );
};

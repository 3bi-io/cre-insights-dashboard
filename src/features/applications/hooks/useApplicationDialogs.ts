import { useState } from 'react';
import type { Application } from '@/types/common.types';

export interface ApplicationDialogState {
  selectedApplication: Application | null;
  smsDialogOpen: boolean;
  detailsDialogOpen: boolean;
  tenstreetModalOpen: boolean;
  screeningDialogOpen: boolean;
}

export const useApplicationDialogs = () => {
  const [state, setState] = useState<ApplicationDialogState>({
    selectedApplication: null,
    smsDialogOpen: false,
    detailsDialogOpen: false,
    tenstreetModalOpen: false,
    screeningDialogOpen: false,
  });

  const handleSmsOpen = (application: Application) => {
    setState(prev => ({
      ...prev,
      selectedApplication: application,
      smsDialogOpen: true,
    }));
  };

  const handleDetailsView = (application: Application) => {
    setState(prev => ({
      ...prev,
      selectedApplication: application,
      detailsDialogOpen: true,
    }));
  };

  const handleTenstreetUpdate = (application: Application) => {
    setState(prev => ({
      ...prev,
      selectedApplication: application,
      tenstreetModalOpen: true,
    }));
  };

  const handleScreeningOpen = (application: Application) => {
    setState(prev => ({
      ...prev,
      selectedApplication: application,
      screeningDialogOpen: true,
    }));
  };

  const closeSmsDialog = () => {
    setState(prev => ({ ...prev, smsDialogOpen: false }));
  };

  const closeDetailsDialog = () => {
    setState(prev => ({ ...prev, detailsDialogOpen: false }));
  };

  const closeTenstreetModal = () => {
    setState(prev => ({ ...prev, tenstreetModalOpen: false }));
  };

  const closeScreeningDialog = () => {
    setState(prev => ({ ...prev, screeningDialogOpen: false }));
  };

  return {
    ...state,
    handleSmsOpen,
    handleDetailsView,
    handleTenstreetUpdate,
    handleScreeningOpen,
    closeSmsDialog,
    closeDetailsDialog,
    closeTenstreetModal,
    closeScreeningDialog,
  };
};

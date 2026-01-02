import React from 'react';
import { Loader2 } from 'lucide-react';
import { ResponsiveAlertDialog } from '@/components/ui/responsive-alert-dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false
}) => {
  return (
    <ResponsiveAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={confirmLabel}
      cancelText={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant={variant}
      isLoading={isLoading}
    />
  );
};

export default ConfirmationDialog;

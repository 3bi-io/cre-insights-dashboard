import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, Building2, Key, UserCog } from 'lucide-react';

interface UserActionsDropdownProps {
  user: {
    id: string;
    email: string;
    role: string;
    organization_id?: string | null;
    organization_name?: string;
  };
  onEditRole: () => void;
  onChangeOrganization: () => void;
  onResetPassword: () => void;
  disabled?: boolean;
}

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onEditRole,
  onChangeOrganization,
  onResetPassword,
  disabled = false,
}) => {
  const isSuperAdmin = user.role === 'super_admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          User Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onEditRole}
          disabled={isSuperAdmin}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          {isSuperAdmin ? 'Cannot edit Super Admin' : 'Change Role'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onChangeOrganization}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Change Organization
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onResetPassword}
          className="flex items-center gap-2"
        >
          <Key className="h-4 w-4" />
          Reset Password
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

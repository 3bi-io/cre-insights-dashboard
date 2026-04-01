import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';

export interface ColumnVisibility {
  applicant: boolean;
  formType: boolean;
  job: boolean;
  contact: boolean;
  location: boolean;
  date: boolean;
  source: boolean;
  status: boolean;
  recruiter: boolean;
  actions: boolean;
}

interface TableColumnVisibilityProps {
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (column: keyof ColumnVisibility) => void;
}

export const TableColumnVisibility = ({
  columnVisibility,
  onColumnVisibilityChange,
}: TableColumnVisibilityProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={columnVisibility.applicant}
          onCheckedChange={() => onColumnVisibilityChange('applicant')}
        >
          Applicant
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.formType}
          onCheckedChange={() => onColumnVisibilityChange('formType')}
        >
          Form Type
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.job}
          onCheckedChange={() => onColumnVisibilityChange('job')}
        >
          Job
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.contact}
          onCheckedChange={() => onColumnVisibilityChange('contact')}
        >
          Contact
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.location}
          onCheckedChange={() => onColumnVisibilityChange('location')}
        >
          Location
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.date}
          onCheckedChange={() => onColumnVisibilityChange('date')}
        >
          Date
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.status}
          onCheckedChange={() => onColumnVisibilityChange('status')}
        >
          Status
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.recruiter}
          onCheckedChange={() => onColumnVisibilityChange('recruiter')}
        >
          Recruiter
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={columnVisibility.actions}
          onCheckedChange={() => onColumnVisibilityChange('actions')}
          disabled
        >
          Actions
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

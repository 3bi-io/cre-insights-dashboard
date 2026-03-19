import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useClientApplicationFields } from '../hooks/useClientApplicationFields';

interface FieldDef {
  key: string;
  label: string;
}

interface FieldGroup {
  name: string;
  fields: FieldDef[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    name: 'Personal',
    fields: [
      { key: 'prefix', label: 'Title/Prefix' },
      { key: 'middleName', label: 'Middle Name' },
      { key: 'suffix', label: 'Suffix' },
      { key: 'ssn', label: 'SSN (Last 4)' },
      { key: 'governmentId', label: 'Government ID' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
    ],
  },
  {
    name: 'Contact',
    fields: [
      { key: 'secondaryPhone', label: 'Secondary Phone' },
      { key: 'preferredContactMethod', label: 'Preferred Contact Method' },
      { key: 'emergencyContact', label: 'Emergency Contact' },
    ],
  },
  {
    name: 'CDL & Driving',
    fields: [
      { key: 'cdlEndorsements', label: 'CDL Endorsements' },
      { key: 'cdlExpirationDate', label: 'CDL Expiration Date' },
      { key: 'cdlState', label: 'CDL State' },
      { key: 'drivingExperienceYears', label: 'Driving Experience Years' },
      { key: 'accidentHistory', label: 'Accident History' },
      { key: 'violationHistory', label: 'Violation History' },
    ],
  },
  {
    name: 'Experience',
    fields: [
      { key: 'employers', label: 'Employment History' },
      { key: 'educationLevel', label: 'Education Level' },
      { key: 'workAuthorization', label: 'Work Authorization' },
    ],
  },
  {
    name: 'Background',
    fields: [
      { key: 'militaryService', label: 'Military Service' },
      { key: 'convictedFelony', label: 'Felony History' },
      { key: 'passportCard', label: 'Passport Card' },
    ],
  },
  {
    name: 'Work Preferences',
    fields: [
      { key: 'canWorkWeekends', label: 'Can Work Weekends' },
      { key: 'canWorkNights', label: 'Can Work Nights' },
      { key: 'willingToRelocate', label: 'Willing to Relocate' },
      { key: 'salaryExpectations', label: 'Salary Expectations' },
      { key: 'preferredStartDate', label: 'Preferred Start Date' },
    ],
  },
  {
    name: 'Medical & Certifications',
    fields: [
      { key: 'medicalCardExpiration', label: 'Medical Card Expiration' },
      { key: 'hazmatEndorsement', label: 'HAZMAT Endorsement' },
      { key: 'twicCard', label: 'TWIC Card' },
      { key: 'dotPhysicalDate', label: 'DOT Physical Date' },
    ],
  },
];

interface Props {
  clientId: string;
  organizationId: string;
}

const ClientApplicationFieldsConfig: React.FC<Props> = ({ clientId, organizationId }) => {
  const { isLoading, upsertField, getFieldState } = useClientApplicationFields(clientId, organizationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Application Field Configuration</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Control which fields appear on the detailed application form for this client. 
          Fields not listed here (name, email, phone, CDL status) are always required.
        </p>
      </div>

      {FIELD_GROUPS.map((group) => (
        <div key={group.name} className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.name}
          </h4>
          <div className="space-y-2">
            {group.fields.map((field) => {
              const state = getFieldState(field.key);
              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-background"
                >
                  <Label className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Visible</span>
                      <Switch
                        checked={state.enabled}
                        onCheckedChange={(checked) =>
                          upsertField.mutate({
                            fieldKey: field.key,
                            enabled: checked,
                            required: checked ? state.required : false,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Required</span>
                      <Switch
                        checked={state.required}
                        disabled={!state.enabled}
                        onCheckedChange={(checked) =>
                          upsertField.mutate({
                            fieldKey: field.key,
                            enabled: state.enabled,
                            required: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientApplicationFieldsConfig;

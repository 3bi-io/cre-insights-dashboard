import React from 'react';
import { Label } from "@/components/ui/label";
import { Code, ShieldCheck, Clock, Award, Globe } from 'lucide-react';
import { SelectionButtonGroup } from './SelectionButton';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ScreeningQuestion } from '@/hooks/useScreeningQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TechInfoSectionProps {
  formData: {
    cdl: string;          // repurposed: security clearance level
    cdlClass: string;     // repurposed: primary certification
    cdlEndorsements: string[]; // repurposed: additional certifications
    experience: string;   // years of experience (months value)
  };
  onInputChange: (name: string, value: string | string[]) => void;
  isActive?: boolean;
  screeningQuestions?: ScreeningQuestion[];
  screeningAnswers?: Record<string, string>;
  onScreeningAnswerChange?: (questionId: string, value: string) => void;
}

const CLEARANCE_OPTIONS = [
  { value: 'None', label: 'No clearance', description: 'No active clearance' },
  { value: 'Public Trust', label: 'Public Trust', description: 'Basic suitability', icon: <ShieldCheck className="h-5 w-5" /> },
  { value: 'Secret', label: 'Secret', description: 'Active Secret clearance', icon: <ShieldCheck className="h-5 w-5" /> },
  { value: 'Top Secret', label: 'Top Secret / SCI', description: 'TS/SCI clearance', icon: <Award className="h-5 w-5" /> },
];

const CERTIFICATION_OPTIONS = [
  { id: 'CISSP', label: 'CISSP', description: 'Certified Information Systems Security Professional' },
  { id: 'CISM', label: 'CISM', description: 'Certified Information Security Manager' },
  { id: 'CEH', label: 'CEH', description: 'Certified Ethical Hacker' },
  { id: 'CompTIA Security+', label: 'CompTIA Security+', description: 'Foundational security certification' },
  { id: 'AWS', label: 'AWS Certified', description: 'AWS Solutions Architect or Security Specialty' },
  { id: 'Azure', label: 'Azure Certified', description: 'Microsoft Azure security or cloud certifications' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Entry level', description: '0–1 years' },
  { value: '12', label: '1–2 years', description: 'Junior professional' },
  { value: '36', label: '3–5 years', description: 'Mid-level professional' },
  { value: '72', label: '6–9 years', description: 'Senior professional' },
  { value: '120', label: '10+ years', description: 'Expert / Leadership' },
];

const REMOTE_OPTIONS = [
  { value: 'remote', label: 'Fully remote', description: 'Work from anywhere', icon: <Globe className="h-5 w-5" /> },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of remote & on-site' },
  { value: 'onsite', label: 'On-site', description: 'In-office preferred' },
  { value: 'flexible', label: 'Flexible', description: 'Open to any arrangement' },
];

export const TechInfoSection = React.memo(({ formData, onInputChange, isActive, screeningQuestions, screeningAnswers, onScreeningAnswerChange }: TechInfoSectionProps) => {
  const handleCertChange = (certId: string, checked: boolean) => {
    const current = formData.cdlEndorsements || [];
    if (checked) {
      onInputChange('cdlEndorsements', [...current, certId]);
    } else {
      onInputChange('cdlEndorsements', current.filter(e => e !== certId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <Code className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Skills & Qualifications
        </h2>
        <p className="text-muted-foreground mt-1">
          Help us understand your technical background and clearance level
        </p>
      </div>

      {/* Security Clearance */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Security clearance level <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          name="clearance-level"
          label="Security Clearance"
          options={CLEARANCE_OPTIONS}
          value={formData.cdl}
          onChange={(value) => onInputChange('cdl', value)}
          columns={2}
        />
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Certifications <span className="text-muted-foreground font-normal">(select all that apply)</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CERTIFICATION_OPTIONS.map((cert) => (
            <label
              key={cert.id}
              className="flex items-start gap-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <Checkbox
                id={`cert-${cert.id}`}
                checked={(formData.cdlEndorsements || []).includes(cert.id)}
                onCheckedChange={(checked) => handleCertChange(cert.id, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{cert.label}</span>
                <p className="text-xs text-muted-foreground">{cert.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Years of professional experience <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          name="experience-level"
          label="Experience Level"
          options={EXPERIENCE_OPTIONS}
          value={formData.experience}
          onChange={(value) => onInputChange('experience', value)}
          columns={2}
        />
      </div>

      {/* Inline Screening Questions */}
      {screeningQuestions && screeningQuestions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-border">
          {screeningQuestions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={`screening-${q.id}`} className="text-sm font-medium">
                {q.question}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Select
                value={screeningAnswers?.[q.id] || ''}
                onValueChange={(value) => onScreeningAnswerChange?.(q.id, value)}
              >
                <SelectTrigger id={`screening-${q.id}`} className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TechInfoSection.displayName = 'TechInfoSection';

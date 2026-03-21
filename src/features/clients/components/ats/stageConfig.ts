export const STAGES = [
  { id: 'pending', label: 'New', color: 'bg-slate-500', textColor: 'text-slate-500', borderColor: 'border-slate-500/30' },
  { id: 'reviewed', label: 'Reviewing', color: 'bg-blue-500', textColor: 'text-blue-500', borderColor: 'border-blue-500/30' },
  { id: 'contacted', label: 'Phone Screen', color: 'bg-violet-500', textColor: 'text-violet-500', borderColor: 'border-violet-500/30' },
  { id: 'interviewed', label: 'Interview', color: 'bg-amber-500', textColor: 'text-amber-500', borderColor: 'border-amber-500/30' },
  { id: 'offered', label: 'Offer', color: 'bg-emerald-500', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/30' },
  { id: 'hired', label: 'Hired', color: 'bg-green-500', textColor: 'text-green-500', borderColor: 'border-green-500/30' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500/30' },
] as const;

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  ziprecruiter: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  indeed: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  direct: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  linkedin: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  facebook: { bg: 'bg-blue-600/10', text: 'text-blue-600' },
};

export function getSourceStyle(source: string | null) {
  if (!source) return { bg: 'bg-muted', text: 'text-muted-foreground' };
  return SOURCE_COLORS[source.toLowerCase()] || { bg: 'bg-muted', text: 'text-muted-foreground' };
}

export function getStageConfig(stageId: string) {
  return STAGES.find(s => s.id === stageId) || STAGES[0];
}

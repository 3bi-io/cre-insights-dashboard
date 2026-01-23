import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  Edit2, 
  Trash2, 
  Copy,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResponseTemplatesProps {
  organizationId?: string;
  onSelectTemplate?: (content: string) => void;
  compact?: boolean;
}

interface ResponseTemplate {
  id: string;
  organization_id: string;
  name: string;
  template_content: string;
  intent_type: string;
  platform: string | null;
  variables: string[];
  is_active: boolean;
  priority: number;
  usage_count: number;
  created_at: string;
}

const INTENT_TYPES = [
  { value: 'greeting', label: 'Greeting' },
  { value: 'job_inquiry', label: 'Job Inquiry' },
  { value: 'application_status', label: 'Application Status' },
  { value: 'benefits_question', label: 'Benefits' },
  { value: 'salary_question', label: 'Salary' },
  { value: 'closing', label: 'Closing' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'general', label: 'General' },
];

export function ResponseTemplates({ organizationId, onSelectTemplate, compact = false }: ResponseTemplatesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template_content: '',
    intent_type: 'general',
    platform: 'all',
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['response-templates', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_response_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data.map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : [],
      })) as ResponseTemplate[];
    },
    enabled: !!organizationId,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; template_content: string; intent_type: string; platform: string }) => {
      const { error } = await supabase
        .from('social_response_templates')
        .insert({
          organization_id: organizationId,
          name: data.name,
          template_content: data.template_content,
          intent_type: data.intent_type,
          platform: data.platform === 'all' ? null : data.platform,
          variables: extractVariables(data.template_content),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['response-templates'] });
      toast({ title: 'Template created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (data: { id: string; name: string; template_content: string; intent_type: string; platform: string }) => {
      const { error } = await supabase
        .from('social_response_templates')
        .update({
          name: data.name,
          template_content: data.template_content,
          intent_type: data.intent_type,
          platform: data.platform === 'all' ? null : data.platform,
          variables: extractVariables(data.template_content),
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['response-templates'] });
      toast({ title: 'Template updated successfully' });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_response_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['response-templates'] });
      toast({ title: 'Template deleted' });
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      const template = templates?.find(t => t.id === id);
      if (!template) return;

      await supabase
        .from('social_response_templates')
        .update({ 
          usage_count: template.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
    },
  });

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(m => m.replace(/\{\{|\}\}/g, '')) : [];
  };

  const resetForm = () => {
    setFormData({ name: '', template_content: '', intent_type: 'general', platform: 'all' });
  };

  const handleEdit = (template: ResponseTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_content: template.template_content,
      intent_type: template.intent_type,
      platform: template.platform || 'all',
    });
    setIsDialogOpen(true);
  };

  const handleCopy = async (template: ResponseTemplate) => {
    await navigator.clipboard.writeText(template.template_content);
    setCopiedId(template.id);
    incrementUsage.mutate(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    
    if (onSelectTemplate) {
      onSelectTemplate(template.template_content);
    }
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplate.mutate({ ...formData, id: editingTemplate.id });
    } else {
      createTemplate.mutate(formData);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quick Templates</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
                <DialogDescription>Create reusable response templates</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Template name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Select
                  value={formData.intent_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, intent_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Intent Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_TYPES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Template content... Use {{variable}} for placeholders"
                  value={formData.template_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                  rows={5}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-[150px]">
          <div className="space-y-1">
            {templates?.slice(0, 5).map(template => (
              <Button
                key={template.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => handleCopy(template)}
              >
                <FileText className="h-3.5 w-3.5 mr-2 shrink-0" />
                <span className="truncate">{template.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Response Templates</CardTitle>
            <CardDescription>Reusable templates for quick responses</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTemplate(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogDescription>
                  Create reusable templates for common responses. Use {"{{variable}}"} syntax for dynamic content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g., Job Application Thanks"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intent Type</label>
                    <Select
                      value={formData.intent_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, intent_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTENT_TYPES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Hi {{name}}, thank you for your interest in the {{position}} role..."
                    value={formData.template_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use {"{{name}}"}, {"{{position}}"}, {"{{company}}"} for dynamic content
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.template_content}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
        ) : templates?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No templates yet</p>
            <p className="text-sm">Create your first template to speed up responses</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {templates?.map(template => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{template.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {template.template_content}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {INTENT_TYPES.find(c => c.value === template.intent_type)?.label || template.intent_type}
                        </Badge>
                        {template.platform && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.platform}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Used {template.usage_count} times
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(template)}
                      >
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

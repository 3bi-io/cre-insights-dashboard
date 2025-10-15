import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, ExternalLink, Info } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { LLMModelSelect } from '@/features/elevenlabs';

interface VoiceAgentDialogProps {
  agent?: any;
  trigger?: React.ReactNode;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const VoiceAgentDialog: React.FC<VoiceAgentDialogProps> = ({
  agent,
  trigger,
  onSubmit,
  isLoading = false
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: '',
    agent_name: '',
    elevenlabs_agent_id: '',
    voice_id: '9BWtsMINqrJLrRacOk9x', // Default to Aria
    description: '',
    llm_model: 'gpt-4o-mini',
    is_active: true
  });

  const { organizations } = useOrganizations();

  useEffect(() => {
    if (agent) {
      setFormData({
        organization_id: agent.organization_id || '',
        agent_name: agent.agent_name || '',
        elevenlabs_agent_id: agent.elevenlabs_agent_id || '',
        voice_id: agent.voice_id || '9BWtsMINqrJLrRacOk9x',
        description: agent.description || '',
        llm_model: agent.llm_model || 'gpt-4o-mini',
        is_active: agent.is_active ?? true
      });
    } else {
      setFormData({
        organization_id: '',
        agent_name: '',
        elevenlabs_agent_id: '',
        voice_id: '9BWtsMINqrJLrRacOk9x',
        description: '',
        llm_model: 'gpt-4o-mini',
        is_active: true
      });
    }
  }, [agent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agent) {
      onSubmit({ id: agent.id, ...formData });
    } else {
      onSubmit(formData);
    }
    setOpen(false);
  };

  const defaultTrigger = agent ? (
    <Button variant="outline" size="sm">
      <Edit className="w-4 h-4" />
    </Button>
  ) : (
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      Add Voice Agent
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {agent ? 'Edit Voice Agent' : 'Add Voice Agent'}
          </DialogTitle>
          <DialogDescription>
            {agent ? 'Update voice agent configuration' : 'Configure a new voice agent for an organization'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">Each organization needs its own unique ElevenLabs agent ID</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => window.open('https://elevenlabs.io/app/conversational-ai', '_blank')}
              >
                Open ElevenLabs Dashboard
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select
              value={formData.organization_id}
              onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_name">Agent Name</Label>
            <Input
              id="agent_name"
              placeholder="e.g., HR Assistant"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevenlabs_agent_id">ElevenLabs Agent ID *</Label>
            <Input
              id="elevenlabs_agent_id"
              placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.elevenlabs_agent_id}
              onChange={(e) => setFormData({ ...formData, elevenlabs_agent_id: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Copy from your ElevenLabs dashboard: Settings → Agent ID (starts with "agent_")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice_id">Agent Voice</Label>
            <Select
              value={formData.voice_id}
              onValueChange={(value) => setFormData({ ...formData, voice_id: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="9BWtsMINqrJLrRacOk9x">Aria - Warm, friendly female</SelectItem>
                <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">Roger - Professional male</SelectItem>
                <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah - Clear, articulate female</SelectItem>
                <SelectItem value="FGY2WhTYpPnrIDTdsKH5">Laura - Energetic female</SelectItem>
                <SelectItem value="IKne3meq5aSn9XLyUdCD">Charlie - Confident male</SelectItem>
                <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George - Authoritative male</SelectItem>
                <SelectItem value="N2lVS1w4EtoT3dr4eOWO">Callum - Smooth male</SelectItem>
                <SelectItem value="SAz9YHcvj6GT2YYXdXww">River - Calm, soothing neutral</SelectItem>
                <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam - Casual male</SelectItem>
                <SelectItem value="XB0fDUnXU5powFXDhCwa">Charlotte - Elegant female</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a voice that best fits your agent's personality
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the agent's purpose..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <LLMModelSelect
            value={formData.llm_model}
            onValueChange={(value) => setFormData({ ...formData, llm_model: value })}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : (agent ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAgentDialog;
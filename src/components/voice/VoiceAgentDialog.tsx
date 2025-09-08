import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';

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
    agent_id: '',
    description: '',
    is_active: true
  });

  const { organizations } = useOrganizations();

  useEffect(() => {
    if (agent) {
      setFormData({
        organization_id: agent.organization_id || '',
        agent_name: agent.agent_name || '',
        agent_id: agent.agent_id || '',
        description: agent.description || '',
        is_active: agent.is_active ?? true
      });
    } else {
      setFormData({
        organization_id: '',
        agent_name: '',
        agent_id: '',
        description: '',
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
            <Label htmlFor="agent_id">ElevenLabs Agent ID</Label>
            <Input
              id="agent_id"
              placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Find this in your ElevenLabs dashboard under Conversational AI
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